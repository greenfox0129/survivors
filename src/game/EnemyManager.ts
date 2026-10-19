// ============================================================
//  EnemyManager.ts — Spawning, tracking, collision, death
// ============================================================

import { CONFIG } from "./config";
import { playHitSound } from "./audio";
import type { EnemyState, PlayerState } from "./types";

type EnemyTypeConfig = {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  radius: number;
  hp: number;
  speed: number;
  damage: number;
  spawnWeight: number;
  unlockedTime: number;
  shape: "circle" | "triangle" | "square" | "diamond" | "hexagon" | "star" | "sprite";
};

// ---- Sprite sheet constants (Wolf.png) ----
const WOLF_COLS = 4;
const WOLF_ROWS = 14;
const WOLF_ROW_WALK_RIGHT = 4;
const WOLF_ROW_WALK_LEFT  = 5;
const WOLF_ROW_DIE_RIGHT  = 12;
const WOLF_ROW_DIE_LEFT   = 13;
const WOLF_FRAME_DURATION = 0.14; // seconds per frame
const WOLF_DIE_DURATION   = WOLF_COLS * WOLF_FRAME_DURATION; // full die anim

// Lazy-loaded sprite image
let wolfImage: HTMLImageElement | null = null;
let wolfImageLoaded = false;

function getWolfImage(): HTMLImageElement | null {
  if (wolfImage) return wolfImageLoaded ? wolfImage : null;
  wolfImage = new Image();
  wolfImage.src = "/assets/enemy/Wolf.png";
  wolfImage.onload = () => { wolfImageLoaded = true; };
  return null;
}

let idCounter = 1000;
let spawnTimer = 0;
let currentSpawnInterval: number = CONFIG.enemy.spawnInterval;
let eliteTimer = 0;
let eliteSpawned = 0;

export function resetEnemyManager(): void {
  spawnTimer = 0;
  currentSpawnInterval = CONFIG.enemy.spawnInterval;
  idCounter = 1000;
  eliteTimer = 0;
  eliteSpawned = 0;
}

export function getEliteSpawned(): number {
  return eliteSpawned;
}

function createEliteEnemy(elapsedTime: number, px: number, py: number): EnemyState {
  const pos = spawnEdgePosition(px, py);
  const t = pickType(elapsedTime);
  const ec = CONFIG.elite;
  return {
    id: ++idCounter,
    x: pos.x,
    y: pos.y,
    radius: t.radius * ec.radiusMult,
    hp: t.hp * ec.hpMult,
    maxHp: t.hp * ec.hpMult,
    alive: true,
    speed: t.speed * ec.speedMult,
    baseSpeed: t.speed * ec.speedMult,
    damage: t.damage * ec.damageMult,
    contactTimer: 0,
    enemyType: t.id,
    color: ec.color,
    borderColor: ec.borderColor,
    shape: t.shape,
    spriteFrame: 0,
    spriteTimer: 0,
    facingRight: true,
    dying: false,
    dyingTimer: 0,
    isElite: true,
    gemDropped: false,
  };
}

function spawnEdgePosition(px: number, py: number): { x: number; y: number } {
  const w = CONFIG.canvasWidth;
  const h = CONFIG.canvasHeight;
  const side = Math.floor(Math.random() * 4);
  const margin = 40;
  switch (side) {
    case 0: return { x: px + (Math.random() - 0.5) * w, y: py - h / 2 - margin };
    case 1: return { x: px + w / 2 + margin, y: py + (Math.random() - 0.5) * h };
    case 2: return { x: px + (Math.random() - 0.5) * w, y: py + h / 2 + margin };
    default: return { x: px - w / 2 - margin, y: py + (Math.random() - 0.5) * h };
  }
}

function getAvailableTypes(elapsedTime: number): readonly EnemyTypeConfig[] {
  return CONFIG.enemyTypes.filter((t) => elapsedTime >= t.unlockedTime);
}

function pickType(elapsedTime: number): EnemyTypeConfig {
  const available = getAvailableTypes(elapsedTime);
  const totalWeight = available.reduce((sum, t) => sum + t.spawnWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const t of available) {
    roll -= t.spawnWeight;
    if (roll <= 0) return t;
  }
  return available[0];
}

function createEnemy(elapsedTime: number, px: number, py: number): EnemyState {
  const pos = spawnEdgePosition(px, py);
  const t = pickType(elapsedTime);
  return {
    id: ++idCounter,
    x: pos.x,
    y: pos.y,
    radius: t.radius,
    hp: t.hp,
    maxHp: t.hp,
    alive: true,
    speed: t.speed * (0.8 + Math.random() * 0.4),
    baseSpeed: t.speed * (0.8 + Math.random() * 0.4),
    damage: t.damage,
    contactTimer: 0,
    enemyType: t.id,
    color: t.color,
    borderColor: t.borderColor,
    shape: t.shape,
    spriteFrame: 0,
    spriteTimer: 0,
    facingRight: true,
    dying: false,
    dyingTimer: 0,
    isElite: false,
    gemDropped: false,
  };
}

export function updateEnemies(
  enemies: EnemyState[],
  player: PlayerState,
  dt: number
): void {
  if (enemies.length < CONFIG.enemy.maxCount) {
    spawnTimer += dt;
    if (spawnTimer >= currentSpawnInterval) {
      spawnTimer = 0;
      enemies.push(createEnemy(_elapsedTime, player.x, player.y));
      currentSpawnInterval = Math.max(
        CONFIG.enemy.spawnMinInterval,
        currentSpawnInterval * CONFIG.enemy.spawnIntervalDecay
      );
    }
  }

  // Elite spawn every interval
  eliteTimer += dt;
  if (eliteTimer >= CONFIG.elite.spawnInterval) {
    eliteTimer = 0;
    eliteSpawned++;
    enemies.push(createEliteEnemy(_elapsedTime, player.x, player.y));
  }

  for (const e of enemies) {
    if (!e.alive) continue;

    // Reset speed to base each frame so trap slow doesn't compound permanently
    e.speed = e.baseSpeed;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Sprite animation updates
    if (e.shape === "sprite") {
      if (e.dying) {
        // Advance death animation; mark dead when done
        e.dyingTimer += dt;
        e.spriteTimer += dt;
        if (e.spriteTimer >= WOLF_FRAME_DURATION) {
          e.spriteTimer -= WOLF_FRAME_DURATION;
          const nextFrame = e.spriteFrame + 1;
          if (nextFrame >= WOLF_COLS || e.dyingTimer >= WOLF_DIE_DURATION) {
            e.spriteFrame = WOLF_COLS - 1; // hold last frame briefly
          } else {
            e.spriteFrame = nextFrame;
          }
        }
        // Actually remove once full die anim done
        if (e.dyingTimer >= WOLF_DIE_DURATION) {
          e.alive = false;
          e.dying = false;
        }
        continue; // no movement during death
      }

      // Walk animation
      e.spriteTimer += dt;
      if (e.spriteTimer >= WOLF_FRAME_DURATION) {
        e.spriteTimer -= WOLF_FRAME_DURATION;
        e.spriteFrame = (e.spriteFrame + 1) % WOLF_COLS;
      }

      // Determine facing direction from movement
      if (Math.abs(dx) > 1) {
        e.facingRight = dx > 0;
      }
    }

    if (dist > 0.1) {
      // Distance-based speed boost: far enemies move faster to catch up,
      // smoothly decelerating to base speed as they get close.
      // Boost starts beyond ~150px and maxes at ~1.8x around the spawn distance (~500px).
      const nearDist = 150;
      const farDist = 500;
      let speedMult = 1;
      if (dist > nearDist) {
        const t = Math.min((dist - nearDist) / (farDist - nearDist), 1);
        speedMult = 1 + t * 1.6; // up to 2.6x at far distance
      }
      e.x += (dx / dist) * e.speed * speedMult * dt;
      e.y += (dy / dist) * e.speed * speedMult * dt;
    }

    if (e.contactTimer > 0) e.contactTimer -= dt;

    const collideDist = e.radius + player.radius;
    if (dist < collideDist && e.contactTimer <= 0) {
      e.contactTimer = CONFIG.enemy.contactDamageCooldown;
    }
  }
}

let _elapsedTime = 0;

export function setElapsedTime(t: number): void {
  _elapsedTime = t;
}

export function checkContactDamage(
  enemies: EnemyState[],
  player: PlayerState
): number {
  let totalDamage = 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const collideR = e.radius + player.radius;
    if (dx * dx + dy * dy < collideR * collideR && e.contactTimer <= 0) {
      totalDamage += e.damage;
      e.contactTimer = CONFIG.enemy.contactDamageCooldown;
    }
  }
  return totalDamage;
}

export function damageEnemy(enemy: EnemyState, dmg: number, critChance: number = 0, critMult: number = 2): boolean {
  if (!enemy.alive || enemy.dying) return false;
  let finalDmg = dmg;
  if (critChance > 0 && Math.random() < critChance) {
    finalDmg = dmg * critMult;
  }
  playHitSound();
  enemy.hp -= finalDmg;
  if (enemy.hp <= 0) {
    if (enemy.shape === "sprite") {
      // Trigger death animation; actual removal happens in updateEnemies
      enemy.hp = 0;
      enemy.dying = true;
      enemy.dyingTimer = 0;
      enemy.spriteFrame = 0;
      enemy.spriteTimer = 0;
      // Return true so the kill is counted immediately
      return true;
    }
    enemy.alive = false;
    return true;
  }
  return false;
}

export function findNearestEnemy(
  enemies: EnemyState[],
  x: number,
  y: number,
  range: number
): EnemyState | null {
  let nearest: EnemyState | null = null;
  let nearestDist2 = range * range;
  for (const e of enemies) {
    if (!e.alive || e.dying) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < nearestDist2) {
      nearestDist2 = d2;
      nearest = e;
    }
  }
  return nearest;
}

// ---- Shape rendering helpers ----

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: EnemyState["shape"],
  x: number,
  y: number,
  r: number
): void {
  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
    case "triangle":
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.866, y + r * 0.5);
      ctx.lineTo(x - r * 0.866, y + r * 0.5);
      ctx.closePath();
      break;
    case "square":
      ctx.rect(x - r, y - r, r * 2, r * 2);
      break;
    case "diamond":
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.5;
        const px = x + rr * Math.cos(a);
        const py = y + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
  }
}

function renderWolfSprite(
  ctx: CanvasRenderingContext2D,
  e: EnemyState
): void {
  const img = getWolfImage();
  if (!img) {
    // Fallback circle while image loads
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
    return;
  }

  const fw = img.width / WOLF_COLS;
  const fh = img.height / WOLF_ROWS;

  let row: number;
  if (e.dying) {
    row = e.facingRight ? WOLF_ROW_DIE_RIGHT : WOLF_ROW_DIE_LEFT;
  } else {
    row = e.facingRight ? WOLF_ROW_WALK_RIGHT : WOLF_ROW_WALK_LEFT;
  }

  const col = e.spriteFrame;
  const sx = col * fw;
  const sy = row * fh;

  // Draw sprite centered on entity position, scaled to 2x radius
  const drawSize = e.radius * 3.5;
  ctx.drawImage(
    img,
    sx, sy, fw, fh,
    e.x - drawSize / 2,
    e.y - drawSize / 2,
    drawSize,
    drawSize
  );

  // HP bar if damaged
  if (e.hp < e.maxHp && !e.dying) {
    const barW = e.radius * 2.5;
    const barH = 3;
    const bx = e.x - barW / 2;
    const by = e.y - drawSize / 2 - 5;
    ctx.fillStyle = "#333";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "#f87171";
    ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
  }
}

export function renderEnemies(ctx: CanvasRenderingContext2D, enemies: EnemyState[]): void {
  for (const e of enemies) {
    if (!e.alive && !e.dying) continue;

    if (e.isElite) {
      // Golden glow aura for elite enemies
      const pulse = 0.6 + Math.sin(performance.now() * 0.005) * 0.2;
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (e.shape === "sprite") {
      renderWolfSprite(ctx, e);
      continue;
    }

    // Dying sprite-based enemies skip shape draw (handled above)
    drawShape(ctx, e.shape, e.x, e.y, e.radius);
    ctx.fillStyle = e.color;
    ctx.fill();

    ctx.strokeStyle = e.isElite ? "#fbbf24" : e.borderColor;
    ctx.lineWidth = e.isElite ? 2.5 : 1.5;
    ctx.stroke();

    if (e.hp < e.maxHp) {
      const barW = e.radius * 2;
      const barH = 3;
      const bx = e.x - e.radius;
      const by = e.y - e.radius - 6;
      ctx.fillStyle = "#333";
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = e.isElite ? "#fbbf24" : "#f87171";
      ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
    }
  }
}

/** Removes dead enemies and enemies that have wandered too far from the player in a single in-place pass. */
export function cullDead(enemies: EnemyState[]): EnemyState[] {
  let write = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.alive || e.dying) {
      if (write !== i) enemies[write] = e;
      write++;
    }
  }
  enemies.length = write;
  return enemies;
}

/** Removes enemies that have wandered too far from the player (off-screen cleanup), in-place. */
export function cullFarEnemies(enemies: EnemyState[], px: number, py: number): EnemyState[] {
  const maxDist2 = (CONFIG.canvasWidth * 1.5) * (CONFIG.canvasWidth * 1.5);
  let write = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.alive && !e.dying) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    if (dx * dx + dy * dy < maxDist2) {
      if (write !== i) enemies[write] = e;
      write++;
    }
  }
  enemies.length = write;
  return enemies;
}
