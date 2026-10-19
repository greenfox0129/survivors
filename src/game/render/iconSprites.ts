// ============================================================
//  render/iconSprites.ts — pre-tinted image sprites for the canvas.
//
//  SVG icons (src/assets/icons) and FX textures (src/assets/fx) are loaded lazily,
//  tinted once into an offscreen canvas per (image, color, size) and reused with a
//  single drawImage per frame. Nothing here touches the DOM at import time, so game
//  modules stay importable outside the browser (scripts/gen-spec.mjs).
// ============================================================

import { iconUrl } from "@/assets/icons";
import starFxUrl from "@/assets/fx/star.png";

const images = new Map<string, HTMLImageElement>();
const sprites = new Map<string, HTMLCanvasElement>();
const MAX_SPRITES = 128;

function loadImage(url: string): HTMLImageElement | null {
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = url;
    images.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function tint(img: HTMLImageElement, size: number, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    g.drawImage(img, 0, 0, size, size);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

function remember(key: string, cv: HTMLCanvasElement): HTMLCanvasElement {
  if (sprites.size >= MAX_SPRITES) {
    const oldest = sprites.keys().next().value;
    if (oldest !== undefined) sprites.delete(oldest);
  }
  sprites.set(key, cv);
  return cv;
}

/**
 * Icon tinted with `color`, with a 1px dark outline so it reads on any background.
 * Returns null until the image has loaded (callers draw a fallback meanwhile).
 */
export function getIconSprite(name: string, color: string, size: number, outline = "#0a0a12"): HTMLCanvasElement | null {
  const key = `icon|${name}|${color}|${size}|${outline}`;
  const hit = sprites.get(key);
  if (hit) return hit;
  const url = iconUrl(name);
  if (!url) return null;
  const img = loadImage(url);
  if (!img) return null;

  const pad = 2;
  const cv = document.createElement("canvas");
  cv.width = size + pad * 2;
  cv.height = size + pad * 2;
  const g = cv.getContext("2d");
  if (g) {
    const edge = tint(img, size, outline);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
      g.drawImage(edge, pad + dx, pad + dy);
    }
    g.drawImage(tint(img, size, color), pad, pad);
  }
  return remember(key, cv);
}

/** Kenney "star" FX texture tinted with `color` (white-alpha source). */
export function getStarFxSprite(color: string, size = 48): HTMLCanvasElement | null {
  const key = `fx-star|${color}|${size}`;
  const hit = sprites.get(key);
  if (hit) return hit;
  const img = loadImage(starFxUrl);
  if (!img) return null;
  return remember(key, tint(img, size, color));
}

/** Start loading the images used during play so the first frames already have them. */
export function preloadGameSprites(iconNames: string[]): void {
  if (typeof document === "undefined") return;
  loadImage(starFxUrl);
  for (const n of iconNames) {
    const url = iconUrl(n);
    if (url) loadImage(url);
  }
}

/** Draw a sprite centered at (x, y). */
export function drawSpriteCentered(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number): void {
  ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
}
