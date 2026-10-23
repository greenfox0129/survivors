// ============================================================
//  settings.ts — Player settings (graphics quality, sound) persisted in localStorage.
//  Separate from the save file on purpose: settings are per-device, saves are progress.
// ============================================================

export type QualitySetting = "auto" | "high" | "low";

export interface GameSettings {
  quality: QualitySetting;
  /** Lobby music 0..1. Mute keeps this number so unmuting restores it. */
  lobbyVolume: number;
  lobbyMuted: boolean;
  /** Run music 0..1. */
  ingameVolume: number;
  ingameMuted: boolean;
  /** Synthesized SFX 0..1. */
  sfxVolume: number;
  sfxMuted: boolean;
  /** Breath follows the mouse instead of the movement direction. */
  breathMouseAim: boolean;
}

const SETTINGS_KEY = "survivors_proto_settings";

const DEFAULTS: GameSettings = {
  quality: "auto",
  lobbyVolume: 0.8,
  lobbyMuted: false,
  ingameVolume: 0.8,
  ingameMuted: false,
  sfxVolume: 0.8,
  sfxMuted: false,
  breathMouseAim: false,
};

interface StoredSettings extends Partial<GameSettings> {
  /** Previous single volume. Copied onto every channel the first time the split settings load. */
  volume?: number;
  muted?: boolean;
}

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed: StoredSettings = raw ? (JSON.parse(raw) as StoredSettings) : {};
    const quality: QualitySetting =
      parsed.quality === "high" || parsed.quality === "low" || parsed.quality === "auto"
        ? parsed.quality
        : DEFAULTS.quality;
    const legacyVolume = clampVolume(parsed.volume, DEFAULTS.lobbyVolume);
    const legacyMuted = parsed.muted === true;
    return {
      quality,
      lobbyVolume: clampVolume(parsed.lobbyVolume, legacyVolume),
      lobbyMuted: typeof parsed.lobbyMuted === "boolean" ? parsed.lobbyMuted : legacyMuted,
      ingameVolume: clampVolume(parsed.ingameVolume, legacyVolume),
      ingameMuted: typeof parsed.ingameMuted === "boolean" ? parsed.ingameMuted : legacyMuted,
      sfxVolume: clampVolume(parsed.sfxVolume, legacyVolume),
      sfxMuted: typeof parsed.sfxMuted === "boolean" ? parsed.sfxMuted : legacyMuted,
      breathMouseAim: parsed.breathMouseAim === true,
    };
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
