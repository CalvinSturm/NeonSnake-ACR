
import { RenderContext } from '../types';
import { Point, Terminal } from '../../../types';
import { COLORS } from '../../../constants';
import { drawBeveledRect, drawBoxShadow, drawVolumetricThruster } from '../primitives';

export const renderEnvironment = (rc: RenderContext, walls: Point[], terminals: Terminal[], snakeHead: Point | undefined) => {
    const { ctx, gridSize, halfGrid, now, viewport } = rc;
    const PI2 = Math.PI * 2;
    
    // ─── BOUNDARY VISUALIZATION ───
    const worldW = viewport.cols * gridSize;
    const worldH = viewport.rows * gridSize;
    
    // 1. Darken Void (Outside Play Area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const huge = 50000;
    
    ctx.fillRect(-huge, -huge, 2 * huge + worldW, huge); // Top
    ctx.fillRect(-huge, worldH, 2 * huge + worldW, huge); // Bottom
    ctx.fillRect(-huge, 0, huge, worldH); // Left
    // Right side void is handled by Gate logic or standard fill if gate is closed?
    // Actually standard fill covers everything outside, so we fill right side too.
    ctx.fillRect(worldW, 0, huge, worldH); // Right

    // 2. PERMANENT BOUNDARY FRAME
    // A distinct holographic box defining the play area
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(0, 0, worldW, worldH);
    
    // Corner accents
    const cLen = gridSize;
    ctx.lineWidth = 4;
    ctx.beginPath();
    // TL
    ctx.moveTo(0, cLen); ctx.lineTo(0,0); ctx.lineTo(cLen, 0);
    // TR
    ctx.moveTo(worldW - cLen, 0); ctx.lineTo(worldW, 0); ctx.lineTo(worldW, cLen);
    // BR
    ctx.moveTo(worldW, worldH - cLen); ctx.lineTo(worldW, worldH); ctx.lineTo(worldW - cLen, worldH);
    // BL
    ctx.moveTo(cLen, worldH); ctx.lineTo(0, worldH); ctx.lineTo(0, worldH - cLen);
    ctx.stroke();
    
    ctx.shadowBlur = 0; // Reset

    // ─── DYNAMIC BOUNDARY EDGES ───
    // Calculate proximity factors (0.0 to 1.0) for each wall
    let pL = 0, pR = 0, pT = 0, pB = 0;
    let maxP = 0;

    if (snakeHead) {
        const thresh = gridSize * 10; // Detection range (10 tiles)
        
        // Pixel coordinates of head center
        const hx = snakeHead.x * gridSize + halfGrid;
        const hy = snakeHead.y * gridSize + halfGrid;
        
        // Calculate normalized proximity (0 = safe, 1 = touching)
        // Using quartic ease for steeper ramp-up near wall
        pL = Math.pow(Math.max(0, 1 - (hx / thresh)), 4);
        pR = Math.pow(Math.max(0, 1 - ((worldW - hx) / thresh)), 4);
        pT = Math.pow(Math.max(0, 1 - (hy / thresh)), 4);
        pB = Math.pow(Math.max(0, 1 - ((worldH - hy) / thresh)), 4);
        
        maxP = Math.max(pL, pR, pT, pB);
    }

    // CRITICAL DANGER VIGNETTE
    // If any wall is dangerously close, draw a red vignette on that side
    if (maxP > 0.4 && !rc.stageReady) {
        ctx.save();
        const dangerAlpha = Math.min(0.6, (maxP - 0.4) * 1.5);
        
        // Pulse alpha for urgency
        const pulse = 0.8 + Math.sin(now * 0.02) * 0.2;
        ctx.fillStyle = `rgba(255, 0, 0, ${dangerAlpha * pulse})`;
        
        // We draw in screen space relative to camera, but we are currently in world space.
        // We can draw rects on the edges of the world.
        const vThresh = gridSize * 2; // Thickness of warning glow in world units

        if (pT > 0.4) ctx.fillRect(0, 0, worldW, vThresh * pT);
        if (pB > 0.4) ctx.fillRect(0, worldH - (vThresh * pB), worldW, vThresh * pB);
        if (pL > 0.4) ctx.fillRect(0, 0, vThresh * pL, worldH);
        if (pR > 0.4) ctx.fillRect(worldW - (vThresh * pR), 0, vThresh * pR, worldH);

        ctx.restore();
    }

    // Helper to draw a smart, reactive edge
    const drawEdge = (x1: number, y1: number, x2: number, y2: number, prox: number, isRightEdge: boolean = false) => {
        // Skip right edge drawing if stage is ready (Gate is open)
        if (isRightEdge && rc.stageReady) return;

        ctx.save();
        
        // "Barely enough time" threshold: prox > 0.6 (approx 1-2 tiles away with pow4 curve)
        const isWarning = prox > 0.3;
        const isCritical = prox > 0.6; 
        
        let color = '0, 255, 255'; // Cyan base
        let alpha = 0.1 + prox * 0.5;
        let width = 2;
        let glowSize = 0;
        
        if (isCritical) {
            // RED STROBE
            const strobeFreq = 50 - (prox * 30); // Faster as you get closer
            const isStrobeOn = Math.floor(now / strobeFreq) % 2 === 0;
            
            color = '255, 0, 0';
            alpha = isStrobeOn ? 1.0 : 0.3;
            width = 4 + (prox * 8); // Thicker line
            glowSize = 20 + (prox * 50); // Massive glow
            
        } else if (isWarning) {
            // ORANGE/YELLOW TRANSITION
            color = '255, 100, 0';
            alpha = 0.4 + prox * 0.4;
            width = 3;
            glowSize = 10;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        ctx.lineWidth = width;
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.shadowColor = `rgba(${color}, 1)`;
        ctx.shadowBlur = glowSize;
        
        // Animation Logic
        if (isCritical) {
            ctx.setLineDash([]); // Solid line for imminent collision
        } else {
            // Dashes get longer and faster as you approach
            const dashLen = 20 + (prox * 100);
            const gapLen = Math.max(5, 50 - (prox * 40));
            ctx.setLineDash([dashLen, gapLen]);
            ctx.lineDashOffset = -now * (0.1 + (prox * 0.5));
        }
        
        ctx.stroke();
        
        // Draw Warning Text on Wall if close
        if (isWarning) {
            ctx.fillStyle = `rgba(${color}, ${alpha})`;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 0;
            
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            // Push text slightly into play area
            let tx = midX, ty = midY;
            if (x1 === x2) tx += (x1 === 0 ? 30 : -30); // Vertical Wall
            if (y1 === y2) ty += (y1 === 0 ? 30 : -30); // Horizontal Wall
            
            if (isCritical) {
                // Flash text
                if (Math.floor(now / 100) % 2 === 0) {
                     ctx.fillText("!!! IMPACT !!!", tx, ty);
                }
            } else {
                ctx.fillText("BOUNDARY", tx, ty);
            }
        }

        ctx.restore();
    };

    // Draw 4 Edges independent of each other
    drawEdge(0, 0, worldW, 0, pT);          // Top
    drawEdge(0, worldH, worldW, worldH, pB); // Bottom
    drawEdge(0, 0, 0, worldH, pL);          // Left
    drawEdge(worldW, 0, worldW, worldH, pR, true); // Right

    // Render Gate on Right Edge
    renderExitGate(rc);

    // 4. Corner Brackets (High Tech) - Reactive
    if (!rc.stageReady) {
        const cSize = 32 + (maxP * 10);
        const bracketAlpha = 0.6 + (maxP * 0.4);
        const bracketColor = maxP > 0.6 ? '255, 0, 0' : '0, 255, 255';
        
        ctx.strokeStyle = `rgba(${bracketColor}, ${bracketAlpha})`;
        ctx.shadowColor = `rgba(${bracketColor}, 0.5)`;
        ctx.shadowBlur = 10 + (maxP * 20);
        ctx.lineWidth = 4;
        ctx.lineCap = 'square';
        
        ctx.beginPath();
        // TL
        ctx.moveTo(0, cSize); ctx.lineTo(0, 0); ctx.lineTo(cSize, 0);
        // TR
        ctx.moveTo(worldW - cSize, 0); ctx.lineTo(worldW, 0); ctx.lineTo(worldW, cSize);
        // BR
        ctx.moveTo(worldW, worldH - cSize); ctx.lineTo(worldW, worldH); ctx.lineTo(worldW - cSize, worldH);
        // BL
        ctx.moveTo(cSize, worldH); ctx.lineTo(0, worldH); ctx.lineTo(0, worldH - cSize);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

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

    // ─── TERMINALS (Floor Effects Only) ───
    // Pylon, data stream, and status text are rendered in renderEntities for depth sorting
    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const rangePx = t.radius * gridSize;

        // Interaction Logic
        let isInside = false;

        if (snakeHead) {
            const headPx = {
                x: snakeHead.x * gridSize + halfGrid,
                y: snakeHead.y * gridSize + halfGrid
            };
            const dx = headPx.x - cx;
            const dy = headPx.y - cy;
            const distToHead = Math.sqrt(dx * dx + dy * dy);
            isInside = distToHead < rangePx;
        }

        const isActive = t.isBeingHacked && !t.isLocked;
        const baseColor = t.color;
        const progress = t.progress / t.totalTime;

        // FLOOR PROJECTION (Range & Progress) - Always rendered under entities
        ctx.save();
        ctx.translate(cx, cy);

        // Range Ring (Static/Pulse)
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

        // Progress Fill (The "Download" Circle)
        if (progress > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, rangePx, -Math.PI / 2, -Math.PI / 2 + (PI2 * progress));
            ctx.lineTo(0, 0);
            ctx.fill();

            // Bright leading edge
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, rangePx, -Math.PI / 2, -Math.PI / 2 + (PI2 * progress));
            ctx.stroke();
        }

        ctx.restore();
    });
};

const renderExitGate = (rc: RenderContext) => {
    const { ctx, viewport, gridSize, stageReady, gameTime, stageReadyTime, now } = rc;
    
    // Position on right edge
    const worldW = viewport.cols * gridSize;
    const worldH = viewport.rows * gridSize;
    
    // Gate dimensions
    const gateWidth = gridSize * 2;
    const gateX = worldW - gateWidth; 
    
    // Animation State
    const OPEN_DURATION = 1500;
    const elapsed = stageReady && stageReadyTime ? Math.max(0, gameTime - stageReadyTime) : 0;
    // Cubic ease out
    const t = Math.min(1, elapsed / OPEN_DURATION);
    const easeOut = 1 - Math.pow(1 - t, 3);
    const openRatio = stageReady ? easeOut : 0.0;
    
    const centerH = worldH / 2;
    const doorHeight = worldH / 2;
    const openOffset = doorHeight * 0.9 * openRatio;

    ctx.save();

    // 1. FLOOR MARKINGS (Always visible, but active when open)
    const arrowAnim = (now / 200) % 20;
    ctx.save();
    ctx.translate(gateX - 60, 0);
    
    if (stageReady) {
        ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + Math.sin(now/200)*0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<3; i++) {
             const x = i * 20 + arrowAnim;
             ctx.moveTo(x, worldH/2 - 15);
             ctx.lineTo(x + 10, worldH/2);
             ctx.lineTo(x, worldH/2 + 15);
        }
        ctx.stroke();
    } else {
        // Warning stripes
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        for(let i=0; i<10; i++) {
            ctx.fillRect(i*10, worldH/2 - 50, 5, 100);
        }
    }
    ctx.restore();

    // 2. GATE HOUSING (Static frame)
    ctx.fillStyle = '#080808';
    ctx.fillRect(gateX, 0, gateWidth, worldH);
    
    // Tech details on housing
    ctx.fillStyle = '#111';
    ctx.fillRect(gateX + 10, 0, gateWidth - 20, worldH);
    
    // Border lights
    ctx.fillStyle = stageReady ? '#00ff00' : '#ff0000';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    // Vertical strips
    ctx.fillRect(gateX + 2, worldH/2 - 60, 4, 120);

    // 3. DOORS (Sliding)
    const drawDoor = (y: number, h: number, isTop: boolean) => {
        ctx.save();
        ctx.translate(gateX, y);
        
        // Door Body
        const doorGrad = ctx.createLinearGradient(0, 0, gateWidth, 0);
        doorGrad.addColorStop(0, '#222');
        doorGrad.addColorStop(0.5, '#333');
        doorGrad.addColorStop(1, '#222');
        
        ctx.fillStyle = doorGrad;
        ctx.fillRect(0, 0, gateWidth, h);
        
        // Mechanical Edge
        ctx.fillStyle = '#444';
        const edgeH = 10;
        const edgeY = isTop ? h - edgeH : 0;
        ctx.fillRect(2, edgeY, gateWidth - 4, edgeH);
        
        // Locking Mechanisms
        ctx.fillStyle = '#111';
        ctx.fillRect(gateWidth/2 - 10, edgeY + (isTop ? -5 : 5), 20, 10);
        
        // Status Light on Door
        const lightColor = stageReady ? '#00ff00' : '#ff0000';
        ctx.fillStyle = lightColor;
        ctx.shadowColor = lightColor;
        ctx.shadowBlur = 15;
        ctx.fillRect(gateWidth/2 - 15, edgeY + (isTop ? -20 : 15), 30, 4);
        
        ctx.restore();
    };

    // Top Door
    drawDoor(0, centerH - openOffset, true);
    
    // Bottom Door
    drawDoor(centerH + openOffset, doorHeight - openOffset, false);
    
    // 4. ENERGY FIELD (When Locked)
    if (!stageReady) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Clip to gap
        ctx.beginPath();
        ctx.rect(gateX, centerH - openOffset, gateWidth, openOffset * 2);
        ctx.clip();
        
        // Hex Field
        const hexSize = 10;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        
        const scrollY = (now * 0.05) % (hexSize * 2);
        
        // Draw lines for performance
        ctx.beginPath();
        for(let i=0; i<worldH/10; i++) {
             const y = i * 10 + scrollY;
             if (y > centerH - 60 && y < centerH + 60) {
                 ctx.moveTo(gateX, y);
                 ctx.lineTo(gateX + gateWidth, y);
             }
        }
        ctx.stroke();
        
        // "LOCKED" Hologram
        ctx.translate(gateX + gateWidth/2, centerH);
        ctx.rotate(-Math.PI/2);
        
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(now/200)*0.3})`;
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 10;
        ctx.fillText("ACCESS DENIED", 0, 0);
        
        ctx.restore();
    } else {
        // "EXIT" Hologram
        if (openRatio > 0.8) {
            ctx.save();
            ctx.translate(gateX + gateWidth/2, centerH);
            ctx.rotate(-Math.PI/2);
            
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(0, 255, 0, ${0.8 + Math.sin(now/200)*0.2})`;
            ctx.shadowColor = 'green';
            ctx.shadowBlur = 15;
            ctx.fillText(">>> EXIT >>>", 0, 0);
            
            ctx.restore();
        }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
};
