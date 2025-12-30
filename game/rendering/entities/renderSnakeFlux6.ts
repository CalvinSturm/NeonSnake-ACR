
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux6 = (
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
    
    // 1. Accretion Disk (Particles)
    // Draw debris orbiting the path
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < points.length - 1; i++) {
        const p = points[i];
        const next = points[i+1];
        
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Perpendicular
        const px = -Math.sin(angle);
        const py = Math.cos(angle);
        
        const timeOff = now * 0.005 + i;
        const spread = gridSize * 1.5;
        
        // Particles
        for(let j=0; j<3; j++) {
            const orbit = Math.sin(timeOff + j) * spread;
            const opacity = (Math.sin(timeOff * 2 + j) + 1) / 2;
            
            ctx.fillStyle = `rgba(${parseInt(charColor.slice(1,3),16)}, ${parseInt(charColor.slice(3,5),16)}, ${parseInt(charColor.slice(5,7),16)}, ${opacity})`;
            
            ctx.beginPath();
            ctx.arc(p.x + px * orbit, p.y + py * orbit, 2, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // 2. The Void (Core)
    // Draw intense black core with white rim
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Glow
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = charColor;
    ctx.lineWidth = gridSize * 1.2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    // Rim
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = gridSize * 0.8;
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Void
    ctx.strokeStyle = '#000';
    ctx.lineWidth = gridSize * 0.5;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // 3. Head Singularity
    const head = points[0];
    ctx.translate(head.x, head.y);
    
    // Lensing effect (Fake)
    const rad = gridSize * 0.8;
    const grad = ctx.createRadialGradient(0, 0, rad*0.5, 0, 0, rad);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.5, '#000');
    grad.addColorStop(0.55, '#fff');
    grad.addColorStop(1, charColor);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
};
