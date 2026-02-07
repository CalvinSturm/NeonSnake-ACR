/**
 * SimulationBridge
 * 
 * Main-thread adapter for the SharedArrayBuffer-based simulation worker.
 * Provides zero-copy state access and lock-free input delivery.
 * 
 * Features:
 * - Zero-allocation snapshot reads via BinarySnapshotReader
 * - Atomic input delivery via InputRingWriter
 * - Graceful fallback to postMessage if SAB unavailable
 * - Double-buffer coordination with worker
 */

import {
    BinarySnapshotReader,
    createSharedBuffers,
    isSharedArrayBufferAvailable,
    CONTROL_OFFSETS,
    SECTION_OFFSETS
} from './shared/BinarySnapshot';

import {
    InputRingWriter,
    createInputBuffer,
    InputSnapshot
} from './shared/InputRing';

import { EngineInterface, EngineCommand, EngineEvent } from './messages';
import { SimulationConfig } from './simulation/types';
import { CharacterProfile, GameStatus, Direction } from '../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
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

/** Lightweight snapshot view (zero-allocation access) */
export interface BinarySnapshot {
    /** Reader for direct buffer access */
    readonly reader: BinarySnapshotReader;
    /** Frame ID for change detection */
    readonly frameId: number;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION BRIDGE CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * Main-thread interface to the simulation worker.
 * Uses SharedArrayBuffer for zero-copy state transfer.
 */
export class SimulationBridge implements EngineInterface {
    private worker: Worker;
    private subscribers: Set<(evt: EngineEvent) => void> = new Set();
    private isDisposed = false;
    private isReady = false;

    // SharedArrayBuffer infrastructure
    private buffers: SharedBufferRefs | null = null;
    private readers: [BinarySnapshotReader, BinarySnapshotReader] | null = null;
    private controlBuffer: Int32Array | null = null;
    private inputWriter: InputRingWriter | null = null;

    // Frame tracking
    private lastReadFrame = 0;
    private currentReader: BinarySnapshotReader | null = null;

    // Fallback mode (postMessage)
    private useFallback = false;

    constructor() {
        // Check SharedArrayBuffer availability
        this.useFallback = !isSharedArrayBufferAvailable();

        if (this.useFallback) {
            console.warn('[SimulationBridge] SharedArrayBuffer unavailable, using fallback mode');
        }

        // Create Worker
        this.worker = new Worker(
            new URL('./workers/sim.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Handle messages from worker
        this.worker.onmessage = (event: MessageEvent) => {
            this.handleWorkerMessage(event.data);
        };

        this.worker.onerror = (error) => {
            console.error('[SimulationBridge] Worker error:', error);
        };

        console.log('[SimulationBridge] Created');
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Initialize the simulation with shared buffers.
     */
    init(config: SimulationConfig): void {
        if (this.useFallback) {
            // Fallback: use old postMessage protocol
            this.worker.postMessage({ type: 'INIT', config });
            return;
        }

        // Allocate SharedArrayBuffers
        const sharedBuffers = createSharedBuffers();
        const inputBuffer = createInputBuffer();

        this.buffers = {
            snapshot0: sharedBuffers.snapshot0,
            snapshot1: sharedBuffers.snapshot1,
            control: sharedBuffers.control,
            input: inputBuffer
        };

        // Create readers for both snapshot buffers
        this.readers = [
            new BinarySnapshotReader(sharedBuffers.snapshot0),
            new BinarySnapshotReader(sharedBuffers.snapshot1)
        ];

        // Control buffer for coordination
        this.controlBuffer = new Int32Array(sharedBuffers.control);

        // Input writer
        this.inputWriter = new InputRingWriter(inputBuffer);

        // Send buffers to worker
        const command: WorkerCommand = {
            type: 'INIT',
            buffers: this.buffers,
            config
        };
        this.worker.postMessage(command);
    }

    /**
     * Reset the simulation for a new game.
     */
    reset(profile: CharacterProfile): void {
        this.worker.postMessage({ type: 'RESET', profile });
    }

    /**
     * Start the simulation loop.
     */
    start(): void {
        this.worker.postMessage({ type: 'START' });
    }

    /**
     * Pause the simulation.
     */
    pause(): void {
        // Set pause flag atomically for immediate effect
        if (this.controlBuffer) {
            Atomics.store(this.controlBuffer, CONTROL_OFFSETS.PAUSE_FLAG / 4, 1);
        }
        this.worker.postMessage({ type: 'PAUSE' });
    }

    /**
     * Resume the simulation.
     */
    resume(): void {
        // Clear pause flag
        if (this.controlBuffer) {
            Atomics.store(this.controlBuffer, CONTROL_OFFSETS.PAUSE_FLAG / 4, 0);
        }
        this.worker.postMessage({ type: 'RESUME' });
    }

    /**
     * Set modal state.
     */
    setModal(modal: 'NONE' | 'PAUSE' | 'SETTINGS'): void {
        this.worker.postMessage({ type: 'SET_MODAL', modal });
    }

    /**
     * Push input to the simulation (zero-copy via SharedArrayBuffer).
     */
    pushInput(input: InputSnapshot): void {
        if (this.inputWriter) {
            this.inputWriter.push(input);
        }
    }

    /**
     * Push input using Direction and flags.
     */
    pushInputDirect(
        direction: Direction | null,
        jumpIntent: boolean,
        brakeIntent: boolean
    ): void {
        this.pushInput({
            direction,
            jumpIntent,
            brakeIntent,
            frameTime: performance.now()
        });
    }

    /**
     * Get the current snapshot reader (zero-allocation).
     * Returns the reader for the buffer the worker most recently completed.
     */
    getSnapshotReader(): BinarySnapshotReader | null {
        if (!this.readers || !this.controlBuffer) {
            return null;
        }

        // Read which buffer is ready
        const activeBuffer = Atomics.load(this.controlBuffer, CONTROL_OFFSETS.ACTIVE_BUFFER / 4);
        const workerFrame = Atomics.load(this.controlBuffer, CONTROL_OFFSETS.WORKER_FRAME / 4);

        // Check if there's a new frame
        if (workerFrame === this.lastReadFrame) {
            // No new frame, return current reader
            return this.currentReader;
        }

        // Update to new frame
        this.lastReadFrame = workerFrame;
        this.currentReader = this.readers[activeBuffer];

        // Signal that we've read this frame
        Atomics.store(this.controlBuffer, CONTROL_OFFSETS.MAIN_FRAME / 4, workerFrame);

        return this.currentReader;
    }

    /**
     * Get a snapshot object for legacy compatibility.
     */
    getSnapshot(): BinarySnapshot | null {
        const reader = this.getSnapshotReader();
        if (!reader) return null;

        return {
            reader,
            frameId: this.lastReadFrame
        };
    }

    /**
     * Check if a new frame is available.
     */
    hasNewFrame(): boolean {
        if (!this.controlBuffer) return false;
        const workerFrame = Atomics.load(this.controlBuffer, CONTROL_OFFSETS.WORKER_FRAME / 4);
        return workerFrame !== this.lastReadFrame;
    }

    /**
     * Wait for a new frame (blocking).
     * @param timeoutMs Maximum time to wait
     * @returns True if a new frame arrived, false on timeout
     */
    waitForFrame(timeoutMs: number = 16): boolean {
        if (!this.controlBuffer) return false;

        const result = Atomics.wait(
            this.controlBuffer,
            CONTROL_OFFSETS.WORKER_FRAME / 4,
            this.lastReadFrame,
            timeoutMs
        );

        return result === 'ok';
    }

    // ─────────────────────────────────────────────────────────────
    // EngineInterface Implementation (Legacy Compatibility)
    // ─────────────────────────────────────────────────────────────

    send(cmd: EngineCommand): void {
        if (this.isDisposed) {
            console.warn('[SimulationBridge] Attempted to send after dispose');
            return;
        }

        // Map EngineCommand to WorkerCommand
        switch (cmd.type) {
            case 'INIT':
                this.init(cmd.config);
                break;
            case 'RESET':
                this.reset(cmd.profile);
                break;
            case 'START':
                this.start();
                break;
            case 'PAUSE':
                this.pause();
                break;
            case 'RESUME':
                this.resume();
                break;
            case 'INPUT':
                this.pushInput(cmd.input);
                break;
            case 'SET_MODAL':
                this.setModal(cmd.modal);
                break;
            case 'DISPOSE':
                this.dispose();
                break;
        }
    }

    subscribe(callback: (evt: EngineEvent) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // ─────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────

    dispose(): void {
        if (this.isDisposed) return;

        this.isDisposed = true;

        // Set dispose flag
        if (this.controlBuffer) {
            Atomics.store(this.controlBuffer, CONTROL_OFFSETS.DISPOSE_FLAG / 4, 1);
        }

        // Send dispose command
        this.worker.postMessage({ type: 'DISPOSE' });

        // Terminate after cleanup
        setTimeout(() => {
            this.worker.terminate();
            this.subscribers.clear();
            this.buffers = null;
            this.readers = null;
            this.controlBuffer = null;
            this.inputWriter = null;
            console.log('[SimulationBridge] Disposed');
        }, 100);
    }

    /**
     * Check if the bridge is ready.
     */
    get ready(): boolean {
        return this.isReady;
    }

    // ─────────────────────────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────────────────────────

    private handleWorkerMessage(event: any): void {
        // Handle worker events
        if (event.type === 'READY') {
            this.isReady = true;
        }

        // Dispatch to subscribers
        for (const callback of this.subscribers) {
            try {
                callback(event as EngineEvent);
            } catch (error) {
                console.error('[SimulationBridge] Subscriber error:', error);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON FACTORY
// ═══════════════════════════════════════════════════════════════

let bridgeInstance: SimulationBridge | null = null;

/**
 * Get or create the global SimulationBridge instance.
 */
export function getSimulationBridge(): SimulationBridge {
    if (!bridgeInstance) {
        bridgeInstance = new SimulationBridge();
    }
    return bridgeInstance;
}

/**
 * Dispose the global SimulationBridge instance.
 */
export function disposeSimulationBridge(): void {
    if (bridgeInstance) {
        bridgeInstance.dispose();
        bridgeInstance = null;
    }
}
