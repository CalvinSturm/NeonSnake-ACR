/**
 * Object Pooling
 * 
 * Pre-allocated pools for high-churn entities.
 * Reduces allocation pressure and GC pauses.
 * Worker-compatible: No DOM, no React.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Poolable {
    /** Called when object is released back to pool */
    __poolReset?: () => void;
    /** Internal pool marker */
    __poolActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GENERIC OBJECT POOL
// ═══════════════════════════════════════════════════════════════

export class ObjectPool<T extends Poolable> {
    private pool: T[] = [];
    private activeObjects: Set<T> = new Set();
    private factory: () => T;
    private resetFn: (obj: T) => void;
    private warnOnExhaust: boolean;
    private maxSize: number;

    /**
     * Create a new object pool.
     * @param factory - Function to create new instances
     * @param reset - Function to reset instance state when released
     * @param initialSize - Number of objects to pre-allocate
     * @param maxSize - Maximum pool size (prevents unbounded growth)
     */
    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        initialSize: number = 32,
        maxSize: number = 512
    ) {
        this.factory = factory;
        this.resetFn = reset;
        this.warnOnExhaust = true;
        this.maxSize = maxSize;

        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            const obj = factory();
            obj.__poolActive = false;
            this.pool.push(obj);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Acquire an object from the pool.
     * If pool is empty, creates a new object (with warning).
     */
    acquire(): T {
        let obj: T;

        if (this.pool.length > 0) {
            obj = this.pool.pop()!;
        } else {
            // Pool exhausted - create new
            if (this.warnOnExhaust && this.activeObjects.size >= this.maxSize) {
                console.warn(
                    `[ObjectPool] Pool exhausted, active: ${this.activeObjects.size}. ` +
                    `Consider increasing pool size.`
                );
            }
            obj = this.factory();
        }

        obj.__poolActive = true;
        this.activeObjects.add(obj);
        return obj;
    }

    /**
     * Release an object back to the pool.
     * Resets the object state.
     */
    release(obj: T): void {
        if (!obj.__poolActive) {
            // Already released or never acquired
            return;
        }

        obj.__poolActive = false;
        this.activeObjects.delete(obj);
        this.resetFn(obj);

        // Only return to pool if under max size
        if (this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
    }

    /**
     * Release all active objects back to the pool.
     */
    releaseAll(): void {
        for (const obj of this.activeObjects) {
            obj.__poolActive = false;
            this.resetFn(obj);
            if (this.pool.length < this.maxSize) {
                this.pool.push(obj);
            }
        }
        this.activeObjects.clear();
    }

    /**
     * Iterate over all active objects.
     * Safe to release during iteration.
     */
    forEach(callback: (obj: T) => void): void {
        for (const obj of this.activeObjects) {
            if (obj.__poolActive) {
                callback(obj);
            }
        }
    }

    /**
     * Filter active objects, releasing those that don't match.
     */
    filter(predicate: (obj: T) => boolean): void {
        const toRelease: T[] = [];

        for (const obj of this.activeObjects) {
            if (!predicate(obj)) {
                toRelease.push(obj);
            }
        }

        for (const obj of toRelease) {
            this.release(obj);
        }
    }

    /**
     * Get all active objects as an array (for snapshot).
     * Creates a new array - use sparingly.
     */
    toArray(): T[] {
        return Array.from(this.activeObjects);
    }

    // ─────────────────────────────────────────────────────────────
    // STATS
    // ─────────────────────────────────────────────────────────────

    /** Number of currently active (in-use) objects */
    get activeCount(): number {
        return this.activeObjects.size;
    }

    /** Number of available objects in pool */
    get availableCount(): number {
        return this.pool.length;
    }

    /** Total objects (active + available) */
    get totalCount(): number {
        return this.activeObjects.size + this.pool.length;
    }

    /** Get pool statistics for debugging */
    getStats(): { active: number; available: number; total: number } {
        return {
            active: this.activeCount,
            available: this.availableCount,
            total: this.totalCount
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// SPECIALIZED POOLS
// ═══════════════════════════════════════════════════════════════

/**
 * Pool configuration for common entity types.
 */
export const POOL_CONFIGS = {
    ENEMY: { initial: 64, max: 128 },
    PROJECTILE: { initial: 128, max: 256 },
    PARTICLE: { initial: 256, max: 1024 },
    FLOATING_TEXT: { initial: 32, max: 64 },
    MINE: { initial: 32, max: 64 },
    SHOCKWAVE: { initial: 16, max: 32 }
} as const;

// ═══════════════════════════════════════════════════════════════
// VECTOR POOL (for temporary calculations)
// ═══════════════════════════════════════════════════════════════

interface Vec2 extends Poolable {
    x: number;
    y: number;
}

const vecPool = new ObjectPool<Vec2>(
    () => ({ x: 0, y: 0 }),
    (v) => { v.x = 0; v.y = 0; },
    64,
    128
);

/**
 * Acquire a temporary vector for calculations.
 * MUST call releaseVec() when done.
 */
export function acquireVec(x = 0, y = 0): Vec2 {
    const v = vecPool.acquire();
    v.x = x;
    v.y = y;
    return v;
}

/**
 * Release a temporary vector back to the pool.
 */
export function releaseVec(v: Vec2): void {
    vecPool.release(v);
}

// ═══════════════════════════════════════════════════════════════
// ID GENERATION (for pooled objects)
// ═══════════════════════════════════════════════════════════════

let idCounter = 0;

/**
 * Generate a unique ID for an entity.
 * Simple incrementing counter - no allocation.
 */
export function generateId(): string {
    return (++idCounter).toString(36);
}

/**
 * Reset ID counter (for testing).
 */
export function resetIdCounter(): void {
    idCounter = 0;
}
