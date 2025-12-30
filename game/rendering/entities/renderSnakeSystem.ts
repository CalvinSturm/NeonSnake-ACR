
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem = (
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
    const charColor = charProfile?.color || COLORS.snakeHead;

    // 1. Position Calculation
    const segments: { x: number, y: number, angle: number }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        let angle = 0;
        if (i === 0) {
            switch(direction) {
                case 'RIGHT': angle = 0; break;
                case 'DOWN': angle = Math.PI/2; break;
                case 'LEFT': angle = Math.PI; break;
                case 'UP': angle = -Math.PI/2; break;
            }
        } else {
            const p = segments[i-1];
            if (p) angle = Math.atan2(p.y - (iy * gridSize + halfGrid), p.x - (ix * gridSize + halfGrid));
            // Correct angle calculation for trailing segments
            if (snake[i-1]) {
                 angle = Math.atan2(snake[i-1].y - curr.y, snake[i-1].x - curr.x);
            }
        }

        segments.push({ 
            x: ix * gridSize + halfGrid, 
            y: iy * gridSize + halfGrid,
            angle
        });
    }

    // 2. Connector Beam (Laser)
    // Drawn first to appear behind transparency
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    ctx.stroke();
    
    // Core white hot beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    
    ctx.restore();

    // 3. System Nodes (Vertical Data Plates)
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        
        // 2.5D Projection: Tilt back slightly to look like standing panels
        // Simple 2D approximation of 3D plane
        
        // Hover float
        const hover = Math.sin((now / 200) + i) * 3;
        ctx.translate(0, hover);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 15 - hover, gridSize * 0.4, gridSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isHead) {
            // HEAD: Spinning Pyramid / Data Core
            ctx.rotate(now / 300);
            
            ctx.strokeStyle = charColor;
            ctx.fillStyle = `${charColor}33`; // Low opacity fill
            ctx.lineWidth = 2;
            
            const size = gridSize * 0.6;
            
            // Draw Diamond shape
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inner Cross
            ctx.beginPath();
            ctx.moveTo(-size/2, 0); ctx.lineTo(size/2, 0);
            ctx.moveTo(0, -size/2); ctx.lineTo(0, size/2);
            ctx.stroke();
            
            // Center Eye
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillRect(-2, -2, 4, 4);

        } else {
            // BODY: Vertical Frames
            // Rotate to face previous segment? Or just billboard?
            // Let's billboard (face screen) but scale width based on angle?
            // Actually, static orientation looks more like "windows"
            
            const size = gridSize * 0.5; // Half-width
            const height = gridSize * 0.7;
            
            // Panel Glow
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 10;
            
            // Frame
            ctx.strokeStyle = charColor;
            ctx.lineWidth = 1.5;
            ctx.fillStyle = '#000000CC'; // Dark semi-transparent background
            
            // Draw Bracket Shape [ ]
            ctx.beginPath();
            // Left Bracket
            ctx.moveTo(-size/2 + 4, -height/2);
            ctx.lineTo(-size/2, -height/2);
            ctx.lineTo(-size/2, height/2);
            ctx.lineTo(-size/2 + 4, height/2);
            
            // Right Bracket
            ctx.moveTo(size/2 - 4, -height/2);
            ctx.lineTo(size/2, -height/2);
            ctx.lineTo(size/2, height/2);
            ctx.lineTo(size/2 - 4, height/2);
            
            ctx.stroke();
            
            // Inner Content (Data Bar)
            ctx.fillStyle = charColor;
            const barHeight = Math.sin((now / 100) + i) * (height * 0.4);
            ctx.fillRect(-size/2 + 4, -1, size - 8, 2); // Center line
            ctx.fillRect(-1, -barHeight, 2, barHeight * 2); // Pulsing vertical
            
            // Damage Glitch
            if (tailIntegrity < 100 && Math.random() < 0.05) {
                ctx.fillStyle = '#ff0000';
                ctx.fillText('ERR', -10, 0);
            }
        }

        ctx.restore();
    }
};
