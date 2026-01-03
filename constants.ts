
import { GameSettings, StageTheme, CharacterProfile, Difficulty, DifficultyConfig, EnemyType, UpgradeRarity, EnemyPhysicsProfile } from './types';

export const CANVAS_WIDTH = 800;

// LAYOUT AUTHORITY
const GRID_SIZE = 20;
export const HUD_TOP_ROWS = 4; 
export const HUD_BOTTOM_ROWS = 5;
export const PLAY_ROWS = 30;

export const HUD_TOP_HEIGHT = HUD_TOP_ROWS * GRID_SIZE; // 80px
export const HUD_BOTTOM_HEIGHT = HUD_BOTTOM_ROWS * GRID_SIZE; // 100px
export const PLAY_AREA_HEIGHT = PLAY_ROWS * GRID_SIZE; // 600px

export const CANVAS_HEIGHT = HUD_TOP_HEIGHT + PLAY_AREA_HEIGHT + HUD_BOTTOM_HEIGHT; // 780px

export const DEFAULT_SETTINGS: GameSettings = {
  gridSize: GRID_SIZE,
  initialSpeed: 100,
  volume: 0.3
};

export const PHYSICS = {
  GRAVITY: 2400,          // pixels/s^2
  JUMP_VELOCITY: -900,    // pixels/s
  MAX_FALL_SPEED: 1200,   // pixels/s
  GROUND_Y_GRID: PLAY_ROWS - 2, // Floor is 2 rows thick
  VOID_Y_GRID: PLAY_ROWS + 5 // World bottom limit
};

export const STAMINA_CONFIG = {
  MAX: 3000, // 3 seconds max hold
  RECHARGE_RATE: 0.5, // 0.5x recharge speed relative to real time (6s to full)
  DRAIN_RATE: 1.0, // 1:1 drain
  MIN_TO_REENGAGE: 500 // Must have 0.5s stamina to start stopping again if fully depleted
};

export const PROJECTILE_PHYSICS = {
    GRAVITY_PER_FRAME: 0.6, // Derived from 2200 px/s^2 @ 60fps
    MAX_FALL_SPEED_PER_FRAME: 20 // Approx 1200 px/s
};

export const ENEMY_PHYSICS_DEFAULTS: Record<EnemyType, EnemyPhysicsProfile> = {
    [EnemyType.HUNTER]: { usesVerticalPhysics: false, canJump: false, jumpCooldown: 0 }, // Flyer
    [EnemyType.INTERCEPTOR]: { usesVerticalPhysics: false, canJump: false, jumpCooldown: 0 }, // Flyer
    [EnemyType.BOSS]: { usesVerticalPhysics: false, canJump: false, jumpCooldown: 0 }, // Flyer/Hover
    [EnemyType.SHOOTER]: { usesVerticalPhysics: true, canJump: false, jumpCooldown: 0 }, // Walker (No Jump)
    [EnemyType.DASHER]: { usesVerticalPhysics: true, canJump: true, jumpCooldown: 1500 } // Ground Unit (Jumper)
};

export const AI_CONFIG = {
    GAP_PROBE_DISTANCE: 1.2 // Grid units ahead to check for floor
};

// Hitbox Configuration (Unit: Grid Cells)
// Invariant: Player hitbox must be <= 80% of tile size to ensure fair visual clearance.
export const COLLISION_CONFIG = {
  PLAYER_HEAD_RADIUS: 0.35, // 70% visual size match (Diameter 0.7 < 0.8)
  ENEMY_RADIUS: 0.4,        // Standard enemy bulk
  PROJECTILE_RADIUS: 0.2,   // Projectile core
  CONFIRMATION_FRAMES: 2,   // Ticks required to confirm a lethal hit
  PROXIMITY_BUFFER: 0.4     // Extra radius for visual tension (non-lethal)
};

// ─────────────────────────────────────────────
// UPGRADE SCALING CONSTANTS (DATA TRUTH)
// ─────────────────────────────────────────────

export const RARITY_MULTIPLIERS: Record<UpgradeRarity, number> = {
    'COMMON': 1.0,
    'UNCOMMON': 1.25,
    'RARE': 1.5,
    'ULTRA_RARE': 2.0,
    'MEGA_RARE': 3.0,
    'LEGENDARY': 1.0, // Fixed / Special
    'OVERCLOCKED': 1.0 // Special
};

export const UPGRADE_BASES = {
    // Scalars
    SCALAR_DAMAGE: 0.10, // +10%
    SCALAR_FIRE_RATE: 0.10, // +10%
    SCALAR_AREA: 0.15, // +15%
    CRIT_CHANCE: 0.05, // +5%
    CRIT_MULT: 0.25, // +25%
    FOOD_QUALITY: 0.2, // +20%
    HACK_SPEED: 0.25, // +25%
    SCORE_MULT: 0.1, // +10%
    LUCK: 0.05, // +5%
    
    // Weapon Damage Increments (Flat)
    CANNON_DMG: 5,
    AURA_DMG: 8, // Buffed (Was 5)
    MINE_DMG: 50, 
    LIGHTNING_DMG: 0.10, // +10% chaining damage retention
    NANO_DMG: 5,
    PRISM_DMG: 12,
    SCATTER_DMG: 5,
    SERPENT_DMG: 10,
    RAIL_DMG: 60,
    
    // Weapon Utility Increments
    AURA_RADIUS: 0.8, // Buffed (Was 0.6)
    LIGHTNING_RANGE: 1.5,
    MINE_RATE_REDUCTION: 100, // ms reduced
    CANNON_FIRE_RATE_REDUCTION: 80, // ms reduced
    
    // Limits
    MAX_WEAPON_SLOTS: 6
};

// Base Colors (Fallbacks)
export const COLORS = {
  background: '#050505',
  grid: '#1a1a1a',
  wallBorder: '#00ccff',
  snakeHead: '#ffffff',
  projectile: '#ffff00',
  foodNormal: '#39ff14',
  xpOrb: '#00ffff',
  text: '#ffffff',
  uiPanel: 'rgba(10, 20, 30, 0.85)',
  hpBarBg: '#330000',
  hpBarFill: '#ff0000',
  shield: '#00ffff',
  aura: 'rgba(255, 50, 50, 0.6)',
  terminal: '#d000ff',
  terminalRing: 'rgba(208, 0, 255, 0.2)',
  nanoSwarm: '#ff00aa',
  boss: '#ff0000', 
  damageText: '#ffffff',
  critText: '#ffff00',
  mine: '#ff8800',
  mineRing: 'rgba(255, 136, 0, 0.3)',
  lightning: '#00ffff',
  
  // New Weapons
  prismLance: '#aaffff',
  neonScatter: '#ff00aa',
  voltSerpent: '#0055ff',
  phaseRail: '#aa00ff',
  
  // Enemy specific
  enemyHunter: '#ff3333',
  enemyInterceptor: '#cc00ff',
  enemyDasher: '#ff8800',
  enemyShooter: '#00ff00'
};

export const FAILURE_MESSAGES = [
  "SYSTEM_INTEGRITY_COMPROMISED",
  "CONNECTION_TERMINATED",
  "CRITICAL_KERNEL_PANIC",
  "SEGMENTATION_FAULT",
  "BUFFER_OVERFLOW_DETECTED",
  "SIGNAL_LOST"
];

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    [Difficulty.EASY]: {
        id: Difficulty.EASY,
        label: 'NEOPHYTE',
        description: 'Predictable patterns. Ideal for initialization.',
        spawnRateMod: 1.5,
        hpMod: 0.7,
        speedMod: 0.9,
        allowedEnemies: [EnemyType.HUNTER],
        bossHpMod: 0.6,
        unlockCondition: 'DEFAULT',
        stageGoal: 4,
        color: 'text-green-400'
    },
    [Difficulty.MEDIUM]: {
        id: Difficulty.MEDIUM,
        label: 'OPERATOR',
        description: 'Aggressive drones. Interceptors deployed.',
        spawnRateMod: 1.1,
        hpMod: 1.0,
        speedMod: 1.0,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR],
        bossHpMod: 1.0,
        unlockCondition: 'Clear Stage 4 on Neophyte',
        stageGoal: 8,
        color: 'text-cyan-400'
    },
    [Difficulty.HARD]: {
        id: Difficulty.HARD,
        label: 'VETERAN',
        description: 'High threat density. Tactical Shooters active.',
        spawnRateMod: 0.8, 
        hpMod: 1.4,
        speedMod: 1.15,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER],
        bossHpMod: 1.6,
        unlockCondition: 'Clear Stage 8 on Operator',
        stageGoal: 12,
        color: 'text-orange-400'
    },
    [Difficulty.INSANE]: {
        id: Difficulty.INSANE,
        label: 'CYBERPSYCHO',
        description: 'Maximum lethality. Chaotic Dashers inbound.',
        spawnRateMod: 0.5, 
        hpMod: 2.2,
        speedMod: 1.3,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER, EnemyType.DASHER],
        bossHpMod: 3.0,
        unlockCondition: 'Clear Stage 12 on Veteran',
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
    description: 'HEAVY GUNNER. High fire rate and projectile count.',
    color: '#ffdd00',
    tag: 'STABLE',
    payoff: 'Win by firepower.',
    traits: [
        { name: 'HYPER-THREADED', description: 'Attack Speed +1.5% per Level.', type: 'GROWTH' },
        { name: 'VELOCITY RAIL', description: 'Projectiles travel 25% faster.', type: 'STATIC' }
    ],
    initialStats: {
      globalProjectileSpeedMod: 1.25, 
      weapon: {
        cannonLevel: 3, 
        cannonDamage: 18,
        cannonFireRate: 900, 
        cannonProjectileCount: 1,
        cannonProjectileSpeed: 20,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  },
  {
    id: 'spectre',
    name: 'SPECTRE',
    description: 'LOOTER. High magnet range and XP gain. Adaptive transparency.',
    color: '#00ffcc',
    tag: 'ADAPTIVE',
    payoff: 'Win by positioning.',
    traits: [
        { name: 'RNG MANIPULATION', description: 'Luck +2% per Level. Better upgrades.', type: 'GROWTH' },
        { name: 'GHOST PROTOCOL', description: '15% Chance to evade damage.', type: 'STATIC' }
    ],
    initialStats: {
      magnetRangeMod: 1.5,
      foodQualityMod: 1.6, 
      slowDurationMod: 1.5,
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1500,
        cannonProjectileCount: 1,
        cannonProjectileSpeed: 18,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  },
  {
    id: 'volt',
    name: 'VOLT',
    description: 'CROWD CONTROL. Attacks chain lightning to nearby threats.',
    color: '#bd00ff',
    tag: 'VOLATILE',
    payoff: 'Win by chaos.',
    traits: [
        { name: 'DATA SIPHON', description: 'XP Gain +5% per Level.', type: 'GROWTH' },
        { name: 'STATIC SHELL', description: '20% Chance to shock enemies on contact.', type: 'STATIC' }
    ],
    initialStats: {
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1500,
        cannonProjectileCount: 1,
        cannonProjectileSpeed: 18,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 1,
        chainLightningDamage: 0.65,
        chainLightningRange: 8,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  },
  {
    id: 'rigger',
    name: 'RIGGER',
    description: 'TACTICIAN. Automates containment via Mines and Nano Swarms.',
    color: '#ff8800',
    tag: 'ADAPTIVE',
    payoff: 'Win by preparation.',
    traits: [
        { name: 'OVERRIDE OPS', description: 'Hack Time -4% per Level.', type: 'GROWTH' },
        { name: 'DEMO EXPERT', description: 'Mines have +50% Radius & +20% Damage.', type: 'STATIC' }
    ],
    initialStats: {
      weapon: {
        cannonLevel: 0,
        cannonDamage: 0,
        cannonFireRate: 0,
        cannonProjectileCount: 0,
        cannonProjectileSpeed: 0,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        nanoSwarmLevel: 1,
        nanoSwarmCount: 2,
        nanoSwarmDamage: 15,
        mineLevel: 1,
        mineDamage: 150, // High base
        mineRadius: 3.5,
        mineDropRate: 3000, // FASTER RATE (3s)
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  },
  {
    id: 'bulwark',
    name: 'BULWARK',
    description: 'TANK. High endurance. Reinforced structural integrity.',
    color: '#0088ff',
    tag: 'STABLE',
    payoff: 'Win by endurance.',
    traits: [
        { name: 'NANOWEAVE', description: 'Damage Resist +1.5% per Level.', type: 'GROWTH' },
        { name: 'REINFORCED HULL', description: 'Take 50% less damage from body impacts.', type: 'STATIC' }
    ],
    initialStats: {
      shieldActive: true,
      weapon: {
        cannonLevel: 1,
        cannonDamage: 10,
        cannonFireRate: 1600,
        cannonProjectileCount: 1,
        cannonProjectileSpeed: 15,
        auraLevel: 0,
        auraRadius: 0,
        auraDamage: 0,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  },
  {
    id: 'overdrive',
    name: 'OVERDRIVE',
    description: 'BERSERKER. High speed, max score yield. High risk.',
    color: '#ff0044',
    tag: 'VOLATILE',
    payoff: 'Win by speed.',
    traits: [
        { name: 'CRIT SYSTEMS', description: 'Crit Chance +1% per Level.', type: 'GROWTH' },
        { name: 'RISK PROTOCOL', description: 'Score Multiplier +80%. Speed scales with Combo.', type: 'STATIC' }
    ],
    initialStats: {
      scoreMultiplier: 1.8,
      weapon: {
        cannonLevel: 0, // REMOVED: Auto-Cannon
        cannonDamage: 0,
        cannonFireRate: 0,
        cannonProjectileCount: 0,
        cannonProjectileSpeed: 0,
        auraLevel: 1, // DEFAULT WEAPON: Tail Aura
        auraRadius: 2.5,
        auraDamage: 15,
        nanoSwarmLevel: 0,
        nanoSwarmCount: 0,
        nanoSwarmDamage: 0,
        mineLevel: 0,
        mineDamage: 0,
        mineRadius: 0,
        mineDropRate: 0,
        chainLightningLevel: 0,
        chainLightningDamage: 0,
        chainLightningRange: 0,
        prismLanceLevel: 0,
        prismLanceDamage: 0,
        neonScatterLevel: 0,
        neonScatterDamage: 0,
        voltSerpentLevel: 0,
        voltSerpentDamage: 0,
        phaseRailLevel: 0,
        phaseRailDamage: 0,
        reflectorMeshLevel: 0,
        ghostCoilLevel: 0,
        neuralMagnetLevel: 0,
        overclockLevel: 0,
        echoCacheLevel: 0,
        luckLevel: 0
      }
    }
  }
];

export const GRID_COLS = CANVAS_WIDTH / DEFAULT_SETTINGS.gridSize;
export const GRID_ROWS = PLAY_ROWS; // Strictly Play Area Rows

export const FX_LIMITS = {particles: 150,};
export const MAGNET_RADIUS = 0.5;
export const XP_BASE_MAGNET_RADIUS = 4.0; // Base magnet for XP

export const COMBO_WINDOW = 5000;
export const ENEMY_SPAWN_INTERVAL = 2500;
export const ENEMY_MOVE_TICK = 320;
export const EMP_CHARGE_PER_FOOD = 9; 

export const XP_TO_LEVEL_UP = 200;
export const PASSIVE_SCORE_PER_SEC = 8;
export const POINTS_PER_STAGE = 10000;
export const TRANSITION_DURATION = 4000;
export const COMBO_DECAY_DURATION = 4000;


export const TERMINAL_SPAWN_CHANCE = 0.003; 
export const TERMINAL_HACK_RADIUS = 4.5; 
export const TERMINAL_HACK_TIME = 2500; 

export const ENEMY_BASE_HP = 35;
export const BOSS_BASE_HP = 1800;
//boss projectile speed
export const PROJECTILE_SPEED = 10;
export const SHOCKWAVE_SPEED = 1.6;
