// ============================================================
//  Companion.ts — One hired follower for the current run.
//  Mercenary fires a single level 1–3 weapon from its own spot.
//  Cat walks the map and picks up XP gems. Warden spends a shield
//  that refills a few seconds after it breaks.
// ============================================================

import { CONFIG } from "@/game/data/config";
import { COMPANIONS, type CompanionRoll } from "@/game/data/companions";
import type { EnemyState, Gem, PlayerState, WeaponInstance, WeaponMods, WeaponType } from "@/game/core/types";
import { setDamageSource } from "@/game/core/runReport";
import { WEAPON_MODULES } from "@/game/weapons/registry";

const MERC_MODS: WeaponMods = { damageMult: 1, cooldownMult: 1 };

export class Companion {
  readonly kind: CompanionRoll["kind"];
  x: number;
  y: number;
  private facing = 0;
  private weapon: WeaponInstance | null = null;
  private weaponState: unknown = null;
  /** Reused so melee/axe renders orbit this body, not the player. */
  private stand: PlayerState;
  private shield: number;
  private shieldTimer = 0;
  private wanderX = 0;
  private wanderY = 0;
  private wanderTimer = 0;

  constructor(roll: CompanionRoll, player: PlayerState) {
    this.kind = roll.kind;
    this.x = player.x;
    this.y = player.y + 24;
    this.stand = { ...player, x: this.x, y: this.y };
    const warden = COMPANIONS.warden;
    this.shield = roll.kind === "warden" ? warden.shield : 0;
    if (roll.kind === "mercenary" && roll.weapon && roll.weaponLevel) {
      this.weapon = {
        type: roll.weapon,
        level: roll.weaponLevel,
        cooldownTimer: 0,
        burstShotsLeft: 0,
        burstTimer: 0,
        evolved: false,
        super: false,
      };
      this.weaponState = WEAPON_MODULES[roll.weapon].createState(this.weapon);
    }
  }

  /** Damage that still reaches the player. Only the warden spends shield. */
  absorb(amount: number): number {
    if (this.kind !== "warden" || this.shield <= 0 || amount <= 0) return amount;
    const blocked = Math.min(this.shield, amount);
    this.shield -= blocked;
    if (this.shield <= 0) {
      this.shield = 0;
      this.shieldTimer = COMPANIONS.warden.regenDelay;
    }
    return amount - blocked;
  }

  /** XP gems scooped this frame. Mercenary kills are reported through onKill. */
  update(
    dt: number,
    player: PlayerState,
    enemies: EnemyState[],
    gems: Gem[],
    onKill: () => void,
  ): number {
    if (this.kind === "mercenary") {
      this.follow(player, dt, Math.PI);
      this.fire(dt, enemies, onKill);
      return 0;
    }
    if (this.kind === "cat") return this.roam(dt, player, gems);
    this.follow(player, dt, Math.PI / 2);
    if (this.shield <= 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) this.shield = COMPANIONS.warden.shield;
    }
    return 0;
  }

  label(): string {
    const name = COMPANIONS[this.kind].name;
    if (this.kind === "mercenary" && this.weapon) {
      return `${name} · ${CONFIG.weapons[this.weapon.type].name} Lv${this.weapon.level}`;
    }
    if (this.kind === "warden") {
      return `${name} · ${Math.ceil(this.shield)}/${COMPANIONS.warden.shield}`;
    }
    return name;
  }

  renderWeapons(ctx: CanvasRenderingContext2D): void {
    if (!this.weapon || this.weaponState == null) return;
    this.stand.x = this.x;
    this.stand.y = this.y;
    WEAPON_MODULES[this.weapon.type].render(ctx, this.weaponState, this.stand, this.weapon);
  }

  render(ctx: CanvasRenderingContext2D, player: PlayerState): void {
    if (this.kind === "warden" && this.shield > 0) {
      ctx.strokeStyle = COMPANIONS.warden.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    const def = COMPANIONS[this.kind];
    ctx.fillStyle = def.color;
    ctx.strokeStyle = def.border;
    ctx.lineWidth = 2;
    if (this.kind === "cat") {
      this.drawCat(ctx, def.radius);
      return;
    }
    if (this.kind === "warden") {
      this.drawDiamond(ctx, def.radius);
      return;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, def.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private follow(player: PlayerState, dt: number, angleOffset: number): void {
    const def = this.kind === "warden" ? COMPANIONS.warden : COMPANIONS.mercenary;
    const ang = player.aim + angleOffset;
    const tx = player.x + Math.cos(ang) * def.followDistance;
    const ty = player.y + Math.sin(ang) * def.followDistance;
    this.step(tx, ty, Math.max(def.speed, player.speed + 40), dt);
  }

  private fire(dt: number, enemies: EnemyState[], onKill: () => void): void {
    if (!this.weapon || this.weaponState == null) return;
    const type: WeaponType = this.weapon.type;
    setDamageSource(type);
    try {
      WEAPON_MODULES[type].update(this.weaponState, {
        enemies,
        px: this.x,
        py: this.y,
        w: this.weapon,
        dt,
        onKill,
        mods: MERC_MODS,
        aim: nearestAim(this.x, this.y, enemies, this.facing),
      });
    } finally {
      setDamageSource(null);
    }
  }

  private roam(dt: number, player: PlayerState, gems: Gem[]): number {
    const cat = COMPANIONS.cat;
    const gem = nearestGem(this.x, this.y, gems, cat.seekRange);
    let tx = this.wanderX;
    let ty = this.wanderY;
    if (gem) {
      tx = gem.x;
      ty = gem.y;
    } else {
      this.wanderTimer -= dt;
      const pdx = this.x - player.x;
      const pdy = this.y - player.y;
      const tooFar = pdx * pdx + pdy * pdy > cat.leash * cat.leash;
      if (tooFar || this.wanderTimer <= 0) {
        this.wanderTimer = cat.wanderInterval;
        if (tooFar) {
          tx = player.x;
          ty = player.y;
        } else {
          const ang = Math.random() * Math.PI * 2;
          const dist = 90 + Math.random() * 240;
          tx = this.x + Math.cos(ang) * dist;
          ty = this.y + Math.sin(ang) * dist;
        }
        this.wanderX = tx;
        this.wanderY = ty;
      }
    }
    this.step(tx, ty, cat.speed, dt);
    return scoopGems(gems, this.x, this.y, cat.scoopRadius);
  }

  private step(tx: number, ty: number, speed: number, dt: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const step = Math.min(dist, speed * dt);
    this.facing = Math.atan2(dy, dx);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  private drawCat(ctx: CanvasRenderingContext2D, radius: number): void {
    const x = this.x;
    const y = this.y;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.9, y - radius * 0.2);
    ctx.lineTo(x - radius * 0.35, y - radius * 1.45);
    ctx.lineTo(x - radius * 0.05, y - radius * 0.35);
    ctx.closePath();
    ctx.moveTo(x + radius * 0.9, y - radius * 0.2);
    ctx.lineTo(x + radius * 0.35, y - radius * 1.45);
    ctx.lineTo(x + radius * 0.05, y - radius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawDiamond(ctx: CanvasRenderingContext2D, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - radius);
    ctx.lineTo(this.x + radius, this.y);
    ctx.lineTo(this.x, this.y + radius);
    ctx.lineTo(this.x - radius, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export function createCompanion(roll: CompanionRoll | null, player: PlayerState): Companion | null {
  if (!roll) return null;
  return new Companion(roll, player);
}

function nearestAim(x: number, y: number, enemies: EnemyState[], fallback: number): number {
  let best = Infinity;
  let aim = fallback;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.alive || e.dying) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      aim = Math.atan2(dy, dx);
    }
  }
  return aim;
}

function nearestGem(x: number, y: number, gems: Gem[], range: number): Gem | null {
  const range2 = range * range;
  let best = range2;
  let found: Gem | null = null;
  for (let i = 0; i < gems.length; i++) {
    const g = gems[i];
    if (!g.alive || g.isTreasure || g.pickup) continue;
    const dx = g.x - x;
    const dy = g.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= best) {
      best = d2;
      found = g;
    }
  }
  return found;
}

function scoopGems(gems: Gem[], x: number, y: number, radius: number): number {
  const r2 = radius * radius;
  let xp = 0;
  for (let i = 0; i < gems.length; i++) {
    const g = gems[i];
    if (!g.alive || g.isTreasure || g.pickup) continue;
    const dx = g.x - x;
    const dy = g.y - y;
    if (dx * dx + dy * dy <= r2) {
      g.alive = false;
      xp += g.value;
    }
  }
  return xp;
}
