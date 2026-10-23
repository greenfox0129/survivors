// ============================================================
//  bgm.ts — Looping lobby and in-game music.
//  One track at a time. Lobby pauses on a run and resumes afterwards.
//  The run track starts over each time a run begins.
//  Browser autoplay may wait for the first click or key.
// ============================================================

import lobbyBgmUrl from "@/assets/audio/lobby-bgm.mp3";
import ingameBgmUrl from "@/assets/audio/ingame-bgm.mp3";
import { getSettings, subscribeSettings } from "@/game/core/settings";

type Track = "lobby" | "game";

let lobby: HTMLAudioElement | null = null;
let game: HTMLAudioElement | null = null;
let track: Track = "lobby";
let wired = false;
let unlockArmed = false;
let unlockHandler: (() => void) | null = null;

/** Applied before the slider. The files are mastered hot, so 100% on the slider is one tenth of the file. */
const BGM_BASE_GAIN = 1 / 10;

function lobbyLevel(): number {
  const s = getSettings();
  return (s.lobbyMuted ? 0 : s.lobbyVolume) * BGM_BASE_GAIN;
}

function ingameLevel(): number {
  const s = getSettings();
  return (s.ingameMuted ? 0 : s.ingameVolume) * BGM_BASE_GAIN;
}

function canPlay(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function wire(): void {
  if (wired || !canPlay()) return;
  wired = true;
  subscribeSettings(() => {
    if (lobby) lobby.volume = lobbyLevel();
    if (game) game.volume = ingameLevel();
  });
}

function make(url: string, volume: number): HTMLAudioElement {
  const el = new Audio(url);
  el.loop = true;
  el.preload = "auto";
  el.volume = volume;
  wire();
  return el;
}

function ensureLobby(): HTMLAudioElement | null {
  if (!canPlay()) return null;
  if (!lobby) lobby = make(lobbyBgmUrl, lobbyLevel());
  return lobby;
}

function ensureGame(): HTMLAudioElement | null {
  if (!canPlay()) return null;
  if (!game) game = make(ingameBgmUrl, ingameLevel());
  return game;
}

function disarmUnlock(): void {
  if (unlockHandler && typeof window !== "undefined") {
    window.removeEventListener("pointerdown", unlockHandler);
    window.removeEventListener("keydown", unlockHandler);
  }
  unlockHandler = null;
  unlockArmed = false;
}

function watch(pending: Promise<void> | undefined): void {
  if (!pending) return;
  pending.then(() => disarmUnlock()).catch(() => armUnlock());
}

function armUnlock(): void {
  if (unlockArmed || !canPlay()) return;
  unlockArmed = true;
  const start = () => {
    if (track === "game") playIngameBgm();
    else playLobbyBgm();
  };
  unlockHandler = start;
  window.addEventListener("pointerdown", start);
  window.addEventListener("keydown", start);
}

/** Resume the lobby loop. Safe to call on every lobby-side navigation. */
export function playLobbyBgm(): void {
  track = "lobby";
  game?.pause();
  const el = ensureLobby();
  if (!el) return;
  el.volume = lobbyLevel();
  watch(el.play());
}

/** Start the run loop from the beginning, unless it is already playing. */
export function playIngameBgm(): void {
  track = "game";
  const el = ensureGame();
  lobby?.pause();
  if (!el) return;
  el.volume = ingameLevel();
  if (!el.paused) return;
  el.currentTime = 0;
  watch(el.play());
}
