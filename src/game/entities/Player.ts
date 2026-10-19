// ============================================================
//  Player.ts — Movement, rendering, XP & leveling
// ============================================================

import { CONFIG, xpForLevel } from "@/game/data/config";
import type { PlayerState } from "@/game/core/types";
import { isLowQuality } from "@/game/render/quality";
import { getIconSprite, drawSpriteCentered } from "@/game/render/iconSprites";

let idCounter = 0;

export function createPlayer(mods?: {
  hpMult?: number;
  speedMult?: number;
  pickupRangeMult?: number;
  playerColor?: string;
  emblem?: string;
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
    emblem: mods?.emblem,
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

/** Adds XP and returns how many levels were gained (a big merged gem can give several). */
export function gainXp(player: PlayerState, amount: number): number {
  if (!player.alive) return 0;
  player.xp += amount;
  let levels = 0;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = xpForLevel(player.level);
    levels++;
  }
  return levels;
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

/** Dark ink on bright circles, light ink on dark ones (e.g. Linya's near-black color). */
function emblemInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#0a0a12";
  const n = parseInt(m[1], 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum < 0.45 ? "#e2e8f0" : "#0a0a12";
}

export function renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  const blinking = player.invulnTimer > 0 && Math.floor(player.invulnTimer * 10) % 2 === 0;
  const bodyColor = blinking ? "#67e8f9" : player.color;
  ctx.fillStyle = bodyColor;

  // Body
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = "#0e7490";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Character emblem (pre-tinted sprite, one drawImage)
  if (player.emblem) {
    const ink = emblemInk(bodyColor);
    const sprite = getIconSprite(player.emblem, ink, Math.round(player.radius * 1.3), ink === "#0a0a12" ? bodyColor : "#0a0a12");
    if (sprite) drawSpriteCentered(ctx, sprite, player.x, player.y);
  }

  // Pickup radius indicator (subtle decoration)
  if (isLowQuality()) return;
  ctx.strokeStyle = "rgba(34,211,238,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.pickupRadius, 0, Math.PI * 2);
  ctx.stroke();
}
