/**
 * Simulation Type Definitions
 * All types here are structured-clone-safe for Worker communication.
 * NO functions, class instances, DOM refs, or React imports allowed.
 */

import {
    Direction,
    GameStatus,
    Point,
    Enemy,
    FoodItem,
    Projectile,
    Mine,
    Terminal,
    Shockwave,
    LightningArc,
    Particle,
    FloatingText,
    Hitbox,
    UpgradeStats,
    CharacterProfile,
    CameraMode,
    Difficulty,
    WeaponStats
} from '../../types';

// ═══════════════════════════════════════════════════════════════
// INPUT SNAPSHOT (Main Thread → Simulation)
// Structured-clone-safe. No functions, no DOM refs.
// ═══════════════════════════════════════════════════════════════

export interface InputSnapshot {
    /** Desired movement direction, null if no input */
    direction: Direction | null;
    /** Jump button pressed this frame */
    jumpIntent: boolean;
    /** Brake/slow button held */
    brakeIntent: boolean;
    /** Frame timestamp from main thread (for debugging only) */
    frameTime: number;
}

export function createEmptyInput(): InputSnapshot {
    return {
        direction: null,
        jumpIntent: false,
        brakeIntent: false,
        frameTime: 0
    };
}

// ═══════════════════════════════════════════════════════════════
// PHYSICS STATE
// ═══════════════════════════════════════════════════════════════

export interface PhysicsState {
    vy: number;
    isGrounded: boolean;
    isBraking: boolean;
}

export function createDefaultPhysics(): PhysicsState {
    return {
        vy: 0,
        isGrounded: true,
        isBraking: false
    };
}

// ═══════════════════════════════════════════════════════════════
// PLAYER STATE
// ═══════════════════════════════════════════════════════════════

export interface PlayerState {
    segments: Point[];
    direction: Direction;
    pendingDirection: Direction | null;
    speed: number;
    moveTimer: number;
    physics: PhysicsState;
    stats: UpgradeStats;
    stamina: number;
    maxStamina: number;
    tailIntegrity: number;
    invincibleTimer: number;
    level: number;
    xp: number;
    xpToNext: number;
}

// ═══════════════════════════════════════════════════════════════
// ENTITY COLLECTIONS
// ═══════════════════════════════════════════════════════════════

export interface EntityState {
    enemies: Enemy[];
    food: FoodItem[];
    projectiles: Projectile[];
    mines: Mine[];
    terminals: Terminal[];
    hitboxes: Hitbox[];
    walls: Point[];

    // VFX (simulation-owned for physics, render layer copies)
    shockwaves: Shockwave[];
    lightningArcs: LightningArc[];
    particles: Particle[];
    floatingTexts: FloatingText[];

    // Boss tracking
    bossActive: boolean;
    bossDefeated: boolean;

    // Spawn timers
    enemySpawnTimer: number;
    terminalSpawnTimer: number;
}

export function createEmptyEntities(): EntityState {
    return {
        enemies: [],
        food: [],
        projectiles: [],
        mines: [],
        terminals: [],
        hitboxes: [],
        walls: [],
        shockwaves: [],
        lightningArcs: [],
        particles: [],
        floatingTexts: [],
        bossActive: false,
        bossDefeated: false,
        enemySpawnTimer: 0,
        terminalSpawnTimer: 0
    };
}

// ═══════════════════════════════════════════════════════════════
// SESSION STATE
// ═══════════════════════════════════════════════════════════════

export interface SessionState {
    score: number;
    stageScore: number;
    stage: number;
    combo: number;
    maxCombo: number;
    enemiesKilled: number;
    terminalsHacked: number;
    runId: number;
    difficulty: Difficulty;
}

export function createDefaultSession(): SessionState {
    return {
        score: 0,
        stageScore: 0,
        stage: 1,
        combo: 0,
        maxCombo: 0,
        enemiesKilled: 0,
        terminalsHacked: 0,
        runId: 0,
        difficulty: 'MEDIUM' as Difficulty
    };
}

// ═══════════════════════════════════════════════════════════════
// CAMERA STATE
// ═══════════════════════════════════════════════════════════════

export interface CameraState {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    mode: CameraMode;
    zoom: number;
    shake: number;
    floor: number;
}

export function createDefaultCamera(): CameraState {
    return {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        mode: CameraMode.TOP_DOWN,
        zoom: 1,
        shake: 0,
        floor: 0
    };
}

// ═══════════════════════════════════════════════════════════════
// WORLD STATE (Complete Simulation State)
// ═══════════════════════════════════════════════════════════════

export interface WorldState {
    /** Simulation time in milliseconds (accumulated from dt) */
    gameTime: number;
    /** Current game status */
    status: GameStatus;
    /** Modal overlay state */
    modalState: 'NONE' | 'PAUSE' | 'SETTINGS';

    player: PlayerState;
    entities: EntityState;
    session: SessionState;
    camera: CameraState;

    // Pending status change (for transitions)
    pendingStatus: GameStatus | null;

    // Death/transition timers
    deathTimer: number;
    transitionStartTime: number;

    // Stage progression
    stageArmed: boolean;
    stageReady: boolean;
    stageReadyTime: number;

    // Weapon timers
    cannonCooldown: number;
    mineCooldown: number;
    auraCooldown: number;
    chainLightningCooldown: number;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION EVENTS (Output signals for audio/VFX)
// ═══════════════════════════════════════════════════════════════

export type SimulationEventType =
    | 'SCORE_CHANGED'
    | 'COMBO_CHANGED'
    | 'LEVEL_UP'
    | 'ENEMY_KILLED'
    | 'PLAYER_HIT'
    | 'PLAYER_DIED'
    | 'FOOD_EATEN'
    | 'TERMINAL_HACKED'
    | 'STAGE_COMPLETE'
    | 'PROJECTILE_FIRED'
    | 'EXPLOSION'
    | 'SHIELD_HIT';

export interface SimulationEvent {
    type: SimulationEventType;
    data?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION SNAPSHOT (Read-only output to main thread)
// ═══════════════════════════════════════════════════════════════

export interface SimulationSnapshot {
    readonly gameTime: number;
    readonly status: GameStatus;
    readonly modalState: 'NONE' | 'PAUSE' | 'SETTINGS';

    readonly player: Readonly<PlayerState>;
    readonly entities: Readonly<EntityState>;
    readonly session: Readonly<SessionState>;
    readonly camera: Readonly<CameraState>;

    /** Events emitted this frame (audio cues, VFX triggers) */
    readonly events: readonly SimulationEvent[];
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION CONFIG (Initialization parameters)
// ═══════════════════════════════════════════════════════════════

export interface SimulationConfig {
    gridWidth: number;
    gridHeight: number;
    difficulty: Difficulty;
    cameraMode: CameraMode;
}

export function createDefaultConfig(): SimulationConfig {
    return {
        gridWidth: 60,
        gridHeight: 40,
        difficulty: 'MEDIUM' as Difficulty,
        cameraMode: CameraMode.TOP_DOWN
    };
}

// ═══════════════════════════════════════════════════════════════
// GAME OVER STATS (Final stats for game over screen)
// ═══════════════════════════════════════════════════════════════

export interface GameOverStats {
    finalScore: number;
    stage: number;
    maxCombo: number;
    enemiesKilled: number;
    terminalsHacked: number;
    survivalTime: number;
    level: number;
    cause: string;
}
