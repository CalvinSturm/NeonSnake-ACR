
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux5 = (
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
    ctx.globalCompositeOperation = 'screen'; // Additive blending for pure light

    // 1. The Core (Smooth curve)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    // Quadratic Bezier for smoothness
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    if (points.length > 1) {
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
    }

    // Outer Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = charColor;
    ctx.lineWidth = gridSize * 0.8;
    ctx.strokeStyle = `rgba(${parseInt(charColor.slice(1,3),16)}, ${parseInt(charColor.slice(3,5),16)}, ${parseInt(charColor.slice(5,7),16)}, 0.2)`;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Inner Core (White Hot)
    ctx.shadowBlur = 10;
    ctx.lineWidth = gridSize * 0.3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // 2. Quantum Particles (Flowing backwards)
    const particleCount = 10;
    const flowSpeed = now * 0.2;
    
    ctx.fillStyle = '#fff';
    
    // We sample positions along the path
    // Simplified: Just iterate segments
    for(let i=0; i<particleCount; i++) {
        const offset = (flowSpeed + (i * (points.length / particleCount))) % (points.length - 1);
        const idx = Math.floor(offset);
        const t = offset - idx;
        
        const p1 = points[idx];
        const p2 = points[idx+1];
        if (!p1 || !p2) continue;
        
        const px = p1.x + (p2.x - p1.x) * t;
        const py = p1.y + (p2.y - p1.y) * t;
        
        // Random drift
        const dx = (Math.random() - 0.5) * gridSize;
        const dy = (Math.random() - 0.5) * gridSize;
        
        ctx.globalAlpha = 1 - (offset / points.length); // Fade at tail
        ctx.beginPath();
        ctx.arc(px + dx, py + dy, 2, 0, Math.PI*2);
        ctx.fill();
    }

    // 3. Head Singularity
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, gridSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
