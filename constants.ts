
import { CharacterProfile, Difficulty, DifficultyConfig, EnemyType, StageTheme } from './types';

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 960;
export const GRID_COLS = 60;
export const GRID_ROWS = 30;
export const DEFAULT_SETTINGS = {
    gridSize: 32,
    initialSpeed: 100, // ms per move
    unlockCheckInterval: 1000, // ms
    fxThrottleInterval: 16     // ms (~60 FPS)
};

export const MOVEMENT_CONSTANTS = {
    DASH_SPEED_MULT: 4.0,
    STRAFE_SPEED_MULT: 0.8,
    CHARGE_SPEED_MULT: 1.5,
    RETREAT_SPEED_MULT: 1.2,
    PATROL_SPEED_MULT: 0.5,
    APPROACH_SPEED_MULT: 1.0,
    REPOSITION_SPEED_MULT: 0.8
};

export const HUD_TOP_HEIGHT = 80;
export const HUD_BOTTOM_HEIGHT = 100;
export const PLAY_AREA_HEIGHT = CANVAS_HEIGHT - HUD_TOP_HEIGHT; // Overlay HUD

export const PHYSICS = {
    GRAVITY: 1500, // px/s^2
    MAX_FALL_SPEED: 800,
    JUMP_VELOCITY: -700
};

export const STAMINA_CONFIG = {
    MAX: 100,
    DRAIN_RATE: 25, // per second
    RECHARGE_RATE: 15,
    MIN_TO_REENGAGE: 20
};

export const PROJECTILE_PHYSICS = {
    GRAVITY_PER_FRAME: 0.5,
    MAX_FALL_SPEED_PER_FRAME: 15
};

export const AI_CONFIG = {
    GAP_PROBE_DISTANCE: 4
};

export const SPAWN_CONFIG = {
    spawnMargin: 2,
    spawnSafeRadius: 10,
    baseEnemySpawnInterval: 1500,  // Base interval (modified by difficulty)
    minEnemySpawnInterval: 400,    // Fastest possible spawn rate
    terminalSpawnInterval: 15000,
    xpOrbLifespan: 30000,
    xpOrbMargin: 2,
    foodOffset: 0.5,
    lootScatterDist: 3,
    bossSpawnY: 5,
    bossOverrideInterval: 8000,
    terminalOverrideTime: 5000,
    terminalMemoryTime: 8000,
    // Wave spawning for survivor feel
    waveSize: { min: 1, max: 3 },        // Enemies per spawn event
    waveScalePerStage: 0.1               // +10% wave size per stage
};

// Per-difficulty spawn interval multipliers (lower = faster spawns)
export const DIFFICULTY_SPAWN_RATES: Record<Difficulty, number> = {
    [Difficulty.EASY]: 1.3,      // Slower spawns
    [Difficulty.MEDIUM]: 1.0,    // Normal
    [Difficulty.HARD]: 0.75,     // Faster spawns
    [Difficulty.INSANE]: 0.5     // Much faster spawns
};

export const XP_CHUNK_THRESHOLDS = {
    MEDIUM: 50,
    LARGE: 200,
    HUGE: 500
};

export const XP_CHUNK_VALUES = {
    SMALL: 10,
    MEDIUM: 50,
    LARGE: 200,
    HUGE: 500
};

export const FALLBACK_SPAWN_POS = { x: 0, y: -5 };

export const NEOPHYTE_SPAWN_WEIGHTS: Record<string, number[]> = {
    'UP': [0, 1, 1, 1],
    'DOWN': [1, 1, 0, 1],
    'LEFT': [1, 1, 1, 0],
    'RIGHT': [1, 0, 1, 1]
};

export const BOSS_SPAWN_SHAKE = 20;
export const BASE_ENEMY_SPEED = 100; // px/s

export const POINTS_PER_STAGE = 2000;
export const TRANSITION_DURATION = 800;

export const SHOCKWAVE_SPEED = 10;
export const PROJECTILE_SPEED = 400;

export const FX_LIMITS = {
    particles: 200
};

export const MAGNET_RADIUS = 3;
export const XP_BASE_MAGNET_RADIUS = 3;

export const COLORS = {
    snakeHead: '#00ffff',
    foodNormal: '#00ff00',
    xpOrb: '#ffff00',
    wallBorder: '#004444',
    terminal: '#0088ff',
    enemyHunter: '#ff0000',
    enemyInterceptor: '#ff00ff',
    enemyShooter: '#00ff00',
    enemyDasher: '#ffaa00',
    projectile: '#ffff00',
    prismLance: '#00ffff',
    neonScatter: '#ff00ff',
    voltSerpent: '#0000ff',
    phaseRail: '#ffffff',
    nanoSwarm: '#00ffff',
    aura: '#ff0000',
    mine: '#ff8800',
    lightning: '#ffff00',
    shield: '#00ffff',
    damageText: '#ffffff',
    critText: '#ffff00',
    grid: '#333333'
};

export const ENEMY_BASE_HP = 100;
export const BOSS_BASE_HP = 2000;
export const TERMINAL_HACK_RADIUS = 3;
export const TERMINAL_HACK_TIME = 3000;

// Terminal hack time scaled by difficulty (multiplier applied to TERMINAL_HACK_TIME)
export const TERMINAL_TIME_BY_DIFFICULTY: Record<string, number> = {
    [Difficulty.EASY]: 0.5,      // 1.5 seconds
    [Difficulty.NORMAL]: 0.75,   // 2.25 seconds
    [Difficulty.HARD]: 1.0,      // 3 seconds
    [Difficulty.ELITE]: 1.25     // 3.75 seconds
};

export const ENEMY_PHYSICS_DEFAULTS: Record<string, any> = {
    [EnemyType.HUNTER]: { usesVerticalPhysics: false, canJump: false },
    [EnemyType.INTERCEPTOR]: { usesVerticalPhysics: false, canJump: false },
    [EnemyType.SHOOTER]: { usesVerticalPhysics: true, canJump: true, jumpCooldown: 2000 },
    [EnemyType.DASHER]: { usesVerticalPhysics: true, canJump: true, jumpCooldown: 1000 },
    [EnemyType.BOSS]: { usesVerticalPhysics: false, canJump: false }
};

export const XP_TO_LEVEL_UP = 100;
export const PASSIVE_SCORE_PER_SEC = 10;
export const COMBO_WINDOW = 3000;

export const RARITY_MULTIPLIERS: Record<string, number> = {
    'COMMON': 1.0,
    'UNCOMMON': 1.2,
    'RARE': 1.5,
    'ULTRA_RARE': 2.0,
    'MEGA_RARE': 3.0,
    'LEGENDARY': 5.0,
    'OVERCLOCKED': 10.0
};

// Base Stats (Level 1)
export const UPGRADE_BASES = {
    SCALAR_DAMAGE: 0.1,
    SCALAR_FIRE_RATE: 0.1,
    SCALAR_AREA: 0.1,
    CRIT_CHANCE: 0.05,
    CRIT_MULT: 0.5,
    FOOD_QUALITY: 0.2,
    HACK_SPEED: 0.2,
    LUCK: 0.05,
    SCORE_MULT: 0.1,
    MAX_WEAPON_SLOTS: 8,
    
    CANNON_DMG: 20,
    CANNON_FIRE_RATE: 500,
    AURA_DMG: 15,
    AURA_RADIUS: 2.5,
    MINE_DMG: 50,
    MINE_RATE: 5000,
    LIGHTNING_DMG: 0.5, // Ratio of parent damage
    LIGHTNING_RANGE: 8,
    NANO_DMG: 15,
    PRISM_DMG: 40,
    SCATTER_DMG: 15,
    SERPENT_DMG: 35,
    RAIL_DMG: 150
};

// Percentage Growth per Level (Base Rarity)
export const WEAPON_GROWTH_CONFIG = {
    CANNON: 0.15,      // 15% Damage growth
    AURA: 0.12,        // 12% Damage growth
    MINES: 0.20,       // 20% Damage growth
    LIGHTNING: 0.10,   // 10% Chain Dmg growth
    NANO_SWARM: 0.10,  // 10% Damage growth
    PRISM_LANCE: 0.15, // 15% Damage growth
    NEON_SCATTER: 0.15,// 15% Damage growth
    VOLT_SERPENT: 0.15,// 15% Damage growth
    PHASE_RAIL: 0.20   // 20% Damage growth
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    [Difficulty.EASY]: {
        id: Difficulty.EASY,
        label: 'NEOPHYTE',
        description: 'Predictable patterns. Ideal for initialization.',
        spawnRateMod: 1.3,
        hpMod: 0.7,
        speedMod: 0.85,
        xpMultiplier: 0.8,
        lootSpawnRate: 0.8,
        allowedEnemies: [EnemyType.HUNTER],
        bossHpMod: 0.6,
        unlockCondition: 'DEFAULT',
        stageGoal: 4,
        color: 'text-green-400',
        lootMagnetMod: 1.5,
        aiAggressionMod: 1.4  // Higher = slower/less aggressive AI
    },
    [Difficulty.MEDIUM]: {
        id: Difficulty.MEDIUM,
        label: 'OPERATOR',
        description: 'Aggressive drones. Interceptors deployed.',
        spawnRateMod: 1.0,
        hpMod: 1.0,
        speedMod: 1.0,
        xpMultiplier: 1.0,
        lootSpawnRate: 1.0,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR],
        bossHpMod: 1.0,
        unlockCondition: 'Clear Stage 4',
        stageGoal: 8,
        color: 'text-cyan-400',
        lootMagnetMod: 1.0,
        aiAggressionMod: 1.0  // Normal aggression
    },
    [Difficulty.HARD]: {
        id: Difficulty.HARD,
        label: 'VETERAN',
        description: 'High threat density. Tactical Shooters active.',
        spawnRateMod: 0.75,
        hpMod: 1.3,
        speedMod: 1.2,
        xpMultiplier: 1.3,
        lootSpawnRate: 1.2,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER],
        bossHpMod: 1.6,
        unlockCondition: 'Clear Stage 8',
        stageGoal: 12,
        color: 'text-orange-400',
        lootMagnetMod: 0.9,
        aiAggressionMod: 0.75  // Lower = faster/more aggressive AI
    },
    [Difficulty.INSANE]: {
        id: Difficulty.INSANE,
        label: 'CYBERPSYCHO',
        description: 'Maximum lethality. Chaotic Dashers inbound.',
        spawnRateMod: 0.5,
        hpMod: 1.8,
        speedMod: 1.4,
        xpMultiplier: 1.5,
        lootSpawnRate: 1.5,
        allowedEnemies: [EnemyType.HUNTER, EnemyType.INTERCEPTOR, EnemyType.SHOOTER, EnemyType.DASHER],
        bossHpMod: 2.5,
        unlockCondition: 'Clear Stage 12',
        stageGoal: 999,
        color: 'text-red-500',
        lootMagnetMod: 0.7,
        aiAggressionMod: 0.5   // Very aggressive AI
    }
};

// Stage-based enemy unlock thresholds WITHIN each difficulty
// These apply after the difficulty's allowedEnemies filter
export const STAGE_ENEMY_UNLOCKS: Record<EnemyType, number> = {
    [EnemyType.HUNTER]: 1,       // Always available
    [EnemyType.INTERCEPTOR]: 2,  // Stage 2+
    [EnemyType.SHOOTER]: 4,      // Stage 4+
    [EnemyType.DASHER]: 6,       // Stage 6+
    [EnemyType.BOSS]: 999
};

const BASE_WEAPON_STATS = {
    cannonLevel: 0, cannonFireRate: 500, cannonProjectileCount: 1, cannonProjectileSpeed: 15, cannonDamage: 20,
    auraLevel: 0, auraRadius: 0, auraDamage: 0,
    mineLevel: 0, mineDropRate: 0, mineDamage: 0, mineRadius: 0,
    chainLightningLevel: 0, chainLightningDamage: 0, chainLightningRange: 0,
    nanoSwarmLevel: 0, nanoSwarmCount: 0, nanoSwarmDamage: 0,
    prismLanceLevel: 0, prismLanceDamage: 0,
    neonScatterLevel: 0, neonScatterDamage: 0,
    voltSerpentLevel: 0, voltSerpentDamage: 0,
    phaseRailLevel: 0, phaseRailDamage: 0,
    reflectorMeshLevel: 0, ghostCoilLevel: 0, neuralMagnetLevel: 0,
    overclockLevel: 0, echoCacheLevel: 0, luckLevel: 0
};

export const CHARACTERS: CharacterProfile[] = [
    {
        id: 'striker',
        name: 'STRIKER',
        tag: 'ASSAULT',
        description: 'Kinetics specialist. Scales firing speed with system level.',
        color: '#00ffff',
        initialStats: {
            weapon: { ...BASE_WEAPON_STATS, cannonLevel: 1 },
        },
        traits: [
            { name: 'Accelerator', type: 'MINOR', description: '+20% Projectile Velocity' },
            { name: 'Escalation', type: 'MAJOR', description: '+1% Fire Rate per Level' }
        ]
    },
    {
        id: 'spectre',
        name: 'SPECTRE',
        tag: 'STEALTH',
        description: 'Evasive unit. Optimizes loot retrieval range over time.',
        color: '#d1fae5',
        initialStats: {
            weapon: { ...BASE_WEAPON_STATS, neonScatterLevel: 1 },
        },
        traits: [
            { name: 'Ghost Protocol', type: 'MINOR', description: '15% Evasion Chance' },
            { name: 'Data Siphon', type: 'MAJOR', description: '+2% Magnet Range per Level' }
        ]
    },
    {
        id: 'volt',
        name: 'VOLT',
        tag: 'ENERGY',
        description: 'Area denial specialist. Critical strike probability increases with sync level.',
        color: '#fef08a',
        initialStats: {
            weapon: {
                ...BASE_WEAPON_STATS,
                cannonLevel: 1,
                cannonDamage: 15,
                cannonFireRate: 600,
                chainLightningLevel: 1,
                chainLightningDamage: 0.5,  // UPGRADE_BASES.LIGHTNING_DMG
                chainLightningRange: 8      // UPGRADE_BASES.LIGHTNING_RANGE
            },
        },
        traits: [
            { name: 'Overcharge', type: 'MINOR', description: '+20% Area of Effect Size' },
            { name: 'High Voltage', type: 'MAJOR', description: '+0.5% Crit Chance per Level' }
        ]
    },
    {
        id: 'rigger',
        name: 'RIGGER',
        tag: 'ENGINEER',
        description: 'Fortification expert. Trap damage scales with system integration.',
        color: '#fdba74',
        initialStats: {
            weapon: {
                ...BASE_WEAPON_STATS,
                mineLevel: 1,
                mineDropRate: 3000,
                mineDamage: 50,    // UPGRADE_BASES.MINE_DMG
                mineRadius: 2.5
            },
        },
        traits: [
            { name: 'Payload', type: 'MINOR', description: '+30% Mine Duration' },
            { name: 'Optimized Explosives', type: 'MAJOR', description: '+1.5% Construct Damage per Level' }
        ]
    },
    {
        id: 'bulwark',
        name: 'BULWARK',
        tag: 'TANK',
        description: 'Armored hull. Self-repair subroutines enhance survivability.',
        color: '#3b82f6',
        initialStats: {
            weapon: {
                ...BASE_WEAPON_STATS,
                cannonLevel: 1,
                cannonDamage: 20,      // UPGRADE_BASES.CANNON_DMG
                cannonFireRate: 500    // UPGRADE_BASES.CANNON_FIRE_RATE
            },
            shieldActive: true
        },
        traits: [
            { name: 'Ironclad', type: 'MINOR', description: '-15% Incoming Damage' },
            { name: 'Nanite Repair', type: 'MAJOR', description: '+0.2 Hull Regen / Sec per Level' }
        ]
    },
    {
        id: 'overdrive',
        name: 'OVERDRIVE',
        tag: 'SPEED',
        description: 'Unstable engine. Damage output scales with combo momentum.',
        color: '#f472b6',
        initialStats: {
            weapon: {
                ...BASE_WEAPON_STATS,
                auraLevel: 1,
                auraDamage: 15,    // UPGRADE_BASES.AURA_DMG
                auraRadius: 2.5   // UPGRADE_BASES.AURA_RADIUS
            },
        },
        traits: [
            { name: 'Afterburner', type: 'MINOR', description: '+10% Base Movement Speed' },
            { name: 'Momentum', type: 'MAJOR', description: '+1% Damage per Combo Point' }
        ]
    }
];

export const STAGE_THEMES: Record<number, StageTheme> = {
    1: { background: '#000', grid: '#333', wall: '#444' },
    2: { background: '#001', grid: '#334', wall: '#445' },
    3: { background: '#010', grid: '#343', wall: '#454' },
    4: { background: '#100', grid: '#433', wall: '#544' }
};

export const STAGE_NAMES = [
    "NEON SLUMS", "DATA HIVE", "SILICON DUMP", "GRID CORE", "FIREWALL DELTA",
    "CYBER VOID", "SYNTH GARDEN", "MECH FACTORY", "NULL SECTOR", "QUANTUM REALM",
    "DEEP NET", "ADMIN BLOCK", "SHADOW ZONE", "ZERO DAY", "OVERRIDE GATE",
    "SYSTEM KERNEL", "MEMORY VAULT", "LOGIC GATE", "ERROR DISTRICT", "OMEGA POINT"
];
