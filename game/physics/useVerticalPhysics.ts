
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { PHYSICS, DEFAULT_SETTINGS } from '../../constants';
import { CameraMode } from '../../types';

export function useVerticalPhysics(game: ReturnType<typeof useGameState>) {
  const { snakeRef, physicsRef, jumpIntentRef, cameraRef, floor, enemiesRef } = game;

  // Reusable Physics Logic
  const applyGravityAndFloor = useCallback((
    entity: { y: number; vy: number; isGrounded: boolean; x: number }, 
    dtSec: number
  ) => {
    // 1. GRAVITY APPLICATION
    if (!entity.isGrounded) {
      entity.vy += PHYSICS.GRAVITY * dtSec;
      entity.vy = Math.min(entity.vy, PHYSICS.MAX_FALL_SPEED);
    }

    // 2. INTEGRATION (Pixel Space -> Grid Space)
    // Converts pixel velocity to grid-based position update
    const dyPx = entity.vy * dtSec;
    const dyGrid = dyPx / DEFAULT_SETTINGS.gridSize;

    entity.y += dyGrid;

    // 3. COLLISION RESOLUTION (Floor Volumes)
    // Only resolve landing if we are falling or stationary (vy >= 0)
    if (entity.vy >= 0) {
        const supportingFloor = floor.getSupportingFloor(entity.x, entity.y);
        
        if (supportingFloor && entity.y >= supportingFloor.topY) {
            // Collision Detected: Snap to top
            entity.y = supportingFloor.topY;
            entity.vy = 0;
            entity.isGrounded = true;
        } else {
            // No floor found below us, OR we are above the floor we found
            // If we were grounded, check if we walked off ledge
            if (entity.isGrounded) {
                if (!supportingFloor || entity.y < supportingFloor.topY - 0.1) {
                    entity.isGrounded = false;
                }
            }
        }
    } else {
        // Moving Up: No ground snap
        entity.isGrounded = false;
    }
  }, [floor]);

  const update = useCallback((dt: number) => {
    // 1. GUARD: Only for Side Scroll Mode
    if (cameraRef.current.mode !== CameraMode.SIDE_SCROLL) {
      // Reset player physics state if we switch back
      physicsRef.current.vy = 0;
      physicsRef.current.isGrounded = true;
      return;
    }

    const dtSec = dt / 1000;

    // ── PLAYER PHYSICS ──
    const head = snakeRef.current[0];
    if (head) {
        // Compose temporary entity from ref state + head pos
        const playerEntity = {
            x: head.x,
            y: head.y,
            vy: physicsRef.current.vy,
            isGrounded: physicsRef.current.isGrounded
        };

        // Apply shared logic
        applyGravityAndFloor(playerEntity, dtSec);

        // Apply Jump Intent (Player Specific)
        if (jumpIntentRef.current) {
            if (playerEntity.isGrounded) {
                playerEntity.vy = PHYSICS.JUMP_VELOCITY;
                playerEntity.isGrounded = false;
            }
            jumpIntentRef.current = false;
        }

        // Write back to refs
        head.y = playerEntity.y;
        physicsRef.current.vy = playerEntity.vy;
        physicsRef.current.isGrounded = playerEntity.isGrounded;
    }

    // ── ENEMY PHYSICS ──
    for (const enemy of enemiesRef.current) {
        if (enemy.physicsProfile && enemy.physicsProfile.usesVerticalPhysics) {
            
            // JUMP INTENT (From AI)
            if (enemy.jumpIntent) {
                if (enemy.isGrounded) {
                    enemy.vy = PHYSICS.JUMP_VELOCITY;
                    enemy.isGrounded = false;
                }
                // Consume intent regardless of success (prevents sticky jumps)
                enemy.jumpIntent = false; 
            }

            // Enemy state is self-contained
            applyGravityAndFloor(enemy, dtSec);
        }
    }

  }, [snakeRef, physicsRef, jumpIntentRef, cameraRef, floor, enemiesRef, applyGravityAndFloor]);

  return { update };
}
