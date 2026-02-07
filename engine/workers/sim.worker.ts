/**
 * sim.worker.ts
 * 
 * High-performance simulation worker using SharedArrayBuffer.
 * Writes state directly to SAB for zero-copy reads on main thread.
 * 
 * Key features:
 * - 144Hz fixed timestep (6.94ms)
 * - Zero postMessage overhead for state transfer
 * - Atomic double-buffering for tear-free reads
 * - Input consumed from shared ring buffer
 */

import { SimulationWorld } from '../simulation/SimulationWorld';
import {
    SimulationConfig,
    createDefaultConfig
} from '../simulation/types';

import {
    BinarySnapshotWriter,
    CONTROL_OFFSETS,
    isSharedArrayBufferAvailable,
    statusToU32
} from '../shared/BinarySnapshot';

import { InputRingReader, InputSnapshot } from '../shared/InputRing';

import { CharacterProfile, GameStatus, FoodType, EnemyType } from '../../types';

// ═══════════════════════════════════════════════════════════════
// WORKER MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════

interface SharedBufferRefs {
    snapshot0: SharedArrayBuffer;
    snapshot1: SharedArrayBuffer;
    control: SharedArrayBuffer;
    input: SharedArrayBuffer;
}

type WorkerCommand =
    | { type: 'INIT'; buffers: SharedBufferRefs; config: SimulationConfig }
    | { type: 'RESET'; profile: CharacterProfile }
    | { type: 'START' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'SET_MODAL'; modal: 'NONE' | 'PAUSE' | 'SETTINGS' }
    | { type: 'DISPOSE' };

type WorkerEvent =
    | { type: 'READY' }
    | { type: 'ERROR'; message: string }
    | { type: 'GAME_OVER'; stats: import('../simulation/types').GameOverStats };

// ═══════════════════════════════════════════════════════════════
// WORKER STATE
// ═══════════════════════════════════════════════════════════════

const world = new SimulationWorld();

// SharedArrayBuffer infrastructure
let snapshotWriters: [BinarySnapshotWriter, BinarySnapshotWriter] | null = null;
let controlBuffer: Int32Array | null = null;
let inputReader: InputRingReader | null = null;

// Loop state
let isRunning = false;
let isPaused = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTime = 0;
let accumulator = 0;
let currentBuffer = 0; // 0 or 1 for double buffering
let lastStatus: GameStatus | null = null;

// Fixed timestep at 144Hz for smooth high-refresh-rate displays
const TARGET_FPS = 144;
const FIXED_DT = 1000 / 60;      // Simulation at 60Hz (16.66ms)
const TICK_INTERVAL = 1000 / TARGET_FPS; // 6.94ms tick rate
const MAX_FRAME_DT = 100;        // Clamp to prevent spiral of death

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════

function postEvent(event: WorkerEvent): void {
    self.postMessage(event);
}

function handleCommand(cmd: WorkerCommand): void {
    switch (cmd.type) {
        case 'INIT':
            initSharedBuffers(cmd.buffers, cmd.config);
            break;

        case 'RESET':
            world.reset(cmd.profile);
            lastStatus = null;
            // Write initial state immediately
            writeSnapshotToBuffer();
            break;

        case 'START':
            start();
            break;

        case 'PAUSE':
            pause();
            break;

        case 'RESUME':
            resume();
            break;

        case 'SET_MODAL':
            world.setModalState(cmd.modal);
            break;

        case 'DISPOSE':
            stop();
            world.dispose();
            break;
    }
}

function initSharedBuffers(buffers: SharedBufferRefs, config: SimulationConfig): void {
    try {
        // Create writers for double-buffered snapshots
        snapshotWriters = [
            new BinarySnapshotWriter(buffers.snapshot0),
            new BinarySnapshotWriter(buffers.snapshot1)
        ];

        // Control buffer for atomic coordination
        controlBuffer = new Int32Array(buffers.control);

        // Input ring reader
        inputReader = new InputRingReader(buffers.input);

        // Initialize world
        world.init(config);

        // Signal ready
        postEvent({ type: 'READY' });
        console.log('[SimWorker] Initialized with SharedArrayBuffer');
    } catch (error) {
        postEvent({ type: 'ERROR', message: `Init failed: ${error}` });
    }
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION LOOP
// ═══════════════════════════════════════════════════════════════

function tick(): void {
    if (!isRunning || isPaused) return;
    if (!snapshotWriters || !controlBuffer || !inputReader) return;

    // Check for pause/dispose signals from main thread
    const pauseFlag = Atomics.load(controlBuffer, CONTROL_OFFSETS.PAUSE_FLAG / 4);
    const disposeFlag = Atomics.load(controlBuffer, CONTROL_OFFSETS.DISPOSE_FLAG / 4);

    if (disposeFlag === 1) {
        stop();
        world.dispose();
        return;
    }

    if (pauseFlag === 1 && !isPaused) {
        pause();
        return;
    }

    const now = performance.now();

    // Handle first tick or large time gaps
    if (lastTime === 0) {
        lastTime = now;
        return;
    }

    const frameDt = Math.min(MAX_FRAME_DT, now - lastTime);
    lastTime = now;
    accumulator += frameDt;

    // Consume input from ring buffer
    const input = inputReader.consumeLatest();

    // Fixed timestep simulation
    let stepped = false;
    while (accumulator >= FIXED_DT) {
        world.step(FIXED_DT, input);
        accumulator -= FIXED_DT;
        stepped = true;
    }

    // Only write snapshot if we stepped
    if (stepped) {
        writeSnapshotToBuffer();

        // Check for status changes
        const snapshot = world.getSnapshot();
        if (snapshot.status !== lastStatus) {
            if (snapshot.status === GameStatus.GAME_OVER) {
                postEvent({ type: 'GAME_OVER', stats: world.getGameOverStats() });
            }
            lastStatus = snapshot.status;
        }
    }
}

function writeSnapshotToBuffer(): void {
    if (!snapshotWriters || !controlBuffer) return;

    const snapshot = world.getSnapshot();
    const writer = snapshotWriters[currentBuffer];

    // Begin frame
    writer.beginFrame();

    // Write header
    const modalMap = { 'NONE': 0, 'PAUSE': 1, 'SETTINGS': 2 };
    writer.writeHeader(
        snapshot.gameTime,
        snapshot.status,
        modalMap[snapshot.modalState] ?? 0
    );

    // Write player state
    writer.writePlayer(
        snapshot.player.direction,
        snapshot.player.pendingDirection,
        snapshot.player.speed,
        snapshot.player.moveTimer,
        snapshot.player.physics.vy,
        snapshot.player.physics.isGrounded,
        snapshot.player.physics.isBraking,
        snapshot.player.stamina,
        snapshot.player.maxStamina,
        snapshot.player.tailIntegrity,
        snapshot.player.invincibleTimer,
        snapshot.player.level,
        snapshot.player.xp,
        snapshot.player.xpToNext,
        snapshot.player.segments
    );

    // Write session state
    const difficultyMap = { 'EASY': 0, 'MEDIUM': 1, 'HARD': 2, 'INSANE': 3 };
    writer.writeSession(
        snapshot.session.score,
        snapshot.session.stageScore,
        snapshot.session.stage,
        snapshot.session.combo,
        snapshot.session.maxCombo,
        snapshot.session.enemiesKilled,
        snapshot.session.terminalsHacked,
        snapshot.session.runId,
        difficultyMap[snapshot.session.difficulty as keyof typeof difficultyMap] ?? 1
    );

    // Write camera state
    writer.writeCamera(
        snapshot.camera.x,
        snapshot.camera.y,
        snapshot.camera.targetX,
        snapshot.camera.targetY,
        snapshot.camera.mode,
        snapshot.camera.zoom,
        snapshot.camera.shake,
        snapshot.camera.floor
    );

    // Write entities
    const entities = snapshot.entities;

    // Enemies
    writer.writeEntityCount('enemies', entities.enemies.length);
    entities.enemies.forEach((enemy, i) => {
        const stateMap = { 'SPAWNING': 0, 'ACTIVE': 1, 'ENTERING': 2 };
        writer.writeEnemy(
            i,
            enemy.id,
            enemy.x,
            enemy.y,
            enemy.type,
            stateMap[enemy.state] ?? 1,
            enemy.hp,
            enemy.maxHp,
            enemy.vx,
            enemy.vy,
            enemy.speed,
            enemy.isGrounded,
            enemy.stunTimer ?? 0,
            enemy.flash ?? 0
        );
    });

    // Food
    writer.writeEntityCount('food', entities.food.length);
    entities.food.forEach((food, i) => {
        writer.writeFood(
            i,
            food.id,
            food.x,
            food.y,
            food.type,
            food.value ?? 1,
            food.lifespan ?? 0,
            food.createdAt
        );
    });

    // Projectiles
    writer.writeEntityCount('projectiles', entities.projectiles.length);
    entities.projectiles.forEach((proj, i) => {
        const typeMap: Record<string, number> = { 'cannon': 0, 'enemy': 1, 'mine': 2 };
        writer.writeProjectile(
            i,
            proj.id,
            proj.x,
            proj.y,
            proj.vx,
            proj.vy,
            proj.damage,
            proj.size,
            typeMap[proj.type] ?? 0,
            proj.owner === 'PLAYER' ? 0 : 1,
            proj.age ?? 0,
            proj.life ?? 0
        );
    });

    // Particles
    writer.writeEntityCount('particles', entities.particles.length);
    entities.particles.forEach((particle, i) => {
        writer.writeParticle(
            i,
            particle.x,
            particle.y,
            particle.vx,
            particle.vy,
            particle.color,
            particle.life
        );
    });

    // Atomic buffer flip: signal which buffer is ready
    const frameId = writer.getFrameId();
    Atomics.store(controlBuffer, CONTROL_OFFSETS.ACTIVE_BUFFER / 4, currentBuffer);
    Atomics.store(controlBuffer, CONTROL_OFFSETS.WORKER_FRAME / 4, frameId);

    // Notify main thread (optional wake-up)
    Atomics.notify(controlBuffer, CONTROL_OFFSETS.WORKER_FRAME / 4, 1);

    // Swap buffer for next frame
    currentBuffer = currentBuffer === 0 ? 1 : 0;
}

function start(): void {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;
    lastTime = 0;
    accumulator = 0;

    // Use setInterval at 144Hz tick rate
    intervalId = setInterval(tick, TICK_INTERVAL);
    console.log(`[SimWorker] Started at ${TARGET_FPS}Hz tick rate`);
}

function pause(): void {
    isPaused = true;
    world.pause();
}

function resume(): void {
    isPaused = false;
    lastTime = performance.now();
    accumulator = 0;

    // Clear pause flag
    if (controlBuffer) {
        Atomics.store(controlBuffer, CONTROL_OFFSETS.PAUSE_FLAG / 4, 0);
    }

    world.resume();
}

function stop(): void {
    isRunning = false;
    isPaused = false;

    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// WORKER ENTRY POINT
// ═══════════════════════════════════════════════════════════════

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
    handleCommand(event.data);
};

// Signal that the worker script has loaded
console.log('[SimWorker] Loaded (SharedArrayBuffer mode)');
