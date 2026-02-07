/**
 * BinarySnapshotRenderer
 * 
 * Zero-allocation PixiJS renderer that reads directly from BinarySnapshotReader.
 * No intermediate object creation - reads values straight from TypedArrays.
 * 
 * This eliminates:
 * - SimulationSnapshot object allocation
 * - Array allocations for entities
 * - Object spreading/copying
 */

import { Container, Sprite, Texture, Graphics, Text, TextStyle } from 'pixi.js';
import { BinarySnapshotReader, u8ToDirection } from '../engine/shared/BinarySnapshot';
import { SpritePoolManager, SpritePool } from './spritePool';
import { textureCache } from './textures';
import { Direction, GameStatus, EnemyType, FoodType } from '../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BinaryRenderState {
    isInitialized: boolean;
    container: Container | null;
    poolManager: SpritePoolManager | null;
    segmentPool: SpritePool | null;
    enemyPool: SpritePool | null;
    foodPool: SpritePool | null;
    projectilePool: SpritePool | null;
    particlePool: SpritePool | null;
    gridSize: number;
    lastFrameId: number;
}

export interface BinaryRenderMetrics {
    segmentsRendered: number;
    enemiesRendered: number;
    foodRendered: number;
    projectilesRendered: number;
    particlesRendered: number;
    frameId: number;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state: BinaryRenderState = {
    isInitialized: false,
    container: null,
    poolManager: null,
    segmentPool: null,
    enemyPool: null,
    foodPool: null,
    projectilePool: null,
    particlePool: null,
    gridSize: 24,
    lastFrameId: 0
};

// ═══════════════════════════════════════════════════════════════
// TEXTURE GENERATORS
// ═══════════════════════════════════════════════════════════════

function getSegmentTexture(index: number): Texture {
    const isHead = index === 0;
    const key = isHead ? 'snake_head' : 'snake_body';

    return textureCache.getOrCreate(
        { type: 'snake', style: key, state: 'default' },
        24, 24,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;
            const size = 10;

            ctx.save();
            ctx.translate(cx, cy);

            if (isHead) {
                // Neon green head with glow
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(-size / 2, -size / 2, size, size);

                // Eye glow
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-3, -3, 2, 2);
                ctx.fillRect(1, -3, 2, 2);
            } else {
                // Body segment with gradient
                const grad = ctx.createLinearGradient(-size / 2, 0, size / 2, 0);
                grad.addColorStop(0, '#00cc00');
                grad.addColorStop(0.5, '#00ff00');
                grad.addColorStop(1, '#00cc00');
                ctx.fillStyle = grad;
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 6;
                ctx.fillRect(-size / 2, -size / 2, size, size);
            }

            ctx.restore();
        }
    );
}

function getEnemyTexture(type: number): Texture {
    const typeKey = `enemy_${type}`;

    return textureCache.getOrCreate(
        { type: 'enemy', style: typeKey, state: 'default' },
        32, 32,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Red glowing enemy
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    );
}

function getFoodTexture(type: number): Texture {
    const typeKey = `food_${type}`;

    return textureCache.getOrCreate(
        { type: 'food', style: typeKey, state: 'default' },
        24, 24,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Cyan glowing cube
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-5, -5, 10, 10);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(-5, -5, 10, 3);

            ctx.restore();
        }
    );
}

function getProjectileTexture(type: number): Texture {
    const typeKey = `projectile_${type}`;

    return textureCache.getOrCreate(
        { type: 'projectile', style: typeKey, state: 'default' },
        16, 16,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Yellow energy projectile
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    );
}

function getParticleTexture(): Texture {
    return textureCache.getOrCreate(
        { type: 'particle', style: 'default', state: 'default' },
        8, 8,
        (ctx, w, h) => {
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Simple glow particle
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the binary snapshot renderer.
 */
export function initBinaryRenderer(parentContainer: Container, gridSize: number = 24): void {
    if (state.isInitialized) return;

    state.gridSize = gridSize;
    state.container = new Container();
    state.container.sortableChildren = true;
    parentContainer.addChild(state.container);

    // Create pool manager
    state.poolManager = new SpritePoolManager(state.container);

    // Create typed pools
    state.segmentPool = state.poolManager.getPool('segments', Texture.WHITE);
    state.enemyPool = state.poolManager.getPool('enemies', Texture.WHITE);
    state.foodPool = state.poolManager.getPool('food', Texture.WHITE);
    state.projectilePool = state.poolManager.getPool('projectiles', Texture.WHITE);
    state.particlePool = state.poolManager.getPool('particles', Texture.WHITE);

    state.isInitialized = true;
    console.log('[BinaryRenderer] Initialized');
}

// ═══════════════════════════════════════════════════════════════
// ZERO-ALLOCATION RENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Render directly from BinarySnapshotReader with zero object allocation.
 * This is the main render entry point for high-performance mode.
 */
export function renderFromBinarySnapshot(
    reader: BinarySnapshotReader,
    now: number
): BinaryRenderMetrics {
    if (!state.isInitialized || !state.poolManager) {
        return {
            segmentsRendered: 0,
            enemiesRendered: 0,
            foodRendered: 0,
            projectilesRendered: 0,
            particlesRendered: 0,
            frameId: 0
        };
    }

    const frameId = reader.getFrameId();
    const gridSize = state.gridSize;
    const halfGrid = gridSize / 2;

    // Release all sprites from previous frame
    state.poolManager.releaseAll();

    const metrics: BinaryRenderMetrics = {
        segmentsRendered: 0,
        enemiesRendered: 0,
        foodRendered: 0,
        projectilesRendered: 0,
        particlesRendered: 0,
        frameId
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER PLAYER SEGMENTS (zero-allocation loop)
    // ─────────────────────────────────────────────────────────────

    const segmentCount = reader.getPlayerSegmentCount();
    for (let i = 0; i < segmentCount; i++) {
        const segment = reader.getSegment(i);
        if (!segment) continue;

        const texture = getSegmentTexture(i);
        const pooled = state.segmentPool!.acquire(texture);
        const sprite = pooled.sprite;

        sprite.x = segment.x * gridSize + halfGrid;
        sprite.y = segment.y * gridSize + halfGrid;
        sprite.zIndex = segment.y;

        // Subtle pulse animation for head
        if (i === 0) {
            const pulse = 1 + Math.sin(now / 150) * 0.05;
            sprite.scale.set(pulse, pulse);
        }

        metrics.segmentsRendered++;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER ENEMIES (zero-allocation loop)
    // ─────────────────────────────────────────────────────────────

    const entityCounts = reader.getEntityCounts();

    for (let i = 0; i < entityCounts.enemies; i++) {
        const enemy = reader.getEnemy(i);
        if (!enemy) continue;

        const texture = getEnemyTexture(enemy.type);
        const pooled = state.enemyPool!.acquire(texture);
        const sprite = pooled.sprite;

        // Use pixel coordinates directly (already in world space)
        sprite.x = enemy.x;
        sprite.y = enemy.y;
        sprite.zIndex = Math.floor(enemy.y / gridSize);

        // Flash effect when damaged
        if (enemy.flash > 0) {
            sprite.tint = 0xffffff;
        } else {
            sprite.tint = 0xffffff;
        }

        // HP-based alpha
        if (enemy.maxHp > 0) {
            sprite.alpha = 0.5 + (enemy.hp / enemy.maxHp) * 0.5;
        }

        metrics.enemiesRendered++;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER FOOD (zero-allocation loop)
    // ─────────────────────────────────────────────────────────────

    for (let i = 0; i < entityCounts.food; i++) {
        const food = reader.getFood(i);
        if (!food) continue;

        const texture = getFoodTexture(food.type);
        const pooled = state.foodPool!.acquire(texture);
        const sprite = pooled.sprite;

        // Use grid coordinates
        sprite.x = food.x * gridSize + halfGrid;
        sprite.y = food.y * gridSize + halfGrid;
        sprite.zIndex = food.y;

        // Hover animation
        sprite.y += Math.sin((now / 200) + (food.x * 0.5)) * 3;
        sprite.rotation = now / 400 + (food.x * 0.2);

        metrics.foodRendered++;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER PROJECTILES (zero-allocation loop)
    // ─────────────────────────────────────────────────────────────

    for (let i = 0; i < entityCounts.projectiles; i++) {
        const proj = reader.getProjectile(i);
        if (!proj) continue;

        const texture = getProjectileTexture(proj.type);
        const pooled = state.projectilePool!.acquire(texture);
        const sprite = pooled.sprite;

        sprite.x = proj.x;
        sprite.y = proj.y;
        sprite.zIndex = Math.floor(proj.y / gridSize) + 1000; // Above entities

        // Rotation based on velocity
        if (proj.vx !== 0 || proj.vy !== 0) {
            sprite.rotation = Math.atan2(proj.vy, proj.vx);
        }

        // Size based on damage
        const scale = 0.5 + (proj.damage / 20) * 0.5;
        sprite.scale.set(scale, scale);

        metrics.projectilesRendered++;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER PARTICLES (zero-allocation loop)
    // ─────────────────────────────────────────────────────────────

    const particleTexture = getParticleTexture();

    for (let i = 0; i < entityCounts.particles; i++) {
        const particle = reader.getParticle(i);
        if (!particle || particle.life <= 0) continue;

        const pooled = state.particlePool!.acquire(particleTexture);
        const sprite = pooled.sprite;

        sprite.x = particle.x;
        sprite.y = particle.y;
        sprite.zIndex = 2000; // Above everything

        // Parse color number to tint
        sprite.tint = particle.color;

        // Alpha based on life
        sprite.alpha = Math.min(1, particle.life / 30);

        metrics.particlesRendered++;
    }

    state.lastFrameId = frameId;
    return metrics;
}

// ═══════════════════════════════════════════════════════════════
// CAMERA TRANSFORM
// ═══════════════════════════════════════════════════════════════

/**
 * Apply camera transform from binary reader.
 */
export function applyCameraFromReader(reader: BinarySnapshotReader): void {
    if (!state.container) return;

    const cameraX = reader.getCameraX();
    const cameraY = reader.getCameraY();
    const zoom = reader.getCameraZoom();
    const shake = reader.getCameraShake();

    // Apply shake
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;

    // Center on camera position with zoom
    state.container.scale.set(zoom, zoom);
    state.container.x = -cameraX * zoom + shakeX;
    state.container.y = -cameraY * zoom + shakeY;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get render statistics.
 */
export function getBinaryRenderStats(): {
    total: number;
    active: number;
    pools: number;
    lastFrameId: number;
} {
    if (!state.poolManager) {
        return { total: 0, active: 0, pools: 0, lastFrameId: 0 };
    }
    const stats = state.poolManager.getStats();
    return { ...stats, lastFrameId: state.lastFrameId };
}

/**
 * Set grid size for positioning.
 */
export function setBinaryRenderGridSize(gridSize: number): void {
    state.gridSize = gridSize;
}

/**
 * Destroy the renderer and release resources.
 */
export function destroyBinaryRenderer(): void {
    if (state.poolManager) {
        state.poolManager.destroy();
        state.poolManager = null;
    }
    if (state.container) {
        state.container.destroy({ children: true });
        state.container = null;
    }
    state.segmentPool = null;
    state.enemyPool = null;
    state.foodPool = null;
    state.projectilePool = null;
    state.particlePool = null;
    state.isInitialized = false;
    console.log('[BinaryRenderer] Destroyed');
}

/**
 * Check if renderer is ready.
 */
export function isBinaryRendererReady(): boolean {
    return state.isInitialized;
}
