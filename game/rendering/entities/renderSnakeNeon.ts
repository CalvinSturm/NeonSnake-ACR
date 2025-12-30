import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon = (
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
    
    const segments: { x: number, y: number }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer Glow
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = charColor;
    ctx.lineWidth = gridSize * 0.6;
    
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    ctx.stroke();

    // Inner Core (White hot)
    ctx.shadowBlur = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gridSize * 0.2;
    ctx.stroke();

    // Head
    const head = segments[0];
    ctx.translate(head.x, head.y);
    
    // Simple Diamond Head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, gridSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
