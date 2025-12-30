
import { RenderContext } from '../types';
import { Shockwave, LightningArc, Particle, FloatingText, DigitalRainDrop, CLIAnimation } from '../../../types';
import { DEFAULT_SETTINGS } from '../../../constants';

export const renderFX = (
    rc: RenderContext, 
    shockwaves: Shockwave[],
    lightningArcs: LightningArc[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    digitalRain: DigitalRainDrop[],
    chromaticAberration: number
) => {
    const { ctx, gridSize } = rc;

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
        
        ctx.font = `bold ${t.size}px monospace`;
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(t.text, 0, 0);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });
    
    // Digital Rain (Overlay)
    digitalRain.forEach(d => {
        ctx.fillStyle = `rgba(0, 255, 0, ${d.opacity})`;
        ctx.font = `${d.size}px monospace`;
        ctx.fillText(d.chars, d.x, d.y);
    });
};

// Updated CLI Renderer
export const renderCLIAnimations = (rc: RenderContext, animations: CLIAnimation[]) => {
    const { ctx } = rc;
    
    animations.forEach(anim => {
        if (anim.shouldRemove) return;
        
        const x = anim.x * DEFAULT_SETTINGS.gridSize;
        const y = anim.y * DEFAULT_SETTINGS.gridSize;
        
        ctx.save();
        ctx.translate(x, y - 60); // Float above terminal
        
        // Background Box (Semi-transparent black)
        // Fixed width, auto height based on lines
        const width = 180;
        const halfW = width / 2;
        const lineHeight = 12;
        const padding = 10;
        const boxH = padding * 2 + (anim.lines.length * lineHeight);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 1;
        
        // Scale Pulse on Payout (Phase 3 for Resource, Phase 3/4 for Memory)
        // Only apply pulse if we are in the "Confirm" phase and just started it
        let scale = 1.0;
        if (anim.phase === 3 && anim.timer < 100) {
             scale = 1.1; // Dopamine pop
        }
        ctx.scale(scale, scale);

        ctx.fillRect(-halfW, -boxH, width, boxH);
        ctx.strokeRect(-halfW, -boxH, width, boxH);
        
        // Text Rendering
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = anim.color;
        
        anim.lines.forEach((line: string, i: number) => {
            const isLast = i === anim.lines.length - 1;
            const alpha = isLast ? 1.0 : 0.7;
            
            // Highlight Success lines
            if (line.includes('✔')) {
                ctx.fillStyle = '#fff'; // White hot
                ctx.shadowColor = anim.color;
                ctx.shadowBlur = 5;
            } else {
                ctx.fillStyle = anim.color;
                ctx.shadowBlur = 0;
            }
            
            ctx.globalAlpha = alpha;
            // Left padding inside the box
            const tx = -halfW + 8;
            const ty = -boxH + padding + (i * lineHeight);
            
            ctx.fillText(line, tx, ty);
        });
        
        ctx.restore();
    });
};
