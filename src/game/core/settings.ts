// ============================================================
//  settings.ts — Player settings (graphics quality, sound) persisted in localStorage.
//  Separate from the save file on purpose: settings are per-device, saves are progress.
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { WeaponType } from "@/game/core/types";

export type QualitySetting = "auto" | "high" | "low";

/**
 * One drawn layer. A weapon with two looks (the bomb and its burn field)
 * has two ids so each slider only fades its own pixels. Damage is untouched.
 */
export type WeaponOpacityId =
  | "bullet"
  | "melee"
  | "bomb"
  | "bombBurn"
  | "trap"
  | "trapSlow"
  | "aura"
  | "shuriken"
  | "claw"
  | "fist"
  | "axe"
  | "axeWave";

export interface WeaponOpacityLayer {
  id: WeaponOpacityId;
  weapon: WeaponType;
  label: string;
  /** Indented under the weapon. Same weapon, a different picture. */
  sub: boolean;
}

export const WEAPON_OPACITY_LAYERS: readonly WeaponOpacityLayer[] = [
  { id: "bullet", weapon: "bullet", label: CONFIG.weapons.bullet.name, sub: false },
  { id: "melee", weapon: "melee", label: CONFIG.weapons.melee.name, sub: false },
  { id: "bomb", weapon: "bomb", label: CONFIG.weapons.bomb.name, sub: false },
  { id: "bombBurn", weapon: "bomb", label: "잔류 화염", sub: true },
  { id: "trap", weapon: "trap", label: CONFIG.weapons.trap.name, sub: false },
  { id: "trapSlow", weapon: "trap", label: "감속 장판", sub: true },
  { id: "aura", weapon: "aura", label: CONFIG.weapons.aura.name, sub: false },
  { id: "shuriken", weapon: "shuriken", label: CONFIG.weapons.shuriken.name, sub: false },
  { id: "claw", weapon: "claw", label: CONFIG.weapons.claw.name, sub: false },
  { id: "fist", weapon: "fist", label: CONFIG.weapons.fist.name, sub: false },
  { id: "axe", weapon: "axe", label: CONFIG.weapons.axe.name, sub: false },
  { id: "axeWave", weapon: "axe", label: "충격파", sub: true },
];

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
  /** Missing ids stay fully opaque. 0 hides the picture and still deals damage. */
  weaponOpacity: Partial<Record<WeaponOpacityId, number>>;
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
  weaponOpacity: {},
};

interface StoredSettings extends Partial<GameSettings> {
  /** Previous single volume. Copied onto every channel the first time the split settings load. */
  volume?: number;
  muted?: boolean;
}

function clamp01(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function clampVolume(value: unknown, fallback: number): number {
  return clamp01(value, fallback);
}

const OPACITY_IDS = new Set<string>(WEAPON_OPACITY_LAYERS.map((layer) => layer.id));

function loadOpacity(value: unknown): Partial<Record<WeaponOpacityId, number>> {
  if (!value || typeof value !== "object") return {};
  const out: Partial<Record<WeaponOpacityId, number>> = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!OPACITY_IDS.has(id) || typeof raw !== "number" || !Number.isFinite(raw)) continue;
    out[id as WeaponOpacityId] = clamp01(raw, 1);
  }
  return out;
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
      weaponOpacity: loadOpacity(parsed.weaponOpacity),
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

/** 1 when the player has not moved that slider. */
export function weaponOpacity(id: WeaponOpacityId): number {
  return clamp01(current.weaponOpacity[id], 1);
}

export function setWeaponOpacity(id: WeaponOpacityId, value: number): void {
  updateSettings({ weaponOpacity: { ...current.weaponOpacity, [id]: clamp01(value, 1) } });
}

/**
 * Fade one weapon layer. Returns false when it is fully hidden, so the caller
 * skips the draw. Always pair a true result with popWeaponFade, including on
 * an early return (try/finally).
 */
export function pushWeaponFade(ctx: CanvasRenderingContext2D, id: WeaponOpacityId): boolean {
  const a = weaponOpacity(id);
  if (a <= 0) return false;
  ctx.save();
  if (a < 1) ctx.globalAlpha *= a;
  return true;
}

export function popWeaponFade(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

/** Subscribe to settings changes. Returns an unsubscribe function. */
export function subscribeSettings(fn: (s: GameSettings) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
