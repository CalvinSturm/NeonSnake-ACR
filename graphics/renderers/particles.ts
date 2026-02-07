/**
 * WebGL Particle Renderer
 * 
 * First migration target: simple quad particles.
 * Uses sprite batching for efficient rendering.
 */

import { Texture, Container, Sprite, Graphics } from 'pixi.js';
import { SpritePool } from '../spritePool';
import type { Particle } from '../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ParticleRenderState {
    pool: SpritePool | null;
    container: Container | null;
    baseTexture: Texture | null;
    isInitialized: boolean;
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE RENDERER
// ═══════════════════════════════════════════════════════════════

const state: ParticleRenderState = {
    pool: null,
    container: null,
    baseTexture: null,
    isInitialized: false,
};

/**
 * Initialize the particle renderer.
 * Call once when WebGL renderer is ready.
 */
export function initParticleRenderer(parentContainer: Container): void {
    if (state.isInitialized) return;

    // Create dedicated container for particles
    state.container = new Container();
    state.container.sortableChildren = false; // Particles don't need z-sorting
    parentContainer.addChild(state.container);

    // Create a simple white 4x4 texture for particles
    const gfx = new Graphics();
    gfx.rect(-2, -2, 4, 4);
    gfx.fill(0xffffff);

    // Generate texture from graphics
    // Note: In Pixi v8, we need the renderer to generate the texture
    // For now, use a simple white texture
    state.baseTexture = Texture.WHITE;

    // Initialize pool
    state.pool = new SpritePool(state.container, state.baseTexture);

    state.isInitialized = true;
}

/**
 * Render particles using WebGL sprite batching.
 * Call each frame with the current particle array.
 */
export function renderParticlesWebGL(particles: Particle[]): number {
    if (!state.pool || !state.isInitialized) {
        return 0;
    }

    // Release all sprites from previous frame
    state.pool.releaseAll();

    let count = 0;

    for (const p of particles) {
        if (p.shouldRemove) continue;

        // Acquire sprite from pool
        const pooled = state.pool.acquire();
        const sprite = pooled.sprite;

        // Set position
        sprite.x = p.x;
        sprite.y = p.y;

        // Set alpha based on particle life
        sprite.alpha = Math.min(1, p.life);

        // Set tint from particle color (convert CSS color to number)
        sprite.tint = cssColorToHex(p.color);

        // Scale for particle size (base texture is 4x4, Canvas2D uses 3x3)
        const particleSize = 3;
        const scale = particleSize / 4;
        sprite.scale.set(scale, scale);

        count++;
    }

    return count;
}

/**
 * Get particle renderer statistics.
 */
export function getParticleStats(): { total: number; active: number } {
    if (!state.pool) {
        return { total: 0, active: 0 };
    }
    const stats = state.pool.getStats();
    return { total: stats.total, active: stats.active };
}

/**
 * Clean up particle renderer resources.
 */
export function destroyParticleRenderer(): void {
    if (state.pool) {
        state.pool.destroy();
        state.pool = null;
    }
    if (state.container) {
        state.container.destroy({ children: true });
        state.container = null;
    }
    state.baseTexture = null;
    state.isInitialized = false;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Convert CSS color string to hex number.
 * Supports: #rgb, #rrggbb, rgb(), rgba()
 */
function cssColorToHex(color: string): number {
    if (!color) return 0xffffff;

    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            // #rgb -> #rrggbb
            const r = hex[0];
            const g = hex[1];
            const b = hex[2];
            return parseInt(r + r + g + g + b + b, 16);
        }
        return parseInt(hex.slice(0, 6), 16);
    }

    // Handle rgb/rgba
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return (r << 16) | (g << 8) | b;
    }

    // Handle hsla (common in current renderers)
    const hslaMatch = color.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?/);
    if (hslaMatch) {
        const h = parseInt(hslaMatch[1], 10);
        const s = parseInt(hslaMatch[2], 10) / 100;
        const l = parseInt(hslaMatch[3], 10) / 100;
        return hslToHex(h, s, l);
    }

    // Named colors fallback
    const namedColors: Record<string, number> = {
        white: 0xffffff,
        red: 0xff0000,
        green: 0x00ff00,
        blue: 0x0000ff,
        yellow: 0xffff00,
        cyan: 0x00ffff,
        magenta: 0xff00ff,
        orange: 0xff8800,
    };

    return namedColors[color.toLowerCase()] ?? 0xffffff;
}

/**
 * Convert HSL to hex number.
 */
function hslToHex(h: number, s: number, l: number): number {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    const ri = Math.round((r + m) * 255);
    const gi = Math.round((g + m) * 255);
    const bi = Math.round((b + m) * 255);

    return (ri << 16) | (gi << 8) | bi;
}
