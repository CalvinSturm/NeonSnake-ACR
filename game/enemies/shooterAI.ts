
import { Enemy, AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, moveAwayFromPlayer, angleToPlayer, stopMovement } from './enemyHelpers';
import { MOVEMENT_CONSTANTS } from '../../constants';

type ShooterState = 'PATROL' | 'CHARGE' | 'FIRE' | 'REPOSITION';

const RANGE_MIN = 8;
const RANGE_MAX = 16;
// Base Timers
const BASE_CHARGE_TIME = 1500;
const BASE_FIRE_TIME = 500;
const BASE_REPOSITION_TIME = 2000;

export const updateShooter = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'PATROL';
    enemy.stateTimer = 0;
    enemy.attackTimer = 0;
  }

  // Timer update handled centrally

  const dist = distanceToPlayer(enemy, playerPos);

  // Always face player unless firing (locked)
  if (enemy.aiState !== 'FIRE') {
      enemy.angle = angleToPlayer(enemy, playerPos);
  }

  // Scale timers based on difficulty
  const chargeTime = BASE_CHARGE_TIME * aggressionMod;
  const repositionTime = BASE_REPOSITION_TIME * aggressionMod;

  switch (enemy.aiState as ShooterState) {
    case 'PATROL':
      enemy.intent = 'REPOSITIONING';
      
      // Try to maintain ideal range
      if (dist < RANGE_MIN) {
        moveAwayFromPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.REPOSITION_SPEED_MULT, dt);
      } else if (dist > RANGE_MAX) {
        moveTowardPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.REPOSITION_SPEED_MULT, dt);
      } else {
        // In sweet spot, slow down and prepare to engage
        stopMovement(enemy);
        if (enemy.stateTimer && enemy.stateTimer > (1000 * aggressionMod)) {
            enemy.aiState = 'CHARGE';
            enemy.stateTimer = 0;
            enemy.attackTimer = 0;
        }
      }
      break;

    case 'CHARGE':
      enemy.intent = 'ATTACKING';
      stopMovement(enemy);
      
      enemy.angle = angleToPlayer(enemy, playerPos);

      if (enemy.attackTimer && enemy.attackTimer >= chargeTime) {
        enemy.aiState = 'FIRE';
        enemy.stateTimer = 0;
      }
      break;

    case 'FIRE':
      enemy.intent = 'ATTACKING';
      stopMovement(enemy);
      
      if (enemy.stateTimer && enemy.stateTimer > BASE_FIRE_TIME) {
        enemy.aiState = 'REPOSITION';
        enemy.stateTimer = 0;
        enemy.attackTimer = 0;
      }
      break;

    case 'REPOSITION':
      enemy.intent = 'REPOSITIONING';
      moveAwayFromPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.PATROL_SPEED_MULT, dt);
      
      if (enemy.stateTimer && enemy.stateTimer > repositionTime) {
        enemy.aiState = 'PATROL';
        enemy.stateTimer = 0;
      }
      break;
  }
};
