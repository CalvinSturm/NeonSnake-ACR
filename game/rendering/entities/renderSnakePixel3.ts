
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel3 = (
    rc: RenderContext,
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    visualNsAngle: number,
    tailIntegrity: number
) => {
    if (snake.length === 0) return;
    const { ctx, gridSize, halfGrid, now } = rc;
    const charColor = charProfile?.color || COLORS.snakeHead;

    for (let i = snake.length - 1; i >= 0; i--) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        if (i === snake.length - 1) prev = prevTail || curr;
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        const x = ix * gridSize + halfGrid;
        const y = iy * gridSize + halfGrid;
        const size = gridSize * 0.9;

        ctx.save();
        ctx.translate(x, y);
        
        // Dither Pattern
        const isDark = (Math.floor(x/4) + Math.floor(y/4)) % 2 === 0;
        
        ctx.fillStyle = isDark ? charColor : '#000';
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Inner pixel noise
        if (Math.random() < 0.2) {
            ctx.fillStyle = '#fff';
            const rx = (Math.random()-0.5) * size;
            const ry = (Math.random()-0.5) * size;
            ctx.fillRect(rx, ry, 4, 4);
        }
        
        // Head Face
        if (i === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(2, -6, 4, 4);
            ctx.fillRect(-6, 2, 12, 4); // Mouth
        }

        ctx.restore();
    }
};
