
import { Enemy, Point } from '../../../types';
import { drawVolumetricThruster, drawShadow } from '../primitives';

export const renderBoss = (
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    now: number, 
    gridSize: number, 
    halfGrid: number, 
    snakeHead: Point | undefined,
    reduceFlashing: boolean = false
) => {
    const hpRatio = e.hp / e.maxHp;
    const isDamaged = hpRatio < 0.5;
    const phase = e.bossPhase || 1;

    let angle = 0;
    if (snakeHead) {
        angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
    }

    const hoverY = Math.sin(now / 1000) * 8;
    
    const shakeIntensity = (1 - hpRatio) * 4;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.save();
    ctx.rotate(angle);
    ctx.translate(-10, 50);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 30, 0, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(0, hoverY);
    ctx.rotate(angle);

    ctx.save();
    ctx.translate(-35, 0); 
    drawVolumetricThruster(ctx, 0, 0, 24, 70 + (phase * 15), '#ffaa00', now);
    
    ctx.save(); ctx.rotate(-0.4); drawVolumetricThruster(ctx, 0, -25, 14, 45, '#ff5500', now, 100); ctx.restore();
    ctx.save(); ctx.rotate(0.4); drawVolumetricThruster(ctx, 0, 25, 14, 45, '#ff5500', now, 200); ctx.restore();
    ctx.restore();

    if (phase >= 2) {
        ctx.save();
        ctx.rotate(now / 500);
        ctx.strokeStyle = phase === 3 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 100, 0, 0.2)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 30]); 
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(now / -250); 
        ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    const thickness = 8;
    const defineHull = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(45, 0); ctx.lineTo(10, 30); ctx.lineTo(-25, 40); ctx.lineTo(-35, 15);
        ctx.lineTo(-45, 0); ctx.lineTo(-35, -15); ctx.lineTo(-25, -40); ctx.lineTo(10, -30);
        ctx.closePath();
    };

    ctx.save();
    ctx.translate(0, thickness); 
    ctx.fillStyle = '#0f0505'; defineHull(ctx); ctx.fill();
    ctx.restore();

    const hullGrad = ctx.createLinearGradient(0, -40, 0, 40);
    hullGrad.addColorStop(0, '#592a2a'); hullGrad.addColorStop(0.15, '#8c4b4b');
    hullGrad.addColorStop(0.3, '#3d1212'); hullGrad.addColorStop(0.8, '#260b0b'); hullGrad.addColorStop(1, '#1a0505');

    ctx.fillStyle = hullGrad;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    defineHull(ctx);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.clip(); 
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 0); ctx.lineTo(-40, 0);
    ctx.moveTo(5, 20); ctx.lineTo(-20, 25);
    ctx.moveTo(5, -20); ctx.lineTo(-20, -25);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(35, 2); ctx.lineTo(-40, 2); ctx.moveTo(5, 22); ctx.lineTo(-20, 27); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1.5; defineHull(ctx); ctx.stroke();

    if (e.flash && e.flash > 0 && !reduceFlashing) {
        ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
        ctx.globalCompositeOperation = 'source-atop';
        defineHull(ctx); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    const weaponColor = e.attackTimer && e.attackTimer > 2000 ? `rgba(255, ${Math.floor(Math.sin(now/50)*127+128)}, 0, 1)` : '#884400';
    ctx.fillStyle = weaponColor;
    ctx.fillRect(-10, -35, 20, 6);
    ctx.fillRect(-10, 29, 20, 6);

    ctx.save();
    const coreColor = phase === 3 ? '#ff0000' : (phase === 2 ? '#ff6600' : '#ffaa00');
    const corePulse = 1 + Math.sin(now / 150) * 0.1;
    const coreSize = 12 * corePulse;
    ctx.translate(-5, 0);
    ctx.shadowColor = coreColor; ctx.shadowBlur = 20; ctx.fillStyle = coreColor;
    ctx.beginPath(); ctx.arc(0, 0, coreSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(coreSize * 0.3, -coreSize * 0.3, coreSize * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (isDamaged && Math.random() < 0.2) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 2, 2);
    }
    
    ctx.restore(); 

    ctx.save();
    ctx.translate(0, hoverY);

    const barW = 80;
    const barY = -60;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath(); ctx.roundRect(-barW/2 - 2, barY - 2, barW + 4, 8, 2); ctx.fill();

    const fillW = barW * hpRatio;
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : (hpRatio > 0.2 ? '#ffff00' : '#ff0000');
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
    ctx.fillRect(-barW/2, barY, fillW, 4);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(-barW/2, barY, barW, 4);
    ctx.restore();
    
    ctx.restore();
};
