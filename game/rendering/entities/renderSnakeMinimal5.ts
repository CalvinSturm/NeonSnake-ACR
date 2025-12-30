
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal5 = (
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
    
    // MINIMAL 5: Vector Ops
    // Tactical HUD style. Thin lines, brackets, data readouts.
    
    // Connector Line (Thin)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Nodes
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // Brackets [ ]
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 1;
        const s = 6;
        
        ctx.beginPath();
        // Left Bracket
        ctx.moveTo(-s+2, -s); ctx.lineTo(-s, -s); ctx.lineTo(-s, s); ctx.lineTo(-s+2, s);
        // Right Bracket
        ctx.moveTo(s-2, -s); ctx.lineTo(s, -s); ctx.lineTo(s, s); ctx.lineTo(s-2, s);
        ctx.stroke();
        
        // Center Dot
        if (i === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -2, 4, 4);
            
            // Direction Arrow
            let rot = 0;
            if (direction === 'DOWN') rot = Math.PI/2;
            if (direction === 'LEFT') rot = Math.PI;
            if (direction === 'UP') rot = -Math.PI/2;
            
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(12, 0); ctx.lineTo(8, 3); ctx.lineTo(8, -3);
            ctx.fill();
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(-1, -1, 2, 2);
        }
        
        ctx.restore();
    }

    ctx.restore();
};
