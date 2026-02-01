/**
 * ObjectPool - Generic object pool to reduce GC pressure
 * 
 * Pre-allocates objects and reuses them instead of creating/destroying per frame.
 */

export class ObjectPool<T extends { active: boolean }> {
    private pool: T[] = [];
    private activeCount = 0;

    constructor(
        private factory: () => T,
        private reset: (obj: T) => void,
        initialSize: number
    ) {
        // Pre-allocate pool
        for (let i = 0; i < initialSize; i++) {
            const obj = this.factory();
            obj.active = false;
            this.pool.push(obj);
        }
    }

    /**
     * Acquire an object from the pool.
     * Returns null if pool is exhausted (caller should check capacity first).
     */
    acquire(): T | null {
        // Find inactive object
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                this.pool[i].active = true;
                this.activeCount++;
                return this.pool[i];
            }
        }

        // Pool exhausted - expand by 50%
        const expandCount = Math.max(10, Math.floor(this.pool.length * 0.5));
        for (let i = 0; i < expandCount; i++) {
            const obj = this.factory();
            obj.active = false;
            this.pool.push(obj);
        }

        // Return first newly created object
        const newObj = this.pool[this.pool.length - expandCount];
        newObj.active = true;
        this.activeCount++;
        return newObj;
    }

    /**
     * Release an object back to the pool.
     */
    release(obj: T): void {
        if (obj.active) {
            obj.active = false;
            this.reset(obj);
            this.activeCount--;
        }
    }

    /**
     * Get all active objects (for rendering/update loops).
     */
    getActive(): T[] {
        return this.pool.filter(obj => obj.active);
    }

    /**
     * Iterate over active objects without allocating a new array.
     */
    forEachActive(callback: (obj: T, index: number) => void): void {
        let activeIndex = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                callback(this.pool[i], activeIndex++);
            }
        }
    }

    /**
     * Release all objects matching a predicate.
     */
    releaseWhere(predicate: (obj: T) => boolean): void {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active && predicate(this.pool[i])) {
                this.release(this.pool[i]);
            }
        }
    }

    /**
     * Release all active objects.
     */
    releaseAll(): void {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.release(this.pool[i]);
            }
        }
    }

    /**
     * Get pool statistics for debugging.
     */
    stats(): { poolSize: number; active: number; available: number } {
        return {
            poolSize: this.pool.length,
            active: this.activeCount,
            available: this.pool.length - this.activeCount
        };
    }
}
