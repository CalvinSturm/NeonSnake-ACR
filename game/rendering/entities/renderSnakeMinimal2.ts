
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal2 = (
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
    const { ctx, gridSize, halfGrid } = rc;
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
    
    // Thin white line connector
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    // Geometric Shapes Sequence
    // Alternating Square, Circle, Triangle
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const shapeType = i % 3;
        const size = gridSize * 0.4;
        
        ctx.translate(p.x, p.y);
        ctx.fillStyle = i === 0 ? '#fff' : charColor;
        
        ctx.beginPath();
        if (shapeType === 0) { // Circle
            ctx.arc(0, 0, size/2, 0, Math.PI*2);
        } else if (shapeType === 1) { // Square
            ctx.rect(-size/2, -size/2, size, size);
        } else { // Triangle
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/2, size/2);
            ctx.lineTo(-size/2, size/2);
        }
        ctx.fill();
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
