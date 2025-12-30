
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch5 = (
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
    
    const segments: {x:number, y:number}[] = [];
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
    
    // GLITCH 5: Signal Noise
    // The snake body is a solid bar but it "tears" horizontally.
    
    // Main Body
    ctx.strokeStyle = charColor;
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = 'square';
    
    // Draw in multiple horizontal strips with offset
    const strips = 5;
    const stripH = gridSize / strips;
    
    for (let s = 0; s < strips; s++) {
        // Noise offset
        const noise = (Math.random() - 0.5) * 6;
        
        ctx.save();
        ctx.translate(noise, 0);
        
        // Clip to this strip
        // Complex to do clipping path for line, so we just draw the line multiple times with different Y offsets? 
        // Better: Draw the full path, but dash it? No.
        // Simplification: Draw Rectangles for segments.
        
        for (let i = 0; i < segments.length; i++) {
            const p = segments[i];
            const x = p.x - gridSize/2;
            const y = p.y - gridSize/2 + (s * stripH);
            
            ctx.fillStyle = charColor;
            // Occasional color invert
            if (Math.random() < 0.05) ctx.fillStyle = '#fff';
            
            ctx.fillRect(x, y, gridSize, stripH);
        }
        ctx.restore();
    }
    
    // Head Glitch
    const head = segments[0];
    ctx.translate(head.x, head.y);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(Math.random() > 0.5 ? '0' : '1', -3, 3);

    ctx.restore();
};
