
import { Enemy, Point } from '../../types';

export const updateTimers = (entity: any, dt: number, timers: string[]) => {
    timers.forEach(t => {
        entity[t] = (entity[t] || 0) + dt;
    });
};

export const applyMovement = (
    entity: Enemy, 
    dt: number, 
    walls: Point[], 
    cols: number, 
    rows: number, 
    speedMod: number = 1.0,
    ignoreBounds: boolean = false
) => {
    const dtSec = dt / 1000;
    const nextX = entity.x + entity.vx * speedMod * dtSec;
    const nextY = entity.y + entity.vy * speedMod * dtSec;
    
    // Check X
    if (!checkCollision(nextX, entity.y, walls, cols, rows, ignoreBounds)) {
        entity.x = nextX;
    } else {
        entity.vx = 0;
    }

    // Check Y
    if (!checkCollision(entity.x, nextY, walls, cols, rows, ignoreBounds)) {
        entity.y = nextY;
    } else {
        entity.vy = 0;
    }
};

const checkCollision = (x: number, y: number, walls: Point[], cols: number, rows: number, ignoreBounds: boolean): boolean => {
    // If ignoring bounds (entering state), we ignore ALL static collisions to prevent spawn locks
    if (ignoreBounds) return false;

    const gx = Math.round(x);
    const gy = Math.round(y);
    
    // Screen Boundaries
    if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return true;
    
    // Walls
    return walls.some(w => w.x === gx && w.y === gy);
};
