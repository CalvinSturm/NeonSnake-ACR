/**
 * WebGL Render Manager
 * 
 * Orchestrates WebGL rendering alongside Canvas2D.
 * Provides dual-mode rendering during migration.
 * 
 * Usage:
 * 1. Call init() once with the canvas
 * 2. Call beginFrame() at start of each frame
 * 3. Call render*() methods for each entity type
 * 4. Call endFrame() to finalize and display
 */

import { Container, Application } from 'pixi.js';
import { gameRenderer, GameRenderer } from './renderer';
import { SpritePoolManager } from './spritePool';
import { textureCache } from './textures';
import {
    initParticleRenderer,
    renderParticlesWebGL,
    destroyParticleRenderer,
    getParticleStats
} from './renderers/particles';
import {
    initProjectileRenderer,
    destroyProjectileRenderer,
    getProjectileStats
} from './renderers/projectiles';
import {
    initEntityRenderer,
    destroyEntityRenderer,
    getEntityStats
} from './renderers/entities';
import { shaderFilterManager } from './shaders';
import { telemetry } from '../tools/telemetry';
import type { Particle, Projectile, Enemy } from '../types';
import type { ShaderQuality } from './shaders';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type RenderMode = 'canvas2d' | 'webgl' | 'hybrid';

export interface FrameMetrics {
    mode: RenderMode;
    drawCalls: number;
    spriteCount: number;
    textureCount: number;
    fps: number;
    particleCount: number;
    projectileCount: number;
    entityCount: number;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

interface RenderManagerState {
    isInitialized: boolean;
    mode: RenderMode;
    canvas: HTMLCanvasElement | null;
    poolManager: SpritePoolManager | null;

    // Per-frame metrics
    frameMetrics: FrameMetrics;

    // Layers for different rendering purposes
    fxContainer: Container | null;
    entityContainer: Container | null;
    projectileContainer: Container | null;
}

const state: RenderManagerState = {
    isInitialized: false,
    mode: 'hybrid', // Start in hybrid mode for gradual migration
    canvas: null,
    poolManager: null,
    frameMetrics: {
        mode: 'hybrid',
        drawCalls: 0,
        spriteCount: 0,
        textureCount: 0,
        fps: 60,
        particleCount: 0,
        projectileCount: 0,
        entityCount: 0,
    },
    fxContainer: null,
    entityContainer: null,
    projectileContainer: null,
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the WebGL render manager.
 * Creates a separate canvas for WebGL rendering that overlays the Canvas2D.
 */
export async function initWebGLRenderManager(
    canvas2d: HTMLCanvasElement,
    mode: RenderMode = 'hybrid'
): Promise<boolean> {
    if (state.isInitialized) {
        console.warn('[WebGLRenderManager] Already initialized');
        return true;
    }

    try {
        state.mode = mode;
        state.canvas = canvas2d;

        // For hybrid mode, we create a WebGL canvas that renders on top
        // For pure WebGL mode, we take over the canvas completely

        const width = canvas2d.width;
        const height = canvas2d.height;

        // Initialize the core renderer
        await gameRenderer.init(canvas2d, {
            width,
            height,
            backgroundColor: 0x020202,
            antialias: false,
            resolution: window.devicePixelRatio,
        });

        // Initialize texture cache
        if (gameRenderer.pixiApp) {
            textureCache.init(gameRenderer.pixiApp);
        }

        // Create layer containers
        const gameLayer = gameRenderer.gameLayer;
        if (gameLayer) {
            // FX layer (particles, shockwaves) - rendered first (behind)
            state.fxContainer = new Container();
            state.fxContainer.sortableChildren = false;
            gameLayer.addChild(state.fxContainer);

            // Entity layer (enemies, snake) - rendered in middle
            state.entityContainer = new Container();
            state.entityContainer.sortableChildren = true;
            gameLayer.addChild(state.entityContainer);

            // Projectile layer - rendered on top
            state.projectileContainer = new Container();
            state.projectileContainer.sortableChildren = false;
            gameLayer.addChild(state.projectileContainer);

            // Initialize sprite pool manager
            state.poolManager = new SpritePoolManager(gameLayer);

            // Initialize particle renderer
            initParticleRenderer(state.fxContainer);

            // Initialize projectile renderer
            initProjectileRenderer(state.projectileContainer!);

            // Initialize entity renderer
            initEntityRenderer(state.entityContainer!, 24);

            // Initialize shader filter manager on the stage
            if (gameRenderer.stage) {
                shaderFilterManager.init(gameRenderer.stage, width, height);
            }

            // Connect telemetry quality changes to shader system
            telemetry.onQualityChange((level, settings) => {
                // Map quality level to shader quality
                const shaderQualityMap: Record<string, ShaderQuality> = {
                    'ULTRA': 'HIGH',
                    'HIGH': 'HIGH',
                    'MEDIUM': 'MEDIUM',
                    'LOW': 'LOW',
                    'POTATO': 'OFF',
                };
                const shaderQuality = shaderQualityMap[level] ?? 'AUTO';
                shaderFilterManager.setQuality(shaderQuality);
                shaderFilterManager.applySettings(settings.crtEnabled, settings.glowIntensity);
            });
        }

        state.isInitialized = true;
        console.log(`[WebGLRenderManager] Initialized in ${mode} mode`);
        return true;

    } catch (error) {
        console.error('[WebGLRenderManager] Initialization failed:', error);
        state.mode = 'canvas2d'; // Fallback to Canvas2D
        return false;
    }
}

/**
 * Check if WebGL rendering is available.
 */
export function isWebGLReady(): boolean {
    return state.isInitialized && state.mode !== 'canvas2d';
}

/**
 * Get current render mode.
 */
export function getRenderMode(): RenderMode {
    return state.mode;
}

/**
 * Switch render mode.
 */
export function setRenderMode(mode: RenderMode): void {
    state.mode = mode;
    state.frameMetrics.mode = mode;
}

// ═══════════════════════════════════════════════════════════════
// FRAME LIFECYCLE
// ═══════════════════════════════════════════════════════════════

/**
 * Begin a new frame.
 * Resets per-frame state and prepares for rendering.
 */
export function beginFrame(): void {
    if (!state.isInitialized) return;

    // Reset frame metrics
    state.frameMetrics.particleCount = 0;
    state.frameMetrics.projectileCount = 0;
    state.frameMetrics.entityCount = 0;

    // Release all pooled sprites
    if (state.poolManager) {
        state.poolManager.releaseAll();
    }
}

/**
 * End the frame and update metrics.
 */
export function endFrame(): void {
    if (!state.isInitialized) return;

    // Collect metrics
    const rendererMetrics = gameRenderer.getMetrics();
    const poolStats = state.poolManager?.getStats() ?? { total: 0, active: 0, pools: 0 };
    const textureStats = textureCache.getStats();
    const particleStats = getParticleStats();

    // Update shader filter manager (dt in seconds, approximately 16.67ms per frame)
    shaderFilterManager.update(1 / 60, rendererMetrics.fps);

    // Report draw calls to telemetry
    telemetry.setDrawCalls(rendererMetrics.drawCalls);

    state.frameMetrics = {
        mode: state.mode,
        drawCalls: rendererMetrics.drawCalls,
        spriteCount: poolStats.active + particleStats.active,
        textureCount: textureStats.count,
        fps: rendererMetrics.fps,
        particleCount: particleStats.active,
        projectileCount: state.frameMetrics.projectileCount,
        entityCount: state.frameMetrics.entityCount,
    };
}

// ═══════════════════════════════════════════════════════════════
// RENDER METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Render particles using WebGL.
 * Returns true if WebGL was used, false if should fall back to Canvas2D.
 */
export function renderParticles(particles: Particle[]): boolean {
    if (!state.isInitialized || state.mode === 'canvas2d') {
        return false;
    }

    const count = renderParticlesWebGL(particles);
    state.frameMetrics.particleCount = count;
    return true;
}

/**
 * Apply camera transform to WebGL renderer.
 */
export function applyCameraTransform(
    cameraX: number,
    cameraY: number,
    zoom: number,
    shakeX: number = 0,
    shakeY: number = 0
): void {
    if (!state.isInitialized) return;

    gameRenderer.setCamera(cameraX, cameraY, zoom);
    if (shakeX !== 0 || shakeY !== 0) {
        gameRenderer.setShake(shakeX, shakeY);
    }
}

// ═══════════════════════════════════════════════════════════════
// METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current frame metrics.
 */
export function getFrameMetrics(): FrameMetrics {
    return { ...state.frameMetrics };
}

/**
 * Format metrics as debug string.
 */
export function formatMetricsDebug(): string[] {
    const m = state.frameMetrics;
    const shaderQuality = shaderFilterManager.isActive()
        ? shaderFilterManager.getEffectiveQuality()
        : 'OFF';
    const telemetryAvg = telemetry.getAverageMetrics();

    return [
        `Mode: ${m.mode.toUpperCase()}`,
        `FPS: ${m.fps}`,
        `Draw Calls: ${m.drawCalls}`,
        `Sprites: ${m.spriteCount}`,
        `Textures: ${m.textureCount}`,
        `Particles: ${m.particleCount}`,
        `Projectiles: ${m.projectileCount}`,
        `Entities: ${m.entityCount}`,
        `Shaders: ${shaderQuality}`,
        `Quality: ${telemetry.getQualityLevel()}`,
        `Frame: ${telemetryAvg.frameTime.toFixed(1)}ms`,
        `Sim: ${telemetryAvg.simulationTime.toFixed(1)}ms`,
        `Render: ${telemetryAvg.renderTime.toFixed(1)}ms`,
    ];
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

/**
 * Destroy the render manager and release all resources.
 */
export function destroyWebGLRenderManager(): void {
    destroyParticleRenderer();
    destroyProjectileRenderer();
    destroyEntityRenderer();

    // Destroy shader filter manager
    shaderFilterManager.destroy();

    if (state.poolManager) {
        state.poolManager.destroy();
        state.poolManager = null;
    }

    textureCache.destroy();
    gameRenderer.destroy();

    state.fxContainer = null;
    state.entityContainer = null;
    state.projectileContainer = null;
    state.canvas = null;
    state.isInitialized = false;

    console.log('[WebGLRenderManager] Destroyed');
}

// ═══════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════

/**
 * Handle canvas resize.
 */
export function resizeWebGLRenderer(width: number, height: number): void {
    if (!state.isInitialized) return;
    gameRenderer.resize(width, height);
    shaderFilterManager.setDimensions(width, height);
}

// ═══════════════════════════════════════════════════════════════
// SHADER SETTINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply shader settings from game state.
 */
export function applyShaderSettings(crtEffect: boolean, fxIntensity: number): void {
    shaderFilterManager.applySettings(crtEffect, fxIntensity);
}

/**
 * Set shader quality level.
 */
export function setShaderQuality(quality: ShaderQuality): void {
    shaderFilterManager.setQuality(quality);
}

/**
 * Set chromatic aberration intensity (for death effect).
 */
export function setChromaticAberration(intensity: number): void {
    shaderFilterManager.setChromaticIntensity(intensity);
}

/**
 * Get current effective shader quality.
 */
export function getShaderQuality(): string {
    return shaderFilterManager.getEffectiveQuality();
}

/**
 * Check if shaders are active.
 */
export function areShadersActive(): boolean {
    return shaderFilterManager.isActive();
}

// ═══════════════════════════════════════════════════════════════
// TELEMETRY & QUALITY
// ═══════════════════════════════════════════════════════════════

/**
 * Get the telemetry system instance.
 */
export function getTelemetry() {
    return telemetry;
}

/**
 * Set quality auto-scaling enabled state.
 */
export function setAutoQualityScaling(enabled: boolean): void {
    telemetry.setAutoScale(enabled);
}

/**
 * Set the maximum quality level (user preference ceiling).
 */
export function setQualityCeiling(level: string): void {
    telemetry.setQualityCeiling(level as any);
}

/**
 * Get current quality level from telemetry.
 */
export function getCurrentQualityLevel(): string {
    return telemetry.getQualityLevel();
}
