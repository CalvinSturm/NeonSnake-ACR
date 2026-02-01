
import { RenderContext } from '../types';
import { Point, Direction, GameStatus } from '../../../types';
import { COLORS } from '../../../constants';
import { drawSphere, drawShadow, drawVolumetricThruster } from '../primitives';
// V1
import { renderSnakeMech } from './renderSnakeMech';
import { renderSnakeFlux } from './renderSnakeFlux';
import { renderSnakeNeon } from './renderSnakeNeon';
import { renderSnakePixel } from './renderSnakePixel';
import { renderSnakeMinimal } from './renderSnakeMinimal';
import { renderSnakeGlitch } from './renderSnakeGlitch';
import { renderSnakeOrganic } from './renderSnakeOrganic';
import { renderSnakeProtocol } from './renderSnakeProtocol';
import { renderSnakeSystem } from './renderSnakeSystem';
// V2
import { renderSnakeMech2 } from './renderSnakeMech2';
import { renderSnakeFlux2 } from './renderSnakeFlux2';
import { renderSnakeNeon2 } from './renderSnakeNeon2';
import { renderSnakePixel2 } from './renderSnakePixel2';
import { renderSnakeMinimal2 } from './renderSnakeMinimal2';
import { renderSnakeGlitch2 } from './renderSnakeGlitch2';
import { renderSnakeOrganic2 } from './renderSnakeOrganic2';
import { renderSnakeProtocol2 } from './renderSnakeProtocol2';
import { renderSnakeSystem2 } from './renderSnakeSystem2';
// V3
import { renderSnakeMech3 } from './renderSnakeMech3';
import { renderSnakeFlux3 } from './renderSnakeFlux3';
import { renderSnakeNeon3 } from './renderSnakeNeon3';
import { renderSnakePixel3 } from './renderSnakePixel3';
import { renderSnakeMinimal3 } from './renderSnakeMinimal3';
import { renderSnakeGlitch3 } from './renderSnakeGlitch3';
import { renderSnakeOrganic3 } from './renderSnakeOrganic3';
import { renderSnakeProtocol3 } from './renderSnakeProtocol3';
import { renderSnakeSystem3 } from './renderSnakeSystem3';
// V4
import { renderSnakeMech4 } from './renderSnakeMech4';
import { renderSnakeFlux4 } from './renderSnakeFlux4';
import { renderSnakeNeon4 } from './renderSnakeNeon4';
import { renderSnakePixel4 } from './renderSnakePixel4';
import { renderSnakeMinimal4 } from './renderSnakeMinimal4';
import { renderSnakeGlitch4 } from './renderSnakeGlitch4';
import { renderSnakeOrganic4 } from './renderSnakeOrganic4';
import { renderSnakeProtocol4 } from './renderSnakeProtocol4';
import { renderSnakeSystem4 } from './renderSnakeSystem4';
// V5
import { renderSnakeMech5 } from './renderSnakeMech5';
import { renderSnakeFlux5 } from './renderSnakeFlux5';
import { renderSnakeNeon5 } from './renderSnakeNeon5';
import { renderSnakePixel5 } from './renderSnakePixel5';
import { renderSnakeMinimal5 } from './renderSnakeMinimal5';
import { renderSnakeGlitch5 } from './renderSnakeGlitch5';
import { renderSnakeOrganic5 } from './renderSnakeOrganic5';
import { renderSnakeProtocol5 } from './renderSnakeProtocol5';
import { renderSnakeSystem5 } from './renderSnakeSystem5';
// V6
import { renderSnakeMech6 } from './renderSnakeMech6';
import { renderSnakeFlux6 } from './renderSnakeFlux6';
import { renderSnakeNeon6 } from './renderSnakeNeon6';
import { renderSnakePixel6 } from './renderSnakePixel6';
import { renderSnakeMinimal6 } from './renderSnakeMinimal6';
import { renderSnakeGlitch6 } from './renderSnakeGlitch6';
import { renderSnakeOrganic6 } from './renderSnakeOrganic6';
import { renderSnakeProtocol6 } from './renderSnakeProtocol6';
import { renderSnakeSystem6 } from './renderSnakeSystem6';

export const renderSnake = (
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
    const { ctx, gridSize, halfGrid, now, isStopped, status } = rc;
    const PI2 = Math.PI * 2;
    
    // DEATH ANIMATION: JITTER
    let segmentsToRender = snake;
    if (status === GameStatus.DYING) {
        segmentsToRender = snake.map(p => ({
            x: p.x + (Math.random() - 0.5) * 0.4,
            y: p.y + (Math.random() - 0.5) * 0.4
        }));
    }

    // CALCULATE VISUAL SEGMENT POSITIONS
    const segments: { x: number, y: number }[] = [];
    
    for (let i = 0; i < segmentsToRender.length; i++) {
        const curr = segmentsToRender[i];
        let prev = segmentsToRender[i + 1]; 
        
        if (i === segmentsToRender.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        // If stopped, we still interpolate based on the *current* frozen moveProgress (managed by logic)
        // Logic might freeze moveProgress or keep it static.
        // Actually moveProgress is derived from accumulator, which is frozen. So interpolation holds.
        if (prev && status !== GameStatus.DYING) { // Disable interpolation during death for sharper jitter
            const ix = prev.x + (curr.x - prev.x) * moveProgress;
            const iy = prev.y + (curr.y - prev.y) * moveProgress;
            segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
        } else {
            segments.push({ x: curr.x * gridSize + halfGrid, y: curr.y * gridSize + halfGrid });
        }
    }

    const headCx = segments[0].x;
    const headCy = segments[0].y;
    // const charColor = charProfile?.color || COLORS.snakeHead; // Used in specific renderers

    // RESOLVE STYLE
    let style = rc.snakeStyle || 'AUTO';
    if (style === 'AUTO') {
        if (charProfile?.id === 'spectre') style = 'FLUX';
        else if (charProfile?.id === 'volt') style = 'NEON';
        else if (charProfile?.id === 'rigger') style = 'PIXEL';
        else if (charProfile?.id === 'bulwark') style = 'MECH';
        else if (charProfile?.id === 'overdrive') style = 'GLITCH';
        else if (charProfile?.id === 'striker') style = 'MECH';
        else style = 'MECH';
    }

    // 0. STOPPED EFFECT (Brake Lights / Freeze)
    if (isStopped && segmentsToRender.length > 0) {
        ctx.save();
        ctx.translate(headCx, headCy);
        
        // Pulsing Brake Aura
        const pulse = Math.sin(now * 0.02) * 0.5 + 0.5;
        const radius = gridSize * (1.5 + pulse * 0.5);
        
        const grad = ctx.createRadialGradient(0, 0, gridSize * 0.5, 0, 0, radius);
        grad.addColorStop(0, 'rgba(255, 50, 0, 0)');
        grad.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Freeze Hexagon
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.rotate(now * 0.005);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const px = Math.cos(angle) * gridSize;
            const py = Math.sin(angle) * gridSize;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    // 1. TAIL AURA (Shared Visual Effect)
    if (stats.weapon.auraLevel > 0) {
        const gameplayRadius = stats.weapon.auraRadius;
        const areaMod = stats.globalAreaMod || 1.0;
        const radiusPx = (gameplayRadius * gridSize) * areaMod; 
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen'; 
        const step = gridSize * 0.4; 
        let dist = 0;
        
        // Use consistent weapon coloring instead of hardcoded values
        const colorCore = COLORS.aura; 
        const colorEdge = 'rgba(255, 50, 50, 0.2)'; // More intense edge

        for (let i = 0; i < segments.length - 1; i++) {
            const p1 = segments[i];
            const p2 = segments[i+1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segLen = Math.hypot(dx, dy);
            
            for (let t = 0; t < segLen; t += step) {
                const px = p1.x + (dx * (t / segLen));
                const py = p1.y + (dy * (t / segLen));
                
                const noise = Math.sin((dist + t) * 0.1 - now * 0.003) * Math.cos((dist - t) * 0.15 + now * 0.002);
                const pulse = 1 + (noise * 0.2); 
                const blobRadius = radiusPx * pulse;

                ctx.save();
                ctx.translate(px, py);
                ctx.scale(1, 0.7); 
                
                const g = ctx.createRadialGradient(0, 0, blobRadius * 0.4, 0, 0, blobRadius);
                g.addColorStop(0, colorCore);
                g.addColorStop(0.5, colorEdge);
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, blobRadius, 0, PI2);
                ctx.fill();
                
                ctx.restore();
            }
            dist += segLen;
        }
        ctx.restore();
    }

    // 2. RENDER SNAKE BODY
    switch (style) {
        case 'FLUX': renderSnakeFlux(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'FLUX2': renderSnakeFlux2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'FLUX3': renderSnakeFlux3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'FLUX4': renderSnakeFlux4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'FLUX5': renderSnakeFlux5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'FLUX6': renderSnakeFlux6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'NEON': renderSnakeNeon(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'NEON2': renderSnakeNeon2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'NEON3': renderSnakeNeon3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'NEON4': renderSnakeNeon4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'NEON5': renderSnakeNeon5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'NEON6': renderSnakeNeon6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'PIXEL': renderSnakePixel(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PIXEL2': renderSnakePixel2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PIXEL3': renderSnakePixel3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PIXEL4': renderSnakePixel4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PIXEL5': renderSnakePixel5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PIXEL6': renderSnakePixel6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'MINIMAL': renderSnakeMinimal(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MINIMAL2': renderSnakeMinimal2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MINIMAL3': renderSnakeMinimal3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MINIMAL4': renderSnakeMinimal4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MINIMAL5': renderSnakeMinimal5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MINIMAL6': renderSnakeMinimal6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'GLITCH': renderSnakeGlitch(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'GLITCH2': renderSnakeGlitch2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'GLITCH3': renderSnakeGlitch3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'GLITCH4': renderSnakeGlitch4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'GLITCH5': renderSnakeGlitch5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'GLITCH6': renderSnakeGlitch6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'ORGANIC': renderSnakeOrganic(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'ORGANIC2': renderSnakeOrganic2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'ORGANIC3': renderSnakeOrganic3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'ORGANIC4': renderSnakeOrganic4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'ORGANIC5': renderSnakeOrganic5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'ORGANIC6': renderSnakeOrganic6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'PROTOCOL': renderSnakeProtocol(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PROTOCOL2': renderSnakeProtocol2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PROTOCOL3': renderSnakeProtocol3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PROTOCOL4': renderSnakeProtocol4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PROTOCOL5': renderSnakeProtocol5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'PROTOCOL6': renderSnakeProtocol6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'SYSTEM': renderSnakeSystem(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'SYSTEM2': renderSnakeSystem2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'SYSTEM3': renderSnakeSystem3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'SYSTEM4': renderSnakeSystem4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'SYSTEM5': renderSnakeSystem5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'SYSTEM6': renderSnakeSystem6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'MECH6': renderSnakeMech6(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MECH5': renderSnakeMech5(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MECH4': renderSnakeMech4(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MECH3': renderSnakeMech3(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        case 'MECH2': renderSnakeMech2(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity); break;
        
        case 'MECH':
        default:
            renderSnakeMech(rc, segmentsToRender, prevTail, direction, stats, charProfile, moveProgress, visualNsAngle, tailIntegrity, phaseRailCharge, echoDamageStored, prismLanceTimer);
            break;
    }

    // 3. ATTACHMENTS (Phase Rail / Echo Cache / Shield)
    // Shared visual overlays for equipment state
    
    // PHASE RAIL CHARGE
    if (stats.weapon.phaseRailLevel > 0) {
        const maxCharge = 4000 / stats.globalFireRateMod;
        const pct = Math.min(1, phaseRailCharge / maxCharge);
        
        if (pct > 0.05) {
            ctx.save();
            ctx.translate(headCx, headCy);
            
            // Align with facing direction
            let rot = 0;
            switch(direction) {
                case 'RIGHT': rot = 0; break;
                case 'DOWN': rot = Math.PI/2; break;
                case 'LEFT': rot = Math.PI; break;
                case 'UP': rot = -Math.PI/2; break;
            }
            ctx.rotate(rot);

            // CHAOTIC MATTER CONVERGENCE (Particles)
            ctx.globalCompositeOperation = 'screen';
            const partCount = 10 + Math.floor(pct * 15); 
            
            for (let i = 0; i < partCount; i++) {
                const flowSpeed = 0.002 + (pct * 0.008); 
                const t = ((now * flowSpeed) + (i / partCount)) % 1; 
                const chaos = (1 - Math.pow(pct, 3)) * 20; 
                
                const r = (1 - t) * 45; 
                const theta = (t * 12) + (i * 1.5) + (now * 0.002);
                
                const railY = (i % 2 === 0 ? -1 : 1) * 7;
                
                const jitterX = Math.sin((now * 0.02) + (i * 13)) * chaos;
                const jitterY = Math.cos((now * 0.03) + (i * 7)) * chaos;

                const px = 5 - r + jitterX; 
                const py = railY + (Math.sin(theta) * r * 0.3) + jitterY; 

                const alpha = Math.sin(t * Math.PI) * (0.3 + pct * 0.7);
                const pSize = 1 + (pct * 2); 

                ctx.fillStyle = `rgba(180, 100, 255, ${alpha})`;
                ctx.beginPath();
                ctx.rect(px, py, pSize, pSize); 
                ctx.fill();
            }

            // RAIL GEOMETRY
            ctx.globalCompositeOperation = 'source-over';
            const extension = Math.pow(pct, 0.5) * 16; 
            const gap = 9 - (pct * 3); 
            
            const opacity = 0.4 + (pct * 0.6);
            const isReady = pct > 0.95;
            
            const railColor = isReady 
                ? `rgba(255, 255, 255, ${0.8 + Math.sin(now * 0.5) * 0.2})`
                : `rgba(200, 150, 255, ${opacity})`;
            
            ctx.fillStyle = `rgba(20, 10, 30, ${opacity * 0.8})`;
            ctx.strokeStyle = railColor;
            ctx.lineWidth = isReady ? 1.5 : 1;
            
            if (isReady) {
                ctx.shadowColor = COLORS.phaseRail;
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }

            const drawRail = (yMul: number) => {
                ctx.beginPath();
                const yOff = yMul * gap;
                ctx.moveTo(-4, yOff); // Back inner
                ctx.lineTo(8 + extension, yOff); // Front inner tip
                ctx.lineTo(6 + extension, yOff + (yMul * 4)); // Front outer
                ctx.lineTo(-6, yOff + (yMul * 4)); // Back outer
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            };

            drawRail(-1); // Top Rail
            drawRail(1);  // Bottom Rail

            // CORE SINGULARITY
            if (pct > 0.15) {
                ctx.globalCompositeOperation = 'screen';
                const coreLen = 14 * pct;
                const coreH = 3 * pct + (isReady ? Math.sin(now * 0.8) : 0); 
                
                const grad = ctx.createLinearGradient(0, 0, 10 + coreLen, 0);
                grad.addColorStop(0, COLORS.phaseRail);
                grad.addColorStop(0.5, '#ffffff'); 
                grad.addColorStop(1, COLORS.phaseRail);
                
                ctx.fillStyle = grad;
                ctx.shadowColor = COLORS.phaseRail;
                ctx.shadowBlur = 15 * pct;
                
                ctx.beginPath();
                ctx.ellipse(5 + (coreLen/2), 0, coreLen/2, coreH, 0, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // PRISM LANCE CHARGE
    if (stats.weapon.prismLanceLevel > 0) {
        const fireRate = 2000 / stats.globalFireRateMod;
        const pct = Math.min(1, prismLanceTimer / fireRate);
        
        ctx.save();
        ctx.translate(headCx, headCy);
        
        const floatY = Math.sin(now * 0.003) * 3 - 25; 
        ctx.translate(0, floatY);
        ctx.rotate(now * 0.001);
        ctx.scale(1, 0.7);

        const size = 4.5; 
        const corner = size * 0.3;
        
        const defineAsscher = (s: number, c: number) => {
            ctx.beginPath();
            ctx.moveTo(s, -s + c);
            ctx.lineTo(s - c, -s);
            ctx.lineTo(-s + c, -s);
            ctx.lineTo(-s, -s + c);
            ctx.lineTo(-s, s - c);
            ctx.lineTo(-s + c, s);
            ctx.lineTo(s - c, s);
            ctx.lineTo(s, s - c);
            ctx.closePath();
        };

        const opacity = 0.2 + (pct * 0.8);
        const intensity = Math.floor(pct * 255);
        const fillColor = `rgba(0, ${intensity}, ${intensity}, ${opacity})`;
        
        ctx.fillStyle = fillColor;
        if (pct > 0.95) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 25; 
            ctx.fillStyle = '#f0ffff'; 
        } else {
            ctx.shadowBlur = 0;
        }

        defineAsscher(size, corner);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + pct * 0.5})`;
        ctx.lineWidth = 1.2;
        
        defineAsscher(size, corner);
        ctx.stroke();
        
        const s2 = size * 0.6;
        const c2 = s2 * 0.3;
        defineAsscher(s2, c2);
        ctx.stroke();
        
        ctx.restore();
    }

    // ECHO CACHE
    if (stats.weapon.echoCacheLevel > 0) {
        const cap = 500 + (stats.weapon.echoCacheLevel * 500);
        const pct = Math.min(1, echoDamageStored / cap);
        if (pct > 0) {
            ctx.save();
            ctx.translate(headCx, headCy);
            ctx.rotate(now / -300);
            const gradient = ctx.createConicGradient(now / 500, 0, 0); 
            gradient.addColorStop(0, 'rgba(255, 170, 0, 0.5)');
            gradient.addColorStop(pct, '#ffaa00'); 
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
            const lineWidth = 3 + Math.sin(now / 200) * 1.5;
            ctx.lineWidth = lineWidth;
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, PI2 * pct); ctx.strokeStyle = gradient; ctx.stroke();
            ctx.restore();
        }
    }

    // SHIELD
    if (stats.shieldActive) {
        ctx.save();
        ctx.translate(headCx, headCy);
        ctx.scale(1, 0.8);
        const rotSpeed = now / 800;
        ctx.rotate(rotSpeed);

        const radius = 17; 
        
        const energyPulse = 0.3 + Math.sin(now / 300) * 0.1;
        const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
        grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
        grad.addColorStop(0.7, `rgba(0, 255, 255, ${energyPulse * 0.3})`);
        grad.addColorStop(1, `rgba(0, 255, 255, ${energyPulse})`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, PI2);
        ctx.fill();

        const segments = 3;
        const gap = 0.4;
        const arcLen = (PI2 / segments) - gap;
        const hOffset = 5; 
        
        ctx.shadowColor = COLORS.shield;
        ctx.shadowBlur = 10;

        for(let i=0; i<segments; i++) {
            const angle = (i * (PI2/segments));
            ctx.beginPath();
            ctx.arc(0, -hOffset, radius, angle, angle + arcLen);
            ctx.arc(0, hOffset, radius, angle + arcLen, angle, true);
            ctx.closePath();
            
            ctx.fillStyle = `rgba(0, 100, 100, 0.3)`;
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = COLORS.shield;
            ctx.stroke();
        }

        ctx.restore();
    }

    // NANO SWARM
    const nsLevel = stats.weapon.nanoSwarmLevel;
    if (nsLevel > 0) {
        const count = stats.weapon.nanoSwarmCount;
        const radiusX = 3.8 * gridSize;
        const radiusY = radiusX * 0.7; 
        const baseAngle = visualNsAngle;
        
        for(let i=0; i<count; i++) {
            const angle = baseAngle + (i * (PI2 / count));
            const sx = headCx + Math.cos(angle) * radiusX;
            const sy = headCy + Math.sin(angle) * radiusY;
            
            drawShadow(ctx, sx, sy + 25, 5);

            ctx.save();
            ctx.translate(sx, sy);
            
            const dx = -radiusX * Math.sin(angle);
            const dy = radiusY * Math.cos(angle);
            const rot = Math.atan2(dy, dx);
            
            ctx.rotate(rot);
            drawVolumetricThruster(ctx, -3, 0, 4, 10, COLORS.nanoSwarm, now, i * 200);

            const hullGrad = ctx.createLinearGradient(-4, -4, 4, 4);
            hullGrad.addColorStop(0, '#ffffff');       
            hullGrad.addColorStop(0.5, COLORS.nanoSwarm); 
            hullGrad.addColorStop(1, '#220011');       

            ctx.fillStyle = hullGrad;
            ctx.shadowColor = COLORS.nanoSwarm;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(6, 0);   
            ctx.lineTo(-3, 4);  
            ctx.lineTo(-1, 0);  
            ctx.lineTo(-3, -4); 
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(-1, 2);
            ctx.lineTo(-1, -2);
            ctx.fill();
            
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(1, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
};
