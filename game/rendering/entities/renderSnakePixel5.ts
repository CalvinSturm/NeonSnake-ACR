
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel5 = (
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
        
        // PIXEL 5: Holo-Bit
        // A cloud of smaller voxels that form the shape.
        // Floating, detached cubes.
        
        const subSize = size / 3;
        const t = now * 0.002;
        
        // 3x3 Grid of sub-voxels
        for (let gx = -1; gx <= 1; gx++) {
            for (let gy = -1; gy <= 1; gy++) {
                // Skip center for hollow look? Or keep it.
                // Animate Z-depth
                const offset = Math.sin(t + gx + gy + i) * 3;
                
                ctx.fillStyle = charColor;
                // Additive blend for hologram feel
                ctx.globalCompositeOperation = 'screen';
                
                ctx.save();
                ctx.translate(gx * subSize, gy * subSize + offset);
                
                // Draw simple cube face
                ctx.fillRect(-subSize/2 + 1, -subSize/2 + 1, subSize - 2, subSize - 2);
                
                // Highlight
                ctx.fillStyle = '#fff';
                ctx.fillRect(-subSize/2 + 1, -subSize/2 + 1, 2, 2);
                
                ctx.restore();
            }
        }
        
        if (i === 0) {
            // Head Eye
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillRect(-4, -4, 8, 8);
        }

        ctx.restore();
    }
};
