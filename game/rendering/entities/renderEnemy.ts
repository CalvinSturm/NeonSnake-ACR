
import { Enemy, EnemyType } from '../../../types';
import { COLORS } from '../../../constants';
import { drawVolumetricThruster, drawShadow } from '../primitives';

export const renderEnemy = (
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    gridSize: number, 
    halfGrid: number, 
    snakeHead: any, 
    now: number
) => {
    // Context is already translated to enemy center (0,0) and scaled by spawn animation
    
    // 1. Calculate Orientation
    let angle = 0;
    // If snakeHead is provided, face the player (standard behavior)
    if (snakeHead) {
        const cx = e.x * gridSize + halfGrid; // Need world coords for atan2 if e.x is grid units?
        // Wait, renderEntities passes `e` which has grid coordinates.
        // But the context is already translated to `cx, cy`.
        // We need to calculate angle based on grid deltas.
        
        const dx = snakeHead.x - e.x;
        const dy = snakeHead.y - e.y;
        angle = Math.atan2(dy, dx);
    }
    
    // Override angle for Dasher if it has a target angle (charging)
    if (e.type === EnemyType.DASHER && e.angle !== undefined && e.dashState !== 'IDLE') {
        angle = e.angle;
    }

    // 2. Physics / Animation State
    const hoverOffset = Math.sin((now / 500) + e.id.charCodeAt(0)) * 3;
    const isDamaged = e.flash > 0;

    // 3. Render Shadow (Ground Plane)
    ctx.save();
    ctx.translate(0, 15); // Fixed distance to floor
    ctx.rotate(angle);
    
    // Shadow shape varies by type
    let shadowScaleX = 1;
    let shadowScaleY = 0.6;
    if (e.type === EnemyType.INTERCEPTOR) { shadowScaleX = 1.4; shadowScaleY = 0.4; }
    if (e.type === EnemyType.SHOOTER) { shadowScaleX = 0.9; shadowScaleY = 0.9; }
    
    ctx.scale(shadowScaleX, shadowScaleY);
    drawShadow(ctx, 0, 0, gridSize * 0.6, 10);
    ctx.restore();

    // 4. Render Body (Floating)
    ctx.save();
    ctx.translate(0, hoverOffset);
    ctx.rotate(angle);

    // Apply Damage Flash Overlay Mode
    if (isDamaged) {
        // We render normally, then overlay white/red at end? 
        // Or simpler: just shake and brighten here.
        ctx.translate((Math.random()-0.5)*4, (Math.random()-0.5)*4);
    }

    switch (e.type) {
        case EnemyType.HUNTER:
            renderHunter(ctx, gridSize, now, isDamaged);
            break;
        case EnemyType.INTERCEPTOR:
            renderInterceptor(ctx, gridSize, now, isDamaged);
            break;
        case EnemyType.SHOOTER:
            renderShooter(ctx, gridSize, now, isDamaged);
            break;
        case EnemyType.DASHER:
            renderDasher(ctx, gridSize, now, isDamaged);
            break;
        default:
            renderGeneric(ctx, gridSize, now);
            break;
    }

    ctx.restore();
};

// ─── ARCHETYPE RENDERERS ───

const renderHunter = (ctx: CanvasRenderingContext2D, size: number, now: number, damaged: boolean) => {
    // "VIPER" DRONE
    // Triangular, sleek, single eye
    const scale = 0.8;
    ctx.scale(scale, scale);

    // Thruster
    drawVolumetricThruster(ctx, -10, 0, 8, 25, '#ff4400', now);

    // Chassis Path
    const drawChassis = () => {
        ctx.beginPath();
        ctx.moveTo(20, 0);   // Nose
        ctx.lineTo(-10, 15); // Wing R
        ctx.lineTo(-5, 0);   // Notch
        ctx.lineTo(-10, -15);// Wing L
        ctx.closePath();
    };

    // Lower Hull (Darkness/Thickness)
    ctx.save();
    ctx.translate(0, 4);
    ctx.fillStyle = '#110505';
    drawChassis();
    ctx.fill();
    ctx.restore();

    // Main Hull
    ctx.fillStyle = damaged ? '#ffffff' : '#aa2222';
    // Gradient
    if (!damaged) {
        const g = ctx.createLinearGradient(-10, 0, 20, 0);
        g.addColorStop(0, '#550000');
        g.addColorStop(1, '#ff3333');
        ctx.fillStyle = g;
    }
    
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    drawChassis();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Details
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-2, 5);
    ctx.lineTo(-2, -5);
    ctx.fill();

    // Sensor Eye
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI*2);
    ctx.fill();
};

const renderInterceptor = (ctx: CanvasRenderingContext2D, size: number, now: number, damaged: boolean) => {
    // "DART" JET
    // Long, thin, fast. Twin engines.
    const scale = 0.9;
    ctx.scale(scale, scale);

    // Twin Ion Engines
    drawVolumetricThruster(ctx, -12, -6, 4, 35, '#00ffff', now);
    drawVolumetricThruster(ctx, -12, 6, 4, 35, '#00ffff', now, 100);

    const drawHull = () => {
        ctx.beginPath();
        ctx.moveTo(25, 0);    // Nose
        ctx.lineTo(-5, 8);    // Wing R Mid
        ctx.lineTo(-15, 12);  // Wing R Tip
        ctx.lineTo(-12, 4);   // Engine R
        ctx.lineTo(-12, -4);  // Engine L
        ctx.lineTo(-15, -12); // Wing L Tip
        ctx.lineTo(-5, -8);   // Wing L Mid
        ctx.closePath();
    };

    // 3D Depth
    ctx.save();
    ctx.translate(0, 3);
    ctx.fillStyle = '#111';
    drawHull();
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = damaged ? '#fff' : '#4400aa';
    if (!damaged) {
        const g = ctx.createLinearGradient(-15, 0, 25, 0);
        g.addColorStop(0, '#220055');
        g.addColorStop(0.5, '#6600ff');
        g.addColorStop(1, '#aa00ff');
        ctx.fillStyle = g;
    }
    drawHull();
    ctx.fill();

    // Stripes
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-5, 5);
    ctx.moveTo(10, 0); ctx.lineTo(-5, -5);
    ctx.stroke();
};

const renderShooter = (ctx: CanvasRenderingContext2D, size: number, now: number, damaged: boolean) => {
    // "MONITOR" TANK
    // Heavy, boxy, big cannon.
    const scale = 1.0;
    ctx.scale(scale, scale);

    // Rear exhaust vents (small)
    drawVolumetricThruster(ctx, -12, -8, 6, 10, '#00ff00', now);
    drawVolumetricThruster(ctx, -12, 8, 6, 10, '#00ff00', now);

    // Main Chassis
    const drawBox = () => {
        ctx.beginPath();
        // Octagon-ish
        ctx.moveTo(10, -10);
        ctx.lineTo(15, -5);
        ctx.lineTo(15, 5);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, 5);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-10, -10);
        ctx.closePath();
    };

    // Depth
    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = '#051105';
    drawBox();
    ctx.fill();
    ctx.restore();

    // Armor
    ctx.fillStyle = damaged ? '#fff' : '#225522';
    if (!damaged) {
        const g = ctx.createRadialGradient(0, -5, 0, 0, 0, 20);
        g.addColorStop(0, '#44aa44');
        g.addColorStop(1, '#113311');
        ctx.fillStyle = g;
    }
    drawBox();
    ctx.fill();
    
    // Hazard Stripes
    if (!damaged) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.3;
        for(let i=0; i<4; i++) {
            ctx.beginPath();
            ctx.moveTo(-20 + i*10, -20);
            ctx.lineTo(-10 + i*10, 20);
            ctx.lineTo(-15 + i*10, 20);
            ctx.lineTo(-25 + i*10, -20);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // Cannon Barrel
    ctx.fillStyle = '#111';
    ctx.fillRect(10, -3, 12, 6);
    ctx.fillStyle = '#00ff00'; // Muzzle glow
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 5;
    ctx.fillRect(20, -2, 2, 4);
    ctx.shadowBlur = 0;
};

const renderDasher = (ctx: CanvasRenderingContext2D, size: number, now: number, damaged: boolean) => {
    // "RAZOR" MINE
    // Spiked, aggressive, maybe rotating outer shell
    const scale = 0.9;
    ctx.scale(scale, scale);
    
    // Rotation of blades
    const rot = now * 0.01;

    // Thruster (Omni-directional glow)
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255, 0, 170, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Spinning Blades
    ctx.save();
    ctx.rotate(rot);
    
    const drawBlade = () => {
        ctx.beginPath();
        const count = 4;
        for(let i=0; i<count; i++) {
            const a = (i / count) * Math.PI * 2;
            const rO = 18;
            const rI = 6;
            const ax = Math.cos(a);
            const ay = Math.sin(a);
            
            // Blade Tip
            ctx.lineTo(ax * rO, ay * rO);
            // Inner Notch
            const a2 = a + (Math.PI / count);
            const ax2 = Math.cos(a2);
            const ay2 = Math.sin(a2);
            ctx.lineTo(ax2 * rI, ay2 * rI);
        }
        ctx.closePath();
    };

    // Shadow/Depth
    ctx.save();
    ctx.translate(0, 4);
    ctx.fillStyle = '#110000';
    drawBlade();
    ctx.fill();
    ctx.restore();

    // Metal
    ctx.fillStyle = damaged ? '#fff' : '#aa0044';
    drawBlade();
    ctx.fill();
    
    // Edges
    ctx.strokeStyle = '#ff88aa';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore(); // Stop rotation

    // Central Core (Static)
    ctx.fillStyle = '#330011';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI*2);
    ctx.fill();
};

const renderGeneric = (ctx: CanvasRenderingContext2D, size: number, now: number) => {
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, 5);
    ctx.lineTo(-5, -5);
    ctx.fill();
};
