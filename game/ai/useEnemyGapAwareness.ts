
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { AI_CONFIG } from '../../constants';

export function useEnemyGapAwareness(game: ReturnType<typeof useGameState>) {
  const { enemiesRef, snakeRef, floor } = game;

  const update = useCallback((dt: number) => {
    const head = snakeRef.current[0];
    if (!head) return;

    for (const enemy of enemiesRef.current) {
      // 1. Eligibility Check
      if (!enemy.physicsProfile.usesVerticalPhysics) continue;
      if (!enemy.physicsProfile.canJump) continue;
      
      // Update cooldown regardless of ground state
      if (enemy.jumpCooldownTimer > 0) {
          enemy.jumpCooldownTimer = Math.max(0, enemy.jumpCooldownTimer - dt);
      }

      // Must be grounded to jump
      if (!enemy.isGrounded) continue;
      
      // Must be off cooldown
      if (enemy.jumpCooldownTimer > 0) continue;

      // 2. Determine "Ahead" Direction
      // Matches standard movement logic: move towards player X
      const dx = head.x - enemy.x;
      if (Math.abs(dx) < 0.1) continue; // Too close to determine direction
      const direction = Math.sign(dx); // -1 (Left) or 1 (Right)

      // 3. Probe Floor Ahead
      const probeX = enemy.x + (direction * AI_CONFIG.GAP_PROBE_DISTANCE);
      const supportingFloor = floor.getSupportingFloor(probeX, enemy.y);

      // 4. Gap Decision
      // Jump if:
      // A) No floor volume found at probe X (Void)
      // B) Floor exists but is significantly lower than current standing Y (Drop-off)
      const isGap = !supportingFloor || (supportingFloor.topY > enemy.y + 2); // 2 grid units drop tolerance

      if (isGap) {
          enemy.jumpIntent = true;
          // Apply static cooldown from profile
          enemy.jumpCooldownTimer = enemy.physicsProfile.jumpCooldown || 1000;
      }
    }
  }, [enemiesRef, snakeRef, floor]);

  return { update };
}
