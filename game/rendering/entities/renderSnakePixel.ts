import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel = (
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
        
        const x = ix * gridSize;
        const y = iy * gridSize;
        const size = gridSize;

        ctx.save();
        ctx.translate(x, y);

        // Draw "Pixel" block (inset slightly)
        ctx.fillStyle = charColor;
        
        // Main block
        const inset = 2;
        ctx.fillRect(inset, inset, size - inset*2, size - inset*2);
        
        // Highlight (Top Left)
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(inset, inset, 4, 4);

        // Shadow (Bottom Right)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(size - inset - 4, size - inset - 4, 4, 4);

        // Eyes for Head
        if (i === 0) {
            ctx.fillStyle = '#000';
            // Determine facing
            let dx = 0, dy = 0;
            if (direction === 'RIGHT') dx = 1;
            if (direction === 'LEFT') dx = -1;
            if (direction === 'UP') dy = -1;
            if (direction === 'DOWN') dy = 1;

            // Offset eyes based on direction
            const ex = size/2 + (dx * 6);
            const ey = size/2 + (dy * 6);
            
            ctx.fillRect(ex - 2 - (dy*4), ey - 2 - (dx*4), 4, 4);
            ctx.fillRect(ex - 2 + (dy*4), ey - 2 + (dx*4), 4, 4);
        }

        ctx.restore();
    }
};
