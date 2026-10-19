// ============================================================
//  weapons/MeleeWeapon.ts — Orbiting blade around player
// ============================================================

import { CONFIG } from "../config";
import type { EnemyState, MeleeBlade, WeaponInstance } from "../types";
import { damageEnemy } from "../EnemyManager";
import type { WeaponMods } from "../WeaponManager";
import { EVOLUTIONS } from "./evolutions";

export function createMeleeBlades(w: WeaponInstance): MeleeBlade[] {
  const count = meleeBladeCount(w);
  const speed = meleeAngularSpeed(w);
  const blades: MeleeBlade[] = [];
  for (let i = 0; i < count; i++) {
    blades.push({
      angle: (i / count) * Math.PI * 2,
      angularSpeed: speed,
      hitTimers: new Map(),
    });
  }
  return blades;
}

// Blade count: 1 base, +1 every 2 levels (max 4 at Lv7, +1 at Lv8 = 5)
export function meleeBladeCount(w: WeaponInstance): number {
  const d = CONFIG.weapons.melee;
  const base = d.baseBladeCount + Math.floor((w.level - 1) / 2);
  if (w.level >= 8) return base + 1; // bonus blade at max
  return base;
}

// Angular speed: faster at Lv4 and Lv8
export function meleeAngularSpeed(w: WeaponInstance): number {
  if (w.evolved) return 8.0;
  let speed = 2.5;
  if (w.level >= 4) speed = 3.2;
  if (w.level >= 8) speed = 4.0;
  return speed;
}

export function meleeDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.melee;
  const evo = w.evolved ? EVOLUTIONS.melee.damageMult : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo;
}

export function meleeBladeRadius(w: WeaponInstance): number {
  const d = CONFIG.weapons.melee;
  return d.baseBladeRadius * Math.pow(d.bladeRadiusGrowth, w.level - 1);
}

// Blade size: bigger at Lv6+
export function meleeBladeSize(w: WeaponInstance): number {
  const base = CONFIG.weapons.melee.baseBladeSize;
  if (w.evolved) return base * 1.5;
  if (w.level >= 6) return base * 1.4;
  return base;
}

// Level-up special effect description
export function meleeLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 3) return "칼날 +1개";
  if (lv === 4) return "회전 속도 증가";
  if (lv === 5) return "칼날 +1개";
  if (lv === 6) return "칼날 크기 증가";
  if (lv === 7) return "칼날 +1개";
  if (lv === 8) return "칼날 +1개 · 최대 회전 속도";
  return null;
}

export function updateMelee(
  blades: MeleeBlade[],
  enemies: EnemyState[],
  px: number, py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods
): void {
  const dmgMult = mods?.damageMult ?? 1;
  const orbitR = meleeBladeRadius(w);
  const size = meleeBladeSize(w);
  const dmg = meleeDamage(w) * dmgMult;
  const hitCd = CONFIG.weapons.melee.hitCooldown;

  for (const blade of blades) {
    blade.angle += blade.angularSpeed * dt;

    const bx = px + Math.cos(blade.angle) * orbitR;
    const by = py + Math.sin(blade.angle) * orbitR;

    // Decrement hit timers
    for (const [eid, t] of blade.hitTimers) {
      const nt = t - dt;
      if (nt <= 0) blade.hitTimers.delete(eid);
      else blade.hitTimers.set(eid, nt);
    }

    // Check collisions
    for (const e of enemies) {
      if (!e.alive || blade.hitTimers.has(e.id)) continue;
      const dx = bx - e.x;
      const dy = by - e.y;
      const collideR = size + e.radius;
      if (dx * dx + dy * dy < collideR * collideR) {
        blade.hitTimers.set(e.id, hitCd);
        if (damageEnemy(e, dmg, mods?.critChance)) onKill();
      }
    }
  }
}

export function renderMelee(
  ctx: CanvasRenderingContext2D,
  blades: MeleeBlade[],
  px: number, py: number,
  w: WeaponInstance
): void {
  const orbitR = meleeBladeRadius(w);
  const size = meleeBladeSize(w);
  const color = CONFIG.weapons.melee.color;

  // Orbit guide (subtle)
  ctx.strokeStyle = color + "11";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, orbitR, 0, Math.PI * 2);
  ctx.stroke();

  for (const blade of blades) {
    const bx = px + Math.cos(blade.angle) * orbitR;
    const by = py + Math.sin(blade.angle) * orbitR;

    // Blade shape — diamond
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(blade.angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color + "88";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}
