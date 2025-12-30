
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal3 = (
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
    
    // Dashed Connector
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    
    // Vertices / Measurements
    ctx.setLineDash([]);
    ctx.fillStyle = '#000';
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        
        // Node
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Crosshair
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
        
        ctx.strokeStyle = charColor;
        ctx.translate(-p.x, -p.y);
    }
    
    // Head Target
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.rotate(now * 0.001);
    ctx.strokeStyle = charColor;
    ctx.strokeRect(-10, -10, 20, 20);

    ctx.restore();
};
