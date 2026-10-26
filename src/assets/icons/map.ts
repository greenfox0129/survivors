// ============================================================
//  assets/icons/map.ts — Semantic icon mapping (game ids → icon file names).
//  Single place to change which picture represents a weapon/accessory/enemy/etc.
//  Used by both the UI (via ui/icons.ts) and the canvas (render/iconSprites.ts).
// ============================================================

import type { AccessoryType, UpgradeOption, WeaponType } from "@/game/core/types";

export function weaponIcon(type: WeaponType, evolved = false, superForm = false): string {
  // Evolved fist keeps the plain punch icon.
  if (type === "fist") return "weapon-fist";
  if (type === "axe" && superForm) return "weapon-axe-super";
  return `weapon-${type}${evolved ? "-evo" : ""}`;
}

export function accessoryIconName(type: AccessoryType): string {
  return `acc-${type}`;
}

export function enemyIcon(enemyId: string, elite = false): string {
  return elite ? "enemy-elite" : `enemy-${enemyId}`;
}

export function characterIcon(charId: string): string {
  return `char-${charId}`;
}

const TRAIT_ICONS: Record<string, string> = {
  vitality: "trait-vitality",
  swiftness: "trait-swiftness",
  power: "trait-power",
  rapidfire: "trait-rapidfire",
  magnetism: "acc-magnetCharm",
  greed: "trait-greed",
  reroll: "ui-reroll",
  extraChoice: "ui-upgrade",
};

export function traitIcon(traitId: string): string {
  return TRAIT_ICONS[traitId] ?? "menu-traits";
}

/** Icon for a level-up option card. */
export function upgradeIcon(opt: UpgradeOption): string {
  if (opt.weaponType) return weaponIcon(opt.weaponType, opt.kind === "weaponEvolve", opt.superForm === true);
  if (opt.accessoryType) return accessoryIconName(opt.accessoryType);
  return "ui-upgrade";
}

/** Fixed UI glyphs */
export const UI_ICONS = {
  play: "menu-play",
  gacha: "menu-gacha",
  characters: "menu-characters",
  traits: "menu-traits",
  codex: "menu-codex",
  achievements: "menu-achievements",
  gold: "stat-gold",
  star: "ui-star",
  memory: "ui-memory",
  breakthrough: "ui-breakthrough",
  time: "stat-time",
  kills: "stat-kills",
  score: "stat-score",
  level: "ui-upgrade",
  reroll: "ui-reroll",
  treasure: "ui-treasure",
  xpGem: "ui-xp-gem",
  sound: "ui-sound",
  crown: "ui-crown",
} as const;
