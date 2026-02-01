
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeProtocol = (
    rc: RenderContext,
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    visualNsAngle: number,
    tailIntegrity: number
) => {
    if (snake.length === 0) return;
    const { ctx, gridSize, halfGrid, now } = rc;
    
    // 1. Calculate Positions, Angles, and Z-Heights
    const segments: { x: number, y: number, angle: number, z: number, index: number, isHead: boolean }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        // Smooth movement interpolation
        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        // Determine rotation angle
        let angle = 0;
        if (i === 0) {
            switch(direction) {
                case 'RIGHT': angle = 0; break;
                case 'DOWN': angle = Math.PI/2; break;
                case 'LEFT': angle = Math.PI; break;
                case 'UP': angle = -Math.PI/2; break;
            }
        } else {
            const p = snake[i-1]; // Look at previous for alignment
            if (p) angle = Math.atan2(p.y - curr.y, p.x - curr.x);
        }

        // Z-Height Calculation (Floating Sine Wave)
        // Head floats slightly higher
        const baseZ = i === 0 ? 14 : 10;
        // Wave travels down the body
        const wave = Math.sin((now / 250) - (i * 0.5)) * 3;
        const z = baseZ + wave;

        segments.push({ 
            x: ix * gridSize + halfGrid, 
            y: iy * gridSize + halfGrid,
            angle,
            z,
            index: i,
            isHead: i === 0
        });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;
    const integrityRatio = tailIntegrity / 100;

    // 2. Draw Shadows (Projected to Ground Plane)
    // Draw shadows before sorting (Ground layer)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    for (const seg of segments) {
        ctx.beginPath();
        // Shadow is offset by Y+15 to look like it's on the floor beneath the floating unit
        ctx.ellipse(seg.x, seg.y + 15, gridSize * 0.35, gridSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Draw Data Spine (Connecting Cable)
    // Drawn first so it appears "inside" or "below" the transparent nodes
    // Using original array order (0..N) to maintain connectivity logic
    if (segments.length > 1) {
        ctx.save();
        ctx.beginPath();
        
        // Calculate connection points relative to floating height
        const cableOffset = 5; 
        
        const headS = segments[0];
        ctx.moveTo(headS.x, headS.y - headS.z + cableOffset);
        
        for (let i = 1; i < segments.length; i++) {
            const s = segments[i];
            ctx.lineTo(s.x, s.y - s.z + cableOffset);
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Inner dark core
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#050505';
        ctx.stroke();
        
        // Glowing Data Stream
        ctx.lineWidth = 2;
        ctx.strokeStyle = charColor;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.setLineDash([gridSize * 0.5, gridSize * 0.25]);
        ctx.lineDashOffset = -now * 0.15; // Flow animation
        ctx.stroke();
        
        ctx.restore();
    }

    // 4. Sort Segments for Z-Buffer (Painter's Algorithm)
    segments.sort((a, b) => a.y - b.y);

    // 5. Draw Segments
    for (const seg of segments) {
        const i = seg.index;
        const isHead = seg.isHead;
        
        ctx.save();
        
        // Apply 3D Translation: Move context UP by Z
        ctx.translate(seg.x, seg.y - seg.z);
        ctx.rotate(seg.angle);
        
        // Dimensions
        const w = gridSize * 0.6; // Width of the block
        const l = gridSize * (isHead ? 0.9 : 0.7); // Length of the block
        const h = isHead ? 12 : 8; // Extrusion Height (Thickness)
        const halfW = w / 2;
        const halfL = l / 2;

        // -- DRAWING THE 3D EXTRUDED BOX --
        
        // A. Side Walls (The "Thickness")
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0,0,0,0.5)`; // Subtle edge on sides
        
        // Rear Wall
        ctx.fillStyle = '#080808';
        ctx.beginPath();
        ctx.moveTo(-halfL, -halfW); ctx.lineTo(halfL, -halfW);
        ctx.lineTo(halfL, -halfW + h); ctx.lineTo(-halfL, -halfW + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right Wall
        ctx.fillStyle = '#0f0f0f';
        ctx.beginPath();
        ctx.moveTo(halfL, -halfW); ctx.lineTo(halfL, halfW);
        ctx.lineTo(halfL, halfW + h); ctx.lineTo(halfL, -halfW + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Front Wall
        ctx.fillStyle = '#1a1a1a'; // Lighter (facing 'up/forward')
        ctx.beginPath();
        ctx.moveTo(-halfL, halfW); ctx.lineTo(halfL, halfW);
        ctx.lineTo(halfL, halfW + h); ctx.lineTo(-halfL, halfW + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Left Wall
        ctx.fillStyle = '#0f0f0f';
        ctx.beginPath();
        ctx.moveTo(-halfL, -halfW); ctx.lineTo(-halfL, halfW);
        ctx.lineTo(-halfL, halfW + h); ctx.lineTo(-halfL, -halfW + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // B. Top Face (The "Screen" or "Deck")
        const topGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
        topGrad.addColorStop(0, '#000');
        topGrad.addColorStop(0.5, '#111');
        topGrad.addColorStop(1, '#000');
        
        ctx.fillStyle = topGrad;
        ctx.fillRect(-halfL, -halfW, l, w);
        
        // Neon Rim (Wireframe)
        ctx.strokeStyle = charColor;
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfL, -halfW, l, w);
        ctx.shadowBlur = 0; 

        // C. Details
        ctx.fillStyle = charColor;
        
        if (isHead) {
            // "Eye" / Sensor Array
            ctx.shadowBlur = 10;
            ctx.fillRect(0, -halfW + 4, halfL * 0.8, w - 8);
            
            // Lens Flare
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#fff';
            ctx.fillRect(halfL * 0.2, -2, 4, 4);
        } else {
            // Data Nodes
            if (i % 2 === 0) {
                // Solid Block
                ctx.globalAlpha = 0.5;
                ctx.fillRect(-halfL + 4, -halfW + 4, l - 8, w - 8);
            } else {
                // Circuit Lines
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-halfL + 4, 0); ctx.lineTo(halfL - 4, 0);
                ctx.moveTo(0, -halfW + 4); ctx.lineTo(0, halfW - 4);
                ctx.stroke();
            }
        }

        // Damage Glitch
        if (integrityRatio < 1.0 && Math.random() > integrityRatio) {
            ctx.font = '8px monospace';
            ctx.fillStyle = '#ff0000';
            ctx.fillText('ERR', -halfL, 0);
        }

        ctx.restore();
    }
};
