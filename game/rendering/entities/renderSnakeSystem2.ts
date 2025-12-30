
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem2 = (
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

    // HEXAGON RENDERING
    const drawHex = (x: number, y: number, r: number, color: string, fill: boolean) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3;
            const hx = x + Math.cos(ang) * r;
            const hy = y + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    };

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isHead = i === 0;
        
        // Spin
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(isHead ? now * 0.002 : 0);
        
        const size = gridSize * 0.5;
        
        // Outer Hex
        ctx.shadowColor = charColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        drawHex(0, 0, size, charColor, false);
        
        // Inner Hex
        ctx.globalAlpha = 0.5;
        drawHex(0, 0, size * 0.6, charColor, true);
        
        if (isHead) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -2, 4, 4);
        }

        ctx.restore();
    }
};
