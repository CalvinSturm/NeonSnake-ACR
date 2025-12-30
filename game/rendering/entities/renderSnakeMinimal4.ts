
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMinimal4 = (
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

    const points: {x:number, y:number}[] = [];
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
        points.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    ctx.save();
    
    // No lines. Just Characters.
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const word = "PROTOCOL_NULL"; // Or dynamic?
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const char = i === 0 ? '▲' : (word[ (i-1) % word.length ] || '•');
        
        ctx.save();
        ctx.translate(p.x, p.y);
        
        if (i === 0) {
            // Rotate head arrow
            let rot = 0;
            if (direction === 'DOWN') rot = Math.PI;
            if (direction === 'LEFT') rot = -Math.PI/2;
            if (direction === 'RIGHT') rot = Math.PI/2;
            ctx.rotate(rot);
        }
        
        const fillColor = i === 0 ? '#fff' : charColor;
        ctx.fillStyle = fillColor;
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = 10;
        
        ctx.fillText(char, 0, 0);
        
        ctx.restore();
    }

    ctx.restore();
};
