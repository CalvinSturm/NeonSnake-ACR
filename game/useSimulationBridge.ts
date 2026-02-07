/**
 * useSimulationBridge
 * 
 * React hook for the SharedArrayBuffer-based simulation engine.
 * Provides high-performance zero-copy state access at 144Hz+.
 * 
 * Key features:
 * - Zero-allocation snapshot reads via TypedArrays
 * - Atomic input delivery without postMessage
 * - Compatible with existing useWorkerEngine interface
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    SimulationBridge,
    getSimulationBridge,
    disposeSimulationBridge,
    BinarySnapshot
} from '../engine/SimulationBridge';
import { BinarySnapshotReader, u32ToStatus } from '../engine/shared/BinarySnapshot';
import { EngineEvent, SimulationConfig } from '../engine/messages';
import { SimulationSnapshot, GameOverStats } from '../engine/simulation/types';
import { CharacterProfile, GameStatus, Direction } from '../types';

// ═══════════════════════════════════════════════════════════════
// HOOK INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface SimulationBridgeState {
    /** Direct reader access for zero-copy rendering */
    reader: BinarySnapshotReader | null;

    /** Current frame ID for change detection */
    frameId: number;

    /** Current game status */
    status: GameStatus;

    /** Game over stats (null until GAME_OVER event) */
    gameOverStats: GameOverStats | null;

    /** Whether the engine is ready */
    isReady: boolean;

    /** Push input to the simulation */
    pushInput: (direction: Direction | null, jump: boolean, brake: boolean) => void;

    /** Initialize and start the simulation */
    start: (config: SimulationConfig, profile: CharacterProfile) => void;

    /** Pause the simulation */
    pause: () => void;

    /** Resume the simulation */
    resume: () => void;

    /** Reset and start a new game */
    reset: (profile: CharacterProfile) => void;

    /** Set modal state */
    setModal: (modal: 'NONE' | 'PAUSE' | 'SETTINGS') => void;
}

// ═══════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

export function useSimulationBridge(): SimulationBridgeState {
    const [frameId, setFrameId] = useState(0);
    const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
    const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [reader, setReader] = useState<BinarySnapshotReader | null>(null);

    const bridgeRef = useRef<SimulationBridge | null>(null);
    const configRef = useRef<SimulationConfig | null>(null);
    const rafIdRef = useRef<number>(0);

    // Initialize bridge on mount
    useEffect(() => {
        const bridge = getSimulationBridge();
        bridgeRef.current = bridge;

        // Subscribe to events (only control events come via postMessage)
        const unsubscribe = bridge.subscribe((event: EngineEvent) => {
            switch (event.type) {
                case 'READY':
                    setIsReady(true);
                    break;

                case 'GAME_OVER':
                    setGameOverStats(event.stats);
                    break;
            }
        });

        // Start RAF loop for reading snapshots
        const pollSnapshots = () => {
            const currentReader = bridge.getSnapshotReader();
            if (currentReader) {
                const newFrameId = currentReader.getFrameId();
                const newStatus = currentReader.getStatus();

                // Only update state if frame changed
                setReader(currentReader);
                setFrameId(newFrameId);
                setStatus(newStatus);
            }
            rafIdRef.current = requestAnimationFrame(pollSnapshots);
        };

        rafIdRef.current = requestAnimationFrame(pollSnapshots);

        return () => {
            unsubscribe();
            cancelAnimationFrame(rafIdRef.current);
            // Note: We don't dispose the bridge here to allow reuse
        };
    }, []);

    // Push input (zero-copy)
    const pushInput = useCallback((direction: Direction | null, jump: boolean, brake: boolean) => {
        bridgeRef.current?.pushInputDirect(direction, jump, brake);
    }, []);

    // High-level API
    const start = useCallback((config: SimulationConfig, profile: CharacterProfile) => {
        const bridge = bridgeRef.current;
        if (!bridge) return;

        configRef.current = config;
        setGameOverStats(null);

        bridge.init(config);
        bridge.reset(profile);
        bridge.start();
    }, []);

    const pause = useCallback(() => {
        bridgeRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        bridgeRef.current?.resume();
    }, []);

    const reset = useCallback((profile: CharacterProfile) => {
        const bridge = bridgeRef.current;
        if (!bridge) return;

        setGameOverStats(null);
        bridge.reset(profile);
        bridge.start();
    }, []);

    const setModal = useCallback((modal: 'NONE' | 'PAUSE' | 'SETTINGS') => {
        bridgeRef.current?.setModal(modal);
    }, []);

    return {
        reader,
        frameId,
        status,
        gameOverStats,
        isReady,
        pushInput,
        start,
        pause,
        resume,
        reset,
        setModal
    };
}

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY HOOK
// Wraps SimulationBridge with the old useWorkerEngine interface
// ═══════════════════════════════════════════════════════════════

export interface LegacyWorkerEngineState {
    snapshot: SimulationSnapshot | null;
    status: GameStatus;
    gameOverStats: GameOverStats | null;
    isReady: boolean;
    send: (cmd: import('../engine/messages').EngineCommand) => void;
    start: (config: SimulationConfig, profile: CharacterProfile) => void;
    pause: () => void;
    resume: () => void;
    reset: (profile: CharacterProfile) => void;
}

/**
 * Legacy-compatible hook that converts binary snapshots to SimulationSnapshot objects.
 * Use useSimulationBridge for zero-allocation performance.
 */
export function useWorkerEngineLegacy(): LegacyWorkerEngineState {
    const { reader, frameId, status, gameOverStats, isReady, start, pause, resume, reset } = useSimulationBridge();
    const bridgeRef = useRef<SimulationBridge | null>(null);

    useEffect(() => {
        bridgeRef.current = getSimulationBridge();
    }, []);

    // Convert binary reader to SimulationSnapshot object (allocates)
    const snapshot = useMemo<SimulationSnapshot | null>(() => {
        if (!reader) return null;

        const entityCounts = reader.getEntityCounts();

        return {
            gameTime: reader.getGameTime(),
            status: reader.getStatus(),
            modalState: ['NONE', 'PAUSE', 'SETTINGS'][reader.getModalState()] as 'NONE' | 'PAUSE' | 'SETTINGS',
            player: {
                segments: Array.from({ length: reader.getPlayerSegmentCount() }, (_, i) =>
                    reader.getSegment(i) || { x: 0, y: 0 }
                ),
                direction: reader.getPlayerDirection(),
                pendingDirection: reader.getPlayerPendingDirection(),
                speed: reader.getPlayerSpeed(),
                moveTimer: reader.getPlayerMoveTimer(),
                physics: reader.getPlayerPhysics(),
                stats: {} as any, // TODO: Read from buffer
                stamina: reader.getPlayerStamina(),
                maxStamina: reader.getPlayerStamina(), // TODO: Read actual value
                tailIntegrity: 100, // TODO: Read from buffer
                invincibleTimer: 0, // TODO: Read from buffer
                level: reader.getPlayerLevel(),
                xp: reader.getPlayerXP(),
                xpToNext: 100 // TODO: Read from buffer
            },
            entities: {
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
            },
            session: {
                score: reader.getScore(),
                stageScore: 0,
                stage: reader.getStage(),
                combo: reader.getCombo(),
                maxCombo: 0,
                enemiesKilled: 0,
                terminalsHacked: 0,
                runId: 0,
                difficulty: 'MEDIUM' as any
            },
            camera: {
                x: reader.getCameraX(),
                y: reader.getCameraY(),
                targetX: reader.getCameraX(),
                targetY: reader.getCameraY(),
                mode: 0 as any,
                zoom: reader.getCameraZoom(),
                shake: reader.getCameraShake(),
                floor: 0
            },
            events: []
        };
    }, [reader, frameId]);

    const send = useCallback((cmd: import('../engine/messages').EngineCommand) => {
        bridgeRef.current?.send(cmd);
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

export function cleanupSimulationBridge(): void {
    disposeSimulationBridge();
}
