
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem3 = (
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
    
    // Draw Trace Lines between nodes
    ctx.strokeStyle = '#004400'; // PCB dark green
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) {
        // Orthogonal routing simulation
        const p1 = points[i-1];
        const p2 = points[i];
        // Just straight lines for now, but wide
        ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
    
    // Gold Traces
    ctx.strokeStyle = '#aa8800';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        
        // Chip Body
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, -8, 16, 16);
        
        // Pins
        ctx.fillStyle = '#ccc';
        for(let j=0; j<4; j++) { // 4 pins per side
            ctx.fillRect(-10, -6 + j*4, 2, 2); // Left
            ctx.fillRect(8, -6 + j*4, 2, 2);  // Right
        }
        
        // Label/Marking
        if (i===0) {
            ctx.fillStyle = '#fff';
            ctx.font = '6px monospace';
            ctx.fillText('CPU', -6, 2);
        } else {
            ctx.fillStyle = charColor;
            ctx.fillRect(-2, -2, 4, 4);
        }
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
