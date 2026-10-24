// ============================================================
//  FinalBoss.ts — the 10:00 boss. Spawning it clears the field and
//  stops further enemies. Killing it ends the run.
//
//  Every attack shows its hit shape first. The shape fills from the boss
//  and is full when the windup ends. Outside that shape, the hit misses.
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { EnemyState, PlayerState } from "@/game/core/types";
import { isLowQuality } from "@/game/render/quality";
import { drawShadow, drawStrip, getPixelImage, stripFrameCount } from "@/game/render/pixel";

const IDLE_SHEET = "boss/spirit-idle";
const DRAW_SCALE = 1.9;

type Pattern = "dash" | "slam" | "shock" | "bomb" | "wave";
type Phase = "windup" | "dash" | "recover";

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  left: number;
  hit: boolean;
}

interface Bomb {
  x: number;
  y: number;
}

interface Impact {
  kind: "slam" | "shock" | "bomb";
  t: number;
  x: number;
  y: number;
  aim: number;
  bombs: Bomb[];
}

interface BossRuntime {
  id: number;
  phase: Phase;
  pattern: Pattern;
  timer: number;
  windupTotal: number;
  originX: number;
  originY: number;
  endX: number;
  endY: number;
  aim: number;
  dashHit: boolean;
  bombs: Bomb[];
  shots: Shot[];
  waveLeft: number;
  facingRight: boolean;
  anim: number;
  damage: number;
  lastPattern: Pattern | null;
  /** Solid flash of the hit shape after slam, shock, or bombs resolve. */
  impact: Impact | null;
}

let boss: BossRuntime | null = null;
let spawned = 0;
let pending = 0;

export function resetFinalBoss(): void {
  boss = null;
  spawned = 0;
  pending = 0;
}

export function getFinalBossSpawned(): number {
  return spawned;
}

export function isFinalBoss(e: EnemyState): boolean {
  return e.enemyType === "finalboss";
}

export function consumeFinalBossDamage(): number {
  const out = pending;
  pending = 0;
  return out;
}

export function createFinalBossState(
  id: number,
  x: number,
  y: number,
  hp: number,
  damage: number,
  playerX: number,
  playerY: number,
): EnemyState {
  const c = CONFIG.finalBoss;
  spawned++;
  boss = {
    id,
    phase: "windup",
    pattern: "dash",
    timer: c.dashWindup,
    windupTotal: c.dashWindup,
    originX: x,
    originY: y,
    endX: x,
    endY: y,
    aim: 0,
    dashHit: false,
    bombs: [],
    shots: [],
    waveLeft: 0,
    facingRight: true,
    anim: 0,
    damage,
    lastPattern: null,
    impact: null,
  };
  const body: EnemyState = {
    id,
    x,
    y,
    radius: c.radius,
    hp,
    maxHp: hp,
    alive: true,
    speed: 0,
    baseSpeed: 0,
    damage,
    contactTimer: 0,
    shotTimer: 0,
    ranged: false,
    enemyType: "finalboss",
    color: c.color,
    borderColor: c.borderColor,
    shape: "circle",
    spriteFrame: 0,
    spriteTimer: 0,
    facingRight: true,
    dying: false,
    dyingTimer: 0,
    isElite: false,
    gemDropped: false,
    facing: 0,
  };
  lockDash(body, playerX, playerY);
  return body;
}

export function updateFinalBoss(e: EnemyState, player: PlayerState, dt: number): void {
  if (!boss || boss.id !== e.id || !e.alive) return;
  if (e.contactTimer > 0) e.contactTimer -= dt;
  boss.anim += dt;
  moveShots(player, dt);
  if (boss.impact) {
    boss.impact.t += dt;
    if (boss.impact.t >= CONFIG.finalBoss.impactTime) boss.impact = null;
  }

  if (boss.phase === "windup") {
    e.x = boss.originX;
    e.y = boss.originY;
    boss.timer -= dt;
    if (boss.timer <= 0) finishWindup(e, player);
    else if (boss.pattern !== "dash") pokeContact(e, player);
    return;
  }

  if (boss.phase === "dash") {
    const prevX = e.x;
    const prevY = e.y;
    const len = Math.hypot(boss.endX - boss.originX, boss.endY - boss.originY);
    const dur = len > 1 ? len / CONFIG.finalBoss.dashSpeed : 0.01;
    boss.timer += dt;
    const u = Math.min(1, boss.timer / dur);
    e.x = boss.originX + (boss.endX - boss.originX) * u;
    e.y = boss.originY + (boss.endY - boss.originY) * u;
    if (!boss.dashHit && sweepHits(prevX, prevY, e.x, e.y, player, e.radius)) {
      boss.dashHit = true;
      pending += boss.damage;
    }
    if (u >= 1) {
      e.x = boss.endX;
      e.y = boss.endY;
      beginRecover(e, player);
    }
    return;
  }

  boss.timer -= dt;
  if (boss.timer <= 0) beginPattern(e, player);
  else pokeContact(e, player);
}

export function renderFinalBoss(ctx: CanvasRenderingContext2D, e: EnemyState): void {
  if (!boss || boss.id !== e.id) return;
  if (e.alive && boss.phase === "windup") drawTelegraph(ctx, e);
  if (boss.impact) drawImpact(ctx);
  drawShots(ctx);

  if (!e.alive) return;
  const pixel = !isLowQuality() && drawBossSprite(ctx, e);
  if (!pixel) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = e.borderColor;
    ctx.stroke();
  }

  const top = pixel ? e.y - (50 * DRAW_SCALE) / 2 : e.y - e.radius;
  const barW = Math.max(36, e.radius * 2);
  const bx = e.x - barW / 2;
  const by = top - 8;
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(bx - 1, by - 1, barW + 2, 6);
  ctx.fillStyle = "#c4b5fd";
  ctx.fillRect(bx, by, barW * Math.max(0, e.hp / e.maxHp), 4);
}

function finishWindup(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const c = CONFIG.finalBoss;
  if (boss.pattern === "dash") {
    boss.phase = "dash";
    boss.timer = 0;
    boss.dashHit = false;
    return;
  }
  if (boss.pattern === "slam") {
    if (hitsCircle(e.x, e.y, c.slamRadius, player)) pending += boss.damage;
    armImpact(e, "slam");
    beginRecover(e, player);
    return;
  }
  if (boss.pattern === "shock") {
    if (hitsSector(e, player)) pending += boss.damage;
    armImpact(e, "shock");
    beginRecover(e, player);
    return;
  }
  if (boss.pattern === "bomb") {
    for (const b of boss.bombs) {
      if (hitsCircle(b.x, b.y, c.bombRadius, player)) {
        pending += boss.damage;
        break;
      }
    }
    armImpact(e, "bomb");
    beginRecover(e, player);
    return;
  }
  launchWave(e);
  if (boss.waveLeft > 0) {
    const windup = c.waveWindupNext;
    boss.phase = "windup";
    boss.timer = windup;
    boss.windupTotal = windup;
    lockWave(e, player);
    return;
  }
  beginRecover(e, player);
}

function beginRecover(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const gap = recoverSeconds(e);
  if (gap <= 0) {
    beginPattern(e, player);
    return;
  }
  boss.phase = "recover";
  boss.timer = gap;
}

function recoverSeconds(e: EnemyState): number {
  const c = CONFIG.finalBoss;
  const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 1;
  if (ratio <= c.recoverNoneAt) return 0;
  if (ratio <= c.recoverLowAt) return c.recoverLow;
  return c.recover;
}

function beginPattern(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const c = CONFIG.finalBoss;
  const dist = Math.hypot(player.x - e.x, player.y - e.y);
  let pattern: Pattern;
  if (dist > c.dashChase) pattern = "dash";
  else pattern = pickPattern(dist);
  boss.lastPattern = pattern;
  boss.pattern = pattern;
  boss.bombs = [];
  if (pattern === "dash") {
    boss.phase = "windup";
    boss.timer = c.dashWindup;
    boss.windupTotal = c.dashWindup;
    lockDash(e, player.x, player.y);
    return;
  }
  if (pattern === "slam") {
    boss.phase = "windup";
    boss.timer = c.slamWindup;
    boss.windupTotal = c.slamWindup;
    boss.originX = e.x;
    boss.originY = e.y;
    return;
  }
  if (pattern === "shock") {
    boss.phase = "windup";
    boss.timer = c.shockWindup;
    boss.windupTotal = c.shockWindup;
    boss.originX = e.x;
    boss.originY = e.y;
    boss.aim = Math.atan2(player.y - e.y, player.x - e.x);
    boss.facingRight = player.x >= e.x;
    return;
  }
  if (pattern === "bomb") {
    boss.phase = "windup";
    boss.timer = c.bombWindup;
    boss.windupTotal = c.bombWindup;
    boss.originX = e.x;
    boss.originY = e.y;
    boss.bombs = scatterBombs(player);
    return;
  }
  boss.waveLeft = c.waveCount;
  boss.phase = "windup";
  boss.timer = c.waveWindupFirst;
  boss.windupTotal = c.waveWindupFirst;
  lockWave(e, player);
}

function pickPattern(dist: number): Pattern {
  const c = CONFIG.finalBoss;
  const pool: Pattern[] = [];
  if (dist <= c.slamWithin) pool.push("slam");
  if (dist > c.shockBeyond) pool.push("shock");
  pool.push("bomb", "wave");
  const choices = pool.filter((p) => p !== boss?.lastPattern);
  const use = choices.length > 0 ? choices : pool;
  return use[Math.floor(Math.random() * use.length)];
}

function lockDash(e: EnemyState, px: number, py: number): void {
  if (!boss) return;
  const dx = px - e.x;
  const dy = py - e.y;
  const dist = Math.hypot(dx, dy);
  const dirX = dist > 0.001 ? dx / dist : 1;
  const dirY = dist > 0.001 ? dy / dist : 0;
  const past = dist + CONFIG.finalBoss.dashPast;
  boss.originX = e.x;
  boss.originY = e.y;
  boss.endX = e.x + dirX * past;
  boss.endY = e.y + dirY * past;
  boss.aim = Math.atan2(dirY, dirX);
  boss.facingRight = dirX >= 0;
  e.facingRight = boss.facingRight;
}

function lockWave(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy);
  const dirX = dist > 0.001 ? dx / dist : 1;
  const dirY = dist > 0.001 ? dy / dist : 0;
  const range = CONFIG.finalBoss.waveRange;
  boss.originX = e.x;
  boss.originY = e.y;
  boss.endX = e.x + dirX * range;
  boss.endY = e.y + dirY * range;
  boss.aim = Math.atan2(dirY, dirX);
  boss.facingRight = dirX >= 0;
  boss.waveLeft -= 1;
}

function launchWave(e: EnemyState): void {
  if (!boss) return;
  const c = CONFIG.finalBoss;
  const dx = boss.endX - e.x;
  const dy = boss.endY - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  boss.shots.push({
    x: e.x,
    y: e.y,
    vx: (dx / dist) * c.waveSpeed,
    vy: (dy / dist) * c.waveSpeed,
    left: c.waveRange,
    hit: false,
  });
}

function moveShots(player: PlayerState, dt: number): void {
  if (!boss) return;
  const r = CONFIG.finalBoss.waveRadius + player.radius;
  const next: Shot[] = [];
  for (const s of boss.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.left -= CONFIG.finalBoss.waveSpeed * dt;
    if (!s.hit) {
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy < r * r) {
        s.hit = true;
        pending += boss.damage;
      }
    }
    if (s.left > 0) next.push(s);
  }
  boss.shots = next;
}

/** Random circles over the screen and a margin past it. Locked when the windup starts. */
function scatterBombs(player: PlayerState): Bomb[] {
  const c = CONFIG.finalBoss;
  const halfW = CONFIG.canvasWidth / 2 + c.bombMargin;
  const halfH = CONFIG.canvasHeight / 2 + c.bombMargin;
  const out: Bomb[] = [];
  for (let i = 0; i < c.bombCount; i++) {
    out.push({
      x: player.x + (Math.random() * 2 - 1) * halfW,
      y: player.y + (Math.random() * 2 - 1) * halfH,
    });
  }
  return out;
}

function hitsCircle(x: number, y: number, radius: number, player: PlayerState): boolean {
  const dx = player.x - x;
  const dy = player.y - y;
  const r = radius + player.radius;
  return dx * dx + dy * dy < r * r;
}

function hitsSector(e: EnemyState, player: PlayerState): boolean {
  if (!boss) return false;
  const c = CONFIG.finalBoss;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist > c.shockRadius + player.radius) return false;
  const diff = Math.abs(wrap(Math.atan2(dy, dx) - boss.aim));
  const pad = dist > 1 ? Math.atan2(player.radius, dist) : c.shockAngle;
  return diff <= c.shockAngle / 2 + pad;
}

function wrap(a: number): number {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pokeContact(e: EnemyState, player: PlayerState): void {
  if (!boss || e.contactTimer > 0) return;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const r = e.radius + player.radius;
  if (dx * dx + dy * dy >= r * r) return;
  pending += boss.damage;
  e.contactTimer = CONFIG.enemy.contactDamageCooldown;
}

function sweepHits(
  x1: number, y1: number, x2: number, y2: number,
  player: PlayerState, radius: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = ((player.x - x1) * dx + (player.y - y1) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  const r = radius + player.radius;
  const ox = player.x - cx;
  const oy = player.y - cy;
  return ox * ox + oy * oy < r * r;
}

/** Snapshot the hit shape before the next pattern clears it. */
function armImpact(e: EnemyState, kind: Impact["kind"]): void {
  if (!boss) return;
  boss.impact = {
    kind,
    t: 0,
    x: e.x,
    y: e.y,
    aim: boss.aim,
    bombs: boss.bombs.slice(),
  };
}

const IMPACT_FILL = "#ffffff";

/** The resolved hit, held solid so the strike reads after the telegraph disappears. */
function drawImpact(ctx: CanvasRenderingContext2D): void {
  if (!boss?.impact) return;
  const c = CONFIG.finalBoss;
  const hit = boss.impact;
  if (hit.kind === "slam") {
    fillCircle(ctx, hit.x, hit.y, c.slamRadius, IMPACT_FILL);
    strokeCircle(ctx, hit.x, hit.y, c.slamRadius, c.borderColor, 14);
    strokeCircle(ctx, hit.x, hit.y, c.slamRadius * 0.55, c.borderColor, 10);
    return;
  }
  if (hit.kind === "shock") {
    const half = c.shockAngle / 2;
    drawSector(ctx, hit.x, hit.y, c.shockRadius, hit.aim, half, IMPACT_FILL, true);
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, c.shockRadius, hit.aim - half, hit.aim + half);
    ctx.lineWidth = 16;
    ctx.strokeStyle = c.borderColor;
    ctx.stroke();
    return;
  }
  for (const b of hit.bombs) {
    fillCircle(ctx, b.x, b.y, c.bombRadius, IMPACT_FILL);
    fillCircle(ctx, b.x, b.y, c.bombRadius * 0.4, c.color);
    strokeCircle(ctx, b.x, b.y, c.bombRadius, c.borderColor, 8);
  }
}

function windupFill(): number {
  if (!boss || boss.windupTotal <= 0) return 1;
  const t = 1 - boss.timer / boss.windupTotal;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function drawTelegraph(ctx: CanvasRenderingContext2D, e: EnemyState): void {
  if (!boss) return;
  const c = CONFIG.finalBoss;
  const u = windupFill();
  if (boss.pattern === "dash" || boss.pattern === "wave") {
    const radius = boss.pattern === "dash" ? e.radius : c.waveRadius;
    drawPath(ctx, u, radius);
    return;
  }
  if (boss.pattern === "slam") {
    strokeCircle(ctx, e.x, e.y, c.slamRadius, c.telegraphTrack);
    fillCircle(ctx, e.x, e.y, c.slamRadius * u, c.telegraph);
    return;
  }
  if (boss.pattern === "shock") {
    drawSector(ctx, e.x, e.y, c.shockRadius, boss.aim, c.shockAngle / 2, c.telegraphTrack, false);
    drawSector(ctx, e.x, e.y, c.shockRadius * u, boss.aim, c.shockAngle / 2, c.telegraph, true);
    return;
  }
  for (const b of boss.bombs) {
    strokeCircle(ctx, b.x, b.y, c.bombRadius, c.telegraphTrack);
    fillCircleFromBoss(ctx, b.x, b.y, c.bombRadius, e.x, e.y, u, c.telegraph);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, u: number, radius: number): void {
  if (!boss) return;
  const c = CONFIG.finalBoss;
  const x = boss.originX + (boss.endX - boss.originX) * u;
  const y = boss.originY + (boss.endY - boss.originY) * u;
  const thickness = radius * 2;
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(boss.originX, boss.originY);
  ctx.lineTo(boss.endX, boss.endY);
  ctx.strokeStyle = c.telegraphTrack;
  ctx.lineWidth = thickness;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(boss.originX, boss.originY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = c.telegraph;
  ctx.lineWidth = thickness;
  ctx.stroke();
  ctx.restore();
}

function strokeCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width = 4): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function fillCircleFromBoss(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  bx: number, by: number, u: number, color: string,
): void {
  if (u <= 0) return;
  const dx = bx - x;
  const dy = by - y;
  const ang = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.rect(r - u * 2 * r, -r - 1, u * 2 * r + 1, r * 2 + 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawSector(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number, aim: number, half: number,
  color: string, fill: boolean,
): void {
  if (radius <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, aim - half, aim + half);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawShots(ctx: CanvasRenderingContext2D): void {
  if (!boss || boss.shots.length === 0) return;
  const c = CONFIG.finalBoss;
  for (const s of boss.shots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, c.waveRadius, 0, Math.PI * 2);
    ctx.fillStyle = c.telegraph;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = c.telegraphTrack;
    ctx.stroke();
  }
}

function drawBossSprite(ctx: CanvasRenderingContext2D, e: EnemyState): boolean {
  if (!boss || !getPixelImage(IDLE_SHEET)) return false;
  const frames = stripFrameCount(IDLE_SHEET);
  const frame = Math.floor(boss.anim * 8) % frames;
  drawShadow(ctx, e.x, e.y + e.radius * 0.8, e.radius / 8);
  return drawStrip(ctx, IDLE_SHEET, frame, e.x, e.y, DRAW_SCALE, 0, !boss.facingRight);
}
