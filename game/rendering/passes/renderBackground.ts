
import { RenderContext } from '../types';
import { CameraMode } from '../../../types';

// ─── HELPERS ───

const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    width: number, height: number, 
    offsetX: number, offsetY: number, 
    size: number, 
    color: string, 
    lineWidth: number
) => {
    ctx.beginPath();
    // Vertical Lines
    const startX = offsetX % size;
    for (let x = startX; x < width; x += size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    // Horizontal Lines
    const startY = offsetY % size;
    for (let y = startY; y < height; y += size) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};

const drawHexGrid = (
    ctx: CanvasRenderingContext2D,
    width: number, height: number, 
    offsetX: number, offsetY: number,
    radius: number,
    color: string,
    lineWidth: number
) => {
    const a = 2 * Math.PI / 6;
    const r = radius;
    const dy = r * Math.sin(a);
    const dx = r * (1 + Math.cos(a));
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    // Overscan slightly to avoid pop-in
    const startY = (offsetY % (dy*2)) - (dy*2);
    const startX = (offsetX % dx) - dx;

    for (let y = startY; y < height + dy; y += dy) {
        for (let x = startX; x < width + dx; x += dx) {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
            ctx.lineTo(x - r * Math.cos(a), y + r * Math.sin(a));
        }
    }
    ctx.stroke();
};

const drawCityscape = (
    ctx: CanvasRenderingContext2D,
    width: number, height: number,
    offsetX: number,
    color: string
) => {
    // Procedural skyline based on modulo x
    const segmentWidth = 100;
    const horizonY = height;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    
    const numSegments = Math.ceil(width / segmentWidth) + 1;
    const startIdx = Math.floor(-offsetX / segmentWidth);
    
    for(let i = 0; i < numSegments; i++) {
        const idx = startIdx + i;
        // Deterministic pseudo-random height
        const h = 50 + (Math.abs(Math.sin(idx * 123.45)) * 150);
        const x = (idx * segmentWidth) + offsetX;
        
        ctx.lineTo(x, horizonY - h);
        ctx.lineTo(x + segmentWidth, horizonY - h);
    }
    ctx.lineTo(width, horizonY);
    ctx.fill();
};

// ─── THEME RENDERERS ───

const renderCyberSpace = (rc: RenderContext, primary: string, secondary: string) => {
    const { ctx, width, height, camera, now } = rc;
    
    // Parallax Factors
    const p1 = 0.1; // Deep background (Stars/Noise)
    const p2 = 0.2; // Far Grid
    const p3 = 0.5; // Near Grid / Data (Primary Gameplay Plane)

    const ox = camera.x;
    const oy = camera.y;
    const cx = width / 2;
    const cy = height / 2;

    // Refined Pulse: Slower (0.0005) and Subtle Amplitude (3%)
    // Applied to DEEP layers only to prevent gameplay distraction
    const pulse = 1 + Math.sin(now * 0.0005) * 0.03;

    // 1. Deep Gradient (Stable)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, height);
    grad.addColorStop(0, '#001122');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Far Grid (Faint & Pulsing)
    ctx.save();
    // Apply centered pulse
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-cx, -cy);

    // Draw oversized buffer to prevent edge creep during zoom-out
    const buffer = Math.max(width, height) * 0.2;
    ctx.translate(-buffer, -buffer);
    
    ctx.globalAlpha = 0.1;
    drawGrid(
        ctx, 
        width + buffer * 2, 
        height + buffer * 2, 
        (-ox * p1) + buffer, 
        (-oy * p1) + buffer, 
        100, 
        secondary, 
        1
    );
    ctx.restore();
    
    // 3. Digital Rain / Data Streams (Background)
    ctx.save();
    // Also pulse to match deep layer depth
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-cx, -cy);

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = primary;
    const streamCount = 20;
    for (let i = 0; i < streamCount; i++) {
        const speed = 0.2 + (i % 3) * 0.1;
        const x = ((i * 150) - (ox * p2)) % (width + 50);
        const y = ((now * speed) + (i * 300) - (oy * p2)) % height;
        const finalX = x < 0 ? width + x : x;
        const finalY = y < 0 ? height + y : y;
        
        // Culling
        if (finalX > -10 && finalX < width + 10 && finalY > -10 && finalY < height + 10) {
            ctx.fillRect(finalX, finalY, 2, 40);
        }
    }
    ctx.restore();

    // 4. Cityscape Silhouette (Far) - Stable
    // Horizon elements should generally be stable or parallax only
    ctx.globalAlpha = 0.3;
    drawCityscape(ctx, width, height, -ox * p1, '#002233');

    // 5. Near Grid (Main Floor) - STABLE
    // Removed pulse from here to keep gameplay reference solid
    ctx.save();
    ctx.globalAlpha = 0.2;
    drawGrid(ctx, width, height, -ox * p3, -oy * p3, 50, primary, 1);
    ctx.restore();

    // 6. Horizon Glow
    const horizonGrad = ctx.createLinearGradient(0, height, 0, height - 200);
    horizonGrad.addColorStop(0, primary);
    horizonGrad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, height - 200, width, 200);
};

const renderFirewall = (rc: RenderContext) => {
    const { ctx, width, height, camera, now } = rc;
    
    const coreColor = '#ff4400';
    const gridColor = '#551100';

    const cx = width / 2;
    const cy = height / 2;

    // 1. Red Void
    ctx.fillStyle = '#1a0500';
    ctx.fillRect(0, 0, width, height);

    // 2. Hex Mesh (Parallax & Subtle Pulse)
    const pulse = 1 + Math.sin(now * 0.001) * 0.02; // Very subtle breath
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-cx, -cy);

    const buffer = 100;
    ctx.translate(-buffer, -buffer);
    ctx.globalAlpha = 0.2;
    drawHexGrid(
        ctx, 
        width + buffer * 2, 
        height + buffer * 2, 
        (-camera.x * 0.2) + buffer, 
        (-camera.y * 0.2) + buffer, 
        40, 
        gridColor, 
        2
    );
    ctx.restore();

    // 3. Pulsating Core (Screen Center relative to world)
    const coreX = (width/2) - (camera.x * 0.1);
    const coreY = (height/2) - (camera.y * 0.1);
    
    // Core has its own independent, stronger pulse
    const corePulse = 1 + Math.sin(now * 0.003) * 0.05;
    
    const grad = ctx.createRadialGradient(coreX, coreY, 50, coreX, coreY, 600);
    grad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
    grad.addColorStop(0.5, 'rgba(100, 0, 0, 0.1)');
    grad.addColorStop(1, 'transparent');
    
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 4. Rotating Warning Rings
    ctx.save();
    ctx.translate(coreX, coreY);
    
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 4;
    
    ctx.rotate(now * 0.001);
    ctx.setLineDash([50, 50]);
    // Apply pulse to ring radius
    ctx.beginPath(); ctx.arc(0, 0, 300 * corePulse, 0, Math.PI * 2); ctx.stroke();
    
    ctx.rotate(now * -0.002);
    ctx.beginPath(); ctx.arc(0, 0, 500, 0, Math.PI * 2); ctx.stroke();
    
    ctx.restore();
    
    // 5. Rising Embers
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffaa00';
    for(let i=0; i<30; i++) {
        const x = ((i * 73) - (camera.x * 0.3)) % width;
        const y = ((now * -0.1) + (i * 99) - (camera.y * 0.3)) % height;
        
        const fx = x < 0 ? width + x : x;
        const fy = y < 0 ? height + y : y;
        
        if (fx > -10 && fx < width + 10 && fy > -10 && fy < height + 10) {
            const size = Math.sin(now * 0.01 + i) + 2;
            ctx.fillRect(fx, fy, size, size);
        }
    }
};

const renderVoid = (rc: RenderContext) => {
    const { ctx, width, height, camera, now } = rc;
    const cx = width / 2;
    const cy = height / 2;
    
    // 1. Absolute Black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. Stars / Debris (High Parallax with Zoom Pulse)
    const starPulse = 1 + Math.sin(now * 0.0005) * 0.05;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(starPulse, starPulse);
    ctx.translate(-cx, -cy);

    ctx.fillStyle = '#ffffff';
    // Draw slight buffer for zoom out
    const buffer = 50;
    
    for(let i=0; i<100; i++) {
        // Deep stars (slow)
        const d1 = 0.05;
        const x1 = ((i * 37) - (camera.x * d1)) % (width + buffer);
        const y1 = ((i * 91) - (camera.y * d1)) % (height + buffer);
        
        const fx1 = x1 < 0 ? width + x1 : x1;
        const fy1 = y1 < 0 ? height + y1 : y1;
        
        if (fx1 > -buffer && fx1 < width + buffer && fy1 > -buffer && fy1 < height + buffer) {
            ctx.globalAlpha = Math.random() * 0.5 + 0.1;
            ctx.fillRect(fx1, fy1, 1, 1);
        }
        
        // Near debris (fast)
        if (i % 5 === 0) {
            const d2 = 0.4;
            const x2 = ((i * 153) - (camera.x * d2)) % (width + buffer);
            const y2 = ((i * 211) - (camera.y * d2)) % (height + buffer);
            const fx2 = x2 < 0 ? width + x2 : x2;
            const fy2 = y2 < 0 ? height + y2 : y2;
            
            if (fx2 > -buffer && fx2 < width + buffer && fy2 > -buffer && fy2 < height + buffer) {
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = i % 10 === 0 ? '#ff00ff' : '#00ffff'; 
                ctx.fillRect(fx2, fy2, 4, 4);
            }
        }
    }
    ctx.restore();

    // 3. Chromatic Grid
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(now * 0.0005);
    
    const grad = ctx.createConicGradient(now * 0.001, 0, 0);
    grad.addColorStop(0, '#110022');
    grad.addColorStop(0.5, '#000000');
    grad.addColorStop(1, '#110022');
    
    ctx.fillStyle = grad;
    // Oversize for rotation coverage
    const diag = Math.sqrt(width*width + height*height);
    ctx.fillRect(-diag, -diag, diag*2, diag*2);
    ctx.restore();
};

const renderSpaceshipBG = (rc: RenderContext) => {
    const { ctx, width, height, camera, now } = rc;
    
    // 1. Deep Space
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, width, height);
    
    // 2. Streaking Stars (Warp effect) - Stable flow, no pulse needed for warp speed
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for(let i=0; i<50; i++) {
        const speed = (i % 5) + 1;
        const y = (i * 30 + now * speed * 2) % height;
        const x = (i * 123) % width;
        
        // Parallax X shift
        const px = (x - camera.x * 0.05) % width;
        const fpx = px < 0 ? width + px : px;
        
        const alpha = Math.min(1, speed * 0.2);
        ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
        
        ctx.beginPath();
        ctx.moveTo(fpx, y);
        ctx.lineTo(fpx, y + speed * 10);
        ctx.stroke();
    }
    
    // 3. Distant Planet Curve
    const planetX = width * 0.8 - (camera.x * 0.02);
    const planetY = height * 0.8 - (camera.y * 0.02);
    
    const grad = ctx.createRadialGradient(planetX, planetY, 200, planetX, planetY, 800);
    grad.addColorStop(0, '#004488');
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 600, 0, Math.PI * 2);
    ctx.fill();
};


// ─── MAIN ENTRY POINT ───

export const renderBackground = (rc: RenderContext) => {
    const { ctx, width, height, stage, bossActive, bossConfigId } = rc;

    ctx.save();

    if (bossActive) {
        if (bossConfigId === 'WARDEN_07') {
            // Intense Industrial / Firewall
            renderFirewall(rc);
        } else if (bossConfigId === 'SPACESHIP_BOSS') {
            // Starfield
            renderSpaceshipBG(rc);
        } else {
            // Generic Boss (Red/Glitch)
            renderFirewall(rc);
        }
    } else {
        // Stage Themes based on modulus
        const themeIdx = (stage - 1) % 4;
        
        if (themeIdx === 0) { // Cyber Protocol (Blue/Cyan)
            renderCyberSpace(rc, '#00ffff', '#004488');
        } else if (themeIdx === 1) { // Matrix (Green)
            renderCyberSpace(rc, '#00ff00', '#004400');
        } else if (themeIdx === 2) { // Industrial (Orange)
            renderCyberSpace(rc, '#ffaa00', '#442200');
        } else { // Synth (Pink/Purple)
            // Void-like but colorful
            renderVoid(rc);
            // Add purple tint
            ctx.fillStyle = 'rgba(100, 0, 200, 0.1)';
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    // Global Vignette (Depth Fog)
    // Darkens edges to focus gameplay and hide pop-in of grids
    const vig = ctx.createRadialGradient(width/2, height/2, Math.min(width, height)*0.4, width/2, height/2, Math.min(width, height));
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
};
