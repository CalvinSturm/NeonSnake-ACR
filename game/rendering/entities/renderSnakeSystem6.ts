
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeSystem6 = (
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
    
    // RGB Cycle
    const hue = (now * 0.1) % 360;
    const charColor = `hsl(${hue}, 100%, 50%)`;
    
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
    
    // LIQUID COOLING TUBING
    
    // 1. Tube glass (White semi-transparent)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    // 2. Liquid Core (RGB)
    ctx.strokeStyle = charColor;
    ctx.shadowColor = charColor;
    ctx.shadowBlur = 15;
    ctx.lineWidth = gridSize * 0.5;
    ctx.stroke();
    
    // 3. Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 0;
    
    // Simulate flow
    const flow = (now * 0.1) % 100;
    
    // We just scatter bubbles along the path relative to time
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        // One bubble per segment, moving
        const t = (flow + i * 10) % 100 / 100;
        const bx = p1.x + dx * t;
        const by = p1.y + dy * t;
        
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI*2);
        ctx.fill();
    }
    
    // 4. Fittings (Joints)
    ctx.fillStyle = '#888'; // Nickel plating
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.translate(p.x, p.y);
        
        ctx.fillRect(-gridSize*0.5, -gridSize*0.5, gridSize, gridSize);
        
        // Inner black hole for pipe
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, gridSize*0.45, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#888'; // Restore
        ctx.translate(-p.x, -p.y);
    }
    
    // 5. Pump Head
    const head = points[0];
    ctx.translate(head.x, head.y);
    ctx.fillStyle = '#222';
    ctx.fillRect(-10, -10, 20, 20);
    // Fan spin
    ctx.rotate(now * 0.01);
    ctx.fillStyle = charColor;
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillRect(-2, -8, 4, 16);

    ctx.restore();
};
