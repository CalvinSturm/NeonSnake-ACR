
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';
import { drawBeveledRect } from '../primitives';

export const renderSnakeMech2 = (
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

    // "TANK" STYLE: Heavy, boxy segments with tread-like connectors
    const segments: { x: number, y: number, angle: number }[] = [];
    
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

    // Angles
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

    // Render Body (Reverse painter's)
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        const isHead = i === 0;
        const size = gridSize * (isHead ? 0.9 : 0.75);
        
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle);

        // Connector (Treads)
        if (!isHead) {
            ctx.fillStyle = '#222';
            ctx.fillRect(-size, -size*0.4, size*2, size*0.8);
            
            // Tread lines
            ctx.fillStyle = '#444';
            for(let j=0; j<3; j++) {
                const off = (j * 6) - 6 + ((now / 50) % 6);
                ctx.fillRect(off, -size*0.5, 2, size);
            }
        }

        // Heavy Plate
        drawBeveledRect(ctx, -size/2, -size/2, size, size, isHead ? charColor : '#333', true);
        
        // Inner detail
        if (isHead) {
            // Turret barrel
            ctx.fillStyle = '#111';
            ctx.fillRect(0, -size*0.2, size*0.8, size*0.4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(size*0.7, -size*0.1, 4, size*0.2);
        } else {
            // Rivets
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
};
