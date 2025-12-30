
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal6 = (
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
    
    // ARCHITECTURAL BLUEPRINT
    
    // 1. Connection Lines (Golden Ratio)
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    
    // Main Spine
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    // Triangulation (Connect every node to every 2nd node)
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for(let i=0; i<points.length-2; i+=2) {
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i+2].x, points[i+2].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 2. Nodes (Sacred Geometry)
    for(let i=0; i<points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        
        // Rotating circles
        const r = gridSize * 0.3;
        ctx.rotate(now * 0.001 + i);
        
        ctx.strokeStyle = i === 0 ? '#fff' : charColor;
        ctx.lineWidth = 1;
        
        // Circle
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tangents
        ctx.beginPath();
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        ctx.moveTo(0, -r); ctx.lineTo(0, r);
        ctx.stroke();
        
        ctx.rotate(-(now * 0.001 + i)); // Reset rot
        ctx.translate(-p.x, -p.y);
    }
    
    // 3. Head Projection
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI*2);
    ctx.fill();
    
    // Forward Cone
    let rot = 0;
    if (direction === 'DOWN') rot = Math.PI/2;
    if (direction === 'LEFT') rot = Math.PI;
    if (direction === 'UP') rot = -Math.PI/2;
    ctx.rotate(rot);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(100, -30);
    ctx.moveTo(0,0);
    ctx.lineTo(100, 30);
    ctx.stroke();

    ctx.restore();
};
