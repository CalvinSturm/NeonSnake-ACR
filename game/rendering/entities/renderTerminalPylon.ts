import { Terminal, Point } from '../../../types';
import { drawShadow } from '../primitives';

/**
 * Renders just the terminal pylon (the floating 3D object).
 * This is separated from floor effects to enable proper Y-based depth sorting
 * with other entities like the snake.
 *
 * Floor effects (range circle, progress ring) are rendered in renderEnvironment.ts
 */
export const renderTerminalPylon = (
    ctx: CanvasRenderingContext2D,
    t: Terminal,
    gridSize: number,
    halfGrid: number,
    now: number,
    snakeHead: Point | undefined
) => {
    const cx = t.x * gridSize + halfGrid;
    const cy = t.y * gridSize + halfGrid;

    const isActive = t.isBeingHacked && !t.isLocked;
    const baseColor = t.color;

    // Float animation
    const floatY = Math.sin(now * 0.003 + cx) * 5;
    const zHeight = -25 + floatY; // Negative Y is up

    ctx.save();
    ctx.translate(cx, cy);

    // Shadow on floor
    drawShadow(ctx, 0, 0, 15 - (floatY * 0.5), 10);

    // Floating Base
    ctx.translate(0, zHeight);

    // Draw Core Geometry based on Type
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = isActive ? 20 : 10;

    if (t.type === 'MEMORY') {
        // GOLDEN PYRAMID
        ctx.rotate(now * 0.001);
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, 5);
        ctx.lineTo(-12, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inverted bottom half
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(12, 5);
        ctx.lineTo(-12, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    } else if (t.type === 'OVERRIDE') {
        // JAGGED CRYSTAL
        ctx.rotate(now * -0.002);
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(8, -5);
        ctx.lineTo(12, 10);
        ctx.lineTo(0, 20);
        ctx.lineTo(-12, 10);
        ctx.lineTo(-8, -5);
        ctx.closePath();

        ctx.fillStyle = '#330000';
        ctx.fill();
        ctx.stroke();

        // Inner glowing crack
        ctx.strokeStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-4, 0);
        ctx.lineTo(4, 10);
        ctx.stroke();

    } else {
        // STANDARD CUBE (Rotating)
        const size = 12;
        ctx.rotate(now * 0.001);
        // 2.5D Cube
        ctx.fillStyle = '#111';
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.strokeRect(-size, -size, size * 2, size * 2);

        // Data Face
        ctx.fillStyle = baseColor;
        const scan = (Math.sin(now * 0.01) + 1) / 2;
        ctx.fillRect(-size + 4, -size + 4 + (scan * (size * 2 - 8)), size * 2 - 8, 2);
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // HOLOGRAPHIC DATA STREAM (When Hacking)
    if (isActive && snakeHead) {
        const headPx = {
            x: snakeHead.x * gridSize + halfGrid,
            y: snakeHead.y * gridSize + halfGrid
        };

        ctx.save();
        ctx.translate(cx, cy + zHeight); // Start at floating core

        // Draw stream to snake head
        const relHeadX = headPx.x - cx;
        const relHeadY = headPx.y - (cy + zHeight);

        const dist = Math.hypot(relHeadX, relHeadY);
        const angle = Math.atan2(relHeadY, relHeadX);

        // Rotate to face head
        ctx.rotate(angle);

        // Stream particles
        const particles = 5;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;

        for (let i = 0; i < particles; i++) {
            const tVal = ((now * 0.002) + (i / particles)) % 1;
            const px = tVal * dist;
            const py = Math.sin(tVal * Math.PI * 4) * 5; // Wiggle

            ctx.globalAlpha = Math.sin(tVal * Math.PI); // Fade in/out
            ctx.fillRect(px, py, 4, 4);
        }

        ctx.restore();
    }

    // STATUS TEXT
    const progress = t.progress / t.totalTime;
    let isInside = false;
    if (snakeHead) {
        const headPx = {
            x: snakeHead.x * gridSize + halfGrid,
            y: snakeHead.y * gridSize + halfGrid
        };
        const dx = headPx.x - cx;
        const dy = headPx.y - cy;
        const distToHead = Math.sqrt(dx * dx + dy * dy);
        isInside = distToHead < t.radius * gridSize;
    }

    if (progress > 0 || isInside) {
        ctx.save();
        ctx.translate(cx, cy - 40);

        // Billboard text (No rotation)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;

        let label: string = t.type;
        if (t.type === 'RESOURCE') label = 'DATA';

        ctx.fillText(isActive ? `${Math.floor(progress * 100)}%` : (isInside ? 'CONNECTING...' : label), 0, 0);

        // Progress Bar (Mini)
        if (progress > 0) {
            ctx.fillStyle = '#333';
            ctx.fillRect(-15, 4, 30, 4);
            ctx.fillStyle = baseColor;
            ctx.fillRect(-15, 4, 30 * progress, 4);
        }

        ctx.restore();
    }
};
