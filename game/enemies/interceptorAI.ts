
import { Enemy, AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, moveAwayFromPlayer, movePerpendicular, angleToPlayer } from './enemyHelpers';
import { MOVEMENT_CONSTANTS } from '../../constants';

type InterceptorState = 'IDLE' | 'STRAFE' | 'APPROACH' | 'RETREAT';

const DIST_PREFERRED = 12;
const DIST_TOO_CLOSE = 6;
const BASE_STRAFE_DURATION = 2000;

export const updateInterceptor = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'IDLE';
    enemy.stateTimer = 0;
    enemy.strafeDir = 1;
  }

  // Timer update is handled by useMovement via movementUtils
  
  const dist = distanceToPlayer(enemy, playerPos);
  
  // Interceptors strafe faster on higher difficulty
  const strafeDuration = BASE_STRAFE_DURATION * aggressionMod;

  enemy.angle = angleToPlayer(enemy, playerPos);

  switch (enemy.aiState as InterceptorState) {
    case 'IDLE':
      enemy.intent = 'IDLE';
      enemy.vx *= 0.95;
      enemy.vy *= 0.95;
      
      // Faster reaction time
      if (enemy.stateTimer && enemy.stateTimer > (500 * aggressionMod)) {
        enemy.aiState = 'APPROACH';
        enemy.stateTimer = 0;
      }
      break;

    case 'APPROACH':
      enemy.intent = 'ATTACKING';
      moveTowardPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.APPROACH_SPEED_MULT, dt);

      if (dist < DIST_PREFERRED) {
        enemy.aiState = 'STRAFE';
        enemy.stateTimer = 0;
        enemy.strafeDir = 1;
      }
      break;

    case 'STRAFE':
      enemy.intent = 'REPOSITIONING';
      
      const clockwise = (enemy.strafeDir || 1) > 0;
      movePerpendicular(enemy, playerPos, clockwise, MOVEMENT_CONSTANTS.STRAFE_SPEED_MULT);
      
      if (dist > DIST_PREFERRED + 2) {
         moveTowardPlayer(enemy, playerPos, 0.2, dt);
      } else if (dist < DIST_PREFERRED - 2) {
         moveAwayFromPlayer(enemy, playerPos, 0.2, dt);
      }

      if (dist < DIST_TOO_CLOSE) {
        enemy.aiState = 'RETREAT';
        enemy.stateTimer = 0;
      } else if (enemy.stateTimer && enemy.stateTimer > strafeDuration) {
        enemy.strafeDir = (enemy.strafeDir === 1 ? -1 : 1);
        enemy.stateTimer = 0;
        
        if (dist > DIST_PREFERRED * 1.5) {
             enemy.aiState = 'APPROACH';
        }
      }
      break;

    case 'RETREAT':
      enemy.intent = 'REPOSITIONING';
      moveAwayFromPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.RETREAT_SPEED_MULT, dt);

      if (dist > DIST_PREFERRED) {
        enemy.aiState = 'IDLE';
        enemy.stateTimer = 0;
      }
      break;
  }
};
