
import { Enemy, Point } from '../../../types';
import { drawVolumetricThruster } from '../primitives';

export const renderSpaceship = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    gridSize: number,
    halfGrid: number,
    now: number,
    snakeHead?: Point
) => {
    // Context is already translated to entity position by renderEntities

    const stateId = e.bossState?.stateId || 'IDLE';
    const isCharging = stateId === 'CHARGE_CANNON';
    const isFiring = stateId === 'FIRE_CANNON';
    const isCooldown = stateId === 'COOLDOWN';

    // ─── ANIMATION VARS ───
    // Heavy hover effect
    const hoverY = Math.sin(now / 1200) * 4;
    // Slight roll to simulate air resistance/stabilization
    const roll = Math.sin(now / 1800) * 0.03; 

    // Scale up for boss presence
    const scale = 2.0;

    // Use angle from boss logic, fallback to calculation if missing
    let angle = e.angle;
    if (angle === undefined) {
        if (snakeHead) {
            angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
        } else {
            angle = Math.PI; 
        }
    }

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(0, hoverY);
    ctx.rotate(angle + roll);

    // 1. GROUND SHADOW (Projected far below to simulate altitude)
    ctx.save();
    ctx.translate(0, 60); // High altitude shadow
    ctx.scale(1.2, 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. REAR THRUSTERS (Draw first to be behind hull)
    const pulse = Math.sin(now / 80) * 0.15 + 0.85;
    
    // Main Engines (Attached at approx x=-45)
    drawVolumetricThruster(ctx, -45, -10, 14, 55 * pulse, '#00ffff', now);
    drawVolumetricThruster(ctx, -45, 10, 14, 55 * pulse, '#00ffff', now, 100);
    
    // Vertical Stabilizer Thrusters (Wingtip engines)
    drawVolumetricThruster(ctx, -30, -28, 6, 20, '#0088ff', now, 200);
    drawVolumetricThruster(ctx, -30, 28, 6, 20, '#0088ff', now, 300);

    // 3. 2.5D EXTRUSION (The "Sides")
    const depth = 6;
    ctx.save();
    ctx.translate(0, depth);
    ctx.fillStyle = '#050510'; // Deep shadow color
    // Add a subtle rim light to the bottom edge
    ctx.shadowColor = 'rgba(0, 255, 255, 0.1)';
    ctx.shadowBlur = 5;
    drawHullPath(ctx);
    ctx.fill();
    
    // Mechanical detailing on the sides (Tech greebles)
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(0, -10);
    ctx.moveTo(-10, 10); ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.restore();

    // 4. MAIN HULL (Top Surface)
    const hullGrad = ctx.createLinearGradient(40, -30, -40, 40);
    hullGrad.addColorStop(0, '#2e3045'); // Nose Highlight
    hullGrad.addColorStop(0.4, '#1b1b2a'); // Mid-Body
    hullGrad.addColorStop(1, '#0e0e15'); // Rear Shadow

    ctx.fillStyle = hullGrad;
    
    // Status Glow (Rim Light)
    if (isCharging) {
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
    } else if (isCooldown) {
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 10;
    } else {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
    }

    drawHullPath(ctx);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset for details

    // 5. HULL DETAILS (Panel Lines & Armor)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Wing Separators
    ctx.moveTo(-15, -15); ctx.lineTo(5, -10);
    ctx.moveTo(-15, 15); ctx.lineTo(5, 10);
    // Rear Flaps
    ctx.moveTo(-35, -20); ctx.lineTo(-35, 20);
    ctx.stroke();

    // 6. RAISED SUPERSTRUCTURE (Cockpit / Spine)
    ctx.save();
    // Slight parallax for height
    ctx.translate(2, -4); // Shift up-right
    
    // Spine Base
    ctx.fillStyle = '#151520';
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(0, -8);
    ctx.lineTo(-40, -5);
    ctx.lineTo(-40, 5);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit Glass
    const glassColor = isCharging ? '#ff00ff' : (isCooldown ? '#ff4400' : '#00ffff');
    ctx.fillStyle = glassColor;
    ctx.shadowColor = glassColor;
    ctx.shadowBlur = 12;
    
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(10, -4);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.fill();
    
    // Glass Glint
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 0;
    ctx.fillRect(15, -1, 4, 2);
    
    ctx.restore();

    // 7. VENTS (Dark recesses)
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.6;
    // Top Vent
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-35, -15); ctx.lineTo(-35, -8); ctx.fill();
    // Bottom Vent
    ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(-35, 15); ctx.lineTo(-35, 8); ctx.fill();
    ctx.globalAlpha = 1.0;

    // 8. WEAPON SYSTEMS (Charging / Firing FX)
    // Origin is Nose (+55, 0)
    
    if (isCharging) {
        const chargeTime = now / 50;
        const radius = 5 + (Math.sin(chargeTime) + 1) * 3;
        
        ctx.globalCompositeOperation = 'screen';
        
        // Telegraph Line (Targeting Laser)
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.4 + Math.sin(now/100) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(55, 0);
        ctx.lineTo(1200, 0); // Extended telegraph
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Energy gathering particles
        ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(chargeTime)*0.2})`;
        for(let i=0; i<3; i++) {
            const ang = chargeTime + (i * 2.09); // 2pi/3
            const dist = 15 - (Math.sin(chargeTime) * 5);
            ctx.beginPath();
            ctx.arc(55 + Math.cos(ang)*dist, Math.sin(ang)*dist, 2, 0, Math.PI*2);
            ctx.fill();
        }

        // Core Sphere
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(55, 0, radius, 0, Math.PI*2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
    }

    if (isFiring) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Muzzle Flash
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(60, 0, 15, 0, Math.PI*2);
        ctx.fill();
        
        // Main Beam (Infinite length towards +X)
        const beamGrad = ctx.createLinearGradient(0, -8, 0, 8);
        beamGrad.addColorStop(0, 'rgba(255,0,255,0)');
        beamGrad.addColorStop(0.3, '#ff00ff');
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(0.7, '#ff00ff');
        beamGrad.addColorStop(1, 'rgba(255,0,255,0)');
        
        ctx.fillStyle = beamGrad;
        // Draw from nose forward
        ctx.fillRect(55, -8, 1200, 16);
        
        // Shockrings
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(80, 0, 5, 20, 0, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.restore();
    }

    // 9. DAMAGE FX
    if (e.hp / e.maxHp < 0.4) {
        const flicker = Math.random() > 0.5;
        if (flicker) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = 0.3;
            drawHullPath(ctx);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
        }
        
        // Smoke Plume
        ctx.fillStyle = 'rgba(50,50,50,0.5)';
        ctx.beginPath();
        ctx.arc(-10, -10, 5 + Math.random()*3, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore(); // Undo Boss Rotation/Scale

    // 10. HEALTH BAR (World Space, above boss)
    // Draw relative to boss position but NOT rotated
    const barW = gridSize * 4;
    const barH = 6;
    const hpRatio = Math.max(0, e.hp / e.maxHp);
    const barY = -gridSize * 2 + hoverY; // Float above

    ctx.save();
    // No rotation here, just translate to boss pos
    // Note: We need to undo the rotation applied at start of function? 
    // Actually, ctx was restored at step 9. So we are back to entity center translation, but scaled?
    // No, renderEntities already translates to e.x, e.y.
    // The `ctx.scale` and `ctx.rotate` at the top of this function were inside a `ctx.save()`.
    // So we are currently at e.x, e.y, unrotated, unscaled.
    
    ctx.translate(0, barY);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-barW/2 - 2, -2, barW + 4, barH + 4, 2);
    ctx.fill();

    // Fill
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : (hpRatio > 0.2 ? '#ffff00' : '#ff0000');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, barW * hpRatio, barH, 1);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW/2, 0, barW, barH);
    
    ctx.restore();
};

const drawHullPath = (ctx: CanvasRenderingContext2D) => {
    // REORIENTED TO FACE RIGHT (+X)
    ctx.beginPath();
    // Nose Cone
    ctx.moveTo(55, 0);
    // Leading Edge Top
    ctx.lineTo(25, -20);
    // Wing Tip Top
    ctx.lineTo(0, -35);
    // Trailing Edge Top
    ctx.lineTo(-20, -15);
    // Engine Block Top
    ctx.lineTo(-50, -10);
    // Rear Center
    ctx.lineTo(-45, 0);
    // Engine Block Bottom
    ctx.lineTo(-50, 10);
    // Trailing Edge Bottom
    ctx.lineTo(-20, 15);
    // Wing Tip Bottom
    ctx.lineTo(0, 35);
    // Leading Edge Bottom
    ctx.lineTo(25, 20);
    ctx.closePath();
};
