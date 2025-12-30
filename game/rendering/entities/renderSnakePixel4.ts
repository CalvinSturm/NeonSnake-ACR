
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel4 = (
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
        const size = gridSize * 0.8;

        ctx.save();
        ctx.translate(x, y);
        
        // Floating Voxel Animation
        const bounce = Math.sin((now / 200) + i) * 5;
        ctx.translate(0, bounce);
        
        // True Isometric Cube Drawing
        // Top Face
        ctx.fillStyle = charColor;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, -size/2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-size, -size/2);
        ctx.closePath();
        ctx.fill();
        
        // Right Face (Darker)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; 
        ctx.globalCompositeOperation = 'source-atop'; // Simple shading hack or explicit color
        // Actually let's just use explicit colors for 2D canvas
        ctx.fillStyle = '#222'; // Shadow side
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, -size/2);
        ctx.lineTo(size, size/2);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        // Left Face (Mid)
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size/2);
        ctx.lineTo(-size, size/2);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        // Head Face
        if (i === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-4, -4, 8, 8); // Simple centered eye on the vertex?
        }

        ctx.restore();
    }
};
