// ============================================================
//  weapons/TrapWeapon.ts — Deployable field trap, sustained damage
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { EnemyState, TrapEntity, WeaponInstance } from "@/game/core/types";
import { findNearestEnemy, damageEnemy } from "@/game/entities/EnemyManager";
import type { WeaponMods } from "@/game/core/types";
import { EVOLUTIONS } from "@/game/data/evolutions";
import { getIconSprite, drawSpriteCentered } from "@/game/render/iconSprites";
import { isLowQuality } from "@/game/render/quality";
import { popWeaponFade, pushWeaponFade } from "@/game/core/settings";
import { drawStrip, getPixelImage } from "@/game/render/pixel";

let idCounter = 5400;
export function resetTrapIds() { idCounter = 5400; }

export function trapDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.trap;
  const evo = w.evolved ? EVOLUTIONS.trap.damageMult : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo;
}

export function trapCooldown(w: WeaponInstance): number {
  const d = CONFIG.weapons.trap;
  const evo = w.evolved ? EVOLUTIONS.trap.cooldownMult : 1;
  return d.baseCooldown * Math.pow(d.cooldownGrowth, w.level - 1) * evo;
}

export function trapLifetime(w: WeaponInstance): number {
  if (w.evolved) return 9999; // permanent
  const d = CONFIG.weapons.trap;
  return d.baseTrapLifetime * Math.pow(d.trapLifetimeGrowth, w.level - 1);
}

export function trapMaxCount(w: WeaponInstance): number {
  if (w.evolved) return 8;
  const d = CONFIG.weapons.trap;
  const base = d.baseMaxTraps + Math.floor((w.level - 1) / 3);
  if (w.level >= 8) return base + 1;
  return base;
}

// Trap radius: bigger at Lv4+, Lv7+
export function trapRadius(w: WeaponInstance): number {
  const base = CONFIG.weapons.trap.baseTrapRadius;
  if (w.evolved) return base * 2.0;
  if (w.level >= 7) return base * 1.8;
  if (w.level >= 4) return base * 1.4;
  return base;
}

// Slow effect: unlocked at Lv5+
export function trapHasSlow(w: WeaponInstance): boolean {
  return w.evolved || w.level >= 5;
}

export function trapSlowFactor(w: WeaponInstance): number {
  if (w.evolved) return 0.2; // 80% slow
  if (w.level >= 8) return 0.4; // 60% slow
  if (w.level >= 5) return 0.6; // 40% slow
  return 1.0;
}

export function trapLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 3) return "트랩 +1개";
  if (lv === 4) return "트랩 범위 증가";
  if (lv === 5) return "이동 감속 효과";
  if (lv === 6) return "트랩 +1개";
  if (lv === 7) return "트랩 범위 증가";
  if (lv === 8) return "트랩 +1개 · 감속 강화";
  return null;
}

export function updateTrap(
  traps: TrapEntity[],
  enemies: EnemyState[],
  px: number, py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods
): void {
  const dmgMult = mods?.damageMult ?? 1;
  const cdMult = mods?.cooldownMult ?? 1;
  // Spawn
  w.cooldownTimer += dt;
  if (w.cooldownTimer >= trapCooldown(w) * cdMult) {
    const maxT = trapMaxCount(w);
    let liveCount = 0;
    for (const t of traps) { if (t.alive) liveCount++; }
    if (liveCount < maxT) {
      w.cooldownTimer = 0;
      const target = findNearestEnemy(enemies, px, py, 250);
      const tx = target ? target.x + (Math.random() - 0.5) * 30 : px + (Math.random() - 0.5) * 100;
      const ty = target ? target.y + (Math.random() - 0.5) * 30 : py + (Math.random() - 0.5) * 100;
      traps.push({
        id: ++idCounter,
        x: tx, y: ty,
        radius: trapRadius(w),
        damage: trapDamage(w) * dmgMult,
        lifetime: trapLifetime(w),
        hitTimers: new Map(),
        alive: true,
        slowRadius: trapHasSlow(w) ? trapRadius(w) * 1.3 : 0,
        slowFactor: trapSlowFactor(w),
      });
    }
  }

  const hitCd = CONFIG.weapons.trap.hitCooldown;

  for (const t of traps) {
    if (!t.alive) continue;
    t.lifetime -= dt;
    if (t.lifetime <= 0) {
      t.alive = false;
      continue;
    }

    // Decrement hit timers
    for (const [eid, timer] of t.hitTimers) {
      const nt = timer - dt;
      if (nt <= 0) t.hitTimers.delete(eid);
      else t.hitTimers.set(eid, nt);
    }

    // Damage enemies in radius
    for (const e of enemies) {
      if (!e.alive || t.hitTimers.has(e.id)) continue;
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const collideR = t.radius + e.radius;
      if (dx * dx + dy * dy < collideR * collideR) {
        t.hitTimers.set(e.id, hitCd);
        if (damageEnemy(e, t.damage, mods?.critChance)) onKill();
      }
    }

    // Slow effect: clamp speed of enemies in slow radius (re-checked each frame, so not permanent)
    if (t.slowRadius > 0) {
      for (const e of enemies) {
        if (!e.alive || e.dying) continue;
        const dx = t.x - e.x;
        const dy = t.y - e.y;
        const collideR = t.slowRadius + e.radius;
        if (dx * dx + dy * dy < collideR * collideR) {
          // Clamp speed downward — enemies recover when they leave the slow zone
          // because updateEnemies recalculates speed mult from distance every frame
          // and we only reduce, never store a corrupted base.
          if (e.speed > 1) {
            e.speed = Math.max(e.speed * t.slowFactor, 1);
          }
        }
      }
    }
  }
}

export function cullTraps(traps: TrapEntity[]): TrapEntity[] {
  let write = 0;
  for (let i = 0; i < traps.length; i++) {
    if (traps[i].alive) {
      if (write !== i) traps[write] = traps[i];
      write++;
    }
  }
  traps.length = write;
  return traps;
}

export function renderTraps(ctx: CanvasRenderingContext2D, traps: TrapEntity[]): void {
  const color = CONFIG.weapons.trap.color;
  const pulse = Math.sin(Date.now() / 200) * 0.15 + 0.85;
  const pixel = !isLowQuality() && getPixelImage("fx/circle-spark") !== null;
  const now = performance.now();
  for (const t of traps) {
    if (!t.alive) continue;

    // Slow aura (Lv5+)
    if (t.slowRadius > 0 && pushWeaponFade(ctx, "trapSlow")) {
      try {
        ctx.strokeStyle = "#67e8f922";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.slowRadius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#67e8f908";
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.slowRadius, 0, Math.PI * 2);
        ctx.fill();
      } finally {
        popWeaponFade(ctx);
      }
    }

    if (!pushWeaponFade(ctx, "trap")) continue;
    try {
    if (pixel) {
      // Rune circle (looping spark animation); evolved/permanent traps crackle with thunder
      drawStrip(ctx, "fx/circle-spark", now / 110 + t.id, t.x, t.y, (t.radius * 2.3) / 32);
      if (t.lifetime > 999) drawStrip(ctx, "fx/thunder", now / 70 + t.id, t.x, t.y - t.radius * 0.3, 1.6);
      continue;
    }

    // Outer ring
    ctx.strokeStyle = color + "44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner fill
    ctx.fillStyle = color + "22";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Trap icon (bear trap; soul totem once permanent = evolved)
    const trapSprite = getIconSprite(t.lifetime > 999 ? "weapon-trap-evo" : "weapon-trap", color, t.radius * 1.5);
    if (trapSprite) {
      drawSpriteCentered(ctx, trapSprite, t.x, t.y);
      continue;
    }

    // Fallback while the sprite loads: core + spikes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Spikes — batched into one path / one stroke call
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.moveTo(t.x + Math.cos(a) * (t.radius - 4), t.y + Math.sin(a) * (t.radius - 4));
      ctx.lineTo(t.x + Math.cos(a) * (t.radius + 4), t.y + Math.sin(a) * (t.radius + 4));
    }
    ctx.stroke();
    } finally {
      popWeaponFade(ctx);
    }
  }
}
