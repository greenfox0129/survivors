// Visual smoke scene (see scene.html). Dev-only — not part of the game bundle.
import { GameEngine } from "@/game/core/GameEngine";
import { CONFIG } from "@/game/data/config";
import { updateSettings } from "@/game/core/settings";
import type { SaveData } from "@/game/core/storage";

const params = new URLSearchParams(location.search);
const quality = (params.get("quality") as "high" | "low" | null) ?? "high";
updateSettings({ quality });

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;
const status = document.getElementById("status")!;

CONFIG.elite.spawnInterval = 6; // in-memory only: get an elite on screen quickly

const save: SaveData = {
  schemaVersion: 2,
  gold: 0,
  owned: [{ id: params.get("char") ?? "survivor", level: 5, stars: 3, memories: 0, breakthrough: 4 }],
  traitLevels: {},
  selectedCharacter: params.get("char") ?? "survivor",
  stars: 0,
  completedAchievements: [],
};

const engine = new GameEngine(ctx, { onStatsUpdate() {}, onLevelUp() {}, onGameOver() {} }, save);
// Internals are private in TS; this dev tool pokes them on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const e = engine as any;
const wm = e.weaponMgr;
for (const t of ["shuriken", "bomb", "trap", "melee"]) wm.addWeapon(t);
for (let i = 0; i < 4; i++) for (const w of wm.weapons) wm.levelUpWeapon(w.type);

const DT = 1 / 60;
function step(seconds: number) {
  for (let i = 0; i < seconds * 60; i++) {
    e.player.hp = e.player.maxHp;
    if (e.paused) e.paused = false; // skip level-up picks in this scene
    e.update(DT);
  }
}

step(14);
// a treasure chest next to the player (outside pickup range)
e.gems.push({ id: 999999, x: e.player.x + 120, y: e.player.y - 60, radius: 12, value: 0, alive: true, isTreasure: true });
step(0.25);

let frames = 0;
function draw() {
  e.render();
  frames++;
  status.textContent = `quality=${quality} · enemies=${e.enemies.length} · gems=${e.gems.length} · frame ${frames}`;
  if (frames < 20) setTimeout(draw, 100); // let lazy images finish loading, then re-render
}
draw();
