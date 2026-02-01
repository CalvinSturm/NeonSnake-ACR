
import { Enemy } from './enemyTypes';

interface Point {
  x: number;
  y: number;
}

export const distanceToPlayer = (enemy: Point, player: Point): number => {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const angleToPlayer = (enemy: Point, player: Point): number => {
  return Math.atan2(player.y - enemy.y, player.x - enemy.x);
};

/**
 * Updates vx/vy to move towards the player.
 */
export const moveTowardPlayer = (enemy: Enemy, player: Point, speedScale: number, dt: number): void => {
  const angle = angleToPlayer(enemy, player);
  // Apply acceleration towards player
  // Assuming simple velocity setting for crisp movement, or acceleration if physics-based.
  // Given the "Snake" style arcade physics, direct velocity setting with some inertia is usually best.
  // Here we'll set target velocity.
  
  const targetVx = Math.cos(angle) * enemy.speed * speedScale;
  const targetVy = Math.sin(angle) * enemy.speed * speedScale;
  
  // Simple lerp for "turn speed" / inertia
  const inertia = 0.1; // 0 = instant, 1 = no change
  enemy.vx = enemy.vx * inertia + targetVx * (1 - inertia);
  enemy.vy = enemy.vy * inertia + targetVy * (1 - inertia);
};

export const moveAwayFromPlayer = (enemy: Enemy, player: Point, speedScale: number, dt: number): void => {
  const angle = angleToPlayer(enemy, player) + Math.PI; // Opposite direction
  
  const targetVx = Math.cos(angle) * enemy.speed * speedScale;
  const targetVy = Math.sin(angle) * enemy.speed * speedScale;
  
  const inertia = 0.1;
  enemy.vx = enemy.vx * inertia + targetVx * (1 - inertia);
  enemy.vy = enemy.vy * inertia + targetVy * (1 - inertia);
};

export const movePerpendicular = (enemy: Enemy, player: Point, clockwise: boolean, speedScale: number): void => {
  let angle = angleToPlayer(enemy, player);
  angle += clockwise ? Math.PI / 2 : -Math.PI / 2;
  
  const targetVx = Math.cos(angle) * enemy.speed * speedScale;
  const targetVy = Math.sin(angle) * enemy.speed * speedScale;
  
  const inertia = 0.1;
  enemy.vx = enemy.vx * inertia + targetVx * (1 - inertia);
  enemy.vy = enemy.vy * inertia + targetVy * (1 - inertia);
};

export const stopMovement = (enemy: Enemy): void => {
  enemy.vx *= 0.8;
  enemy.vy *= 0.8;
  if (Math.abs(enemy.vx) < 0.1) enemy.vx = 0;
  if (Math.abs(enemy.vy) < 0.1) enemy.vy = 0;
};

export const clampVector = (vx: number, vy: number, maxSpeed: number): { vx: number, vy: number } => {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag > maxSpeed) {
    return {
      vx: (vx / mag) * maxSpeed,
      vy: (vy / mag) * maxSpeed
    };
  }
  return { vx, vy };
};
