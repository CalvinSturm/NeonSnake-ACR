/**
 * Game Engine Protocol
 * Defines structured-clone-safe messages between UI (Main Thread) and Engine (Worker or Local).
 * 
 * Directionality:
 * - EngineCommand: Main Thread → Simulation
 * - EngineEvent: Simulation → Main Thread
 */

import { GameStatus, CharacterProfile, Difficulty, CameraMode, Direction } from "../types";
import { SimulationSnapshot, GameOverStats, InputSnapshot } from "./simulation/types";

// ═══════════════════════════════════════════════════════════════
// SIMULATION CONFIG
// ═══════════════════════════════════════════════════════════════

export interface SimulationConfig {
    gridWidth: number;
    gridHeight: number;
    difficulty: Difficulty;
    cameraMode: CameraMode;
}

// ═══════════════════════════════════════════════════════════════
// COMMANDS: MAIN THREAD → SIMULATION
// All payloads must be structured-clone-safe (no functions, classes)
// ═══════════════════════════════════════════════════════════════

export type EngineCommand =
    | { type: 'INIT'; config: SimulationConfig }
    | { type: 'RESET'; profile: CharacterProfile }
    | { type: 'START' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'INPUT'; input: InputSnapshot }
    | { type: 'SET_MODAL'; modal: 'NONE' | 'PAUSE' | 'SETTINGS' }
    | { type: 'DISPOSE' };

// ═══════════════════════════════════════════════════════════════
// EVENTS: SIMULATION → MAIN THREAD
// All payloads must be structured-clone-safe
// ═══════════════════════════════════════════════════════════════

export type EngineEvent =
    | { type: 'READY' }
    | { type: 'SNAPSHOT'; snapshot: SimulationSnapshot }
    | { type: 'STATUS_CHANGE'; status: GameStatus }
    | { type: 'GAME_OVER'; stats: GameOverStats };

// ═══════════════════════════════════════════════════════════════
// ENGINE INTERFACE (for both Worker and Local modes)
// ═══════════════════════════════════════════════════════════════

export interface EngineInterface {
    /** Send a command to the simulation */
    send(cmd: EngineCommand): void;

    /** Subscribe to events from the simulation */
    subscribe(callback: (evt: EngineEvent) => void): () => void;
}

// ═══════════════════════════════════════════════════════════════
// INPUT CREATION HELPERS
// ═══════════════════════════════════════════════════════════════

export function createInputCommand(
    direction: Direction | null,
    jumpIntent: boolean,
    brakeIntent: boolean
): EngineCommand {
    return {
        type: 'INPUT',
        input: {
            direction,
            jumpIntent,
            brakeIntent,
            frameTime: performance.now()
        }
    };
}
