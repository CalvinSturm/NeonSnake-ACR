
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon4 = (
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Create path once
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);

    // 1. Broad Glow
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = charColor;
    ctx.lineWidth = gridSize;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    
    // 2. Main Beam
    ctx.shadowBlur = 15;
    ctx.lineWidth = gridSize * 0.5;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    
    // 3. White Hot Core
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = gridSize * 0.15;
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    // Head Flare
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.rotate(now * 0.005);
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    // Star shape
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0,0);
        ctx.lineTo(15, 0);
        ctx.lineTo(2, 2);
        ctx.lineTo(0,0);
    }
    ctx.fill();

    ctx.restore();
};
