
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawVolumetricThruster, drawEntity25D } from '../primitives';

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
    const { ctx, gridSize, halfGrid, now, camera } = rc;
    const tilt = camera.tilt || 0;
    
    // 1. CALCULATE POSITIONS & ORIENTATION
    const segments: { 
        x: number, 
        y: number, 
        angle: number, 
        height: number,
        index: number,
        isHead: boolean,
        isTail: boolean
    }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        // Dynamic Height (Sine Wave)
        const baseH = i === 0 ? 14 : 10;
        const wave = Math.sin((now / 250) - (i * 0.5)) * 3;
        
        // Determine Angle
        let angle = 0;
        if (i === 0) {
            let rad = 0;
            switch(direction) {
                case 'RIGHT': rad = 0; break;
                case 'DOWN': rad = Math.PI/2; break;
                case 'LEFT': rad = Math.PI; break;
                case 'UP': rad = -Math.PI/2; break;
            }
            angle = rad;
        } else {
            const prevSeg = snake[i-1];
            if (prevSeg) {
                angle = Math.atan2(prevSeg.y - curr.y, prevSeg.x - curr.x);
            }
        }
        
        segments.push({ 
            x: ix * gridSize + halfGrid, 
            y: iy * gridSize + halfGrid, 
            angle,
            height: baseH + wave,
            index: i,
            isHead: i === 0,
            isTail: i === snake.length - 1
        });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;

    // 2. SORT SEGMENTS (Z-Sort)
    // Sort by Y coordinate. Smaller Y (Top) drawn first. Larger Y (Bottom) drawn last.
    // This ensures proper 2.5D overlap where lower objects block higher ones.
    segments.sort((a, b) => a.y - b.y);

    // 3. RENDER SEGMENTS
    for (const seg of segments) {
        const i = seg.index;

        drawEntity25D(
            ctx,
            seg.x,
            seg.y,
            seg.height,
            tilt,
            seg.angle,
            {
                shadow: () => {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.beginPath();
                    ctx.ellipse(0, 15, gridSize * 0.5, gridSize * 0.35, 0, 0, Math.PI * 2);
                    ctx.fill();
                },
                body: (offset) => {
                    if (i > 0) {
                       ctx.fillStyle = '#080808';
                       const w = gridSize * 0.4;
                       // Draw connecting spine
                       // offset is negative screen Y (pointing UP).
                       // We draw from 0 (Ground) to offset (Top).
                       // Rect height of 'offset' draws upward from y=0 because offset is negative.
                       ctx.fillRect(-w/2, 0, w, offset); 
                    }
                },
                top: (offset) => {
                    // Logic mapped from original renderer using stored props
                    const sizeRatio = 1 - (i / (snake.length + 15));
                    const w = (gridSize * 0.75) * Math.max(0.6, sizeRatio);
                    const l = (gridSize * 0.55) * Math.max(0.6, sizeRatio);

                    if (seg.isTail) {
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
                        ctx.strokeStyle = charColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else if (seg.isHead) {
                        // HEAD
                         // A. Lower Mandibles
                        ctx.fillStyle = '#080808';
                        ctx.beginPath();
                        ctx.moveTo(14, 3); ctx.lineTo(18, 8); ctx.lineTo(6, 12);
                        ctx.lineTo(-8, 8); ctx.lineTo(-8, -8); ctx.lineTo(6, -12);
                        ctx.lineTo(18, -8); ctx.lineTo(14, -3);
                        ctx.fill();

                        // B. Upper Shell
                        const headGrad = ctx.createLinearGradient(-10, 0, 20, 0);
                        headGrad.addColorStop(0, '#1a1a1a'); headGrad.addColorStop(0.3, '#3a3a3a'); headGrad.addColorStop(1.0, '#1a1a1a');
                        ctx.fillStyle = headGrad;
                        ctx.beginPath();
                        ctx.moveTo(22, 0); ctx.lineTo(14, -8); ctx.lineTo(-8, -10);
                        ctx.lineTo(-12, -6); ctx.lineTo(-12, 6); ctx.lineTo(-8, 10); ctx.lineTo(14, 8);
                        ctx.closePath();
                        ctx.fill();

                        // C. Eyes
                        ctx.fillStyle = charColor; ctx.shadowColor = charColor; ctx.shadowBlur = 15;
                        ctx.beginPath(); ctx.moveTo(16, -2); ctx.lineTo(8, -7); ctx.lineTo(8, -2); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(16, 2); ctx.lineTo(8, 7); ctx.lineTo(8, 2); ctx.fill();
                        ctx.shadowBlur = 0;
                    } else {
                        // BODY SEGMENT
                         ctx.fillStyle = '#111';
                        ctx.beginPath();
                        ctx.moveTo(l/2, -w/2); ctx.lineTo(l/2, w/2);
                        ctx.lineTo(-l/2, w/3); ctx.lineTo(-l/2, -w/3);
                        ctx.closePath();
                        ctx.fill();

                        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(-l/2, -w/3); ctx.lineTo(l/2, -w/2); ctx.stroke();

                        // Core
                        const pulse = (Math.sin((now * 0.005) - (i * 0.3)) + 1) * 0.5;
                        ctx.fillStyle = charColor;
                        ctx.globalAlpha = 0.4 + (pulse * 0.6);
                        ctx.shadowColor = charColor; ctx.shadowBlur = 5 * pulse;
                        ctx.beginPath(); ctx.rect(-l*0.15, -w*0.25, l*0.3, w*0.5); ctx.fill();
                        ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
                    }

                    // Damage Overlay
                    if (tailIntegrity < 100) {
                        const damageAlpha = (100 - tailIntegrity) * 0.008;
                        ctx.fillStyle = `rgba(20, 0, 0, ${damageAlpha})`;
                        ctx.fill(); // Fills last path
                    }
                }
            }
        );
    }
};
