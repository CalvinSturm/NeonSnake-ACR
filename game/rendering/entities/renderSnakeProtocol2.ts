
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawSphere } from '../primitives';

export const renderSnakeProtocol2 = (
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

    // Render Clean Spherical Drones (Portal Turret Style)
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        
        // Floating Sine Wave
        const z = Math.sin(now * 0.003 + i) * 5;
        
        drawSphere(ctx, p.x, p.y + z, gridSize * 0.4, '#fff'); // White shell
        
        // Eye / Sensor
        ctx.save();
        ctx.translate(p.x, p.y + z);
        
        // Eye (Always faces somewhat towards screen/action)
        ctx.fillStyle = i === 0 ? charColor : '#333';
        ctx.shadowColor = i === 0 ? charColor : 'transparent';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, gridSize * 0.15, 0, Math.PI*2);
        ctx.fill();
        
        // Scan line
        if (i === 0) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
            ctx.stroke();
        }
        
        ctx.restore();
    }
};
