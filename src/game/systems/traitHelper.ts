// ============================================================
//  traitHelper.ts — Compute multipliers from save data
//  Applies character stats + trait bonuses to game values
// ============================================================

import { CHARACTERS, type PassiveType } from "@/game/data/progression";
import { EVOLUTIONS } from "@/game/data/evolutions";
import type { AccessoryType, WeaponType } from "@/game/core/types";
import type { SaveData } from "@/game/core/storage";

export interface GameModifiers {
  hpMult: number;
  speedMult: number;
  damageMult: number;
  cooldownMult: number;
  pickupRangeMult: number;
  xpMult: number;
  projectileColor: string;
  playerColor: string;
  rerolls: number;
  passive: PassiveType;
  startAccessory: AccessoryType | null; // 4돌파: paired accessory at game start
  /** Level-up cards. 3, or 4 after the star trait 선택 확장. */
  upgradeChoices: number;
  /** Star seal and gold seal. Both are omitted from level-up cards. */
  sealedWeapons: WeaponType[];
  sealedAccessories: AccessoryType[];
}

/** 1돌파가 체력·공격력·이동속도에 곱하는 배율. 이후 돌파는 이 셋을 더 올리지 않는다. */
export function breakthroughCombatMult(breakthrough: number): { hp: number; damage: number; speed: number } {
  if (breakthrough >= 1) return { hp: 1.1, damage: 1.05, speed: 1.05 };
  return { hp: 1, damage: 1, speed: 1 };
}

export function computeModifiers(save: SaveData): GameModifiers {
  // Character base
  const charDef = CHARACTERS.find((c) => c.id === save.selectedCharacter);
  const owned = save.owned.find((o) => o.id === save.selectedCharacter);

  let hpMult = charDef?.hpMult ?? 1.0;
  let speedMult = charDef?.speedMult ?? 1.0;
  let damageMult = charDef?.damageMult ?? 1.0;
  let cooldownMult = charDef?.cooldownMult ?? 1.0;
  const projectileColor = charDef?.projectileColor ?? "#fbbf24";
  const playerColor = charDef?.color ?? "#22d3ee";

  // Character stars: each star gives +5% to all positive stats
  const stars = owned?.stars ?? 0;
  if (stars > 0) {
    const starBonus = 1 + stars * 0.05;
    hpMult *= starBonus;
    speedMult *= starBonus;
    damageMult *= starBonus;
  }

  // Character level: each level above 1 gives +3% damage
  const charLevel = owned?.level ?? 1;
  if (charLevel > 1) {
    damageMult *= 1 + (charLevel - 1) * 0.03;
  }

  // Traits
  const tl = save.traitLevels;
  const vitality = tl.vitality ?? 0;
  const swiftness = tl.swiftness ?? 0;
  const power = tl.power ?? 0;
  const rapidfire = tl.rapidfire ?? 0;
  const magnetism = tl.magnetism ?? 0;
  const greed = tl.greed ?? 0;
  const reroll = tl.reroll ?? 0;
  const extraChoice = tl.extraChoice ?? 0;
  const sealedWeapons = [
    (tl.weaponSeal ?? 0) > 0 ? save.sealedWeapon : null,
    (tl.weaponSealGold ?? 0) > 0 ? save.sealedWeaponGold : null,
  ].filter((id): id is WeaponType => id != null);
  const sealedAccessories = [
    (tl.accessorySeal ?? 0) > 0 ? save.sealedAccessory : null,
    (tl.accessorySealGold ?? 0) > 0 ? save.sealedAccessoryGold : null,
  ].filter((id): id is AccessoryType => id != null);

  hpMult *= 1 + vitality * 0.10;
  speedMult *= 1 + swiftness * 0.05;
  damageMult *= 1 + power * 0.08;
  cooldownMult *= 1 - rapidfire * 0.04;
  let pickupRangeMult = 1 + magnetism * 0.15;
  let xpMult = 1 + greed * 0.20;

  // ---- Breakthrough (돌파) ----
  const breakthrough = owned?.breakthrough ?? 0;
  let startAccessory: AccessoryType | null = null;

  if (breakthrough >= 1) {
    const bt = breakthroughCombatMult(breakthrough);
    hpMult *= bt.hp;
    damageMult *= bt.damage;
    speedMult *= bt.speed;
  }
  if (breakthrough >= 2) {
    // 2돌파: xp gain +30%, pickup range +30%
    pickupRangeMult *= 1.30;
    xpMult *= 1.30;
  }
  if (breakthrough >= 3) {
    // 3돌파: passive enhancement (runtime effects in GameEngine)
    // extraReroll: +2 rerolls per level-up; critStrike: 25% crit; etc.
  }
  if (breakthrough >= 4) {
    // 4돌파: start with paired accessory for evolution
    const startWeapon = charDef?.startWeapon ?? "bullet";
    const evo = EVOLUTIONS[startWeapon as keyof typeof EVOLUTIONS];
    if (evo && !sealedAccessories.includes(evo.pairedAccessory)) {
      startAccessory = evo.pairedAccessory;
    }
  }

  return {
    hpMult,
    speedMult,
    damageMult,
    cooldownMult,
    pickupRangeMult,
    xpMult,
    projectileColor,
    playerColor,
    rerolls: reroll + (breakthrough >= 3 ? 2 : 0),
    passive: charDef?.passive ?? "none",
    startAccessory,
    upgradeChoices: extraChoice > 0 ? 4 : 3,
    sealedWeapons,
    sealedAccessories,
  };
}
