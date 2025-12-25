
import { useCallback, RefObject } from 'react';
import { useGameState } from './useGameState';
import { DEFAULT_SETTINGS, COLORS, GRID_COLS, GRID_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { FoodType, EnemyType, GameStatus, Direction, Point } from '../types';
import { audio } from '../utils/audio';

// ─────────────────────────────
// TYPES & CONTEXT
// ─────────────────────────────

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  now: number;
  width: number;
  height: number;
  gridSize: number;
  halfGrid: number;
  stageReady: boolean; // NEW: Passed to render functions
}

// ─────────────────────────────
// DRAWING HELPERS
// ─────────────────────────────

const drawNeonStroke = (ctx: CanvasRenderingContext2D, color: string, width: number, blur: number = 10) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // White Core highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = width / 2;
    ctx.stroke();
};

const drawNeonRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, blur: number = 10) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
};

// ─────────────────────────────
// RENDER PASSES (PURE FUNCTIONS)
// ─────────────────────────────

const drawTransition = (rc: RenderContext, startTime: number) => {
    const { ctx, width, height, now } = rc;
    const t = now - startTime;
    
    // Fade effect (Trails)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
    ctx.fillRect(0, 0, width, height);
    
    const cx = width / 2;
    const cy = height / 2;
    const bps = 2.25; 
    const beatPhase = (t / 1000) * bps; 
    const pulse = 1 + Math.pow(Math.sin(beatPhase * Math.PI), 10) * 0.2; 
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Accelerated Rotation for faster transition feel
    const rotSpeed = 0.002 + (Math.sin(beatPhase * 0.5) * 0.0005);
    ctx.rotate(t * rotSpeed);
    ctx.scale(pulse, pulse);
    
    const numRings = 16;
    // Faster tunnel speed (0.005 instead of 0.002) for accelerated collapse
    const tunnelSpeed = 0.005; 
    const scroll = (t * tunnelSpeed) % 1;
    
    ctx.lineWidth = 2;
    
    for(let i=0; i<numRings; i++) {
        const depth = (i + scroll) / numRings; 
        const z = Math.pow(depth, 4); 
        if (z < 0.001) continue;
        
        const size = width * 2.5 * z;
        const hue = (180 + (t * 0.3) + (depth * 120)) % 360; // Faster color shift
        const alpha = depth * depth; 
        
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
        ctx.shadowBlur = 20 * z;
        ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha})`;
        ctx.strokeRect(-size/2, -size/2, size, size);
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
};

const drawBackground = (rc: RenderContext) => {
    const { ctx, width, height } = rc;
    ctx.fillStyle = COLORS.background;
    // Draw oversized to cover camera shake edges
    ctx.fillRect(-50, -50, width + 100, height + 100);
};

const drawGrid = (rc: RenderContext) => {
    const { ctx, width, height, gridSize, now, stageReady } = rc;
    
    // NEW: Pulsing grid when stage is ready
    if (stageReady) {
        const pulse = Math.sin(now / 320) * 0.5 + 0.5; // ~2s period (0 to 1)
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.2})`;
        ctx.lineWidth = 1 + pulse;
    } else {
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2 + (Math.sin(now / 1000) * 0.05);
    }

    ctx.beginPath();
    for (let x = 0; x <= GRID_COLS; x += 1) {
      ctx.moveTo(x * gridSize, 0);
      ctx.lineTo(x * gridSize, height);
    }
    for (let y = 0; y <= GRID_ROWS; y += 1) {
      ctx.moveTo(0, y * gridSize);
      ctx.lineTo(width, y * gridSize);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // NEW: Border Pulse if ready
    if (stageReady) {
        const pulse = Math.sin(now / 320) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.4})`;
        ctx.lineWidth = 4 + pulse * 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.strokeRect(0, 0, width, height);
        ctx.shadowBlur = 0;
    }
};

const drawWalls = (rc: RenderContext, walls: any[]) => {
    const { ctx, gridSize, halfGrid, stageReady, now } = rc;
    
    if (stageReady) {
        const pulse = Math.sin(now / 320) * 0.5 + 0.5;
        ctx.shadowBlur = 10 + pulse * 15;
        ctx.shadowColor = `rgba(0, 255, 255, ${0.8})`;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 + pulse * 0.2})`;
    } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.wallBorder;
        ctx.strokeStyle = COLORS.wallBorder;
    }
    
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (const w of walls) {
        const wx = w.x * gridSize;
        const wy = w.y * gridSize;
        ctx.rect(wx + 2, wy + 2, gridSize - 4, gridSize - 4);
        const mx = wx + halfGrid;
        const my = wy + halfGrid;
        ctx.moveTo(mx - 2, my); ctx.lineTo(mx + 2, my);
        ctx.moveTo(mx, my - 2); ctx.lineTo(mx, my + 2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
};

const drawMines = (rc: RenderContext, mines: any[]) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    for (const m of mines) {
        if (m.shouldRemove) continue;
        const cx = m.x * gridSize + halfGrid;
        const cy = m.y * gridSize + halfGrid;
        const pulse = 1 + Math.sin(now / 200) * 0.1;
        ctx.beginPath();
        ctx.arc(cx, cy, m.triggerRadius * gridSize * pulse, 0, PI2);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(now / 300);
        ctx.fillStyle = COLORS.mine;
        ctx.shadowColor = COLORS.mine;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const s = 6;
        ctx.moveTo(-s, -s); ctx.lineTo(s, s);
        ctx.moveTo(s, -s); ctx.lineTo(-s, s);
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.mine;
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
    }
};

const drawTerminals = (rc: RenderContext, terminals: any[], snakeHead: any) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    terminals.forEach(t => {
        const cx = t.x * gridSize + halfGrid;
        const cy = t.y * gridSize + halfGrid;
        const rangePx = t.radius * gridSize;
        
        if (snakeHead) {
            const hx = snakeHead.x * gridSize + halfGrid;
            const hy = snakeHead.y * gridSize + halfGrid;
            const distPx = Math.hypot(hx - cx, hy - cy);

            if (distPx <= rangePx) {
                const progressRatio = t.progress / t.totalTime;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                // deterministic jitter based on time
                const jitX = Math.sin(now * 0.05) * 5; 
                const jitY = Math.cos(now * 0.05) * 5;
                const mx = (hx + cx) / 2 + jitX;
                const my = (hy + cy) / 2 + jitY;
                ctx.lineTo(mx, my);
                ctx.lineTo(cx, cy);
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + progressRatio * 0.6})`;
                ctx.lineWidth = 2 + (progressRatio * 3);
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 10 * progressRatio;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(now / 1000);
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const r = 8;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * PI2;
            const vx = Math.cos(angle) * r;
            const vy = Math.sin(angle) * r;
            if (i===0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
        
        const corePulse = Math.sin(now / 200) * 0.5 + 1;
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 4 * corePulse, 0, PI2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        if (t.progress > 0) {
            const pct = t.progress / t.totalTime;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, -Math.PI / 2, (-Math.PI / 2) + (PI2 * pct));
            ctx.strokeStyle = pct > 0.8 ? '#ff0' : '#0ff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });
};

const drawFood = (rc: RenderContext, food: any[]) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    
    for (const f of food) {
        if (f.shouldRemove) continue;
        const cx = f.x * gridSize + halfGrid;
        const cy = f.y * gridSize + halfGrid;
        
        if (f.type === FoodType.XP_ORB) {
            // XP ORBS: Animated, distinct, rewarding
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(now / 200 + (f.x * 0.5));
            ctx.shadowColor = COLORS.xpOrb;
            ctx.shadowBlur = 8;
            ctx.fillStyle = COLORS.xpOrb;
            
            const size = 3;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size, 0);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(-1, -1, 2, 2);
            
            ctx.restore();
            ctx.shadowBlur = 0;
        } else {
            // NORMAL FOOD: Rotates, glows, distinct
            const size = 8; // Larger size for better visibility
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(now / 400 + (f.x * 0.2)); 
            
            ctx.shadowColor = COLORS.foodNormal;
            ctx.shadowBlur = 12; // Nice glow
            ctx.fillStyle = COLORS.foodNormal;
            
            // Draw spinning square
            ctx.fillRect(-size/2, -size/2, size, size);
            
            // Bright center to make it pop
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(-2, -2, 4, 4);
            
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
};

const drawSnake = (rc: RenderContext, snake: any[], prevTail: Point | null, direction: Direction, stats: any, charProfile: any, moveProgress: number, isMagnetActive: boolean, hasXp: boolean, visualNsAngle: number, tailIntegrity: number, phaseRailCharge: number, echoDamageStored: number) => {
    if (snake.length === 0) return;
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;
    
    // CALCULATE VISUAL SEGMENT POSITIONS
    const segments: { x: number, y: number }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; // The segment "behind" it in the array is physically where it was
        
        if (i === snake.length - 1) {
            prev = prevTail || curr; // Fallback to current if no history (e.g. start)
        }
        
        if (prev) {
            const ix = prev.x + (curr.x - prev.x) * moveProgress;
            const iy = prev.y + (curr.y - prev.y) * moveProgress;
            segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
        } else {
            segments.push({ x: curr.x * gridSize + halfGrid, y: curr.y * gridSize + halfGrid });
        }
    }

    const headCx = segments[0].x;
    const headCy = segments[0].y;
    
    const charColor = charProfile?.color || COLORS.snakeHead;

    // MAGNET/XP GLOW FX (Strict Invariant Check)
    if (isMagnetActive && hasXp) {
        // Clear any existing glow (make sure you're resetting the drawing state every frame)
        ctx.save();
        ctx.clearRect(headCx - gridSize * 2, headCy - gridSize * 2, gridSize * 4, gridSize * 4);

        // Apply new effect
        ctx.translate(headCx, headCy);
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, gridSize * 2 * pulse, 0, PI2);
        const gradient = ctx.createRadialGradient(0, 0, gridSize * 0.5, 0, 0, gridSize * 2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }
    
// ─────────────────────────────────────────────
// 1. TAIL AURA DISTORTION FIELD (Expanded AOE)
// ─────────────────────────────────────────────
if (stats.weapon.auraLevel > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over'; // Ensure aura is drawn normally
    
    const level = stats.weapon.auraLevel;
    const gameplayRadius = stats.weapon.auraRadius || (1.5 + (level * 0.5));
    const areaMod = stats.globalAreaMod || 1.0;
    const baseRadius = (gameplayRadius * gridSize) * areaMod;
    
    const opacity = Math.min(0.6, 0.25 + (level * 0.04)); 

    // Draw AOE around the head (distortion field)
    const headCx = segments[0].x;
    const headCy = segments[0].y;

    // Apply AOE as a large, expanding distortion field
    const g = ctx.createRadialGradient(headCx, headCy, 0, headCx, headCy, baseRadius);
    g.addColorStop(0, `rgba(60, 0, 80, ${opacity})`);
    g.addColorStop(0.5, `rgba(40, 0, 60, ${opacity * 0.5})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    // Draw the distortion around the head (AOE)
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(headCx, headCy, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Apply jitter and pulsation to each segment (follows the head's AOE)
    segments.forEach((seg, i) => {
        if (i === 0) return;  // Skip the head (index 0) for the AOE

        const jitterX = Math.sin(now * 0.005 + i * 0.5) * (gridSize * 0.15);
        const jitterY = Math.cos(now * 0.007 + i * 0.6) * (gridSize * 0.15);
        
        const x = seg.x + jitterX;
        const y = seg.y + jitterY;

        const pulse = Math.sin(i * 0.4 + now * 0.003);
        const r = baseRadius + (pulse * gridSize * 0.2);

        // Create gradient for each segment
        const segmentGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        segmentGradient.addColorStop(0, `rgba(60, 0, 80, ${opacity})`);
        segmentGradient.addColorStop(0.5, `rgba(40, 0, 60, ${opacity * 0.5})`);
        segmentGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = segmentGradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

// ─────────────────────────────────────────────
// SPINE & BODY (Standard Rendering)
// ─────────────────────────────────────────────
if (segments.length > 1) {
    ctx.beginPath();
    ctx.moveTo(headCx, headCy);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    drawNeonStroke(ctx, charColor, 4, 15);
}

// SEGMENTS
for (let i = 1; i < segments.length; i++) {
    const scx = segments[i].x;
    const scy = segments[i].y;
    const sizeRatio = 1 - (i / (segments.length + 8));
    const plateSize = (gridSize * 0.7) * Math.max(0.4, sizeRatio);
    
    ctx.fillStyle = '#111'; 
    ctx.fillRect(scx - plateSize/2, scy - plateSize/2, plateSize, plateSize);
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    // Integrity feedback on segments
    if (tailIntegrity < 100) {
        const opacity = Math.max(0.3, sizeRatio) * (tailIntegrity / 100);
        ctx.globalAlpha = opacity;
    } else {
        ctx.globalAlpha = Math.max(0.3, sizeRatio);
    }

    ctx.strokeRect(scx - plateSize/2, scy - plateSize/2, plateSize, plateSize);
    ctx.globalAlpha = 1.0; // Reset Global Alpha
}

// HEAD
ctx.save();
ctx.translate(headCx, headCy);
let rot = 0;
switch(direction) {
    case 'RIGHT': rot = 0; break;
    case 'DOWN': rot = Math.PI/2; break;
    case 'LEFT': rot = Math.PI; break;
    case 'UP': rot = -Math.PI/2; break;
}
ctx.rotate(rot);
ctx.fillStyle = '#fff';
ctx.shadowColor = charColor;
ctx.shadowBlur = 15;
ctx.beginPath();
ctx.moveTo(8, 0);
ctx.lineTo(-6, 7);
ctx.lineTo(-4, 0);
ctx.lineTo(-6, -7);
ctx.closePath();
ctx.fill();
ctx.shadowBlur = 0;
ctx.fillStyle = '#0ff'; 
ctx.fillRect(2, -3, 2, 2);
ctx.fillRect(2, 1, 2, 2);
ctx.restore();


// ─────────────────────────────────────────────
// PHASE RAIL CHARGE INDICATOR (Enhanced Visual)
// ─────────────────────────────────────────────
if (stats.weapon.phaseRailLevel > 0) {
    // Calculate percentage. Max charge time is defined in useCombat as 4000/mod.
    // We replicate visual ratio here.
    const maxCharge = 4000 / stats.globalFireRateMod;
    const pct = Math.min(1, phaseRailCharge / maxCharge);
    
    if (pct > 0.1) {
        ctx.save();
        ctx.rotate(-rot); // Undo head rotation to keep indicator upright or relative
        
        // Draw converging particle lines with enhanced visibility
        const count = 6;  // Increased particle count for more density
        const dist = 25 * (1 - pct);  // Adjusted for more pronounced effect
        ctx.globalAlpha = pct;
        ctx.fillStyle = COLORS.phaseRail;  // Keep the original phase rail color
        for (let i = 0; i < count; i++) {
            const a = (now / 150) + (i * (PI2 / count));  // Faster rotation for more dynamic effect
            const px = Math.cos(a) * dist;
            const py = Math.sin(a) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, PI2);  // Larger particles
            ctx.fill();
        }
        
        // Flash effect when ready, with a more intense pulse and larger radius
        if (pct >= 0.95 && Math.floor(now / 30) % 2 === 0) {
            const pulse = Math.sin(now / 200) * 0.5 + 1.2;  // Pulsating glow effect
            ctx.strokeStyle = '#fff';  // Brighter white stroke for contrast
            ctx.lineWidth = 3;  // Thicker line for visibility
            ctx.beginPath();
            ctx.arc(0, 0, 12 * pulse, 0, PI2);  // Larger radius for stronger effect
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ─────────────────────────────────────────────
// ECHO CACHE ACCUMULATOR (Enhanced Visual)
// ─────────────────────────────────────────────
if (stats.weapon.echoCacheLevel > 0) {
    const cap = 500 + (stats.weapon.echoCacheLevel * 500);
    const pct = Math.min(1, echoDamageStored / cap);
    
    if (pct > 0) {
        ctx.save();
        ctx.rotate(now / -300); // Counter-rotate ring

        // Enhanced gradient effect for the ring
        const gradient = ctx.createConicGradient(now / 500, 0, 0);  // Use time for dynamic shifting
        gradient.addColorStop(0, 'rgba(255, 170, 0, 0.5)'); // Faded start
        gradient.addColorStop(pct, '#ffaa00');  // Full charge color
        gradient.addColorStop(1, 'rgba(255, 170, 0, 0)'); // Faded end

        // Increased ring thickness and pulsating effect
        const lineWidth = 3 + Math.sin(now / 200) * 1.5;  // Pulsating line width
        ctx.lineWidth = lineWidth;
        
        // Draw the ring with dynamic glow and pulse
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, PI2 * pct);  // Arc size based on charge
        ctx.strokeStyle = gradient;
        
        if (pct >= 1) {
            // Full charge visual effect: Glow and increased pulse
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 5; // Thicker line when fully charged
        } else {
            ctx.shadowBlur = 0; // No shadow when not fully charged
        }

        ctx.stroke();
        ctx.shadowBlur = 0;  // Reset shadow blur after stroke
        ctx.restore();
    }
}

ctx.restore();


// ─────────────────────────────────────────────
// SHIELD (Enhanced with Transparency and No Fill)
// ─────────────────────────────────────────────
if (stats.shieldActive) {
    ctx.save();
    ctx.translate(headCx, headCy);
    ctx.rotate(now / 500);

    const sr = 16 + Math.sin(now / 200) * 1;  // Shield radius with pulsating effect

    // Draw the shield outline
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI2;
        const sx = Math.cos(a) * sr;
        const sy = Math.sin(a) * sr;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
    }
    ctx.closePath();

    // Shield Outline Style
    ctx.strokeStyle = COLORS.shield;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.shield;
    ctx.shadowBlur = 8;

    // Apply shadow and stroke for visibility
    ctx.stroke();

    // No fill for shield, only a subtle semi-transparent outline effect
    ctx.globalAlpha = 0.1;  // Make the shield faint and non-obtrusive
    ctx.fillStyle = COLORS.shield;
    ctx.fill();  // Still need to fill for subtle effect but keep it faint

    // Reset Alpha and Shadow
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    ctx.restore();
}

    // NANO SWARM
    const nsLevel = stats.weapon.nanoSwarmLevel;
    if (nsLevel > 0) {
        const count = stats.weapon.nanoSwarmCount;
        const radius = 3.8 * gridSize;
        // Use EXTRAPOLATED visual angle
        const baseAngle = visualNsAngle;
        
        for(let i=0; i<count; i++) {
            const angle = baseAngle + (i * (PI2 / count));
            const sx = headCx + Math.cos(angle) * radius;
            const sy = headCy + Math.sin(angle) * radius;
            
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle * 3);
            ctx.fillStyle = COLORS.nanoSwarm;
            ctx.shadowColor = COLORS.nanoSwarm;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -5); ctx.lineTo(2, 0); ctx.lineTo(0, 5); ctx.lineTo(-2, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-5, 0); ctx.lineTo(0, 2); ctx.lineTo(5, 0); ctx.lineTo(0, -2);
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
};

const drawEnemies = (rc: RenderContext, enemies: any[], snakeHead: any) => {
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;

    for (const e of enemies) {
        if (e.shouldRemove) continue;
        const cx = e.x * gridSize + halfGrid;
        const cy = e.y * gridSize + halfGrid;
        
        ctx.save();
        ctx.translate(cx, cy);
        let angle = 0;
        if (snakeHead) {
                const hx = snakeHead.x * gridSize + halfGrid;
                const hy = snakeHead.y * gridSize + halfGrid;
                angle = Math.atan2(hy - cy, hx - cx);
        }
        ctx.rotate(angle);

        // INGRESS OPACITY: Ghosted if not active
        if (e.state !== 'ACTIVE') {
            ctx.globalAlpha = 0.5;
        }

        if (e.flash && e.flash > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0,0, 10, 0, PI2);
            ctx.fill();
        } else {
            switch (e.type) {
                case EnemyType.HUNTER:
                    ctx.fillStyle = COLORS.enemyHunter;
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(-8, 7);
                    ctx.lineTo(-4, 0);
                    ctx.lineTo(-8, -7);
                    ctx.fill();
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(-6, 0, 2, 0, PI2);
                    ctx.fill();
                    break;
                case EnemyType.INTERCEPTOR:
                    ctx.fillStyle = COLORS.enemyInterceptor;
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(-6, 10);
                    ctx.lineTo(-2, 0);
                    ctx.lineTo(-6, -10);
                    ctx.fill();
                    break;
                case EnemyType.SHOOTER:
                    ctx.fillStyle = COLORS.enemyShooter;
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#0f0';
                    ctx.fillRect(0, -2, 12, 4);
                    break;
                case EnemyType.DASHER:
                    ctx.fillStyle = COLORS.enemyDasher;
                    ctx.beginPath();
                    ctx.moveTo(14, 0);
                    ctx.lineTo(-6, 6);
                    ctx.lineTo(-6, -6);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(14, 0); ctx.lineTo(20, 0);
                    ctx.stroke();
                    break;
                case EnemyType.BOSS:
                    const hpRatio = e.hp / e.maxHp;
                    const shake = (1 - hpRatio) * Math.sin(now * 0.1) * 2;
                    ctx.translate(shake, shake);
                    ctx.fillStyle = '#400';
                    ctx.beginPath();
                    ctx.moveTo(25, 0);
                    ctx.lineTo(-15, 20);
                    ctx.lineTo(-25, 10);
                    ctx.lineTo(-25, -10);
                    ctx.lineTo(-15, -20);
                    ctx.fill();
                    ctx.save();
                    ctx.rotate(now / 100);
                    ctx.strokeStyle = '#f00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 8, 0, PI2);
                    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
                    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
                    ctx.stroke();
                    ctx.restore();
                    ctx.fillStyle = '#200';
                    ctx.fillRect(-20, -35, 40, 4);
                    ctx.fillStyle = '#f00';
                    ctx.fillRect(-20, -35, 40 * hpRatio, 4);
                    break;
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1.0; // Reset opacity

        if (e.type !== EnemyType.BOSS && e.hp < e.maxHp && e.hp > 0) {
            const pct = Math.max(0, e.hp / e.maxHp);
            const w = 22;
            const h = 4;
            const yOff = -16;
            ctx.fillStyle = '#000000';
            ctx.fillRect(cx - w/2 - 1, cy + yOff - 1, w + 2, h + 2);
            let color = '#ff0000';
            if (pct > 0.5) color = '#00ff00';
            else if (pct > 0.25) color = '#ffff00';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.fillRect(cx - w/2, cy + yOff, w * pct, h);
            ctx.shadowBlur = 0;
        }
    }
};

// NEW: Tile-based Ingress Indicators (Localized)
// Replaces full-edge drawing with precise tile targeting
const drawSpawnIndicators = (rc: RenderContext, enemies: any[]) => {
    const { ctx, gridSize, now } = rc;

    // Filter relevant enemies: Incoming (Spawning/Entering) and known side
    const incoming = enemies.filter(e =>
        (e.state === 'SPAWNING' || e.state === 'ENTERING') && e.spawnSide
    );

    if (incoming.length === 0) return;

    ctx.save();

    // OPTIONAL SYNC: Use BPM for pulse timing if available
    const bpm = audio.getBpm();
    const beatMs = 60000 / bpm;
    // Rhythmic pulse: sharp attack, smooth decay
    const phase = (now % beatMs) / beatMs;
    const pulse = Math.pow(Math.sin(phase * Math.PI), 2); // 0 to 1, peaked
    
    // Subtler alpha range (20-35% guideline implies geometry, but alpha should be low too)
    const baseAlpha = 0.1;
    const peakAlpha = 0.4;
    const currentAlpha = baseAlpha + (pulse * (peakAlpha - baseAlpha));

    for (const e of incoming) {
        // Determine edge tile coordinates
        let tx = Math.round(e.x);
        let ty = Math.round(e.y);
        let isVertical = false;

        // Project off-screen coordinates to the visible grid edge
        if (e.spawnSide === 'TOP') {
            ty = 0;
            isVertical = false;
        } else if (e.spawnSide === 'BOTTOM') {
            ty = GRID_ROWS - 1;
            isVertical = false;
        } else if (e.spawnSide === 'LEFT') {
            tx = 0;
            isVertical = true;
        } else if (e.spawnSide === 'RIGHT') {
            tx = GRID_COLS - 1;
            isVertical = true;
        }

        // Draw Center Tile + Neighbors (Local Cluster of 3)
        for (let offset = -1; offset <= 1; offset++) {
            let dx = tx;
            let dy = ty;

            if (isVertical) {
                dy += offset;
            } else {
                dx += offset;
            }

            // Boundary Check: Ensure we only draw on valid grid tiles
            if (dx >= 0 && dx < GRID_COLS && dy >= 0 && dy < GRID_ROWS) {
                const px = dx * gridSize;
                const py = dy * gridSize;

                // Visual: Edge Strip (Micro Indicator)
                // ~25% of tile size
                const thickness = gridSize * 0.25;
                
                ctx.fillStyle = `rgba(255, 50, 50, ${currentAlpha})`;
                // Add a slight glow for "Grid-line glow" feel
                ctx.shadowColor = `rgba(255, 0, 0, ${currentAlpha})`;
                ctx.shadowBlur = 6;

                if (e.spawnSide === 'TOP') {
                    // Top edge strip
                    ctx.fillRect(px + 2, py, gridSize - 4, thickness);
                } else if (e.spawnSide === 'BOTTOM') {
                    // Bottom edge strip
                    ctx.fillRect(px + 2, py + gridSize - thickness, gridSize - 4, thickness);
                } else if (e.spawnSide === 'LEFT') {
                    // Left edge strip
                    ctx.fillRect(px, py + 2, thickness, gridSize - 4);
                } else if (e.spawnSide === 'RIGHT') {
                    // Right edge strip
                    ctx.fillRect(px + gridSize - thickness, py + 2, thickness, gridSize - 4);
                }
                
                ctx.shadowBlur = 0;
            }
        }
    }

    ctx.restore();
};

const drawProjectiles = (rc: RenderContext, projectiles: any[]) => {
    const { ctx, now } = rc;
    const PI2 = Math.PI * 2;

    for (const p of projectiles) {
        if (p.shouldRemove) continue;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        
        const angle = Math.atan2(p.vy, p.vx);
        ctx.rotate(angle);
        
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff'; 
        
        if (p.type === 'LANCE') {
            // LANCE VISUAL OVERHAUL (Converging Triangle and Laser Beam)
            const hue = (angle * (180 / Math.PI) + now * 0.5) % 360;
            const beamColor = `hsl(${hue}, 100%, 70%)`;
            
            ctx.shadowColor = beamColor;
            ctx.shadowBlur = 15;
            
            // Converging Triangle Effect
            const triangleBase = 40; // Base width of the triangle
            const triangleHeight = 20; // Height of the triangle
            const triangleTip = Math.max(5, 20 - p.age / 10); // Triangle narrows as it "charges"
            
            ctx.beginPath();
            ctx.moveTo(-triangleBase / 2, -triangleHeight / 2);
            ctx.lineTo(triangleBase / 2, -triangleHeight / 2);
            ctx.lineTo(0, triangleTip); // Tip of the triangle
            ctx.closePath();
            ctx.fillStyle = beamColor;
            ctx.fill();

            // Laser Beam (when fully converged)
            if (p.age > 20) {  // After the triangle has fully converged
                const beamLength = Math.min(300, p.age * 3); // Beam extends over time
                
                ctx.beginPath();
                ctx.moveTo(0, 0); // Start from the tip of the triangle
                ctx.lineTo(0, -beamLength); // Extend the beam forward
                ctx.lineWidth = 6;
                ctx.strokeStyle = beamColor;
                ctx.globalAlpha = 0.8;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

        } else if (p.type === 'SHARD') {
            ctx.beginPath();
            ctx.moveTo(6, 0); ctx.lineTo(0, 3); ctx.lineTo(-2, 0); ctx.lineTo(0, -3);
            ctx.fill();
        } else if (p.type === 'SERPENT') {
            // VOLT SERPENT VISUAL OVERHAUL
            ctx.shadowColor = COLORS.voltSerpent;
            ctx.shadowBlur = 8;
            
            // Segmented Mecha-Worm
            ctx.fillStyle = COLORS.voltSerpent;
            ctx.beginPath();
            // Head
            ctx.moveTo(10, 0);
            ctx.lineTo(0, 5);
            ctx.lineTo(0, -5);
            ctx.fill();
            
            // Thrusters (Visual Only)
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-2, -2, 2, 4);
            
            // Tail trail logic handled by particles in useCombat, but draw a simple engine flare here
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(-8 - Math.random() * 5, 0);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();

        } else if (p.type === 'RAIL') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-40, -2, 80, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-40, -1, 80, 2);
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 3, 0, 0, PI2);
            ctx.fill();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(-2, 0, 12, 5, 0, 0, PI2);
            ctx.fill();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
};

const drawParticles = (rc: RenderContext, particles: any[]) => {
    const { ctx } = rc;
    for (const p of particles) {
        if (p.shouldRemove) continue;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        const size = 2 + (1 - p.life) * 2;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
        ctx.globalAlpha = 1.0;
    }
};

const drawShockwaves = (rc: RenderContext, shockwaves: any[]) => {
    const { ctx } = rc;
    const PI2 = Math.PI * 2;
    for (const s of shockwaves) {
        if (s.shouldRemove) continue;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.currentRadius, 0, PI2);
        ctx.strokeStyle = `rgba(150, 255, 255, ${s.opacity})`;
        ctx.lineWidth = 4 * s.opacity;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.currentRadius * 0.8, 0, PI2);
        ctx.strokeStyle = `rgba(150, 255, 255, ${s.opacity * 0.5})`;
        ctx.lineWidth = 2 * s.opacity;
        ctx.stroke();
    }
};

const drawLightning = (rc: RenderContext, lightningArcs: any[]) => {
    const { ctx } = rc;
    for (const l of lightningArcs) {
        if (l.shouldRemove) continue;
        ctx.shadowColor = COLORS.lightning;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `rgba(200, 255, 255, ${l.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        const dist = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
        const steps = Math.floor(dist / 20);
        let currX = l.x1;
        let currY = l.y1;
        for(let i=1; i<steps; i++) {
            const t = i / steps;
            const targetX = l.x1 + (l.x2 - l.x1) * t;
            const targetY = l.y1 + (l.y2 - l.y1) * t;
            const j = 15 * l.life; 
            // This small jitter is fine for lightning, hard to remove without seeded random
            currX = targetX + (Math.random() - 0.5) * j;
            currY = targetY + (Math.random() - 0.5) * j;
            ctx.lineTo(currX, currY);
        }
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        // Hop Indicator (Terminal Circle)
        ctx.beginPath();
        ctx.arc(l.x2, l.y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
};

const drawFloatingText = (rc: RenderContext, texts: any[]) => {
    const { ctx } = rc;
    ctx.textAlign = 'center';
    for (const t of texts) {
        if (t.shouldRemove) continue;
        ctx.font = `bold ${t.size}px "Orbitron", monospace`;
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life;
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1.0;
    }
};

const drawDigitalRain = (rc: RenderContext, drops: any[]) => {
    const { ctx } = rc;
    ctx.fillStyle = '#0f0';
    ctx.font = '10px monospace';
    for(const d of drops) {
         ctx.globalAlpha = d.opacity * 0.5;
         ctx.fillText(d.chars, d.x, d.y);
    }
    ctx.globalAlpha = 1.0;
};

// ─────────────────────────────
// MAIN HOOK
// ─────────────────────────────

export function useRendering(
  canvasRef: RefObject<HTMLCanvasElement>,
  game: ReturnType<typeof useGameState>
) {
  const {
    status,
    snakeRef,
    prevTailRef, // Access for tail interpolation
    enemiesRef,
    foodRef,
    wallsRef,
    terminalsRef,
    projectilesRef,
    particlesRef,
    floatingTextsRef,
    shockwavesRef,
    lightningArcsRef,
    digitalRainRef,
    minesRef, 
    statsRef, 
    shakeRef,
    gameTimeRef,
    transitionStartTimeRef,
    directionRef,
    powerUpsRef,
    nanoSwarmAngleRef,
    stageReadyRef, // NEW: Access readiness
    tailIntegrityRef, // NEW: Access for visual effects
    phaseRailChargeRef, // Access for visuals
    echoDamageStoredRef // Access for visuals
  } = game;

  const draw = useCallback((alpha: number, moveProgress: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Build Context
    const rc: RenderContext = {
        ctx,
        now: gameTimeRef.current,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        gridSize: DEFAULT_SETTINGS.gridSize,
        halfGrid: DEFAULT_SETTINGS.gridSize / 2,
        stageReady: stageReadyRef.current // NEW
    };

    // 2. Global Safety & Clear
    ctx.save();
    
    try {
        // 3. Early Exit: Hyperspace Tunnel
        if (status === GameStatus.STAGE_TRANSITION) {
            // NOTE: transitions render in screen space (no camera shake)
            // Transition handles its own clearing/fading to create trails
            drawTransition(rc, transitionStartTimeRef.current);
            return;
        }

        // 4. Main Game Clear (Absolute)
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 5. Global Camera Shake
        ctx.translate(shakeRef.current.x, shakeRef.current.y);

        // 6. Render Passes
        // ── WORLD ──
        drawBackground(rc);
        drawGrid(rc);
        drawWalls(rc, wallsRef.current);
        
        // NEW: Spawn Indicators (Draw before entities)
        drawSpawnIndicators(rc, enemiesRef.current);
        
        // ── ENTITIES ──
        drawMines(rc, minesRef.current);
        drawTerminals(rc, terminalsRef.current, snakeRef.current[0]);
        drawFood(rc, foodRef.current);
        
        // FX LOGIC: Magnet Glow
        const isMagnetActive = gameTimeRef.current < powerUpsRef.current.magnetUntil;
        const hasXp = foodRef.current.some(f => f.type === FoodType.XP_ORB);
        
        // SMOOTH NANO SWARM
        // Extrapolate angle for smoothness between simulation ticks
        // dAngle/dt = speed. Speed ~ 1/(350 - lvl*10).
        // alpha * 16.66ms gives time since last tick
        const nsLevel = statsRef.current.weapon.nanoSwarmLevel;
        let visualNsAngle = nanoSwarmAngleRef.current;
        if (nsLevel > 0) {
            const dt = alpha * 16.667;
            visualNsAngle += dt * (1 / (350 - nsLevel * 10));
        }

        drawSnake(
            rc, 
            snakeRef.current,
            prevTailRef.current,
            directionRef.current, 
            statsRef.current, 
            game.selectedChar,
            moveProgress,
            isMagnetActive,
            hasXp,
            visualNsAngle,
            tailIntegrityRef.current,
            phaseRailChargeRef.current, // Pass charge time
            echoDamageStoredRef.current // Pass stored damage
        );
        drawEnemies(rc, enemiesRef.current, snakeRef.current[0]);
        
        // ── PROJECTILES ──
        drawProjectiles(rc, projectilesRef.current);
        
        // ── FX ──
        drawParticles(rc, particlesRef.current);
        drawShockwaves(rc, shockwavesRef.current);
        drawLightning(rc, lightningArcsRef.current);
        
        // ── UI / OVERLAY ──
        drawFloatingText(rc, floatingTextsRef.current);
        drawDigitalRain(rc, digitalRainRef.current);
        
    } finally {
        // 7. Cleanup Global State
        ctx.restore(); 
    }

  }, [game]); // Intentionally broad dependency on game object to ensure fresh refs

  return { draw };
}
