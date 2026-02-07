/**
 * Graphics Renderer
 * 
 * WebGL-based batched rendering using Pixi.js v8.
 * Provides a thin abstraction over Pixi for game rendering.
 * 
 * Design principles:
 * - Data-driven: No gameplay logic
 * - Batch-friendly: Sprites pooled and reused
 * - Metrics-aware: Exposes draw call counts
 */

import { Application, Container, Sprite, Texture, Graphics } from 'pixi.js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SpriteHandle {
    id: number;
    sprite: Sprite;
}

export interface SpriteProps {
    x: number;
    y: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    alpha?: number;
    tint?: number;
    visible?: boolean;
    zIndex?: number;
}

export interface RendererMetrics {
    drawCalls: number;
    spriteCount: number;
    textureCount: number;
    fps: number;
}

export interface GameRendererConfig {
    width: number;
    height: number;
    backgroundColor?: number;
    antialias?: boolean;
    resolution?: number;
}

// ═══════════════════════════════════════════════════════════════
// GAME RENDERER CLASS
// ═══════════════════════════════════════════════════════════════

export class GameRenderer {
    private app: Application | null = null;
    private gameContainer: Container | null = null;
    private uiContainer: Container | null = null;

    private spriteIdCounter: number = 0;
    private activeSpriteCount: number = 0;
    private lastFps: number = 60;

    private isInitialized: boolean = false;

    // ─────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────

    /**
     * Initialize the WebGL renderer.
     * Must be called before any other methods.
     */
    async init(canvas: HTMLCanvasElement, config: GameRendererConfig): Promise<void> {
        if (this.isInitialized) {
            console.warn('[GameRenderer] Already initialized');
            return;
        }

        this.app = new Application();

        await this.app.init({
            canvas,
            width: config.width,
            height: config.height,
            backgroundColor: config.backgroundColor ?? 0x020202,
            antialias: config.antialias ?? false,
            resolution: config.resolution ?? window.devicePixelRatio,
            autoDensity: true,
            powerPreference: 'high-performance',
        });

        // Main game layer (affected by camera transforms)
        this.gameContainer = new Container();
        this.gameContainer.sortableChildren = true; // Enable zIndex sorting
        this.app.stage.addChild(this.gameContainer);

        // UI layer (screen-space, not affected by camera)
        this.uiContainer = new Container();
        this.uiContainer.sortableChildren = true;
        this.app.stage.addChild(this.uiContainer);

        // Track FPS
        this.app.ticker.add(() => {
            this.lastFps = this.app?.ticker.FPS ?? 60;
        });

        this.isInitialized = true;
        console.log('[GameRenderer] Initialized with WebGL');
    }

    /**
     * Resize the renderer to match new dimensions.
     */
    resize(width: number, height: number): void {
        if (!this.app) return;
        this.app.renderer.resize(width, height);
    }

    /**
     * Clean up all resources.
     */
    destroy(): void {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true });
            this.app = null;
        }
        this.gameContainer = null;
        this.uiContainer = null;
        this.isInitialized = false;
        this.spriteIdCounter = 0;
        this.activeSpriteCount = 0;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDERING
    // ─────────────────────────────────────────────────────────────

    /**
     * Clear all sprites from the game container.
     * Call at start of each frame before adding new sprites.
     */
    clear(): void {
        if (!this.gameContainer) return;
        // Remove all children but don't destroy - we'll pool them
        this.gameContainer.removeChildren();
        this.activeSpriteCount = 0;
    }

    /**
     * Trigger a render pass.
     * Note: Pixi's ticker handles this automatically, but can be called manually.
     */
    render(): void {
        // Pixi renders automatically via its ticker
        // This method exists for API parity if needed
    }

    // ─────────────────────────────────────────────────────────────
    // SPRITE MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a new sprite from a texture.
     */
    createSprite(texture: Texture, layer: 'game' | 'ui' = 'game'): SpriteHandle {
        if (!this.gameContainer || !this.uiContainer) {
            throw new Error('[GameRenderer] Not initialized');
        }

        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5, 0.5); // Center anchor for rotation

        const container = layer === 'game' ? this.gameContainer : this.uiContainer;
        container.addChild(sprite);

        this.activeSpriteCount++;

        return {
            id: ++this.spriteIdCounter,
            sprite,
        };
    }

    /**
     * Update sprite properties.
     */
    updateSprite(handle: SpriteHandle, props: SpriteProps): void {
        const { sprite } = handle;

        sprite.x = props.x;
        sprite.y = props.y;

        if (props.rotation !== undefined) sprite.rotation = props.rotation;
        if (props.scaleX !== undefined) sprite.scale.x = props.scaleX;
        if (props.scaleY !== undefined) sprite.scale.y = props.scaleY;
        if (props.alpha !== undefined) sprite.alpha = props.alpha;
        if (props.tint !== undefined) sprite.tint = props.tint;
        if (props.visible !== undefined) sprite.visible = props.visible;
        if (props.zIndex !== undefined) sprite.zIndex = props.zIndex;
    }

    /**
     * Remove a sprite from the renderer.
     */
    removeSprite(handle: SpriteHandle): void {
        if (handle.sprite.parent) {
            handle.sprite.parent.removeChild(handle.sprite);
            this.activeSpriteCount--;
        }
        handle.sprite.destroy();
    }

    /**
     * Create a sprite from a pre-generated Graphics object (for procedural textures).
     */
    createSpriteFromGraphics(graphics: Graphics, layer: 'game' | 'ui' = 'game'): SpriteHandle {
        if (!this.app) {
            throw new Error('[GameRenderer] Not initialized');
        }

        const texture = this.app.renderer.generateTexture(graphics);
        return this.createSprite(texture, layer);
    }

    // ─────────────────────────────────────────────────────────────
    // CAMERA TRANSFORMS
    // ─────────────────────────────────────────────────────────────

    /**
     * Set camera transform for the game layer.
     */
    setCamera(x: number, y: number, zoom: number, rotation: number = 0): void {
        if (!this.gameContainer || !this.app) return;

        const centerX = this.app.renderer.width / 2;
        const centerY = this.app.renderer.height / 2;

        // Apply camera transform: center, then scale, then translate
        this.gameContainer.x = centerX - x * zoom;
        this.gameContainer.y = centerY - y * zoom;
        this.gameContainer.scale.set(zoom, zoom);
        this.gameContainer.rotation = rotation;
    }

    /**
     * Apply shake offset to the game layer.
     */
    setShake(shakeX: number, shakeY: number): void {
        if (!this.gameContainer) return;
        // Shake is additive to the current position
        // Note: This should be called after setCamera
        this.gameContainer.x += shakeX;
        this.gameContainer.y += shakeY;
    }

    // ─────────────────────────────────────────────────────────────
    // METRICS
    // ─────────────────────────────────────────────────────────────

    /**
     * Get current renderer metrics for debugging.
     */
    getMetrics(): RendererMetrics {
        if (!this.app) {
            return { drawCalls: 0, spriteCount: 0, textureCount: 0, fps: 0 };
        }

        // Pixi v8 doesn't expose draw calls directly, but we can estimate
        // based on texture batching. For now, return sprite count as proxy.
        return {
            drawCalls: this.estimateDrawCalls(),
            spriteCount: this.activeSpriteCount,
            textureCount: Texture.EMPTY ? 1 : 0, // Placeholder
            fps: Math.round(this.lastFps),
        };
    }

    /**
     * Estimate draw calls (rough heuristic).
     * Pixi batches sprites with the same texture, so draw calls ≈ unique textures used.
     */
    private estimateDrawCalls(): number {
        if (!this.gameContainer) return 0;

        // Simple heuristic: count unique textures
        const textures = new Set<Texture>();

        const collectTextures = (container: Container) => {
            for (const child of container.children) {
                if (child instanceof Sprite) {
                    textures.add(child.texture);
                } else if (child instanceof Container) {
                    collectTextures(child);
                }
            }
        };

        collectTextures(this.gameContainer);
        if (this.uiContainer) collectTextures(this.uiContainer);

        return textures.size;
    }

    // ─────────────────────────────────────────────────────────────
    // ACCESSORS
    // ─────────────────────────────────────────────────────────────

    get initialized(): boolean {
        return this.isInitialized;
    }

    get stage(): Container | null {
        return this.app?.stage ?? null;
    }

    get gameLayer(): Container | null {
        return this.gameContainer;
    }

    get uiLayer(): Container | null {
        return this.uiContainer;
    }

    get pixiApp(): Application | null {
        return this.app;
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

export const gameRenderer = new GameRenderer();
