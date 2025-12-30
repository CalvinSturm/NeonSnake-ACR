
import { useRef, useCallback } from 'react';
import { FloorVolume } from './types';

export function useFloorVolumes() {
  const floorVolumesRef = useRef<FloorVolume[]>([]);

  const addFloorVolume = useCallback((volume: FloorVolume) => {
    floorVolumesRef.current.push(volume);
  }, []);

  const clearFloors = useCallback(() => {
    floorVolumesRef.current = [];
  }, []);

  /**
   * Returns the highest valid floor (smallest Y) that the entity is currently intersecting or below.
   * "Below" means entity.y >= floor.topY (since Y increases downwards).
   */
  const getSupportingFloor = useCallback((x: number, y: number): FloorVolume | null => {
    let candidate: FloorVolume | null = null;
    let minTopY = Infinity;

    const volumes = floorVolumesRef.current;
    
    // We add a small epsilon to Y to handle floating point precision on exact lands
    const checkY = y + 0.01;

    for (const vol of volumes) {
      // 1. Horizontal Overlap
      if (x >= vol.startX && x <= vol.endX) {
        // 2. Vertical Check: Have we passed or touched this floor?
        if (checkY >= vol.topY) {
          // 3. Highest Priority: Pick the floor with the smallest Y (visually highest)
          // This ensures if we fall through multiple stacked platforms in one frame, 
          // we catch the top-most one we hit.
          if (vol.topY < minTopY) {
            minTopY = vol.topY;
            candidate = vol;
          }
        }
      }
    }

    return candidate;
  }, []);

  return {
    floorVolumesRef,
    addFloorVolume,
    clearFloors,
    getSupportingFloor
  };
}
