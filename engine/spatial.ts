/**
 * Spatial Partitioning
 * 
 * Uniform grid for broad-phase collision detection.
 * O(1) insert/remove, O(K) query where K = entities in nearby cells.
 * Worker-compatible: No DOM, no React.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SpatialEntity {
    x: number;
    y: number;
}

// ═══════════════════════════════════════════════════════════════
// UNIFORM GRID
// ═══════════════════════════════════════════════════════════════

export class SpatialGrid<T extends SpatialEntity> {
    private cells: Map<number, T[]> = new Map();
    private readonly cellSize: number;
    private readonly cols: number;
    private readonly rows: number;

    /**
     * Create a new spatial grid.
     * @param cellSize - Size of each cell in grid units
     * @param width - Grid width in grid units
     * @param height - Grid height in grid units
     */
    constructor(cellSize: number, width: number, height: number) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Clear all entities from the grid.
     * Call at the start of each frame before re-inserting.
     */
    clear(): void {
        this.cells.clear();
    }

    /**
     * Insert a single entity into the grid.
     */
    insert(entity: T): void {
        const key = this.getCellKey(entity.x, entity.y);
        let cell = this.cells.get(key);
        if (!cell) {
            cell = [];
            this.cells.set(key, cell);
        }
        cell.push(entity);
    }

    /**
     * Batch insert multiple entities.
     */
    insertAll(entities: readonly T[]): void {
        for (let i = 0; i < entities.length; i++) {
            this.insert(entities[i]);
        }
    }

    /**
     * Query all entities within a radius of a point.
     * @param x - Center X in grid units
     * @param y - Center Y in grid units
     * @param radius - Search radius in grid units
     * @returns Array of entities within radius
     */
    queryRadius(x: number, y: number, radius: number): T[] {
        const results: T[] = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);
        const radiusSq = radius * radius;

        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
            for (let dx = -cellRadius; dx <= cellRadius; dx++) {
                const cx = centerCellX + dx;
                const cy = centerCellY + dy;

                // Bounds check
                if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue;

                const key = cx + cy * this.cols;
                const cell = this.cells.get(key);
                if (!cell) continue;

                // Fine-grained distance check
                for (let i = 0; i < cell.length; i++) {
                    const entity = cell[i];
                    const dx2 = entity.x - x;
                    const dy2 = entity.y - y;
                    if (dx2 * dx2 + dy2 * dy2 <= radiusSq) {
                        results.push(entity);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query all entities within a rectangular region.
     * @param x - Left X in grid units
     * @param y - Top Y in grid units
     * @param w - Width in grid units
     * @param h - Height in grid units
     * @returns Array of entities within rectangle
     */
    queryRect(x: number, y: number, w: number, h: number): T[] {
        const results: T[] = [];
        const startCellX = Math.floor(x / this.cellSize);
        const startCellY = Math.floor(y / this.cellSize);
        const endCellX = Math.floor((x + w) / this.cellSize);
        const endCellY = Math.floor((y + h) / this.cellSize);

        for (let cy = startCellY; cy <= endCellY; cy++) {
            for (let cx = startCellX; cx <= endCellX; cx++) {
                // Bounds check
                if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue;

                const key = cx + cy * this.cols;
                const cell = this.cells.get(key);
                if (!cell) continue;

                // Fine-grained bounds check
                for (let i = 0; i < cell.length; i++) {
                    const entity = cell[i];
                    if (entity.x >= x && entity.x <= x + w &&
                        entity.y >= y && entity.y <= y + h) {
                        results.push(entity);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query the cell at a specific point.
     * @returns All entities in that cell (no distance filtering)
     */
    queryCell(x: number, y: number): T[] {
        const key = this.getCellKey(x, y);
        return this.cells.get(key) ?? [];
    }

    // ─────────────────────────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────────────────────────

    /**
     * Get statistics for debugging.
     */
    getStats(): { cellCount: number; entityCount: number; maxCellSize: number } {
        let entityCount = 0;
        let maxCellSize = 0;

        for (const cell of this.cells.values()) {
            entityCount += cell.length;
            maxCellSize = Math.max(maxCellSize, cell.length);
        }

        return {
            cellCount: this.cells.size,
            entityCount,
            maxCellSize
        };
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────

    private getCellKey(x: number, y: number): number {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return cellX + cellY * this.cols;
    }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Create a spatial grid with default settings.
 * @param width - Grid width in grid units
 * @param height - Grid height in grid units
 * @param cellSize - Cell size (default: 4 grid units)
 */
export function createSpatialGrid<T extends SpatialEntity>(
    width: number,
    height: number,
    cellSize = 4
): SpatialGrid<T> {
    return new SpatialGrid<T>(cellSize, width, height);
}
