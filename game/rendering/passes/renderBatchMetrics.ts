/**
 * Batch Metrics Overlay
 * 
 * Renders WebGL/Canvas2D performance metrics on-screen.
 * Displays: draw calls, sprite count, texture count, FPS.
 */

import { getFrameMetrics, FrameMetrics } from '../../../graphics';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const OVERLAY_CONFIG = {
    x: 10,
    y: 200,
    lineHeight: 16,
    font: '12px monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: '#00ff00',
    warningColor: '#ffaa00',
    criticalColor: '#ff0000',
    padding: 8,
};

// ═══════════════════════════════════════════════════════════════
// METRICS HISTORY (for averaging)
// ═══════════════════════════════════════════════════════════════

interface MetricsHistory {
    fps: number[];
    drawCalls: number[];
    maxSamples: 60;
}

const history: MetricsHistory = {
    fps: [],
    drawCalls: [],
    maxSamples: 60,
};

function pushMetric(arr: number[], value: number, max: number): void {
    arr.push(value);
    if (arr.length > max) arr.shift();
}

function average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render the batch metrics overlay.
 * Call at end of frame, after all other rendering.
 */
export function renderBatchMetricsOverlay(ctx: CanvasRenderingContext2D): void {
    const metrics = getFrameMetrics();

    // Update history
    pushMetric(history.fps, metrics.fps, history.maxSamples);
    pushMetric(history.drawCalls, metrics.drawCalls, history.maxSamples);

    const avgFps = Math.round(average(history.fps));
    const avgDrawCalls = Math.round(average(history.drawCalls));

    // Build display lines
    const lines: { text: string; color: string }[] = [
        {
            text: `Mode: ${metrics.mode.toUpperCase()}`,
            color: metrics.mode === 'webgl' ? OVERLAY_CONFIG.textColor : OVERLAY_CONFIG.warningColor
        },
        {
            text: `FPS: ${metrics.fps} (avg: ${avgFps})`,
            color: metrics.fps >= 55 ? OVERLAY_CONFIG.textColor :
                metrics.fps >= 30 ? OVERLAY_CONFIG.warningColor : OVERLAY_CONFIG.criticalColor
        },
        {
            text: `Draw Calls: ${metrics.drawCalls} (avg: ${avgDrawCalls})`,
            color: metrics.drawCalls <= 50 ? OVERLAY_CONFIG.textColor :
                metrics.drawCalls <= 100 ? OVERLAY_CONFIG.warningColor : OVERLAY_CONFIG.criticalColor
        },
        { text: `Sprites: ${metrics.spriteCount}`, color: OVERLAY_CONFIG.textColor },
        { text: `Textures: ${metrics.textureCount}`, color: OVERLAY_CONFIG.textColor },
        { text: `─────────────`, color: 'rgba(255,255,255,0.3)' },
        { text: `Particles: ${metrics.particleCount}`, color: OVERLAY_CONFIG.textColor },
        { text: `Projectiles: ${metrics.projectileCount}`, color: OVERLAY_CONFIG.textColor },
        { text: `Entities: ${metrics.entityCount}`, color: OVERLAY_CONFIG.textColor },
    ];

    const { x, y, lineHeight, font, backgroundColor, padding } = OVERLAY_CONFIG;
    const width = 180;
    const height = lines.length * lineHeight + padding * 2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Text
    ctx.font = font;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, x + padding, y + padding + i * lineHeight);
    });

    ctx.restore();
}

/**
 * Log current metrics to console.
 */
export function logBatchMetrics(): void {
    const metrics = getFrameMetrics();
    console.log('[BatchMetrics]', {
        mode: metrics.mode,
        fps: metrics.fps,
        drawCalls: metrics.drawCalls,
        spriteCount: metrics.spriteCount,
        textureCount: metrics.textureCount,
        particleCount: metrics.particleCount,
        projectileCount: metrics.projectileCount,
        entityCount: metrics.entityCount,
    });
}

/**
 * Get formatted metrics string for external use.
 */
export function getFormattedMetrics(): string {
    const m = getFrameMetrics();
    return `${m.mode.toUpperCase()} | FPS:${m.fps} | Draws:${m.drawCalls} | Sprites:${m.spriteCount}`;
}
