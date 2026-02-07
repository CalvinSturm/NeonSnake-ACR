
import { Enemy } from './enemyTypes';
import { AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, moveAwayFromPlayer, angleToPlayer } from './enemyHelpers';
import { INTERCEPTOR } from './enemyConstants';

type InterceptorState = 'STALK' | 'DIVE' | 'PASS' | 'RETREAT';

/**
 * INTERCEPTOR - "Dive Bomber" behavior
 *
 * Pattern:
 * 1. STALK - Follow player from a distance, positioning for attack
 * 2. DIVE - Quick dash toward the player
 * 3. PASS - Continue momentum past the player
 * 4. RETREAT - Back off and reset for another pass
 */
export const updateInterceptor = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'STALK';
    enemy.stateTimer = 0;
    enemy.diveAngle = 0;
  }

  const dist = distanceToPlayer(enemy, playerPos);
  enemy.angle = angleToPlayer(enemy, playerPos);

  // If still entering the play area, always move toward player
  if (enemy.state === 'ENTERING') {
    enemy.intent = 'ATTACKING';
    moveTowardPlayer(enemy, playerPos, INTERCEPTOR.ENTER_SPEED, dt);
    return;
  }

  // Scale timings with difficulty
  const stalkTime = INTERCEPTOR.STALK_DURATION / aggressionMod;
  const diveSpeed = INTERCEPTOR.DIVE_SPEED * aggressionMod;

  switch (enemy.aiState as InterceptorState) {
    case 'STALK':
      // Follow player from a distance, preparing to dive
      enemy.intent = 'REPOSITIONING';

      if (dist > INTERCEPTOR.STALK_DISTANCE + 3) {
        // Too far - approach
        moveTowardPlayer(enemy, playerPos, INTERCEPTOR.STALK_SPEED, dt);
      } else if (dist < INTERCEPTOR.STALK_DISTANCE - 3) {
        // Too close - back off slightly
        moveAwayFromPlayer(enemy, playerPos, INTERCEPTOR.STALK_SPEED * 0.5, dt);
      } else {
        // Good distance - slow down and prepare
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;
      }

      // After stalking for a while, initiate dive
      if (enemy.stateTimer && enemy.stateTimer > stalkTime && dist < INTERCEPTOR.DIVE_TRIGGER_DISTANCE) {
        enemy.aiState = 'DIVE';
        enemy.stateTimer = 0;
        // Lock in the dive angle toward player
        enemy.diveAngle = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x);
      }
      break;

    case 'DIVE':
      // Fast dive toward the player
      enemy.intent = 'ATTACKING';

      // Move in locked direction at high speed
      const diveAngle = enemy.diveAngle || 0;
      enemy.vx = Math.cos(diveAngle) * diveSpeed;
      enemy.vy = Math.sin(diveAngle) * diveSpeed;

      // Transition to pass-through after diving for a duration or getting close
      if (enemy.stateTimer && enemy.stateTimer > INTERCEPTOR.DIVE_DURATION) {
        enemy.aiState = 'PASS';
        enemy.stateTimer = 0;
      }
      // Also transition if we got very close (successful pass)
      if (dist < 2) {
        enemy.aiState = 'PASS';
        enemy.stateTimer = 0;
      }
      break;

    case 'PASS':
      // Continue momentum past the player
      enemy.intent = 'REPOSITIONING';

      // Maintain velocity but slow down gradually
      enemy.vx *= INTERCEPTOR.PASS_FRICTION;
      enemy.vy *= INTERCEPTOR.PASS_FRICTION;

      // After passing, retreat
      if (enemy.stateTimer && enemy.stateTimer > INTERCEPTOR.PASS_DURATION) {
        enemy.aiState = 'RETREAT';
        enemy.stateTimer = 0;
      }
      break;

    case 'RETREAT':
      // Back away from player to reset
      enemy.intent = 'REPOSITIONING';
      moveAwayFromPlayer(enemy, playerPos, INTERCEPTOR.RETREAT_SPEED, dt);

      // Once far enough, go back to stalking
      if (dist > INTERCEPTOR.STALK_DISTANCE || (enemy.stateTimer && enemy.stateTimer > INTERCEPTOR.RETREAT_DURATION)) {
        enemy.aiState = 'STALK';
        enemy.stateTimer = 0;
      }
      break;
  }
};
