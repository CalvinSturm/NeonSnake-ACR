/**
 * Render FX Pass
 * 
 * Handles particles, shockwaves, lightning, floating text, and digital rain.
 * Now supports dual-mode Canvas2D/WebGL rendering.
 */

import { RenderContext } from '../types';
import { Shockwave, LightningArc, Particle, FloatingText, DigitalRainDrop } from '../../../types';
import { isWebGLReady, renderParticles as renderParticlesWebGL } from '../../../graphics';

/**
 * Render all FX effects.
 * Uses WebGL for particles when available, Canvas2D for everything else.
 */
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

    // ─────────────────────────────────────────────────────────────
    // DIGITAL RAIN (Draw first to be behind other FX)
    // ─────────────────────────────────────────────────────────────
    if (digitalRain.length > 0) {
        ctx.save();
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        for (const d of digitalRain) {
            ctx.fillStyle = `rgba(0, 255, 0, ${d.opacity})`;
            ctx.fillText(d.chars, d.x, d.y);
        }
        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // SHOCKWAVES (Canvas2D - complex gradients)
    // ─────────────────────────────────────────────────────────────
    for (const s of shockwaves) {
        if (s.shouldRemove) continue;
        ctx.save();
        ctx.translate(s.x, s.y);

        // Outer ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner distortion ring
        ctx.strokeStyle = `rgba(0, 255, 255, ${s.opacity * 0.5})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, s.currentRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // LIGHTNING (Canvas2D - procedural geometry per frame)
    // ─────────────────────────────────────────────────────────────
    for (const l of lightningArcs) {
        if (l.shouldRemove) continue;
        ctx.save();
        ctx.strokeStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.globalAlpha = l.life;

        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);

        // Zigzag interpolation
        const dist = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
        const steps = Math.max(1, Math.floor(dist / 20));
        const dx = (l.x2 - l.x1) / steps;
        const dy = (l.y2 - l.y1) / steps;

        for (let i = 1; i < steps; i++) {
            const jx = (Math.random() - 0.5) * 20;
            const jy = (Math.random() - 0.5) * 20;
            ctx.lineTo(l.x1 + dx * i + jx, l.y1 + dy * i + jy);
        }
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // PARTICLES (WebGL when available, Canvas2D fallback)
    // ─────────────────────────────────────────────────────────────
    const webglUsed = isWebGLReady() && renderParticlesWebGL(particles);

    if (!webglUsed) {
        // Canvas2D fallback
        for (const p of particles) {
            if (p.shouldRemove) continue;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life);
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;
    }

    // ─────────────────────────────────────────────────────────────
    // FLOATING TEXT (Canvas2D - text rendering)
    // ─────────────────────────────────────────────────────────────
    for (const t of floatingTexts) {
        if (t.shouldRemove) continue;
        ctx.save();
        ctx.translate(t.x, t.y);

        ctx.font = `bold ${t.size}px monospace`;
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(t.text, 0, 0);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // CHROMATIC ABERRATION (Future: WebGL post-processing)
    // ─────────────────────────────────────────────────────────────
    if (chromaticAberration > 0.05) {
        // Reserved for future WebGL shader implementation
    }
};
