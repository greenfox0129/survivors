#!/usr/bin/env node
// ============================================================
//  scripts/sim.mjs — headless gameplay regression test
//
//    npm run sim                 # all characters, 6 game-minutes each
//    npm run sim -- --minutes 2  # shorter
//
//  Loads the real GameEngine through Vite SSR (no browser) and fast-forwards
//  update() with an auto-picking, invulnerable pilot. Fails (exit 1) on:
//    - exceptions, NaN positions/HP, entity counts above their caps
//    - a level-up pause with no options (soft-lock)
//    - level-up queue miscount (multi-level gem + treasure in one frame)
//    - evolved weapons not keeping their max level
//  Rendering is not exercised here (needs a real canvas) — check visuals in the browser.
// ============================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argMinutes = process.argv.indexOf("--minutes");
const MINUTES = argMinutes > 0 ? Number(process.argv[argMinutes + 1]) || 6 : 6;
const DT = 1 / 60;

const server = await createServer({
  root,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false },
});

const failures = [];
const fail = (msg) => failures.push(msg);

try {
  const { GameEngine } = await server.ssrLoadModule("/src/game/core/GameEngine.ts");
  const { CHARACTERS } = await server.ssrLoadModule("/src/game/data/progression.ts");
  const { CONFIG } = await server.ssrLoadModule("/src/game/data/config.ts");

  const ctxStub = {}; // update() never touches the canvas
  const makeSave = (id, bt = 4) => ({
    schemaVersion: 2,
    gold: 0,
    owned: CHARACTERS.map((c) => ({ id: c.id, level: 10, stars: 5, memories: 0, breakthrough: bt })),
    traitLevels: { reroll: 3 },
    selectedCharacter: id,
    stars: 0,
    completedAchievements: [],
  });

  // ---------------------------------------------------------------- 1. long runs
  const rows = [];
  for (const ch of CHARACTERS) {
    let pick = null;
    let levelups = 0;
    const evolved = [];
    const engine = new GameEngine(ctxStub, {
      onStatsUpdate() {},
      onLevelUp(opts) {
        levelups++;
        if (!opts.length) fail(`${ch.id}: onLevelUp with 0 options`);
        pick =
          opts.find((o) => o.kind === "weaponEvolve") ??
          opts.find((o) => o.kind === "weaponLevel") ??
          opts.find((o) => o.kind === "newAccessory") ??
          opts[0];
      },
      onGameOver() {},
    }, makeSave(ch.id));
    const P = () => engine.player;
    let maxEnemies = 0;
    let maxGems = 0;
    try {
      const steps = Math.round(MINUTES * 60 / DT);
      for (let i = 0; i < steps; i++) {
        P().hp = P().maxHp; // invulnerable pilot
        // steady level-ups (one gem worth a full level dropped at the pilot's feet every 1.5s)
        if (i % 90 === 0) engine.gems.push({ id: 1e6 + i, x: P().x, y: P().y, radius: 7, value: P().xpToNext, alive: true });
        if (engine.paused) {
          if (!pick) throw new Error("paused with no pending pick (soft-lock)");
          const o = pick;
          pick = null;
          if (o.kind === "weaponEvolve") evolved.push(o.weaponType);
          engine.applyUpgrade(o);
          continue;
        }
        engine.update(DT);
        if (i % 60 === 0) {
          maxEnemies = Math.max(maxEnemies, engine.enemies.length);
          maxGems = Math.max(maxGems, engine.gems.length);
          if (!Number.isFinite(P().x + P().y)) throw new Error("player position NaN");
          for (const e of engine.enemies) {
            if (!Number.isFinite(e.x + e.y + e.hp)) throw new Error(`enemy NaN (${e.enemyType})`);
          }
          for (const g of engine.gems) if (!Number.isFinite(g.value)) throw new Error("gem value NaN");
        }
      }
    } catch (err) {
      fail(`${ch.id}: ${err && err.stack ? err.stack.split("\n").slice(0, 2).join(" | ") : err}`);
    }
    // caps: regular spawns stop at maxCount; elites (1/min) may exceed it slightly
    const enemyCap = CONFIG.enemy.maxCount + Math.ceil(MINUTES) + 1;
    if (maxEnemies > enemyCap) fail(`${ch.id}: ${maxEnemies} enemies > cap ${enemyCap}`);
    if (maxGems > 41) fail(`${ch.id}: ${maxGems} gems > 41`);
    for (const w of engine.weaponMgr.weapons) {
      if (w.evolved && w.level !== CONFIG.weapons[w.type].maxLevel) fail(`${ch.id}: evolved ${w.type} level ${w.level}`);
    }
    const st = engine.getStats();
    rows.push({
      char: ch.id,
      lv: st.level,
      kills: st.kills,
      levelups,
      evolved: evolved.join(",") || "-",
      weapons: st.weapons.map((w) => `${w.type}${w.evolved ? "*" : w.level}`).join(" "),
      maxEnemies,
      maxGems,
    });
    engine.stop();
  }
  console.table(rows);

  // ---------------------------------------------------------------- 2. level-up queue
  {
    let opens = 0;
    let last = null;
    const engine = new GameEngine(ctxStub, { onStatsUpdate() {}, onLevelUp(o) { opens++; last = o; }, onGameOver() {} }, makeSave("survivor", 0));
    const P = engine.player;
    const before = P.level;
    engine.gems.push(
      { id: 1, x: P.x, y: P.y, radius: 7, value: 40, alive: true },
      { id: 2, x: P.x, y: P.y, radius: 12, value: 0, alive: true, isTreasure: true },
    );
    engine.update(DT);
    const expected = P.level - before + 1;
    let picks = 0;
    while (engine.paused && picks < 100) {
      engine.applyUpgrade(last[0]);
      picks++;
    }
    console.log(`queue: levels+treasure=${expected} picks, modal opened ${opens}x, picks made ${picks}`);
    if (opens !== expected || picks !== expected || engine.paused) fail(`level-up queue: expected ${expected}, opened ${opens}, picked ${picks}`);
    engine.stop();
  }

  // ---------------------------------------------------------------- 3. exhausted options must not soft-lock
  {
    let opens = 0;
    const engine = new GameEngine(ctxStub, { onStatsUpdate() {}, onLevelUp() { opens++; }, onGameOver() {} }, makeSave("survivor", 0));
    const wm = engine.weaponMgr;
    const am = engine.accessoryMgr;
    for (const t of ["melee", "bomb", "trap", "aura", "shuriken"]) wm.addWeapon(t);
    for (const w of wm.weapons) for (let i = 0; i < 8; i++) wm.levelUpWeapon(w.type);
    am.reset();
    for (const a of ["powerAmulet", "swiftBoots", "thornArmor", "shieldForge", "natureBlessing"]) {
      am.addAccessory(a);
      for (let i = 0; i < 5; i++) am.levelUpAccessory(a);
    }
    wm.evolveWeapon("bullet");
    wm.evolveWeapon("melee");
    engine.player.xp += engine.player.xpToNext * 3;
    engine.update(DT);
    console.log(`exhausted pool: modal opened ${opens}x, paused=${engine.paused}`);
    if (opens !== 0 || engine.paused) fail("exhausted upgrade pool soft-locks the game");
    engine.stop();
  }
} catch (err) {
  fail(`setup: ${err && err.stack ? err.stack : err}`);
} finally {
  await server.close();
}

if (failures.length) {
  console.error(`\n[sim] FAILED (${failures.length})`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\n[sim] OK");
