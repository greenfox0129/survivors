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
  const { CHARACTERS, imprintTotals } = await server.ssrLoadModule("/src/game/data/progression.ts");
  const { CONFIG, enemyCap, eliteHp, enemyHpScale, midBossHp, finalBossHp, regularSpawnInterval, specialDropChance } = await server.ssrLoadModule("/src/game/data/config.ts");
  const atOneMinute = 0.8 * 0.98 ** 60;
  if (
    Math.abs(regularSpawnInterval(0) - 0.8) > 1e-9 ||
    Math.abs(regularSpawnInterval(60) - atOneMinute) > 1e-9 ||
    Math.abs(regularSpawnInterval(120) - atOneMinute * 0.75) > 1e-9
  ) {
    fail(`spawn interval ${regularSpawnInterval(0)}/${regularSpawnInterval(60)}/${regularSpawnInterval(120)}`);
  }
  const marks = imprintTotals([
    { id: "berserker", breakthrough: 4, imprint: 3 },
    { id: "guardian", breakthrough: 3, imprint: 3 },
  ]);
  if (marks.damage !== 0.15 || marks.hp !== 0) fail(`imprint ${JSON.stringify(marks)}`);
  if (enemyCap(0) !== 120 || enemyCap(60) !== 240 || enemyCap(120) !== 360 || enemyCap(30) !== 180) {
    fail(`enemy cap curve ${enemyCap(0)}/${enemyCap(30)}/${enemyCap(60)}/${enemyCap(120)}`);
  }
  if (enemyCap(0, 2) !== 240) fail(`enemy cap x2 ${enemyCap(0, 2)}`);
  const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  if (
    !close(eliteHp(0), 250) ||
    !close(eliteHp(60), 250 * 2.1) ||
    !close(eliteHp(120), 250 * 2.1 ** 2) ||
    !close(eliteHp(300), 250 * 2.1 ** 5) ||
    !close(eliteHp(360), 250 * 2.1 ** 5 * 1.7)
  ) {
    fail(`elite hp ${eliteHp(0)}/${eliteHp(60)}/${eliteHp(300)}/${eliteHp(360)}`);
  }
  if (
    !close(enemyHpScale(0), 1) ||
    !close(enemyHpScale(300), 1.8 ** 5) ||
    !close(enemyHpScale(360), 1.8 ** 5 * 1.3) ||
    !close(midBossHp(300), 200 * 2.1 ** 5) ||
    !close(finalBossHp(600), 500 * 2.1 ** 5 * 1.7 ** 5)
  ) {
    fail(`hp curve trash ${enemyHpScale(360)} mid ${midBossHp(300)} boss ${finalBossHp(600)}`);
  }
  const baseDrop = 1 / 300;
  if (
    Math.abs(specialDropChance(0) - baseDrop) > 1e-12 ||
    Math.abs(specialDropChance(300) - baseDrop) > 1e-12 ||
    Math.abs(specialDropChance(360) - baseDrop * 0.8) > 1e-12 ||
    Math.abs(specialDropChance(420) - baseDrop * 0.64) > 1e-12
  ) {
    fail(`special drop ${specialDropChance(0)}/${specialDropChance(300)}/${specialDropChance(360)}/${specialDropChance(420)}`);
  }
  const { constraintScore, constraintGoldMultiplier, resolveRunConstraints } = await server.ssrLoadModule("/src/game/data/constraints.ts");
  if (constraintScore(undefined) !== 0 || constraintGoldMultiplier(0) !== 1 || constraintGoldMultiplier(30) !== 1.3) {
    fail("constraint score/gold");
  }
  const mods = resolveRunConstraints({ enemyHp: 2, spawnRate: 3, playerDamage: 1, hpGrowth: 3 });
  if (mods.enemyHp !== 2 || mods.playerDamage !== 0.8 || mods.xp !== 1) {
    fail(`constraint mods ${JSON.stringify(mods)}`);
  }
  if (mods.enemyCount !== undefined || mods.spawnInterval !== undefined || mods.hpGrowth !== undefined) {
    fail("removed constraints should be gone");
  }

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

  const { rollCompanion, normalizeCompanion } = await server.ssrLoadModule("/src/game/data/companions.ts");
  const merc = rollCompanion(() => 0);
  const cat = rollCompanion(() => 0.34);
  const warden = rollCompanion(() => 0.67);
  if (merc.kind !== "mercenary" || merc.weaponLevel !== 1) fail(`companion merc ${JSON.stringify(merc)}`);
  if (cat.kind !== "cat" || warden.kind !== "warden") fail(`companion kinds ${cat.kind}/${warden.kind}`);
  if (normalizeCompanion({ kind: "mercenary", weapon: "nope", weaponLevel: 9 })) fail("bad companion kept");
  if (normalizeCompanion(null) !== null) fail("empty companion");

  const { pickUpgrades } = await server.ssrLoadModule("/src/game/systems/upgrades.ts");
  const { WeaponManager } = await server.ssrLoadModule("/src/game/systems/WeaponManager.ts");
  const { AccessoryManager } = await server.ssrLoadModule("/src/game/systems/AccessoryManager.ts");
  const sealWm = new WeaponManager("bullet");
  const sealAm = new AccessoryManager();
  for (let i = 0; i < 30; i++) {
    for (const opt of pickUpgrades(sealWm, sealAm, "survivor", 4, { weapons: ["axe", "melee"], accessories: ["swiftBoots"] })) {
      if (opt.weaponType === "axe" || opt.weaponType === "melee" || opt.accessoryType === "swiftBoots") fail(`sealed card ${opt.label}`);
    }
    for (const opt of pickUpgrades(sealWm, sealAm, "survivor", 3, { weapons: ["bullet"], accessories: [] })) {
      if (opt.weaponType === "bullet") fail(`sealed start weapon ${opt.label}`);
    }
  }

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
    let maxChests = 0;
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
          let xp = 0;
          let chests = 0;
          for (const g of engine.gems) {
            if (g.isTreasure) chests++;
            else if (!g.pickup) xp++;
          }
          maxGems = Math.max(maxGems, xp);
          maxChests = Math.max(maxChests, chests);
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
    // Regular spawns stop at the time-scaled cap. Elites, lanterns, and one bat swarm may exceed it.
    const t = MINUTES * 60;
    const turret = CONFIG.turret;
    const lastLantern = Math.min(t, CONFIG.finalBoss.spawnAt - turret.spawnInterval);
    const lanterns = t < turret.spawnAt ? 0 : Math.floor((lastLantern - turret.spawnAt) / turret.spawnInterval) + 1;
    const spawnCap = enemyCap(t) + Math.ceil(MINUTES) + 1 + lanterns + CONFIG.swarm.count;
    if (maxEnemies > spawnCap) fail(`${ch.id}: ${maxEnemies} enemies > cap ${spawnCap}`);
    // XP gems consolidate at 40; +1 covers a spawn before the next merge.
    // Chests are excluded from that merge, so they are capped on their own.
    if (maxGems > 41) fail(`${ch.id}: ${maxGems} xp gems > 41`);
    if (maxChests > 8) fail(`${ch.id}: ${maxChests} chests > 8`);
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
      maxChests,
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

  // ---------------------------------------------------------------- 2b. treasure chests must survive gem merging
  {
    const { consolidateGems, mergeFarGems } = await server.ssrLoadModule("/src/game/entities/GemManager.ts");
    const chest = (x, y) => ({ id: 1, x, y, radius: 12, value: 0, alive: true, isTreasure: true });
    const gem = (id, x) => ({ id, x, y: 0, radius: 7, value: 1, alive: true });
    const crowded = [];
    for (let i = 0; i < 45; i++) crowded.push(gem(10 + i, (i % 5) * 20));
    crowded.push(chest(10, 0));
    const consolidated = consolidateGems(crowded, 40, 80);
    const chestsAfterCrowd = consolidated.filter((g) => g.isTreasure);
    if (chestsAfterCrowd.length !== 1 || !Number.isFinite(chestsAfterCrowd[0].x)) {
      fail(`chest lost in consolidate: ${chestsAfterCrowd.length}`);
    }
    const farChest = chest(5000, 0);
    const pulled = mergeFarGems([farChest, gem(2, 10)], 0, 0, 1152);
    const chestsAfterPull = pulled.filter((g) => g.isTreasure);
    if (chestsAfterPull.length !== 1 || !chestsAfterPull[0].alive || Math.hypot(chestsAfterPull[0].x, chestsAfterPull[0].y) > 1152 + 1) {
      fail("far chest was merged into an XP gem");
    }
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

  // ---------------------------------------------------------------- 4. special pickups
  {
    const { rollSpecialDrop, consolidateGems, updateGems } = await server.ssrLoadModule("/src/game/entities/GemManager.ts");
    const prevChance = CONFIG.special.dropChance;
    CONFIG.special.dropChance = 1;
    const kinds = new Set();
    for (let i = 0; i < 90; i++) kinds.add(rollSpecialDrop({ x: 0, y: 0 }).pickup);
    CONFIG.special.dropChance = 0;
    if (rollSpecialDrop({ x: 0, y: 0 })) fail("special drop fired at chance 0");
    CONFIG.special.dropChance = prevChance;
    if (kinds.size !== 3) fail(`special kinds ${[...kinds].join(",")}`);

    const enemy = (x, y) => ({
      id: x, x, y, radius: 12, hp: 30, maxHp: 30, alive: true,
      speed: 0, baseSpeed: 0, damage: 0, contactTimer: 9,
      enemyType: "bat", color: "#fff", borderColor: "#fff", shape: "circle",
      spriteFrame: 0, spriteTimer: 0, facingRight: true, dying: false, dyingTimer: 0,
      isElite: false, gemDropped: false, facing: 0,
    });
    const engine = new GameEngine(ctxStub, { onStatsUpdate() {}, onLevelUp() {}, onGameOver() {} }, makeSave("survivor", 0));
    engine.player.hp = 1;
    for (const w of engine.weaponMgr.weapons) w.cooldownTimer = 999;
    const near = enemy(engine.player.x + 80, engine.player.y);
    const far = enemy(engine.player.x + 700, engine.player.y);
    const elite = enemy(engine.player.x + 40, engine.player.y);
    elite.id = 99;
    elite.isElite = true;
    elite.hp = 500;
    elite.maxHp = 500;
    engine.enemies.push(near, far, elite);
    const px = engine.player.x;
    const py = engine.player.y;
    engine.gems.push(
      { id: 1, x: px, y: py, radius: 11, value: 0, alive: true, pickup: "heart" },
      { id: 2, x: px, y: py, radius: 11, value: 0, alive: true, pickup: "magnet" },
      { id: 3, x: px, y: py, radius: 11, value: 0, alive: true, pickup: "bomb" },
      { id: 4, x: px + 900, y: py, radius: 7, value: 1, alive: true },
    );
    const killsBefore = engine.kills;
    engine.update(DT);
    const orb = engine.gems.find((g) => g.id === 4);
    if (engine.player.hp !== engine.player.maxHp) fail(`heart left hp at ${engine.player.hp}`);
    if (!orb || !orb.attracted) fail("magnet did not mark the far XP gem");
    if (near.alive || !near.gemDropped) fail("bomb left the on-screen enemy alive");
    if (!far.alive) fail("bomb killed an enemy outside the screen");
    if (!elite.alive || elite.hp !== 500 || elite.gemDropped) fail("bomb killed an elite");
    if (engine.kills !== killsBefore + 1) fail(`bomb kill count ${engine.kills - killsBefore}`);
    const x0 = orb.x;
    engine.update(DT);
    if (!(orb.x < x0 - 1)) fail("attracted gem did not move toward the player");
    const kept = consolidateGems([
      { id: 9, x: 0, y: 0, radius: 11, value: 0, alive: true, pickup: "bomb" },
      { id: 10, x: 5, y: 0, radius: 7, value: 1, alive: true },
    ], 1, 500);
    if (!kept.some((g) => g.pickup === "bomb" && g.alive)) fail("special pickup was merged into an XP gem");
    const speed = CONFIG.player.speed * 3;
    const chased = { id: 11, x: -30, y: 0, radius: 7, value: 1, alive: true };
    let chaseX = 0;
    for (let i = 0; i < 180; i++) {
      chaseX += speed * DT;
      updateGems([chased], { x: chaseX, y: 0, radius: 14, pickupRadius: 50, speed }, DT);
    }
    if (chased.alive) fail("fast player outran an XP gem");
    engine.stop();
  }

  // ---------------------------------------------------------------- 5. elites on the survival clock, including a fresh run
  {
    const { getEliteSpawned } = await server.ssrLoadModule("/src/game/entities/EnemyManager.ts");
    const callbacks = { onStatsUpdate() {}, onLevelUp() {}, onGameOver() {} };
    const runUntil = (engine, seconds) => {
      let guard = 0;
      while (engine.elapsed < seconds && guard++ < 20000) {
        engine.player.hp = engine.player.maxHp;
        engine.player.alive = true;
        engine.update(DT);
      }
    };
    const first = new GameEngine(ctxStub, callbacks, makeSave("survivor", 0));
    runUntil(first, 70);
    if (getEliteSpawned() !== 1) fail(`first run elites ${getEliteSpawned()} at ${first.elapsed}`);
    first.stop();

    const second = new GameEngine(ctxStub, callbacks, makeSave("survivor", 0));
    if (getEliteSpawned() !== 0) fail(`new run kept elite count ${getEliteSpawned()}`);
    runUntil(second, 59.5);
    if (getEliteSpawned() !== 0) fail(`elite early at ${second.elapsed} count ${getEliteSpawned()}`);
    runUntil(second, 60.2);
    if (getEliteSpawned() !== 1) fail(`elite at 1:00 count ${getEliteSpawned()} t=${second.elapsed}`);
    second.stop();
  }

  // ---------------------------------------------------------------- 5b. elite kill timer
  {
    let overs = 0;
    const engine = new GameEngine(ctxStub, { onStatsUpdate() {}, onLevelUp() {}, onGameOver() { overs++; } }, makeSave("survivor", 0));
    for (const w of engine.weaponMgr.weapons) w.cooldownTimer = 999;
    engine.player.hp = engine.player.maxHp;
    engine.enemies.push({
      id: 7, x: engine.player.x + 200, y: engine.player.y, radius: 12, hp: 99999, maxHp: 99999, alive: true,
      speed: 0, baseSpeed: 0, damage: 0, contactTimer: 9,
      enemyType: "slime", color: "#fff", borderColor: "#fff", shape: "circle",
      spriteFrame: 0, spriteTimer: 0, facingRight: true, dying: false, dyingTimer: 0,
      isElite: true, gemDropped: false, facing: 0, eliteLife: 0.05,
    });
    engine.update(0.2);
    if (overs !== 1 || engine.player.alive) fail(`elite timer overs=${overs} alive=${engine.player.alive}`);
    engine.stop();
  }

  // ---------------------------------------------------------------- 6. bomb burn does not stack
  {
    const { updateBomb, resetBombIds, bombDamage } = await server.ssrLoadModule("/src/game/weapons/BombWeapon.ts");
    resetBombIds();
    const w = { type: "bomb", level: 8, cooldownTimer: 100, burstShotsLeft: 0, burstTimer: 0, evolved: true, super: false };
    const spawned = [];
    updateBomb(spawned, [], 0, 0, w, 0.02, () => {});
    const expected = bombDamage(w) * 0.15;
    if (!spawned.length || Math.abs(spawned[0].burnDamage - expected) > 1e-6) {
      fail(`burn damage ${spawned[0] && spawned[0].burnDamage} expected ${expected}`);
    }
    resetBombIds();
    const enemy = {
      id: 1, x: 0, y: 0, radius: 10, hp: 100000, maxHp: 100000, alive: true,
      speed: 0, baseSpeed: 0, damage: 0, contactTimer: 9,
      enemyType: "slime", color: "#fff", borderColor: "#fff", shape: "circle",
      spriteFrame: 0, spriteTimer: 0, facingRight: true, dying: false, dyingTimer: 0,
      isElite: false, gemDropped: false, facing: 0,
    };
    const field = (id) => ({
      id, x: 0, y: 0, targetX: 0, targetY: 0,
      fallTimer: 1, fallTime: 0.8, explosionRadius: 50, damage: 100,
      phase: "burning", explosionTimer: 0.3, hitIds: new Set(),
      burnRadius: 40, burnDamage: 10, burnDuration: 4,
      burnTimer: 0, burnTickTimer: 0.49, burnHitTimers: new Map(),
    });
    const bombs = [field(1), field(2)];
    const hold = { type: "bomb", level: 8, cooldownTimer: 0, burstShotsLeft: 0, burstTimer: 0, evolved: false, super: false };
    updateBomb(bombs, [enemy], 0, 0, hold, 1 / 60, () => {});
    if (enemy.hp !== 99990) fail(`overlapping burn first tick hp ${enemy.hp}`);
    updateBomb(bombs, [enemy], 0, 0, hold, 0.5, () => {});
    if (enemy.hp !== 99980) fail(`overlapping burn second tick hp ${enemy.hp}`);
  }

  // ---------------------------------------------------------------- 7. fist combo then finisher
  {
    const { createFistState, updateFist, fistDamage } = await server.ssrLoadModule("/src/game/weapons/FistWeapon.ts");
    const dummy = {
      id: 3, x: 36, y: 0, radius: 12, hp: 100000, maxHp: 100000, alive: true,
      speed: 0, baseSpeed: 0, damage: 0, contactTimer: 9,
      enemyType: "slime", color: "#fff", borderColor: "#fff", shape: "circle",
      spriteFrame: 0, spriteTimer: 0, facingRight: true, dying: false, dyingTimer: 0,
      isElite: false, gemDropped: false, facing: 0,
    };
    const w1 = { type: "fist", level: 1, cooldownTimer: 0, burstShotsLeft: 0, burstTimer: 0, evolved: false, super: false };
    const jab = createFistState(w1);
    updateFist(jab, [dummy], 0, 0, w1, 0.05, () => {});
    if (Math.abs(100000 - dummy.hp - fistDamage(w1)) > 1e-6) fail(`fist jab dealt ${100000 - dummy.hp}`);
    const evo = { ...w1, level: 8, evolved: true };
    const foe = { ...dummy, id: 4, hp: 100000 };
    const st = createFistState(evo);
    let guard = 0;
    while (!(st.finisherShown && st.phase === "cooldown") && guard++ < 200) {
      updateFist(st, [foe], 0, 0, evo, 0.02, () => {});
    }
    const one = fistDamage(evo);
    const expected = one * 6 + one * 2.5;
    if (Math.abs(100000 - foe.hp - expected) > 1e-4) fail(`fist combo ${100000 - foe.hp} expected ${expected}`);
    const near = { ...dummy, id: 6, x: 40, y: 30, hp: 100000 };
    const far = { ...dummy, id: 7, x: 2400, y: -800, hp: 100000 };
    const sup = { ...evo, super: true };
    const twin = createFistState(sup);
    updateFist(twin, [near, far], 0, 0, sup, 0.05, () => {});
    const jabDmg = fistDamage(sup);
    if (Math.abs(100000 - near.hp - jabDmg) > 1e-4) fail(`super near jab ${100000 - near.hp}`);
    if (far.hp !== 100000) fail(`super far jab reached ${100000 - far.hp}`);
    const inRange = { ...dummy, id: 12, x: 250, y: 0, hp: 100000 };
    updateFist(createFistState(sup), [inRange], 0, 0, sup, 0.05, () => {});
    if (Math.abs(100000 - inRange.hp - jabDmg) > 1e-4) fail(`super 300 jab ${100000 - inRange.hp}`);
    const left = { ...dummy, id: 9, x: -200, y: 100, hp: 100000 };
    const right = { ...dummy, id: 10, x: 180, y: -150, hp: 100000 };
    const back = { ...dummy, id: 11, x: 100, y: 220, hp: 100000 };
    const outside = { ...dummy, id: 13, x: 400, y: 0, hp: 100000 };
    const extras = [left, right, back];
    const skips = [0, 0, 0];
    for (let n = 0; n < 60; n++) {
      near.hp = 100000;
      outside.hp = 100000;
      for (const e of extras) e.hp = 100000;
      updateFist(createFistState(sup), [near, left, right, back, outside], 0, 0, sup, 0.05, () => {});
      if (Math.abs(100000 - near.hp - jabDmg) > 1e-4) fail(`super random trial near ${100000 - near.hp}`);
      if (outside.hp !== 100000) fail(`super random trial reached past 300 ${100000 - outside.hp}`);
      let hits = 0;
      extras.forEach((e, i) => {
        if (e.hp < 100000) hits++;
        else skips[i]++;
      });
      if (hits !== 2) fail(`super random trial hit ${hits} extra enemies`);
    }
    if (skips.some((n) => n === 0)) fail(`super random skips ${skips.join(",")}`);
    const plain = { ...dummy, id: 8, x: 2400, y: 0, hp: 100000 };
    const normal = createFistState(evo);
    updateFist(normal, [plain], 0, 0, evo, 0.05, () => {});
    if (plain.hp !== 100000) fail(`evolved fist reached ${100000 - plain.hp} past its range`);
  }

  // ---------------------------------------------------------------- 9. axe sweep
  {
    const { createAxeState, updateAxe, axeDamage } = await server.ssrLoadModule("/src/game/weapons/AxeWeapon.ts");
    const body = {
      id: 20, x: 70, y: 0, radius: 12, hp: 100000, maxHp: 100000, alive: true,
      speed: 0, baseSpeed: 0, damage: 0, contactTimer: 9,
      enemyType: "slime", color: "#fff", borderColor: "#fff", shape: "circle",
      spriteFrame: 0, spriteTimer: 0, facingRight: true, dying: false, dyingTimer: 0,
      isElite: false, gemDropped: false, facing: 0,
    };
    const w = { type: "axe", level: 1, cooldownTimer: 0, burstShotsLeft: 0, burstTimer: 0, evolved: false, super: false };
    const front = { ...body, id: 20, x: 90, y: 0 };
    const back = { ...body, id: 21, x: -120, y: 0 };
    const far = { ...body, id: 22, x: 400, y: 0 };
    const close = { ...body, id: 26, x: 20, y: 0 };
    const swing = (weapon, foes, frames = 30) => {
      const state = createAxeState(weapon);
      for (let i = 0; i < frames; i++) updateAxe(state, foes, 0, 0, weapon, 0.05, () => {});
    };
    swing(w, [front, back, far, close]);
    const one = axeDamage(w);
    if (Math.abs(100000 - front.hp - one) > 1e-4) fail(`axe front ${100000 - front.hp} expected ${one}`);
    if (back.hp !== 100000) fail(`axe backswing at lv1 dealt ${100000 - back.hp}`);
    if (far.hp !== 100000) fail(`axe reached past its range`);
    if (close.hp !== 100000) fail(`axe hit inside the picture ${100000 - close.hp}`);
    const wide = { ...w, level: 5 };
    const around = { ...body, id: 23, x: -90, y: 0, hp: 100000 };
    const ahead = { ...body, id: 24, x: 70, y: 0, hp: 100000 };
    swing(wide, [ahead, around]);
    const wideDmg = axeDamage(wide);
    if (Math.abs(100000 - ahead.hp - wideDmg) > 1e-4) fail(`axe circle front ${100000 - ahead.hp}`);
    if (Math.abs(100000 - around.hp - wideDmg) > 1e-4) fail(`axe circle back ${100000 - around.hp}`);
    const evo = { ...w, level: 8, evolved: true };
    const victim = { ...body, id: 25, x: 200, y: 0, hp: 100000 };
    swing(evo, [victim]);
    const twice = axeDamage(evo) * 2;
    if (Math.abs(100000 - victim.hp - twice) > 1e-4) fail(`axe evo ${100000 - victim.hp} expected ${twice}`);
    const plainFar = { ...body, id: 30, x: 320, y: 0, hp: 100000 };
    swing(evo, [plainFar]);
    if (plainFar.hp !== 100000) fail(`axe evo reached past its ring ${100000 - plainFar.hp}`);
    const sup = { ...evo, super: true };
    const farOnly = { ...body, id: 27, x: 320, y: 0, hp: 100000 };
    swing(sup, [farOnly], 16);
    const supDmg = axeDamage(sup);
    if (Math.abs(100000 - farOnly.hp - supDmg) > 1e-4) fail(`axe super far ${100000 - farOnly.hp} expected ${supDmg}`);
    const mid = { ...body, id: 29, x: 200, y: 0, hp: 100000 };
    const side = { ...body, id: 31, x: 0, y: 200, hp: 100000 };
    swing(sup, [mid, side], 16);
    if (Math.abs(100000 - mid.hp - supDmg) > 1e-4) fail(`axe super front ${100000 - mid.hp} expected ${supDmg}`);
    if (Math.abs(100000 - side.hp - supDmg) > 1e-4) fail(`axe super side ${100000 - side.hp} expected ${supDmg}`);
    const beforeTip = { ...body, id: 32, x: 10, y: 0, hp: 100000 };
    swing(sup, [beforeTip], 16);
    if (beforeTip.hp !== 100000) fail(`axe super wave started at the player ${100000 - beforeTip.hp}`);
    const pastHead = { ...body, id: 33, x: 230, y: 0, hp: 100000 };
    swing(sup, [pastHead], 16);
    if (pastHead.hp !== 100000) fail(`axe super hit past the picture ${100000 - pastHead.hp}`);
  }

  // ---------------------------------------------------------------- 8. new accessories
  {
    const { AccessoryManager } = await server.ssrLoadModule("/src/game/systems/AccessoryManager.ts");
    const am = new AccessoryManager();
    for (const id of ["keenRing", "goldPurse", "vampireFang"]) {
      am.addAccessory(id);
      for (let i = 0; i < 4; i++) am.levelUpAccessory(id);
    }
    const m = am.computeMods();
    if (Math.abs(m.critChance - 0.22) > 1e-9 || Math.abs(m.goldMult - 1.44) > 1e-9 || Math.abs(m.killHeal - 1.4) > 1e-9) {
      fail(`accessory mods crit=${m.critChance} gold=${m.goldMult} heal=${m.killHeal}`);
    }
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
