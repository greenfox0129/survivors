// ============================================================
//  pointer.ts — Last mouse position on the game canvas, as an aim angle.
//
//  Used only when the breath-aim setting is on. No DOM at import time,
//  so the headless sim can load this module. Until the pointer moves,
//  callers should keep the movement direction.
// ============================================================

import { CONFIG } from "@/game/data/config";

let canvasX = 0;
let canvasY = 0;
let hasPointer = false;

/** Canvas pixel coordinates (0..960, 0..720), including outside the canvas. */
export function setCanvasPointer(x: number, y: number): void {
  canvasX = x;
  canvasY = y;
  hasPointer = true;
}

/** Angle from the centered player toward the pointer, or null if it never moved. */
export function pointerAim(): number | null {
  if (!hasPointer) return null;
  return Math.atan2(canvasY - CONFIG.canvasHeight / 2, canvasX - CONFIG.canvasWidth / 2);
}
