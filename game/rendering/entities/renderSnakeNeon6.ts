
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeNeon6 = (
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
    
    // Points
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

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    
    // 1. Retro Grid Trail
    // Draw a grid that follows the snake's path geometry
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    
    for(let i=0; i<points.length; i++) {
        const p = points[i];
        // Vertical lines dropping down
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + 40); // 3D drop
        ctx.stroke();
        
        // Horizontal scanlines relative to snake index
        if (i % 2 === 0) {
            const width = gridSize * 2; // Wide path
            ctx.beginPath();
            ctx.moveTo(p.x - width/2, p.y + 20);
            ctx.lineTo(p.x + width/2, p.y + 20);
            ctx.stroke();
        }
    }

    // 2. The Sun Body
    // Each segment is a glowing orb with scanlines
    for(let i=points.length-1; i>=0; i--) {
        const p = points[i];
        const isHead = i === 0;
        const size = isHead ? gridSize * 0.8 : gridSize * 0.5;
        
        ctx.translate(p.x, p.y);
        
        // Sun Gradient
        const grad = ctx.createLinearGradient(0, -size, 0, size);
        grad.addColorStop(0, '#ffec00'); // Yellow top
        grad.addColorStop(0.5, '#ff0055'); // Pink mid
        grad.addColorStop(1, '#5500aa'); // Purple bot
        
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI*2);
        ctx.fill();
        
        // Scanline cuts
        ctx.fillStyle = '#000';
        const lines = 4;
        for(let j=0; j<lines; j++) {
            const y = (j / lines) * size;
            ctx.fillRect(-size, y, size*2, size*0.1);
        }
        
        ctx.translate(-p.x, -p.y);
    }

    ctx.restore();
};
