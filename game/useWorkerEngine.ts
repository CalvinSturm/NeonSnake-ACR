/**
 * useWorkerEngine
 * 
 * React hook for using the Worker-based simulation engine.
 * Provides snapshot state and command dispatch.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkerEngine, getWorkerEngine, disposeWorkerEngine } from '../engine/worker';
import { EngineCommand, EngineEvent, SimulationConfig } from '../engine/messages';
import { SimulationSnapshot, GameOverStats } from '../engine/simulation/types';
import { CharacterProfile, GameStatus } from '../types';

// ═══════════════════════════════════════════════════════════════
// HOOK INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface WorkerEngineState {
    /** Current simulation snapshot (null until first SNAPSHOT received) */
    snapshot: SimulationSnapshot | null;

    /** Current game status */
    status: GameStatus;

    /** Game over stats (null until GAME_OVER event) */
    gameOverStats: GameOverStats | null;

    /** Whether the engine is ready */
    isReady: boolean;

    /** Send a command to the simulation */
    send: (cmd: EngineCommand) => void;

    /** Initialize and start the simulation */
    start: (config: SimulationConfig, profile: CharacterProfile) => void;

    /** Pause the simulation */
    pause: () => void;

    /** Resume the simulation */
    resume: () => void;

    /** Reset and start a new game */
    reset: (profile: CharacterProfile) => void;
}

// ═══════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

export function useWorkerEngine(): WorkerEngineState {
    const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
    const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
    const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);
    const [isReady, setIsReady] = useState(false);

    const engineRef = useRef<WorkerEngine | null>(null);
    const configRef = useRef<SimulationConfig | null>(null);

    // Initialize engine on mount
    useEffect(() => {
        const engine = getWorkerEngine();
        engineRef.current = engine;

        // Subscribe to events
        const unsubscribe = engine.subscribe((event: EngineEvent) => {
            switch (event.type) {
                case 'READY':
                    setIsReady(true);
                    break;

                case 'SNAPSHOT':
                    setSnapshot(event.snapshot);
                    break;

                case 'STATUS_CHANGE':
                    setStatus(event.status);
                    break;

                case 'GAME_OVER':
                    setGameOverStats(event.stats);
                    break;
            }
        });

        return () => {
            unsubscribe();
            // Note: We don't dispose the engine here to allow reuse
            // Dispose is called explicitly when the app unmounts
        };
    }, []);

    // Command dispatch
    const send = useCallback((cmd: EngineCommand) => {
        engineRef.current?.send(cmd);
    }, []);

    // High-level API
    const start = useCallback((config: SimulationConfig, profile: CharacterProfile) => {
        const engine = engineRef.current;
        if (!engine) return;

        configRef.current = config;
        setGameOverStats(null);

        engine.send({ type: 'INIT', config });
        engine.send({ type: 'RESET', profile });
        engine.send({ type: 'START' });
    }, []);

    const pause = useCallback(() => {
        engineRef.current?.send({ type: 'PAUSE' });
    }, []);

    const resume = useCallback(() => {
        engineRef.current?.send({ type: 'RESUME' });
    }, []);

    const reset = useCallback((profile: CharacterProfile) => {
        const engine = engineRef.current;
        if (!engine) return;

        setGameOverStats(null);
        engine.send({ type: 'RESET', profile });
        engine.send({ type: 'START' });
    }, []);

    return {
        snapshot,
        status,
        gameOverStats,
        isReady,
        send,
        start,
        pause,
        resume,
        reset
    };
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Call this when the app unmounts to terminate the Worker.
 */
export function cleanupWorkerEngine(): void {
    disposeWorkerEngine();
}
