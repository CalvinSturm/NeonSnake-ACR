/**
 * Floor System (Pure Functions)
 * Extracted from useFloorVolumes.ts
 * All functions are pure: operate on FloorVolume arrays
 */

// ═══════════════════════════════════════════════════════════════
// FLOOR TYPES
// ═══════════════════════════════════════════════════════════════

export interface FloorVolume {
    id: string;
    startX: number;
    endX: number;
    topY: number;
}

// ═══════════════════════════════════════════════════════════════
// FLOOR OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Find the highest valid floor that supports an entity at (x, y).
 * Returns null if no floor supports this position.
 */
export function getSupportingFloor(
    floors: FloorVolume[],
    x: number,
    y: number
): FloorVolume | null {
    let candidate: FloorVolume | null = null;
    let minTopY = Infinity;

    // Small epsilon to handle floating point precision on exact lands
    const checkY = y + 0.01;

    for (const vol of floors) {
        // 1. Horizontal Overlap
        if (x >= vol.startX && x <= vol.endX) {
            // 2. Vertical Check: Have we passed or touched this floor?
            if (checkY >= vol.topY) {
                // 3. Highest Priority: Pick the floor with the smallest Y (visually highest)
                if (vol.topY < minTopY) {
                    minTopY = vol.topY;
                    candidate = vol;
                }
            }
        }
    }

    return candidate;
}

/**
 * Add a floor volume to the collection.
 */
export function addFloorVolume(floors: FloorVolume[], volume: FloorVolume): FloorVolume[] {
    return [...floors, volume];
}

/**
 * Clear all floor volumes.
 */
export function clearFloors(): FloorVolume[] {
    return [];
}
