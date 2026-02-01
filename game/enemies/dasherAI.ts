
import { Enemy, AIContext } from './enemyTypes';
import { distanceToPlayer, moveTowardPlayer, angleToPlayer, stopMovement, clampVector } from './enemyHelpers';
import { MOVEMENT_CONSTANTS } from '../../constants';

type DasherState = 'CHASE' | 'CHARGE' | 'DASH' | 'COOLDOWN';

const CHARGE_DIST = 10;
const BASE_CHARGE_DURATION = 800;
const DASH_DURATION = 400;
const MAX_DASH_SPEED = 600;
const BASE_COOLDOWN_DURATION = 1500;

export const updateDasher = (enemy: Enemy, ctx: AIContext) => {
  const { dt, playerPos, aggressionMod, bossActive } = ctx;

  if (!enemy.aiState) {
    enemy.aiState = 'CHASE';
    enemy.stateTimer = 0;
  }

  // Timer update handled centrally

  const dist = distanceToPlayer(enemy, playerPos);

  // Dashers are more aggressive if Boss is active
  const bossMod = bossActive ? 0.7 : 1.0;
  const chargeDuration = BASE_CHARGE_DURATION * aggressionMod * bossMod;
  const cooldownDuration = BASE_COOLDOWN_DURATION * aggressionMod * bossMod;

  switch (enemy.aiState as DasherState) {
    case 'CHASE':
      enemy.intent = 'REPOSITIONING';
      enemy.angle = angleToPlayer(enemy, playerPos);
      moveTowardPlayer(enemy, playerPos, MOVEMENT_CONSTANTS.APPROACH_SPEED_MULT, dt);

      if (dist < CHARGE_DIST) {
        enemy.aiState = 'CHARGE';
        enemy.stateTimer = 0;
      }
      break;

    case 'CHARGE':
      enemy.intent = 'ATTACKING';
      stopMovement(enemy);
      
      enemy.angle = angleToPlayer(enemy, playerPos);
      enemy.dashAngle = enemy.angle;

      if (enemy.stateTimer && enemy.stateTimer >= chargeDuration) {
        enemy.aiState = 'DASH';
        enemy.stateTimer = 0;
      }
      break;

    case 'DASH':
      enemy.intent = 'ATTACKING';
      
      const ang = enemy.dashAngle || 0;
      const rawVx = Math.cos(ang) * enemy.speed * MOVEMENT_CONSTANTS.DASH_SPEED_MULT;
      const rawVy = Math.sin(ang) * enemy.speed * MOVEMENT_CONSTANTS.DASH_SPEED_MULT;
      
      const clamped = clampVector(rawVx, rawVy, MAX_DASH_SPEED);
      enemy.vx = clamped.vx;
      enemy.vy = clamped.vy;
      
      if (enemy.stateTimer && enemy.stateTimer >= DASH_DURATION) {
        enemy.aiState = 'COOLDOWN';
        enemy.stateTimer = 0;
      }
      break;

    case 'COOLDOWN':
      enemy.intent = 'VULNERABLE';
      stopMovement(enemy);
      
      if (enemy.stateTimer && enemy.stateTimer >= cooldownDuration) {
        enemy.aiState = 'CHASE';
        enemy.stateTimer = 0;
      }
      break;
  }
};
