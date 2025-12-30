
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch4 = (
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

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    
    // Draw "Redacted" Bars
    for (let i = 0; i < points.length; i++) {
        if (Math.random() < 0.1) continue; // Flicker out entirely

        const p = points[i];
        const w = gridSize * 1.2;
        const h = gridSize * 0.6;
        
        ctx.translate(p.x, p.y);
        
        // Jitter
        const jx = (Math.random()-0.5) * 4;
        const jy = (Math.random()-0.5) * 4;
        ctx.translate(jx, jy);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-w/2, -h/2, w, h);
        
        // Random chars
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        const txt = Math.random() > 0.5 ? 'ERR' : 'VOID';
        ctx.fillText(txt, -w/3, h/3);
        
        // Strike through
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/2, 0); ctx.lineTo(w/2, 0);
        ctx.stroke();
        
        ctx.translate(-p.x - jx, -p.y - jy);
    }

    ctx.restore();
};
