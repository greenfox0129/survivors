// ============================================================
//  storage.ts — localStorage persistence for meta-progression
//
//  세이브 스키마는 버전 관리된다. 저장 구조를 바꾸는 업데이트를 할 때는:
//   1) SAVE_SCHEMA_VERSION 을 1 올리고
//   2) MIGRATIONS 에 "이전 버전 → 새 버전" 변환 함수를 추가한다.
//  기존 플레이어의 세이브는 로드 시 순서대로 자동 변환된다.
//  ⚠ STORAGE_KEY 는 절대 바꾸지 않는다 (바꾸면 모든 기존 세이브가 사라진 것처럼 보인다).
// ============================================================

import { normalizeConstraintLevels } from "@/game/data/constraints";
import { normalizeCompanion, type CompanionRoll } from "@/game/data/companions";
import { allAccessoryTypes } from "@/game/systems/AccessoryManager";
import { allWeaponTypes } from "@/game/systems/WeaponManager";
import type { AccessoryType, WeaponType } from "@/game/core/types";
import {
  DEFAULT_GOLD,
  DEFAULT_OWNED,
  DEFAULT_TRAIT_LEVELS,
  DEFAULT_COMPLETED_ACHIEVEMENTS,
  MAX_IMPRINT,
  RETIRED_STAR_TRAITS,
  type OwnedCharacter,
} from "@/game/data/progression";

const STORAGE_KEY = "vs_proto_save";
export const SAVE_STORAGE_KEY = STORAGE_KEY;

/** 현재 세이브 스키마 버전 */
export const SAVE_SCHEMA_VERSION = 9;

export type SealPay = "gold" | "star";

export interface SealPayment {
  weaponSeal: SealPay | null;
  accessorySeal: SealPay | null;
}

export interface SaveData {
  schemaVersion: number;
  gold: number;
  owned: OwnedCharacter[];
  traitLevels: Record<string, number>;
  selectedCharacter: string;
  stars: number;
  completedAchievements: string[];
  /** 제약 단계. 키는 constraints.ts 의 id, 값은 0(해제)부터. */
  constraintLevels: Record<string, number>;
  /** 정비에서 뽑은 동행자. 판이 시작되면 null. */
  companion: CompanionRoll | null;
  /** 별 봉인으로 고른 무기. 레벨이 0이면 무시된다. */
  sealedWeapon: WeaponType | null;
  /** 골드 봉인으로 고른 무기. 별 봉인과 다른 하나다. */
  sealedWeaponGold: WeaponType | null;
  /** 별 봉인으로 고른 장신구. 레벨이 0이면 무시된다. */
  sealedAccessory: AccessoryType | null;
  /** 골드 봉인으로 고른 장신구. 별 봉인과 다른 하나다. */
  sealedAccessoryGold: AccessoryType | null;
  /** 마지막 저장 시각(ms) — 원클릭 실행기의 디스크 백업과 비교할 때 사용 */
  updatedAt?: number;
}

type RawSave = Record<string, unknown>;

/**
 * MIGRATIONS[n] 은 스키마 n 을 n+1 로 올린다.
 * 함수는 입력을 변경하지 말고 새 객체를 반환할 것.
 */
const MIGRATIONS: Record<number, (raw: RawSave) => RawSave> = {
  // v1 = Bolt 원본 세이브 (schemaVersion 필드 없음)
  // → v2: 캐릭터에 기억(memories)/돌파(breakthrough) 필드 추가, 업적 ID max_* → evo_*
  1: (raw) => {
    const owned = Array.isArray(raw.owned) ? (raw.owned as Partial<OwnedCharacter>[]) : undefined;
    const achievements = Array.isArray(raw.completedAchievements)
      ? (raw.completedAchievements as string[])
      : undefined;
    return {
      ...raw,
      owned: owned?.map((o) => ({ ...o, memories: o.memories ?? 0, breakthrough: o.breakthrough ?? 0 })),
      completedAchievements: achievements?.map((id) => (id.startsWith("max_") ? "evo_" + id.slice(4) : id)),
    };
  },
  // v2 → v3: 로비 제약. 없는 세이브는 전부 해제.
  2: (raw) => ({ ...raw, constraintLevels: raw.constraintLevels ?? {} }),
  // v3 → v4: 한 판짜리 정비 보급. 곧 동행자로 바뀌며 환불된다.
  3: (raw) => ({ ...raw, prep: raw.prep ?? {} }),
  // v4 → v5: 보급 4종을 지우고 동행자 가챠로 바꾼다. 사 둔 보급은 골드로 돌려준다.
  4: (raw) => {
    const prep = raw.prep;
    let gold = typeof raw.gold === "number" ? raw.gold : 0;
    if (prep && typeof prep === "object") {
      const costs: Record<string, number> = { hp: 200, power: 250, speed: 200, study: 200 };
      const bag = prep as Record<string, unknown>;
      for (const id of Object.keys(costs)) {
        if (bag[id] === 1) gold += costs[id];
      }
    }
    return { ...raw, gold, companion: null };
  },
  // v5 → v6: 별 특성으로 무기·장신구를 하나씩 봉인할 수 있다.
  5: (raw) => ({ ...raw, sealedWeapon: null, sealedAccessory: null }),
  // v6 → v7: 같은 봉인을 골드로도 산다. 이미 산 것은 별로 낸 것이다.
  6: (raw) => {
    const levels = raw.traitLevels && typeof raw.traitLevels === "object"
      ? (raw.traitLevels as Record<string, unknown>)
      : {};
    const paid = (id: string): SealPay | null =>
      typeof levels[id] === "number" && (levels[id] as number) > 0 ? "star" : null;
    return {
      ...raw,
      sealPayment: { weaponSeal: paid("weaponSeal"), accessorySeal: paid("accessorySeal") },
    };
  },
  // v7 → v8: 별 봉인과 골드 봉인은 서로 다른 칸이다. 둘 다 사면 두 개를 막는다.
  7: (raw) => {
    const levels = raw.traitLevels && typeof raw.traitLevels === "object"
      ? { ...(raw.traitLevels as Record<string, unknown>) }
      : {};
    const pay = raw.sealPayment && typeof raw.sealPayment === "object"
      ? (raw.sealPayment as Record<string, unknown>)
      : {};
    const split = (starId: string, goldId: string, value: unknown) => {
      if (pay[starId] === "gold" && typeof value === "string") {
        levels[starId] = 0;
        levels[goldId] = 1;
        return { star: null, gold: value };
      }
      levels[goldId] = levels[goldId] ?? 0;
      return { star: value ?? null, gold: null };
    };
    const weapon = split("weaponSeal", "weaponSealGold", raw.sealedWeapon);
    const accessory = split("accessorySeal", "accessorySealGold", raw.sealedAccessory);
    return {
      ...raw,
      traitLevels: levels,
      sealedWeapon: weapon.star,
      sealedWeaponGold: weapon.gold,
      sealedAccessory: accessory.star,
      sealedAccessoryGold: accessory.gold,
    };
  },
  // v8 → v9: 4돌파 뒤 기억으로 사는 각인. 없는 세이브는 0.
  8: (raw) => {
    const owned = Array.isArray(raw.owned) ? (raw.owned as Partial<OwnedCharacter>[]) : undefined;
    return {
      ...raw,
      owned: owned?.map((o) => ({ ...o, imprint: o.imprint ?? 0 })),
    };
  },
};

function defaultSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gold: DEFAULT_GOLD,
    owned: [...DEFAULT_OWNED],
    traitLevels: { ...DEFAULT_TRAIT_LEVELS },
    selectedCharacter: "survivor",
    stars: 0,
    completedAchievements: [...DEFAULT_COMPLETED_ACHIEVEMENTS],
    constraintLevels: normalizeConstraintLevels(undefined),
    companion: null,
    sealedWeapon: null,
    sealedWeaponGold: null,
    sealedAccessory: null,
    sealedAccessoryGold: null,
  };
}

/** 원시 세이브를 현재 스키마까지 순서대로 변환한다. */
export function migrateSave(input: RawSave): RawSave {
  let raw = input;
  let version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 1;
  while (version < SAVE_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break; // 누락된 마이그레이션 — 기본값 보정에 맡긴다
    raw = step(raw);
    version++;
  }
  return { ...raw, schemaVersion: Math.max(version, SAVE_SCHEMA_VERSION) };
}

/** 변환된 세이브에 빠진 필드를 기본값으로 채운다. */
/** Those three traits shipped only in a local build, at 1 star per level. */
function refundRetiredStarTraits(
  traitLevels: Record<string, number>,
  stars: number,
): { traitLevels: Record<string, number>; stars: number } {
  const next = { ...traitLevels };
  let refund = 0;
  for (const id of RETIRED_STAR_TRAITS) {
    refund += next[id] ?? 0;
    delete next[id];
  }
  return { traitLevels: next, stars: stars + refund };
}

function normalize(raw: RawSave): SaveData {
  const base = defaultSave();
  const parsed = raw as Partial<SaveData>;
  const traits = refundRetiredStarTraits(
    { ...base.traitLevels, ...(parsed.traitLevels ?? {}) },
    parsed.stars ?? 0,
  );
  return {
    ...base,
    ...parsed,
    owned: (parsed.owned ?? base.owned).map((o) => ({
      ...o,
      memories: o.memories ?? 0,
      breakthrough: o.breakthrough ?? 0,
      imprint: Math.min(MAX_IMPRINT, Math.max(0, Math.floor(o.imprint ?? 0))),
    })),
    traitLevels: traits.traitLevels,
    stars: traits.stars,
    completedAchievements: parsed.completedAchievements ?? base.completedAchievements,
    constraintLevels: normalizeConstraintLevels(parsed.constraintLevels ?? raw.constraintLevels),
    companion: normalizeCompanion(parsed.companion ?? raw.companion),
    sealedWeapon: sealId(parsed.sealedWeapon, allWeaponTypes(), traits.traitLevels.weaponSeal ?? 0),
    sealedWeaponGold: sealId(parsed.sealedWeaponGold, allWeaponTypes(), traits.traitLevels.weaponSealGold ?? 0),
    sealedAccessory: sealId(parsed.sealedAccessory, allAccessoryTypes(), traits.traitLevels.accessorySeal ?? 0),
    sealedAccessoryGold: sealId(parsed.sealedAccessoryGold, allAccessoryTypes(), traits.traitLevels.accessorySealGold ?? 0),
  };
}

function sealId<T extends string>(value: unknown, allowed: readonly T[], level: number): T | null {
  if (level <= 0 || typeof value !== "string") return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    return normalize(migrateSave(JSON.parse(raw) as RawSave));
  } catch {
    return defaultSave();
  }
}

let saveMirror: ((json: string) => void) | null = null;

/**
 * 세이브가 저장될 때마다 함께 호출할 추가 저장소를 등록한다.
 * (원클릭 실행기 모드에서 디스크 백업에 사용 — src/launcherBridge.ts)
 */
export function setSaveMirror(fn: ((json: string) => void) | null): void {
  saveMirror = fn;
}

export function saveSave(data: SaveData): void {
  const json = JSON.stringify({ ...data, schemaVersion: SAVE_SCHEMA_VERSION, updatedAt: Date.now() });
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // ignore quota errors
  }
  saveMirror?.(json);
}
