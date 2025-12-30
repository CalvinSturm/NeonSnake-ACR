
import { RenderContext } from '../types';
import { Mine, FoodItem, Enemy, EnemyType, FoodType, Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawShadow, drawSphere } from '../primitives';
import { renderBoss } from '../entities/renderBoss';
import { renderWarden } from '../entities/renderWarden';
import { renderEnemy } from '../entities/renderEnemy';
import { renderSnake } from '../entities/renderSnake';
import { renderBarrier } from '../entities/renderBarrier';
import { renderSpaceship } from '../entities/renderSpaceship';
import { renderTailAura } from '../entities/weapons/renderTailAura';
import { getInterpolatedSegments } from '../../utils/interpolation';

export const renderEntities = (
    rc: RenderContext,
    mines: Mine[],
    food: FoodItem[],
    enemies: Enemy[],
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    powerUps: { magnetUntil: number },
    visualNsAngle: number,
    tailIntegrity: number,
    phaseRailCharge: number,
    echoDamageStored: number,
    prismLanceTimer: number
) => {
    const { ctx, gridSize, halfGrid, now, gameTime } = rc;
    const PI2 = Math.PI * 2;

    // 1. MINES
    for (const m of mines) {
        if (m.shouldRemove) continue;
        const cx = m.x * gridSize + halfGrid;
        const cy = m.y * gridSize + halfGrid;
        
        // Range indicator
        const pulse = 1 + Math.sin(now / 200) * 0.1;
        ctx.beginPath();
        ctx.arc(cx, cy, m.triggerRadius * gridSize * pulse, 0, PI2);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Mine Body (Floating)
        const hover = Math.sin(now / 300) * 2;
        
        // Shadow
        drawShadow(ctx, cx, cy + 10, 6);

        ctx.save();
        ctx.translate(cx, cy + hover);
        ctx.rotate(now / 300);
        
        // 3D Spikes
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
        
        // Core
        drawSphere(ctx, 0, 0, 4, '#ffaa00');
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    // 2. FOOD & XP ORBS
    for (const f of food) {
        if (f.shouldRemove) continue;
        const cx = f.x * gridSize + halfGrid;
        const cy = f.y * gridSize + halfGrid;
        
        // ── XP ORB OPTIMIZED RENDER PATH ──
        if (f.type === FoodType.XP_ORB) {
            // 1. Cheap Shadow (No Blur)
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 8, 4, 2, 0, 0, PI2);
            ctx.fill();

            // 2. Energetic Bobbing
            const hover = Math.sin((now / 200) + (f.x * 0.5)) * 4;
            
            ctx.save();
            ctx.translate(cx, cy + hover);
            
            // 3. Additive Glow Composition (Zero Garbage Collection)
            ctx.globalCompositeOperation = 'screen';
            
            // Outer Halo (Large, Faint)
            ctx.fillStyle = COLORS.xpOrb;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, PI2);
            ctx.fill();
            
            // Inner Body (Brighter)
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, PI2);
            ctx.fill();

            // Core Singularity (White Hot)
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, 1.5, 0, PI2);
            ctx.fill();
            
            ctx.restore();
            continue; // Skip standard render
        }

        // ── STANDARD FOOD RENDER PATH ──
        const hover = Math.sin(now / 300 + f.x) * 3;
        
        // Shadow on floor
        drawShadow(ctx, cx, cy + 12, 6);

        ctx.save();
        ctx.translate(cx, cy + hover);

        // NORMAL FOOD: Rotating Cube (Pseudo-3D)
        const size = 10;
        ctx.rotate(now / 400 + (f.x * 0.2)); 
        
        ctx.fillStyle = COLORS.foodNormal;
        ctx.shadowColor = COLORS.foodNormal;
        ctx.shadowBlur = 15;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Highlight face
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-size/2, -size/2, size, size/3);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // 3. ENEMIES
    enemies.forEach(e => {
        if (e.shouldRemove) return;
        
        // Spawn/Death Scaling
        let scale = 1.0;
        if (e.state === 'SPAWNING') {
            scale = Math.max(0, Math.min(1, (gameTime - e.spawnTime) / 500));
        }
        
        const cx = e.x * gridSize + halfGrid;
        const cy = e.y * gridSize + halfGrid;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // Render Entity
        if (e.type === EnemyType.BOSS) {
            // Dispatch based on config ID
            if (e.bossConfigId === 'WARDEN_07') {
                renderWarden(ctx, e, now, gridSize);
            } else if (e.bossConfigId === 'SPACESHIP_BOSS') {
                renderSpaceship(ctx, e, gridSize, halfGrid, now);
            } else {
                renderBoss(ctx, e, now, gridSize, halfGrid, snake[0]);
            }
        } else if (e.type === EnemyType.BARRIER) {
            // Specific renderer for the wall
            ctx.restore(); // Barrier uses its own transform
            renderBarrier(ctx, e, gridSize, halfGrid, now);
            return; // Skip restore below
        } else {
            renderEnemy(ctx, e, gridSize, halfGrid, snake[0], now);
        }

        ctx.restore();
    });

    // 4. TAIL AURA PASS
    // Renders behind snake body but above floor
    if (stats.weapon.auraLevel > 0) {
        const segments = getInterpolatedSegments(snake, prevTail, moveProgress, gridSize, halfGrid);
        const radiusPx = (stats.weapon.auraRadius * gridSize) * stats.globalAreaMod;
        renderTailAura(rc, segments, radiusPx);
    }

    // 5. SNAKE
    renderSnake(
        rc, 
        snake, 
        prevTail, 
        direction, 
        stats, 
        charProfile, 
        moveProgress, 
        visualNsAngle, 
        tailIntegrity, 
        phaseRailCharge, 
        echoDamageStored, 
        prismLanceTimer
    );
};
