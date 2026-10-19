// ============================================================
//  render/tileWorld.ts — top-down pixel-art field for the infinite world
//  (high quality only; low quality keeps background.ts grid + decor.ts).
//
//  The world is cut into chunks of 16×16 tiles. Each chunk is generated from a
//  deterministic hash of its coordinates (same place → same look when you walk
//  back), painted ONCE into a 256×256 offscreen canvas at the tiles' native 16px,
//  and then drawn with a single scaled drawImage per visible chunk per frame
//  (4–6 drawImage calls total). LRU cache keeps memory bounded (~6 MB).
//
//  Layers inside a chunk: grass (+tufts) → dirt clearings (9-slice) → tall grass
//  patches → small details/flowers → rocks/stumps → trees. Everything is ground
//  decoration: no collision, always drawn under gems/enemies/player.
//  Tile coordinates are (column, row) in the 16px grid of each sheet.
// ============================================================

import { CONFIG } from "@/game/data/config";
import { getPixelImage, drawTiles } from "@/game/render/pixel";

/** World pixels per source pixel for the ground (16px tile → 32px). */
export const WORLD_PX = 2;
const CT = 16; // tiles per chunk side
const CHUNK_SRC = CT * 16; // 256 source px
const CHUNK_WORLD = CHUNK_SRC * WORLD_PX; // 512 world px
const MAX_CHUNKS = 24;

type Rect = readonly [c: number, r: number, w: number, h: number];

// ---- tiles/floor.png ---- (the sheet has a light-green half at column 0 and a
// dark-green half at column 11 with the same layout; G picks one)
const G = 11;
const GRASS: readonly [number, number] = [G, 12];
const GRASS_TUFTS: ReadonlyArray<readonly [number, number]> = [[G + 1, 12], [G + 2, 12], [G + 3, 12], [G + 4, 12]];
const DIRT_9: readonly [number, number] = [G, 7]; // top-left of a 3×3 rounded dirt patch

// ---- tiles/nature.png ----
const TALL_GRASS: ReadonlyArray<readonly [number, number]> = [[3, 10], [4, 10], [8, 10], [9, 10]];
const FLOWERS: ReadonlyArray<readonly [number, number]> = [[0, 11], [1, 11], [3, 11], [6, 11], [2, 11]];
const SMALL_THINGS: ReadonlyArray<readonly [number, number]> = [
  [0, 10], [1, 10], [2, 10], [5, 10], [6, 10], [10, 10], // bushes / tufts
  [12, 13], [13, 13], // stumps
  [15, 18], [16, 18], [17, 18], [18, 18], // pebbles
];
/** Multi-tile objects with a weight (common greens first). */
const OBJECTS: ReadonlyArray<readonly [Rect, number]> = [
  [[16, 0, 2, 2], 6], [[18, 0, 2, 2], 6], [[6, 8, 2, 2], 5], [[0, 0, 2, 2], 4], [[2, 0, 2, 2], 4],
  [[3, 18, 3, 3], 4], [[0, 18, 3, 3], 2], [[9, 18, 3, 3], 2],
  [[4, 2, 4, 3], 2], [[16, 2, 4, 3], 2], [[20, 2, 4, 3], 2], [[0, 2, 4, 3], 2],
  [[4, 0, 2, 2], 1], [[0, 8, 2, 2], 2], [[2, 8, 2, 2], 2],
];
const OBJECT_WEIGHT = OBJECTS.reduce((s, [, w]) => s + w, 0);

// ---- tiles/detail.png ----
const DETAILS: ReadonlyArray<readonly [number, number]> = [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]];
const BONES: ReadonlyArray<readonly [number, number]> = [[13, 0], [14, 0]];

function hash(cx: number, cy: number): number {
  let h = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ 0x5bd1e995) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32 — tiny deterministic PRNG */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, HTMLCanvasElement>();

function buildChunk(cx: number, cy: number, floor: HTMLImageElement, nature: HTMLImageElement, detail: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = CHUNK_SRC;
  cv.height = CHUNK_SRC;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.imageSmoothingEnabled = false;
  const R = rng(hash(cx, cy));
  const pick = <T,>(arr: ReadonlyArray<T>): T => arr[Math.floor(R() * arr.length)];
  const used = new Uint8Array(CT * CT);
  const free = (c: number, r: number, w: number, h: number): boolean => {
    if (c < 0 || r < 0 || c + w > CT || r + h > CT) return false;
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (used[y * CT + x]) return false;
    return true;
  };
  const mark = (c: number, r: number, w: number, h: number): void => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) used[y * CT + x] = 1;
  };

  // 1) grass with sparse tufts
  for (let y = 0; y < CT; y++) {
    for (let x = 0; x < CT; x++) {
      const [tc, tr] = R() < 0.14 ? pick(GRASS_TUFTS) : GRASS;
      drawTiles(g, floor, tc, tr, 1, 1, x * 16, y * 16);
    }
  }

  // 2) dirt clearings (rounded 9-slice), 0–2 per chunk
  const clearings = R() < 0.75 ? (R() < 0.35 ? 2 : 1) : 0;
  for (let i = 0; i < clearings; i++) {
    const w = 3 + Math.floor(R() * 4);
    const h = 3 + Math.floor(R() * 3);
    const c = Math.floor(R() * (CT - w));
    const r = Math.floor(R() * (CT - h));
    if (!free(c, r, w, h)) continue;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = x === 0 ? 0 : x === w - 1 ? 2 : 1;
        const sy = y === 0 ? 0 : y === h - 1 ? 2 : 1;
        drawTiles(g, floor, DIRT_9[0] + sx, DIRT_9[1] + sy, 1, 1, (c + x) * 16, (r + y) * 16);
      }
    }
    mark(c, r, w, h);
    // a bone pile now and then — survivors flavour
    if (R() < 0.25) drawTiles(g, detail, ...pick(BONES), 1, 1, (c + 1 + Math.floor(R() * (w - 2))) * 16, (r + 1) * 16);
  }

  // 3) tall-grass patch (Pokémon style), one tuft type per patch
  if (R() < 0.55) {
    const w = 3 + Math.floor(R() * 3);
    const h = 2 + Math.floor(R() * 2);
    const c = Math.floor(R() * (CT - w));
    const r = Math.floor(R() * (CT - h));
    if (free(c, r, w, h)) {
      const [tc, tr] = pick(TALL_GRASS);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) drawTiles(g, nature, tc, tr, 1, 1, (c + x) * 16, (r + y) * 16);
      mark(c, r, w, h);
    }
  }

  // 4) tiny ground details + flowers (no occupancy needed, but avoid dirt/patches)
  const details = 6 + Math.floor(R() * 8);
  for (let i = 0; i < details; i++) {
    const c = Math.floor(R() * CT);
    const r = Math.floor(R() * CT);
    if (!free(c, r, 1, 1)) continue;
    const flower = R() < 0.45;
    const [tc, tr] = flower ? pick(FLOWERS) : pick(DETAILS);
    drawTiles(g, flower ? nature : detail, tc, tr, 1, 1, c * 16, r * 16);
    if (flower && R() < 0.5 && free(c + 1, r, 1, 1)) drawTiles(g, nature, tc, tr, 1, 1, (c + 1) * 16, r * 16);
  }

  // 5) rocks / bushes / stumps
  const smalls = 2 + Math.floor(R() * 4);
  for (let i = 0; i < smalls; i++) {
    const c = Math.floor(R() * CT);
    const r = Math.floor(R() * CT);
    if (!free(c, r, 1, 1)) continue;
    drawTiles(g, nature, ...pick(SMALL_THINGS), 1, 1, c * 16, r * 16);
    mark(c, r, 1, 1);
  }

  // 6) trees and big objects (rows top→bottom so lower ones overlap upper ones)
  const placed: Array<[Rect, number, number]> = [];
  const objects = 1 + Math.floor(R() * 3);
  for (let i = 0; i < objects; i++) {
    let roll = R() * OBJECT_WEIGHT;
    let rect: Rect = OBJECTS[0][0];
    for (const [o, w] of OBJECTS) {
      roll -= w;
      if (roll <= 0) { rect = o; break; }
    }
    for (let tries = 0; tries < 6; tries++) {
      const c = Math.floor(R() * (CT - rect[2] + 1));
      const r = Math.floor(R() * (CT - rect[3] + 1));
      if (!free(c, r, rect[2], rect[3])) continue;
      mark(c, r, rect[2], rect[3]);
      placed.push([rect, c, r]);
      break;
    }
  }
  placed.sort((a, b) => a[2] + a[0][3] - (b[2] + b[0][3]));
  for (const [[sc, sr, w, h], c, r] of placed) drawTiles(g, nature, sc, sr, w, h, c * 16, r * 16);

  return cv;
}

function getChunk(cx: number, cy: number, floor: HTMLImageElement, nature: HTMLImageElement, detail: HTMLImageElement): HTMLCanvasElement {
  const key = `${cx},${cy}`;
  const hit = cache.get(key);
  if (hit) {
    // refresh LRU position
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const cv = buildChunk(cx, cy, floor, nature, detail);
  if (cache.size >= MAX_CHUNKS) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, cv);
  return cv;
}

/**
 * Paint the field in screen space. camX/camY = world coords of the screen's top-left
 * (round them for crisp pixels). Returns false while the tile sheets are still loading
 * (caller then draws the plain background for this frame).
 */
export function drawTileWorld(ctx: CanvasRenderingContext2D, camX: number, camY: number): boolean {
  const floor = getPixelImage("tiles/floor");
  const nature = getPixelImage("tiles/nature");
  const detail = getPixelImage("tiles/detail");
  if (!floor || !nature || !detail) return false;
  const x0 = Math.floor(camX / CHUNK_WORLD);
  const y0 = Math.floor(camY / CHUNK_WORLD);
  const x1 = Math.floor((camX + CONFIG.canvasWidth) / CHUNK_WORLD);
  const y1 = Math.floor((camY + CONFIG.canvasHeight) / CHUNK_WORLD);
  ctx.imageSmoothingEnabled = false;
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const chunk = getChunk(cx, cy, floor, nature, detail);
      ctx.drawImage(chunk, cx * CHUNK_WORLD - camX, cy * CHUNK_WORLD - camY, CHUNK_WORLD, CHUNK_WORLD);
    }
  }
  ctx.imageSmoothingEnabled = true;
  return true;
}

/** Drop cached chunks (e.g. when a run ends) — they are rebuilt on demand. */
export function resetTileWorld(): void {
  cache.clear();
}
