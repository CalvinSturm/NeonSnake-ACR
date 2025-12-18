import { GameSettings, StageTheme, CharacterProfile, Difficulty, DifficultyConfig, EnemyType } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 20,
  initialSpeed: 100,
  volume: 0.3
};

// Base Colors (Fallbacks)
export const COLORS = {
  background: '#050505',
  grid: '#1a1a1a',
  wallBorder: '#00ccff',
  snakeHead: '#ffffff',
  projectile: '#ffff00',
  foodNormal: '#39ff14',
  foodBonus: '#ffd700',
  foodPoison: '#ff00ff',
  foodSlow: '#00bfff',
  foodMagnet: '#ffffff',
  foodCompressor: '#00ffff',
  text: '#ffffff',
  uiPanel: 'rgba(10, 20, 30, 0.85)',
  hpBarBg: '#330000',
  hpBarFill: '#ff0000',
  shield: '#00ffff',
  aura: 'rgba(255, 50, 50, 0.3)',
  terminal: '#d000ff',
  terminalRing: 'rgba(208, 0, 255, 0.2)',
  nanoSwarm: '#ff00aa',
  boss: '#ff0000', // Warning red
  damageText: '#ffffff',
  critText: '#ffff00',
  mine: '#ff8800',
  mineRing: 'rgba(255, 136, 0, 0.3)',
  lightning: '#00ffff',
  
  // Enemy specific
  enemyHunter: '#ff3333',
  enemyInterceptor: '#cc00ff',
  enemyDasher: '#ff8800',
  enemyShooter: '#00ff00'
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    [Difficulty.EASY]: {
        id: Difficulty.EASY,
        label: 'NEOPHYTE',
        description: 'Standard protocol. Low threat density.',
        spawnRateMod: 1.2,
        hpMod: 0.8,
        speedMod: 1.0,
        allowedEnemies: [EnemyType.HUNTER],
        bossHpMod: 0.7,
        unlockCondition: 'DEFAULT',
        stageGoal: 5,
        color: 'text-green-400'
    },
    [Difficulty.MEDIUM]: {
        id: Difficulty.MEDIUM,
        label: 'OPERATOR',
        description: 'Active combat. Interceptors detected.',
        spawnRateMod: 1.0,
        hpMod: 1.0,
        speedMod: 1.0,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR],
        bossHpMod: 1.0,
        unlockCondition: 'Reach Stage 5 on Neophyte',
        stageGoal: 10,
        color: 'text-cyan-400'
    },
    [Difficulty.HARD]: {
        id: Difficulty.HARD,
        label: 'VETERAN',
        description: 'High threat. Shooters deployed.',
        spawnRateMod: 0.8, // Faster spawns
        hpMod: 1.5,
        speedMod: 1.1,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER],
        bossHpMod: 1.5,
        unlockCondition: 'Reach Stage 10 on Operator',
        stageGoal: 15,
        color: 'text-orange-400'
    },
    [Difficulty.INSANE]: {
        id: Difficulty.INSANE,
        label: 'CYBERPSYCHO',
        description: 'Maximum lethality. Dashers incoming.',
        spawnRateMod: 0.6, // Very fast spawns
        hpMod: 2.0,
        speedMod: 1.2,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER, EnemyType.DASHER],
        bossHpMod: 2.5,
        unlockCondition: 'Reach Stage 15 on Veteran',
        stageGoal: 999,
        color: 'text-red-500'
    }
};

export const STAGE_THEMES: Record<number, StageTheme> = {
  1: {
    name: 'CYBER PROTOCOL',
    primary: 'rgba(0, 255, 255, 0.2)',
    secondary: '#00ffcc',
    background: 'rgba(0, 50, 50, 0.1)',
    wall: '#004444',
    enemy: '#ff3333'
  },
  2: {
    name: 'MATRIX BREACH',
    primary: 'rgba(0, 255, 100, 0.2)',
    secondary: '#00ff00',
    background: 'rgba(50, 0, 0, 0.1)',
    wall: '#004400',
    enemy: '#ff00ff'
  },
  3: {
    name: 'INDUSTRIAL ZONE',
    primary: 'rgba(255, 165, 0, 0.2)',
    secondary: '#ffaa00',
    background: 'rgba(50, 20, 0, 0.1)',
    wall: '#442200',
    enemy: '#00ffff'
  },
  4: {
    name: 'SYNTHWAVE',
    primary: 'rgba(255, 0, 255, 0.2)',
    secondary: '#ff00ff',
    background: 'rgba(50, 0, 50, 0.1)',
    wall: '#440044',
    enemy: '#ffff00'
  }
};

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'striker',
    name: 'STRIKER',
    description: 'HEAVY GUNNER. High fire rate and damage.',
    color: '#ffdd00',
    tag: 'STABLE',
    payoff: 'Win by firepower.',
    initialStats: {
      weapon: {
        cannonLevel: 3, 
        cannonDamage: 20,
        cannonFireRate: 800, // Very fast
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        shockwaveLevel: 0,
        shockwaveRadius: 0,
        shockwaveDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0
      }
    }
  },
  {
    id: 'spectre',
    name: 'SPECTRE',
    description: 'LOOTER. Medium magnet range and XP gain. Semi-transparent.',
    color: '#00ffcc',
    tag: 'ADAPTIVE',
    payoff: 'Win by positioning.',
    initialStats: {
      magnetRangeMod: 0.5, // Reduced from 3
      foodQualityMod: 1.5, // 50% more XP
      slowDurationMod: 1.5,
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1500,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        shockwaveLevel: 0,
        shockwaveRadius: 0,
        shockwaveDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0
      }
    }
  },
  {
    id: 'volt',
    name: 'VOLT',
    description: 'CROWD CONTROL. Chains lightning between enemies.',
    color: '#bd00ff',
    tag: 'VOLATILE',
    payoff: 'Win by chaos.',
    initialStats: {
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1500,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        shockwaveLevel: 1,
        shockwaveRadius: 10,
        shockwaveDamage: 60,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 1,
        chainLightningDamage: 0.6,
        chainLightningRange: 7
      }
    }
  },
  {
    id: 'rigger',
    name: 'RIGGER',
    description: 'TACTICIAN. Deploys Mines and Drones.',
    color: '#ff8800',
    tag: 'ADAPTIVE',
    payoff: 'Win by preparation.',
    initialStats: {
      weapon: {
        cannonLevel: 0,
        cannonDamage: 0,
        cannonFireRate: 0,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        shockwaveLevel: 0,
        shockwaveRadius: 0,
        shockwaveDamage: 0,
        nanoSwarmLevel: 1,
        nanoSwarmCount: 2,
        nanoSwarmDamage: 15,
        mineLevel: 1,
        mineDamage: 40,
        mineRadius: 3,
        mineDropRate: 3000,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0
      }
    }
  },
  {
    id: 'bulwark',
    name: 'BULWARK',
    description: 'TANK. Starts with Shield. Fast EMP recharge.',
    color: '#0088ff',
    tag: 'STABLE',
    payoff: 'Win by endurance.',
    initialStats: {
      shieldActive: true,
      empChargeMod: 1.5,
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1500,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        shockwaveLevel: 2, // Stronger shockwave start
        shockwaveRadius: 12,
        shockwaveDamage: 80,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0
      }
    }
  },
  {
    id: 'overdrive',
    name: 'OVERDRIVE',
    description: 'BERSERKER. High Aura damage and Score multiplier.',
    color: '#ff0044',
    tag: 'VOLATILE',
    payoff: 'Win by speed.',
    initialStats: {
      scoreMultiplier: 1.5,
      weapon: {
        cannonLevel: 0,
        cannonDamage: 0,
        cannonFireRate: 0,
        auraLevel: 2,
        auraRadius: 2.0,
        auraDamage: 15,
        shockwaveLevel: 0,
        shockwaveRadius: 0,
        shockwaveDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0
      }
    }
  }
];

export const GRID_COLS = CANVAS_WIDTH / DEFAULT_SETTINGS.gridSize;
export const GRID_ROWS = CANVAS_HEIGHT / DEFAULT_SETTINGS.gridSize;

// Chances out of 100
export const CHANCE_BONUS = 5;
export const CHANCE_POISON = 5;
export const CHANCE_SLOW = 3;
export const CHANCE_MAGNET = 3;
export const CHANCE_COMPRESSOR = 4;

export const DURATION_SLOW = 5000;
export const DURATION_MAGNET = 5000;
export const MAGNET_RADIUS = 0; // Strict by default (requires upgrades or powerups)

export const COMBO_WINDOW = 3000;
export const ENEMY_SPAWN_INTERVAL = 8000;
export const ENEMY_MOVE_TICK = 300;
export const EMP_CHARGE_PER_FOOD = 8; 

// Progression
export const XP_TO_LEVEL_UP = 800;
export const PASSIVE_SCORE_PER_SEC = 5;
export const POINTS_PER_STAGE = 2500;

// Hacking
export const TERMINAL_SPAWN_CHANCE = 0.002; // Per frame
export const TERMINAL_HACK_RADIUS = 4; // Grid cells
export const TERMINAL_HACK_TIME = 3000; // ms

// Combat
export const ENEMY_BASE_HP = 30;
export const BOSS_BASE_HP = 1500;
export const PROJECTILE_SPEED = 18;
export const SHOCKWAVE_SPEED = 1.5;