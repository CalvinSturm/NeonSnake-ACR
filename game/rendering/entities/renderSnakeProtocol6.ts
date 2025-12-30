
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeProtocol6 = (
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
    
    // DIVINE GEOMETRY
    
    // 1. Connection Beams (Light)
    ctx.strokeStyle = `rgba(255, 215, 0, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isHead = i === 0;
        
        ctx.translate(p.x, p.y);
        
        // Z-Float
        const z = Math.sin(now * 0.002 + i) * 5;
        ctx.translate(0, z);
        
        // 2. Many Rings (Ophanim style)
        // Draw 3 intersecting rings rotating on different axes
        const size = isHead ? gridSize * 0.6 : gridSize * 0.4;
        
        ctx.strokeStyle = charColor;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        
        // Ring 1 (XY)
        ctx.beginPath();
        ctx.rotate(now * 0.001);
        ctx.ellipse(0, 0, size, size * 0.3, 0, 0, Math.PI*2);
        ctx.stroke();
        
        // Ring 2 (Rotated 60)
        ctx.rotate(Math.PI/3);
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.3, 0, 0, Math.PI*2);
        ctx.stroke();
        
        // Ring 3 (Rotated 120)
        ctx.rotate(Math.PI/3);
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.3, 0, 0, Math.PI*2);
        ctx.stroke();
        
        // 3. Central Eye
        ctx.rotate(-now * 0.001 - (Math.PI * 2 / 3)); // Undo rotation
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        // Eye shape
        ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -6, 6, 0); ctx.quadraticCurveTo(0, 6, -6, 0);
        ctx.fill();
        
        // Pupil
        if (isHead) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.translate(0, -z);
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
