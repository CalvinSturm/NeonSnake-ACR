
import { RenderContext } from '../types';
import { Point, Terminal } from '../../../types';
import { COLORS } from '../../../constants';
import { drawBeveledRect, drawBoxShadow } from '../primitives';

export const renderEnvironment = (rc: RenderContext, walls: Point[], terminals: Terminal[], snakeHead: Point | undefined) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    // ─────────────────────────────────────────────
    // 1. WALLS (Optimized Pass)
    // ─────────────────────────────────────────────
    // Walls are static, but we ensure minimal state changes here.
    for (const w of walls) {
        const wx = w.x * gridSize;
        const wy = w.y * gridSize;
        
        // AO Shadow Base (Keep for depth, but it's per-wall)
        drawBoxShadow(ctx, wx, wy, gridSize, gridSize, 15);
        
        // Block
        drawBeveledRect(ctx, wx, wy, gridSize, gridSize, COLORS.wallBorder, true);
        
        // Inner "Circuit" detail
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(wx + gridSize*0.3, wy + gridSize*0.3, gridSize*0.4, gridSize*0.4);
    }

    // ─────────────────────────────────────────────
    // 2. TERMINALS (Batched Optimization)
    // ─────────────────────────────────────────────
    if (terminals.length === 0) return;

    // -- BATCH 1: FLOOR PROJECTIONS (Additive Glows) --
    // We render all floor effects in one go to use 'screen' blend mode efficiently.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const rangePx = t.radius * gridSize;
        const isActive = t.isBeingHacked && !t.isLocked;
        const baseColor = t.color;

        // Optimization: Use Radial Gradient instead of ShadowBlur for glow
        const pulse = Math.sin(now * 0.003 + t.x) * 0.1 + 0.9;
        const r = rangePx * (isActive ? 1.0 : 0.8) * pulse;
        
        // Floor Glow Gradient
        const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        const alpha = isActive ? 0.4 : 0.15;
        grad.addColorStop(0, 'rgba(0,0,0,0)'); // Hollow center
        grad.addColorStop(0.7, `${baseColor}${Math.floor(alpha * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Flattened ellipse for 2.5D perspective on floor
        ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, PI2);
        ctx.fill();

        // Active Ring
        if (isActive) {
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 0.8, r * 0.8 * 0.6, 0, 0, PI2);
            ctx.stroke();
        }
    });
    ctx.restore();

    // -- BATCH 2: PHYSICAL CORES (Source Over) --
    // Render the solid floating objects.
    ctx.save();
    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const baseColor = t.color;
        
        // Hover Animation (Shared math)
        const hoverY = Math.sin(now * 0.002 + t.x) * 4 - 8;
        
        // Fake Shadow (Simple dark ellipse, no blur)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 10, 5, 0, 0, PI2);
        ctx.fill();

        // Core Object
        ctx.translate(cx, cy + hoverY);
        
        ctx.fillStyle = '#111';
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (t.type === 'OVERRIDE') {
            // Diamond Shape
            ctx.moveTo(0, -12);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 12);
            ctx.lineTo(-8, 0);
        } else if (t.type === 'MEMORY') {
            // Pyramid
            ctx.moveTo(0, -14);
            ctx.lineTo(10, 6);
            ctx.lineTo(-10, 6);
        } else {
            // Data Cube
            ctx.rect(-7, -7, 14, 14);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Light
        ctx.fillStyle = baseColor;
        const innerPulse = 0.5 + Math.sin(now * 0.005) * 0.3;
        ctx.globalAlpha = innerPulse;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, PI2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.translate(-cx, -(cy + hoverY)); // Reset transform manually is faster than save/restore in loop
    });
    ctx.restore();

    // -- BATCH 3: DATA BEAMS & UI (Overlay) --
    // Only for active terminals
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    terminals.forEach(t => {
        // Progress Bar (Billboard)
        if (t.progress > 0) {
            const cx = t.x * gridSize + halfGrid;
            const cy = t.y * gridSize + halfGrid;
            const hoverY = Math.sin(now * 0.002 + t.x) * 4 - 10;
            
            const pct = t.progress / t.totalTime;
            const barW = 24;
            const barH = 4;
            const bx = cx - barW/2;
            const by = cy + hoverY - 22;

            // Draw straight to context
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(bx, by, barW, barH);
            
            ctx.fillStyle = pct > 0.95 ? '#fff' : t.color;
            ctx.fillRect(bx, by, barW * pct, barH);
        }

        // Connection Beam
        if (t.isBeingHacked && !t.isLocked && snakeHead) {
            const cx = t.x * gridSize + halfGrid;
            const cy = t.y * gridSize + halfGrid;
            const hx = snakeHead.x * gridSize + halfGrid;
            const hy = snakeHead.y * gridSize + halfGrid;
            const hoverY = Math.sin(now * 0.002 + t.x) * 4 - 10;

            const startX = cx;
            const startY = cy + hoverY;

            // Beam Line
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.6;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(hx, hy);
            ctx.stroke();

            // Data Packets (Simple rects moving along line)
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.9;
            const dist = Math.hypot(hx - startX, hy - startY);
            const count = Math.min(5, Math.floor(dist / 40)); // LOD: fewer particles for performance
            
            for(let i=0; i<count; i++) {
                const tFlow = ((now * 0.003) + (i / count)) % 1;
                const px = startX + (hx - startX) * tFlow;
                const py = startY + (hy - startY) * tFlow;
                ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
            }
        }
    });
    ctx.restore();
};
