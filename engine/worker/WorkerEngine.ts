/**
 * WorkerEngine
 * 
 * Main thread adapter that implements EngineInterface.
 * Proxies commands to the simulation Worker.
 * Dispatches events to subscribers.
 */

import { EngineCommand, EngineEvent, EngineInterface } from '../messages';

// ═══════════════════════════════════════════════════════════════
// WORKER ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

export class WorkerEngine implements EngineInterface {
    private worker: Worker;
    private subscribers: Set<(evt: EngineEvent) => void> = new Set();
    private isDisposed = false;

    constructor() {
        // Create Worker using Vite's native Worker support
        // The ?worker suffix tells Vite to bundle this as a separate worker chunk
        this.worker = new Worker(
            new URL('./simulation.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Handle messages from Worker
        this.worker.onmessage = (event: MessageEvent<EngineEvent>) => {
            this.dispatch(event.data);
        };

        // Handle Worker errors
        this.worker.onerror = (error) => {
            console.error('[WorkerEngine] Worker error:', error);
        };

        console.log('[WorkerEngine] Created');
    }

    // ─────────────────────────────────────────────────────────────
    // EngineInterface Implementation
    // ─────────────────────────────────────────────────────────────

    /**
     * Send a command to the simulation Worker.
     */
    send(cmd: EngineCommand): void {
        if (this.isDisposed) {
            console.warn('[WorkerEngine] Attempted to send after dispose');
            return;
        }

        this.worker.postMessage(cmd);
    }

    /**
     * Subscribe to events from the simulation.
     * Returns an unsubscribe function.
     */
    subscribe(callback: (evt: EngineEvent) => void): () => void {
        this.subscribers.add(callback);

        return () => {
            this.subscribers.delete(callback);
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────

    /**
     * Terminate the Worker and cleanup resources.
     */
    dispose(): void {
        if (this.isDisposed) return;

        this.isDisposed = true;
        this.send({ type: 'DISPOSE' });

        // Give Worker time to cleanup, then terminate
        setTimeout(() => {
            this.worker.terminate();
            this.subscribers.clear();
            console.log('[WorkerEngine] Disposed');
        }, 100);
    }

    // ─────────────────────────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────────────────────────

    private dispatch(event: EngineEvent): void {
        for (const callback of this.subscribers) {
            try {
                callback(event);
            } catch (error) {
                console.error('[WorkerEngine] Subscriber error:', error);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

let engineInstance: WorkerEngine | null = null;

/**
 * Get or create the global WorkerEngine instance.
 */
export function getWorkerEngine(): WorkerEngine {
    if (!engineInstance) {
        engineInstance = new WorkerEngine();
    }
    return engineInstance;
}

/**
 * Dispose the global WorkerEngine instance.
 */
export function disposeWorkerEngine(): void {
    if (engineInstance) {
        engineInstance.dispose();
        engineInstance = null;
    }
}
