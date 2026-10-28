// ============================================================
//  companions.ts — One-run companions from the lobby prep gacha.
//  A pull is stored until the run starts, then removed from the save.
// ============================================================

import type { WeaponType } from "@/game/core/types";
import { CONFIG } from "@/game/data/config";

export const COMPANION_PULL_COST = 3000;

export type CompanionKind = "mercenary" | "cat" | "warden";

/** Every weapon the mercenary can roll. A new WeaponType must be added here. */
export const MERC_WEAPONS = {
  bullet: true,
  melee: true,
  bomb: true,
  trap: true,
  aura: true,
  shuriken: true,
  claw: true,
  fist: true,
  axe: true,
} satisfies Record<WeaponType, true>;

export const MERC_WEAPON_IDS = Object.keys(MERC_WEAPONS) as WeaponType[];

export interface CompanionRoll {
  kind: CompanionKind;
  /** Mercenary only. */
  weapon?: WeaponType;
  /** Mercenary only. 1..3. */
  weaponLevel?: number;
}

export const COMPANIONS = {
  mercenary: {
    name: "수습 용병",
    desc: "1~3레벨 무기 하나로 따라다니며 같이 공격합니다.",
    followDistance: 36,
    speed: 240,
    radius: 9,
    color: "#f59e0b",
    border: "#78350f",
  },
  cat: {
    name: "복고양이",
    desc: "공격은 하지 않고, 맵을 돌아다니며 경험치 구슬을 주워 옵니다.",
    speed: 155,
    radius: 8,
    color: "#fb923c",
    border: "#7c2d12",
    seekRange: 780,
    leash: 1100,
    scoopRadius: 14,
    wanderInterval: 1.4,
  },
  warden: {
    name: "보호의 정령",
    desc: "받는 피해를 보호막이 대신 맞습니다. 깨지면 8초 뒤 다시 찹니다.",
    shield: 40,
    regenDelay: 8,
    followDistance: 30,
    speed: 240,
    radius: 8,
    color: "#67e8f9",
    border: "#155e75",
  },
} as const;

const KINDS: readonly CompanionKind[] = ["mercenary", "cat", "warden"];

export function rollCompanion(rng: () => number = Math.random): CompanionRoll {
  const kind = KINDS[Math.floor(rng() * KINDS.length)] ?? "mercenary";
  if (kind !== "mercenary") return { kind };
  const weapon = MERC_WEAPON_IDS[Math.floor(rng() * MERC_WEAPON_IDS.length)] ?? "bullet";
  const weaponLevel = 1 + Math.floor(rng() * 3);
  return { kind, weapon, weaponLevel };
}

export function normalizeCompanion(raw: unknown): CompanionRoll | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Partial<CompanionRoll>;
  if (src.kind !== "mercenary" && src.kind !== "cat" && src.kind !== "warden") return null;
  if (src.kind !== "mercenary") return { kind: src.kind };
  const weapon = src.weapon;
  const level = src.weaponLevel;
  if (!weapon || !MERC_WEAPONS[weapon]) return null;
  if (level !== 1 && level !== 2 && level !== 3) return null;
  return { kind: "mercenary", weapon, weaponLevel: level };
}

/** Mercenary weapon and level, such as "라이플 Lv2". */
export function mercenaryGear(roll: CompanionRoll): string | null {
  if (roll.kind !== "mercenary" || !roll.weapon || !roll.weaponLevel) return null;
  return `${CONFIG.weapons[roll.weapon].name} Lv${roll.weaponLevel}`;
}

/** Name, plus the mercenary's weapon and level. */
export function companionLabel(roll: CompanionRoll): string {
  const name = COMPANIONS[roll.kind].name;
  const gear = mercenaryGear(roll);
  return gear ? `${name} · ${gear}` : name;
}

export function companionSummary(roll: CompanionRoll | null | undefined): string | null {
  if (!roll) return null;
  return `다음 판 · ${companionLabel(roll)}`;
}
