// ============================================================
//  storage.ts — localStorage persistence for meta-progression
// ============================================================

import {
  DEFAULT_GOLD,
  DEFAULT_OWNED,
  DEFAULT_TRAIT_LEVELS,
  DEFAULT_COMPLETED_ACHIEVEMENTS,
  type OwnedCharacter,
} from "./data";

const STORAGE_KEY = "vs_proto_save";

export interface SaveData {
  gold: number;
  owned: OwnedCharacter[];
  traitLevels: Record<string, number>;
  selectedCharacter: string;
  stars: number;
  completedAchievements: string[];
}

function defaultSave(): SaveData {
  return {
    gold: DEFAULT_GOLD,
    owned: [...DEFAULT_OWNED],
    traitLevels: { ...DEFAULT_TRAIT_LEVELS },
    selectedCharacter: "survivor",
    stars: 0,
    completedAchievements: [...DEFAULT_COMPLETED_ACHIEVEMENTS],
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const owned = (parsed.owned ?? [...DEFAULT_OWNED]).map((o) => ({
      ...o,
      memories: o.memories ?? 0,
      breakthrough: o.breakthrough ?? 0,
    }));
    const rawAchievements = parsed.completedAchievements ?? [...DEFAULT_COMPLETED_ACHIEVEMENTS];
    // Migrate old max_* achievement IDs to evo_*
    const migratedAchievements = rawAchievements.map((id) =>
      id.startsWith("max_") ? "evo_" + id.slice(4) : id
    );
    return {
      ...defaultSave(),
      ...parsed,
      owned,
      traitLevels: parsed.traitLevels ?? { ...DEFAULT_TRAIT_LEVELS },
      stars: parsed.stars ?? 0,
      completedAchievements: migratedAchievements,
    };
  } catch {
    return defaultSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}
