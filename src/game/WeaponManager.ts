// ============================================================
//  WeaponManager.ts — Orchestrates all weapon instances
// ============================================================

import { CONFIG } from "./config";
import type {
  AuraState,
  BombEntity,
  BreathState,
  ClawState,
  EnemyState,
  MeleeBlade,
  PlayerState,
  Projectile,
  ShurikenProjectile,
  TrapEntity,
  WeaponInstance,
  WeaponType,
} from "./types";
import {
  updateBullet, renderBullets, cullBullets, resetBulletIds,
} from "./weapons/BulletWeapon";
import {
  updateMelee, renderMelee, createMeleeBlades,
} from "./weapons/MeleeWeapon";
import {
  updateBomb, renderBombs, cullBombs, resetBombIds,
} from "./weapons/BombWeapon";
import {
  updateTrap, renderTraps, cullTraps, resetTrapIds,
} from "./weapons/TrapWeapon";
import {
  updateAura, renderAura, createAuraState,
} from "./weapons/AuraWeapon";
import {
  updateShuriken, renderShurikens, cullShurikens, resetShurikenIds,
} from "./weapons/ShurikenWeapon";
import {
  updateClaw, renderClaw, createClawState, resetClaw,
} from "./weapons/ClawWeapon";
import {
  createBreathState, updateBreath, renderBreath, resetBreath,
} from "./weapons/BreathWeapon";
import { EVOLUTIONS } from "./weapons/evolutions";

const ALL_WEAPON_TYPES: WeaponType[] = ["bullet", "melee", "bomb", "trap", "aura", "shuriken", "claw"];

export function allWeaponTypes(): WeaponType[] {
  return [...ALL_WEAPON_TYPES];
}

export function weaponName(type: WeaponType): string {
  return CONFIG.weapons[type].name;
}

export function weaponEvolvedName(type: WeaponType): string {
  return EVOLUTIONS[type].evolvedName;
}

export function weaponDesc(type: WeaponType): string {
  return CONFIG.weapons[type].desc;
}

export function weaponMaxLevel(type: WeaponType): number {
  return CONFIG.weapons[type].maxLevel as number;
}



export interface WeaponMods {
  damageMult: number;
  cooldownMult: number;
  critChance?: number;
  critMult?: number;
}

export class WeaponManager {
  weapons: WeaponInstance[] = [];
  private projectiles: Projectile[] = [];
  private blades: MeleeBlade[] = [];
  private bombs: BombEntity[] = [];
  private traps: TrapEntity[] = [];
  private aura: AuraState | null = null;
  private shurikens: ShurikenProjectile[] = [];
  private claw: ClawState | null = null;
  private breath: BreathState | null = null;
  private mods: WeaponMods = { damageMult: 1, cooldownMult: 1 };

  constructor(startWeapon: WeaponType = "bullet") {
    this.addWeapon(startWeapon);
  }

  setMods(mods: WeaponMods): void {
    this.mods = mods;
  }

  reset(startWeapon: WeaponType = "bullet"): void {
    this.weapons = [];
    this.projectiles = [];
    this.blades = [];
    this.bombs = [];
    this.traps = [];
    this.aura = null;
    this.shurikens = [];
    this.claw = null;
    this.breath = null;
    resetBulletIds();
    resetBombIds();
    resetTrapIds();
    resetShurikenIds();
    resetClaw();
    this.addWeapon(startWeapon);
  }

  hasWeapon(type: WeaponType): boolean {
    return this.weapons.some((w) => w.type === type);
  }

  canAddWeapon(): boolean {
    return this.weapons.length < CONFIG.maxWeapons;
  }

  addWeapon(type: WeaponType): void {
    if (this.hasWeapon(type)) return;
    const w: WeaponInstance = { type, level: 1, cooldownTimer: 0, burstShotsLeft: 0, burstTimer: 0, evolved: false };
    this.weapons.push(w);
    if (type === "melee") {
      this.blades = createMeleeBlades(w);
    }
    if (type === "aura") {
      this.aura = createAuraState(w);
    }
    if (type === "claw") {
      this.claw = createClawState(w);
    }
  }

  /** Evolve a weapon: resets to Lv1 evolved state with enhanced stats. */
  evolveWeapon(type: WeaponType): void {
    const w = this.weapons.find((w) => w.type === type);
    if (!w || w.evolved) return;
    w.evolved = true;
    w.level = 1;
    w.cooldownTimer = 0;
    w.burstShotsLeft = 0;
    w.burstTimer = 0;
    // Rebuild melee blades and aura for evolved state
    if (type === "melee") {
      this.blades = createMeleeBlades(w);
    }
    if (type === "aura") {
      this.aura = createAuraState(w);
    }
    if (type === "claw") {
      // Evolved claw becomes the breath weapon — a frontal flame cone.
      this.claw = null;
      this.breath = createBreathState(w);
    }
  }

  isEvolved(type: WeaponType): boolean {
    const w = this.weapons.find((w) => w.type === type);
    return w ? w.evolved : false;
  }

  /** Get weapons that can evolve (Lv8 + paired accessory + not already evolved). */
  getEvolvableWeapons(hasAccessory: (type: import("./types").AccessoryType) => boolean): WeaponInstance[] {
    return this.weapons.filter((w) => {
      if (w.evolved) return false;
      if (w.level < 8) return false;
      const evo = EVOLUTIONS[w.type];
      return hasAccessory(evo.pairedAccessory);
    });
  }

  levelUpWeapon(type: WeaponType): void {
    const w = this.weapons.find((w) => w.type === type);
    if (!w) return;
    // Evolved weapons are final form — no further leveling.
    if (w.evolved) return;
    const max = weaponMaxLevel(type);
    if (w.level >= max) return;
    w.level++;
    // Rebuild blades when melee levels up
    if (type === "melee") {
      this.blades = createMeleeBlades(w);
    }
    if (type === "claw") {
      this.claw = createClawState(w);
    }
  }

  getWeaponLevel(type: WeaponType): number {
    const w = this.weapons.find((w) => w.type === type);
    return w ? w.level : 0;
  }

  getUpgradeableWeapons(): WeaponInstance[] {
    return this.weapons.filter((w) => {
      // Evolved weapons are final form — not upgradeable.
      if (w.evolved) return false;
      return w.level < weaponMaxLevel(w.type);
    });
  }

  getUnownedWeapons(): WeaponType[] {
    return ALL_WEAPON_TYPES.filter((t) => !this.hasWeapon(t));
  }

  update(
    enemies: EnemyState[],
    player: PlayerState,
    dt: number,
    onKill: () => void
  ): void {
    // Apply mods by temporarily patching weapon instance cooldown timers
    // We pass mods through to each weapon via a wrapper
    for (const w of this.weapons) {
      switch (w.type) {
        case "bullet":
          updateBullet(this.projectiles, enemies, player.x, player.y, w, dt, onKill, this.mods);
          break;
        case "melee":
          updateMelee(this.blades, enemies, player.x, player.y, w, dt, onKill, this.mods);
          break;
        case "bomb":
          updateBomb(this.bombs, enemies, player.x, player.y, w, dt, onKill, this.mods);
          break;
        case "trap":
          updateTrap(this.traps, enemies, player.x, player.y, w, dt, onKill, this.mods);
          break;
        case "aura":
          if (this.aura) {
            updateAura(this.aura, enemies, player.x, player.y, w, dt, onKill, this.mods);
          }
          break;
        case "shuriken":
          updateShuriken(this.shurikens, enemies, player.x, player.y, w, dt, onKill, this.mods);
          break;
        case "claw":
          if (this.breath) {
            updateBreath(this.breath, enemies, player.x, player.y, w, dt, onKill, this.mods);
          } else if (this.claw) {
            updateClaw(this.claw, enemies, player.x, player.y, w, dt, onKill, this.mods);
          }
          break;
      }
    }

    // Cull
    this.projectiles = cullBullets(this.projectiles);
    this.bombs = cullBombs(this.bombs);
    this.traps = cullTraps(this.traps);
    this.shurikens = cullShurikens(this.shurikens);
  }

  render(ctx: CanvasRenderingContext2D, player: PlayerState): void {
    // Aura renders behind everything
    if (this.aura) {
      renderAura(ctx, this.aura, player.x, player.y);
    }
    // Traps
    renderTraps(ctx, this.traps);
    // Bombs
    renderBombs(ctx, this.bombs);
    // Bullets
    renderBullets(ctx, this.projectiles);
    // Shurikens
    renderShurikens(ctx, this.shurikens);
    // Claw / Breath renders on top (area effect)
    const clawW = this.weapons.find((w) => w.type === "claw");
    if (clawW) {
      if (this.breath) {
        renderBreath(ctx, this.breath, player.x, player.y);
      } else if (this.claw) {
        renderClaw(ctx, this.claw, player.x, player.y, clawW);
      }
    }
    // Melee blades render on top of player (called after player render)
    const meleeW = this.weapons.find((w) => w.type === "melee");
    if (meleeW && this.blades.length > 0) {
      renderMelee(ctx, this.blades, player.x, player.y, meleeW);
    }
  }
}
