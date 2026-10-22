// ============================================================
//  render/iconSprites.ts — pre-tinted image sprites for the canvas.
//
//  SVG icons (src/assets/icons) and FX textures (src/assets/fx, Kenney CC0) are
//  loaded lazily, tinted once into an offscreen canvas per (image, color, size)
//  and reused with a single drawImage per frame. Nothing here touches the DOM at
//  import time, so game modules stay importable in Node (scripts/sim.mjs).
// ============================================================

import { iconUrl } from "@/assets/icons";

const fxFiles = import.meta.glob("../../assets/fx/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const FX_URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(fxFiles)) {
  FX_URLS[path.slice(path.lastIndexOf("/") + 1, -".png".length)] = url;
}

/** Kenney FX texture names available in src/assets/fx */
export type FxName = "star" | "fire_01" | "flame_01" | "light_02" | "scorch_02" | "spark_04" | "muzzle_02";

const images = new Map<string, HTMLImageElement>();
const sprites = new Map<string, HTMLCanvasElement>();
const MAX_SPRITES = 256;

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
 * Icon tinted with `color`, optionally with a 1px `outline` so it reads on any background.
 * Returns null until the image has loaded (callers draw a fallback meanwhile).
 */
export function getIconSprite(
  name: string,
  color: string,
  size: number,
  outline: string | null = "#0a0a12",
): HTMLCanvasElement | null {
  const px = Math.max(4, Math.round(size));
  const key = `icon|${name}|${color}|${px}|${outline}`;
  const hit = sprites.get(key);
  if (hit) return hit;
  const url = iconUrl(name);
  if (!url) return null;
  const img = loadImage(url);
  if (!img) return null;

  const pad = outline ? 2 : 0;
  const cv = document.createElement("canvas");
  cv.width = px + pad * 2;
  cv.height = px + pad * 2;
  const g = cv.getContext("2d");
  if (g) {
    if (outline) {
      const edge = tint(img, px, outline);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
        g.drawImage(edge, pad + dx, pad + dy);
      }
    }
    g.drawImage(tint(img, px, color), pad, pad);
  }
  return remember(key, cv);
}

/** Kenney FX texture (white alpha source) tinted with `color`. */
export function getFxSprite(name: FxName, color: string, size = 64): HTMLCanvasElement | null {
  const key = `fx|${name}|${color}|${size}`;
  const hit = sprites.get(key);
  if (hit) return hit;
  const url = FX_URLS[name];
  if (!url) return null;
  const img = loadImage(url);
  if (!img) return null;
  return remember(key, tint(img, size, color));
}

/** Back-compat helper for the kill pop. */
export function getStarFxSprite(color: string, size = 48): HTMLCanvasElement | null {
  return getFxSprite("star", color, size);
}

/** Full-color icon (PNG), drawn as-is. Null until it has loaded, or in Node. */
export function getPlainIcon(name: string): HTMLImageElement | null {
  if (typeof document === "undefined") return null;
  const url = iconUrl(name);
  if (!url) return null;
  return loadImage(url);
}

/** Start loading images used during play so the first frames already have them. */
export function preloadGameSprites(iconNames: string[]): void {
  if (typeof document === "undefined") return;
  for (const url of Object.values(FX_URLS)) loadImage(url);
  for (const n of iconNames) {
    const url = iconUrl(n);
    if (url) loadImage(url);
  }
}

/** Draw a sprite centered at (x, y). */
export function drawSpriteCentered(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number): void {
  ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
}

/** Draw a sprite centered at (x, y), rotated by `angle` radians, scaled to `size` px. */
export function drawSpriteRotated(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  angle: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}
