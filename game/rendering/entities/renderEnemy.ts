
import { Enemy, EnemyType } from '../../../types';
import { COLORS } from '../../../constants';
import { drawShadow, drawVolumetricThruster } from '../primitives';
import { RenderContext } from '../types'; // Import Context

// ─── SPECIFIC RENDERERS ───

const renderHunter = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number) => {
    // ENGINE
    drawVolumetricThruster(ctx, -10, 0, 6, 18, accent, now);

    // HULL (Delta Wing)
    // Dark metallic with gradient
    const grad = ctx.createLinearGradient(-10, 0, 10, 0);
    grad.addColorStop(0, '#111');
    grad.addColorStop(0.5, hull);
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(14, 0);    // Nose
    ctx.lineTo(-8, 10);   // Left Wingtip
    ctx.lineTo(-4, 0);    // Rear Notch
    ctx.lineTo(-8, -10);  // Right Wingtip
    ctx.closePath();
    ctx.fill();

    // PANEL LINES
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // EYE SENSOR
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Specular dot
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(3, -1, 1, 0, Math.PI * 2);
    ctx.fill();
};

const renderInterceptor = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number) => {
    // DUAL ENGINES (High speed trail)
    drawVolumetricThruster(ctx, -8, -5, 4, 30, accent, now, 100);
    drawVolumetricThruster(ctx, -8, 5, 4, 30, accent, now, 200);

    // HULL (Needle / Dart)
    const grad = ctx.createLinearGradient(-10, 0, 20, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.4, hull);
    grad.addColorStop(1, '#eee'); // Sharp nose
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();

    // WINGS (Swept Forward)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-12, -14);
    ctx.closePath();
    ctx.fill();

    // ENGINE GLOWS ON HULL
    ctx.fillStyle = accent;
    ctx.fillRect(-10, -5, 4, 2);
    ctx.fillRect(-10, 3, 4, 2);
};

const renderShooter = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e: Enemy) => {
    // ENGINE (Wide, heavy)
    drawVolumetricThruster(ctx, -12, 0, 10, 12, accent, now);

    // HULL (Heavy Block / Hexagon)
    ctx.fillStyle = hull;
    // 2.5D Extrusion effect manually
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 12);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    
    // Top Plate
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, -6, 12, 12);

    // TURRET MECHANISM
    ctx.save();
    
    // Recoil (Visual shift back when attacking)
    const recoil = (e.attackTimer && e.attackTimer > 2000) ? Math.sin(now * 0.5) * 2 : 0;
    
    // Barrel
    ctx.fillStyle = '#111';
    ctx.fillRect(0 - recoil, -3, 16, 6);
    
    // Turret Dome
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI*2);
    ctx.fill();
    
    // CHARGING GLOW
    if (e.attackTimer && e.attackTimer > 2000) {
        const charge = (e.attackTimer - 2000) / 1000; // 0 to 1 approx
        const flicker = Math.random() * 0.5 + 0.5;
        
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10 * charge * flicker;
        
        // Muzzle
        ctx.beginPath();
        ctx.arc(16 - recoil, 0, 2 + (charge * 2), 0, Math.PI*2);
        ctx.fill();
        
        // Venting
        ctx.globalAlpha = charge * 0.5;
        ctx.fillRect(-4, -4, 8, 8);
    }
    
    ctx.restore();
    
    // DECAL
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(-5, -5, 10, 10);
};

const renderDasher = (ctx: CanvasRenderingContext2D, hull: string, accent: string, now: number, e: Enemy) => {
    // ENGINES (Burst potential)
    const isDashing = e.dashState === 'DASH';
    const boost = isDashing ? 2.5 : 1;
    drawVolumetricThruster(ctx, -5, 0, 8 * boost, 15 * boost, accent, now);

    // HULL (Spiked / Aggressive)
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(16, 0); // Point
    ctx.lineTo(4, 6);
    ctx.lineTo(-4, 10); // Rear Spike R
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 0);  // Engine Mount
    ctx.lineTo(0, -4);
    ctx.lineTo(-4, -10); // Rear Spike L
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fill();

    // ENERGY BLADES (Mandibles)
    if (e.dashState === 'CHARGE' || isDashing) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = isDashing ? 20 : 10;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        
        // Flicker effect
        if (Math.random() > 0.1) {
            // Right Blade
            ctx.beginPath();
            ctx.moveTo(4, 6); 
            ctx.lineTo(18, 10);
            ctx.stroke();
            
            // Left Blade
            ctx.beginPath();
            ctx.moveTo(4, -6); 
            ctx.lineTo(18, -10);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    
    // CORE
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(2, 2);
    ctx.lineTo(2, -2);
    ctx.fill();
};

// ─── MAIN EXPORT ───

export const renderEnemy = (
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    gridSize: number, 
    halfGrid: number, 
    snakeHead: any, 
    now: number,
    reduceFlashing: boolean
) => {
    let color = COLORS.enemyHunter;
    let accentColor = '#ef4444';
    let hullColor = '#1a0505';
    let scale = 1.0;

    switch (e.type) {
        case EnemyType.INTERCEPTOR:
            color = COLORS.enemyInterceptor;
            accentColor = '#d946ef';
            hullColor = '#1a051a';
            scale = 0.9;
            break;
        case EnemyType.SHOOTER:
            color = COLORS.enemyShooter;
            accentColor = '#22c55e';
            hullColor = '#051a05';
            scale = 1.2;
            break;
        case EnemyType.DASHER:
            color = COLORS.enemyDasher;
            accentColor = '#f97316';
            hullColor = '#1a1005';
            break;
    }

    // DAMAGE FLASH (Override colors to white, UNLESS reduceFlashing is on)
    if (e.flash && e.flash > 0 && !reduceFlashing) {
        hullColor = '#ffffff';
        color = '#ffffff';
        accentColor = '#ffffff';
    }

    ctx.save();

    let angle = 0;
    if (snakeHead) {
        const dx = snakeHead.x - e.x;
        const dy = snakeHead.y - e.y;
        angle = Math.atan2(dy, dx);
    } else if (e.vx || e.vy) {
        angle = Math.atan2(e.vy, e.vx);
    }

    const hoverY = Math.sin(now / 250 + e.x) * 4;
    const zHeight = 15;

    ctx.save();
    ctx.translate(0, zHeight); 
    const shadowScale = 1.0 - (hoverY / 40); 
    drawShadow(ctx, 0, 0, gridSize * 0.6 * scale * shadowScale, 8);
    ctx.restore();

    ctx.translate(0, hoverY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    switch (e.type) {
        case EnemyType.INTERCEPTOR:
            renderInterceptor(ctx, hullColor, accentColor, now);
            break;
        case EnemyType.SHOOTER:
            renderShooter(ctx, hullColor, accentColor, now, e);
            break;
        case EnemyType.DASHER:
            renderDasher(ctx, hullColor, accentColor, now, e);
            break;
        case EnemyType.HUNTER:
        default:
            renderHunter(ctx, hullColor, accentColor, now);
            break;
    }

    if (e.stunTimer && e.stunTimer > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        
        ctx.rotate(now * 0.01);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const r = gridSize * 0.9;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        
        if (Math.random() < 0.3) {
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(-r, 0);
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.restore();

    if (e.hp < e.maxHp) {
        const hpPct = Math.max(0, e.hp / e.maxHp);
        const barW = gridSize * 1.5;
        const barH = 4;
        const yOff = -gridSize * 0.8 + hoverY; 
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(-barW/2, yOff, barW, barH);
        
        let fillColor = '#00ff00';
        if (hpPct <= 0.2) fillColor = '#ff0000';
        else if (hpPct <= 0.5) fillColor = '#ffaa00';
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(-barW/2, yOff, barW * hpPct, barH);
    }
};
