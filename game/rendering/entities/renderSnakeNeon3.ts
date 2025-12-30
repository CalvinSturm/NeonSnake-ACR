
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon3 = (
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
    
    // Draw "Road" under snake
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    
    // Gradient Fill for Body
    // Create a path along the snake
    ctx.beginPath();
    
    // Need to extrude width to make a ribbon
    // Simplified: Just draw thick line
    ctx.lineWidth = gridSize * 0.8;
    ctx.strokeStyle = `rgba(0,0,0,0.8)`;
    
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    // Grid Lines on Body
    ctx.lineWidth = 1;
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 5;
    
    // Edges
    const offset = gridSize * 0.4;
    // We'd need normals to do this perfectly for turns, 
    // but for NEON3 let's just do individual boxes to ensure grid look
    
    for(let i=0; i<points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        // Box
        ctx.strokeRect(-offset, -offset, offset*2, offset*2);
        // X
        ctx.beginPath();
        ctx.moveTo(-offset, -offset); ctx.lineTo(offset, offset);
        ctx.moveTo(offset, -offset); ctx.lineTo(-offset, offset);
        ctx.stroke();
        ctx.translate(-p.x, -p.y);
    }
    
    // Head Sun
    const head = points[0];
    ctx.translate(head.x, head.y);
    const grad = ctx.createLinearGradient(0, -10, 0, 10);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(1, '#ff00aa');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI, true); // Top half circle
    ctx.fill();
    
    // Horizon lines
    ctx.fillStyle = '#000';
    ctx.fillRect(-12, -2, 24, 2);
    ctx.fillRect(-12, -6, 24, 2);

    ctx.restore();
};
