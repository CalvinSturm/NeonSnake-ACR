import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal = (
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
    
    const segments: { x: number, y: number }[] = [];
    
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
        
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    
    // Draw connecting line
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    
    // Outline style
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw nodes
    ctx.fillStyle = '#000'; // Black center
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 2;

    for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        ctx.beginPath();
        // Head is larger
        const radius = i === 0 ? gridSize * 0.4 : gridSize * 0.25;
        
        if (i === 0) {
            ctx.rect(s.x - radius, s.y - radius, radius*2, radius*2);
        } else {
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
};
