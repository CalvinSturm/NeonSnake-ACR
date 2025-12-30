
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon2 = (
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
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    
    // "Light Cycle" Trails
    // Draw two parallel lines
    const offset = gridSize * 0.25;
    
    // Left Track
    ctx.beginPath();
    ctx.moveTo(points[0].x - offset, points[0].y - offset); // Approx, not proper normal expansion but stylistically coherent for grid movement
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x - offset, points[i].y - offset);
    }
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Right Track
    ctx.beginPath();
    ctx.moveTo(points[0].x + offset, points[0].y + offset);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x + offset, points[i].y + offset);
    }
    ctx.stroke();
    
    // Head Triangle
    const head = points[0];
    ctx.translate(head.x, head.y);
    // Simple rotation logic
    let rot = 0;
    if (direction === 'DOWN') rot = Math.PI/2;
    if (direction === 'LEFT') rot = Math.PI;
    if (direction === 'UP') rot = -Math.PI/2;
    ctx.rotate(rot);
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(gridSize*0.4, 0);
    ctx.lineTo(-gridSize*0.3, gridSize*0.3);
    ctx.lineTo(-gridSize*0.3, -gridSize*0.3);
    ctx.fill();

    ctx.restore();
};
