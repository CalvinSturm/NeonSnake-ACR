
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeProtocol5 = (
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
    
    // PROTOCOL 5: Guardian
    // Floating golden rings, very royal/divine.
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isHead = i === 0;
        
        ctx.translate(p.x, p.y);
        
        // Z-Float
        const z = Math.sin(now * 0.003 + i) * 3;
        ctx.translate(0, z);
        
        // Main Ring
        ctx.beginPath();
        ctx.arc(0, 0, gridSize * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Inner Ring (Rotating)
        ctx.save();
        ctx.rotate(now * 0.005 + i);
        ctx.beginPath();
        ctx.rect(-6, -6, 12, 12);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
        
        // Connectors (Light beams)
        if (i > 0) {
            // Draw line to previous (in local space this is hard, better to do global loop)
        }
        
        // Head Halo
        if (isHead) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.translate(0, -z);
        ctx.translate(-p.x, -p.y);
    }
    
    // Connection Beams (Global)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = `rgba(255, 215, 0, 0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
};
