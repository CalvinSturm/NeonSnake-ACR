
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel2 = (
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

    // Voxel Extrusion
    const height = gridSize * 0.8;

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
        
        // 3D Voxel
        // Top Face
        ctx.fillStyle = charColor;
        ctx.fillRect(-size/2, -size/2 - height, size, size);
        
        // Front Face
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Dimmer
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(-size/2, -size/2, size, height); 
        // Wait, standard 3D logic:
        
        // Let's do simple isometric projection
        // Top
        ctx.fillStyle = charColor;
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2 - height);
        ctx.lineTo(size/2, -size/2 - height);
        ctx.lineTo(size/2, size/2 - height);
        ctx.lineTo(-size/2, size/2 - height);
        ctx.fill();
        
        // Front
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Shadow overlay
        ctx.fillRect(-size/2, size/2 - height, size, height);
        
        // Side (Right) - Fake perspective
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.moveTo(size/2, -size/2 - height);
        ctx.lineTo(size/2 + 5, -size/2 - height + 5);
        ctx.lineTo(size/2 + 5, size/2 - height + 5);
        ctx.lineTo(size/2, size/2 - height);
        ctx.fill();

        ctx.restore();
    }
};
