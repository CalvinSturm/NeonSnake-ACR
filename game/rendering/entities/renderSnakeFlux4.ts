
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux4 = (
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
    
    // Double Helix Calculation
    // We draw two intertwining paths along the snake's spine
    
    const waveFreq = 0.5;
    const waveAmp = 10;
    const timeOffset = now * 0.005;

    // Helix A
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // Calculate tangent/normal roughly
        let nx = 0, ny = 0;
        if (i < points.length - 1) {
            const next = points[i+1];
            const dx = next.x - p.x;
            const dy = next.y - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            nx = -dy / dist;
            ny = dx / dist;
        } else if (i > 0) {
            // Use previous for tail end
            const prev = points[i-1];
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const dist = Math.hypot(dx, dy) || 1;
            nx = -dy / dist;
            ny = dx / dist;
        }

        const offset = Math.sin((i * waveFreq) + timeOffset) * waveAmp;
        const hx = p.x + (nx * offset);
        const hy = p.y + (ny * offset);
        
        if (i===0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Helix B (Phase shifted PI)
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let nx = 0, ny = 0;
        if (i < points.length - 1) {
            const next = points[i+1];
            const dx = next.x - p.x;
            const dy = next.y - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            nx = -dy / dist;
            ny = dx / dist;
        } else if (i > 0) {
            const prev = points[i-1];
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const dist = Math.hypot(dx, dy) || 1;
            nx = -dy / dist;
            ny = dx / dist;
        }

        const offset = Math.sin((i * waveFreq) + timeOffset + Math.PI) * waveAmp;
        const hx = p.x + (nx * offset);
        const hy = p.y + (ny * offset);
        
        if (i===0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.strokeStyle = '#fff'; // White contrast
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Head Core
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
