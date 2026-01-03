
import { RenderContext } from '../types';
import { Shockwave, LightningArc, Particle, FloatingText, DigitalRainDrop } from '../../../types';

export const renderFX = (
    rc: RenderContext, 
    shockwaves: Shockwave[],
    lightningArcs: LightningArc[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    digitalRain: DigitalRainDrop[],
    chromaticAberration: number
) => {
    const { ctx } = rc;

    // Digital Rain (Draw first to be behind other FX)
    if (digitalRain.length > 0) {
        ctx.save();
        // Note: Ideally this should be screen-space, but we are inside camera transform.
        // For now, we render in world space which creates a "matrix in the world" effect.
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        digitalRain.forEach(d => {
            ctx.fillStyle = `rgba(0, 255, 0, ${d.opacity})`;
            ctx.fillText(d.chars, d.x, d.y);
        });
        ctx.restore();
    }

    // Shockwaves
    shockwaves.forEach(s => {
        if (s.shouldRemove) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Distortion ring? (Simulated via color)
        ctx.strokeStyle = `rgba(0, 255, 255, ${s.opacity * 0.5})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, s.currentRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });

    // Lightning
    lightningArcs.forEach(l => {
        if (l.shouldRemove) return;
        ctx.save();
        ctx.strokeStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.globalAlpha = l.life; // Fade out
        
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        
        // Zigzag interpolation
        const dist = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
        const steps = Math.floor(dist / 20);
        const dx = (l.x2 - l.x1) / steps;
        const dy = (l.y2 - l.y1) / steps;
        
        for(let i=1; i<steps; i++) {
             const jx = (Math.random() - 0.5) * 20;
             const jy = (Math.random() - 0.5) * 20;
             ctx.lineTo(l.x1 + dx*i + jx, l.y1 + dy*i + jy);
        }
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.restore();
    });

    // Particles
    particles.forEach(p => {
        if (p.shouldRemove) return;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
    });

    // Floating Text
    floatingTexts.forEach(t => {
        if (t.shouldRemove) return;
        ctx.save();
        ctx.translate(t.x, t.y);
        // Pop up scaling
        const scale = t.life > 0.8 ? (1 - t.life) * 5 : 1.0; 
        
        ctx.font = `bold ${t.size}px monospace`;
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(t.text, 0, 0);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });

    // Chromatic Aberration (Stub for now, as strict post-processing is expensive in canvas 2d without layers)
    if (chromaticAberration > 0.05) {
         // Logic reserved for future layer composition
    }
};
