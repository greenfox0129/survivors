// ============================================================
//  MidBoss.ts — the 5:00 boss. One per run, in place of that minute's elite.
//
//  It walks until it is close enough to dash, then commits to a straight
//  400px charge through the player's position at the moment the line appears.
//  The line does not follow a moving player. Below half HP the charge is
//  three dashes, each with its own line and no recovery between them.
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { EnemyState, PlayerState } from "@/game/core/types";
import { isLowQuality } from "@/game/render/quality";
import { drawShadow, drawStrip, getPixelImage, stripFrameCount } from "@/game/render/pixel";

const IDLE_SHEET = "boss/raccoon-idle";
const CHARGE_SHEET = "boss/raccoon-charge";
/** 60px raccoon frames drawn a little larger than the hit circle. */
const DRAW_SCALE = 1.7;

type Phase = "approach" | "windup" | "dash" | "recover";

interface BossRuntime {
  id: number;
  phase: Phase;
  /** Windup/recover time left, or seconds already spent inside the dash. */
  timer: number;
  windupTotal: number;
  windupEach: number;
  dashesLeft: number;
  originX: number;
  originY: number;
  endX: number;
  endY: number;
  dashHit: boolean;
  facingRight: boolean;
  anim: number;
  dashDamage: number;
}

let boss: BossRuntime | null = null;
let spawned = 0;
let pendingContact = 0;
let pendingDash = 0;

export function resetMidBoss(): void {
  boss = null;
  spawned = 0;
  pendingContact = 0;
  pendingDash = 0;
}

export function getMidBossSpawned(): number {
  return spawned;
}

export function isMidBoss(e: EnemyState): boolean {
  return e.enemyType === "midboss";
}

/** Build the one boss body and remember its dash damage. Called from the elite clock. */
export function createMidBossState(
  id: number,
  x: number,
  y: number,
  hp: number,
  speed: number,
  contact: number,
  dash: number,
): EnemyState {
  const c = CONFIG.midBoss;
  spawned++;
  boss = {
    id,
    phase: "approach",
    timer: 0,
    windupTotal: c.windup,
    windupEach: c.windup,
    dashesLeft: 1,
    originX: x,
    originY: y,
    endX: x,
    endY: y,
    dashHit: false,
    facingRight: true,
    anim: 0,
    dashDamage: dash,
  };
  return {
    id,
    x,
    y,
    radius: c.radius,
    hp,
    maxHp: hp,
    alive: true,
    speed,
    baseSpeed: speed,
    damage: contact,
    contactTimer: 0,
    shotTimer: 0,
    ranged: false,
    enemyType: "midboss",
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
}

/** Contact and dash damage queued this frame. Cleared on read. */
export function consumeMidBossDamage(): { contact: number; dash: number } {
  const out = { contact: pendingContact, dash: pendingDash };
  pendingContact = 0;
  pendingDash = 0;
  return out;
}

export function updateMidBoss(e: EnemyState, player: PlayerState, dt: number): void {
  if (!boss || boss.id !== e.id || !e.alive) return;
  if (e.contactTimer > 0) e.contactTimer -= dt;
  boss.anim += dt;

  if (boss.phase === "approach") {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= CONFIG.midBoss.approach) {
      beginAttack(e, player);
    } else if (dist > 0.001) {
      const step = e.speed * dt;
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
      boss.facingRight = dx >= 0;
    }
    pokeContact(e, player);
    return;
  }

  if (boss.phase === "windup") {
    e.x = boss.originX;
    e.y = boss.originY;
    boss.timer -= dt;
    if (boss.timer <= 0) beginDash();
    else pokeContact(e, player);
    return;
  }

  if (boss.phase === "dash") {
    const prevX = e.x;
    const prevY = e.y;
    boss.timer += dt;
    const u = Math.min(1, boss.timer / CONFIG.midBoss.dashTime);
    e.x = boss.originX + (boss.endX - boss.originX) * u;
    e.y = boss.originY + (boss.endY - boss.originY) * u;
    const hit = sweepHits(prevX, prevY, e.x, e.y, player, e.radius);
    if (hit && !boss.dashHit) {
      boss.dashHit = true;
      pendingDash += boss.dashDamage;
    }
    if (hit && e.contactTimer <= 0) {
      pendingContact += e.damage;
      e.contactTimer = CONFIG.enemy.contactDamageCooldown;
    }
    if (u >= 1) {
      e.x = boss.endX;
      e.y = boss.endY;
      boss.dashesLeft -= 1;
      if (boss.dashesLeft > 0) startWindup(e, player);
      else {
        boss.phase = "recover";
        boss.timer = CONFIG.midBoss.recover;
      }
      pokeContact(e, player);
    }
    return;
  }

  boss.timer -= dt;
  if (boss.timer <= 0) boss.phase = "approach";
  pokeContact(e, player);
}

export function renderMidBoss(ctx: CanvasRenderingContext2D, e: EnemyState): void {
  if (!e.alive || !boss || boss.id !== e.id) return;
  if (boss.phase === "windup") drawTelegraph(ctx);

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

  const top = pixel ? e.y - (60 * DRAW_SCALE) / 2 : e.y - e.radius;
  const barW = Math.max(28, e.radius * 2);
  const bx = e.x - barW / 2;
  const by = top - 8;
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(bx - 1, by - 1, barW + 2, 6);
  ctx.fillStyle = "#fb923c";
  ctx.fillRect(bx, by, barW * Math.max(0, e.hp / e.maxHp), 4);
}

function beginAttack(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const c = CONFIG.midBoss;
  const enraged = e.hp <= e.maxHp * c.enrageAt;
  boss.dashesLeft = enraged ? c.enragedDashes : 1;
  boss.windupEach = enraged ? c.enragedWindup : c.windup;
  startWindup(e, player);
}

function startWindup(e: EnemyState, player: PlayerState): void {
  if (!boss) return;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy);
  let dirX = boss.facingRight ? 1 : -1;
  let dirY = 0;
  if (dist > 0.001) {
    dirX = dx / dist;
    dirY = dy / dist;
  }
  const len = CONFIG.midBoss.dashLength;
  boss.facingRight = dirX >= 0;
  boss.originX = e.x;
  boss.originY = e.y;
  boss.endX = e.x + dirX * len;
  boss.endY = e.y + dirY * len;
  boss.phase = "windup";
  boss.timer = boss.windupEach;
  boss.windupTotal = boss.windupEach;
}

function beginDash(): void {
  if (!boss) return;
  boss.phase = "dash";
  boss.timer = 0;
  boss.dashHit = false;
}

function pokeContact(e: EnemyState, player: PlayerState): void {
  if (e.contactTimer > 0) return;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const r = e.radius + player.radius;
  if (dx * dx + dy * dy >= r * r) return;
  pendingContact += e.damage;
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

function drawTelegraph(ctx: CanvasRenderingContext2D): void {
  if (!boss) return;
  const t = boss.windupTotal > 0 ? 1 - boss.timer / boss.windupTotal : 1;
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = boss.originX + (boss.endX - boss.originX) * u;
  const y = boss.originY + (boss.endY - boss.originY) * u;
  const c = CONFIG.midBoss;
  // Round cap on a stroke this wide matches the swept circle (radius past each end).
  const thickness = c.radius * 2;
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

function drawBossSprite(ctx: CanvasRenderingContext2D, e: EnemyState): boolean {
  if (!boss) return false;
  // The dash itself is 0.1s, so the charge sheet plays from the telegraph onward.
  const charging = boss.phase === "windup" || boss.phase === "dash";
  const name = charging ? CHARGE_SHEET : IDLE_SHEET;
  if (!getPixelImage(name)) return false;
  const frames = stripFrameCount(name);
  let frame: number;
  if (boss.phase === "windup") {
    const t = boss.windupTotal > 0 ? 1 - boss.timer / boss.windupTotal : 1;
    const u = t < 0 ? 0 : t > 1 ? 1 : t;
    frame = Math.min(frames - 1, Math.floor(u * frames));
  } else if (boss.phase === "dash") {
    frame = frames - 1;
  } else {
    frame = Math.floor(boss.anim * 8) % frames;
  }
  drawShadow(ctx, e.x, e.y + e.radius * 0.8, e.radius / 8);
  return drawStrip(ctx, name, frame, e.x, e.y, DRAW_SCALE, 0, !boss.facingRight);
}
