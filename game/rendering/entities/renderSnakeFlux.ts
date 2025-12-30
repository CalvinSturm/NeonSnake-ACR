
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeFlux = (
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
    
    // ─────────────────────────────
    // 1. CALCULATE POSITIONS
    // ─────────────────────────────
    const segments: { x: number, y: number, angle: number }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        // Interpolate position for smoothness
        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid, angle: 0 });
    }

    // Orientations
    for (let i = 0; i < segments.length; i++) {
        if (i === 0) {
            let rad = 0;
            switch(direction) {
                case 'RIGHT': rad = 0; break;
                case 'DOWN': rad = Math.PI/2; break;
                case 'LEFT': rad = Math.PI; break;
                case 'UP': rad = -Math.PI/2; break;
            }
            segments[i].angle = rad;
        } else {
            const prev = segments[i-1];
            const curr = segments[i];
            segments[i].angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        }
    }

    const headCx = segments[0].x;
    const headCy = segments[0].y;
    const headAngle = segments[0].angle;
    const charColor = charProfile?.color || COLORS.snakeHead;

    // Use additive blending for that "holographic energy" feel
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // ─────────────────────────────
    // 2. ENERGY RIBBON (The Spine)
    // ─────────────────────────────
    // Draw a glowing sine wave connecting the segments
    
    const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
    
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    
    for (let i = 1; i < segments.length; i++) {
        const p = segments[i];
        ctx.lineTo(p.x, p.y);
    }
    
    // Core Beam
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Outer Halo
    ctx.lineWidth = 12;
    ctx.strokeStyle = `rgba(${parseInt(charColor.slice(1,3),16)}, ${parseInt(charColor.slice(3,5),16)}, ${parseInt(charColor.slice(5,7),16)}, 0.1)`;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // ─────────────────────────────
    // 3. FLUX NODES (Segments)
    // ─────────────────────────────
    // Instead of solid blocks, we draw floating data glyphs
    
    ctx.shadowBlur = 0; // Reset blur for sharp lines
    ctx.lineWidth = 1.5;

    for (let i = segments.length - 1; i > 0; i--) {
        const seg = segments[i];
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);
        
        // Scale based on index (taper tail)
        const scale = 1 - (i / (segments.length + 5));
        const size = gridSize * 0.4 * scale;
        
        // Draw rotating square/diamond
        const rot = now * 0.002 + (i * 0.5);
        ctx.rotate(rot);
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.2})`;
        ctx.strokeRect(-size, -size, size*2, size*2);
        
        // Inner fill if damaged
        if (tailIntegrity < 100) {
             const dmg = (100 - tailIntegrity) / 100;
             ctx.fillStyle = `rgba(255, 0, 0, ${dmg * 0.5})`;
             ctx.fillRect(-size, -size, size*2, size*2);
        }

        ctx.restore();
    }

    // ─────────────────────────────
    // 4. ENERGY HEAD (The Singularity)
    // ─────────────────────────────
    ctx.translate(headCx, headCy);
    ctx.rotate(headAngle);
    
    // Rotating Triangles (Star shape)
    const headSize = gridSize * 0.6;
    
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    
    // Triangle 1
    ctx.save();
    ctx.rotate(now * 0.003);
    ctx.beginPath();
    ctx.moveTo(headSize, 0);
    ctx.lineTo(-headSize*0.5, headSize*0.8);
    ctx.lineTo(-headSize*0.5, -headSize*0.8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Triangle 2 (Counter rotate)
    ctx.save();
    ctx.rotate(-now * 0.003);
    ctx.beginPath();
    ctx.moveTo(headSize, 0);
    ctx.lineTo(-headSize*0.5, headSize*0.8);
    ctx.lineTo(-headSize*0.5, -headSize*0.8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Central Core
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Final Restore
};
