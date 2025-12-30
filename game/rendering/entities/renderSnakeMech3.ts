
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeMech3 = (
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

    const segments: {x:number, y:number, angle:number}[] = [];
    
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
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid, angle: 0 });
    }

    // Angle Calculation
    for (let i = 0; i < segments.length; i++) {
        if (i === 0) {
            let rad = 0;
            switch(direction) {
                case 'RIGHT': rad = 0; break;
                case 'DOWN': rad = Math.PI/2; break;
                case 'LEFT': rad = Math.PI; break;
                case 'UP': rad = -Math.PI/2; break;
            }
            segments[i].angle = rad;
        } else {
            const prev = segments[i-1];
            const curr = segments[i];
            segments[i].angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        }
    }

    // Spine
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#111';
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#444';
    ctx.stroke();

    // Plates
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);
        
        if (isHead) {
            // Mandibles
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(10, 5); ctx.lineTo(20, 10); ctx.lineTo(5, 12);
            ctx.moveTo(10, -5); ctx.lineTo(20, -10); ctx.lineTo(5, -12);
            ctx.fill();
            
            // Heavy Helm
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(15, 0); ctx.lineTo(5, 10); ctx.lineTo(-10, 8); ctx.lineTo(-10, -8); ctx.lineTo(5, -10);
            ctx.fill();
            
            // Eye Slit
            ctx.fillStyle = charColor;
            ctx.shadowColor = charColor;
            ctx.shadowBlur = 10;
            ctx.fillRect(0, -3, 8, 6);
        } else {
            // Skeleton Ribs
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            
            // Ribs L
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-5, 12);
            ctx.stroke();
            
            // Ribs R
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-5, -12);
            ctx.stroke();
            
            // Central Piston
            ctx.fillStyle = i % 2 === 0 ? '#222' : '#111';
            ctx.fillRect(-6, -4, 12, 8);
            
            // Indicator Light
            if (i % 3 === 0) {
                ctx.fillStyle = charColor;
                ctx.shadowColor = charColor;
                ctx.shadowBlur = 5;
                ctx.fillRect(-2, -2, 4, 4);
            }
        }
        
        ctx.restore();
    }
};
