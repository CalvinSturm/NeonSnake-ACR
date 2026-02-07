/**
 * Telemetry System
 *
 * Runtime performance metrics and dynamic quality scaling.
 * Tracks frame time, simulation time, render time, and draw calls.
 */

import {
    QualityLevel,
    QualitySettings,
    QualityThresholds,
    DEFAULT_QUALITY_THRESHOLDS,
    QUALITY_PRESETS,
    QUALITY_LEVELS,
    getNextLowerQuality,
    getNextHigherQuality,
    getQualitySettings,
} from '../config/quality';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FrameMetrics {
    /** Total frame time in ms */
    frameTime: number;
    /** Simulation/update time in ms */
    simulationTime: number;
    /** Render/draw time in ms */
    renderTime: number;
    /** Number of draw calls this frame */
    drawCalls: number;
    /** Current FPS (smoothed) */
    fps: number;
    /** Timestamp of this frame */
    timestamp: number;
}

export interface TelemetrySnapshot {
    /** Current frame metrics */
    current: FrameMetrics;
    /** Rolling averages (last N frames) */
    averages: FrameMetrics;
    /** Peak values (worst case in window) */
    peaks: FrameMetrics;
    /** Current quality level */
    qualityLevel: QualityLevel;
    /** User's maximum quality preference */
    qualityCeiling: QualityLevel;
    /** Whether auto-scaling is enabled */
    autoScaleEnabled: boolean;
    /** Frames since last quality change */
    framesSinceQualityChange: number;
}

export type QualityChangeCallback = (
    newLevel: QualityLevel,
    settings: QualitySettings,
    reason: 'upgrade' | 'downgrade' | 'emergency' | 'manual'
) => void;

// ═══════════════════════════════════════════════════════════════
// TELEMETRY CLASS
// ═══════════════════════════════════════════════════════════════

class TelemetrySystem {
    private static _instance: TelemetrySystem | null = null;

    // Configuration
    private thresholds: QualityThresholds = { ...DEFAULT_QUALITY_THRESHOLDS };
    private historySize: number = 60; // 1 second at 60fps

    // State
    private history: FrameMetrics[] = [];
    private currentQuality: QualityLevel = 'HIGH';
    private qualityCeiling: QualityLevel = 'ULTRA';
    private autoScaleEnabled: boolean = true;

    // Timing state
    private frameStartTime: number = 0;
    private simulationStartTime: number = 0;
    private renderStartTime: number = 0;
    private lastFrameTime: number = 0;
    private currentSimulationTime: number = 0;
    private currentRenderTime: number = 0;
    private currentDrawCalls: number = 0;

    // Quality scaling state
    private lowFpsFrameCount: number = 0;
    private highFpsFrameCount: number = 0;
    private framesSinceQualityChange: number = 0;
    private qualityChangeCallbacks: QualityChangeCallback[] = [];

    // FPS smoothing
    private fpsHistory: number[] = [];
    private readonly FPS_SMOOTH_FRAMES = 30;

    private constructor() {}

    static getInstance(): TelemetrySystem {
        if (!TelemetrySystem._instance) {
            TelemetrySystem._instance = new TelemetrySystem();
        }
        return TelemetrySystem._instance;
    }

    // ─────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────

    /**
     * Configure quality thresholds.
     */
    setThresholds(thresholds: Partial<QualityThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    /**
     * Get current thresholds.
     */
    getThresholds(): QualityThresholds {
        return { ...this.thresholds };
    }

    /**
     * Set the maximum quality level (user preference ceiling).
     */
    setQualityCeiling(level: QualityLevel): void {
        this.qualityCeiling = level;
        // If current quality exceeds ceiling, downgrade immediately
        const ceilingIndex = QUALITY_LEVELS.indexOf(level);
        const currentIndex = QUALITY_LEVELS.indexOf(this.currentQuality);
        if (currentIndex < ceilingIndex) {
            this.setQuality(level, 'manual');
        }
    }

    /**
     * Enable or disable auto-scaling.
     */
    setAutoScale(enabled: boolean): void {
        this.autoScaleEnabled = enabled;
        if (!enabled) {
            this.lowFpsFrameCount = 0;
            this.highFpsFrameCount = 0;
        }
    }

    /**
     * Manually set quality level.
     */
    setQuality(level: QualityLevel, reason: 'manual' | 'upgrade' | 'downgrade' | 'emergency' = 'manual'): void {
        if (level === this.currentQuality) return;

        // Respect ceiling
        const ceilingIndex = QUALITY_LEVELS.indexOf(this.qualityCeiling);
        const targetIndex = QUALITY_LEVELS.indexOf(level);
        if (targetIndex < ceilingIndex) {
            level = this.qualityCeiling;
        }

        const oldLevel = this.currentQuality;
        this.currentQuality = level;
        this.framesSinceQualityChange = 0;
        this.lowFpsFrameCount = 0;
        this.highFpsFrameCount = 0;

        const settings = getQualitySettings(level);
        console.log(`[Telemetry] Quality ${reason}: ${oldLevel} -> ${level}`);

        // Notify listeners
        for (const callback of this.qualityChangeCallbacks) {
            callback(level, settings, reason);
        }
    }

    /**
     * Subscribe to quality changes.
     */
    onQualityChange(callback: QualityChangeCallback): () => void {
        this.qualityChangeCallbacks.push(callback);
        return () => {
            const index = this.qualityChangeCallbacks.indexOf(callback);
            if (index >= 0) {
                this.qualityChangeCallbacks.splice(index, 1);
            }
        };
    }

    // ─────────────────────────────────────────────────────────────
    // TIMING MARKERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Mark the start of a frame.
     */
    beginFrame(): void {
        this.frameStartTime = performance.now();
    }

    /**
     * Mark the start of simulation/update phase.
     */
    beginSimulation(): void {
        this.simulationStartTime = performance.now();
    }

    /**
     * Mark the end of simulation/update phase.
     */
    endSimulation(): void {
        this.currentSimulationTime = performance.now() - this.simulationStartTime;
    }

    /**
     * Mark the start of render phase.
     */
    beginRender(): void {
        this.renderStartTime = performance.now();
    }

    /**
     * Mark the end of render phase.
     */
    endRender(): void {
        this.currentRenderTime = performance.now() - this.renderStartTime;
    }

    /**
     * Set draw call count for this frame.
     */
    setDrawCalls(count: number): void {
        this.currentDrawCalls = count;
    }

    /**
     * Mark the end of a frame and record metrics.
     */
    endFrame(): void {
        const now = performance.now();
        const frameTime = now - this.frameStartTime;
        const rawFps = frameTime > 0 ? 1000 / frameTime : 60;

        // Smooth FPS
        this.fpsHistory.push(rawFps);
        if (this.fpsHistory.length > this.FPS_SMOOTH_FRAMES) {
            this.fpsHistory.shift();
        }
        const smoothedFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        const metrics: FrameMetrics = {
            frameTime,
            simulationTime: this.currentSimulationTime,
            renderTime: this.currentRenderTime,
            drawCalls: this.currentDrawCalls,
            fps: Math.round(smoothedFps),
            timestamp: now,
        };

        // Add to history
        this.history.push(metrics);
        if (this.history.length > this.historySize) {
            this.history.shift();
        }

        this.lastFrameTime = frameTime;
        this.framesSinceQualityChange++;

        // Update quality scaling
        if (this.autoScaleEnabled) {
            this.evaluateQualityScaling(metrics);
        }

        // Reset per-frame counters
        this.currentSimulationTime = 0;
        this.currentRenderTime = 0;
        this.currentDrawCalls = 0;
    }

    // ─────────────────────────────────────────────────────────────
    // METRICS ACCESS
    // ─────────────────────────────────────────────────────────────

    /**
     * Get current quality level.
     */
    getQualityLevel(): QualityLevel {
        return this.currentQuality;
    }

    /**
     * Get current quality settings.
     */
    getQualitySettings(): QualitySettings {
        return getQualitySettings(this.currentQuality);
    }

    /**
     * Get the latest frame metrics.
     */
    getCurrentMetrics(): FrameMetrics | null {
        return this.history.length > 0 ? { ...this.history[this.history.length - 1] } : null;
    }

    /**
     * Get rolling average metrics.
     */
    getAverageMetrics(): FrameMetrics {
        if (this.history.length === 0) {
            return {
                frameTime: 16.67,
                simulationTime: 0,
                renderTime: 0,
                drawCalls: 0,
                fps: 60,
                timestamp: performance.now(),
            };
        }

        const sum = this.history.reduce(
            (acc, m) => ({
                frameTime: acc.frameTime + m.frameTime,
                simulationTime: acc.simulationTime + m.simulationTime,
                renderTime: acc.renderTime + m.renderTime,
                drawCalls: acc.drawCalls + m.drawCalls,
                fps: acc.fps + m.fps,
                timestamp: m.timestamp,
            }),
            { frameTime: 0, simulationTime: 0, renderTime: 0, drawCalls: 0, fps: 0, timestamp: 0 }
        );

        const count = this.history.length;
        return {
            frameTime: sum.frameTime / count,
            simulationTime: sum.simulationTime / count,
            renderTime: sum.renderTime / count,
            drawCalls: Math.round(sum.drawCalls / count),
            fps: Math.round(sum.fps / count),
            timestamp: sum.timestamp,
        };
    }

    /**
     * Get peak (worst) metrics in the history window.
     */
    getPeakMetrics(): FrameMetrics {
        if (this.history.length === 0) {
            return {
                frameTime: 16.67,
                simulationTime: 0,
                renderTime: 0,
                drawCalls: 0,
                fps: 60,
                timestamp: performance.now(),
            };
        }

        return {
            frameTime: Math.max(...this.history.map((m) => m.frameTime)),
            simulationTime: Math.max(...this.history.map((m) => m.simulationTime)),
            renderTime: Math.max(...this.history.map((m) => m.renderTime)),
            drawCalls: Math.max(...this.history.map((m) => m.drawCalls)),
            fps: Math.min(...this.history.map((m) => m.fps)), // Worst FPS is lowest
            timestamp: this.history[this.history.length - 1].timestamp,
        };
    }

    /**
     * Get a full telemetry snapshot.
     */
    getSnapshot(): TelemetrySnapshot {
        return {
            current: this.getCurrentMetrics() ?? this.getAverageMetrics(),
            averages: this.getAverageMetrics(),
            peaks: this.getPeakMetrics(),
            qualityLevel: this.currentQuality,
            qualityCeiling: this.qualityCeiling,
            autoScaleEnabled: this.autoScaleEnabled,
            framesSinceQualityChange: this.framesSinceQualityChange,
        };
    }

    /**
     * Format metrics for debug display.
     */
    formatDebug(): string[] {
        const avg = this.getAverageMetrics();
        const current = this.getCurrentMetrics();

        return [
            `Quality: ${this.currentQuality}${this.autoScaleEnabled ? ' (auto)' : ''}`,
            `FPS: ${current?.fps ?? 0} (avg: ${avg.fps})`,
            `Frame: ${avg.frameTime.toFixed(2)}ms`,
            `Sim: ${avg.simulationTime.toFixed(2)}ms`,
            `Render: ${avg.renderTime.toFixed(2)}ms`,
            `Draws: ${avg.drawCalls}`,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────

    private evaluateQualityScaling(metrics: FrameMetrics): void {
        // Emergency downgrade on severe frame spike
        if (metrics.frameTime > this.thresholds.emergencyFrameTimeMs) {
            const nextLower = getNextLowerQuality(this.currentQuality);
            if (nextLower) {
                this.setQuality(nextLower, 'emergency');
            }
            return;
        }

        // Cooldown period after quality change
        if (this.framesSinceQualityChange < 30) {
            return;
        }

        // Check for sustained low FPS
        if (metrics.fps < this.thresholds.downgradeFps) {
            this.lowFpsFrameCount++;
            this.highFpsFrameCount = 0;

            if (this.lowFpsFrameCount >= this.thresholds.downgradeFrames) {
                const nextLower = getNextLowerQuality(this.currentQuality);
                if (nextLower) {
                    this.setQuality(nextLower, 'downgrade');
                }
            }
        }
        // Check for sustained high FPS (potential upgrade)
        else if (metrics.fps >= this.thresholds.upgradeFps) {
            this.highFpsFrameCount++;
            this.lowFpsFrameCount = 0;

            if (this.highFpsFrameCount >= this.thresholds.upgradeFrames) {
                const nextHigher = getNextHigherQuality(this.currentQuality);
                if (nextHigher) {
                    // Check ceiling
                    const ceilingIndex = QUALITY_LEVELS.indexOf(this.qualityCeiling);
                    const targetIndex = QUALITY_LEVELS.indexOf(nextHigher);
                    if (targetIndex >= ceilingIndex) {
                        this.setQuality(nextHigher, 'upgrade');
                    }
                }
            }
        }
        // Stable - reset counters
        else {
            this.lowFpsFrameCount = Math.max(0, this.lowFpsFrameCount - 1);
            this.highFpsFrameCount = Math.max(0, this.highFpsFrameCount - 1);
        }
    }

    /**
     * Reset all telemetry state.
     */
    reset(): void {
        this.history = [];
        this.fpsHistory = [];
        this.lowFpsFrameCount = 0;
        this.highFpsFrameCount = 0;
        this.framesSinceQualityChange = 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

export const telemetry = TelemetrySystem.getInstance();
export { TelemetrySystem };
