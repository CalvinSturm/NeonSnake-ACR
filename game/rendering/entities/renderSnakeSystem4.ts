
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem4 = (
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
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const val = Math.round(Math.random()); // 0 or 1 flickers
        
        ctx.translate(p.x, p.y);
        
        ctx.fillStyle = '#0f0';
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 8;
        
        ctx.fillText(val.toString(), 0, 0);
        
        // Matrix trail box
        ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 - (i/points.length)*0.5})`;
        ctx.strokeRect(-8, -8, 16, 16);
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
