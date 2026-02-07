/**
 * Shader Filter Manager
 *
 * Singleton manager for GPU shader effects.
 * Handles filter lifecycle, LOD management, and settings synchronization.
 */

import { Container } from 'pixi.js';
import {
    ScanlineFilter,
    BloomFilter,
    ChromaticAberrationFilter,
    CRTFilter,
} from './filters';
import { ShaderQuality, LOD_RULES, LODRule } from './types';

// FPS history for auto-LOD
const FPS_HISTORY_SIZE = 30;
const DOWNGRADE_THRESHOLD_FRAMES = 20; // Frames below threshold to trigger downgrade
const UPGRADE_THRESHOLD_FRAMES = 30;   // Frames above threshold to trigger upgrade

class ShaderFilterManagerClass {
    private static _instance: ShaderFilterManagerClass | null = null;

    // Filters
    private scanlineFilter: ScanlineFilter | null = null;
    private bloomFilter: BloomFilter | null = null;
    private chromaticFilter: ChromaticAberrationFilter | null = null;
    private crtFilter: CRTFilter | null = null;

    // Target container
    private container: Container | null = null;

    // Settings
    private _quality: ShaderQuality = 'AUTO';
    private _userQuality: ShaderQuality = 'AUTO'; // User's preference ceiling
    private _effectiveQuality: Exclude<ShaderQuality, 'AUTO'> = 'HIGH';
    private _crtEnabled: boolean = true;
    private _fxIntensity: number = 1.0;

    // Auto-LOD state
    private fpsHistory: number[] = [];
    private lowFpsFrames: number = 0;
    private highFpsFrames: number = 0;

    // Dimensions
    private _width: number = 1920;
    private _height: number = 1080;

    private constructor() {}

    static getInstance(): ShaderFilterManagerClass {
        if (!ShaderFilterManagerClass._instance) {
            ShaderFilterManagerClass._instance = new ShaderFilterManagerClass();
        }
        return ShaderFilterManagerClass._instance;
    }

    /**
     * Initialize shader filters on a Pixi container.
     */
    init(container: Container, width: number = 1920, height: number = 1080): void {
        if (this.container) {
            console.warn('[ShaderFilterManager] Already initialized');
            return;
        }

        this.container = container;
        this._width = width;
        this._height = height;

        // Create filter instances
        this.scanlineFilter = new ScanlineFilter({ intensity: 0.15 });
        this.bloomFilter = new BloomFilter({ width, height, samples: 9 });
        this.chromaticFilter = new ChromaticAberrationFilter({ width, height, intensity: 0 });
        this.crtFilter = new CRTFilter({ width, height });

        // Apply initial filter chain
        this.rebuildFilterChain();

        console.log('[ShaderFilterManager] Initialized');
    }

    /**
     * Update animated uniforms and handle auto-LOD.
     * @param dt Delta time in seconds
     * @param fps Current FPS
     */
    update(dt: number, fps: number): void {
        if (!this.container) return;

        // Update animated filters
        if (this.scanlineFilter && this._effectiveQuality !== 'OFF') {
            this.scanlineFilter.update(dt);
        }
        if (this.crtFilter && this._effectiveQuality !== 'OFF' && this._crtEnabled) {
            this.crtFilter.update(dt);
        }

        // Auto-LOD logic
        if (this._quality === 'AUTO') {
            this.updateAutoLOD(fps);
        }
    }

    /**
     * Apply settings from game state.
     */
    applySettings(crtEffect: boolean, fxIntensity: number): void {
        this._crtEnabled = crtEffect;
        this._fxIntensity = fxIntensity;

        // Adjust filter intensities based on fxIntensity
        if (this.scanlineFilter) {
            const rule = LOD_RULES[this._effectiveQuality];
            this.scanlineFilter.intensity = rule.scanlinesIntensity * fxIntensity;
        }
        if (this.bloomFilter) {
            this.bloomFilter.intensity = 0.5 * fxIntensity;
        }
        if (this.crtFilter) {
            this.crtFilter.scanlineIntensity = 0.15 * fxIntensity;
            this.crtFilter.vignetteIntensity = 0.3 * fxIntensity;
        }

        this.rebuildFilterChain();
    }

    /**
     * Set chromatic aberration intensity (for death effect).
     */
    setChromaticIntensity(intensity: number): void {
        if (this.chromaticFilter) {
            this.chromaticFilter.intensity = intensity;
        }
    }

    /**
     * Set quality level manually.
     */
    setQuality(quality: ShaderQuality): void {
        this._quality = quality;
        this._userQuality = quality;

        if (quality === 'AUTO') {
            // Reset auto-LOD state
            this.fpsHistory = [];
            this.lowFpsFrames = 0;
            this.highFpsFrames = 0;
            this._effectiveQuality = 'HIGH';
        } else {
            this._effectiveQuality = quality;
        }

        this.rebuildFilterChain();
    }

    /**
     * Update dimensions for resolution-dependent effects.
     */
    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;

        if (this.bloomFilter) {
            this.bloomFilter.setDimensions(width, height);
        }
        if (this.chromaticFilter) {
            this.chromaticFilter.setDimensions(width, height);
        }
        if (this.crtFilter) {
            this.crtFilter.setDimensions(width, height);
        }
    }

    /**
     * Get current effective quality level.
     */
    getEffectiveQuality(): Exclude<ShaderQuality, 'AUTO'> {
        return this._effectiveQuality;
    }

    /**
     * Check if shaders are active.
     */
    isActive(): boolean {
        return this._effectiveQuality !== 'OFF' && this.container !== null;
    }

    /**
     * Destroy all filters and release resources.
     */
    destroy(): void {
        if (this.container) {
            // Use null to fully bypass filter processing
            this.container.filters = null;
        }

        this.scanlineFilter?.destroy();
        this.bloomFilter?.destroy();
        this.chromaticFilter?.destroy();
        this.crtFilter?.destroy();

        this.scanlineFilter = null;
        this.bloomFilter = null;
        this.chromaticFilter = null;
        this.crtFilter = null;
        this.container = null;

        this.fpsHistory = [];
        this.lowFpsFrames = 0;
        this.highFpsFrames = 0;

        console.log('[ShaderFilterManager] Destroyed');
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────

    private rebuildFilterChain(): void {
        if (!this.container) return;

        // POTATO/OFF hard-floor: bypass filter array entirely for zero-overhead rendering
        // Setting filters to null avoids render-texture swaps on integrated GPUs
        if (this._effectiveQuality === 'OFF') {
            this.container.filters = null;
            return;
        }

        const rule = LOD_RULES[this._effectiveQuality];
        const filters: any[] = [];

        // Bloom (first pass for glow)
        if (this.bloomFilter && rule.bloomSamples > 0) {
            this.bloomFilter.samples = rule.bloomSamples as 0 | 5 | 9;
            filters.push(this.bloomFilter);
        }

        // Chromatic aberration (always available for death effect)
        if (this.chromaticFilter && rule.chromaticEnabled) {
            filters.push(this.chromaticFilter);
        }

        // CRT or standalone scanlines
        if (this._crtEnabled && this.crtFilter && rule.crtEnabled) {
            // Use combined CRT filter
            filters.push(this.crtFilter);
        } else if (this.scanlineFilter && rule.scanlinesEnabled) {
            // Use standalone scanlines
            this.scanlineFilter.intensity = rule.scanlinesIntensity * this._fxIntensity;
            filters.push(this.scanlineFilter);
        }

        // Use null for empty filter list to avoid unnecessary render passes
        this.container.filters = filters.length > 0 ? filters : null;
    }

    private updateAutoLOD(fps: number): void {
        // Add FPS to history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > FPS_HISTORY_SIZE) {
            this.fpsHistory.shift();
        }

        // Calculate rolling average
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        // Get current rule thresholds
        const currentRule = LOD_RULES[this._effectiveQuality];
        const qualities: Exclude<ShaderQuality, 'AUTO'>[] = ['HIGH', 'MEDIUM', 'LOW', 'OFF'];
        const currentIndex = qualities.indexOf(this._effectiveQuality);

        // Check for downgrade
        if (avgFps < currentRule.fpsThreshold && currentIndex < qualities.length - 1) {
            this.lowFpsFrames++;
            this.highFpsFrames = 0;

            if (this.lowFpsFrames >= DOWNGRADE_THRESHOLD_FRAMES) {
                this.attemptDowngrade();
                this.lowFpsFrames = 0;
            }
        }
        // Check for upgrade
        else if (currentIndex > 0) {
            const higherQuality = qualities[currentIndex - 1];
            const higherRule = LOD_RULES[higherQuality];

            if (avgFps >= higherRule.fpsThreshold) {
                this.highFpsFrames++;
                this.lowFpsFrames = 0;

                if (this.highFpsFrames >= UPGRADE_THRESHOLD_FRAMES) {
                    this.attemptUpgrade();
                    this.highFpsFrames = 0;
                }
            } else {
                // In stable zone
                this.lowFpsFrames = 0;
                this.highFpsFrames = 0;
            }
        } else {
            // Reset counters when stable
            this.lowFpsFrames = 0;
            this.highFpsFrames = 0;
        }
    }

    private attemptDowngrade(): void {
        const qualities: Exclude<ShaderQuality, 'AUTO'>[] = ['HIGH', 'MEDIUM', 'LOW', 'OFF'];
        const currentIndex = qualities.indexOf(this._effectiveQuality);

        if (currentIndex < qualities.length - 1) {
            this._effectiveQuality = qualities[currentIndex + 1];
            console.log(`[ShaderFilterManager] Auto-LOD downgrade to ${this._effectiveQuality}`);
            this.rebuildFilterChain();
        }
    }

    private attemptUpgrade(): void {
        const qualities: Exclude<ShaderQuality, 'AUTO'>[] = ['HIGH', 'MEDIUM', 'LOW', 'OFF'];
        const currentIndex = qualities.indexOf(this._effectiveQuality);

        if (currentIndex > 0) {
            const targetQuality = qualities[currentIndex - 1];

            // Respect user ceiling preference
            if (this._userQuality !== 'AUTO') {
                const userIndex = qualities.indexOf(this._userQuality as Exclude<ShaderQuality, 'AUTO'>);
                if (currentIndex - 1 < userIndex) {
                    return; // Would exceed user preference
                }
            }

            this._effectiveQuality = targetQuality;
            console.log(`[ShaderFilterManager] Auto-LOD upgrade to ${this._effectiveQuality}`);
            this.rebuildFilterChain();
        }
    }
}

// Export singleton instance
export const shaderFilterManager = ShaderFilterManagerClass.getInstance();
export { ShaderFilterManagerClass };
