
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic4 = (
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
    
    // Spine
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#eee'; // Bone white
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Ribs
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isHead = i === 0;
        
        ctx.translate(p.x, p.y);
        
        // Rib Cage
        if (!isHead) {
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-8, 6);
            ctx.moveTo(0, 0); ctx.lineTo(8, 6);
            ctx.stroke();
        } else {
            // Skull
            ctx.fillStyle = '#eee';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fill();
            // Eye sockets
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-3, -2, 2, 0, Math.PI*2);
            ctx.arc(3, -2, 2, 0, Math.PI*2);
            ctx.fill();
            // Glowing pupils
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-3, -2, 1, 1);
            ctx.fillRect(3, -2, 1, 1);
        }
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
