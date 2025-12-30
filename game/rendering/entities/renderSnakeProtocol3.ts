
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeProtocol3 = (
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
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        
        // Rotating Shield Plates
        const rot = (now * 0.001) + (i * 0.5);
        ctx.rotate(rot);
        
        // Hexagon Shield
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        for(let j=0; j<6; j++) {
            const a = (j * Math.PI * 2) / 6;
            const r = 12;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if(j===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Inner Core
        ctx.rotate(-rot * 2); // Counter rotate
        ctx.fillStyle = '#fff';
        ctx.fillRect(-3, -3, 6, 6);
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
