/**
 * BinarySnapshot
 * 
 * Zero-copy SharedArrayBuffer memory layout for simulation state transfer.
 * Enables 144Hz+ rendering without postMessage overhead.
 * 
 * Architecture:
 * - Worker writes to SharedArrayBuffer via BinarySnapshotWriter
 * - Main thread reads via BinarySnapshotReader (no allocation)
 * - Double-buffering with atomic flip for tear-free reads
 */

import {
    Direction,
    GameStatus,
    EnemyType,
    FoodType,
    CameraMode,
    Difficulty
} from '../../types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS - Memory Layout Configuration
// ═══════════════════════════════════════════════════════════════

/** Schema version for compatibility checking */
export const SNAPSHOT_VERSION = 1;

/** Entity capacity limits (fixed at compile time) */
export const ENTITY_LIMITS = {
    MAX_SEGMENTS: 256,
    MAX_ENEMIES: 128,
    MAX_FOOD: 64,
    MAX_PROJECTILES: 512,
    MAX_MINES: 32,
    MAX_TERMINALS: 16,
    MAX_SHOCKWAVES: 32,
    MAX_LIGHTNING_ARCS: 64,
    MAX_PARTICLES: 256,
    MAX_FLOATING_TEXTS: 64,
    MAX_HITBOXES: 64,
    MAX_EVENTS: 32,
    MAX_WALLS: 256
} as const;

/** Bytes per entity type */
const ENTITY_SIZES = {
    SEGMENT: 8,           // x: f32, y: f32
    ENEMY: 128,           // Full enemy state
    FOOD: 24,             // id, x, y, type, value, lifespan
    PROJECTILE: 48,       // Full projectile state
    MINE: 32,             // id, x, y, damage, radius, triggerRadius, createdAt
    TERMINAL: 48,         // Full terminal state
    SHOCKWAVE: 32,        // id, x, y, currentRadius, maxRadius, damage, opacity
    LIGHTNING_ARC: 32,    // id, x1, y1, x2, y2, color, life
    PARTICLE: 24,         // x, y, vx, vy, color, life
    FLOATING_TEXT: 32,    // id, x, y, vy, color, size, life, textOffset
    HITBOX: 32,           // id, ownerId, x, y, width, height, damage, color
    EVENT: 16,            // type, dataA, dataB, dataC
    WALL: 8               // x: f32, y: f32
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION OFFSETS - Memory Layout Map
// ═══════════════════════════════════════════════════════════════

/** 
 * Byte offsets for each section in the snapshot buffer.
 * Total size: ~56KB per buffer
 */
export const SECTION_OFFSETS = {
    // Header: 64 bytes
    HEADER: 0,

    // Player state: 512 bytes (inline segments for first 64)
    PLAYER: 64,

    // Extended segments: 2KB (segments 64-255)
    SEGMENTS_EXTENDED: 576,

    // Session state: 64 bytes
    SESSION: 2624,

    // Camera state: 64 bytes
    CAMERA: 2688,

    // Entities (variable counts, fixed max allocation)
    ENEMIES: 2752,                                                    // 128 × 128 = 16KB
    FOOD: 2752 + (ENTITY_LIMITS.MAX_ENEMIES * ENTITY_SIZES.ENEMY),   // 64 × 24 = 1.5KB
    PROJECTILES: 0, // Calculated below
    MINES: 0,
    TERMINALS: 0,
    SHOCKWAVES: 0,
    LIGHTNING_ARCS: 0,
    PARTICLES: 0,
    FLOATING_TEXTS: 0,
    HITBOXES: 0,
    WALLS: 0,

    // Event queue: 1KB
    EVENTS: 0,

    // String table: 4KB
    STRING_TABLE: 0,

    // Total buffer size
    TOTAL: 0
} as const;

// Calculate offsets dynamically
(() => {
    let offset = SECTION_OFFSETS.FOOD + (ENTITY_LIMITS.MAX_FOOD * ENTITY_SIZES.FOOD);

    (SECTION_OFFSETS as any).PROJECTILES = offset;
    offset += ENTITY_LIMITS.MAX_PROJECTILES * ENTITY_SIZES.PROJECTILE;

    (SECTION_OFFSETS as any).MINES = offset;
    offset += ENTITY_LIMITS.MAX_MINES * ENTITY_SIZES.MINE;

    (SECTION_OFFSETS as any).TERMINALS = offset;
    offset += ENTITY_LIMITS.MAX_TERMINALS * ENTITY_SIZES.TERMINAL;

    (SECTION_OFFSETS as any).SHOCKWAVES = offset;
    offset += ENTITY_LIMITS.MAX_SHOCKWAVES * ENTITY_SIZES.SHOCKWAVE;

    (SECTION_OFFSETS as any).LIGHTNING_ARCS = offset;
    offset += ENTITY_LIMITS.MAX_LIGHTNING_ARCS * ENTITY_SIZES.LIGHTNING_ARC;

    (SECTION_OFFSETS as any).PARTICLES = offset;
    offset += ENTITY_LIMITS.MAX_PARTICLES * ENTITY_SIZES.PARTICLE;

    (SECTION_OFFSETS as any).FLOATING_TEXTS = offset;
    offset += ENTITY_LIMITS.MAX_FLOATING_TEXTS * ENTITY_SIZES.FLOATING_TEXT;

    (SECTION_OFFSETS as any).HITBOXES = offset;
    offset += ENTITY_LIMITS.MAX_HITBOXES * ENTITY_SIZES.HITBOX;

    (SECTION_OFFSETS as any).WALLS = offset;
    offset += ENTITY_LIMITS.MAX_WALLS * ENTITY_SIZES.WALL;

    (SECTION_OFFSETS as any).EVENTS = offset;
    offset += 4 + (ENTITY_LIMITS.MAX_EVENTS * ENTITY_SIZES.EVENT); // count + events

    (SECTION_OFFSETS as any).STRING_TABLE = offset;
    offset += 4096; // 4KB string table

    (SECTION_OFFSETS as any).TOTAL = offset;
})();

// ═══════════════════════════════════════════════════════════════
// CONTROL BUFFER LAYOUT
// ═══════════════════════════════════════════════════════════════

/** Control buffer offsets (32 bytes) */
export const CONTROL_OFFSETS = {
    ACTIVE_BUFFER: 0,      // u32: which buffer is ready (0 or 1)
    WORKER_FRAME: 4,       // u32: last written frame counter
    MAIN_FRAME: 8,         // u32: last read frame counter
    PAUSE_FLAG: 12,        // u32: 1 = paused
    DISPOSE_FLAG: 16,      // u32: 1 = dispose requested
    RESERVED: 20           // 12 bytes reserved
} as const;

export const CONTROL_BUFFER_SIZE = 32;

// ═══════════════════════════════════════════════════════════════
// HEADER FIELD OFFSETS
// ═══════════════════════════════════════════════════════════════

const HEADER = {
    VERSION: 0,           // u32
    FRAME_ID: 4,          // u32
    GAME_TIME: 8,         // f64
    STATUS: 16,           // u32
    MODAL_STATE: 20,      // u32
    RESERVED: 24,         // 8 bytes
    // Entity counts (32-63)
    COUNT_ENEMIES: 32,
    COUNT_FOOD: 36,
    COUNT_PROJECTILES: 40,
    COUNT_MINES: 44,
    COUNT_TERMINALS: 48,
    COUNT_SHOCKWAVES: 52,
    COUNT_ARCS: 56,
    COUNT_PARTICLES: 60
} as const;

// Extended counts in second header region (position slightly adjusted)
const HEADER_EXT = {
    COUNT_FLOATING_TEXTS: 0,  // Stored at PLAYER - 16
    COUNT_HITBOXES: 4,
    COUNT_WALLS: 8,
    COUNT_SEGMENTS: 12
} as const;

// ═══════════════════════════════════════════════════════════════
// PLAYER FIELD OFFSETS (relative to PLAYER section)
// ═══════════════════════════════════════════════════════════════

const PLAYER = {
    DIRECTION: 0,           // u8
    PENDING_DIR: 1,         // u8 (255 = null)
    FLAGS: 2,               // u16
    SPEED: 4,               // f32
    MOVE_TIMER: 8,          // f32
    // Physics (12-23)
    PHYSICS_VY: 12,         // f32
    PHYSICS_GROUNDED: 16,   // u8
    PHYSICS_BRAKING: 17,    // u8
    // Stats (18-145) - 128 bytes for WeaponStats + modifiers
    STAMINA: 148,           // f32
    MAX_STAMINA: 152,       // f32
    TAIL_INTEGRITY: 156,    // f32
    INVINCIBLE_TIMER: 160,  // f32
    LEVEL: 164,             // u32
    XP: 168,                // u32
    XP_TO_NEXT: 172,        // u32
    SEGMENT_COUNT: 176,     // u32
    // Inline segments (180-436): 64 segments × 8 bytes
    SEGMENTS_INLINE: 180
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════

/** Packed color as RGBA u32 */
export function packColor(color: string): number {
    // Handle hex colors (#RRGGBB or #RGB)
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return (r << 24) | (g << 16) | (b << 8) | 0xFF;
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 0xFF;
        return (r << 24) | (g << 16) | (b << 8) | a;
    }
    // Default to white
    return 0xFFFFFFFF;
}

/** Unpack u32 to CSS color string */
export function unpackColor(packed: number): string {
    const r = (packed >>> 24) & 0xFF;
    const g = (packed >>> 16) & 0xFF;
    const b = (packed >>> 8) & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Hash string ID to u32 for comparison */
export function hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash >>> 0; // Unsigned
}

/** Direction enum to u8 */
export function directionToU8(dir: Direction): number {
    switch (dir) {
        case Direction.UP: return 0;
        case Direction.DOWN: return 1;
        case Direction.LEFT: return 2;
        case Direction.RIGHT: return 3;
        default: return 0;
    }
}

/** u8 to Direction enum */
export function u8ToDirection(val: number): Direction {
    switch (val) {
        case 0: return Direction.UP;
        case 1: return Direction.DOWN;
        case 2: return Direction.LEFT;
        case 3: return Direction.RIGHT;
        default: return Direction.RIGHT;
    }
}

/** GameStatus enum to u32 */
export function statusToU32(status: GameStatus): number {
    const statusMap: Record<GameStatus, number> = {
        [GameStatus.IDLE]: 0,
        [GameStatus.PLAYING]: 1,
        [GameStatus.PAUSED]: 2,
        [GameStatus.DYING]: 3,
        [GameStatus.GAME_OVER]: 4,
        [GameStatus.STAGE_TRANSITION]: 5,
        [GameStatus.LEVEL_UP]: 6,
        [GameStatus.ARCHIVE]: 7,
        [GameStatus.COSMETICS]: 8,
        [GameStatus.CONFIGURATION]: 9,
        [GameStatus.CHARACTER_SELECT]: 10,
        [GameStatus.DIFFICULTY_SELECT]: 11,
        [GameStatus.RESUMING]: 12,
        [GameStatus.READY]: 13,
        [GameStatus.CAMERA_EDIT]: 14,
        [GameStatus.VICTORY]: 15
    };
    return statusMap[status] ?? 0;
}

/** u32 to GameStatus enum */
export function u32ToStatus(val: number): GameStatus {
    const statuses = [
        GameStatus.IDLE,
        GameStatus.PLAYING,
        GameStatus.PAUSED,
        GameStatus.DYING,
        GameStatus.GAME_OVER,
        GameStatus.STAGE_TRANSITION,
        GameStatus.LEVEL_UP,
        GameStatus.ARCHIVE,
        GameStatus.COSMETICS,
        GameStatus.CONFIGURATION,
        GameStatus.CHARACTER_SELECT,
        GameStatus.DIFFICULTY_SELECT,
        GameStatus.RESUMING,
        GameStatus.READY,
        GameStatus.CAMERA_EDIT,
        GameStatus.VICTORY
    ];
    return statuses[val] ?? GameStatus.IDLE;
}

// ═══════════════════════════════════════════════════════════════
// BINARY SNAPSHOT WRITER (Worker-side)
// ═══════════════════════════════════════════════════════════════

/**
 * Writes simulation state to a SharedArrayBuffer with fixed-layout binary format.
 * Used by the simulation worker to publish state without postMessage overhead.
 */
export class BinarySnapshotWriter {
    private buffer: SharedArrayBuffer;
    private u8: Uint8Array;
    private u32: Uint32Array;
    private f32: Float32Array;
    private f64: Float64Array;
    private frameId: number = 0;
    private stringTableOffset: number = 0;

    constructor(buffer: SharedArrayBuffer) {
        this.buffer = buffer;
        this.u8 = new Uint8Array(buffer);
        this.u32 = new Uint32Array(buffer);
        this.f32 = new Float32Array(buffer);
        this.f64 = new Float64Array(buffer);
    }

    /** Begin writing a new frame */
    beginFrame(): void {
        this.frameId++;
        this.stringTableOffset = 0;

        // Write header
        this.u32[HEADER.VERSION / 4] = SNAPSHOT_VERSION;
        this.u32[HEADER.FRAME_ID / 4] = this.frameId;
    }

    /** Write header fields */
    writeHeader(gameTime: number, status: GameStatus, modalState: number): void {
        this.f64[HEADER.GAME_TIME / 8] = gameTime;
        this.u32[HEADER.STATUS / 4] = statusToU32(status);
        this.u32[HEADER.MODAL_STATE / 4] = modalState;
    }

    /** Write player state */
    writePlayer(
        direction: Direction,
        pendingDirection: Direction | null,
        speed: number,
        moveTimer: number,
        physicsVy: number,
        isGrounded: boolean,
        isBraking: boolean,
        stamina: number,
        maxStamina: number,
        tailIntegrity: number,
        invincibleTimer: number,
        level: number,
        xp: number,
        xpToNext: number,
        segments: { x: number; y: number }[]
    ): void {
        const base = SECTION_OFFSETS.PLAYER;

        this.u8[base + PLAYER.DIRECTION] = directionToU8(direction);
        this.u8[base + PLAYER.PENDING_DIR] = pendingDirection !== null
            ? directionToU8(pendingDirection)
            : 255;

        this.f32[(base + PLAYER.SPEED) / 4] = speed;
        this.f32[(base + PLAYER.MOVE_TIMER) / 4] = moveTimer;
        this.f32[(base + PLAYER.PHYSICS_VY) / 4] = physicsVy;
        this.u8[base + PLAYER.PHYSICS_GROUNDED] = isGrounded ? 1 : 0;
        this.u8[base + PLAYER.PHYSICS_BRAKING] = isBraking ? 1 : 0;
        this.f32[(base + PLAYER.STAMINA) / 4] = stamina;
        this.f32[(base + PLAYER.MAX_STAMINA) / 4] = maxStamina;
        this.f32[(base + PLAYER.TAIL_INTEGRITY) / 4] = tailIntegrity;
        this.f32[(base + PLAYER.INVINCIBLE_TIMER) / 4] = invincibleTimer;
        this.u32[(base + PLAYER.LEVEL) / 4] = level;
        this.u32[(base + PLAYER.XP) / 4] = xp;
        this.u32[(base + PLAYER.XP_TO_NEXT) / 4] = xpToNext;

        // Write segments
        const segmentCount = Math.min(segments.length, ENTITY_LIMITS.MAX_SEGMENTS);
        this.u32[(base + PLAYER.SEGMENT_COUNT) / 4] = segmentCount;

        // Inline segments (first 64)
        const inlineCount = Math.min(segmentCount, 64);
        for (let i = 0; i < inlineCount; i++) {
            const segBase = (base + PLAYER.SEGMENTS_INLINE + i * ENTITY_SIZES.SEGMENT) / 4;
            this.f32[segBase] = segments[i].x;
            this.f32[segBase + 1] = segments[i].y;
        }

        // Extended segments (64-255)
        if (segmentCount > 64) {
            for (let i = 64; i < segmentCount; i++) {
                const segBase = (SECTION_OFFSETS.SEGMENTS_EXTENDED + (i - 64) * ENTITY_SIZES.SEGMENT) / 4;
                this.f32[segBase] = segments[i].x;
                this.f32[segBase + 1] = segments[i].y;
            }
        }
    }

    /** Write session state */
    writeSession(
        score: number,
        stageScore: number,
        stage: number,
        combo: number,
        maxCombo: number,
        enemiesKilled: number,
        terminalsHacked: number,
        runId: number,
        difficulty: number
    ): void {
        const base = SECTION_OFFSETS.SESSION / 4;
        this.u32[base] = score;
        this.u32[base + 1] = stageScore;
        this.u32[base + 2] = stage;
        this.u32[base + 3] = combo;
        this.u32[base + 4] = maxCombo;
        this.u32[base + 5] = enemiesKilled;
        this.u32[base + 6] = terminalsHacked;
        this.u32[base + 7] = runId;
        this.u32[base + 8] = difficulty;
    }

    /** Write camera state */
    writeCamera(
        x: number,
        y: number,
        targetX: number,
        targetY: number,
        mode: CameraMode,
        zoom: number,
        shake: number,
        floor: number
    ): void {
        const base = SECTION_OFFSETS.CAMERA / 4;
        this.f32[base] = x;
        this.f32[base + 1] = y;
        this.f32[base + 2] = targetX;
        this.f32[base + 3] = targetY;
        this.u32[base + 4] = mode === CameraMode.TOP_DOWN ? 0 : 1;
        this.f32[base + 5] = zoom;
        this.f32[base + 6] = shake;
        this.u32[base + 7] = floor;
    }

    /** Write entity count to header */
    writeEntityCount(type: 'enemies' | 'food' | 'projectiles' | 'mines' | 'terminals' | 'shockwaves' | 'arcs' | 'particles', count: number): void {
        const offsets: Record<string, number> = {
            enemies: HEADER.COUNT_ENEMIES,
            food: HEADER.COUNT_FOOD,
            projectiles: HEADER.COUNT_PROJECTILES,
            mines: HEADER.COUNT_MINES,
            terminals: HEADER.COUNT_TERMINALS,
            shockwaves: HEADER.COUNT_SHOCKWAVES,
            arcs: HEADER.COUNT_ARCS,
            particles: HEADER.COUNT_PARTICLES
        };
        this.u32[offsets[type] / 4] = count;
    }

    /** Write an enemy to the buffer */
    writeEnemy(
        index: number,
        id: string,
        x: number,
        y: number,
        type: EnemyType,
        state: number,
        hp: number,
        maxHp: number,
        vx: number,
        vy: number,
        speed: number,
        isGrounded: boolean,
        stunTimer: number,
        flash: number
    ): void {
        if (index >= ENTITY_LIMITS.MAX_ENEMIES) return;

        const base = SECTION_OFFSETS.ENEMIES + index * ENTITY_SIZES.ENEMY;

        this.u32[base / 4] = hashId(id);
        this.f32[(base + 4) / 4] = x;
        this.f32[(base + 8) / 4] = y;

        // Pack type and state into bytes
        const typeMap: Record<EnemyType, number> = {
            [EnemyType.HUNTER]: 0,
            [EnemyType.INTERCEPTOR]: 1,
            [EnemyType.SHOOTER]: 2,
            [EnemyType.DASHER]: 3,
            [EnemyType.BOSS]: 4
        };
        this.u8[base + 12] = typeMap[type] ?? 0;
        this.u8[base + 13] = state;

        this.u32[(base + 16) / 4] = hp;
        this.u32[(base + 20) / 4] = maxHp;
        this.f32[(base + 24) / 4] = vx;
        this.f32[(base + 28) / 4] = vy;
        this.f32[(base + 32) / 4] = speed;
        this.u8[base + 36] = isGrounded ? 1 : 0;
        this.f32[(base + 40) / 4] = stunTimer;
        this.f32[(base + 44) / 4] = flash;
    }

    /** Write a projectile to the buffer */
    writeProjectile(
        index: number,
        id: string,
        x: number,
        y: number,
        vx: number,
        vy: number,
        damage: number,
        size: number,
        type: number,
        owner: number,
        age: number,
        life: number
    ): void {
        if (index >= ENTITY_LIMITS.MAX_PROJECTILES) return;

        const base = SECTION_OFFSETS.PROJECTILES + index * ENTITY_SIZES.PROJECTILE;

        this.u32[base / 4] = hashId(id);
        this.f32[(base + 4) / 4] = x;
        this.f32[(base + 8) / 4] = y;
        this.f32[(base + 12) / 4] = vx;
        this.f32[(base + 16) / 4] = vy;
        this.f32[(base + 20) / 4] = damage;
        this.f32[(base + 24) / 4] = size;
        this.u8[base + 28] = type;
        this.u8[base + 29] = owner;
        this.f32[(base + 32) / 4] = age;
        this.f32[(base + 36) / 4] = life;
    }

    /** Write a food item to the buffer */
    writeFood(
        index: number,
        id: string,
        x: number,
        y: number,
        type: FoodType,
        value: number,
        lifespan: number,
        createdAt: number
    ): void {
        if (index >= ENTITY_LIMITS.MAX_FOOD) return;

        const base = SECTION_OFFSETS.FOOD + index * ENTITY_SIZES.FOOD;

        this.u32[base / 4] = hashId(id);
        this.f32[(base + 4) / 4] = x;
        this.f32[(base + 8) / 4] = y;
        this.u8[base + 12] = type === FoodType.NORMAL ? 0 : 1;
        this.u8[base + 13] = value;
        this.u32[(base + 16) / 4] = lifespan;
        this.f32[(base + 20) / 4] = createdAt;
    }

    /** Write a particle to the buffer */
    writeParticle(
        index: number,
        x: number,
        y: number,
        vx: number,
        vy: number,
        color: string,
        life: number
    ): void {
        if (index >= ENTITY_LIMITS.MAX_PARTICLES) return;

        const base = SECTION_OFFSETS.PARTICLES + index * ENTITY_SIZES.PARTICLE;

        this.f32[base / 4] = x;
        this.f32[(base + 4) / 4] = y;
        this.f32[(base + 8) / 4] = vx;
        this.f32[(base + 12) / 4] = vy;
        this.u32[(base + 16) / 4] = packColor(color);
        this.f32[(base + 20) / 4] = life;
    }

    /** Get the current frame ID */
    getFrameId(): number {
        return this.frameId;
    }

    /** Get buffer reference */
    getBuffer(): SharedArrayBuffer {
        return this.buffer;
    }
}

// ═══════════════════════════════════════════════════════════════
// BINARY SNAPSHOT READER (Main thread)
// ═══════════════════════════════════════════════════════════════

/**
 * Read-only view into a binary snapshot buffer.
 * Zero-allocation reads - returns views into the underlying TypedArrays.
 */
export class BinarySnapshotReader {
    private buffer: SharedArrayBuffer;
    private u8: Uint8Array;
    private u32: Uint32Array;
    private f32: Float32Array;
    private f64: Float64Array;

    constructor(buffer: SharedArrayBuffer) {
        this.buffer = buffer;
        this.u8 = new Uint8Array(buffer);
        this.u32 = new Uint32Array(buffer);
        this.f32 = new Float32Array(buffer);
        this.f64 = new Float64Array(buffer);
    }

    /** Get schema version */
    getVersion(): number {
        return this.u32[HEADER.VERSION / 4];
    }

    /** Get frame ID */
    getFrameId(): number {
        return this.u32[HEADER.FRAME_ID / 4];
    }

    /** Get game time in ms */
    getGameTime(): number {
        return this.f64[HEADER.GAME_TIME / 8];
    }

    /** Get current game status */
    getStatus(): GameStatus {
        return u32ToStatus(this.u32[HEADER.STATUS / 4]);
    }

    /** Get modal state (0=NONE, 1=PAUSE, 2=SETTINGS) */
    getModalState(): number {
        return this.u32[HEADER.MODAL_STATE / 4];
    }

    /** Get entity counts */
    getEntityCounts(): {
        enemies: number;
        food: number;
        projectiles: number;
        mines: number;
        terminals: number;
        shockwaves: number;
        arcs: number;
        particles: number;
    } {
        return {
            enemies: this.u32[HEADER.COUNT_ENEMIES / 4],
            food: this.u32[HEADER.COUNT_FOOD / 4],
            projectiles: this.u32[HEADER.COUNT_PROJECTILES / 4],
            mines: this.u32[HEADER.COUNT_MINES / 4],
            terminals: this.u32[HEADER.COUNT_TERMINALS / 4],
            shockwaves: this.u32[HEADER.COUNT_SHOCKWAVES / 4],
            arcs: this.u32[HEADER.COUNT_ARCS / 4],
            particles: this.u32[HEADER.COUNT_PARTICLES / 4]
        };
    }

    // ─────────────────────────────────────────────────────────────
    // PLAYER ACCESS
    // ─────────────────────────────────────────────────────────────

    getPlayerDirection(): Direction {
        return u8ToDirection(this.u8[SECTION_OFFSETS.PLAYER + PLAYER.DIRECTION]);
    }

    getPlayerPendingDirection(): Direction | null {
        const val = this.u8[SECTION_OFFSETS.PLAYER + PLAYER.PENDING_DIR];
        return val === 255 ? null : u8ToDirection(val);
    }

    getPlayerSpeed(): number {
        return this.f32[(SECTION_OFFSETS.PLAYER + PLAYER.SPEED) / 4];
    }

    getPlayerMoveTimer(): number {
        return this.f32[(SECTION_OFFSETS.PLAYER + PLAYER.MOVE_TIMER) / 4];
    }

    getPlayerPhysics(): { vy: number; isGrounded: boolean; isBraking: boolean } {
        const base = SECTION_OFFSETS.PLAYER;
        return {
            vy: this.f32[(base + PLAYER.PHYSICS_VY) / 4],
            isGrounded: this.u8[base + PLAYER.PHYSICS_GROUNDED] === 1,
            isBraking: this.u8[base + PLAYER.PHYSICS_BRAKING] === 1
        };
    }

    getPlayerStamina(): number {
        return this.f32[(SECTION_OFFSETS.PLAYER + PLAYER.STAMINA) / 4];
    }

    getPlayerLevel(): number {
        return this.u32[(SECTION_OFFSETS.PLAYER + PLAYER.LEVEL) / 4];
    }

    getPlayerXP(): number {
        return this.u32[(SECTION_OFFSETS.PLAYER + PLAYER.XP) / 4];
    }

    getPlayerSegmentCount(): number {
        return this.u32[(SECTION_OFFSETS.PLAYER + PLAYER.SEGMENT_COUNT) / 4];
    }

    /** Get segment position (zero-allocation) */
    getSegment(index: number): { x: number; y: number } | null {
        const count = this.getPlayerSegmentCount();
        if (index >= count) return null;

        let base: number;
        if (index < 64) {
            base = (SECTION_OFFSETS.PLAYER + PLAYER.SEGMENTS_INLINE + index * ENTITY_SIZES.SEGMENT) / 4;
        } else {
            base = (SECTION_OFFSETS.SEGMENTS_EXTENDED + (index - 64) * ENTITY_SIZES.SEGMENT) / 4;
        }

        return {
            x: this.f32[base],
            y: this.f32[base + 1]
        };
    }

    // ─────────────────────────────────────────────────────────────
    // SESSION ACCESS
    // ─────────────────────────────────────────────────────────────

    getScore(): number {
        return this.u32[SECTION_OFFSETS.SESSION / 4];
    }

    getStage(): number {
        return this.u32[(SECTION_OFFSETS.SESSION / 4) + 2];
    }

    getCombo(): number {
        return this.u32[(SECTION_OFFSETS.SESSION / 4) + 3];
    }

    // ─────────────────────────────────────────────────────────────
    // CAMERA ACCESS
    // ─────────────────────────────────────────────────────────────

    getCameraX(): number {
        return this.f32[SECTION_OFFSETS.CAMERA / 4];
    }

    getCameraY(): number {
        return this.f32[(SECTION_OFFSETS.CAMERA / 4) + 1];
    }

    getCameraZoom(): number {
        return this.f32[(SECTION_OFFSETS.CAMERA / 4) + 5];
    }

    getCameraShake(): number {
        return this.f32[(SECTION_OFFSETS.CAMERA / 4) + 6];
    }

    // ─────────────────────────────────────────────────────────────
    // ENTITY ACCESS
    // ─────────────────────────────────────────────────────────────

    /** Get enemy data at index (zero-allocation read) */
    getEnemy(index: number): {
        idHash: number;
        x: number;
        y: number;
        type: number;
        state: number;
        hp: number;
        maxHp: number;
        vx: number;
        vy: number;
        speed: number;
        isGrounded: boolean;
        stunTimer: number;
        flash: number;
    } | null {
        const count = this.u32[HEADER.COUNT_ENEMIES / 4];
        if (index >= count) return null;

        const base = SECTION_OFFSETS.ENEMIES + index * ENTITY_SIZES.ENEMY;

        return {
            idHash: this.u32[base / 4],
            x: this.f32[(base + 4) / 4],
            y: this.f32[(base + 8) / 4],
            type: this.u8[base + 12],
            state: this.u8[base + 13],
            hp: this.u32[(base + 16) / 4],
            maxHp: this.u32[(base + 20) / 4],
            vx: this.f32[(base + 24) / 4],
            vy: this.f32[(base + 28) / 4],
            speed: this.f32[(base + 32) / 4],
            isGrounded: this.u8[base + 36] === 1,
            stunTimer: this.f32[(base + 40) / 4],
            flash: this.f32[(base + 44) / 4]
        };
    }

    /** Get projectile data at index */
    getProjectile(index: number): {
        idHash: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
        damage: number;
        size: number;
        type: number;
        owner: number;
        age: number;
        life: number;
    } | null {
        const count = this.u32[HEADER.COUNT_PROJECTILES / 4];
        if (index >= count) return null;

        const base = SECTION_OFFSETS.PROJECTILES + index * ENTITY_SIZES.PROJECTILE;

        return {
            idHash: this.u32[base / 4],
            x: this.f32[(base + 4) / 4],
            y: this.f32[(base + 8) / 4],
            vx: this.f32[(base + 12) / 4],
            vy: this.f32[(base + 16) / 4],
            damage: this.f32[(base + 20) / 4],
            size: this.f32[(base + 24) / 4],
            type: this.u8[base + 28],
            owner: this.u8[base + 29],
            age: this.f32[(base + 32) / 4],
            life: this.f32[(base + 36) / 4]
        };
    }

    /** Get food data at index */
    getFood(index: number): {
        idHash: number;
        x: number;
        y: number;
        type: number;
        value: number;
        lifespan: number;
        createdAt: number;
    } | null {
        const count = this.u32[HEADER.COUNT_FOOD / 4];
        if (index >= count) return null;

        const base = SECTION_OFFSETS.FOOD + index * ENTITY_SIZES.FOOD;

        return {
            idHash: this.u32[base / 4],
            x: this.f32[(base + 4) / 4],
            y: this.f32[(base + 8) / 4],
            type: this.u8[base + 12],
            value: this.u8[base + 13],
            lifespan: this.u32[(base + 16) / 4],
            createdAt: this.f32[(base + 20) / 4]
        };
    }

    /** Get particle data at index */
    getParticle(index: number): {
        x: number;
        y: number;
        vx: number;
        vy: number;
        color: number;
        life: number;
    } | null {
        const count = this.u32[HEADER.COUNT_PARTICLES / 4];
        if (index >= count) return null;

        const base = SECTION_OFFSETS.PARTICLES + index * ENTITY_SIZES.PARTICLE;

        return {
            x: this.f32[base / 4],
            y: this.f32[(base + 4) / 4],
            vx: this.f32[(base + 8) / 4],
            vy: this.f32[(base + 12) / 4],
            color: this.u32[(base + 16) / 4],
            life: this.f32[(base + 20) / 4]
        };
    }
}


// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create all SharedArrayBuffers needed for the simulation bridge.
 */
export function createSharedBuffers(): {
    snapshot0: SharedArrayBuffer;
    snapshot1: SharedArrayBuffer;
    control: SharedArrayBuffer;
} {
    return {
        snapshot0: new SharedArrayBuffer(SECTION_OFFSETS.TOTAL),
        snapshot1: new SharedArrayBuffer(SECTION_OFFSETS.TOTAL),
        control: new SharedArrayBuffer(CONTROL_BUFFER_SIZE)
    };
}

/**
 * Check if SharedArrayBuffer is available (requires COOP/COEP headers).
 */
export function isSharedArrayBufferAvailable(): boolean {
    try {
        return typeof SharedArrayBuffer !== 'undefined' &&
            typeof Atomics !== 'undefined';
    } catch {
        return false;
    }
}
