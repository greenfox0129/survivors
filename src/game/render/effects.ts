// ============================================================
//  render/effects.ts — short cosmetic effects (kill pop).
//
//  Pure decoration: skipped entirely on low quality, capped in count, short-lived
//  (no lingering trails — the original author disliked afterimages/smears),
//  drawn with one drawImage each from a pre-tinted sprite.
// ============================================================

import { isLowQuality } from "@/game/render/quality";
import { getStarFxSprite } from "@/game/render/iconSprites";

interface Pop {
  x: number;
  y: number;
  t: number;
  life: number;
  size: number;
  color: string;
}

const MAX_POPS = 32;
const POP_LIFE = 0.18;
const pops: Pop[] = [];

export function resetEffects(): void {
  pops.length = 0;
}

/** Small star burst where an enemy died. `radius` = enemy radius. */
export function spawnKillPop(x: number, y: number, color: string, radius: number): void {
  if (isLowQuality()) return;
  if (pops.length >= MAX_POPS) pops.shift();
  pops.push({ x, y, t: 0, life: POP_LIFE, size: Math.min(64, radius * 3), color });
}

export function updateEffects(dt: number): void {
  let write = 0;
  for (let i = 0; i < pops.length; i++) {
    const p = pops[i];
    p.t += dt;
    if (p.t < p.life) pops[write++] = p;
  }
  pops.length = write;
}

export function renderEffects(ctx: CanvasRenderingContext2D): void {
  if (pops.length === 0) return;
  for (const p of pops) {
    const sprite = getStarFxSprite(p.color);
    if (!sprite) continue;
    const k = p.t / p.life;
    const s = p.size * (0.5 + 0.7 * k);
    ctx.globalAlpha = 1 - k;
    ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}
