
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon5 = (
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
    
    // Points
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

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // NEON 5: ULTRA-VIOLET
    // Super-sharp lines, deep blacks, intense gradients.
    
    // 1. The Void Path (Black mask to cut background)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = gridSize;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    // 2. Gradient Stroke
    const grad = ctx.createLinearGradient(points[0].x, points[0].y, points[points.length-1].x, points[points.length-1].y);
    grad.addColorStop(0, '#fff'); // Head white hot
    grad.addColorStop(0.2, charColor);
    grad.addColorStop(1, '#aa00ff'); // Deep violet tail

    ctx.strokeStyle = grad;
    ctx.lineWidth = gridSize * 0.8;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 20;
    ctx.stroke();
    
    // 3. Inner Detail (Center line)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // 4. Head Graphic
    const head = points[0];
    ctx.translate(head.x, head.y);
    
    // Rotation
    let rot = 0;
    if (direction === 'DOWN') rot = Math.PI/2;
    if (direction === 'LEFT') rot = Math.PI;
    if (direction === 'UP') rot = -Math.PI/2;
    ctx.rotate(rot);

    // Arrowhead
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-5, -8);
    ctx.fill();

    ctx.restore();
};
