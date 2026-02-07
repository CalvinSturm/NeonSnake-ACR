/**
 * Simulation Worker
 * 
 * Web Worker entry point that runs SimulationWorld.
 * Owns the fixed-timestep simulation loop.
 * Communicates via structured-clone-safe messages.
 * 
 * Authority: Simulation state
 * Non-authority: Rendering, input capture, UI
 */

import { SimulationWorld } from '../simulation/SimulationWorld';
import {
    InputSnapshot,
    createEmptyInput,
    SimulationConfig,
    createDefaultConfig
} from '../simulation/types';
import { EngineCommand, EngineEvent } from '../messages';
import { CharacterProfile, GameStatus } from '../../types';

// ═══════════════════════════════════════════════════════════════
// WORKER STATE
// ═══════════════════════════════════════════════════════════════

const world = new SimulationWorld();

let isRunning = false;
let isPaused = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let pendingInput: InputSnapshot | null = null;

// Fixed timestep configuration
const FIXED_DT = 1000 / 60; // 16.66ms
const MAX_FRAME_DT = 100;   // Clamp to prevent spiral of death

let lastTime = 0;
let accumulator = 0;
let lastStatus: GameStatus | null = null;

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════

function postEvent(event: EngineEvent): void {
    self.postMessage(event);
}

function handleCommand(cmd: EngineCommand): void {
    switch (cmd.type) {
        case 'INIT':
            world.init(cmd.config);
            postEvent({ type: 'READY' });
            break;

        case 'RESET':
            world.reset(cmd.profile);
            lastStatus = null;
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

        case 'INPUT':
            // Buffer input for next simulation step
            pendingInput = cmd.input;
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

// ═══════════════════════════════════════════════════════════════
// SIMULATION LOOP
// ═══════════════════════════════════════════════════════════════

function tick(): void {
    if (!isRunning || isPaused) return;

    const now = performance.now();

    // Handle first tick or large time gaps
    if (lastTime === 0) {
        lastTime = now;
        return;
    }

    const frameDt = Math.min(MAX_FRAME_DT, now - lastTime);
    lastTime = now;
    accumulator += frameDt;

    // Fixed timestep simulation
    let stepped = false;
    while (accumulator >= FIXED_DT) {
        world.step(FIXED_DT, pendingInput);
        pendingInput = null; // Consume input
        accumulator -= FIXED_DT;
        stepped = true;
    }

    // Only post snapshot if we stepped (avoid redundant messages)
    if (stepped) {
        const snapshot = world.getSnapshot();
        postEvent({ type: 'SNAPSHOT', snapshot });

        // Detect status changes
        if (snapshot.status !== lastStatus) {
            postEvent({ type: 'STATUS_CHANGE', status: snapshot.status });

            if (snapshot.status === GameStatus.GAME_OVER) {
                postEvent({ type: 'GAME_OVER', stats: world.getGameOverStats() });
            }

            lastStatus = snapshot.status;
        }
    }
}

function start(): void {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;
    lastTime = 0;
    accumulator = 0;

    // Use setInterval for consistent tick rate
    // Note: setInterval in Workers is more reliable than in main thread
    intervalId = setInterval(tick, FIXED_DT);
}

function pause(): void {
    isPaused = true;
    world.pause();
}

function resume(): void {
    isPaused = false;
    lastTime = performance.now(); // Reset time to avoid large dt
    accumulator = 0;
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

self.onmessage = (event: MessageEvent<EngineCommand>) => {
    handleCommand(event.data);
};

// Signal that the worker script has loaded
console.log('[SimulationWorker] Loaded');
