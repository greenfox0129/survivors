// ============================================================
//  weapons/BreathWeapon.ts — Frontal flame cone (evolved claw)
//  Fires a sustained breath of flame in the facing direction,
//  damaging all enemies within a cone. Leaves a burn DoT.
//  Evolved weapons are final form — no level scaling.
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { BreathState, EnemyState, WeaponInstance } from "@/game/core/types";
import { findNearestEnemy, damageEnemy } from "@/game/entities/EnemyManager";
import type { WeaponMods } from "@/game/core/types";
import { EVOLUTIONS } from "@/game/data/evolutions";
import { isLowQuality } from "@/game/render/quality";

const BURN_DURATION = 3.0;
const BURN_TICK_INTERVAL = 0.5;
const BREATH_DURATION = 0.8;
const TICK_INTERVAL = 0.12;

export function createBreathState(_w: WeaponInstance): BreathState {
  const clawD = CONFIG.weapons.claw;
  const evo = EVOLUTIONS.claw;
  const baseDamage =
    clawD.baseDamage * Math.pow(clawD.damageGrowth, 7) * (evo.damageMult ?? 1);
  const baseCooldown =
    clawD.baseCooldown *
    Math.pow(clawD.cooldownGrowth, 7) *
    (evo.cooldownMult ?? 1);
  const state: BreathState = {
    range: clawD.baseRadius * 2.6,
    coneAngle: Math.PI * 0.06,
    damage: baseDamage,
    cooldown: baseCooldown,
    cooldownTimer: 0,
    breathTimer: 0,
    breathDuration: BREATH_DURATION,
    breathActive: false,
    facing: 0,
    tickInterval: TICK_INTERVAL,
    tickTimer: 0,
    hitTimers: new Map(),
    enemyBurns: new Map(),
    cachedLevel: 0,
  };
  return state;
}

export function breathDamage(_w: WeaponInstance): number {
  const clawD = CONFIG.weapons.claw;
  const evo = EVOLUTIONS.claw;
  return clawD.baseDamage * Math.pow(clawD.damageGrowth, 7) * (evo.damageMult ?? 1);
}

export function breathRange(_w: WeaponInstance): number {
  return CONFIG.weapons.claw.baseRadius * 2.6;
}

export function resetBreath(): void {
  // Breath state is recreated on evolve/reset, so nothing module-level to clear.
}

export function updateBreath(
  state: BreathState,
  enemies: EnemyState[],
  px: number,
  py: number,
  _w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods
): void {
  const dmgMult = mods?.damageMult ?? 1;
  const cdMult = mods?.cooldownMult ?? 1;

  processBurns(state, enemies, dt, onKill);

  if (state.breathActive) {
    state.breathTimer += dt;
    state.tickTimer += dt;

    if (state.tickTimer >= state.tickInterval) {
      state.tickTimer = 0;
      const dmg = state.damage * dmgMult;
      const cosCone = Math.cos(state.coneAngle);
      const range2 = state.range * state.range;
      const fx = Math.cos(state.facing);
      const fy = Math.sin(state.facing);
      for (const e of enemies) {
        if (!e.alive || e.dying) continue;
        const dx = e.x - px;
        const dy = e.y - py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > range2) continue;
        const dist = Math.sqrt(dist2) || 1;
        const dot = (dx / dist) * fx + (dy / dist) * fy;
        if (dot < cosCone) continue;
        if (damageEnemy(e, dmg, mods?.critChance)) onKill();
        state.enemyBurns.set(e.id, {
          timer: BURN_DURATION,
          tickTimer: 0,
          damage: dmg * 0.25,
        });
      }
    }

    if (state.breathTimer >= state.breathDuration) {
      state.breathActive = false;
      state.breathTimer = 0;
      state.tickTimer = 0;
      state.cooldownTimer = state.cooldown * cdMult;
    }
    return;
  }

  state.cooldownTimer -= dt;
  if (state.cooldownTimer <= 0) {
    state.breathActive = true;
    state.breathTimer = 0;
    state.tickTimer = 0;
    const target = findNearestEnemy(enemies, px, py, state.range + 80);
    if (target) {
      state.facing = Math.atan2(target.y - py, target.x - px);
    } else {
      state.facing = Math.random() * Math.PI * 2;
    }
  }
}

function processBurns(
  state: BreathState,
  enemies: EnemyState[],
  dt: number,
  onKill: () => void
): void {
  for (const [eid, burn] of state.enemyBurns) {
    burn.timer -= dt;
    burn.tickTimer += dt;
    if (burn.timer <= 0) {
      state.enemyBurns.delete(eid);
      continue;
    }
    if (burn.tickTimer >= BURN_TICK_INTERVAL) {
      burn.tickTimer = 0;
      const e = enemies.find((en) => en.id === eid && en.alive);
      if (e) {
        if (damageEnemy(e, burn.damage)) onKill();
      } else {
        state.enemyBurns.delete(eid);
      }
    }
  }
}

export function renderBreath(
  ctx: CanvasRenderingContext2D,
  state: BreathState,
  px: number,
  py: number
): void {
  if (!state.breathActive) {
    const color = CONFIG.weapons.claw.color;
    ctx.strokeStyle = color + "08";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, state.range, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  const t = state.breathTimer / state.breathDuration;
  const alpha = Math.sin(Math.PI * t) * 0.95;
  const fx = Math.cos(state.facing);
  const fy = Math.sin(state.facing);
  const ex = px + fx * state.range;
  const ey = py + fy * state.range;
  const halfWidth = 18;
  const coreHalfWidth = 7;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";

  // Glow halo — a wide translucent stroke instead of shadowBlur
  // (shadowBlur는 매 프레임 블러를 재계산해 저사양 GPU에서 매우 비싸다)
  ctx.strokeStyle = "rgba(255, 106, 26, 0.22)";
  ctx.lineWidth = halfWidth * 2.4;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Beam body
  const beamGrad = ctx.createLinearGradient(px, py, ex, ey);
  beamGrad.addColorStop(0, "rgba(255, 240, 180, 0.95)");
  beamGrad.addColorStop(0.4, "rgba(255, 170, 40, 0.9)");
  beamGrad.addColorStop(1, "rgba(255, 80, 10, 0.15)");
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = halfWidth;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Inner hot core
  const coreGrad = ctx.createLinearGradient(px, py, ex, ey);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
  coreGrad.addColorStop(0.6, "rgba(255, 240, 180, 0.85)");
  coreGrad.addColorStop(1, "rgba(255, 216, 77, 0)");
  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = coreHalfWidth * 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Flickering core highlight (decoration — skipped in low quality)
  if (!isLowQuality()) {
    ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Muzzle flash + impact flare (reuse single radial approach)
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255, 216, 77, 0.8)";
  ctx.beginPath();
  ctx.arc(px, py, halfWidth * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 200, 120, 0.6)";
  ctx.beginPath();
  ctx.arc(ex, ey, halfWidth * 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
