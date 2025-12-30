
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch6 = (
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
    
    // For Glitch 6, we draw directly without robust interpolation to enhance the chaotic feel
    // Actually, smooth movement makes the glitch displacement more apparent.
    
    const segments: { x: number, y: number }[] = [];
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        if (i === snake.length - 1) prev = prevTail || curr;
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;

    ctx.save();
    
    // ZERO DAY: RAW DATA DUMP
    // We draw hex codes falling off the snake
    
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const hex = "0123456789ABCDEF";
    
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        
        // Random Screen Tear Offset
        const tearX = (Math.random() < 0.1) ? (Math.random() - 0.5) * 20 : 0;
        
        ctx.translate(seg.x + tearX, seg.y);
        
        // Background block
        ctx.fillStyle = (i === 0) ? '#fff' : '#000';
        ctx.fillRect(-gridSize/2, -gridSize/2, gridSize, gridSize);
        
        // Foreground Text
        ctx.fillStyle = (i === 0) ? '#000' : charColor;
        // Random hex char
        const char = hex.charAt(Math.floor(Math.random() * hex.length)) + hex.charAt(Math.floor(Math.random() * hex.length));
        ctx.fillText(char, 0, 0);
        
        // RGB Shift
        if (Math.random() < 0.2) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#ff0000';
            ctx.fillText(char, 2, 0);
            ctx.fillStyle = '#0000ff';
            ctx.fillText(char, -2, 0);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.translate(-(seg.x + tearX), -seg.y);
    }
    
    // Connection Lines (Corrupted)
    ctx.strokeStyle = charColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < segments.length - 1; i++) {
        const p1 = segments[i];
        const p2 = segments[i+1];
        if (Math.random() > 0.5) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
    }
    ctx.stroke();

    ctx.restore();
};
