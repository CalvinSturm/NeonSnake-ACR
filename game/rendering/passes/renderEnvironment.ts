
import { RenderContext } from '../types';
import { Point, Terminal } from '../../../types';
import { COLORS } from '../../../constants';
import { drawBeveledRect, drawShadow, drawBoxShadow, drawVolumetricThruster } from '../primitives';

export const renderEnvironment = (rc: RenderContext, walls: Point[], terminals: Terminal[], snakeHead: Point | undefined) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    // WALLS
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
    }

    // TERMINALS
    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const rangePx = t.radius * gridSize;
        
        // Interaction Math
        let isInside = false;
        let distToHead = 9999;
        let angleToHead = 0;
        let headPx = { x: 0, y: 0 };

        if (snakeHead) {
            headPx.x = snakeHead.x * gridSize + halfGrid;
            headPx.y = snakeHead.y * gridSize + halfGrid;
            const dx = headPx.x - cx;
            const dy = headPx.y - cy;
            distToHead = Math.sqrt(dx*dx + dy*dy);
            angleToHead = Math.atan2(dy, dx);
            isInside = distToHead < rangePx;
        }

        const isActive = t.isBeingHacked && !t.isLocked;
        const baseColor = t.color;
        
        // ─────────────────────────────────────────────
        // 1. TERMINAL BASE (Physical Unit)
        // ─────────────────────────────────────────────
        
        // Floating Sine Wave
        const hoverY = isActive ? Math.sin(now * 0.02) * 2 : Math.sin(now * 0.002) * 4;
        
        // Base Shadow
        drawShadow(ctx, cx, cy + 20, 12, 8);

        ctx.save();
        ctx.translate(cx, cy + hoverY);

        // -- Thruster (Keeps it floating) --
        ctx.save();
        ctx.rotate(Math.PI / 2);
        drawVolumetricThruster(ctx, 0, -8, 5, 12, baseColor, now);
        ctx.restore();

        // -- Main Crystal/Core --
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isActive ? 20 : 10;
        ctx.lineWidth = 2;
        
        if (t.type === 'OVERRIDE') {
            // Diamond
            ctx.fillStyle = '#220000';
            ctx.strokeStyle = '#ff4400';
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 15);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Cube (2.5D)
            const s = 9;
            ctx.fillStyle = '#0a0a0a';
            ctx.strokeStyle = baseColor;
            
            // Back/Left faces
            ctx.beginPath();
            ctx.moveTo(-s, -s); ctx.lineTo(s, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Internal Data line
            ctx.fillStyle = baseColor;
            const scanH = (Math.sin(now * 0.005) * 0.5 + 0.5) * (s*2);
            ctx.fillRect(-s, -s + scanH, s*2, 2);
        }
        ctx.restore();

        // ─────────────────────────────────────────────
        // 2. 2.3D FORCEFIELD DOME
        // ─────────────────────────────────────────────
        ctx.save();
        ctx.translate(cx, cy);

        // Perspective ratio (Squash Y to look 3D)
        const perspective = 0.6;
        
        // Breach Interaction
        // If snake is crossing boundary (approx), intensify
        const isBreaching = distToHead < rangePx + 20 && distToHead > rangePx - 20;
        
        // Field Parameters
        const opacity = isInside ? 0.3 : (isBreaching ? 0.25 : 0.08);
        const strokeColor = isInside ? '#ffffff' : baseColor;
        const glowBlur = isInside ? 15 : 0;

        ctx.globalCompositeOperation = 'screen';
        
        // -- A. Volumetric Fill (Fresnel Effect) --
        // Dark center, bright edges
        const grad = ctx.createRadialGradient(0, 0, rangePx * 0.5, 0, 0, rangePx);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.85, `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rangePx, rangePx * perspective, 0, 0, PI2);
        ctx.fill();

        // -- B. Rotating Wireframe --
        ctx.lineWidth = isInside ? 2 : 1;
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = glowBlur;
        
        // Longitudinal Rings (Rotating)
        const rotSpeed = isInside ? 0.002 : 0.0005;
        const rOffset = now * rotSpeed;
        
        // Draw 3 vertical rings at different rotations
        for(let i=0; i<3; i++) {
            ctx.save();
            ctx.rotate(rOffset + (i * (Math.PI / 3)));
            ctx.beginPath();
            // To render a vertical ring in perspective, we just squeeze width
            ctx.ellipse(0, 0, rangePx * 0.3, rangePx * perspective, 0, 0, PI2);
            ctx.globalAlpha = opacity * 2;
            ctx.stroke();
            ctx.restore();
        }

        // Latitudinal Ring (Scanning Up/Down)
        // Z-height mapped to Y-offset with perspective
        const scanZ = Math.sin(now * 0.002) * rangePx;
        const scanY = scanZ * perspective * -1; // Invert Y
        const scanR = Math.sqrt(Math.max(0, (rangePx * rangePx) - (scanZ * scanZ))); // Circle cross-section at height Z
        
        ctx.beginPath();
        ctx.ellipse(0, scanY, scanR, scanR * perspective, 0, 0, PI2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // -- C. Perimeter Ring (Ground Contact) --
        ctx.beginPath();
        ctx.ellipse(0, 0, rangePx, rangePx * perspective, 0, 0, PI2);
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = opacity * 3;
        ctx.stroke();


        // ─────────────────────────────────────────────
        // 3. SNAKE INTERACTION EFFECTS
        // ─────────────────────────────────────────────
        
        if (snakeHead) {
            // Calculate intersection point on the Ellipse
            // P = (r*cos(a), r*perspective*sin(a))
            const intersectX = Math.cos(angleToHead) * rangePx;
            const intersectY = Math.sin(angleToHead) * rangePx * perspective;

            // -- INTERSECTION RIPPLES --
            // If snake is close to the edge (inside or outside), show ripples on the field
            if (Math.abs(distToHead - rangePx) < 40) {
                const rippleAlpha = 1 - (Math.abs(distToHead - rangePx) / 40);
                
                ctx.save();
                ctx.translate(intersectX, intersectY);
                
                // Draw ripple rings
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                
                for(let i=0; i<3; i++) {
                    const rSize = ((now / 100) + i * 5) % 15;
                    const rOp = (15 - rSize) / 15;
                    ctx.globalAlpha = rippleAlpha * rOp;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rSize, rSize * perspective, 0, 0, PI2);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // -- ACTIVE CONNECTION TETHER --
            if (isInside) {
                // Determine source point on the terminal (center, floating)
                // Determine target point (snake head relative to center)
                const relHeadX = headPx.x - cx;
                const relHeadY = headPx.y - cy;
                
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 10;
                ctx.shadowColor = baseColor;
                
                // Draw Beam
                const beamGrad = ctx.createLinearGradient(0, hoverY, relHeadX, relHeadY);
                beamGrad.addColorStop(0, baseColor);
                beamGrad.addColorStop(1, '#ffffff');
                
                ctx.strokeStyle = beamGrad as any;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, hoverY); // From floating core
                
                // Jittery line
                const midX = relHeadX / 2;
                const midY = (relHeadY + hoverY) / 2;
                const jitter = Math.sin(now * 0.1) * 5;
                
                ctx.quadraticCurveTo(midX + jitter, midY - jitter, relHeadX, relHeadY);
                ctx.stroke();

                // Data particles moving along the beam
                // (Simplified: Just draw dots at lerped positions)
                ctx.fillStyle = '#fff';
                for(let i=0; i<3; i++) {
                    const t = ((now * 0.003) + (i * 0.33)) % 1;
                    const lx = 0 + (relHeadX - 0) * t;
                    const ly = hoverY + (relHeadY - hoverY) * t;
                    ctx.fillRect(lx - 1, ly - 1, 3, 3);
                }
            }
        }

        ctx.restore();

        // 4. PROGRESS BAR (Billboard)
        if (t.progress > 0) {
            const pct = t.progress / t.totalTime;
            const barW = 4;
            const barH = 24;
            
            ctx.save();
            ctx.translate(cx + 25, cy); 
            
            // Container
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, -barH/2, barW, barH);
            
            // Fill
            ctx.fillStyle = pct > 0.9 ? '#fff' : t.color;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 5;
            const fillH = barH * pct;
            ctx.fillRect(0, (barH/2) - fillH, barW, fillH);
            
            // Label
            if (isActive) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px monospace';
                ctx.fillText(`${Math.floor(pct*100)}%`, 6, 3);
            }
            
            ctx.restore();
        }
    });
};
