
import { RenderContext } from '../types';
import { Point, Terminal } from '../../../types';
import { COLORS } from '../../../constants';
import { drawBeveledRect, drawShadow, drawBoxShadow, drawVolumetricThruster } from '../primitives';

export const renderEnvironment = (rc: RenderContext, walls: Point[], terminals: Terminal[], snakeHead: Point | undefined) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    // ─── WALLS ───
    for (const w of walls) {
        const wx = w.x * gridSize;
        const wy = w.y * gridSize;
        
        // AO Shadow Base
        drawBoxShadow(ctx, wx, wy, gridSize, gridSize, 15);
        
        // Block
        drawBeveledRect(ctx, wx, wy, gridSize, gridSize, COLORS.wallBorder, true);
        
        // Inner "Circuit" detail
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(wx + gridSize*0.3, wy + gridSize*0.3, gridSize*0.4, gridSize*0.4);
        
        // Tech detail lines
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(wx + 2, wy + gridSize/2 - 1, 4, 2);
        ctx.fillRect(wx + gridSize - 6, wy + gridSize/2 - 1, 4, 2);
    }

    // ─── TERMINALS ───
    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const rangePx = t.radius * gridSize;
        
        // Interaction Logic
        let isInside = false;
        let distToHead = 9999;
        let headPx = { x: 0, y: 0 };

        if (snakeHead) {
            headPx.x = snakeHead.x * gridSize + halfGrid;
            headPx.y = snakeHead.y * gridSize + halfGrid;
            const dx = headPx.x - cx;
            const dy = headPx.y - cy;
            distToHead = Math.sqrt(dx*dx + dy*dy);
            isInside = distToHead < rangePx;
        }

        const isActive = t.isBeingHacked && !t.isLocked;
        const baseColor = t.color;
        const progress = t.progress / t.totalTime;

        // 1. FLOOR PROJECTION (Range & Progress)
        ctx.save();
        ctx.translate(cx, cy);
        
        // 1a. Range Ring (Static/Pulse)
        ctx.scale(1, 0.6); // Perspective squash
        
        const ringPulse = isActive ? 1 + Math.sin(now * 0.02) * 0.05 : 1;
        
        // Outer boundary
        ctx.strokeStyle = isInside ? '#ffffff' : baseColor;
        ctx.lineWidth = isInside ? 2 : 1;
        ctx.globalAlpha = isInside ? 0.6 : 0.2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, rangePx * ringPulse, 0, PI2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 1b. Progress Fill (The "Download" Circle)
        if (progress > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, rangePx, -Math.PI/2, -Math.PI/2 + (PI2 * progress));
            ctx.lineTo(0, 0);
            ctx.fill();
            
            // Bright leading edge
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, rangePx, -Math.PI/2, -Math.PI/2 + (PI2 * progress));
            ctx.stroke();
        }

        ctx.restore();

        // 2. DATA PYLON (Physical Object)
        // Float animation
        const floatY = Math.sin(now * 0.003 + cx) * 5;
        const zHeight = -25 + floatY; // Negative Y is up
        
        ctx.save();
        ctx.translate(cx, cy);

        // Shadow on floor
        drawShadow(ctx, 0, 0, 15 - (floatY * 0.5), 10);

        // Floating Base
        ctx.translate(0, zHeight);
        
        // Draw Core Geometry based on Type
        ctx.fillStyle = baseColor;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isActive ? 20 : 10;
        
        if (t.type === 'MEMORY') {
            // GOLDEN PYRAMID
            ctx.rotate(now * 0.001);
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, 5);
            ctx.lineTo(-12, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inverted bottom half
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.lineTo(12, 5);
            ctx.lineTo(-12, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

        } else if (t.type === 'OVERRIDE') {
            // JAGGED CRYSTAL
            ctx.rotate(now * -0.002);
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(8, -5);
            ctx.lineTo(12, 10);
            ctx.lineTo(0, 20);
            ctx.lineTo(-12, 10);
            ctx.lineTo(-8, -5);
            ctx.closePath();
            
            ctx.fillStyle = '#330000';
            ctx.fill();
            ctx.stroke();
            
            // Inner glowing crack
            ctx.strokeStyle = baseColor;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-4, 0);
            ctx.lineTo(4, 10);
            ctx.stroke();

        } else {
            // STANDARD CUBE (Rotating)
            const size = 12;
            ctx.rotate(now * 0.001);
            // 2.5D Cube
            ctx.fillStyle = '#111';
            ctx.fillRect(-size, -size, size*2, size*2);
            ctx.strokeRect(-size, -size, size*2, size*2);
            
            // Data Face
            ctx.fillStyle = baseColor;
            const scan = (Math.sin(now * 0.01) + 1) / 2;
            ctx.fillRect(-size + 4, -size + 4 + (scan * (size*2 - 8)), size*2 - 8, 2);
        }

        ctx.shadowBlur = 0;
        ctx.restore(); // Undo Pylon Transform

        // 3. HOLOGRAPHIC DATA STREAM (When Hacking)
        if (isActive && snakeHead) {
            ctx.save();
            ctx.translate(cx, cy + zHeight); // Start at floating core

            // Draw stream to snake head
            const relHeadX = headPx.x - cx;
            const relHeadY = headPx.y - (cy + zHeight);
            
            const dist = Math.hypot(relHeadX, relHeadY);
            const angle = Math.atan2(relHeadY, relHeadX);
            
            // Rotate to face head
            ctx.rotate(angle);
            
            // Stream particles
            const particles = 5;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10;
            
            for(let i=0; i<particles; i++) {
                const t = ((now * 0.002) + (i / particles)) % 1;
                const px = t * dist;
                const py = Math.sin(t * Math.PI * 4) * 5; // Wiggle
                
                ctx.globalAlpha = Math.sin(t * Math.PI); // Fade in/out
                ctx.fillRect(px, py, 4, 4);
            }
            
            ctx.restore();
        }

        // 4. STATUS TEXT
        if (progress > 0 || isInside) {
            ctx.save();
            ctx.translate(cx, cy - 40);
            
            // Billboard text (No rotation)
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            
            let label: string = t.type;
            if (t.type === 'RESOURCE') label = 'DATA';
            
            ctx.fillText(isActive ? `${Math.floor(progress * 100)}%` : (isInside ? 'CONNECTING...' : label), 0, 0);
            
            // Progress Bar (Mini)
            if (progress > 0) {
                ctx.fillStyle = '#333';
                ctx.fillRect(-15, 4, 30, 4);
                ctx.fillStyle = baseColor;
                ctx.fillRect(-15, 4, 30 * progress, 4);
            }
            
            ctx.restore();
        }
    });
};
