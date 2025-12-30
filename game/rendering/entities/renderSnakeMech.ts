
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawVolumetricThruster } from '../primitives';

export const renderSnakeMech = (
    rc: RenderContext,
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    visualNsAngle: number,
    tailIntegrity: number,
    phaseRailCharge: number,
    echoDamageStored: number,
    prismLanceTimer: number
) => {
    if (snake.length === 0) return;
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;
    
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

    // Calculate rotation angles for each segment
    for (let i = 0; i < segments.length; i++) {
        if (i === 0) {
            // Head orientation based on input direction for responsiveness
            let rad = 0;
            switch(direction) {
                case 'RIGHT': rad = 0; break;
                case 'DOWN': rad = Math.PI/2; break;
                case 'LEFT': rad = Math.PI; break;
                case 'UP': rad = -Math.PI/2; break;
            }
            segments[i].angle = rad;
        } else {
            // Body segments face the one in front of them
            const prev = segments[i-1];
            const curr = segments[i];
            segments[i].angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        }
    }

    const headCx = segments[0].x;
    const headCy = segments[0].y;
    const headAngle = segments[0].angle;
    const charColor = charProfile?.color || COLORS.snakeHead;

    // ─────────────────────────────
    // 2. ENHANCED SHADOW PASS (AO)
    // ─────────────────────────────
    // Two-pass for depth: Wide ambient blur, then tight contact shadow
    
    // Pass A: Ambient (Wide, Soft)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    
    for (const seg of segments) {
        ctx.beginPath();
        ctx.ellipse(seg.x, seg.y + 12, gridSize * 0.5, gridSize * 0.35, 0, 0, PI2);
        ctx.fill();
    }
    
    // Pass B: Contact (Sharp, Dark)
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    
    for (const seg of segments) {
        ctx.save();
        ctx.translate(seg.x, seg.y + 14); // Offset slightly more for contact plane
        ctx.rotate(seg.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, gridSize * 0.35, gridSize * 0.2, 0, 0, PI2);
        ctx.fill();
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ─────────────────────────────
    // 3. SPINE (Connector Cables)
    // ─────────────────────────────
    // Inner Glow
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    
    ctx.lineWidth = gridSize * 0.15;
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Outer Sheath
    ctx.lineWidth = gridSize * 0.35;
    ctx.strokeStyle = '#0a0a0a';
    ctx.stroke();

    // ─────────────────────────────
    // 4. BODY SEGMENTS (Mechanical)
    // ─────────────────────────────
    for (let i = segments.length - 1; i > 0; i--) {
        const seg = segments[i];
        const sizeRatio = 1 - (i / (segments.length + 15)); // Gentle taper
        
        // Dimensions for the plate
        const w = (gridSize * 0.75) * Math.max(0.6, sizeRatio);
        const l = (gridSize * 0.55) * Math.max(0.6, sizeRatio);
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);

        // -- TAIL TIP --
        if (i === segments.length - 1) {
            // Engine Nozzle Appearance
            drawVolumetricThruster(ctx, -l*1.8, 0, w * 0.8, l*4, charColor, now);
            
            // Housing
            const tipGrad = ctx.createLinearGradient(0, -w/2, 0, w/2);
            tipGrad.addColorStop(0, '#111');
            tipGrad.addColorStop(0.5, '#333');
            tipGrad.addColorStop(1, '#111');
            ctx.fillStyle = tipGrad;
            
            ctx.beginPath();
            ctx.moveTo(l*0.2, w*0.4);
            ctx.lineTo(-l*1.2, w*0.3);
            ctx.lineTo(-l*1.2, -w*0.3);
            ctx.lineTo(l*0.2, -w*0.4);
            ctx.fill();
            
            // Neon Rim
            ctx.strokeStyle = charColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        } 
        // -- STANDARD SEGMENT --
        else {
            // 1. Base Plate (Dark Metal)
            ctx.fillStyle = '#111';
            ctx.beginPath();
            // Hexagonal-ish shape
            ctx.moveTo(l/2, -w/2); 
            ctx.lineTo(l/2, w/2);
            ctx.lineTo(-l/2, w/3);
            ctx.lineTo(-l/2, -w/3);
            ctx.closePath();
            ctx.fill();

            // 2. Armor Highlight (Top Edge)
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-l/2, -w/3);
            ctx.lineTo(l/2, -w/2);
            ctx.stroke();

            // 3. Central Core (Pulsing Energy)
            const pulse = (Math.sin((now * 0.005) - (i * 0.3)) + 1) * 0.5;
            ctx.fillStyle = charColor;
            ctx.globalAlpha = 0.4 + (pulse * 0.6);
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 5 * pulse;
            
            ctx.beginPath();
            // Small rectangular vent
            ctx.rect(-l*0.15, -w*0.25, l*0.3, w*0.5);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
            
            // 4. Side Flaps (Detail)
            ctx.fillStyle = '#050505';
            ctx.fillRect(-l*0.2, -w*0.6, l*0.4, w*0.15);
            ctx.fillRect(-l*0.2, w*0.45, l*0.4, w*0.15);
        }
        
        // Damage Overlay
        if (tailIntegrity < 100) {
            const damageAlpha = (100 - tailIntegrity) * 0.008;
            ctx.fillStyle = `rgba(20, 0, 0, ${damageAlpha})`;
            ctx.fill();
            
            // Sparks
            if (Math.random() < damageAlpha * 0.5) {
                ctx.fillStyle = '#fff';
                ctx.fillRect((Math.random()-0.5)*l, (Math.random()-0.5)*w, 2, 2);
            }
        }

        ctx.restore();
    }

    // ─────────────────────────────
    // 5. HEAD (Cyber-Viper Geometry)
    // ─────────────────────────────
    ctx.save();
    ctx.translate(headCx, headCy);
    ctx.rotate(headAngle);
    
    // A. Lower Mandibles (Dark)
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(14, 3); 
    ctx.lineTo(18, 8); // Fang R
    ctx.lineTo(6, 12); // Jaw R
    ctx.lineTo(-8, 8); // Neck
    ctx.lineTo(-8, -8);
    ctx.lineTo(6, -12); // Jaw L
    ctx.lineTo(18, -8); // Fang L
    ctx.lineTo(14, -3);
    ctx.fill();

    // B. Upper Shell (Gradient)
    const headGrad = ctx.createLinearGradient(-10, 0, 20, 0);
    headGrad.addColorStop(0, '#1a1a1a');
    headGrad.addColorStop(0.3, '#3a3a3a');
    headGrad.addColorStop(1.0, '#1a1a1a');
    ctx.fillStyle = headGrad;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(22, 0);    // Nose
    ctx.lineTo(14, -8);   // Brow R
    ctx.lineTo(-8, -10);  // Rear R
    ctx.lineTo(-12, -6);  // Notch R
    ctx.lineTo(-12, 6);   // Notch L
    ctx.lineTo(-8, 10);   // Rear L
    ctx.lineTo(14, 8);    // Brow L
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // C. Optical Sensors (Glowing Slits)
    ctx.fillStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 15;
    
    // Eye R
    ctx.beginPath();
    ctx.moveTo(16, -2); ctx.lineTo(8, -7); ctx.lineTo(8, -2);
    ctx.fill();
    
    // Eye L
    ctx.beginPath();
    ctx.moveTo(16, 2); ctx.lineTo(8, 7); ctx.lineTo(8, 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;

    // D. Decals
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(10, -2);
    ctx.moveTo(0, 5); ctx.lineTo(10, 2);
    ctx.stroke();
    
    // E. CPU Light
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-6, -1.5, 4, 3);
    
    ctx.restore();
};
