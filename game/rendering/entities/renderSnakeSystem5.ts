
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem5 = (
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

    ctx.save();
    
    // SYSTEM 5: Mainframe
    // Circuit board traces on the segments.
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        
        ctx.translate(p.x, p.y);
        
        const size = gridSize * 0.8;
        
        // Chip Base
        ctx.fillStyle = '#002200'; // Dark PCB Green
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Border
        ctx.strokeStyle = '#004400';
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // Traces
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 1;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        // Simple circuit pattern
        ctx.moveTo(-size/4, -size/2); ctx.lineTo(-size/4, 0); ctx.lineTo(size/4, 0); ctx.lineTo(size/4, size/2);
        ctx.stroke();
        
        // Soldering pads
        ctx.fillStyle = '#aa8800'; // Gold
        ctx.shadowBlur = 0;
        ctx.fillRect(-size/4 - 1, -size/2 + 2, 2, 2);
        ctx.fillRect(size/4 - 1, size/2 - 4, 2, 2);
        
        // Head LED
        if (i === 0) {
            ctx.fillStyle = '#f00';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 10;
            ctx.fillRect(-2, -2, 4, 4);
        }
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
