
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeProtocol4 = (
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
    
    // Positions
    const points: {x:number, y:number}[] = [];
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        if (i === snake.length - 1) prev = prevTail || curr;
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        points.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    const charColor = '#FFD700'; // Gold

    ctx.save();
    
    // Halo Rings
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isHead = i === 0;
        
        ctx.translate(p.x, p.y);
        
        const size = isHead ? gridSize * 0.6 : gridSize * 0.4;
        
        // Rotating Ring 1
        ctx.save();
        ctx.rotate(now * 0.002 + i);
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(-size, -size, size*2, size*2);
        ctx.restore();
        
        // Ring 2
        ctx.save();
        ctx.rotate(-now * 0.002 + i);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Eye
        if (isHead) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
