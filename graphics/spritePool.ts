/**
 * Sprite Pool
 * 
 * Object pool for sprite handles to reduce GC pressure.
 * Recycles Pixi Sprite instances instead of creating/destroying.
 * 
 * Matches existing engine/pools.ts pattern.
 */

import { Sprite, Texture, Container } from 'pixi.js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PooledSprite {
    sprite: Sprite;
    active: boolean;
    poolId: number;
}

// ═══════════════════════════════════════════════════════════════
// SPRITE POOL CLASS
// ═══════════════════════════════════════════════════════════════

export class SpritePool {
    private pool: PooledSprite[] = [];
    private container: Container;
    private defaultTexture: Texture;
    private idCounter: number = 0;

    constructor(container: Container, defaultTexture: Texture = Texture.WHITE) {
        this.container = container;
        this.defaultTexture = defaultTexture;
    }

    /**
     * Acquire a sprite from the pool.
     * Returns a recycled sprite if available, otherwise creates a new one.
     */
    acquire(texture?: Texture): PooledSprite {
        // Find inactive sprite
        for (const pooled of this.pool) {
            if (!pooled.active) {
                pooled.active = true;
                pooled.sprite.texture = texture ?? this.defaultTexture;
                pooled.sprite.visible = true;
                pooled.sprite.alpha = 1;
                pooled.sprite.rotation = 0;
                pooled.sprite.scale.set(1, 1);
                pooled.sprite.tint = 0xffffff;
                return pooled;
            }
        }

        // Create new sprite
        const sprite = new Sprite(texture ?? this.defaultTexture);
        sprite.anchor.set(0.5, 0.5);
        this.container.addChild(sprite);

        const pooled: PooledSprite = {
            sprite,
            active: true,
            poolId: ++this.idCounter,
        };

        this.pool.push(pooled);
        return pooled;
    }

    /**
     * Release a sprite back to the pool.
     */
    release(pooled: PooledSprite): void {
        pooled.active = false;
        pooled.sprite.visible = false;
    }

    /**
     * Release all sprites back to the pool.
     * Call at the start of each frame.
     */
    releaseAll(): void {
        for (const pooled of this.pool) {
            if (pooled.active) {
                pooled.active = false;
                pooled.sprite.visible = false;
            }
        }
    }

    /**
     * Get pool statistics.
     */
    getStats(): { total: number; active: number; inactive: number } {
        let active = 0;
        let inactive = 0;
        for (const pooled of this.pool) {
            if (pooled.active) active++;
            else inactive++;
        }
        return { total: this.pool.length, active, inactive };
    }

    /**
     * Destroy all sprites and clear the pool.
     */
    destroy(): void {
        for (const pooled of this.pool) {
            pooled.sprite.destroy();
        }
        this.pool = [];
        this.idCounter = 0;
    }

    /**
     * Trim the pool to a maximum size.
     * Destroys excess inactive sprites.
     */
    trim(maxSize: number): void {
        while (this.pool.length > maxSize) {
            const idx = this.pool.findIndex(p => !p.active);
            if (idx === -1) break; // All active, can't trim

            this.pool[idx].sprite.destroy();
            this.pool.splice(idx, 1);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MULTI-POOL MANAGER
// ═══════════════════════════════════════════════════════════════

/**
 * Manages multiple sprite pools, one per texture/entity type.
 */
export class SpritePoolManager {
    private pools: Map<string, SpritePool> = new Map();
    private container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    /**
     * Get or create a pool for a specific category.
     */
    getPool(category: string, defaultTexture?: Texture): SpritePool {
        let pool = this.pools.get(category);
        if (!pool) {
            pool = new SpritePool(this.container, defaultTexture);
            this.pools.set(category, pool);
        }
        return pool;
    }

    /**
     * Release all sprites in all pools.
     */
    releaseAll(): void {
        for (const pool of this.pools.values()) {
            pool.releaseAll();
        }
    }

    /**
     * Get combined statistics across all pools.
     */
    getStats(): { total: number; active: number; pools: number } {
        let total = 0;
        let active = 0;
        for (const pool of this.pools.values()) {
            const stats = pool.getStats();
            total += stats.total;
            active += stats.active;
        }
        return { total, active, pools: this.pools.size };
    }

    /**
     * Destroy all pools.
     */
    destroy(): void {
        for (const pool of this.pools.values()) {
            pool.destroy();
        }
        this.pools.clear();
    }
}
