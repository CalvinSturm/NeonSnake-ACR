/**
 * WebGL Entity Renderer
 * 
 * Renders static entities (mines, food, XP orbs) using batched sprites.
 * Animated entities (enemies, snake, bosses) remain in Canvas2D due to
 * complex per-frame procedural effects.
 */

import { Texture, Container, Graphics, Sprite } from 'pixi.js';
import { SpritePool } from '../spritePool';
import { textureCache } from '../textures';
import type { Mine, FoodItem, FoodType, Terminal } from '../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface EntityRenderState {
    pool: SpritePool | null;
    container: Container | null;
    isInitialized: boolean;
    gridSize: number;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state: EntityRenderState = {
    pool: null,
    container: null,
    isInitialized: false,
    gridSize: 24,
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the entity renderer.
 */
export function initEntityRenderer(parentContainer: Container, gridSize: number = 24): void {
    if (state.isInitialized) return;

    state.gridSize = gridSize;
    state.container = new Container();
    state.container.sortableChildren = true; // Y-sorting
    parentContainer.addChild(state.container);

    // Initialize pool with white texture
    state.pool = new SpritePool(state.container, Texture.WHITE);

    state.isInitialized = true;
}

// ═══════════════════════════════════════════════════════════════
// TEXTURE GENERATION
// ═══════════════════════════════════════════════════════════════

function getMineTexture(): Texture {
    return textureCache.getOrCreate(
        { type: 'entity', style: 'mine', state: 'default' },
        32, 32,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Orange cross
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff7700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(6, 6);
            ctx.moveTo(6, -6);
            ctx.lineTo(-6, 6);
            ctx.stroke();

            // Center sphere
            const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 4);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#ffaa00');
            grad.addColorStop(1, '#aa5500');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    );
}

function getFoodTexture(): Texture {
    return textureCache.getOrCreate(
        { type: 'entity', style: 'food', state: 'default' },
        24, 24,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Glowing cube
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillRect(-5, -5, 10, 10);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(-5, -5, 10, 3);

            ctx.restore();
        }
    );
}

function getXpOrbTexture(): Texture {
    return textureCache.getOrCreate(
        { type: 'entity', style: 'xp_orb', state: 'default' },
        16, 16,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Outer glow
            ctx.fillStyle = '#00ff00';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

export interface EntityRenderResult {
    mineCount: number;
    foodCount: number;
    xpOrbCount: number;
    total: number;
}

/**
 * Render static entities using WebGL.
 */
export function renderEntitiesWebGL(
    mines: Mine[],
    food: FoodItem[],
    now: number
): EntityRenderResult {
    if (!state.pool || !state.isInitialized) {
        return { mineCount: 0, foodCount: 0, xpOrbCount: 0, total: 0 };
    }

    state.pool.releaseAll();

    const gridSize = state.gridSize;
    const halfGrid = gridSize / 2;
    const result: EntityRenderResult = { mineCount: 0, foodCount: 0, xpOrbCount: 0, total: 0 };

    // Render mines
    const mineTexture = getMineTexture();
    for (const m of mines) {
        if (m.shouldRemove) continue;

        const cx = m.x * gridSize + halfGrid;
        const cy = m.y * gridSize + halfGrid;

        const pooled = state.pool.acquire(mineTexture);
        const sprite = pooled.sprite;

        sprite.x = cx;
        sprite.y = cy;
        sprite.zIndex = m.y;

        // Animate rotation
        sprite.rotation = now / 300;

        // Hover animation
        sprite.y += Math.sin(now / 300) * 2;

        result.mineCount++;
    }

    // Render food and XP orbs
    const foodTexture = getFoodTexture();
    const xpOrbTexture = getXpOrbTexture();

    for (const f of food) {
        if (f.shouldRemove) continue;

        const cx = f.x * gridSize + halfGrid;
        const cy = f.y * gridSize + halfGrid;
        const isXpOrb = (f as any).type === 'XP_ORB';

        const pooled = state.pool.acquire(isXpOrb ? xpOrbTexture : foodTexture);
        const sprite = pooled.sprite;

        sprite.x = cx;
        sprite.y = cy + Math.sin((now / 200) + (f.x * 0.5)) * (isXpOrb ? 4 : 3);
        sprite.zIndex = f.y;

        if (!isXpOrb) {
            sprite.rotation = now / 400 + (f.x * 0.2);
        }

        if (isXpOrb) {
            result.xpOrbCount++;
        } else {
            result.foodCount++;
        }
    }

    result.total = result.mineCount + result.foodCount + result.xpOrbCount;
    return result;
}

/**
 * Get entity renderer statistics.
 */
export function getEntityStats(): { total: number; active: number } {
    if (!state.pool) {
        return { total: 0, active: 0 };
    }
    const stats = state.pool.getStats();
    return { total: stats.total, active: stats.active };
}

/**
 * Clean up entity renderer resources.
 */
export function destroyEntityRenderer(): void {
    if (state.pool) {
        state.pool.destroy();
        state.pool = null;
    }
    if (state.container) {
        state.container.destroy({ children: true });
        state.container = null;
    }
    state.isInitialized = false;
}

/**
 * Update grid size for entity positioning.
 */
export function setEntityGridSize(gridSize: number): void {
    state.gridSize = gridSize;
}

/**
 * Invalidate cached texture.
 */
export function invalidateEntityTextures(): void {
    textureCache.invalidate('entity');
}
