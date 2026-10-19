// ============================================================
//  Player.ts — Movement, rendering, XP & leveling
// ============================================================

import { CONFIG, xpForLevel } from "./config";
import type { PlayerState } from "./types";

let idCounter = 0;

export function createPlayer(mods?: {
  hpMult?: number;
  speedMult?: number;
  pickupRangeMult?: number;
  playerColor?: string;
}): PlayerState {
  const hpMult = mods?.hpMult ?? 1;
  const speedMult = mods?.speedMult ?? 1;
  const pickupMult = mods?.pickupRangeMult ?? 1;
  const maxHp = Math.round(CONFIG.player.maxHp * hpMult);

  return {
    id: ++idCounter,
    x: CONFIG.player.startX,
    y: CONFIG.player.startY,
    radius: CONFIG.player.radius,
    hp: maxHp,
    maxHp,
    alive: true,
    speed: CONFIG.player.speed * speedMult,
    level: 1,
    xp: 0,
    xpToNext: xpForLevel(1),
    invulnTimer: 0,
    pickupRadius: CONFIG.player.pickupRadius * pickupMult,
    color: mods?.playerColor ?? CONFIG.player.color,
  };
}

/** Moves player based on input bitmask. No canvas bounds — world is infinite. */
export function updatePlayer(
  player: PlayerState,
  input: { up: boolean; down: boolean; left: boolean; right: boolean },
  dt: number
): void {
  let dx = 0;
  let dy = 0;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;

  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  if (player.invulnTimer > 0) {
    player.invulnTimer -= dt;
  }
}

export function gainXp(player: PlayerState, amount: number): boolean {
  if (!player.alive) return false;
  player.xp += amount;
  let leveled = false;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = xpForLevel(player.level);
    leveled = true;
  }
  return leveled;
}

export function damagePlayer(player: PlayerState, dmg: number): void {
  if (player.invulnTimer > 0 || !player.alive) return;
  player.hp -= dmg;
  player.invulnTimer = CONFIG.player.invulnTime;
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
  }
}

export function renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  const blinking = player.invulnTimer > 0 && Math.floor(player.invulnTimer * 10) % 2 === 0;
  ctx.fillStyle = blinking ? "#67e8f9" : player.color;

  // Body
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = "#0e7490";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pickup radius indicator (subtle)
  ctx.strokeStyle = "rgba(34,211,238,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.pickupRadius, 0, Math.PI * 2);
  ctx.stroke();
}
