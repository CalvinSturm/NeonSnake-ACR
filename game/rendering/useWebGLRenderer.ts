/**
 * useWebGLRenderer Hook
 * 
 * Integrates WebGL rendering (via Pixi.js) with the game's React lifecycle.
 * Supports hybrid mode where WebGL handles static entities and particles,
 * while Canvas2D handles animated entities with procedural effects.
 * 
 * This is the integration layer between graphics/ infrastructure and game/ rendering.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
    initWebGLRenderManager,
    destroyWebGLRenderManager,
    isWebGLReady,
    beginFrame,
    endFrame,
    renderParticles,
    applyCameraTransform,
    getFrameMetrics,
    RenderMode
} from '../../graphics/renderManager';
import {
    initEntityRenderer,
    renderEntitiesWebGL,
    destroyEntityRenderer
} from '../../graphics/renderers/entities';
import {
    initProjectileRenderer,
    renderProjectilesWebGL,
    destroyProjectileRenderer
} from '../../graphics/renderers/projectiles';
import {
    initParticleRenderer,
    destroyParticleRenderer
} from '../../graphics/renderers/particles';
import { gameRenderer } from '../../graphics/renderer';
import { textureCache } from '../../graphics/textures';
import { Mine, FoodItem, Particle, Projectile } from '../../types';

interface WebGLRenderState {
    initialized: boolean;
    mode: RenderMode;
    canvas2d: HTMLCanvasElement | null;
}

interface WebGLRenderCallbacks {
    /**
     * Initialize WebGL renderer. Call once when game mounts.
     */
    init: (canvas: HTMLCanvasElement, mode?: RenderMode) => Promise<boolean>;

    /**
     * Destroy WebGL renderer. Call when game unmounts.
     */
    destroy: () => void;

    /**
     * Begin a render frame. Call at start of each frame.
     */
    beginFrame: () => void;

    /**
     * End a render frame. Call at end of each frame.
     */
    endFrame: () => void;

    /**
     * Render static entities via WebGL.
     * Returns true if WebGL was used, false if Canvas2D fallback is needed.
     */
    renderStaticEntities: (mines: Mine[], food: FoodItem[], now: number) => boolean;

    /**
     * Render particles via WebGL.
     * Returns true if WebGL was used.
     */
    renderParticles: (particles: Particle[]) => boolean;

    /**
     * Render projectiles via WebGL.
     * Returns projectiles that need Canvas2D fallback.
     */
    renderProjectiles: (projectiles: Projectile[]) => { count: number; fallback: Projectile[] };

    /**
     * Apply camera transform to WebGL renderer.
     */
    setCamera: (x: number, y: number, zoom: number, shakeX?: number, shakeY?: number) => void;

    /**
     * Check if WebGL is ready.
     */
    isReady: () => boolean;

    /**
     * Get current frame metrics.
     */
    getMetrics: () => ReturnType<typeof getFrameMetrics>;
}

export function useWebGLRenderer(): WebGLRenderCallbacks {
    const stateRef = useRef<WebGLRenderState>({
        initialized: false,
        mode: 'hybrid',
        canvas2d: null
    });

    const init = useCallback(async (canvas: HTMLCanvasElement, mode: RenderMode = 'hybrid'): Promise<boolean> => {
        if (stateRef.current.initialized) {
            console.warn('[useWebGLRenderer] Already initialized');
            return true;
        }

        stateRef.current.canvas2d = canvas;
        stateRef.current.mode = mode;

        try {
            // Initialize the main render manager
            const success = await initWebGLRenderManager(canvas, mode);

            if (success && gameRenderer.initialized) {
                // Initialize texture cache
                const pixiApp = gameRenderer.pixiApp;
                if (pixiApp) {
                    textureCache.init(pixiApp);
                }

                // Initialize sub-renderers
                const gameLayer = gameRenderer.gameLayer;
                if (gameLayer) {
                    initEntityRenderer(gameLayer, 24); // gridSize = 24
                    initProjectileRenderer(gameLayer);
                    initParticleRenderer(gameLayer);
                }

                stateRef.current.initialized = true;
                console.log('[useWebGLRenderer] Initialized in mode:', mode);
                return true;
            }

            console.warn('[useWebGLRenderer] Failed to initialize');
            return false;
        } catch (err) {
            console.error('[useWebGLRenderer] Init error:', err);
            return false;
        }
    }, []);

    const destroy = useCallback(() => {
        if (!stateRef.current.initialized) return;

        destroyEntityRenderer();
        destroyProjectileRenderer();
        destroyParticleRenderer();
        textureCache.destroy();
        destroyWebGLRenderManager();

        stateRef.current.initialized = false;
        stateRef.current.canvas2d = null;
        console.log('[useWebGLRenderer] Destroyed');
    }, []);

    const beginFrameCallback = useCallback(() => {
        if (!stateRef.current.initialized) return;
        beginFrame();
    }, []);

    const endFrameCallback = useCallback(() => {
        if (!stateRef.current.initialized) return;
        endFrame();
    }, []);

    const renderStaticEntities = useCallback((mines: Mine[], food: FoodItem[], now: number): boolean => {
        if (!stateRef.current.initialized || stateRef.current.mode === 'canvas2d') {
            return false;
        }

        renderEntitiesWebGL(mines, food, now);
        return true;
    }, []);

    const renderParticlesCallback = useCallback((particles: Particle[]): boolean => {
        if (!stateRef.current.initialized || stateRef.current.mode === 'canvas2d') {
            return false;
        }

        return renderParticles(particles);
    }, []);

    const renderProjectilesCallback = useCallback((projectiles: Projectile[]): { count: number; fallback: Projectile[] } => {
        if (!stateRef.current.initialized || stateRef.current.mode === 'canvas2d') {
            return { count: 0, fallback: projectiles };
        }

        return renderProjectilesWebGL(projectiles);
    }, []);

    const setCamera = useCallback((x: number, y: number, zoom: number, shakeX: number = 0, shakeY: number = 0) => {
        if (!stateRef.current.initialized) return;
        applyCameraTransform(x, y, zoom, shakeX, shakeY);
    }, []);

    const isReady = useCallback((): boolean => {
        return stateRef.current.initialized && isWebGLReady();
    }, []);

    const getMetrics = useCallback(() => {
        return getFrameMetrics();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            destroy();
        };
    }, [destroy]);

    return {
        init,
        destroy,
        beginFrame: beginFrameCallback,
        endFrame: endFrameCallback,
        renderStaticEntities,
        renderParticles: renderParticlesCallback,
        renderProjectiles: renderProjectilesCallback,
        setCamera,
        isReady,
        getMetrics
    };
}
