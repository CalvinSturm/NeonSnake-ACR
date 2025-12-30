
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic3 = (
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
    
    // Veins / Tentacles connecting segments
    ctx.strokeStyle = '#4a0a4a'; // Deep purple/organic
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        // Draw multiple twisting strands
        ctx.beginPath();
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const offset = Math.sin((now * 0.005) + i) * 5;
        
        // Strand 1
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX + offset, midY + offset, p2.x, p2.y);
        ctx.stroke();
        
        // Strand 2
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX - offset, midY - offset, p2.x, p2.y);
        ctx.stroke();
    }

    // Pods
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const pulse = Math.sin((now * 0.005) + i) * 0.2 + 1;
        
        ctx.translate(p.x, p.y);
        
        // Outer sac
        ctx.fillStyle = '#110011';
        ctx.beginPath();
        ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing Pustule
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 6);
        grad.addColorStop(0, '#ccff00'); // Acid green
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
