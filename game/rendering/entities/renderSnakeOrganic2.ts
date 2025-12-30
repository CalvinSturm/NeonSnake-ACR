
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic2 = (
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

    const points: {x:number, y:number, angle:number}[] = [];
    
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
        
        let angle = 0;
        if (i === 0) {
            if (direction === 'RIGHT') angle = 0;
            if (direction === 'DOWN') angle = Math.PI/2;
            if (direction === 'LEFT') angle = Math.PI;
            if (direction === 'UP') angle = -Math.PI/2;
        } else {
            if (points[i-1]) angle = Math.atan2(points[i-1].y - iy * gridSize, points[i-1].x - ix * gridSize);
        }
        
        points.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid, angle });
    }

    // Draw Chitin Plates
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        
        ctx.save();
        ctx.translate(p.x, p.y);
        // Correct angle for body segments to face forward relative to movement?
        // Simple "blob" logic works better for organic
        
        // Pulsing abdomen
        const pulse = Math.sin(now * 0.01 + i) * 2;
        const size = (gridSize * 0.5) + pulse;
        
        // Base
        ctx.fillStyle = '#1a0505'; // Dark organic
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI*2);
        ctx.fill();
        
        // Shell
        ctx.fillStyle = charColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, -2, size * 0.8, size * 0.5, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Legs
        ctx.strokeStyle = '#4a0a0a';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        
        // Left Legs
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-size*1.5, size);
        ctx.moveTo(0, 0); ctx.lineTo(-size*1.5, -size);
        ctx.stroke();
        
        // Right Legs
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(size*1.5, size);
        ctx.moveTo(0, 0); ctx.lineTo(size*1.5, -size);
        ctx.stroke();

        // Head Mandibles
        if (i === 0) {
            ctx.rotate(p.angle);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(5, -5); ctx.lineTo(15, -2); ctx.lineTo(5, 0);
            ctx.moveTo(5, 5); ctx.lineTo(15, 2); ctx.lineTo(5, 0);
            ctx.fill();
        }

        ctx.restore();
    }
};
