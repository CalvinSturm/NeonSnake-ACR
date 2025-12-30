
import { Enemy, Point } from '../../../types';
import { drawVolumetricThruster, drawShadow } from '../primitives';

export const renderBoss = (
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    now: number, 
    gridSize: number, 
    halfGrid: number, 
    snakeHead: Point | undefined
) => {
    // ─── STATE ANALYSIS ───
    const hpRatio = e.hp / e.maxHp;
    const isDamaged = hpRatio < 0.5;
    const stateId = e.bossState?.stateId || 'IDLE';
    const isTelegraph = stateId.includes('TELEGRAPH');
    const isAttack = stateId.includes('EXECUTE');
    const isRecover = stateId.includes('RECOVERY');
    
    // Facing logic (Standard Boss follows player X)
    let facing = 1;
    if (snakeHead) {
        facing = snakeHead.x < e.x ? -1 : 1;
    }

    // ─── PHYSICS & ANIMATION ───
    // Hover sine wave
    const hoverY = Math.sin(now / 800) * 5;
    
    // Attack displacements
    let attackY = 0;
    let attackRot = 0;

    if (isTelegraph) {
        // Tilt up slightly, charging
        attackRot = -0.1 * facing;
        attackY = -5; // Rise up
    } else if (isAttack) {
        // Slam down / Recoil from shot
        attackY = 5;
        attackRot = 0.05 * facing;
    }

    // Shake on damage
    const shakeAmt = isDamaged ? 2 : 0;
    const sx = (Math.random() - 0.5) * shakeAmt;
    const sy = (Math.random() - 0.5) * shakeAmt;

    ctx.save();
    ctx.translate(sx, sy);

    // 1. SHADOW (Ground Plane)
    ctx.save();
    ctx.translate(0, 60); // Distance to ground
    ctx.scale(1, 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    // Shadow grows during attack (getting closer to ground/larger flare)
    const shadowSize = isAttack ? 70 : 50;
    ctx.arc(0, 0, shadowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. SHIP TRANSFORM
    ctx.translate(0, hoverY + attackY);
    ctx.scale(facing * 1.5, 1.5); // Face direction, scale up 1.5x
    ctx.rotate(attackRot);

    // 3. THRUSTERS
    // Rear Main Engine
    drawVolumetricThruster(ctx, -35, 0, 20, 60, '#00ffff', now);
    
    // Ventral Thrusters (For "Slam" attack)
    if (isTelegraph || isAttack) {
        const power = isAttack ? 80 : 30; // Length
        const width = isAttack ? 15 : 5;
        const color = isAttack ? '#ff0000' : '#ffaa00';
        
        // Front Ventral
        ctx.save();
        ctx.translate(20, 10);
        ctx.rotate(Math.PI / 2); // Point down
        drawVolumetricThruster(ctx, 0, 0, width, power, color, now);
        ctx.restore();

        // Rear Ventral
        ctx.save();
        ctx.translate(-20, 10);
        ctx.rotate(Math.PI / 2);
        drawVolumetricThruster(ctx, 0, 0, width, power, color, now, 100);
        ctx.restore();
    }

    // 4. HULL GEOMETRY (The "Interceptor Capital" look)
    // Drawn facing Right (Positive X)
    
    // Bottom plating (Darker)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(40, 5);
    ctx.lineTo(-20, 15);
    ctx.lineTo(-40, 5);
    ctx.lineTo(-40, -5);
    ctx.fill();

    // Top plating (Main color)
    const hullGrad = ctx.createLinearGradient(-40, -20, 20, 20);
    hullGrad.addColorStop(0, '#1a1a2e');
    hullGrad.addColorStop(0.5, '#202040');
    hullGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = hullGrad;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(50, 5);    // Nose tip (low)
    ctx.lineTo(30, -10);  // Nose bridge
    ctx.lineTo(0, -20);   // Cockpit start
    ctx.lineTo(-30, -25); // Top Fin start
    ctx.lineTo(-45, -15); // Rear Top
    ctx.lineTo(-50, 0);   // Engine block center
    ctx.lineTo(-40, 15);  // Rear Bottom
    ctx.lineTo(-10, 10);  // Belly
    ctx.lineTo(50, 5);    // Return to nose
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. DETAILS & HIGHLIGHTS
    
    // Panel Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, -15); ctx.lineTo(10, 5);
    ctx.moveTo(-10, -22); ctx.lineTo(-15, 10);
    ctx.moveTo(-30, -25); ctx.lineTo(-30, 0);
    ctx.stroke();

    // Neon Trim (Changes color based on state)
    const neonColor = isAttack ? '#ff0000' : (isTelegraph ? '#ffaa00' : '#00ffff');
    
    ctx.strokeStyle = neonColor;
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    
    // Wing/Side Stripe
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(40, 0);
    ctx.stroke();
    
    // Cockpit
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(20, -12);
    ctx.lineTo(22, -8);
    ctx.lineTo(5, -10);
    ctx.fill();
    
    // Cockpit Glint
    ctx.fillStyle = neonColor;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(8, -13, 8, 2);
    ctx.globalAlpha = 1.0;

    // 6. DAMAGE SMOKE
    if (isDamaged) {
        const smokeX = -10 + Math.sin(now * 0.01) * 10;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(smokeX, -10, 5 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 7. HEAT VENTING (Recovery State)
    if (isRecover) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        for(let i=0; i<3; i++) {
            const vy = -10 - (now * 0.1 + i * 10) % 20;
            ctx.beginPath();
            ctx.arc(-20 + i*10, vy, 4, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 8. HP BAR (Floating above)
    ctx.restore(); // Reset ship transform
    
    // Draw Bar relative to boss center
    const barW = 60;
    const barY = -50 + hoverY; // Bob with ship
    
    ctx.fillStyle = '#000';
    ctx.fillRect(-barW/2 - 1, barY - 1, barW + 2, 6);
    
    ctx.fillStyle = hpRatio < 0.3 ? '#ff0000' : '#00ffff';
    ctx.fillRect(-barW/2, barY, barW * hpRatio, 4);

    ctx.restore();
};
