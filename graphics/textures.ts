/**
 * Texture Cache
 * 
 * Dynamic texture generation for procedural entities.
 * Renders Canvas2D procedural drawings to OffscreenCanvas,
 * then converts to Pixi.js Texture.
 * 
 * Cache keyed by (entityType, style, state) for reuse.
 */

import { Texture } from 'pixi.js';
import type { Application } from 'pixi.js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TextureCacheKey {
    type: string;       // Entity type (e.g., "HUNTER", "PARTICLE")
    style?: string;     // Visual style variant
    state?: string;     // State-specific variant (e.g., "ATTACKING")
    frame?: number;     // Animation frame (optional)
}

export interface CachedTexture {
    texture: Texture;
    lastUsed: number;
    size: number; // Approximate VRAM usage in bytes
}

export type ProceduralDrawFn = (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
) => void;

// ═══════════════════════════════════════════════════════════════
// TEXTURE CACHE CLASS
// ═══════════════════════════════════════════════════════════════

export class TextureCache {
    private cache: Map<string, CachedTexture> = new Map();
    private pixiApp: Application | null = null;

    // Configuration
    private maxCacheSize: number = 100; // Max textures before eviction
    private maxMemoryMB: number = 64;   // Max VRAM usage estimate
    private currentMemory: number = 0;

    /**
     * Initialize with Pixi Application reference.
     */
    init(app: Application): void {
        this.pixiApp = app;
    }

    /**
     * Generate a cache key string from key components.
     */
    private keyToString(key: TextureCacheKey): string {
        return `${key.type}:${key.style ?? 'default'}:${key.state ?? 'idle'}:${key.frame ?? 0}`;
    }

    /**
     * Get a cached texture, or generate and cache it.
     */
    getOrCreate(
        key: TextureCacheKey,
        width: number,
        height: number,
        drawFn: ProceduralDrawFn
    ): Texture {
        const keyStr = this.keyToString(key);

        // Check cache
        const cached = this.cache.get(keyStr);
        if (cached) {
            cached.lastUsed = performance.now();
            return cached.texture;
        }

        // Generate new texture
        const texture = this.generateTexture(width, height, drawFn);

        // Estimate memory usage (rough: width * height * 4 bytes RGBA)
        const size = width * height * 4;

        // Cache it
        this.cache.set(keyStr, {
            texture,
            lastUsed: performance.now(),
            size,
        });
        this.currentMemory += size;

        // Evict if needed
        this.maybeEvict();

        return texture;
    }

    /**
     * Generate a texture from a procedural drawing function.
     */
    private generateTexture(
        width: number,
        height: number,
        drawFn: ProceduralDrawFn
    ): Texture {
        // Use OffscreenCanvas for better performance if available
        let canvas: HTMLCanvasElement | OffscreenCanvas;
        let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

        if (typeof OffscreenCanvas !== 'undefined') {
            canvas = new OffscreenCanvas(width, height);
            ctx = canvas.getContext('2d');
        } else {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
        }

        if (!ctx) {
            console.error('[TextureCache] Failed to get 2D context');
            return Texture.WHITE;
        }

        // Clear and draw
        ctx.clearRect(0, 0, width, height);
        drawFn(ctx, width, height);

        // Convert to Pixi texture
        // For OffscreenCanvas, we need to transfer to ImageBitmap first
        if (canvas instanceof OffscreenCanvas) {
            // Create ImageBitmap synchronously isn't possible, so we use the canvas directly
            // Pixi.js v8 can handle OffscreenCanvas as a texture source
            return Texture.from(canvas as any);
        } else {
            return Texture.from(canvas);
        }
    }

    /**
     * Evict least-recently-used textures if cache is too large.
     */
    private maybeEvict(): void {
        const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024;

        // Evict by count
        while (this.cache.size > this.maxCacheSize) {
            this.evictLRU();
        }

        // Evict by memory
        while (this.currentMemory > maxMemoryBytes && this.cache.size > 0) {
            this.evictLRU();
        }
    }

    /**
     * Evict the least recently used texture.
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, cached] of this.cache) {
            if (cached.lastUsed < oldestTime) {
                oldestTime = cached.lastUsed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const cached = this.cache.get(oldestKey)!;
            cached.texture.destroy(true);
            this.currentMemory -= cached.size;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Invalidate all textures of a specific type.
     * Use when entity style changes.
     */
    invalidate(typePrefix: string): void {
        for (const [key, cached] of this.cache) {
            if (key.startsWith(typePrefix + ':')) {
                cached.texture.destroy(true);
                this.currentMemory -= cached.size;
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache.
     */
    clear(): void {
        for (const cached of this.cache.values()) {
            cached.texture.destroy(true);
        }
        this.cache.clear();
        this.currentMemory = 0;
    }

    /**
     * Get cache statistics.
     */
    getStats(): { count: number; memoryMB: number } {
        return {
            count: this.cache.size,
            memoryMB: this.currentMemory / (1024 * 1024),
        };
    }

    /**
     * Destroy the cache.
     */
    destroy(): void {
        this.clear();
        this.pixiApp = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

export const textureCache = new TextureCache();
