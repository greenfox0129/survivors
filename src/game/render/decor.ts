// ============================================================
//  render/decor.ts — subtle ground decorations for the infinite world.
//
//  Each 280px world cell gets 0–1 dark silhouette (grass, stones, bones, …)
//  chosen by a deterministic hash of the cell, so the floor looks the same when
//  you walk back and gives landmarks for the sense of movement. Very low contrast
//  so it never competes with enemies/gems. Decoration → skipped on low quality.
//  Cost: ≤ ~20 drawImage per frame from cached sprites.
// ============================================================

import { CONFIG } from "@/game/data/config";
import { isLowQuality } from "@/game/render/quality";
import { getIconSprite } from "@/game/render/iconSprites";

const CELL = 280;
const COLOR = "#171c2f"; // barely above the world background (#0a0a12)
const ICONS = [
  "decor-grass", "decor-grass", "decor-daisy", "decor-stones", "decor-rock",
  "decor-bones", "decor-skull", "decor-mushroom", "decor-tombstone", "decor-deadwood", "decor-cobweb",
];

function hash(cx: number, cy: number): number {
  let h = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Draw decorations in world space. camX/camY = world coords of the screen's top-left. */
export function renderDecor(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  if (isLowQuality()) return;
  const x0 = Math.floor(camX / CELL) - 1;
  const y0 = Math.floor(camY / CELL) - 1;
  const x1 = Math.floor((camX + CONFIG.canvasWidth) / CELL) + 1;
  const y1 = Math.floor((camY + CONFIG.canvasHeight) / CELL) + 1;
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const h = hash(cx, cy);
      if (h % 100 >= 45) continue; // ~45% of cells get one
      const name = ICONS[(h >>> 7) % ICONS.length];
      const size = 26 + ((h >>> 11) % 18);
      const sprite = getIconSprite(name, COLOR, size, null);
      if (!sprite) continue;
      const x = cx * CELL + 30 + ((h >>> 3) % (CELL - 60));
      const y = cy * CELL + 30 + ((h >>> 17) % (CELL - 60));
      ctx.drawImage(sprite, x - size / 2, y - size / 2);
    }
  }
}
