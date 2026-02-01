
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { PHYSICS, PROJECTILE_PHYSICS, DEFAULT_SETTINGS } from '../../constants';

export function useProjectilePhysics(game: ReturnType<typeof useGameState>) {
  const { projectilesRef, floor, viewport } = game;

  const update = useCallback((dt: number) => {
    // Convert dt to frame units for compatibility with existing velocity scaling
    // Standard frame is 16.667ms
    const frame = dt / 16.667;
    
    // Dynamic Void Boundary: Screen bottom + 5 rows buffer
    // This fixes the issue where projectiles disappear on tall screens
    const voidY = (viewport.rows + 5) * DEFAULT_SETTINGS.gridSize;

    for (const p of projectilesRef.current) {
        if (p.shouldRemove) continue;

        // 1. Gravity Application
        if (p.usesGravity) {
            p.vy += PROJECTILE_PHYSICS.GRAVITY_PER_FRAME * frame;
            p.vy = Math.min(p.vy, PROJECTILE_PHYSICS.MAX_FALL_SPEED_PER_FRAME);
        }

        // 2. Integration
        p.x += p.vx * frame;
        p.y += p.vy * frame;

        // 3. Floor Collision (Only if gravity enabled)
        if (p.usesGravity && p.vy > 0) {
            const gridX = p.x / DEFAULT_SETTINGS.gridSize;
            const gridY = p.y / DEFAULT_SETTINGS.gridSize;

            const supportingFloor = floor.getSupportingFloor(gridX, gridY);

            // Check if we hit the floor
            if (supportingFloor && gridY >= supportingFloor.topY) {
                p.shouldRemove = true;
                // Optional: Spawn small puff? (Left out per "No FX here" constraint)
            }
        }

        // 4. Void Check (World Boundary)
        if (p.y > voidY) {
            p.shouldRemove = true;
        }
    }
  }, [projectilesRef, floor, viewport]);

  return { update };
}
