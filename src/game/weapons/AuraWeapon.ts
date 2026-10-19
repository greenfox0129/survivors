// ============================================================
//  weapons/AuraWeapon.ts — Continuous damage field around player
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { AuraState, EnemyState, WeaponInstance } from "@/game/core/types";
import { damageEnemy } from "@/game/entities/EnemyManager";
import type { WeaponMods } from "@/game/core/types";
import { EVOLUTIONS } from "@/game/data/evolutions";
import { getRadialSprite, drawCentered } from "@/game/render/sprites";

export function createAuraState(w: WeaponInstance): AuraState {
  const d = CONFIG.weapons.aura;
  const aura: AuraState = {
    radius: d.baseAuraRadius,
    damage: d.baseDamage,
    tickInterval: d.tickInterval,
    tickTimer: 0,
    burnDamage: 0,
    burnTickInterval: 0.5,
    enemyBurns: new Map(),
    cachedLevel: 0,
    cachedEvolved: false,
  };
  refreshAura(aura, w);
  return aura;
}

export function refreshAura(aura: AuraState, w: WeaponInstance): void {
  const d = CONFIG.weapons.aura;
  const evoDmgMult = w.evolved ? EVOLUTIONS.aura.damageMult : 1;
  const evoCdMult = w.evolved ? EVOLUTIONS.aura.cooldownMult : 1;
  const evoRadius = w.evolved ? 1.5 : 1;
  aura.radius = d.baseAuraRadius * Math.pow(d.auraRadiusGrowth, w.level - 1) * evoRadius;
  aura.damage = d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evoDmgMult;

  // Faster ticks at Lv3+, Lv7+, evolved
  if (w.evolved) aura.tickInterval = d.tickInterval * 0.3 * evoCdMult;
  else if (w.level >= 7) aura.tickInterval = d.tickInterval * 0.5;
  else if (w.level >= 3) aura.tickInterval = d.tickInterval * 0.7;
  else aura.tickInterval = d.tickInterval;

  // Burn DoT at Lv5+ (2x for evolved)
  if (w.evolved) {
    aura.burnDamage = d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evoDmgMult * 0.6;
  } else if (w.level >= 5) {
    aura.burnDamage = d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * 0.3;
  } else {
    aura.burnDamage = 0;
  }
}

// Knockback: Lv4+
export function auraHasKnockback(w: WeaponInstance): boolean {
  return w.evolved || w.level >= 4;
}

// Double damage ticks at Lv8
export function auraDoubleDamage(w: WeaponInstance): boolean {
  return w.evolved || w.level >= 8;
}

export function auraLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 3) return "틱 속도 증가";
  if (lv === 4) return "넉백 효과";
  if (lv === 5) return "화염 지속 데미지";
  if (lv === 6) return "오오라 범위 증가";
  if (lv === 7) return "틱 속도 증가";
  if (lv === 8) return "틱 데미지 2배";
  return null;
}

export function updateAura(
  aura: AuraState,
  enemies: EnemyState[],
  px: number, py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods
): void {
  const dmgMult = mods?.damageMult ?? 1;
  // Only refresh aura when weapon level/evolved state changes
  if (aura.cachedLevel !== w.level || aura.cachedEvolved !== w.evolved) {
    refreshAura(aura, w);
    aura.cachedLevel = w.level;
    aura.cachedEvolved = w.evolved;
  }
  const dmg = aura.damage * dmgMult * (auraDoubleDamage(w) ? 2 : 1);
  const knockback = auraHasKnockback(w);

  // Tick timer for all enemies in radius
  aura.tickTimer += dt;
  if (aura.tickTimer < aura.tickInterval) {
    // Still process burn DoTs
    processBurns(aura, enemies, dt, onKill);
    return;
  }
  aura.tickTimer = 0;

  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const collideR = aura.radius + e.radius;
    if (dx * dx + dy * dy < collideR * collideR) {
      if (damageEnemy(e, dmg, mods?.critChance)) onKill();

      // Knockback: push enemy away from player
      if (knockback) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
          const force = 40;
          e.x += (dx / dist) * force;
          e.y += (dy / dist) * force;
        }
      }

      // Apply burn DoT
      if (aura.burnDamage > 0) {
        aura.enemyBurns.set(e.id, {
          timer: 3.0, // burn lasts 3 seconds
          tickTimer: 0,
          damage: aura.burnDamage * dmgMult,
        });
      }
    }
  }

  processBurns(aura, enemies, dt, onKill);
}

function processBurns(
  aura: AuraState,
  enemies: EnemyState[],
  dt: number,
  onKill: () => void
): void {
  for (const [eid, burn] of aura.enemyBurns) {
    burn.timer -= dt;
    burn.tickTimer += dt;
    if (burn.timer <= 0) {
      aura.enemyBurns.delete(eid);
      continue;
    }
    if (burn.tickTimer >= aura.burnTickInterval) {
      burn.tickTimer = 0;
      const e = enemies.find((en) => en.id === eid && en.alive);
      if (e) {
        if (damageEnemy(e, burn.damage)) onKill();
      } else {
        aura.enemyBurns.delete(eid);
      }
    }
  }
}

export function renderAura(
  ctx: CanvasRenderingContext2D,
  aura: AuraState,
  px: number, py: number
): void {
  const color = CONFIG.weapons.aura.color;
  const pulse = Math.sin(Date.now() / 300) * 0.08 + 0.92;

  // Outer glow — pre-rendered once per (color, radius) and reused every frame.
  // (매 프레임 radial gradient를 새로 만들지 않는다 — render/sprites.ts)
  const glow = getRadialSprite(
    aura.radius,
    [[0, color + "00"], [0.7, color + "11"], [1, color + "33"]],
    0.3,
  );
  drawCentered(ctx, glow, px, py, aura.radius * pulse);

  // Ring
  ctx.strokeStyle = color + "55";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, aura.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
}
