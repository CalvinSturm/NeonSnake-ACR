
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic = (
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
    
    // Calculate points
    const points: { x: number, y: number }[] = [];
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

    if (points.length < 2) return;

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw thick organic body using curves
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Smooth curve through points (Midpoint approximation)
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Connect to last point
    if (points.length > 1) {
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
    }

    // Base body
    ctx.lineWidth = gridSize * 0.8;
    ctx.strokeStyle = charColor;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    
    // Top highlight (Shiny skin effect)
    ctx.globalCompositeOperation = 'source-atop'; // Only draw on existing stroke
    ctx.lineWidth = gridSize * 0.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 0;
    // Offset duplicate path slightly for highlight? 
    // Easier to just redraw transparent stroke on top
    ctx.stroke();
    
    // Reset composite
    ctx.globalCompositeOperation = 'source-over';

    // Scale Texture (Stripes/Ribs)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, gridSize * 0.25, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Head
    const head = points[0];
    // Determine angle based on next point
    const angle = points[1] ? Math.atan2(head.y - points[1].y, head.x - points[1].x) : 0;
    
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);
    
    // Oval Head
    ctx.fillStyle = charColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, gridSize * 0.55, gridSize * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -6, 3, 0, Math.PI * 2); // Right Eye
    ctx.arc(6, 6, 3, 0, Math.PI * 2);  // Left Eye
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -6, 1, 0, Math.PI * 2);
    ctx.arc(7, 6, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
