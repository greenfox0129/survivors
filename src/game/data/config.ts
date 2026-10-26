// ============================================================
//  config.ts — All balance constants in one place.
//  Tweak these numbers to adjust difficulty and feel.
// ============================================================

export const CONFIG = {
  // ---- Canvas / World ----
  canvasWidth: 960,
  canvasHeight: 720,
  worldBgColor: "#0a0a12",

  // ---- Rendering / performance (저사양 대응) ----
  render: {
    fpsCap: 60,           // 고주사율 모니터에서도 60fps로 제한 (0 = 제한 없음)
    autoLowFrameMs: 24,   // 평균 프레임 간격이 이 값(ms)을 넘으면 (≈42fps 미만)
    autoLowAfterSec: 2,   // …이 시간 이상 지속될 때 auto 품질을 low로 전환
  },

  // ---- Player ----
  player: {
    radius: 14,
    color: "#22d3ee",
    maxHp: 100,
    speed: 180, // px per second
    invulnTime: 0.6, // seconds of i-frames after hit
    startX: 480,
    startY: 360,
    pickupRadius: 50, // gem magnet radius
  },

  // ---- Leveling / XP ----
  // xpCurve[0] is the XP for level 1 → 2. After the table, each step is
  // xpGrowthLate times the last listed cost, with the fraction dropped.
  leveling: {
    xpCurve: [
      10, 20, 30, 50, 70, 100, 140, 180, 220, 260,
      290, 320, 350, 380, 410, 440, 470, 500, 530, 560,
      590, 650, 710, 800, 900, 1000, 1100, 2000, 3000, 5000,
    ],
    xpGrowthLate: 1.4,
    maxLevel: 50,
  },

  // ---- Enemies ----
  enemy: {
    radius: 12,
    color: "#ef4444",
    hp: 5,
    speed: 55,
    damage: 8,
    spawnInterval: 0.8, // seconds at 0:00
    spawnDecayPerSecond: 0.98, // first minute: interval × this, every second
    spawnDecayEarlySeconds: 60,
    spawnDecayPerMinute: 0.75, // after that: interval × this, every minute. No floor.
    maxCount: 120, // at 0:00. Grows by maxCountGrowthPerMinute (100%p) each minute.
    maxCountGrowthPerMinute: 1,
    contactDamageCooldown: 0.5,
    // A trash type stops joining this many seconds after unlockedTime.
    activeSeconds: 180,
    // Regular spawn HP = base × hpPerMinute ^ (minutes through hpLateFrom)
    // × hpPerMinuteLate ^ (minutes after that). Elites use elite.hp instead.
    hpPerMinute: 1.8,
    hpPerMinuteLate: 1.3,
    hpLateFrom: 300,
    // Contact damage at spawn = base × damagePerMinute ^ (elapsed minutes). Elites too.
    damagePerMinute: 1.2,
  },

  // ---- Enemy types ----
  // First five are a fixed order. A new type every 30s through 2:30, then every 60s.
  enemyTypes: [
    {
      id: "slime",
      name: "슬라임",
      color: "#ef4444",
      borderColor: "#7f1d1d",
      radius: 12,
      hp: 5,
      speed: 82.5,
      damage: 8,
      spawnWeight: 10,
      unlockedTime: 0,
      shape: "circle" as const,
    },
    {
      id: "bat",
      name: "박쥐",
      color: "#a78bfa",
      borderColor: "#6d28d9",
      radius: 9,
      hp: 3,
      speed: 142.5,
      damage: 6,
      spawnWeight: 7,
      unlockedTime: 30,
      shape: "triangle" as const,
    },
    {
      id: "ghost",
      name: "고스트",
      color: "#67e8f9",
      borderColor: "#0e7490",
      radius: 14,
      hp: 7.5,
      speed: 97.5,
      damage: 10,
      spawnWeight: 5,
      unlockedTime: 60,
      shape: "diamond" as const,
    },
    {
      id: "skeleton",
      name: "스켈레톤",
      color: "#e2e8f0",
      borderColor: "#64748b",
      radius: 13,
      hp: 12.5,
      speed: 67.5,
      damage: 12,
      spawnWeight: 6,
      unlockedTime: 90,
      shape: "square" as const,
    },
    {
      id: "eye",
      name: "눈알",
      color: "#facc15",
      borderColor: "#854d0e",
      radius: 13,
      hp: 7,
      speed: 72,
      damage: 8,
      spawnWeight: 2,
      unlockedTime: 120,
      shape: "circle" as const,
      ranged: true,
    },
    {
      id: "spider",
      name: "거미",
      color: "#4ade80",
      borderColor: "#166534",
      radius: 10,
      hp: 15,
      speed: 150,
      damage: 14,
      spawnWeight: 4,
      unlockedTime: 150,
      shape: "triangle" as const,
    },
    {
      id: "snake",
      name: "뱀",
      color: "#a3e635",
      borderColor: "#3f6212",
      radius: 12,
      hp: 18,
      speed: 108,
      damage: 16,
      spawnWeight: 3,
      unlockedTime: 210,
      shape: "square" as const,
    },
    {
      id: "wraith",
      name: "래쓰",
      color: "#f43f5e",
      borderColor: "#881337",
      radius: 11,
      hp: 20,
      speed: 165,
      damage: 15,
      spawnWeight: 3,
      unlockedTime: 270,
      shape: "star" as const,
    },
    {
      id: "lizard",
      name: "도마뱀",
      color: "#2dd4bf",
      borderColor: "#115e59",
      radius: 14,
      hp: 24,
      speed: 135,
      damage: 18,
      spawnWeight: 3,
      unlockedTime: 330,
      shape: "diamond" as const,
    },
    {
      id: "wolf",
      name: "늑대",
      color: "#94a3b8",
      borderColor: "#475569",
      radius: 16,
      hp: 30,
      speed: 127.5,
      damage: 18,
      spawnWeight: 4,
      unlockedTime: 390,
      shape: "sprite" as const,
    },
    {
      id: "skull",
      name: "해골",
      color: "#fda4af",
      borderColor: "#9f1239",
      radius: 14,
      hp: 35,
      speed: 60,
      damage: 14,
      spawnWeight: 1.5,
      unlockedTime: 420,
      shape: "circle" as const,
      ranged: true,
    },
    {
      id: "brute",
      name: "브루트",
      color: "#f97316",
      borderColor: "#9a3412",
      radius: 20,
      hp: 40,
      speed: 52.5,
      damage: 20,
      spawnWeight: 2,
      unlockedTime: 450,
      shape: "hexagon" as const,
    },
    {
      id: "mushroom",
      name: "버섯",
      color: "#e879f9",
      borderColor: "#86198f",
      radius: 18,
      hp: 45,
      speed: 45,
      damage: 22,
      spawnWeight: 2,
      unlockedTime: 510,
      shape: "hexagon" as const,
    },
  ] as const,

  // Ranged types (enemyTypes[].ranged) hold this band and fire a straight shot.
  // Elites keep the chase and never shoot.
  ranged: {
    range: 260,       // stop approaching inside this
    backup: 150,      // step back when the player gets closer
    cooldown: 1.8,    // seconds between shots
    shotSpeed: 240,   // px/s, aimed at the player when fired
    shotRadius: 5,    // hit only. The picture is larger so a miss can look close
    shotDrawRadius: 10,
    shotDamage: 2,    // base; spawn scale matches contact, the hit does not
    maxShots: 40,
  },

  // ---- Elite enemies (spawn every 60s) ----
  elite: {
    spawnInterval: 60, // seconds between elite spawns
    killSeconds: 30, // game over if this elite is still alive
    hp: 250,           // same for every elite
    // Through hpLateFrom, then the late rate compounds on top. Bosses share this curve.
    hpPerMinute: 2.1,
    hpPerMinuteLate: 1.7,
    hpLateFrom: 300,
    // Fixed body. Not copied from whichever regular type is spawning.
    radius: 14,
    speed: 50,
    damage: 14,
    damageMult: 1.5,
    speedMult: 0.9,
    radiusMult: 1.8,
    color: "#fbbf24",
    borderColor: "#f59e0b",
  },

  // The 5:00 elite slot. HP uses the elite minute curve. Damage stays flat.
  // 적의 체력, 공격력, and 속도 still apply when the boss is created.
  midBoss: {
    spawnAt: 300,
    hp: 200, // × the elite HP curve, with 체력 배율 inside each minute's rate
    radius: 36,
    speed: 80,
    approach: 200,
    dashLength: 400,
    dashTime: 0.1,
    contactDamage: 50,
    dashDamage: 50,
    windup: 1,
    enragedWindup: 0.6,
    enrageAt: 0.5,
    enragedDashes: 3,
    recover: 0.8,
    color: "#d4924a",
    borderColor: "#7c3f12",
    telegraph: "#ffedd5",
    telegraphTrack: "#7c2d12",
  },

  // The 10:00 win boss. Replaces that minute's elite and ends the run on death.
  // HP and damage use the elite multipliers. Pattern gaps shrink with HP.
  finalBoss: {
    spawnAt: 600,
    hp: 500,
    damage: 6,
    radius: 48,
    dashPast: 100,
    dashSpeed: 2000,
    dashWindup: 2,
    dashChase: 800,
    slamRadius: 500,
    slamWindup: 2,
    slamWithin: 300,
    shockRadius: 800,
    shockAngle: Math.PI / 2,
    shockWindup: 1.2,
    shockBeyond: 200,
    bombRadius: 120,
    bombCount: 28,
    // Centers may sit this far outside the screen, so blasts reach past the edge.
    bombMargin: 160,
    bombWindup: 1.5,
    // How long the hit shape stays solid after slam, shock, and bombs go off.
    impactTime: 0.22,
    waveRadius: 48,
    waveSpeed: 1500,
    waveRange: 900,
    waveCount: 3,
    waveWindupFirst: 1,
    waveWindupNext: 0.6,
    recover: 1,
    recoverLow: 0.5,
    recoverLowAt: 0.6,
    recoverNoneAt: 0.3,
    color: "#a78bfa",
    borderColor: "#4c1d95",
    telegraph: "#ddd6fe",
    telegraphTrack: "#4c1d95",
  },

  // ---- Gems ----
  gem: {
    radius: 7,
    magnetSpeed: 280, // px/s at base move speed; faster players pull this much harder
    color: "#7dd3fc", // bright sky; merged gems step toward deep blue in GemManager
  },

  // Rare kill drop. One roll per kill; the three pickups are equally likely.
  // After dropDecayAfter, the chance is multiplied by dropDecayPerMinute each minute.
  special: {
    dropChance: 1 / 300,
    dropDecayAfter: 300,
    dropDecayPerMinute: 0.8,
    radius: 13,
    pullSpeed: 720, // px/s at base move speed; the magnet pickup scales the same way
  },

  // ---- Max weapons a player can hold ----
  maxWeapons: 6,

  // ---- Max accessories a player can hold ----
  maxAccessories: 5,

  // ---- Accessory definitions ----
  // Passive trinkets that boost stats. Level starts at 1; upgrading increases the effect.
  accessories: {
    swiftBoots: {
      name: "질풍의 부츠",
      desc: "이동 속도 증가",
      icon: "wind",
      baseMoveSpeedMult: 1.10,
      growthMoveSpeedMult: 0.05,
      maxLevel: 5,
    },
    vitalRing: {
      name: "생명의 반지",
      desc: "최대 체력 증가",
      icon: "heart",
      baseMaxHpAdd: 25,
      growthMaxHpAdd: 15,
      maxLevel: 5,
    },
    magnetCharm: {
      name: "자석 부적",
      desc: "경험치 흡수 범위 증가",
      icon: "magnet",
      basePickupMult: 1.20,
      growthPickupMult: 0.10,
      maxLevel: 5,
    },
    powerAmulet: {
      name: "전투의 부적",
      desc: "모든 무기 공격력 증가",
      icon: "sword",
      baseDamageMult: 1.10,
      growthDamageMult: 0.06,
      maxLevel: 5,
    },
    hastePendant: {
      name: "질주의 목걸이",
      desc: "모든 무기 쿨다운 감소",
      icon: "zap",
      baseCooldownMult: 0.92,
      growthCooldownMult: -0.03,
      maxLevel: 5,
    },
    xpcrystal: {
      name: "지혜의 결정",
      desc: "경험치 획득량 증가",
      icon: "gem",
      baseXpMult: 1.15,
      growthXpMult: 0.08,
      maxLevel: 5,
    },
    thornArmor: {
      name: "가시 갑옷",
      desc: "접촉한 적에게 피해 반사",
      icon: "shield",
      baseReflectDamage: 5,
      growthReflectDamage: 4,
      maxLevel: 5,
    },
    shieldForge: {
      name: "수호의 방패",
      desc: "받는 피해 감소",
      icon: "shield-check",
      baseDamageReduction: 0.05,
      growthDamageReduction: 0.04,
      maxLevel: 5,
    },
    natureBlessing: {
      name: "자연의 축복",
      desc: "초당 체력 재생량 증가",
      icon: "leaf",
      baseRegenPerSec: 0.5,
      growthRegen: 0.8 / 3,
      maxLevel: 5,
    },
    keenRing: {
      name: "예리한 반지",
      desc: "치명타 확률이 오른다",
      icon: "sword",
      baseCritChance: 0.06,
      growthCritChance: 0.04,
      maxLevel: 5,
    },
    goldPurse: {
      name: "황금 주머니",
      desc: "판이 끝난 뒤 골드를 더 받는다",
      icon: "coin",
      baseGoldMult: 1.12,
      growthGoldMult: 0.08,
      maxLevel: 5,
    },
    vampireFang: {
      name: "흡혈 송곳니",
      desc: "적을 잡을 때마다 체력을 조금 회복한다",
      icon: "fang",
      baseKillHeal: 0.4,
      growthKillHeal: 0.25,
      maxLevel: 5,
    },
  } as Record<string, AccessoryDef>,

  // ---- Weapon definitions ----
  // Each weapon type has its own base stats.
  // `level` starts at 1; upgrading increases damage, cooldown, etc.
  weapons: {
    bullet: {
      name: "라이플",
      desc: "가까운 적에게 탄환을 버스트로 연사 — 투두두 쏘고 잠깐 대기",
      color: "#fbbf24",
      baseDamage: 7,
      baseBurstCount: 3,
      baseBurstInterval: 0.08,
      baseBurstPause: 1.2,
      baseProjectileSpeed: 340,
      basePierce: 1,
      baseProjectileRadius: 5,
      range: 350,
      damageGrowth: 1.18,
      burstPauseGrowth: 0.90,
      speedGrowth: 1.10,
      maxLevel: 8,
    },
    melee: {
      name: "근접 회전검",
      desc: "플레이어 주변을 회전하며 적을 베는 칼날",
      color: "#f472b6",
      baseDamage: 18,
      baseCooldown: 0,    // continuous, not timer-based
      baseBladeRadius: 55, // swing orbit radius
      baseBladeSize: 16,
      baseBladeCount: 2,
      hitCooldown: 0.4,   // per-enemy re-hit delay
      damageGrowth: 1.25,
      bladeCountGrowth: 1, // +1 blade every 2 levels
      bladeRadiusGrowth: 1.08,
      maxLevel: 8,
    },
    bomb: {
      name: "폭발탄",
      desc: "무작위 적 근처에 투하되어 범위 폭발",
      color: "#fb923c",
      baseDamage: 30,
      baseCooldown: 3.0,
      baseExplosionRadius: 55,
      baseFallTime: 0.8,  // time before detonation
      damageGrowth: 1.30,
      cooldownGrowth: 0.90,
      explosionRadiusGrowth: 1.12,
      maxLevel: 8,
    },
    trap: {
      name: "설치형 트랩",
      desc: "필드에 설치되어 닿은 적에게 지속 피해",
      color: "#34d399",
      baseDamage: 8,
      baseCooldown: 4.0,
      baseTrapRadius: 20,
      baseTrapLifetime: 6.0,
      baseMaxTraps: 3,
      hitCooldown: 0.5,
      damageGrowth: 1.20,
      cooldownGrowth: 0.92,
      trapLifetimeGrowth: 1.15,
      maxTrapsGrowth: 1,  // +1 trap every 3 levels
      maxLevel: 8,
    },
    aura: {
      name: "화염 오오라",
      desc: "플레이어 주변의 적에게 지속 데미지",
      color: "#f87171",
      baseDamage: 2.5,
      baseCooldown: 0,     // continuous tick
      baseAuraRadius: 70,
      tickInterval: 0.5,
      damageGrowth: 1.25,
      auraRadiusGrowth: 1.10,
      maxLevel: 8,
    },
    shuriken: {
      name: "비도",
      desc: "여러 개를 동시에 던져 적을 관통하는 투척 무기",
      color: "#c4b5fd",
      baseDamage: 14,
      baseCooldown: 1.4,
      baseProjectileSpeed: 300,
      baseRange: 400,
      basePierce: 3,
      baseProjectileRadius: 9,
      damageGrowth: 1.22,
      cooldownGrowth: 0.93,
      speedGrowth: 1.08,
      maxLevel: 8,
    },
    claw: {
      name: "야생의 발톱",
      desc: "주변의 적을 주기적으로 긁어버리는 야생의 일격",
      color: "#84cc16",
      baseDamage: 22,
      baseCooldown: 1.6,
      baseRadius: 80,
      baseSlashCount: 1,
      hitCooldown: 0.0, // per-slash: hits all in radius once per slash
      damageGrowth: 1.28,
      cooldownGrowth: 0.92,
      radiusGrowth: 1.06,
      maxLevel: 8,
    },
    fist: {
      name: "주먹",
      desc: "가까운 적을 향해 주먹을 연타한다",
      color: "#f43f5e",
      baseDamage: 12,
      baseCooldown: 0.95,
      baseReach: 80,
      baseHitRadius: 48,
      baseJabCount: 2,
      jabInterval: 0.12,
      finisherMult: 2.5,
      damageGrowth: 1.22,
      cooldownGrowth: 0.94,
      reachGrowth: 1.05,
      maxLevel: 8,
    },
    axe: {
      name: "양날도끼",
      desc: "크게 휘둘러 범위 안의 적을 쓸어버린다",
      color: "#d97706",
      baseDamage: 24,
      baseCooldown: 1.75,
      baseRadius: 108,
      damageGrowth: 1.22,
      cooldownGrowth: 0.93,
      radiusGrowth: 1.05,
      maxLevel: 8,
    },
  } as const,

};

interface AccessoryDef {
  name: string;
  desc: string;
  icon: string;
  maxLevel: number;
  baseMoveSpeedMult?: number;
  growthMoveSpeedMult?: number;
  baseMaxHpAdd?: number;
  growthMaxHpAdd?: number;
  baseRegenPerSec?: number;
  growthRegen?: number;
  basePickupMult?: number;
  growthPickupMult?: number;
  baseDamageMult?: number;
  growthDamageMult?: number;
  baseCooldownMult?: number;
  growthCooldownMult?: number;
  baseXpMult?: number;
  growthXpMult?: number;
  baseReflectDamage?: number;
  growthReflectDamage?: number;
  baseDamageReduction?: number;
  growthDamageReduction?: number;
  baseCritChance?: number;
  growthCritChance?: number;
  baseGoldMult?: number;
  growthGoldMult?: number;
  baseKillHeal?: number;
  growthKillHeal?: number;
}

// XP required to go from `level` to `level+1`.
// The table covers the early levels. Later levels are the last table cost × 1.4 per step.
export function xpForLevel(level: number): number {
  const { xpCurve, xpGrowthLate } = CONFIG.leveling;
  if (level <= xpCurve.length) return xpCurve[level - 1];
  const last = xpCurve[xpCurve.length - 1];
  return Math.floor(last * Math.pow(xpGrowthLate, level - xpCurve.length));
}

/**
 * Per-minute HP scale with a breakpoint. The first `lateFrom` seconds use `early`,
 * and time after that uses `late` on top. `growthMult` (제약 체력 배율) multiplies
 * both rates before the exponent. Already-spawned enemies do not call this again.
 */
function steppedHpScale(elapsedSeconds: number, early: number, late: number, lateFrom: number, growthMult: number): number {
  const minutes = elapsedSeconds / 60;
  const split = lateFrom / 60;
  const earlyMinutes = Math.min(minutes, split);
  const lateMinutes = Math.max(0, minutes - split);
  return Math.pow(early * growthMult, earlyMinutes) * Math.pow(late * growthMult, lateMinutes);
}

/** HP multiplier for a regular enemy spawned at `elapsedSeconds`. 1 at 0:00. */
export function enemyHpScale(elapsedSeconds: number, growthMult = 1): number {
  const e = CONFIG.enemy;
  return steppedHpScale(elapsedSeconds, e.hpPerMinute, e.hpPerMinuteLate, e.hpLateFrom, growthMult);
}

/** Contact-damage multiplier for any enemy spawned at `elapsedSeconds`. 1 at 0:00, 1.2 at 1:00. */
export function enemyDamageScale(elapsedSeconds: number): number {
  return Math.pow(CONFIG.enemy.damagePerMinute, elapsedSeconds / 60);
}

/** Elite curve shared by elites, the midboss, and the final boss. */
function eliteHpScale(elapsedSeconds: number, growthMult: number): number {
  const e = CONFIG.elite;
  return steppedHpScale(elapsedSeconds, e.hpPerMinute, e.hpPerMinuteLate, e.hpLateFrom, growthMult);
}

/** Elite HP at spawn. Does not use the regular type's HP. */
export function eliteHp(elapsedSeconds: number, growthMult = 1): number {
  return CONFIG.elite.hp * eliteHpScale(elapsedSeconds, growthMult);
}

/** Midboss HP at spawn. Same curve as an elite, with its own base. */
export function midBossHp(elapsedSeconds: number, growthMult = 1): number {
  return CONFIG.midBoss.hp * eliteHpScale(elapsedSeconds, growthMult);
}

/** Final boss HP at spawn. Same curve as an elite. */
export function finalBossHp(elapsedSeconds: number, growthMult = 1): number {
  return CONFIG.finalBoss.hp * eliteHpScale(elapsedSeconds, growthMult);
}

/** Special-item chance per kill. Flat until 5:00, then ×0.8 each minute. */
export function specialDropChance(elapsedSeconds: number): number {
  const { dropChance, dropDecayAfter, dropDecayPerMinute } = CONFIG.special;
  const lateMinutes = Math.max(0, elapsedSeconds - dropDecayAfter) / 60;
  return dropChance * Math.pow(dropDecayPerMinute, lateMinutes);
}

/**
 * Seconds between regular spawns. Starts at spawnInterval.
 * The first minute multiplies by spawnDecayPerSecond each second.
 * After that, multiplies by spawnDecayPerMinute each minute. No minimum.
 */
export function regularSpawnInterval(elapsedSeconds: number): number {
  const { spawnInterval, spawnDecayPerSecond, spawnDecayEarlySeconds, spawnDecayPerMinute } = CONFIG.enemy;
  const early = Math.min(Math.max(0, elapsedSeconds), spawnDecayEarlySeconds);
  const lateMinutes = Math.max(0, elapsedSeconds - spawnDecayEarlySeconds) / 60;
  return (
    spawnInterval *
    Math.pow(spawnDecayPerSecond, early) *
    Math.pow(spawnDecayPerMinute, lateMinutes)
  );
}

/** Regular-enemy cap. 100% of maxCount at the start, plus 100 percentage points per minute. */
export function enemyCap(elapsedSeconds: number, countMult = 1): number {
  const minutes = elapsedSeconds / 60;
  return Math.floor(
    CONFIG.enemy.maxCount * (1 + CONFIG.enemy.maxCountGrowthPerMinute * minutes) * countMult,
  );
}
