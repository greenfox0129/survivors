// ============================================================
//  settings.ts — Player settings (graphics quality, sound) persisted in localStorage.
//  Separate from the save file on purpose: settings are per-device, saves are progress.
// ============================================================

export type QualitySetting = "auto" | "high" | "low";

export interface GameSettings {
  quality: QualitySetting;
  /** Master SFX volume 0..1 */
  volume: number;
  muted: boolean;
}

const SETTINGS_KEY = "survivors_proto_settings";

const DEFAULTS: GameSettings = {
  quality: "auto",
  volume: 0.8,
  muted: false,
};

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<GameSettings>) : {};
    const quality: QualitySetting =
      parsed.quality === "high" || parsed.quality === "low" || parsed.quality === "auto"
        ? parsed.quality
        : DEFAULTS.quality;
    const volume =
      typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
        ? Math.min(1, Math.max(0, parsed.volume))
        : DEFAULTS.volume;
    return { quality, volume, muted: parsed.muted === true };
  } catch {
    // localStorage unavailable (Node, private mode) — use defaults
    return { ...DEFAULTS };
  }
}

let current: GameSettings = load();
const listeners = new Set<(s: GameSettings) => void>();

export function getSettings(): Readonly<GameSettings> {
  return current;
}

export function updateSettings(patch: Partial<GameSettings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {
    // ignore (private mode / quota)
  }
  for (const fn of listeners) fn(current);
}

/** Subscribe to settings changes. Returns an unsubscribe function. */
export function subscribeSettings(fn: (s: GameSettings) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
