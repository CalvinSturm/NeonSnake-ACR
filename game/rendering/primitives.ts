
// ─────────────────────────────
// DRAWING HELPERS (3D / FX)
// ─────────────────────────────

import { CameraState } from '../camera/types';
import { EntityAnchors } from './types';
import { projectVector } from './camera/projectToScreen';

/**
 * 2.5D Rendering System
 * Enforces strictly layered, math-based perspective drawing with state isolation.
 * Returns screen-space anchors for attaching UI/VFX in subsequent passes.
 * 
 * @param ctx Canvas Context
 * @param x World X (or Local X if context translated)
 * @param y World Y (or Local Y if context translated)
 * @param height Logical Entity Height
 * @param tilt Camera Tilt Factor (0.0 - 1.0)
 * @param layers Drawing callbacks for each depth layer
 * @param rotation Rotation in radians (optional)
 */
export const drawEntity25D = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number,
    tilt: number,
    rotation: number = 0,
    layers: {
        shadow?: () => void;
        base?: () => void; // Ground-level details
        body?: (yOffset: number) => void; // Extrusion / Sides
        top?: (yOffset: number) => void;  // The "Face" or Cap
    }
): EntityAnchors => {
    // 1. PROJECT VERTICAL OFFSET
    // Use centralized math: offset = -z * tilt
    // This vector is in SCREEN SPACE (Up is negative Y)
    const projection = projectVector(0, 0, height, tilt);
    const drawOffset = projection.y; 

    ctx.save();
    ctx.translate(x, y);

    // LAYER 1: SHADOW (Ground Plane)
    // Rendered without base rotation to ensure placement logic remains in screen-space (e.g. y-offsets)
    // Caller is responsible for rotating the shadow shape itself if needed.
    if (layers.shadow) {
        ctx.save();
        layers.shadow();
        ctx.restore();
    }

    // LAYER 2: BASE (Rotated Ground Details)
    // Rotated to match entity facing
    if (layers.base) {
        ctx.save();
        if (rotation !== 0) ctx.rotate(rotation);
        layers.base();
        ctx.restore();
    }

    // LAYER 3: BODY (Extrusion / Pillar)
    // Rendered in SCREEN ALIGNED space (Unrotated) 
    // This ensures vertical lines go straight UP relative to the screen, regardless of entity facing.
    // Connects (0,0) to (0, drawOffset)
    if (layers.body) {
        ctx.save();
        // Do not rotate body layer to maintain verticality of pillars
        layers.body(drawOffset);
        ctx.restore();
    }

    // LAYER 4: TOP (Face)
    // 1. Translate UP in Screen Space (Z-Offset)
    // 2. Rotate in place (Facing)
    if (layers.top) {
        ctx.save();
        ctx.translate(0, drawOffset); // Move 'Up' relative to camera (Screen Y)
        if (rotation !== 0) ctx.rotate(rotation);
        layers.top(drawOffset);
        ctx.restore();
    }

    ctx.restore();

    // Return Local Anchors (Caller must transform to Screen Space if needed)
    return {
        base: { x: 0, y: 0 },
        center: { x: 0, y: drawOffset / 2 },
        top: { x: 0, y: drawOffset }
    };
};

export const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, blur: number = 5) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Wide Ambient Shadow (Soft occlusion)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = blur * 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.2, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow for next pass to avoid cumulative cost
    ctx.shadowBlur = 0;

    // 2. Contact Occlusion (Tight, dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = blur * 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.7, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

export const drawBoxShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blur: number = 10) => {
    ctx.save();
    
    // Ambient spread
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = blur * 1.5;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    
    // Contact dark
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = blur * 0.3;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    ctx.restore();
};

export const drawBeveledRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, raised: boolean = true) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    // Bevel Lighting
    const light = 'rgba(255,255,255,0.3)';
    const shadow = 'rgba(0,0,0,0.5)';

    // Top/Left (Light)
    ctx.fillStyle = raised ? light : shadow;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 4, y + 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + 4, y + h - 4);
    ctx.lineTo(x, y + h);
    ctx.fill();

    // Bottom/Right (Shadow)
    ctx.fillStyle = raised ? shadow : light;
    ctx.beginPath();
    ctx.moveTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + 4, y + h - 4);
    ctx.lineTo(x + w - 4, y + h - 4);
    ctx.lineTo(x + w - 4, y + 4);
    ctx.lineTo(x + w, y);
    ctx.fill();
    
    // Face
    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
};

export const drawSphere = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
    // 3D Ball Effect
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)'); // Specular highlight
    grad.addColorStop(0.3, color);                  // Base Color
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');        // Shadow edge
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Rim Light (Neon Edge)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
};

export const drawNeonStroke = (ctx: CanvasRenderingContext2D, color: string, width: number, blur: number = 10) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = width / 2;
    ctx.stroke();
};

export const drawVolumetricThruster = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, length: number, color: string, now: number, offset: number = 0) => {
    // Dynamic pulse for "burning" effect
    const pulse = Math.sin((now + offset) / 40) * 0.15 + 0.85;
    const l = length * pulse;
    const w = width * (0.9 + pulse * 0.1);

    ctx.save();
    ctx.translate(x, y);

    // 1. Engine Nozzle (Mechanical Base)
    // Dark metallic ring at the attachment point
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.2, w * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Core Flame (Bright Gradient)
    ctx.globalCompositeOperation = 'screen';
    
    // Gradient: Hot White -> Color -> Transparent
    const grad = ctx.createLinearGradient(0, 0, -l, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); 
    grad.addColorStop(0.2, color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.moveTo(0, w * 0.4);
    ctx.lineTo(-l, 0);
    ctx.lineTo(0, -w * 0.4);
    ctx.fill();

    // 3. Inner Jet (The "shock diamond" look)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-l * 0.6, 0);
    ctx.lineWidth = w * 0.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
};
