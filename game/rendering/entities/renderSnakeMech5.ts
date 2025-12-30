
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMech5 = (
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

    // MECH 5: TITAN ALLOY
    // Key Feature: High contrast, heavy metallic plates, bright emissive chevrons for direction.
    // Extremely polished look.

    const plateColor = '#e0e0e0'; // Nearly white metal
    const jointColor = '#222';

    // 1. Hydraulic Spine (Underneath)
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    ctx.lineWidth = gridSize * 0.4;
    ctx.strokeStyle = jointColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 2. Armor Plates
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);
        
        const size = gridSize * 0.9;
        const w = size;
        const l = size * 0.9;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-l/2 + 4, -w/2 + 4, l, w);

        // Main Plate
        const grad = ctx.createLinearGradient(0, -w/2, 0, w/2);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, '#aaa');
        grad.addColorStop(1, '#888');
        ctx.fillStyle = grad;
        
        // Chamfered Box
        ctx.beginPath();
        ctx.moveTo(l/2, -w/3);
        ctx.lineTo(l/3, -w/2);
        ctx.lineTo(-l/3, -w/2);
        ctx.lineTo(-l/2, -w/3);
        ctx.lineTo(-l/2, w/3);
        ctx.lineTo(-l/3, w/2);
        ctx.lineTo(l/3, w/2);
        ctx.lineTo(l/2, w/3);
        ctx.closePath();
        ctx.fill();
        
        // Highlight Edge
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Directional Chevron (Emissive)
        ctx.fillStyle = charColor;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(l*0.3, 0);
        ctx.lineTo(-l*0.2, w*0.3);
        ctx.lineTo(-l*0.1, 0);
        ctx.lineTo(-l*0.2, -w*0.3);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHead) {
            // Reinforced Helm
            ctx.fillStyle = '#222';
            ctx.fillRect(0, -w*0.4, l*0.6, w*0.8);
            
            // Sensor Eye
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15;
            ctx.fillRect(l*0.3, -w*0.2, 4, w*0.4);
        }

        // Damage Indication (Red tint)
        if (tailIntegrity < 100) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(255, 0, 0, ${(100 - tailIntegrity) / 200})`;
            ctx.fillRect(-l/2, -w/2, l, w);
        }

        ctx.restore();
    }
};
