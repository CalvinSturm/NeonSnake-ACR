
import { Enemy, AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, moveAwayFromPlayer, angleToPlayer, stopMovement } from './enemyHelpers';
import { MOVEMENT_CONSTANTS } from '../../constants';
import { SHOOTER } from './enemyConstants';

type ShooterState = 'PATROL' | 'CHARGE' | 'FIRE' | 'REPOSITION';

export const updateShooter = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'PATROL';
    enemy.stateTimer = 0;
    enemy.attackTimer = 0;
  }

  const dist = distanceToPlayer(enemy, playerPos);

  // Always face player unless firing (locked)
  if (enemy.aiState !== 'FIRE') {
      enemy.angle = angleToPlayer(enemy, playerPos);
  }

  // Scale timers based on difficulty
  const chargeTime = SHOOTER.CHARGE_TIME * aggressionMod;
  const repositionTime = SHOOTER.REPOSITION_TIME * aggressionMod;

  switch (enemy.aiState as ShooterState) {
    case 'PATROL':
      enemy.intent = 'REPOSITIONING';

      // Try to maintain ideal range
      if (dist < SHOOTER.RANGE_MIN) {
        moveAwayFromPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.REPOSITION_SPEED_MULT, dt);
      } else if (dist > SHOOTER.RANGE_MAX) {
        moveTowardPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.REPOSITION_SPEED_MULT, dt);
      } else {
        // In sweet spot, slow down and prepare to engage
        stopMovement(enemy);
        if (enemy.stateTimer && enemy.stateTimer > (SHOOTER.PATROL_ENGAGE_TIME * aggressionMod)) {
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

      if (enemy.stateTimer && enemy.stateTimer > SHOOTER.FIRE_TIME) {
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
