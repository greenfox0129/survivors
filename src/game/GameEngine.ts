// ============================================================
//  GameEngine.ts — Main game loop, module integration, pausing
// ============================================================

import { CONFIG } from "./config";
import type {
  Camera,
  EnemyState,
  GameCallbacks,
  GameStats,
  Gem,
  PlayerState,
  UpgradeKind,
  UpgradeOption,
  WeaponType,
  AccessoryType,
} from "./types";
import {
  createPlayer,
  updatePlayer,
  gainXp,
  damagePlayer,
  renderPlayer,
} from "./Player";
import {
  updateEnemies,
  checkContactDamage,
  renderEnemies,
  cullDead,
  cullFarEnemies,
  resetEnemyManager,
  setElapsedTime,
} from "./EnemyManager";
import {
  WeaponManager,
  allWeaponTypes,
  weaponName,
  weaponMaxLevel,
  weaponEvolvedName,
} from "./WeaponManager";
import { EVOLUTIONS } from "./weapons/evolutions";
import { bulletLevelEffect } from "./weapons/BulletWeapon";
import { meleeLevelEffect } from "./weapons/MeleeWeapon";
import { bombLevelEffect } from "./weapons/BombWeapon";
import { trapLevelEffect } from "./weapons/TrapWeapon";
import { auraLevelEffect } from "./weapons/AuraWeapon";
import { shurikenLevelEffect } from "./weapons/ShurikenWeapon";
import { clawLevelEffect } from "./weapons/ClawWeapon";
import type { WeaponInstance } from "./types";
import {
  dropGem,
  dropTreasure,
  updateGems,
  renderGems,
  cullGems,
  mergeFarGems,
  consolidateGems,
  resetGemManager,
  type GemUpdateResult,
} from "./GemManager";
import { computeModifiers, type GameModifiers } from "./traitHelper";
import { playHurtSound, playLevelUpSound, playXpPickupSound, playGameOverSound } from "./audio";
import { CHARACTERS, type PassiveType } from "./data";
import type { SaveData } from "./storage";
import {
  AccessoryManager,
  accessoryName,
  accessoryMaxLevel,
  type AccessoryMods,
} from "./AccessoryManager";

function getStartWeapon(save: SaveData | null): WeaponType {
  const charId = save?.selectedCharacter ?? "survivor";
  const def = CHARACTERS.find((c) => c.id === charId);
  return (def?.startWeapon ?? "bullet") as WeaponType;
}

function getWeaponLevelEffect(w: WeaponInstance): string | null {
  // Show the effect that WILL be gained at the NEXT level
  const nextLevel = w.level + 1;
  const mockW: WeaponInstance = { ...w, level: nextLevel };
  switch (w.type) {
    case "bullet": return bulletLevelEffect(mockW);
    case "melee": return meleeLevelEffect(mockW);
    case "bomb": return bombLevelEffect(mockW);
    case "trap": return trapLevelEffect(mockW);
    case "aura": return auraLevelEffect(mockW);
    case "shuriken": return shurikenLevelEffect(mockW);
    case "claw": return clawLevelEffect(mockW);
    default: return null;
  }
}

function pickUpgrades(
  wm: WeaponManager,
  am: AccessoryManager,
): UpgradeOption[] {
  const pool: UpgradeOption[] = [];

  // Weapon level-up options (owned, not maxed)
  for (const w of wm.getUpgradeableWeapons()) {
    const effect = getWeaponLevelEffect(w);
    const displayName = w.evolved ? weaponEvolvedName(w.type) : weaponName(w.type);
    pool.push({
      kind: "weaponLevel",
      label: `${displayName} 강화 (Lv ${w.level + 1})`,
      weaponType: w.type,
      weaponName: displayName,
      effectDesc: effect ?? undefined,
    });
  }

  // New weapon options (if slots available)
  if (wm.canAddWeapon()) {
    for (const type of wm.getUnownedWeapons()) {
      pool.push({
        kind: "newWeapon",
        label: `${weaponName(type)} 획득`,
        weaponType: type,
        weaponName: weaponName(type),
      });
    }
  }

  // Weapon evolution options (Lv8 + paired accessory owned)
  const evolvable = wm.getEvolvableWeapons((accType) => am.hasAccessory(accType));
  for (const w of evolvable) {
    const evo = EVOLUTIONS[w.type];
    pool.push({
      kind: "weaponEvolve",
      label: `${weaponName(w.type)} 진화 → ${evo.evolvedName}`,
      weaponType: w.type,
      weaponName: evo.evolvedName,
      effectDesc: evo.desc,
    });
  }

  // Accessory level-up options (owned, not maxed)
  for (const a of am.getUpgradeableAccessories()) {
    pool.push({
      kind: "accessoryLevel",
      label: `${accessoryName(a.type)} 강화 (Lv ${a.level + 1})`,
      accessoryType: a.type,
      accessoryName: accessoryName(a.type),
      effectDesc: am.getEffectPreview(a.type, a.level),
    });
  }

  // New accessory options (if slots available)
  if (am.canAddAccessory()) {
    for (const type of am.getUnownedAccessories()) {
      pool.push({
        kind: "newAccessory",
        label: `${accessoryName(type)} 획득`,
        accessoryType: type,
        accessoryName: accessoryName(type),
        effectDesc: am.getEffectPreview(type, 0),
      });
    }
  }

  // Evolution options always appear first
  const evolutionOpts = pool.filter((o) => o.kind === "weaponEvolve");
  const pickCount = Math.max(0, 3 - evolutionOpts.length);

  // Group remaining options into 3 equally weighted categories:
  //   weaponLevel (무기 강화) — weight 1
  //   newWeapon   (신무기 획득) — weight 1
  //   accessory   (장신구: 강화 + 신규) — weight 1
  const catWeights: Record<string, number> = {
    weaponLevel: 1,
    newWeapon: 1,
    accessory: 1,
  };
  const categories: Record<string, UpgradeOption[]> = {
    weaponLevel: [],
    newWeapon: [],
    accessory: [],
  };
  for (const o of pool) {
    if (o.kind === "weaponEvolve") continue;
    if (o.kind === "weaponLevel") categories.weaponLevel.push(o);
    else if (o.kind === "newWeapon") categories.newWeapon.push(o);
    else categories.accessory.push(o); // accessoryLevel + newAccessory
  }

  const picked: UpgradeOption[] = [];
  const usedKeys = new Set<string>();
  for (let slot = 0; slot < pickCount; slot++) {
    // Build available categories (non-empty, not exhausted)
    const avail = Object.keys(categories).filter(
      (k) => catWeights[k] > 0 && categories[k].some((o) => !usedKeys.has(o.kind + (o.weaponType ?? o.accessoryType ?? "")))
    );
    if (avail.length === 0) break;

    // Weighted category pick
    const totalW = avail.reduce((s, k) => s + catWeights[k], 0);
    let roll = Math.random() * totalW;
    let chosen = avail[0];
    for (const k of avail) {
      roll -= catWeights[k];
      if (roll <= 0) { chosen = k; break; }
    }

    // Pick a random unused option within the chosen category
    const opts = categories[chosen].filter(
      (o) => !usedKeys.has(o.kind + (o.weaponType ?? o.accessoryType ?? ""))
    );
    if (opts.length === 0) continue;
    const opt = opts[Math.floor(Math.random() * opts.length)];
    usedKeys.add(opt.kind + (opt.weaponType ?? opt.accessoryType ?? ""));
    picked.push(opt);
  }

  return [...evolutionOpts, ...picked];
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private player: PlayerState;
  private enemies: EnemyState[] = [];
  private gems: Gem[] = [];
  private weaponMgr: WeaponManager;
  private accessoryMgr: AccessoryManager;
  private baseMaxHp: number = 0;

  private input = { up: false, down: false, left: false, right: false };
  private camera: Camera = { x: 0, y: 0 };
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private kills = 0;
  private score = 0;
  private paused = false;
  private running = false;
  private callbacks: GameCallbacks;
  private modifiers: GameModifiers;
  private passive: PassiveType;
  private xpMult: number;
  private save: SaveData | null;
  private rerollsLeft: number = 0;
  private breakthrough: number = 0;
  private statEmitTimer: number = 0;

  constructor(ctx: CanvasRenderingContext2D, callbacks: GameCallbacks, save?: SaveData) {
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.save = save ?? null;
    this.modifiers = save ? computeModifiers(save) : computeModifiers({
      gold: 0,
      owned: [{ id: "survivor", level: 1, stars: 0, memories: 0, breakthrough: 0 }],
      traitLevels: {},
      selectedCharacter: "survivor",
    } as SaveData);
    this.xpMult = this.modifiers.xpMult;
    this.player = createPlayer({
      hpMult: this.modifiers.hpMult,
      speedMult: this.modifiers.speedMult,
      pickupRangeMult: this.modifiers.pickupRangeMult,
      playerColor: this.modifiers.playerColor,
    });
    this.camera = { x: this.player.x, y: this.player.y };
    this.weaponMgr = new WeaponManager(getStartWeapon(this.save));
    this.accessoryMgr = new AccessoryManager();
    this.baseMaxHp = this.player.maxHp;
    this.rerollsLeft = this.modifiers.rerolls;
    this.passive = this.modifiers.passive;
    this.breakthrough = save?.owned.find((o) => o.id === save.selectedCharacter)?.breakthrough ?? 0;
    if (this.passive === "extraReroll") this.rerollsLeft += 1 + (this.breakthrough >= 3 ? 2 : 0);
    // 4\u3d3c\u30c2: start with paired accessory
    if (this.modifiers.startAccessory) {
      this.accessoryMgr.addAccessory(this.modifiers.startAccessory);
    }
    this.applyAccessoryMods();
  }

  /** Recompute accessory modifiers and apply them to player + weapon mods. */
  private applyAccessoryMods(): void {
    const accMods = this.accessoryMgr.computeMods();

    // HP: restore base, add accessory bonus, keep ratio
    const oldMaxHp = this.player.maxHp;
    const ratio = oldMaxHp > 0 ? this.player.hp / oldMaxHp : 1;
    this.player.maxHp = this.baseMaxHp + accMods.maxHpAdd;
    this.player.hp = Math.min(this.player.maxHp, Math.round(this.player.maxHp * ratio));

    // Move speed: apply as multiplier on current speed (relative to base)
    // We re-derive base speed from CONFIG to avoid compounding
    const baseSpeed = CONFIG.player.speed * this.modifiers.speedMult;
    this.player.speed = baseSpeed * accMods.moveSpeedMult;

    // Pickup range: same approach
    const swiftLooterBonus = this.passive === "swiftLooter" ? (this.breakthrough >= 3 ? 1.4 : 1.2) : 1;
    const basePickup = CONFIG.player.pickupRadius * this.modifiers.pickupRangeMult * swiftLooterBonus;
    this.player.pickupRadius = basePickup * accMods.pickupMult;

    // XP multiplier: character base × accessory bonus
    this.xpMult = this.modifiers.xpMult * accMods.xpMult;

    this.updateWeaponMods();
  }

  /** Recompute weapon damage/cooldown/crit mods only (called each frame for dynamic passives). */
  private updateWeaponMods(accMods?: AccessoryMods): void {
    const mods = accMods ?? this.accessoryMgr.computeMods();
    let dmgMult = this.modifiers.damageMult * mods.damageMult;
    let critChance = 0;

    if (this.passive === "spellPower") dmgMult *= this.breakthrough >= 3 ? 1.25 : 1.15;

    if (this.passive === "swiftLooter") {
      const speedRatio = this.modifiers.speedMult - 1.0;
      dmgMult *= 1 + Math.max(0, speedRatio) * 0.3;
    }

    if (this.passive === "lowHpFury" && this.player.maxHp > 0) {
      const hpRatio = this.player.hp / this.player.maxHp;
      if (hpRatio < 0.5) {
        const fury = (0.5 - Math.max(hpRatio, 0.25)) / 0.25;
        dmgMult *= 1 + fury * (this.breakthrough >= 3 ? 0.8 : 0.5);
      }
    }

    if (this.passive === "critStrike") {
      critChance = this.breakthrough >= 3 ? 0.25 : 0.15;
    }

    this.weaponMgr.setMods({
      damageMult: dmgMult,
      cooldownMult: this.modifiers.cooldownMult * mods.cooldownMult,
      critChance,
    });
  }

  // ---- Input ----
  setInput(key: string, pressed: boolean): void {
    switch (key) {
      case "w": case "arrowup":    this.input.up = pressed; break;
      case "s": case "arrowdown":  this.input.down = pressed; break;
      case "a": case "arrowleft":  this.input.left = pressed; break;
      case "d": case "arrowright": this.input.right = pressed; break;
    }
  }

  // ---- Lifecycle ----
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset(): void {
    if (this.save) {
      this.modifiers = computeModifiers(this.save);
      this.xpMult = this.modifiers.xpMult;
    }
    this.player = createPlayer({
      hpMult: this.modifiers.hpMult,
      speedMult: this.modifiers.speedMult,
      pickupRangeMult: this.modifiers.pickupRangeMult,
      playerColor: this.modifiers.playerColor,
    });
    this.camera = { x: this.player.x, y: this.player.y };
    this.enemies = [];
    this.gems = [];
    this.weaponMgr.reset(getStartWeapon(this.save));
    this.accessoryMgr.reset();
    this.baseMaxHp = this.player.maxHp;
    this.rerollsLeft = this.modifiers.rerolls;
    this.breakthrough = this.save?.owned.find((o) => o.id === (this.save?.selectedCharacter ?? ""))?.breakthrough ?? 0;
    if (this.passive === "extraReroll") this.rerollsLeft += 1 + (this.breakthrough >= 3 ? 2 : 0);
    // 4\u3d3c\u30c2: start with paired accessory
    if (this.modifiers.startAccessory) {
      this.accessoryMgr.addAccessory(this.modifiers.startAccessory);
    }
    this.applyAccessoryMods();
    this.elapsed = 0;
    this.kills = 0;
    this.score = 0;
    this.paused = false;
    resetEnemyManager();
    resetGemManager();
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    if (!this.paused && this.player.alive) {
      this.update(dt);
    }
    this.render();
  };

  // ---- Update ----
  private update(dt: number): void {
    this.elapsed += dt;
    this.score = Math.floor(this.kills * 10 + this.elapsed * 5);

    // Re-apply weapon mods each frame for dynamic passives (lowHpFury)
    const accMods = this.accessoryMgr.computeMods();
    this.updateWeaponMods(accMods);

    setElapsedTime(this.elapsed);
    updatePlayer(this.player, this.input, dt);
    // Camera follows player — player stays centered on screen
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    updateEnemies(this.enemies, this.player, dt);

    const contactDmg = checkContactDamage(this.enemies, this.player);
    if (contactDmg > 0) {
      // Shield Forge + guardianWall: reduce incoming damage
      const guardianReduction = this.passive === "guardianWall" ? (this.breakthrough >= 3 ? 0.25 : 0.15) : 0;
      const reducedDmg = contactDmg * (1 - accMods.damageReduction - guardianReduction);
      playHurtSound();
      damagePlayer(this.player, reducedDmg);

      // Thorn Armor + guardianWall: reflect damage to contacting enemies
      const guardianReflect = this.passive === "guardianWall" ? (this.breakthrough >= 3 ? 6 : 3) : 0;
      const reflectDmg = accMods.reflectDamage + guardianReflect;
      if (reflectDmg > 0) {
        for (const e of this.enemies) {
          if (!e.alive || e.dying) continue;
          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          const collideR = e.radius + this.player.radius + 5;
          if (dx * dx + dy * dy < collideR * collideR) {
            e.hp -= reflectDmg;
            if (e.hp <= 0 && !e.dying) {
              if (e.shape === "sprite") {
                e.dying = true;
                e.dyingTimer = 0;
                e.spriteFrame = 0;
                e.spriteTimer = 0;
              } else {
                e.alive = false;
              }
              this.kills++;
              if (e.isElite) {
                this.gems.push(dropTreasure(e));
              } else {
                this.gems.push(dropGem(e));
              }
              e.gemDropped = true;
            }
          }
        }
      }
    }

    // Vital Ring: HP regen
    if (accMods.regenPerSec > 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + accMods.regenPerSec * dt);
    }

    // Weapons — onKill just counts kills; gem drops handled in single pass below
    this.weaponMgr.update(this.enemies, this.player, dt, () => {
      this.kills++;
    });

    // Single pass for gem drops from newly dead enemies
    for (const e of this.enemies) {
      if ((!e.alive || e.dying) && !e.gemDropped) {
        if (e.isElite) {
          this.gems.push(dropTreasure(e));
        } else {
          this.gems.push(dropGem(e));
        }
        e.gemDropped = true;
      }
    }

    this.enemies = cullDead(this.enemies);
    this.enemies = cullFarEnemies(this.enemies, this.player.x, this.player.y);

    const gemResult = updateGems(this.gems, this.player, dt);
    const treasurePicked = gemResult.treasure;
    const xpGained = gemResult.xp * this.xpMult;
    this.gems = cullGems(this.gems);
    // Merge far gems into nearby ones instead of deleting them
    const gemMaxDist = CONFIG.canvasWidth * 1.2;
    this.gems = mergeFarGems(this.gems, this.player.x, this.player.y, gemMaxDist);
    // Auto-consolidate when too many gems on screen — merge nearby pairs
    this.gems = consolidateGems(this.gems, 40, 80);

    if (xpGained > 0) {
      playXpPickupSound(xpGained);
      const leveledUp = gainXp(this.player, xpGained);
      if (leveledUp) {
        this.pauseForLevelUp();
      }
    }

    if (treasurePicked) {
      this.pauseForLevelUp();
    }

    // Throttle stat emission to every ~8 frames to reduce per-frame garbage
    this.statEmitTimer += dt;
    if (this.statEmitTimer >= 0.15) {
      this.statEmitTimer = 0;
      this.emitStats();
    }

    if (!this.player.alive) {
      this.callbacks.onGameOver(this.getStats());
    }
  }

  // ---- Give up (triggers game over with current stats) ----
  giveUp(): void {
    if (!this.player.alive) return;
    this.player.alive = false;
    playGameOverSound();
    this.callbacks.onGameOver(this.getStats());
  }

  // ---- Level up ----
  private pauseForLevelUp(): void {
    this.paused = true;
    playLevelUpSound();
    if (this.passive === "extraReroll") this.rerollsLeft += 1 + (this.breakthrough >= 3 ? 2 : 0);
    this.callbacks.onLevelUp(pickUpgrades(this.weaponMgr, this.accessoryMgr));
  }

  /** Reroll the current level-up options. Returns new options or null if no rerolls left. */
  rerollUpgrades(): UpgradeOption[] | null {
    if (this.rerollsLeft <= 0) return null;
    this.rerollsLeft--;
    return pickUpgrades(this.weaponMgr, this.accessoryMgr);
  }

  getRerollsLeft(): number {
    return this.rerollsLeft;
  }

  applyUpgrade(opt: UpgradeOption): void {
    switch (opt.kind) {
      case "newWeapon":
        if (opt.weaponType) this.weaponMgr.addWeapon(opt.weaponType);
        break;
      case "weaponLevel":
        if (opt.weaponType) this.weaponMgr.levelUpWeapon(opt.weaponType);
        break;
      case "weaponEvolve":
        if (opt.weaponType) this.weaponMgr.evolveWeapon(opt.weaponType);
        break;
      case "newAccessory":
        if (opt.accessoryType) this.accessoryMgr.addAccessory(opt.accessoryType);
        this.applyAccessoryMods();
        break;
      case "accessoryLevel":
        if (opt.accessoryType) this.accessoryMgr.levelUpAccessory(opt.accessoryType);
        this.applyAccessoryMods();
        break;
    }
    this.paused = false;
  }

  // ---- Stats ----
  private getStats(): GameStats {
    return {
      time: this.elapsed,
      kills: this.kills,
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      alive: this.player.alive,
      score: this.score,
      weapons: this.weaponMgr.weapons.map((w) => ({
        type: w.type,
        name: w.evolved ? weaponEvolvedName(w.type) : weaponName(w.type),
        level: w.level,
        evolved: w.evolved,
      })),
      accessories: this.accessoryMgr.accessories.map((a) => ({
        type: a.type,
        name: accessoryName(a.type),
        level: a.level,
      })),
      rerolls: this.rerollsLeft,
    };
  }

  private emitStats(): void {
    this.callbacks.onStatsUpdate(this.getStats());
  }

  // ---- Render ----
  private render(): void {
    const ctx = this.ctx;
    // Reset any canvas state that may have been leaked from the previous frame
    // (globalAlpha, shadowBlur, filter, etc.) to prevent afterimages.
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";

    const camX = this.camera.x - CONFIG.canvasWidth / 2;
    const camY = this.camera.y - CONFIG.canvasHeight / 2;

    ctx.fillStyle = CONFIG.worldBgColor;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Subtle grid (scrolls with camera)
    ctx.save();
    ctx.translate(-camX, -camY);
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const grid = 40;
    const startX = Math.floor(camX / grid) * grid;
    const startY = Math.floor(camY / grid) * grid;
    for (let x = startX; x <= camX + CONFIG.canvasWidth + grid; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, camY - grid);
      ctx.lineTo(x, camY + CONFIG.canvasHeight + grid);
      ctx.stroke();
    }
    for (let y = startY; y <= camY + CONFIG.canvasHeight + grid; y += grid) {
      ctx.beginPath();
      ctx.moveTo(camX - grid, y);
      ctx.lineTo(camX + CONFIG.canvasWidth + grid, y);
      ctx.stroke();
    }

    renderGems(ctx, this.gems);
    renderEnemies(ctx, this.enemies);
    this.weaponMgr.render(ctx, this.player);
    renderPlayer(ctx, this.player);
    ctx.restore();
  }
}
