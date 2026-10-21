// ============================================================
//  ui/theme.ts — UI color mapping (single source).
//  Weapon colors come straight from game data (CONFIG.weapons[type].color);
//  accessory colors are defined only here. Icons: see ui/icons.ts.
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { AccessoryType, WeaponType } from "@/game/core/types";

export const ACCESSORY_COLORS: Record<AccessoryType, string> = {
  swiftBoots: "#22d3ee",
  vitalRing: "#fb7185",
  magnetCharm: "#60a5fa",
  powerAmulet: "#f59e0b",
  hastePendant: "#a78bfa",
  xpcrystal: "#34d399",
  thornArmor: "#f472b6",
  shieldForge: "#94a3b8",
  natureBlessing: "#4ade80",
  keenRing: "#facc15",
  goldPurse: "#eab308",
  vampireFang: "#be123c",
};

export function accessoryColor(type?: AccessoryType): string {
  return (type && ACCESSORY_COLORS[type]) ?? "#888888";
}

export function weaponColor(type: WeaponType): string {
  return CONFIG.weapons[type]?.color ?? "#888888";
}

/**
 * Character colors are also used as in-game player colors and some are very dark
 * (e.g. Linya #1f2937). For icons/borders on the dark UI, lift too-dark colors.
 */
export function readableAccent(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.25 ? "#cbd5e1" : hex;
}
