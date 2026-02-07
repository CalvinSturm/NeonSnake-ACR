/**
 * WebGL Projectile Renderer
 * 
 * Pre-renders projectile types to textures for batched sprite rendering.
 * Uses texture cache for color variants.
 */

import { Texture, Container, Graphics } from 'pixi.js';
import { SpritePool } from '../spritePool';
import { textureCache } from '../textures';
import type { Projectile } from '../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProjectileRenderState {
    pool: SpritePool | null;
    container: Container | null;
    baseTextures: Map<string, Texture>;
    isInitialized: boolean;
}

// Projectile type dimensions for texture generation
const PROJECTILE_SPECS: Record<string, { width: number; height: number }> = {
    DEFAULT: { width: 32, height: 16 },
    SHARD: { width: 32, height: 20 },
    RAIL: { width: 64, height: 24 },
    SERPENT: { width: 24, height: 24 },
    BOSS_PROJECTILE: { width: 48, height: 48 },
    LANCE: { width: 80, height: 24 }, // Complex - Canvas2D fallback recommended
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state: ProjectileRenderState = {
    pool: null,
    container: null,
    baseTextures: new Map(),
    isInitialized: false,
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the projectile renderer.
 */
export function initProjectileRenderer(parentContainer: Container): void {
    if (state.isInitialized) return;

    state.container = new Container();
    state.container.sortableChildren = false;
    parentContainer.addChild(state.container);

    // Create base white texture for tinting
    state.baseTextures.set('DEFAULT', Texture.WHITE);

    // Initialize pool with white texture
    state.pool = new SpritePool(state.container, Texture.WHITE);

    state.isInitialized = true;
}

/**
 * Get or generate texture for a projectile type and color.
 */
function getProjectileTexture(type: string, color: string, size: number): Texture {
    const key = `${type}:${color}:${size}`;

    // Check if we have a cached texture
    const cached = state.baseTextures.get(key);
    if (cached) return cached;

    // Get or use default specs
    const specs = PROJECTILE_SPECS[type] || PROJECTILE_SPECS.DEFAULT;
    const scale = size / 8; // Base size is 8
    const width = Math.ceil(specs.width * scale);
    const height = Math.ceil(specs.height * scale);

    // Generate texture using OffscreenCanvas
    const texture = textureCache.getOrCreate(
        { type: 'projectile', style: type, state: color },
        width,
        height,
        (ctx, w, h) => {
            drawProjectileToCanvas(ctx, type, color, size, w, h);
        }
    );

    state.baseTextures.set(key, texture);
    return texture;
}

/**
 * Draw a projectile to Canvas2D for texture generation.
 */
function drawProjectileToCanvas(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    type: string,
    color: string,
    size: number,
    width: number,
    height: number
): void {
    const cx = width / 2;
    const cy = height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    switch (type) {
        case 'SHARD': {
            const s = size * 1.8;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(s, 0);
            ctx.lineTo(-s, s * 0.6);
            ctx.lineTo(-s * 0.4, 0);
            ctx.lineTo(-s, -s * 0.6);
            ctx.closePath();
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(s * 0.6, 0);
            ctx.lineTo(-s * 0.2, 2);
            ctx.lineTo(-s * 0.2, -2);
            ctx.fill();
            break;
        }

        case 'RAIL': {
            const length = size * 6;
            const w = size * 1.2;

            const grad = ctx.createLinearGradient(0, -w, 0, w);
            grad.addColorStop(0, color);
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, color);

            ctx.fillStyle = grad;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillRect(-length / 2, -w / 2, length, w);

            // Center lines
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 3;
            for (let i = -1; i <= 1; i++) {
                ctx.fillRect(i * 18, -w * 1.5, 3, w * 3);
            }
            break;
        }

        case 'SERPENT': {
            const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, color);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.fillRect(2, -3, 2, 2);
            ctx.fillRect(2, 3, 2, 2);
            break;
        }

        case 'BOSS_PROJECTILE': {
            // Outer glow
            const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
            outerGrad.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
            outerGrad.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
            outerGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');

            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.3, '#ff6666');
            coreGrad.addColorStop(0.7, '#ff0000');
            coreGrad.addColorStop(1, '#880000');

            ctx.fillStyle = coreGrad;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            // Spark
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(-size * 0.3, -size * 0.3, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        default: {
            // Default ellipse projectile
            const length = size * 5;
            const w = size * 1.2;

            const grad = ctx.createLinearGradient(-length, 0, length, 0);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.5, color);
            grad.addColorStop(1, '#ffffff');

            ctx.fillStyle = grad;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(0, 0, length / 2, w / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
    }

    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render projectiles using WebGL.
 * Returns count of projectiles rendered; LANCE type should fall back to Canvas2D.
 */
export function renderProjectilesWebGL(projectiles: Projectile[]): { count: number; fallback: Projectile[] } {
    if (!state.pool || !state.isInitialized) {
        return { count: 0, fallback: projectiles };
    }

    state.pool.releaseAll();

    let count = 0;
    const fallback: Projectile[] = [];

    for (const p of projectiles) {
        if (p.shouldRemove) continue;
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;

        // LANCE has animated per-frame procedural effect - use Canvas2D
        if (p.type === 'LANCE') {
            fallback.push(p);
            continue;
        }

        const vx = p.vx || 0;
        const vy = p.vy || 0;
        const angle = Math.atan2(vy, vx);

        // Get or generate texture
        const texture = getProjectileTexture(p.type, p.color, p.size);

        // Acquire sprite from pool
        const pooled = state.pool.acquire(texture);
        const sprite = pooled.sprite;

        // Position and rotation
        sprite.x = p.x;
        sprite.y = p.y;
        sprite.rotation = angle;

        // Visibility
        sprite.visible = true;
        sprite.alpha = 1;

        count++;
    }

    return { count, fallback };
}

/**
 * Get projectile renderer statistics.
 */
export function getProjectileStats(): { total: number; active: number } {
    if (!state.pool) {
        return { total: 0, active: 0 };
    }
    const stats = state.pool.getStats();
    return { total: stats.total, active: stats.active };
}

/**
 * Clean up projectile renderer resources.
 */
export function destroyProjectileRenderer(): void {
    if (state.pool) {
        state.pool.destroy();
        state.pool = null;
    }
    if (state.container) {
        state.container.destroy({ children: true });
        state.container = null;
    }
    state.baseTextures.clear();
    state.isInitialized = false;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Invalidate cached textures (call when visual style changes).
 */
export function invalidateProjectileTextures(): void {
    state.baseTextures.clear();
    textureCache.invalidate('projectile');
}
