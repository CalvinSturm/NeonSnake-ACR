
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
    const stateId = e.bossState?.stateId || 'IDLE';
    const isCharging = stateId === 'CHARGE_CANNON';
    const isFiring = stateId === 'FIRE_CANNON';
    const isCooldown = stateId === 'COOLDOWN';

    const hoverY = Math.sin(now / 1200) * 4;
    const roll = Math.sin(now / 1800) * 0.03; 
    const scale = 2.0;

    let angle = e.angle;
    if (angle === undefined) {
        if (snakeHead) {
            angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
        } else {
            angle = Math.PI; 
        }
    }

    ctx.save();
    ctx.translate(0, 60); 
    ctx.scale(1.2 * scale, 0.4 * scale);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const altitude = 40;
    ctx.save();
    ctx.translate(0, -altitude); 
    ctx.translate(0, hoverY); 
    
    ctx.scale(scale, scale);
    ctx.rotate(angle + roll);

    const pulse = Math.sin(now / 80) * 0.15 + 0.85;
    drawVolumetricThruster(ctx, -45, -10, 14, 55 * pulse, '#00ffff', now);
    drawVolumetricThruster(ctx, -45, 10, 14, 55 * pulse, '#00ffff', now, 100);
    drawVolumetricThruster(ctx, -30, -28, 6, 20, '#0088ff', now, 200);
    drawVolumetricThruster(ctx, -30, 28, 6, 20, '#0088ff', now, 300);

    const depth = 6;
    ctx.save();
    ctx.translate(0, depth);
    ctx.fillStyle = '#050510'; 
    ctx.shadowColor = 'rgba(0, 255, 255, 0.1)'; ctx.shadowBlur = 5;
    drawHullPath(ctx);
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(0, -10); ctx.moveTo(-10, 10); ctx.lineTo(0, 10); ctx.stroke();
    ctx.restore();

    const hullGrad = ctx.createLinearGradient(40, -30, -40, 40);
    hullGrad.addColorStop(0, '#2e3045'); hullGrad.addColorStop(0.4, '#1b1b2a'); hullGrad.addColorStop(1, '#0e0e15');
    ctx.fillStyle = hullGrad;
    if (isCharging) { ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15; } 
    else if (isCooldown) { ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10; } 
    else { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; }
    drawHullPath(ctx); ctx.fill(); ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(5, -10); ctx.moveTo(-15, 15); ctx.lineTo(5, 10); ctx.moveTo(-35, -20); ctx.lineTo(-35, 20); ctx.stroke();

    ctx.save(); ctx.translate(2, -4);
    ctx.fillStyle = '#151520';
    ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(0, -8); ctx.lineTo(-40, -5); ctx.lineTo(-40, 5); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
    const glassColor = isCharging ? '#ff00ff' : (isCooldown ? '#ff4400' : '#00ffff');
    ctx.fillStyle = glassColor; ctx.shadowColor = glassColor; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(10, -4); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 0; ctx.fillRect(15, -1, 4, 2);
    ctx.restore();

    ctx.fillStyle = '#000'; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-35, -15); ctx.lineTo(-35, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(-35, 15); ctx.lineTo(-35, 8); ctx.fill();
    ctx.globalAlpha = 1.0;

    if (isCharging) {
        const chargeTime = now / 50;
        const radius = 5 + (Math.sin(chargeTime) + 1) * 3;
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.4 + Math.sin(now/100) * 0.2})`;
        ctx.lineWidth = 1; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(55, 0); ctx.lineTo(1200, 0); ctx.stroke(); ctx.setLineDash([]);

        ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(chargeTime)*0.2})`;
        for(let i=0; i<3; i++) {
            const ang = chargeTime + (i * 2.09);
            const dist = 15 - (Math.sin(chargeTime) * 5);
            ctx.beginPath(); ctx.arc(55 + Math.cos(ang)*dist, Math.sin(ang)*dist, 2, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(55, 0, radius, 0, Math.PI*2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    if (isFiring) {
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(60, 0, 15, 0, Math.PI*2); ctx.fill();
        const beamGrad = ctx.createLinearGradient(0, -8, 0, 8);
        beamGrad.addColorStop(0, 'rgba(255,0,255,0)'); beamGrad.addColorStop(0.3, '#ff00ff'); beamGrad.addColorStop(0.5, '#ffffff'); beamGrad.addColorStop(0.7, '#ff00ff'); beamGrad.addColorStop(1, 'rgba(255,0,255,0)');
        ctx.fillStyle = beamGrad; ctx.fillRect(55, -8, 1200, 16);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(80, 0, 5, 20, 0, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
    }

    if (e.hp / e.maxHp < 0.4 && Math.random() > 0.5) {
        ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = '#ff0000'; ctx.globalAlpha = 0.3;
        drawHullPath(ctx); ctx.fill(); ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore(); 

    const barW = gridSize * 4;
    const barH = 6;
    const hpRatio = Math.max(0, e.hp / e.maxHp);
    const barY = -altitude - 60; 

    ctx.save();
    ctx.translate(0, barY);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath(); ctx.roundRect(-barW/2 - 2, -2, barW + 4, barH + 4, 2); ctx.fill();

    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : '#ff0000';
    ctx.fillRect(-barW/2, 0, barW * hpRatio, barH);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(-barW/2, 0, barW, barH);
    ctx.restore();
};

const drawHullPath = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(55, 0); ctx.lineTo(25, -20); ctx.lineTo(0, -35); ctx.lineTo(-20, -15);
    ctx.lineTo(-50, -10); ctx.lineTo(-45, 0); ctx.lineTo(-50, 10); ctx.lineTo(-20, 15);
    ctx.lineTo(0, 35); ctx.lineTo(25, 20);
    ctx.closePath();
};
