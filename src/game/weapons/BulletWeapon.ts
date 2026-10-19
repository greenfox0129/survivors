// ============================================================
//  weapons/BulletWeapon.ts — Burst-fire auto-targeting projectile
//  Fires a burst of N shots in rapid succession, then pauses.
// ============================================================

import { CONFIG } from "../config";
import type { EnemyState, Projectile, WeaponInstance } from "../types";
import { findNearestEnemy, damageEnemy } from "../EnemyManager";
import type { WeaponMods } from "../WeaponManager";
import { EVOLUTIONS } from "./evolutions";

let idCounter = 5000;
export function resetBulletIds() { idCounter = 5000; }

export function bulletDamage(w: WeaponInstance): number {
  const d = CONFIG.weapons.bullet;
  const evo = w.evolved ? EVOLUTIONS.bullet.damageMult : 1;
  return d.baseDamage * Math.pow(d.damageGrowth, w.level - 1) * evo;
}

export function bulletBurstCount(w: WeaponInstance): number {
  if (w.evolved) return 8;
  if (w.level >= 8) return 7;
  if (w.level >= 6) return 6;
  if (w.level >= 4) return 5;
  if (w.level >= 2) return 4;
  return CONFIG.weapons.bullet.baseBurstCount;
}

export function bulletBurstInterval(w: WeaponInstance): number {
  return CONFIG.weapons.bullet.baseBurstInterval;
}

export function bulletBurstPause(w: WeaponInstance): number {
  const d = CONFIG.weapons.bullet;
  const evo = w.evolved ? EVOLUTIONS.bullet.cooldownMult : 1;
  return d.baseBurstPause * Math.pow(d.burstPauseGrowth, w.level - 1) * evo;
}

export function bulletSpeed(w: WeaponInstance): number {
  const d = CONFIG.weapons.bullet;
  return d.baseProjectileSpeed * Math.pow(d.speedGrowth, w.level - 1);
}

export function bulletPierce(w: WeaponInstance): number {
  if (w.evolved) return 999;
  const d = CONFIG.weapons.bullet;
  return d.basePierce + Math.floor((w.level - 1) / 3);
}

export function bulletProjectileRadius(w: WeaponInstance): number {
  const base = CONFIG.weapons.bullet.baseProjectileRadius;
  if (w.evolved) return base * 2;
  if (w.level >= 8) return base * 1.4;
  return base;
}

// Level-up special effect description
export function bulletLevelEffect(w: WeaponInstance): string | null {
  if (w.evolved) return null;
  const lv = w.level;
  if (lv === 2) return "버스트 4연사";
  if (lv === 3) return "대기 시간 감소";
  if (lv === 4) return "버스트 5연사";
  if (lv === 5) return "대기 시간 감소";
  if (lv === 6) return "버스트 6연사";
  if (lv === 7) return "관통 +1";
  if (lv === 8) return "버스트 7연사 · 탄환 강화";
  return null;
}

function fireOneBullet(
  projectiles: Projectile[],
  enemies: EnemyState[],
  px: number, py: number,
  w: WeaponInstance,
  dmgMult: number,
) {
  const target = findNearestEnemy(enemies, px, py, CONFIG.weapons.bullet.range);
  if (!target) return;
  const dx = target.x - px;
  const dy = target.y - py;
  const angle = Math.atan2(dy, dx);
  const speed = bulletSpeed(w);
  const radius = bulletProjectileRadius(w);
  projectiles.push({
    id: ++idCounter,
    x: px, y: py,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    damage: bulletDamage(w) * dmgMult,
    pierce: bulletPierce(w),
    hitIds: new Set(),
    alive: true,
    color: CONFIG.weapons.bullet.color,
  });
}

export function updateBullet(
  projectiles: Projectile[],
  enemies: EnemyState[],
  px: number, py: number,
  w: WeaponInstance,
  dt: number,
  onKill: () => void,
  mods?: WeaponMods
): void {
  const dmgMult = mods?.damageMult ?? 1;
  const cdMult = mods?.cooldownMult ?? 1;

  if (w.burstShotsLeft > 0) {
    // Currently in a burst — fire at interval
    w.burstTimer += dt;
    if (w.burstTimer >= bulletBurstInterval(w) * cdMult) {
      w.burstTimer = 0;
      fireOneBullet(projectiles, enemies, px, py, w, dmgMult);
      w.burstShotsLeft--;
      if (w.burstShotsLeft <= 0) {
        // Burst finished — start pause
        w.cooldownTimer = 0;
      }
    }
  } else {
    // Pausing between bursts
    w.cooldownTimer += dt;
    const pause = bulletBurstPause(w) * cdMult;
    if (w.cooldownTimer >= pause) {
      w.cooldownTimer = 0;
      w.burstShotsLeft = bulletBurstCount(w);
      w.burstTimer = 0;
      // Fire first shot immediately
      fireOneBullet(projectiles, enemies, px, py, w, dmgMult);
      w.burstShotsLeft--;
    }
  }

  // Move & collide
  const maxDist2 = (CONFIG.canvasWidth * 0.8) * (CONFIG.canvasWidth * 0.8);
  for (const p of projectiles) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Cull if too far from player (world is infinite)
    const pdx = p.x - px;
    const pdy = p.y - py;
    if (pdx * pdx + pdy * pdy > maxDist2) {
      p.alive = false; continue;
    }
    for (const e of enemies) {
      if (!e.alive || p.hitIds.has(e.id)) continue;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const collideR = p.radius + e.radius;
      if (dx * dx + dy * dy < collideR * collideR) {
        p.hitIds.add(e.id);
        if (damageEnemy(e, p.damage, mods?.critChance)) onKill();
        p.pierce--;
        if (p.pierce <= 0) { p.alive = false; break; }
      }
    }
  }
}

export function renderBullets(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
  for (const p of projectiles) {
    if (!p.alive) continue;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.color + "44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function cullBullets(projectiles: Projectile[]): Projectile[] {
  let write = 0;
  for (let i = 0; i < projectiles.length; i++) {
    if (projectiles[i].alive) {
      if (write !== i) projectiles[write] = projectiles[i];
      write++;
    }
  }
  projectiles.length = write;
  return projectiles;
}
