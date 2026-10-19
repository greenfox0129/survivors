// ============================================================
//  AccessoryManager.ts — Passive trinkets that boost player stats
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { AccessoryInstance, AccessoryType } from "@/game/core/types";

const ALL_ACCESSORY_TYPES: AccessoryType[] = [
  "swiftBoots",
  "vitalRing",
  "magnetCharm",
  "powerAmulet",
  "hastePendant",
  "xpcrystal",
  "thornArmor",
  "shieldForge",
  "natureBlessing",
];

export function allAccessoryTypes(): AccessoryType[] {
  return [...ALL_ACCESSORY_TYPES];
}

export function accessoryName(type: AccessoryType): string {
  return CONFIG.accessories[type].name;
}

export function accessoryDesc(type: AccessoryType): string {
  return CONFIG.accessories[type].desc;
}

export function accessoryMaxLevel(type: AccessoryType): number {
  return CONFIG.accessories[type].maxLevel as number;
}

/** Computed passive modifiers from all owned accessories. */
export interface AccessoryMods {
  moveSpeedMult: number;
  maxHpAdd: number;
  regenPerSec: number;
  pickupMult: number;
  damageMult: number;
  cooldownMult: number;
  xpMult: number;
  reflectDamage: number;
  damageReduction: number; // 0..1, e.g. 0.05 = 5% less damage
}

export class AccessoryManager {
  accessories: AccessoryInstance[] = [];

  reset(): void {
    this.accessories = [];
  }

  hasAccessory(type: AccessoryType): boolean {
    return this.accessories.some((a) => a.type === type);
  }

  canAddAccessory(): boolean {
    return this.accessories.length < CONFIG.maxAccessories;
  }

  addAccessory(type: AccessoryType): void {
    if (this.hasAccessory(type)) return;
    this.accessories.push({ type, level: 1 });
  }

  levelUpAccessory(type: AccessoryType): void {
    const a = this.accessories.find((a) => a.type === type);
    if (!a) return;
    const max = accessoryMaxLevel(type);
    if (a.level >= max) return;
    a.level++;
  }

  getAccessoryLevel(type: AccessoryType): number {
    const a = this.accessories.find((a) => a.type === type);
    return a ? a.level : 0;
  }

  getUpgradeableAccessories(): AccessoryInstance[] {
    return this.accessories.filter((a) => a.level < accessoryMaxLevel(a.type));
  }

  getUnownedAccessories(): AccessoryType[] {
    return ALL_ACCESSORY_TYPES.filter((t) => !this.hasAccessory(t));
  }

  /** Compute the combined passive modifiers from all owned accessories. */
  computeMods(): AccessoryMods {
    const mods: AccessoryMods = {
      moveSpeedMult: 1,
      maxHpAdd: 0,
      regenPerSec: 0,
      pickupMult: 1,
      damageMult: 1,
      cooldownMult: 1,
      xpMult: 1,
      reflectDamage: 0,
      damageReduction: 0,
    };

    for (const a of this.accessories) {
      const def = CONFIG.accessories[a.type];
      const lvl = a.level;
      switch (a.type) {
        case "swiftBoots":
          mods.moveSpeedMult *= def.baseMoveSpeedMult! + def.growthMoveSpeedMult! * (lvl - 1);
          break;
        case "vitalRing":
          mods.maxHpAdd += def.baseMaxHpAdd! + def.growthMaxHpAdd! * (lvl - 1);
          break;
        case "magnetCharm":
          mods.pickupMult *= def.basePickupMult! + def.growthPickupMult! * (lvl - 1);
          break;
        case "powerAmulet":
          mods.damageMult *= def.baseDamageMult! + def.growthDamageMult! * (lvl - 1);
          break;
        case "hastePendant":
          mods.cooldownMult *= def.baseCooldownMult! + def.growthCooldownMult! * (lvl - 1);
          break;
        case "xpcrystal":
          mods.xpMult *= def.baseXpMult! + def.growthXpMult! * (lvl - 1);
          break;
        case "thornArmor":
          mods.reflectDamage += def.baseReflectDamage! + def.growthReflectDamage! * (lvl - 1);
          break;
        case "shieldForge":
          mods.damageReduction += def.baseDamageReduction! + def.growthDamageReduction! * (lvl - 1);
          break;
        case "natureBlessing":
          mods.regenPerSec += def.baseRegenPerSec! + def.growthRegen! * (lvl - 1);
          break;
      }
    }

    // Cap damage reduction at 70%
    mods.damageReduction = Math.min(mods.damageReduction, 0.70);

    return mods;
  }

  /** Preview the effect description for the NEXT level of an accessory. */
  getEffectPreview(type: AccessoryType, currentLevel: number): string {
    if (currentLevel <= 0) {
      return this.getLevelEffect(type, 1);
    }
    const cur = this.getLevelEffect(type, currentLevel);
    const next = this.getLevelEffect(type, currentLevel + 1);
    return `${cur} → ${next}`;
  }

  /** Effect description for a specific level (no transition arrow). */
  private getLevelEffect(type: AccessoryType, level: number): string {
    const def = CONFIG.accessories[type];
    const lvl = level - 1;
    switch (type) {
      case "swiftBoots":
        return `이속 +${Math.round((def.baseMoveSpeedMult! + def.growthMoveSpeedMult! * lvl) * 100 - 100)}%`;
      case "vitalRing":
        return `체력 +${def.baseMaxHpAdd! + def.growthMaxHpAdd! * lvl}`;
      case "magnetCharm":
        return `흡수 +${Math.round((def.basePickupMult! + def.growthPickupMult! * lvl) * 100 - 100)}%`;
      case "powerAmulet":
        return `공격력 +${Math.round((def.baseDamageMult! + def.growthDamageMult! * lvl) * 100 - 100)}%`;
      case "hastePendant":
        return `쿨다운 -${Math.round((1 - (def.baseCooldownMult! + def.growthCooldownMult! * lvl)) * 100)}%`;
      case "xpcrystal":
        return `경험치 +${Math.round((def.baseXpMult! + def.growthXpMult! * lvl) * 100 - 100)}%`;
      case "thornArmor":
        return `반사 ${def.baseReflectDamage! + def.growthReflectDamage! * lvl} 데미지`;
      case "shieldForge":
        return `피해감소 ${Math.round((def.baseDamageReduction! + def.growthDamageReduction! * lvl) * 100)}%`;
      case "natureBlessing":
        return `체력재생 ${(def.baseRegenPerSec! + def.growthRegen! * lvl).toFixed(1)}/s`;
    }
  }
}
