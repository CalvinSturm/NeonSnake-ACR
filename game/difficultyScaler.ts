
import { Enemy, Difficulty, EnemyType } from '../types';

export enum DifficultyTier {
  EASY,
  NORMAL,
  HARD,
  ELITE
}

interface TierConfig {
  speedMod: number;
  maxEnemies: number;
  hpMod: number;
  damageMod: number;
  attackSpeedMod: number;  // Lower = faster attacks
  spawnBurstChance: number; // Chance to spawn multiple enemies
}

const CONFIG: Record<DifficultyTier, TierConfig> = {
  [DifficultyTier.EASY]: {
    speedMod: 0.8,
    maxEnemies: 10,
    hpMod: 0.8,
    damageMod: 0.7,
    attackSpeedMod: 1.3,
    spawnBurstChance: 0.1
  },
  [DifficultyTier.NORMAL]: {
    speedMod: 1.0,
    maxEnemies: 15,
    hpMod: 1.0,
    damageMod: 1.0,
    attackSpeedMod: 1.0,
    spawnBurstChance: 0.2
  },
  [DifficultyTier.HARD]: {
    speedMod: 1.2,
    maxEnemies: 20,
    hpMod: 1.3,
    damageMod: 1.2,
    attackSpeedMod: 0.8,
    spawnBurstChance: 0.35
  },
  [DifficultyTier.ELITE]: {
    speedMod: 1.4,
    maxEnemies: 30,
    hpMod: 1.5,
    damageMod: 1.5,
    attackSpeedMod: 0.6,
    spawnBurstChance: 0.5
  }
};

// Per-enemy type speed modifiers
const ENEMY_SPEED_MODS: Record<EnemyType, number> = {
  [EnemyType.HUNTER]: 1.0,
  [EnemyType.INTERCEPTOR]: 1.3,   // Fast flankers
  [EnemyType.SHOOTER]: 0.7,       // Slow but deadly
  [EnemyType.DASHER]: 1.1,        // Fast base, dashes are separate
  [EnemyType.BOSS]: 0.5
};

export const getTierFromDifficulty = (diff: Difficulty): DifficultyTier => {
  switch (diff) {
    case Difficulty.EASY: return DifficultyTier.EASY;
    case Difficulty.MEDIUM: return DifficultyTier.NORMAL;
    case Difficulty.HARD: return DifficultyTier.HARD;
    case Difficulty.INSANE: return DifficultyTier.ELITE;
    default: return DifficultyTier.NORMAL;
  }
};

export const getMaxEnemies = (tier: DifficultyTier): number => {
  return CONFIG[tier].maxEnemies;
};

export const getTierConfig = (tier: DifficultyTier): TierConfig => {
  return CONFIG[tier];
};

export const getSpawnBurstCount = (tier: DifficultyTier, stage: number): number => {
  const config = CONFIG[tier];
  // Base burst chance + stage scaling
  const burstChance = Math.min(0.7, config.spawnBurstChance + (stage * 0.02));

  if (Math.random() < burstChance) {
    // 1-3 extra enemies on burst
    return 1 + Math.floor(Math.random() * 3);
  }
  return 1;
};

/**
 * Applies difficulty scaling to an enemy instance at spawn time.
 * Mutates the enemy object directly.
 */
export const scaleEnemy = (enemy: Enemy, tier: DifficultyTier): void => {
  const config = CONFIG[tier];
  const typeSpeedMod = ENEMY_SPEED_MODS[enemy.type] || 1.0;

  // Apply speed scaling
  if (enemy.speed !== undefined) {
    enemy.speed *= config.speedMod * typeSpeedMod;
  }

  // Apply HP scaling
  if (enemy.hp !== undefined && enemy.maxHp !== undefined) {
    const hpScale = config.hpMod;
    enemy.hp = Math.floor(enemy.hp * hpScale);
    enemy.maxHp = Math.floor(enemy.maxHp * hpScale);
  }
};

/**
 * Gets the spawn interval for a difficulty tier
 */
export const getSpawnInterval = (tier: DifficultyTier, baseInterval: number): number => {
  const mods: Record<DifficultyTier, number> = {
    [DifficultyTier.EASY]: 1.4,
    [DifficultyTier.NORMAL]: 1.0,
    [DifficultyTier.HARD]: 0.7,
    [DifficultyTier.ELITE]: 0.5
  };
  return baseInterval * mods[tier];
};
