
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic5 = (
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
    
    // ORGANIC 5: Symbiote / Ferrofluid
    // Liquid, smooth, glossy black with color highlights.
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 1. Base Liquid (Black)
    ctx.lineWidth = gridSize * 0.9;
    ctx.strokeStyle = '#000';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i-1].x) / 2; // Simple lerp? No, curve.
        ctx.lineTo(points[i].x, points[i].y);
    }
    // Quad curve version for smoothness
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    if (points.length > 1) ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
    
    ctx.stroke(); // Black base
    
    // 2. Color Highlight (Rim light)
    ctx.globalCompositeOperation = 'source-atop';
    ctx.lineWidth = 4;
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 10;
    
    // Offset path slightly
    ctx.translate(0, -3);
    ctx.stroke();
    
    // 3. Specular Highlight (Wet look)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.translate(0, 1);
    ctx.stroke();
    
    // Head Eyes (Menacing)
    ctx.globalCompositeOperation = 'source-over';
    const head = points[0];
    ctx.translate(head.x, head.y); // Note: Previous translates accumulate! Reset logic needed or just use head pos relative
    // Actually we translated the context for strokes.
    // Reset transform for head to be safe
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
    ctx.translate(rc.shake?.x || 0, rc.shake?.y || 0); // Re-apply shake if needed (cheat: just use absolute head coords)
    
    // Recalculate head pos absolute
    const ha = points[0];
    ctx.translate(ha.x, ha.y);
    
    // Simple rotation
    let ang = 0;
    if (direction === 'DOWN') ang = Math.PI/2;
    if (direction === 'LEFT') ang = Math.PI;
    if (direction === 'UP') ang = -Math.PI/2;
    ctx.rotate(ang);
    
    // White eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(8, -4); ctx.lineTo(0, -8); ctx.lineTo(2, -2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 4); ctx.lineTo(0, 8); ctx.lineTo(2, 2);
    ctx.fill();

    ctx.restore();
};
