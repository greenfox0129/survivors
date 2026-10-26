// ============================================================
//  weapons/AxeWeapon.ts — A heavy double-bitted axe swing.
//  The head sweeps an arc and hits each enemy the picture passes over.
//  The sprite pivots on the player, handle inward, so it reads as a swing.
//  Wider arcs are level effects. From level 7 it spins two full circles
//  in the same direction, without reversing. Evolution keeps that spin
//  and lengthens the reach. Kali's super form, 친우, swings once for
//  triple damage and sends a crescent shockwave from the axe head.
// ============================================================

import { CONFIG } from "@/game/data/config";
import { EVOLUTIONS } from "@/game/data/evolutions";
import type { EnemyState, WeaponInstance, WeaponMods } from "@/game/core/types";
import { damageEnemy } from "@/game/entities/EnemyManager";
import { getIconSprite, getPlainIcon } from "@/game/render/iconSprites";
import { popWeaponFade, pushWeaponFade } from "@/game/core/settings";

const AXE_REACH = 0.45;

/** The ring the axe sprite occupies: from the near edge of the picture to the far edge. */
function axeBand(radius: number): { inner: number; outer: number } {
  const inner = radius * AXE_REACH;
  return { inner, outer: inner + radius };
}

/** 친우 picture: handle at SUPER_REACH, head SUPER_DRAW further out. */
function superBand(radius: number): { inner: number; outer: number } {
  const inner = radius * SUPER_REACH;
  return { inner, outer: inner + radius * SUPER_DRAW };
}
const SWING_TIME = 0.34;
const TWO_PI = Math.PI * 2;
/** 친우 sprite length relative to the swing radius. The normal axe stays at AXE_REACH. */
const SUPER_DRAW = 0.8;
/** 친우 handle distance, as a fraction of the swing radius. Closer than AXE_REACH. */
const SUPER_REACH = 0.2;
/** Shockwave origin sits this far inside the axe head, as a fraction of the swing radius. */
const WAVE_PULL = 0.35;
/** Shockwave is a crescent that flies forward from the axe head. */
const WAVE_SPEED = 920;
const WAVE_MAX = 520;
/** Two equal circles, the rear one set back by WAVE_BITE, leave a moon of that thickness. */
const WAVE_R = 156;
const WAVE_BITE = 92;
const WAVE_CAP = 3;

interface Shockwave {
  x: number;
  y: number;
  angle: number;
  dist: number;
  hitIds: Set<number>;
}

export interface AxeState {
  phase: "cooldown" | "swing";
  timer: number;
  aim: number;
  from: number;
  span: number;
  progress: number;
  swingsDone: number;
  hitIds: Set<number>;
  damage: number;
  cooldown: number;
  radius: number;
  arc: number;
  swingCount: number;
  cachedLevel: number;
  cachedEvolved: boolean;
  cachedSuper: boolean;
  waves: Shockwave[];
  /** This attack already fired its shockwave. */
  waveSent: boolean;
}

export function axeArc(w: WeaponInstance): number {
  if (w.evolved || w.level >= 5) return TWO_PI;
  if (w.level >= 3) return (Math.PI * 4) / 3;
  return Math.PI;
}

export function axeSwingCount(w: WeaponInstance): number {
  if (w.super) return 1;
  if (w.evolved || w.level >= 7) return 2;
  return 1;
}

export function axeDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.axe;
  const evo = w.evolved ? EVOLUTIONS.axe.damageMult : 1;
  const superMult = w.super ? 3 : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo * superMult;
}

export function axeCooldown(w: WeaponInstance): number {
  const d = CONFIG.weapons.axe;
  const evo = w.evolved ? EVOLUTIONS.axe.cooldownMult : 1;
  return d.baseCooldown * Math.pow(d.cooldownGrowth, w.level - 1) * evo;
}

export function axeRadius(w: WeaponInstance): number {
  const d = CONFIG.weapons.axe;
  let radius = d.baseRadius * Math.pow(d.radiusGrowth, w.level - 1);
  if (w.level >= 8) radius *= 1.12;
  if (w.evolved) radius *= 1.2;
  return radius;
}

export function axeLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  if (w.level === 3) return "휘두르는 호 확대";
  if (w.level === 5) return "한 바퀴 휩쓸기";
  if (w.level === 7) return "두 바퀴 회전";
  if (w.level === 8) return "범위 증가";
  return null;
}

export function createAxeState(w: WeaponInstance): AxeState {
  const state: AxeState = {
    phase: "cooldown",
    timer: 0,
    aim: 0,
    from: 0,
    span: 0,
    progress: 0,
    swingsDone: 0,
    hitIds: new Set(),
    damage: 0,
    cooldown: 0,
    radius: 0,
    arc: 0,
    swingCount: 1,
    cachedLevel: -1,
    cachedEvolved: false,
    cachedSuper: false,
    waves: [],
    waveSent: false,
  };
  refreshAxe(state, w);
  return state;
}

function refreshAxe(state: AxeState, w: WeaponInstance): void {
  state.damage = axeDamage(w);
  state.cooldown = axeCooldown(w);
  state.radius = axeRadius(w);
  state.arc = axeArc(w);
  state.swingCount = axeSwingCount(w);
  state.cachedLevel = w.level;
  state.cachedEvolved = w.evolved;
  state.cachedSuper = w.super;
}

function aimAt(enemies: EnemyState[], px: number, py: number, range: number): number {
  let best: EnemyState | null = null;
  let bestD2 = range * range;
  for (const e of enemies) {
    if (!e.alive || e.dying) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const d2 = dx * dx + dy * dy;
    if (d2 >= bestD2) continue;
    bestD2 = d2;
    best = e;
  }
  if (!best) return Math.random() * TWO_PI;
  return Math.atan2(best.y - py, best.x - px);
}

/** True when the sweep moved from `prev` to `cur` across `target` (same direction as the swing). */
function passedAngle(prev: number, cur: number, target: number): boolean {
  let travel = cur - prev;
  travel = ((travel % TWO_PI) + TWO_PI) % TWO_PI;
  if (travel === 0) return false;
  let rel = target - prev;
  rel = ((rel % TWO_PI) + TWO_PI) % TWO_PI;
  return rel === 0 || (rel > 0 && rel <= travel + 1e-4);
}

/** Where the crescent spawns: inside the axe head, so the moon leaves closer to Kali. */
function waveStart(state: AxeState, px: number, py: number, angle: number): { x: number; y: number } {
  const tip = state.radius * (SUPER_REACH + SUPER_DRAW);
  const dist = Math.max(0, tip - state.radius * WAVE_PULL);
  return { x: px + Math.cos(angle) * dist, y: py + Math.sin(angle) * dist };
}

function spawnWave(state: AxeState, x: number, y: number, angle: number): void {
  if (state.waves.length >= WAVE_CAP) return;
  state.waves.push({ x, y, angle, dist: 0, hitIds: new Set() });
}

/** Outer circle and the circle that bites it. `chord` is how far the trailing tips have flown. */
function crescentCenters(wave: Shockwave, chord: number): { ax: number; ay: number; bx: number; by: number } {
  const ux = Math.cos(wave.angle);
  const uy = Math.sin(wave.angle);
  const ax = wave.x + ux * (chord + WAVE_BITE / 2);
  const ay = wave.y + uy * (chord + WAVE_BITE / 2);
  return { ax, ay, bx: ax - ux * WAVE_BITE, by: ay - uy * WAVE_BITE };
}

function crescentHits(wave: Shockwave, chord: number, e: EnemyState): boolean {
  const { ax, ay, bx, by } = crescentCenters(wave, chord);
  if (Math.hypot(e.x - ax, e.y - ay) > WAVE_R + e.radius) return false;
  return Math.hypot(e.x - bx, e.y - by) >= WAVE_R - e.radius;
}

function advanceWaves(
  state: AxeState,
  enemies: EnemyState[],
  damage: number,
  critChance: number | undefined,
  onKill: () => void,
  dt: number,
): void {
  let i = 0;
  while (i < state.waves.length) {
    const wave = state.waves[i];
    const prev = wave.dist;
    wave.dist = Math.min(WAVE_MAX, wave.dist + WAVE_SPEED * dt);
    for (const e of enemies) {
      if (!e.alive || e.dying || wave.hitIds.has(e.id)) continue;
      let hit = false;
      for (let d = prev; d < wave.dist && !hit; d += WAVE_BITE / 2) hit = crescentHits(wave, d, e);
      if (!hit) hit = crescentHits(wave, wave.dist, e);
      if (!hit) continue;
      wave.hitIds.add(e.id);
      if (damageEnemy(e, damage, critChance)) onKill();
    }
    if (wave.dist >= WAVE_MAX) state.waves.splice(i, 1);
    else i++;
  }
}

function renderWave(ctx: CanvasRenderingContext2D, wave: Shockwave): void {
  const { ax, ay, bx, by } = crescentCenters(wave, wave.dist);
  const alpha = Math.acos(WAVE_BITE / (2 * WAVE_R));
  const horn0 = wave.angle + Math.PI + alpha;
  const horn1 = wave.angle + Math.PI - alpha;
  ctx.beginPath();
  ctx.arc(ax, ay, WAVE_R, horn0, horn1);
  ctx.arc(bx, by, WAVE_R, wave.angle + alpha, wave.angle - alpha, true);
  ctx.closePath();
  ctx.fillStyle = CONFIG.weapons.axe.color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ax, ay, WAVE_R, horn0, horn1);
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function beginSwing(state: AxeState): void {
  // Later laps continue past the end of the previous one, same direction.
  state.from = state.aim - state.arc / 2 + state.arc * state.swingsDone;
  state.span = state.arc;
  state.progress = 0;
  state.hitIds.clear();
  state.phase = "swing";
}

/** Progress of `angle` along a sweep that starts at `from` and travels `span`. Outside the wedge returns null. */
function sweepProgress(angle: number, from: number, span: number): number | null {
  let rel = angle - from;
  rel = ((rel % TWO_PI) + TWO_PI) % TWO_PI;
  if (span >= 0) {
    const full = span >= TWO_PI - 1e-4;
    if (!full && rel > span + 1e-4) return null;
    return span === 0 ? 0 : rel / span;
  }
  rel = rel === 0 ? 0 : rel - TWO_PI;
  const full = span <= -TWO_PI + 1e-4;
  if (!full && rel < span - 1e-4) return null;
  return rel / span;
}

function applySweep(
  state: AxeState,
  enemies: EnemyState[],
  px: number,
  py: number,
  prev: number,
  cur: number,
  damage: number,
  critChance: number | undefined,
  onKill: () => void,
  band: { inner: number; outer: number },
): void {
  for (const e of enemies) {
    if (!e.alive || e.dying || state.hitIds.has(e.id)) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist + e.radius < band.inner || dist - e.radius > band.outer) continue;
    const along = sweepProgress(Math.atan2(dy, dx), state.from, state.span);
    if (along === null) continue;
    if (along < prev - 1e-4 || along > cur + 1e-4) continue;
    state.hitIds.add(e.id);
    if (damageEnemy(e, damage, critChance)) onKill();
  }
}

export function updateAxe(
  state: AxeState,
  enemies: EnemyState[],
  px: number,
  py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods,
): void {
  if (state.cachedLevel !== w.level || state.cachedEvolved !== w.evolved || state.cachedSuper !== w.super) refreshAxe(state, w);

  const dmg = state.damage * (mods?.damageMult ?? 1);
  const cdMult = mods?.cooldownMult ?? 1;

  if (state.phase === "cooldown") {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.aim = aimAt(enemies, px, py, axeBand(state.radius).outer + 40);
      state.swingsDone = 0;
      state.waveSent = false;
      beginSwing(state);
    }
  }

  advanceWaves(state, enemies, dmg, mods?.critChance, onKill, dt);
  if (state.phase !== "swing") return;
  const prev = state.progress;
  state.progress = Math.min(1, state.progress + dt / SWING_TIME);
  if (w.super && !state.waveSent) {
    const before = state.from + state.span * prev;
    const after = state.from + state.span * state.progress;
    if (passedAngle(before, after, state.aim)) {
      const start = waveStart(state, px, py, state.aim);
      spawnWave(state, start.x, start.y, state.aim);
      state.waveSent = true;
    }
  }
  applySweep(state, enemies, px, py, prev, state.progress, dmg, mods?.critChance, onKill, w.super ? superBand(state.radius) : axeBand(state.radius));
  if (state.progress < 1) return;
  state.swingsDone++;
  if (state.swingsDone < state.swingCount) {
    beginSwing(state);
    return;
  }
  state.phase = "cooldown";
  state.timer = state.cooldown * cdMult;
}

export function renderAxe(
  ctx: CanvasRenderingContext2D,
  state: AxeState,
  px: number,
  py: number,
  w: WeaponInstance,
): void {
  if (state.waves.length > 0 && pushWeaponFade(ctx, "axeWave")) {
    try {
      for (const wave of state.waves) renderWave(ctx, wave);
    } finally {
      popWeaponFade(ctx);
    }
  }
  if (state.phase !== "swing") return;
  if (!pushWeaponFade(ctx, "axe")) return;
  try {
  const color = CONFIG.weapons.axe.color;
  const angle = state.from + state.span * state.progress;
  const length = state.radius;
  if (w.super) {
    const img = getPlainIcon("weapon-axe-super");
    if (img) {
      const height = length * SUPER_DRAW;
      const width = height * (img.naturalWidth / img.naturalHeight);
      const reach = length * SUPER_REACH;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.translate(0, -reach - height / 2);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
      ctx.imageSmoothingEnabled = smoothing;
      return;
    }
  }
  const icon = getIconSprite("weapon-axe", color, length);
  const drawn = icon ? icon.height : length;
  const { inner: reach } = axeBand(state.radius);

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle + Math.PI / 2);
  ctx.translate(0, -reach);
  if (icon) {
    ctx.translate(0, -icon.height / 2);
    ctx.rotate(Math.PI * 7 / 4);
    ctx.drawImage(icon, -icon.width / 2, -icon.height / 2, icon.width, icon.height);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(-7, -drawn, 14, drawn);
    ctx.fillRect(-26, -drawn, 52, 18);
  }
  ctx.restore();
  } finally {
    popWeaponFade(ctx);
  }
}
