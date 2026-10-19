// ============================================================
//  types.ts — Shared types used across game modules
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity extends Vec2 {
  id: number;
  radius: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface PlayerState extends Entity {
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
  invulnTimer: number;
  pickupRadius: number;
  color: string;
  /** Character emblem icon name (src/assets/icons) drawn on the player circle */
  emblem?: string;
}

export interface EnemyState extends Entity {
  speed: number;
  baseSpeed: number;
  damage: number;
  contactTimer: number;
  enemyType: string;
  color: string;
  borderColor: string;
  shape: "circle" | "triangle" | "square" | "diamond" | "hexagon" | "star" | "sprite";
  // Sprite animation state (only for shape === "sprite")
  spriteFrame: number;
  spriteTimer: number;
  facingRight: boolean;
  dying: boolean;
  dyingTimer: number;
  isElite: boolean;
  gemDropped: boolean;
}

// ---- Weapon types ----

export type WeaponType = "bullet" | "melee" | "bomb" | "trap" | "aura" | "shuriken" | "claw";

export interface WeaponInstance {
  type: WeaponType;
  level: number;
  // runtime cooldown timer
  cooldownTimer: number;
  // Burst-fire state (used by bullet weapon)
  burstShotsLeft: number;
  burstTimer: number;
  // Whether this weapon has evolved (post-Lv8 upgrade)
  evolved: boolean;
}

// ---- Weapon modifiers (character/trait/accessory multipliers applied to every weapon) ----
export interface WeaponMods {
  damageMult: number;
  cooldownMult: number;
  critChance?: number;
  critMult?: number;
}

// ---- Projectile (for bullet weapon) ----
export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  hitIds: Set<number>;
  alive: boolean;
  color: string;
}

// ---- Melee blade (orbits player) ----
export interface MeleeBlade {
  angle: number;
  angularSpeed: number;
  hitTimers: Map<number, number>;
}

// ---- Bomb (falls then explodes) ----
export interface BombEntity {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fallTimer: number;
  fallTime: number;
  explosionRadius: number;
  damage: number;
  phase: "falling" | "exploding" | "burning" | "done";
  explosionTimer: number;
  hitIds: Set<number>;
  // Burning field left after explosion (Lv5+)
  burnRadius: number;
  burnDamage: number;
  burnDuration: number;
  burnTimer: number;
  burnTickTimer: number;
  burnHitTimers: Map<number, number>;
}

// ---- Trap (placed on field) ----
export interface TrapEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  lifetime: number;
  hitTimers: Map<number, number>;
  alive: boolean;
  // Slow effect (Lv5+)
  slowRadius: number;
  slowFactor: number;
}

// ---- Aura tick (continuous damage around player) ----
export interface AuraState {
  radius: number;
  damage: number;
  tickInterval: number;
  tickTimer: number;
  // Burn DoT on enemies (Lv5+)
  burnDamage: number;
  burnTickInterval: number;
  enemyBurns: Map<number, { timer: number; tickTimer: number; damage: number }>;
  // Cache for lazy refresh
  cachedLevel: number;
  cachedEvolved: boolean;
}

// ---- Shuriken (piercing throwing blade) ----
export interface ShurikenProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  hitIds: Set<number>;
  alive: boolean;
  color: string;
  rotation: number;
  returning: boolean;
  originX: number;
  originY: number;
  traveled: number;
}

// ---- Claw slash (periodic AoE around player) ----
export interface ClawState {
  radius: number;
  damage: number;
  cooldown: number;
  cooldownTimer: number;
  slashTimer: number; // 0..slashDuration, counts up then triggers slash
  slashDuration: number;
  slashActive: boolean; // true while slash animation is playing
  slashArc: number; // current arc spin offset for animation
  slashBaseAngle: number; // base direction the slash faces (toward nearest enemy)
  slashHits: Set<number>; // enemy IDs hit during current slash
  slashCount: number; // number of slashes per attack (1 base, 2+ at higher levels)
  slashesRemaining: number; // slashes left in current burst
  interSlashTimer: number; // timer between multiple slashes
  // Cache for lazy refresh
  cachedLevel: number;
  cachedEvolved: boolean;
}

// ---- Breath (evolved claw: frontal flame cone) ----
export interface BreathState {
  range: number;
  coneAngle: number; // half-angle of the cone (radians)
  damage: number;
  cooldown: number;
  cooldownTimer: number;
  breathTimer: number; // 0..breathDuration, counts up while breathing
  breathDuration: number;
  breathActive: boolean;
  facing: number; // current cone direction
  tickInterval: number; // damage tick cadence while breathing
  tickTimer: number;
  hitTimers: Map<number, number>; // per-enemy tick cooldown during a breath
  // Burn DoT left on enemies after breath ends
  enemyBurns: Map<number, { timer: number; tickTimer: number; damage: number }>;
  cachedLevel: number;
}

// ---- Gems ----
export interface Gem {
  id: number;
  x: number;
  y: number;
  radius: number;
  value: number;
  alive: boolean;
  isTreasure?: boolean;
}

// ---- Upgrades ----
export type UpgradeKind =
  | "newWeapon"
  | "weaponLevel"
  | "newAccessory"
  | "accessoryLevel"
  | "weaponEvolve";

export interface UpgradeOption {
  kind: UpgradeKind;
  label: string;
  weaponType?: WeaponType;
  weaponName?: string;
  accessoryType?: AccessoryType;
  accessoryName?: string;
  effectDesc?: string;
}

// ---- Accessories (passive trinkets that boost stats) ----
export type AccessoryType =
  | "swiftBoots"    // move speed
  | "vitalRing"     // max HP
  | "magnetCharm"   // pickup range
  | "powerAmulet"   // weapon damage
  | "hastePendant"  // weapon cooldown
  | "xpcrystal"     // XP gain multiplier
  | "thornArmor"    // contact damage reflection
  | "shieldForge"   // damage reduction
  | "natureBlessing"; // HP regen focus

export interface AccessoryInstance {
  type: AccessoryType;
  level: number;
}

// ---- Game stats ----
export interface GameStats {
  time: number;
  kills: number;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  score: number;
  weapons: { type: WeaponType; name: string; level: number; evolved: boolean }[];
  accessories: { type: AccessoryType; name: string; level: number }[];
  rerolls: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface GameCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onLevelUp: (options: UpgradeOption[]) => void;
  onGameOver: (stats: GameStats) => void;
}
