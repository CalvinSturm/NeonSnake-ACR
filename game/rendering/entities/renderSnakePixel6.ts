
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakePixel6 = (
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

    const segments: { x: number, y: number }[] = [];
    
    // Interpolation
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

    ctx.save();
    
    // CLOUD RENDERING
    // Instead of drawing blocks, we draw a swarm of tiny pixels that *approximate* the blocks
    const density = 4; // pixels per row
    const subSize = gridSize / density;
    
    for(let i=0; i<segments.length; i++) {
        const seg = segments[i];
        const isHead = i === 0;
        
        // For each segment, fill with noise
        for(let py=0; py<density; py++) {
            for(let px=0; px<density; px++) {
                // Local coordinate offset
                const ox = (px - density/2) * subSize;
                const oy = (py - density/2) * subSize;
                
                // Noise function based on time and position
                const noise = Math.sin(now * 0.01 + i + px + py);
                
                if (noise > 0) {
                    ctx.fillStyle = isHead ? '#fff' : charColor;
                    
                    // Quantum Jitter
                    const jx = (Math.random() - 0.5) * (noise * 4);
                    const jy = (Math.random() - 0.5) * (noise * 4);
                    
                    ctx.fillRect(seg.x + ox + jx, seg.y + oy + jy, subSize * 0.8, subSize * 0.8);
                }
            }
        }
    }
    
    // Head Cursor
    const head = segments[0];
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(head.x - gridSize/2 - 2, head.y - gridSize/2 - 2, gridSize + 4, gridSize + 4);

    ctx.restore();
};
