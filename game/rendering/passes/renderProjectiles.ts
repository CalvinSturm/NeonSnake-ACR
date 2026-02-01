
import { RenderContext } from '../types';
import { Projectile } from '../../../types';

export const renderProjectiles = (rc: RenderContext, projectiles: Projectile[]) => {
    const { ctx, now } = rc;

    projectiles.forEach(p => {
        if (p.shouldRemove) return;
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            p.shouldRemove = true;
            return;
        }
        
        const vx = p.vx || 0;
        const vy = p.vy || 0;
        const angle = Math.atan2(vy, vx);
        const speed = Math.hypot(vx, vy);
        const age = p.age || 0;

        ctx.save();
        ctx.translate(p.x, p.y);

        ctx.save();
        ctx.translate(0, 15); 
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        const shadowLen = p.size + (speed * 0.4); 
        ctx.ellipse(0, 0, shadowLen, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.rotate(angle);

        if (p.type === 'LANCE') {
            const length = 60;
            ctx.globalCompositeOperation = 'screen';
            const coreGrad = ctx.createLinearGradient(-length/2, 0, length/2, 0);
            coreGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
            coreGrad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
            coreGrad.addColorStop(0.8, '#ffffff');
            coreGrad.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = coreGrad;
            ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.moveTo(length/2 + 5, 0); ctx.lineTo(-length/2, 1.5); ctx.lineTo(-length/2, -1.5); ctx.fill(); ctx.shadowBlur = 0;

            const strands = 3;
            const helixFreq = 0.4; 
            const helixAmp = 5;    
            const spinSpeed = now * 0.04;
            
            ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            for (let i = 0; i < strands; i++) {
                const phaseOffset = (i * Math.PI * 2) / strands;
                const hue = (now * 0.5 + i * (360/strands)) % 360;
                ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.9)`;
                ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 5;
                ctx.beginPath();
                for (let x = -length/2; x < length/2; x += 3) {
                    const taper = Math.min(1, (length/2 - Math.abs(x)) / 10);
                    const y = Math.sin(x * helixFreq + spinSpeed + phaseOffset) * helixAmp * taper;
                    if (x === -length/2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (p.type === 'SHARD') {
            const size = p.size * 1.8;
            ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(-size, size * 0.6); ctx.lineTo(-size * 0.4, 0); ctx.lineTo(-size, -size * 0.6); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.beginPath(); ctx.moveTo(size * 0.6, 0); ctx.lineTo(-size * 0.2, 2); ctx.lineTo(-size * 0.2, -2); ctx.fill();
        } else if (p.type === 'RAIL') {
            const length = 55;
            const width = p.size * 1.2;
            if (age < 6) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15 + age * 6, 0, Math.PI * 2); ctx.stroke(); }
            const grad = ctx.createLinearGradient(0, -width, 0, width);
            grad.addColorStop(0, p.color); grad.addColorStop(0.5, '#ffffff'); grad.addColorStop(1, p.color);
            ctx.fillStyle = grad; ctx.shadowColor = p.color; ctx.shadowBlur = 25; 
            ctx.fillRect(-length/2, -width/2, length, width);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.shadowBlur = 5;
            for(let i = -1; i <= 1; i++) { ctx.fillRect(i * 18, -width * 1.5, 3, width * 3); }
        } else if (p.type === 'SERPENT') {
            const idOffset = p.id ? p.id.charCodeAt(0) : 0;
            const wiggle = Math.sin((now * 0.015) + idOffset) * 4;
            ctx.translate(0, wiggle);
            const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, p.size);
            grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, p.color); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad; ctx.shadowColor = p.color; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 0; ctx.fillRect(2, -3, 2, 2); ctx.fillRect(2, 3, 2, 2);
        } else if (p.type === 'BOSS_PROJECTILE') {
            // Menacing red energy orb with pulsing core
            const pulseSize = p.size * (1 + Math.sin(now * 0.03) * 0.2);

            // Outer glow
            ctx.globalCompositeOperation = 'screen';
            const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize * 2);
            outerGrad.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
            outerGrad.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
            outerGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');
            ctx.fillStyle = outerGrad;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.globalCompositeOperation = 'source-over';
            const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.3, '#ff6666');
            coreGrad.addColorStop(0.7, '#ff0000');
            coreGrad.addColorStop(1, '#880000');
            ctx.fillStyle = coreGrad;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Inner spark
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(-pulseSize * 0.3, -pulseSize * 0.3, pulseSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const length = p.size * 5;
            const width = p.size * 1.2;
            const grad = ctx.createLinearGradient(-length, 0, length, 0);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)'); grad.addColorStop(0.5, p.color); grad.addColorStop(1, '#ffffff');
            ctx.fillStyle = grad; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.ellipse(0, 0, length/2, width/2, 0, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
};
