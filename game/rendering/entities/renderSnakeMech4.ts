
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMech4 = (
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

    const segments: {x:number, y:number, angle:number}[] = [];
    
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
        
        // Calculate Angle
        let angle = 0;
        if (i === 0) {
            switch(direction) {
                case 'RIGHT': angle = 0; break;
                case 'DOWN': angle = Math.PI/2; break;
                case 'LEFT': angle = Math.PI; break;
                case 'UP': angle = -Math.PI/2; break;
            }
        } else {
            const p = segments[i-1];
            if (p) angle = Math.atan2(p.y - (iy * gridSize + halfGrid), p.x - (ix * gridSize + halfGrid));
            // Correct fallback for tail
            if (snake[i-1]) angle = Math.atan2(snake[i-1].y - curr.y, snake[i-1].x - curr.x);
        }

        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid, angle });
    }

    // MAGNETIC RAIL RENDERING
    // Instead of a connected body, disjointed rail segments floating in formation
    
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);
        
        // Rail Float Animation
        const hover = Math.sin((now / 150) + i) * 2;
        
        // 1. Magnetic Field (Between rails)
        ctx.fillStyle = `rgba(${parseInt(charColor.slice(1,3),16)}, ${parseInt(charColor.slice(3,5),16)}, ${parseInt(charColor.slice(5,7),16)}, 0.2)`;
        ctx.fillRect(-10, -4, 20, 8);
        
        // 2. Left Rail
        ctx.fillStyle = '#222';
        ctx.fillRect(-12, -12 - hover, 24, 6);
        ctx.fillStyle = '#FFD700'; // Hazard stripe
        ctx.fillRect(-12, -10 - hover, 24, 2);
        
        // 3. Right Rail
        ctx.fillStyle = '#222';
        ctx.fillRect(-12, 6 + hover, 24, 6);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-12, 8 + hover, 24, 2);
        
        // 4. Center Core (The Projectile/Power Source)
        if (isHead) {
            // Massive Head Unit
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-5, 10);
            ctx.lineTo(-15, 10);
            ctx.lineTo(-15, -10);
            ctx.lineTo(-5, -10);
            ctx.closePath();
            ctx.fill();
            
            // Eye
            ctx.fillStyle = '#fff';
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 20;
            ctx.fillRect(5, -2, 8, 4);
        } else {
            // Body Core
            ctx.fillStyle = charColor;
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
};
