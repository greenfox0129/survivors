// ============================================================
//  weapons/FistWeapon.ts — Short combo of punches at the nearest enemy.
//  Each jab hits once. The evolved form follows the combo with one wide hit.
// ============================================================

import { CONFIG } from "@/game/data/config";
import { EVOLUTIONS } from "@/game/data/evolutions";
import type { EnemyState, WeaponInstance, WeaponMods } from "@/game/core/types";
import { damageEnemy } from "@/game/entities/EnemyManager";
import { drawSpriteCentered, getIconSprite } from "@/game/render/iconSprites";

const JAB_GAP = CONFIG.weapons.fist.jabInterval;
const FINISHER_WINDUP = 0.16;
const FINISHER_DAMAGE_MULT = CONFIG.weapons.fist.finisherMult;
const JAB_CONE = 0.7;
const FINISHER_CONE = 1.2;
const SHOW_TIME = 0.1;

export interface FistState {
  phase: "jab" | "gap" | "windup" | "cooldown";
  timer: number;
  jabsLeft: number;
  aim: number;
  show: number;
  finisherShown: boolean;
  hitX: number;
  hitY: number;
  hitR: number;
  damage: number;
  cooldown: number;
  reach: number;
  hitRadius: number;
  jabCount: number;
  cachedLevel: number;
  cachedEvolved: boolean;
}

export function fistJabCount(w: WeaponInstance): number {
  if (w.level >= 8) return 6;
  if (w.level >= 7) return 5;
  if (w.level >= 5) return 4;
  if (w.level >= 3) return 3;
  return CONFIG.weapons.fist.baseJabCount;
}

export function fistDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.fist;
  const evo = w.evolved ? EVOLUTIONS.fist.damageMult : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo;
}

export function fistCooldown(w: WeaponInstance): number {
  const d = CONFIG.weapons.fist;
  const evo = w.evolved ? EVOLUTIONS.fist.cooldownMult : 1;
  return d.baseCooldown * Math.pow(d.cooldownGrowth, w.level - 1) * evo;
}

export function fistReach(w: WeaponInstance): number {
  const d = CONFIG.weapons.fist;
  return d.baseReach * Math.pow(d.reachGrowth, w.level - 1);
}

export function fistHitRadius(w: WeaponInstance): number {
  const d = CONFIG.weapons.fist;
  return d.baseHitRadius * (w.level >= 6 ? 1.2 : 1);
}

export function fistLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 3) return "3연타";
  if (lv === 5) return "4연타";
  if (lv === 6) return "타격 범위 증가";
  if (lv === 7) return "5연타";
  if (lv === 8) return "6연타";
  return null;
}

export function createFistState(w: WeaponInstance): FistState {
  const state: FistState = {
    phase: "cooldown",
    timer: 0,
    jabsLeft: 0,
    aim: 0,
    show: 0,
    finisherShown: false,
    hitX: 0,
    hitY: 0,
    hitR: 0,
    damage: 0,
    cooldown: 0,
    reach: 0,
    hitRadius: 0,
    jabCount: 2,
    cachedLevel: -1,
    cachedEvolved: false,
  };
  refreshFist(state, w);
  return state;
}

function refreshFist(state: FistState, w: WeaponInstance): void {
  state.damage = fistDamage(w);
  state.cooldown = fistCooldown(w);
  state.reach = fistReach(w);
  state.hitRadius = fistHitRadius(w);
  state.jabCount = fistJabCount(w);
  state.cachedLevel = w.level;
  state.cachedEvolved = w.evolved;
}

function aimAt(enemies: EnemyState[], px: number, py: number, range: number, fallback: number): number {
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
  if (!best) return fallback;
  return Math.atan2(best.y - py, best.x - px);
}

function strike(
  state: FistState,
  enemies: EnemyState[],
  px: number,
  py: number,
  reach: number,
  hitRadius: number,
  cone: number,
  damage: number,
  finisher: boolean,
  critChance: number | undefined,
  onKill: () => void,
): void {
  state.aim = aimAt(enemies, px, py, reach + 70, state.aim);
  state.hitX = px + Math.cos(state.aim) * reach * 0.72;
  state.hitY = py + Math.sin(state.aim) * reach * 0.72;
  state.hitR = finisher ? hitRadius * 1.7 : hitRadius;
  state.show = SHOW_TIME;
  state.finisherShown = finisher;
  const maxR = reach + (finisher ? hitRadius * 0.8 : 0);
  for (const e of enemies) {
    if (!e.alive || e.dying) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const collide = maxR + e.radius;
    if (dx * dx + dy * dy >= collide * collide) continue;
    let delta = Math.atan2(dy, dx) - state.aim;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    if (Math.abs(delta) > cone) continue;
    if (damageEnemy(e, damage, critChance)) onKill();
  }
}

export function updateFist(
  state: FistState,
  enemies: EnemyState[],
  px: number,
  py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods,
): void {
  if (state.cachedLevel !== w.level || state.cachedEvolved !== w.evolved) refreshFist(state, w);
  if (state.show > 0) state.show -= dt;

  const dmgMult = mods?.damageMult ?? 1;
  const cdMult = mods?.cooldownMult ?? 1;
  const dmg = state.damage * dmgMult;

  if (state.phase === "cooldown") {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.jabsLeft = state.jabCount;
      state.phase = "jab";
    }
  } else if (state.phase === "gap") {
    state.timer -= dt;
    if (state.timer <= 0) state.phase = "jab";
  } else if (state.phase === "windup") {
    state.timer -= dt;
    if (state.timer <= 0) {
      strike(state, enemies, px, py, state.reach * 1.35, state.hitRadius, FINISHER_CONE, dmg * FINISHER_DAMAGE_MULT, true, mods?.critChance, onKill);
      state.phase = "cooldown";
      state.timer = state.cooldown * cdMult;
    }
  }

  if (state.phase !== "jab") return;
  strike(state, enemies, px, py, state.reach, state.hitRadius, JAB_CONE, dmg, false, mods?.critChance, onKill);
  state.jabsLeft--;
  if (state.jabsLeft > 0) {
    state.phase = "gap";
    state.timer = JAB_GAP;
  } else if (w.evolved) {
    state.phase = "windup";
    state.timer = FINISHER_WINDUP;
  } else {
    state.phase = "cooldown";
    state.timer = state.cooldown * cdMult;
  }
}

export function renderFist(ctx: CanvasRenderingContext2D, state: FistState): void {
  if (state.show <= 0) return;
  const size = state.hitR * 2;
  const icon = getIconSprite("weapon-fist", CONFIG.weapons.fist.color, size);
  if (icon) drawSpriteCentered(ctx, icon, state.hitX, state.hitY);
}
