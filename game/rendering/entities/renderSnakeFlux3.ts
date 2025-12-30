
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux3 = (
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
    
    // Core Energy Beam
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Multi-layered blur for plasma effect
    const passes = [20, 10, 2];
    const opacities = [0.2, 0.4, 1.0];
    
    passes.forEach((blur, idx) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        
        ctx.shadowBlur = blur;
        ctx.shadowColor = charColor;
        ctx.strokeStyle = charColor;
        ctx.lineWidth = (3 - idx) * 3;
        ctx.globalAlpha = opacities[idx];
        ctx.stroke();
    });
    
    // Unstable Particles
    ctx.fillStyle = '#fff';
    for(let i=0; i<points.length; i++) {
        if(Math.random() < 0.3) {
            const p = points[i];
            const ox = (Math.random() - 0.5) * 15;
            const oy = (Math.random() - 0.5) * 15;
            ctx.globalAlpha = Math.random();
            ctx.fillRect(p.x + ox, p.y + oy, 2, 2);
        }
    }

    // Head Singularity
    const head = points[0];
    ctx.translate(head.x, head.y);
    const pulse = 1 + Math.sin(now * 0.01) * 0.2;
    
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
