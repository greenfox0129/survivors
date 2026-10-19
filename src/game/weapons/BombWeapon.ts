// ============================================================
//  weapons/BombWeapon.ts — Delayed AoE explosion at random enemy
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { BombEntity, EnemyState, WeaponInstance } from "@/game/core/types";
import { findNearestEnemy, damageEnemy } from "@/game/entities/EnemyManager";
import type { WeaponMods } from "@/game/core/types";
import { EVOLUTIONS } from "@/game/data/evolutions";
import { getRadialSprite, drawCentered } from "@/game/render/sprites";
import { isLowQuality } from "@/game/render/quality";

let idCounter = 5200;
export function resetBombIds() { idCounter = 5200; }

export function bombDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.bomb;
  const evo = w.evolved ? EVOLUTIONS.bomb.damageMult : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo;
}

export function bombCooldown(w: WeaponInstance): number {
  const d = CONFIG.weapons.bomb;
  const evo = w.evolved ? EVOLUTIONS.bomb.cooldownMult : 1;
  return d.baseCooldown * Math.pow(d.cooldownGrowth, w.level - 1) * evo;
}

export function bombExplosionRadius(w: WeaponInstance): number {
  const d = CONFIG.weapons.bomb;
  let r = d.baseExplosionRadius * Math.pow(d.explosionRadiusGrowth, w.level - 1);
  if (w.evolved) r *= 1.5;
  else if (w.level >= 7) r *= 1.2;
  return r;
}

// Multi-bomb: 1 base, 2 at Lv3, 3 at Lv6, 4 at Lv8
export function bombCount(w: WeaponInstance): number {
  if (w.evolved) return 6;
  if (w.level >= 8) return 4;
  if (w.level >= 6) return 3;
  if (w.level >= 3) return 2;
  return 1;
}

// Burning field: unlocked at Lv5+
export function bombHasBurn(w: WeaponInstance): boolean {
  return w.evolved || w.level >= 5;
}

export function bombLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 3) return "폭탄 2개 동시 투하";
  if (lv === 5) return "잔류 화염 지대 생성";
  if (lv === 6) return "폭탄 3개 동시 투하";
  if (lv === 7) return "폭발 범위 증가";
  if (lv === 8) return "폭탄 4개 · 화염 강화";
  return null;
}

export function updateBomb(
  bombs: BombEntity[],
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
  if (w.cooldownTimer >= bombCooldown(w) * cdMult) {
    w.cooldownTimer = 0;
    const count = bombCount(w);
    const hasBurn = bombHasBurn(w);
    for (let i = 0; i < count; i++) {
      // Each bomb targets a different random area
      const target = findNearestEnemy(enemies, px, py, 350);
      const jitter = i * 60;
      const tx = target ? target.x + (Math.random() - 0.5) * 60 + jitter : px + (Math.random() - 0.5) * 200;
      const ty = target ? target.y + (Math.random() - 0.5) * 60 : py + (Math.random() - 0.5) * 200;
      bombs.push({
        id: ++idCounter,
        x: px, y: py,
        targetX: tx, targetY: ty,
        fallTimer: 0,
        fallTime: CONFIG.weapons.bomb.baseFallTime,
        explosionRadius: bombExplosionRadius(w),
        damage: bombDamage(w) * dmgMult,
        phase: "falling",
        explosionTimer: 0,
        hitIds: new Set(),
        burnRadius: hasBurn ? bombExplosionRadius(w) * 0.7 : 0,
        burnDamage: hasBurn ? bombDamage(w) * dmgMult * 0.3 : 0,
        burnDuration: hasBurn ? (w.level >= 8 ? 4 : 2.5) : 0,
        burnTimer: 0,
        burnTickTimer: 0,
        burnHitTimers: new Map(),
      });
    }
  }

  for (const b of bombs) {
    if (b.phase === "done") continue;

    if (b.phase === "falling") {
      b.fallTimer += dt;
      const t = Math.min(b.fallTimer / b.fallTime, 1);
      b.x = px + (b.targetX - px) * t;
      b.y = py + (b.targetY - py) * t;
      if (t >= 1) {
        b.phase = "exploding";
        b.x = b.targetX;
        b.y = b.targetY;
      }
    }

    if (b.phase === "exploding") {
      b.explosionTimer += dt;
      // Damage all enemies in radius once
      for (const e of enemies) {
        if (!e.alive || b.hitIds.has(e.id)) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const collideR = b.explosionRadius + e.radius;
        if (dx * dx + dy * dy < collideR * collideR) {
          b.hitIds.add(e.id);
          if (damageEnemy(e, b.damage, mods?.critChance)) onKill();
        }
      }
      if (b.explosionTimer >= 0.3) {
        // Transition to burn phase or done
        if (b.burnDuration > 0) {
          b.phase = "burning";
        } else {
          b.phase = "done";
        }
      }
    }

    if (b.phase === "burning") {
      b.burnTimer += dt;
      b.burnTickTimer += dt;

      // Decrement burn hit timers
      for (const [eid, t] of b.burnHitTimers) {
        const nt = t - dt;
        if (nt <= 0) b.burnHitTimers.delete(eid);
        else b.burnHitTimers.set(eid, nt);
      }

      // Burn tick damage every 0.5s
      if (b.burnTickTimer >= 0.5) {
        b.burnTickTimer = 0;
        for (const e of enemies) {
          if (!e.alive || b.burnHitTimers.has(e.id)) continue;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          const collideR = b.burnRadius + e.radius;
          if (dx * dx + dy * dy < collideR * collideR) {
            b.burnHitTimers.set(e.id, 0.5);
            if (damageEnemy(e, b.burnDamage)) onKill();
          }
        }
      }

      if (b.burnTimer >= b.burnDuration) {
        b.phase = "done";
      }
    }
  }
}

export function cullBombs(bombs: BombEntity[]): BombEntity[] {
  let write = 0;
  for (let i = 0; i < bombs.length; i++) {
    if (bombs[i].phase !== "done") {
      if (write !== i) bombs[write] = bombs[i];
      write++;
    }
  }
  bombs.length = write;
  return bombs;
}

export function renderBombs(ctx: CanvasRenderingContext2D, bombs: BombEntity[]): void {
  const color = CONFIG.weapons.bomb.color;
  const low = isLowQuality();
  const now = Date.now();
  for (const b of bombs) {
    if (b.phase === "falling") {
      // Shadow at target
      ctx.fillStyle = color + "22";
      ctx.beginPath();
      ctx.arc(b.targetX, b.targetY, b.explosionRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Falling bomb
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (b.phase === "exploding") {
      const prog = b.explosionTimer / 0.3;
      const r = b.explosionRadius * (0.5 + prog * 0.5);
      ctx.fillStyle = color + Math.round((1 - prog) * 200).toString(16).padStart(2, "0");
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (b.phase === "burning") {
      const prog = 1 - (b.burnTimer / b.burnDuration);
      const r = b.burnRadius;
      const pulse = Math.sin(now / 100) * 0.1 + 0.9;

      // Burning field — cached sprite (center alpha 0x50), faded with globalAlpha
      const field = getRadialSprite(r, [[0, color + "50"], [1, color + "00"]]);
      ctx.globalAlpha = Math.max(0, prog);
      drawCentered(ctx, field, b.x, b.y, r * pulse);
      ctx.globalAlpha = 1;

      // Flickering embers (decoration — skipped in low quality)
      if (low) continue;
      ctx.fillStyle = "#fbbf24" + Math.round(prog * 150).toString(16).padStart(2, "0");
      for (let i = 0; i < 3; i++) {
        const a = (now / 500 + i * 2) % (Math.PI * 2);
        const ex = b.x + Math.cos(a) * r * 0.5;
        const ey = b.y + Math.sin(a) * r * 0.5;
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
