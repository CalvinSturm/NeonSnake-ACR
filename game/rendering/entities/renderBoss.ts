
import { Enemy, Point } from '../../../types';
import { drawVolumetricThruster, drawShadow } from '../primitives';

export const renderBoss = (
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    now: number, 
    gridSize: number, 
    halfGrid: number, 
    snakeHead: Point | undefined,
    reduceFlashing: boolean = false // Added param
) => {
    const hpRatio = e.hp / e.maxHp;
    const isDamaged = hpRatio < 0.5;
    const phase = e.bossPhase || 1;

    // 1. Calculate Facing Direction
    let angle = 0;
    if (snakeHead) {
        // Grid coordinate difference is sufficient for angle
        angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
    }

    // 2. Hover Physics (2.5D Bobbing)
    // Slower, heavy hover
    const hoverY = Math.sin(now / 1000) * 8;
    
    // 3. Shake (Damage Feedback)
    const shakeIntensity = (1 - hpRatio) * 4;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    ctx.save();
    
    // Apply Shake globally to this entity context
    ctx.translate(shakeX, shakeY);

    // 4. Ground Shadow (Perspective: Below the hovering unit)
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(-10, 50); // 50px "below" (behind visual Z)
    
    // Elongated shadow for flying object
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 30, 0, 0, Math.PI * 2); 
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 5. Apply Body Transformation
    ctx.translate(0, hoverY); // Floating effect
    ctx.rotate(angle);

    // 6. Thrusters (Rear)
    ctx.save();
    ctx.translate(-35, 0); 
    
    // Main Engine (Pulsing)
    drawVolumetricThruster(ctx, 0, 0, 24, 70 + (phase * 15), '#ffaa00', now);
    
    // Vectoring Engines (Angle out slightly)
    ctx.save();
    ctx.rotate(-0.4);
    drawVolumetricThruster(ctx, 0, -25, 14, 45, '#ff5500', now, 100);
    ctx.restore();
    
    ctx.save();
    ctx.rotate(0.4);
    drawVolumetricThruster(ctx, 0, 25, 14, 45, '#ff5500', now, 200);
    ctx.restore();
    
    ctx.restore();

    // 7. Rotating Shield/Field Emitter (Under Hull)
    if (phase >= 2) {
        ctx.save();
        ctx.rotate(now / 500);
        ctx.strokeStyle = phase === 3 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 100, 0, 0.2)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 30]); 
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(now / -250); // Counter ring
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 8. Main Hull (2.5D Extrusion)
    const thickness = 8;
    
    // Hull Path Definition
    const defineHull = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(45, 0);    // Nose
        ctx.lineTo(10, 30);   // Wing Front R
        ctx.lineTo(-25, 40);  // Wing Tip R
        ctx.lineTo(-35, 15);  // Engine Bay R
        ctx.lineTo(-45, 0);   // Rear Center
        ctx.lineTo(-35, -15); // Engine Bay L
        ctx.lineTo(-25, -40); // Wing Tip L
        ctx.lineTo(10, -30);  // Wing Front L
        ctx.closePath();
    };

    // Lower Hull (Darker/Shadow)
    ctx.save();
    ctx.translate(0, thickness); // Shift "down"
    ctx.fillStyle = '#0f0505';
    defineHull(ctx);
    ctx.fill();
    ctx.restore();

    // Upper Hull (Main)
    const hullGrad = ctx.createLinearGradient(0, -40, 0, 40);
    hullGrad.addColorStop(0, '#592a2a');    // Top Light
    hullGrad.addColorStop(0.15, '#8c4b4b'); // Specular Ridge
    hullGrad.addColorStop(0.3, '#3d1212');  // Shadow under ridge
    hullGrad.addColorStop(0.8, '#260b0b');  // Deep shadow
    hullGrad.addColorStop(1, '#1a0505');    // Bottom Edge

    ctx.fillStyle = hullGrad;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    defineHull(ctx);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Panel Lines
    ctx.save();
    ctx.clip(); 
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 0); ctx.lineTo(-40, 0);
    ctx.moveTo(5, 20); ctx.lineTo(-20, 25);
    ctx.moveTo(5, -20); ctx.lineTo(-20, -25);
    ctx.moveTo(-30, 15); ctx.lineTo(-20, 0);
    ctx.moveTo(-30, -15); ctx.lineTo(-20, 0);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 2); ctx.lineTo(-40, 2); 
    ctx.moveTo(5, 22); ctx.lineTo(-20, 27);
    ctx.stroke();
    
    ctx.restore();

    // Outer Rim / Highlights
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5;
    defineHull(ctx);
    ctx.stroke();

    // Red Flash Overlay (Telegraph / Damage)
    if (e.flash && e.flash > 0 && !reduceFlashing) {
        ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
        ctx.globalCompositeOperation = 'source-atop';
        defineHull(ctx);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // 9. Weapon Mounts
    const weaponColor = e.attackTimer && e.attackTimer > 2000 
        ? `rgba(255, ${Math.floor(Math.sin(now/50)*127+128)}, 0, 1)` 
        : '#884400';
        
    ctx.fillStyle = weaponColor;
    ctx.fillRect(-10, -35, 20, 6);
    ctx.fillRect(-10, 29, 20, 6);

    // 10. The Core
    ctx.save();
    const coreColor = phase === 3 ? '#ff0000' : (phase === 2 ? '#ff6600' : '#ffaa00');
    const corePulse = 1 + Math.sin(now / 150) * 0.1;
    const coreSize = 12 * corePulse;
    
    ctx.translate(-5, 0);
    
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(coreSize * 0.3, -coreSize * 0.3, coreSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // 11. Damage / Smoke Effects
    if (isDamaged) {
        if (Math.random() < 0.2) {
            ctx.fillStyle = '#ffff00';
            const sx = (Math.random() - 0.5) * 50;
            const sy = (Math.random() - 0.5) * 50;
            ctx.fillRect(sx, sy, 2, 2);
        }
    }

    // 12. Floating HP Bar
    ctx.restore(); // Undo Body transform
    
    ctx.translate(0, hoverY);

    const barW = 80;
    const barY = -60;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-barW/2 - 2, barY - 2, barW + 4, 8, 2);
    ctx.fill();

    const fillW = barW * hpRatio;
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : (hpRatio > 0.2 ? '#ffff00' : '#ff0000');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.fillRect(-barW/2, barY, fillW, 4);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW/2, barY, barW, 4);
};
