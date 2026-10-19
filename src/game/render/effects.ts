// ============================================================
//  render/effects.ts — short cosmetic effects (Kenney FX textures).
//
//  Pure decoration: skipped entirely on low quality, capped in count, short-lived
//  (no lingering trails — the original author disliked afterimages/smears),
//  drawn with one drawImage each from a pre-tinted sprite.
// ============================================================

import { isLowQuality } from "@/game/render/quality";
import { getFxSprite, type FxName } from "@/game/render/iconSprites";

interface Fx {
  tex: FxName;
  x: number;
  y: number;
  t: number;
  life: number;
  /** size at start → end (px) */
  from: number;
  to: number;
  angle: number;
  color: string;
}

const MAX_FX = 48;
const fxs: Fx[] = [];

export function resetEffects(): void {
  fxs.length = 0;
}

function push(fx: Fx): void {
  if (isLowQuality()) return;
  if (fxs.length >= MAX_FX) fxs.shift();
  fxs.push(fx);
}

/** Small star burst where an enemy died. `radius` = enemy radius. */
export function spawnKillPop(x: number, y: number, color: string, radius: number): void {
  const size = Math.min(64, radius * 3);
  push({ tex: "star", x, y, t: 0, life: 0.18, from: size * 0.5, to: size * 1.2, angle: 0, color });
}

/** Golden light burst behind the player on level-up (shows in the frozen level-up frame). */
export function spawnLevelUpBurst(x: number, y: number): void {
  push({ tex: "light_02", x, y, t: 0, life: 0.5, from: 70, to: 150, angle: 0, color: "#fde68a" });
}

/** Rifle muzzle flash pointing along `angle`. */
export function spawnMuzzleFlash(x: number, y: number, angle: number, color: string): void {
  push({ tex: "muzzle_02", x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 18, t: 0, life: 0.06, from: 26, to: 30, angle, color });
}

export function updateEffects(dt: number): void {
  let write = 0;
  for (let i = 0; i < fxs.length; i++) {
    const f = fxs[i];
    f.t += dt;
    if (f.t < f.life) fxs[write++] = f;
  }
  fxs.length = write;
}

export function renderEffects(ctx: CanvasRenderingContext2D): void {
  if (fxs.length === 0) return;
  for (const f of fxs) {
    const sprite = getFxSprite(f.tex, f.color);
    if (!sprite) continue;
    const k = f.t / f.life;
    const s = f.from + (f.to - f.from) * k;
    ctx.globalAlpha = 1 - k;
    if (f.angle !== 0) {
      ctx.save();
      ctx.translate(f.x, f.y);
      // Kenney muzzle texture points up → rotate so it points along the shot
      ctx.rotate(f.angle + Math.PI / 2);
      ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
    }
  }
  ctx.globalAlpha = 1;
}
