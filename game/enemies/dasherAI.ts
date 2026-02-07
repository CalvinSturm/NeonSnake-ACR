
import { Enemy, AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, angleToPlayer, stopMovement, clampVector } from './enemyHelpers';
import { MOVEMENT_CONSTANTS } from '../../constants';
import { DASHER } from './enemyConstants';

type DasherState = 'CHASE' | 'CHARGE' | 'DASH' | 'COOLDOWN';

export const updateDasher = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod, bossActive } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'CHASE';
    enemy.stateTimer = 0;
  }

  const dist = distanceToPlayer(enemy, playerPos);

  // Dashers are more aggressive if Boss is active
  const bossMod = bossActive ? DASHER.BOSS_ACTIVE_MODIFIER : 1.0;
  const chargeDuration = DASHER.CHARGE_DURATION * aggressionMod * bossMod;
  const cooldownDuration = DASHER.COOLDOWN_DURATION * aggressionMod * bossMod;

  switch (enemy.aiState as DasherState) {
    case 'CHASE':
      enemy.intent = 'REPOSITIONING';
      enemy.dashState = 'IDLE';
      enemy.angle = angleToPlayer(enemy, playerPos);
      moveTowardPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.APPROACH_SPEED_MULT, dt);

      if (dist < DASHER.CHARGE_TRIGGER_DISTANCE) {
        enemy.aiState = 'CHARGE';
        enemy.dashState = 'CHARGE';
        enemy.stateTimer = 0;
      }
      break;

    case 'CHARGE':
      enemy.intent = 'ATTACKING';
      enemy.dashState = 'CHARGE';
      stopMovement(enemy);

      enemy.angle = angleToPlayer(enemy, playerPos);
      enemy.dashAngle = enemy.angle;

      if (enemy.stateTimer && enemy.stateTimer >= chargeDuration) {
        enemy.aiState = 'DASH';
        enemy.dashState = 'DASH';
        enemy.stateTimer = 0;
      }
      break;

    case 'DASH':
      enemy.intent = 'ATTACKING';
      enemy.dashState = 'DASH';

      const ang = enemy.dashAngle || 0;
      const rawVx = Math.cos(ang) * enemy.speed * MOVEMENT_CONSTANTS.DASH_SPEED_MULT;
      const rawVy = Math.sin(ang) * enemy.speed * MOVEMENT_CONSTANTS.DASH_SPEED_MULT;

      const clamped = clampVector(rawVx, rawVy, DASHER.MAX_DASH_SPEED);
      enemy.vx = clamped.vx;
      enemy.vy = clamped.vy;

      if (enemy.stateTimer && enemy.stateTimer >= DASHER.DASH_DURATION) {
        enemy.aiState = 'COOLDOWN';
        enemy.dashState = 'COOLDOWN';
        enemy.stateTimer = 0;
      }
      break;

    case 'COOLDOWN':
      enemy.intent = 'VULNERABLE';
      enemy.dashState = 'COOLDOWN';
      stopMovement(enemy);

      if (enemy.stateTimer && enemy.stateTimer >= cooldownDuration) {
        enemy.aiState = 'CHASE';
        enemy.dashState = 'IDLE';
        enemy.stateTimer = 0;
      }
      break;
  }
};
