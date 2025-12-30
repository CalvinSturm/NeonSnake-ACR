
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawVolumetricThruster } from '../primitives';

export const renderSnakeMech6 = (
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

    const segments: { x: number, y: number, angle: number }[] = [];
    
    // Position Interpolation
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
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid, angle: 0 });
    }

    // Angle Calculation
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

    // 1. Shadow / Ground Contact
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    for (const seg of segments) {
        ctx.beginPath();
        ctx.ellipse(seg.x, seg.y + 15, gridSize * 0.5, gridSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Spine (Underlayer)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = gridSize * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for(let i=1; i<segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();

    // 3. Body Plates
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);
        
        // Piston Animation
        const pump = Math.sin((now * 0.01) + i) * 2;
        
        if (isHead) {
            // TITAN HEAD
            const w = gridSize * 1.2;
            const l = gridSize * 1.4;
            
            // Base
            const grad = ctx.createLinearGradient(0, -w/2, 0, w/2);
            grad.addColorStop(0, '#333');
            grad.addColorStop(0.5, '#666');
            grad.addColorStop(1, '#222');
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.moveTo(l*0.6, 0);
            ctx.lineTo(-l*0.4, w*0.5);
            ctx.lineTo(-l*0.5, -w*0.5);
            ctx.closePath();
            ctx.fill();
            
            // Cockpit Glass
            ctx.fillStyle = charColor;
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(l*0.2, 0);
            ctx.lineTo(-l*0.2, w*0.3);
            ctx.lineTo(-l*0.2, -w*0.3);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Specular Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-l*0.1, w*0.1);
            ctx.lineTo(-l*0.1, -w*0.1);
            ctx.fill();

        } else {
            // SEGMENT
            const w = gridSize * 0.9;
            const l = gridSize * 0.8;
            
            // Hydraulic Pistons
            ctx.fillStyle = '#111';
            ctx.fillRect(-l/2 + pump, -w/2, l, w);
            
            // Armor Plate
            const grad = ctx.createLinearGradient(0, -w/2, 0, w/2);
            grad.addColorStop(0, '#444');
            grad.addColorStop(0.5, '#888');
            grad.addColorStop(1, '#333');
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.roundRect(-l/2, -w/2, l, w, 4);
            ctx.fill();
            
            // Vent Glow
            ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.sin(now * 0.02 + i) * 0.5})`;
            ctx.fillRect(-l*0.3, -w*0.3, l*0.6, w*0.6);
            
            // Grille
            ctx.fillStyle = '#000';
            ctx.fillRect(-l*0.2, -w*0.3, 2, w*0.6);
            ctx.fillRect(0, -w*0.3, 2, w*0.6);
            ctx.fillRect(l*0.2, -w*0.3, 2, w*0.6);
        }
        
        ctx.restore();
    }
};
