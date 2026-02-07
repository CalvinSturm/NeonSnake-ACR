/**
 * Physics System (Pure Functions)
 * Extracted from useVerticalPhysics.ts
 * All functions are pure: (state, dt) => mutatedState
 */

import { PHYSICS, DEFAULT_SETTINGS } from '../../constants';
import { CameraMode, Enemy } from '../../types';
import { WorldState, PhysicsState } from './types';

// ═══════════════════════════════════════════════════════════════
// GRAVITY & FLOOR RESOLUTION
// ═══════════════════════════════════════════════════════════════

interface PhysicsEntity {
    x: number;
    y: number;
    vy: number;
    isGrounded: boolean;
}

/**
 * Apply gravity and floor collision to a single entity.
 * Mutates the entity in place.
 */
function applyGravityAndFloor(
    entity: PhysicsEntity,
    dtSec: number,
    getSupportingFloor: (x: number, y: number) => { topY: number } | null
): void {
    // 1. GRAVITY APPLICATION
    if (!entity.isGrounded) {
        entity.vy += PHYSICS.GRAVITY * dtSec;
        entity.vy = Math.min(entity.vy, PHYSICS.MAX_FALL_SPEED);
    }

    // 2. INTEGRATION (Pixel Space -> Grid Space)
    const dyPx = entity.vy * dtSec;
    const dyGrid = dyPx / DEFAULT_SETTINGS.gridSize;
    entity.y += dyGrid;

    // 3. COLLISION RESOLUTION (Floor Volumes)
    if (entity.vy >= 0) {
        const supportingFloor = getSupportingFloor(entity.x, entity.y);

        if (supportingFloor && entity.y >= supportingFloor.topY) {
            entity.y = supportingFloor.topY;
            entity.vy = 0;
            entity.isGrounded = true;
        } else {
            if (entity.isGrounded) {
                if (!supportingFloor || entity.y < supportingFloor.topY - 0.1) {
                    entity.isGrounded = false;
                }
            }
        }
    } else {
        entity.isGrounded = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN PHYSICS STEP
// ═══════════════════════════════════════════════════════════════

/**
 * Step the physics simulation for all entities.
 * Mutates worldState in place.
 * 
 * @param state - The world state to update
 * @param dt - Delta time in milliseconds
 * @param getSupportingFloor - Floor query function (injected from floor system)
 */
export function stepPhysics(
    state: WorldState,
    dt: number,
    getSupportingFloor: (x: number, y: number) => { topY: number } | null
): void {
    // Guard: Only for Side Scroll Mode
    if (state.camera.mode !== CameraMode.SIDE_SCROLL) {
        state.player.physics.vy = 0;
        state.player.physics.isGrounded = true;
        return;
    }

    const dtSec = dt / 1000;

    // ── PLAYER PHYSICS ──
    const head = state.player.segments[0];
    if (head) {
        const playerEntity: PhysicsEntity = {
            x: head.x,
            y: head.y,
            vy: state.player.physics.vy,
            isGrounded: state.player.physics.isGrounded
        };

        applyGravityAndFloor(playerEntity, dtSec, getSupportingFloor);

        // Write back
        head.y = playerEntity.y;
        state.player.physics.vy = playerEntity.vy;
        state.player.physics.isGrounded = playerEntity.isGrounded;
    }

    // ── ENEMY PHYSICS ──
    for (const enemy of state.entities.enemies) {
        if (enemy.physicsProfile?.usesVerticalPhysics) {
            // JUMP INTENT (From AI)
            if (enemy.jumpIntent && enemy.isGrounded) {
                enemy.vy = PHYSICS.JUMP_VELOCITY;
                enemy.isGrounded = false;
            }
            enemy.jumpIntent = false;

            const enemyEntity: PhysicsEntity = {
                x: enemy.x,
                y: enemy.y,
                vy: enemy.vy,
                isGrounded: enemy.isGrounded
            };

            applyGravityAndFloor(enemyEntity, dtSec, getSupportingFloor);

            // Write back
            enemy.y = enemyEntity.y;
            enemy.vy = enemyEntity.vy;
            enemy.isGrounded = enemyEntity.isGrounded;
        }
    }
}

/**
 * Apply a jump to the player if grounded.
 * Called when jump input is received.
 */
export function applyPlayerJump(state: WorldState): void {
    if (state.player.physics.isGrounded) {
        state.player.physics.vy = PHYSICS.JUMP_VELOCITY;
        state.player.physics.isGrounded = false;
    }
}
