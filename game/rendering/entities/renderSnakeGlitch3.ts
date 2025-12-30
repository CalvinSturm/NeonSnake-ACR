
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch3 = (
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

    const segments: {x:number, y:number}[] = [];
    
    // Only calculate actual points
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
    
    // Smear Trail (Time Echoes)
    // We simulate this by drawing the whole body multiple times with offsets
    const echoes = 3;
    for (let e = 0; e < echoes; e++) {
        const xOff = (Math.random() - 0.5) * 10;
        const yOff = (Math.random() - 0.5) * 10;
        
        ctx.globalAlpha = 0.3 / (e + 1);
        ctx.fillStyle = e === 0 ? '#ff0000' : (e === 1 ? '#00ff00' : '#0000ff');
        
        for (const seg of segments) {
            const w = gridSize * 0.6;
            ctx.fillRect(seg.x - w/2 + xOff, seg.y - w/2 + yOff, w, w);
        }
    }
    
    ctx.globalAlpha = 1.0;
    
    // Main Body (Static Noise Fill)
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        
        // Random displacement
        const dx = (Math.random() - 0.5) * 4;
        const dy = (Math.random() - 0.5) * 4;
        
        ctx.translate(seg.x + dx, seg.y + dy);
        
        ctx.fillStyle = charColor;
        // Slice
        const sliceH = 4;
        const slices = gridSize / sliceH;
        
        for (let s = 0; s < slices; s++) {
            const shift = (Math.random() - 0.5) * 6;
            ctx.fillRect(-gridSize/2 + shift, -gridSize/2 + (s*sliceH), gridSize, sliceH - 1);
        }
        
        ctx.translate(-(seg.x + dx), -(seg.y + dy));
    }

    ctx.restore();
};
