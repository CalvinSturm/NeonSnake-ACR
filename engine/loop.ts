/**
 * Authoritative Game Loop
 * 
 * Owns the single requestAnimationFrame. Drives SimulationWorld.
 * Decoupled from React - Worker-ready architecture.
 * 
 * Features:
 * - Fixed timestep simulation with interpolated rendering
 * - Background tab handling (visibilitychange)
 * - Pause/resume support
 * - Snapshot emission via callback (not function injection)
 */

import { SimulationWorld } from './simulation/SimulationWorld';
import { SimulationSnapshot, InputSnapshot, createEmptyInput } from './simulation/types';
import { telemetry } from '../tools/telemetry';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SnapshotCallback = (snapshot: SimulationSnapshot, alpha: number) => void;

// ═══════════════════════════════════════════════════════════════
// GAME LOOP CLASS
// ═══════════════════════════════════════════════════════════════

export class GameLoop {
    private world: SimulationWorld;
    private rafId: number = 0;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private isRunning: boolean = false;
    private isPaused: boolean = false;

    private pendingInput: InputSnapshot = createEmptyInput();
    private snapshotCallback: SnapshotCallback | null = null;

    private readonly FIXED_DT = 1000 / 60; // 16.66ms
    private readonly MAX_FRAME_DT = 100; // Clamp large dt (tab backgrounding)

    private boundTick: (time: number) => void;
    private boundVisibilityHandler: () => void;

    constructor(world: SimulationWorld) {
        this.world = world;
        this.boundTick = this.tick.bind(this);
        this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Start the game loop.
     */
    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.accumulator = 0;

        // Listen for tab visibility changes
        document.addEventListener('visibilitychange', this.boundVisibilityHandler);

        this.rafId = requestAnimationFrame(this.boundTick);
    }

    /**
     * Stop the game loop completely.
     */
    stop(): void {
        this.isRunning = false;
        this.isPaused = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }

        document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }

    /**
     * Pause the loop (keeps rAF running but skips simulation).
     */
    pause(): void {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.world.pause();
        }
    }

    /**
     * Resume from pause.
     */
    resume(): void {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.lastTime = performance.now(); // Reset time to avoid large dt
            this.accumulator = 0;
            this.world.resume();
        }
    }

    /**
     * Queue input for the next simulation step.
     * Input is consumed once per step.
     */
    setInput(input: InputSnapshot): void {
        this.pendingInput = input;
    }

    /**
     * Subscribe to snapshot emissions.
     * Returns an unsubscribe function.
     */
    subscribe(callback: SnapshotCallback): () => void {
        this.snapshotCallback = callback;
        return () => {
            this.snapshotCallback = null;
        };
    }

    /**
     * Check if the loop is currently running.
     */
    get isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Check if the loop is paused.
     */
    get paused(): boolean {
        return this.isPaused;
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────

    private tick(time: number): void {
        if (!this.isRunning) return;

        // Calculate frame delta, clamped to prevent spiral of death
        const frameDt = Math.min(this.MAX_FRAME_DT, time - this.lastTime);
        this.lastTime = time;

        // Only simulate if not paused
        if (!this.isPaused) {
            this.accumulator += frameDt;

            // Fixed timestep simulation
            while (this.accumulator >= this.FIXED_DT) {
                // Step simulation with pending input
                this.world.step(this.FIXED_DT, this.pendingInput);

                // Clear input after consumption (one input per step)
                this.pendingInput = createEmptyInput();

                this.accumulator -= this.FIXED_DT;
            }
        }

        // Calculate interpolation alpha for rendering
        const alpha = this.accumulator / this.FIXED_DT;

        // Emit snapshot for rendering
        if (this.snapshotCallback) {
            const snapshot = this.world.getSnapshot();
            this.snapshotCallback(snapshot, alpha);
        }

        // Schedule next frame
        this.rafId = requestAnimationFrame(this.boundTick);
    }

    private handleVisibilityChange(): void {
        if (document.hidden) {
            // Tab is hidden - pause to save resources
            this.pause();
        } else {
            // Tab is visible again - resume
            this.resume();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for gradual migration)
// These will be removed once useGameLoop is fully migrated
// ═══════════════════════════════════════════════════════════════

export type UpdateCallback = (dt: number) => void;
export type DrawCallback = (alpha: number) => void;

/**
 * @deprecated Use GameLoop with SimulationWorld instead
 */
export class LegacyGameLoop {
    private rafId: number = 0;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private isRunning: boolean = false;

    private readonly FIXED_DT = 1000 / 60;

    constructor(
        private onUpdate: UpdateCallback,
        private onDraw: DrawCallback
    ) { }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }

    public stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    private tick(time: number) {
        if (!this.isRunning) return;

        // Start frame timing
        telemetry.beginFrame();

        const frameDt = Math.min(100, time - this.lastTime);
        this.lastTime = time;
        this.accumulator += frameDt;

        // Simulation phase
        telemetry.beginSimulation();
        while (this.accumulator >= this.FIXED_DT) {
            this.onUpdate(this.FIXED_DT);
            this.accumulator -= this.FIXED_DT;
        }
        telemetry.endSimulation();

        // Render phase
        const alpha = this.accumulator / this.FIXED_DT;
        telemetry.beginRender();
        this.onDraw(alpha);
        telemetry.endRender();

        // End frame and record metrics
        telemetry.endFrame();

        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }

    public get isActive() {
        return this.isRunning;
    }
}
