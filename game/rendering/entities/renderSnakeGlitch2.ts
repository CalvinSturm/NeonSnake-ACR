
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch2 = (
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

    for (let i = 0; i < snake.length; i++) {
        // Randomly skip segments to simulate corruption
        if (Math.random() < 0.1) continue;

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
        
        // Jitter
        const jx = (Math.random() - 0.5) * 5;
        const jy = (Math.random() - 0.5) * 5;

        ctx.save();
        ctx.translate(x + jx, y + jy);
        
        // "Missing Texture" pattern
        const size = gridSize * 0.7;
        if (Math.random() < 0.5) {
            // Magenta/Black
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-size/2, -size/2, size/2, size/2);
            ctx.fillRect(0, 0, size/2, size/2);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, -size/2, size/2, size/2);
            ctx.fillRect(-size/2, 0, size/2, size/2);
        } else {
            // Wireframe
            ctx.strokeStyle = charColor;
            ctx.strokeRect(-size/2, -size/2, size, size);
            ctx.beginPath();
            ctx.moveTo(-size/2, -size/2); ctx.lineTo(size/2, size/2);
            ctx.stroke();
        }

        ctx.restore();
    }
};
