import { Difficulty, EnemyType } from './types';
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const DEFAULT_SETTINGS = {
    gridSize: 20,
    initialSpeed: 100,
    volume: 0.3
};
// Ability Configs
export const ABILITIES = {
    CHRONO: {
        COOLDOWN: 15000,
        DURATION: 4000,
        RADIUS: 12 // Grid units
    },
    PING: {
        COOLDOWN: 2000,
        RADIUS: 6, // Grid units
        KICKBACK: 3.5, // Grid units of push force
        DAMAGE: 25
    },
    SYSTEM_SHOCK: {
        COOLDOWN: 8000,
        RADIUS: 8, // Base radius, adds to weapon stats
        DURATION: 2000
    }
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
    xpOrb: '#00ffff', // NEW
    text: '#ffffff',
    uiPanel: 'rgba(10, 20, 30, 0.85)',
    hpBarBg: '#330000',
    hpBarFill: '#ff0000',
    shield: '#00ffff',
    aura: 'rgba(255, 50, 50, 0.3)',
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
export const DIFFICULTY_CONFIGS = {
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
export const STAGE_THEMES = {
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
export const CHARACTERS = [
    {
        id: 'striker',
        name: 'STRIKER',
        description: 'HEAVY GUNNER. High fire rate and projectile count.',
        color: '#ffdd00',
        tag: 'STABLE',
        payoff: 'Win by firepower.',
        initialStats: {
            weapon: {
                cannonLevel: 3,
                cannonDamage: 18,
                cannonFireRate: 900,
                cannonProjectileCount: 1,
                cannonProjectileSpeed: 20,
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
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
                shockwaveLevel: 0,
                shockwaveRadius: 0,
                shockwaveDamage: 0,
                nanoSwarmLevel: 1,
                nanoSwarmCount: 2,
                nanoSwarmDamage: 15,
                mineLevel: 1,
                mineDamage: 45,
                mineRadius: 3.5,
                mineDropRate: 2500,
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
            }
        }
    },
    {
        id: 'bulwark',
        name: 'BULWARK',
        description: 'TANK. High endurance. Rapid System Shock cycling.',
        color: '#0088ff',
        tag: 'STABLE',
        payoff: 'Win by endurance.',
        initialStats: {
            shieldActive: true,
            empCooldownMod: 0.6,
            weapon: {
                cannonLevel: 1,
                cannonDamage: 10,
                cannonFireRate: 1600,
                cannonProjectileCount: 1,
                cannonProjectileSpeed: 15,
                auraLevel: 0,
                auraRadius: 0,
                auraDamage: 0,
                shockwaveLevel: 2,
                shockwaveRadius: 12,
                shockwaveDamage: 90,
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
            }
        }
    },
    {
        id: 'overdrive',
        name: 'OVERDRIVE',
        description: 'BERSERKER. Lethal proximity aura. High-risk score output.',
        color: '#ff0044',
        tag: 'VOLATILE',
        payoff: 'Win by speed.',
        initialStats: {
            scoreMultiplier: 1.8,
            weapon: {
                cannonLevel: 0,
                cannonDamage: 0,
                cannonFireRate: 0,
                cannonProjectileCount: 0,
                cannonProjectileSpeed: 0,
                auraLevel: 2,
                auraRadius: 2.5,
                auraDamage: 18,
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
                empBloomLevel: 0,
                neuralMagnetLevel: 0,
                overclockLevel: 0,
                echoCacheLevel: 0
            }
        }
    }
];
export const GRID_COLS = CANVAS_WIDTH / DEFAULT_SETTINGS.gridSize;
export const GRID_ROWS = CANVAS_HEIGHT / DEFAULT_SETTINGS.gridSize;
export const CHANCE_BONUS = 6;
export const CHANCE_POISON = 4;
export const CHANCE_SLOW = 3;
export const CHANCE_MAGNET = 3;
export const CHANCE_COMPRESSOR = 4;
export const FX_LIMITS = { particles: 150, };
export const DURATION_SLOW = 5000;
export const DURATION_MAGNET = 5000;
export const MAGNET_RADIUS = 0.5;
export const XP_BASE_MAGNET_RADIUS = 4.0; // Base magnet for XP
export const COMBO_WINDOW = 5000;
export const ENEMY_SPAWN_INTERVAL = 2500;
export const ENEMY_MOVE_TICK = 320;
export const EMP_CHARGE_PER_FOOD = 9;
export const XP_TO_LEVEL_UP = 500;
export const PASSIVE_SCORE_PER_SEC = 8;
export const POINTS_PER_STAGE = 10000;
export const TRANSITION_DURATION = 4000;
export const COMBO_DECAY_DURATION = 4000;
export const TERMINAL_SPAWN_CHANCE = 0.003;
export const TERMINAL_HACK_RADIUS = 4.5;
export const TERMINAL_HACK_TIME = 2500;
export const ENEMY_BASE_HP = 35;
export const BOSS_BASE_HP = 1800;
export const PROJECTILE_SPEED = 18;
export const SHOCKWAVE_SPEED = 1.6;
