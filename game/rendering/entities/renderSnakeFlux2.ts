
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux2 = (
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
    ctx.globalCompositeOperation = 'screen';

    // 1. Constellation Lines
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    
    // Jittery electricity
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 10;
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -now * 0.1;
    ctx.stroke();
    
    // 2. Solar Nodes
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isHead = i === 0;
        
        ctx.translate(p.x, p.y);
        
        const size = isHead ? gridSize * 0.6 : gridSize * 0.3;
        const pulse = 1 + Math.sin(now * 0.01 + i) * 0.2;
        
        // Radiant Core
        const grad = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * pulse);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, charColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
