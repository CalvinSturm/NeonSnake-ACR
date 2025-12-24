
import { useCallback, RefObject } from 'react';
import { useGameState } from './useGameState';
import { DEFAULT_SETTINGS, COLORS, GRID_COLS, GRID_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { FoodType, EnemyType, GameStatus, Direction } from '../types';

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
    
    const rotSpeed = 0.0005 + (Math.sin(beatPhase * 0.5) * 0.0002);
    ctx.rotate(t * rotSpeed);
    ctx.scale(pulse, pulse);
    
    const numRings = 16;
    const tunnelSpeed = 0.002; 
    const scroll = (t * tunnelSpeed) % 1;
    
    ctx.lineWidth = 2;
    
    for(let i=0; i<numRings; i++) {
        const depth = (i + scroll) / numRings; 
        const z = Math.pow(depth, 4); 
        if (z < 0.001) continue;
        
        const size = width * 2.5 * z;
        const hue = (180 + (t * 0.15) + (depth * 120)) % 360;
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
    const { ctx, width, height, gridSize, now } = rc;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2 + (Math.sin(now / 1000) * 0.05);
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
};

const drawWalls = (rc: RenderContext, walls: any[]) => {
    const { ctx, gridSize, halfGrid } = rc;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.wallBorder;
    ctx.strokeStyle = COLORS.wallBorder;
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
            let color = COLORS.foodNormal;
            if (f.type === FoodType.BONUS) color = COLORS.foodBonus;
            else if (f.type === FoodType.POISON) color = COLORS.foodPoison;
            else if (f.type === FoodType.SLOW) color = COLORS.foodSlow;
            else if (f.type === FoodType.MAGNET) color = COLORS.foodMagnet;
            else if (f.type === FoodType.COMPRESSOR) color = COLORS.foodCompressor;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(now / 400 + (f.x * 0.1)); 
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = color;
            const size = 5;
            ctx.fillRect(-size, -size, size*2, size*2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-size, -size, size*2, size*2);
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
};

const drawSnake = (rc: RenderContext, snake: any[], direction: Direction, stats: any, charProfile: any) => {
    if (snake.length === 0) return;
    const { ctx, gridSize, halfGrid, now } = rc;
    const PI2 = Math.PI * 2;
    const head = snake[0];
    const headCx = head.x * gridSize + halfGrid;
    const headCy = head.y * gridSize + halfGrid;
    const charColor = charProfile?.color || COLORS.snakeHead;

    // AURA
    if (stats.weapon.auraLevel > 0) {
            const r = stats.weapon.auraRadius * gridSize;
            ctx.beginPath();
            ctx.arc(headCx, headCy, r, 0, PI2);
            ctx.fillStyle = `rgba(255, 50, 50, ${0.1 + Math.sin(now/200)*0.05})`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
    }

    // SPINE
    if (snake.length > 1) {
        ctx.beginPath();
        ctx.moveTo(headCx, headCy);
        for (let i = 1; i < snake.length; i++) {
            const seg = snake[i];
            ctx.lineTo(seg.x * gridSize + halfGrid, seg.y * gridSize + halfGrid);
        }
        drawNeonStroke(ctx, charColor, 4, 15);
    }

    // SEGMENTS
    for (let i = 1; i < snake.length; i++) {
        const seg = snake[i];
        const scx = seg.x * gridSize + halfGrid;
        const scy = seg.y * gridSize + halfGrid;
        const sizeRatio = 1 - (i / (snake.length + 8));
        const plateSize = (gridSize * 0.7) * Math.max(0.4, sizeRatio);
        
        ctx.fillStyle = '#111'; 
        ctx.fillRect(scx - plateSize/2, scy - plateSize/2, plateSize, plateSize);
        ctx.strokeStyle = charColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = Math.max(0.3, sizeRatio);
        ctx.strokeRect(scx - plateSize/2, scy - plateSize/2, plateSize, plateSize);
        ctx.globalAlpha = 1.0;
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

    // SHIELD
    if (stats.shieldActive) {
        ctx.save();
        ctx.translate(headCx, headCy);
        ctx.rotate(now / 500);
        const sr = 16 + Math.sin(now / 200) * 1;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * PI2;
            const sx = Math.cos(a) * sr;
            const sy = Math.sin(a) * sr;
            if (i===0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        
        ctx.strokeStyle = COLORS.shield;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.shield;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.fillStyle = COLORS.shield;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // NANO SWARM
    const nsLevel = stats.weapon.nanoSwarmLevel;
    if (nsLevel > 0) {
        const count = stats.weapon.nanoSwarmCount;
        const radius = 3.8 * gridSize;
        const speed = now / (350 - nsLevel * 10);
        
        for(let i=0; i<count; i++) {
            const angle = speed + (i * (PI2 / count));
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
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(20, 0);
            ctx.lineWidth = 2;
            ctx.strokeStyle = p.color;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, -1, 20, 2);
        } else if (p.type === 'SHARD') {
            ctx.beginPath();
            ctx.moveTo(6, 0); ctx.lineTo(0, 3); ctx.lineTo(-2, 0); ctx.lineTo(0, -3);
            ctx.fill();
        } else if (p.type === 'SERPENT') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(0, Math.sin(now / 50) * 4);
            ctx.lineTo(-8, 0);
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
    directionRef
  } = game;

  const draw = useCallback((_alpha: number) => {
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
        halfGrid: DEFAULT_SETTINGS.gridSize / 2
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
        
        // ── ENTITIES ──
        drawMines(rc, minesRef.current);
        drawTerminals(rc, terminalsRef.current, snakeRef.current[0]);
        drawFood(rc, foodRef.current);
        drawSnake(rc, snakeRef.current, directionRef.current, statsRef.current, game.selectedChar);
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
