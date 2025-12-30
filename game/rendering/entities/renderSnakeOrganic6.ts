
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeOrganic6 = (
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // GIGER-ESQUE BIOMECHANICAL
    
    // 1. Ribbed Tubing (Underlayer)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = gridSize * 0.9;
    
    // Draw segmented ribs along spline
    // We iterate points and draw cross-lines
    for(let i=0; i<points.length; i++) {
        const p = points[i];
        // Calculate tangent for perpendicular
        let angle = 0;
        if (i < points.length - 1) {
            angle = Math.atan2(points[i+1].y - p.y, points[i+1].x - p.x);
        } else if (i > 0) {
            angle = Math.atan2(p.y - points[i-1].y, p.x - points[i-1].x);
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        
        // Rib
        ctx.fillStyle = '#111';
        ctx.fillRect(0, -gridSize*0.4, 4, gridSize*0.8);
        
        ctx.restore();
    }
    
    // 2. Top Carapace (Glossy Black)
    ctx.lineWidth = gridSize * 0.6;
    ctx.strokeStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const midX = (points[i].x + points[i-1].x) / 2;
        const midY = (points[i].y + points[i-1].y) / 2;
        ctx.quadraticCurveTo(midX, midY, points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // 3. Highlight (Wet Look)
    ctx.lineWidth = gridSize * 0.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();
    
    // 4. Acid Blood (Glow from inside)
    ctx.globalCompositeOperation = 'source-atop';
    const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(0, 255, 0, ${pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 5. Head (Xenomorph)
    const head = points[0];
    const headNext = points[1] || { x: head.x + 10, y: head.y };
    const headAngle = Math.atan2(head.y - headNext.y, head.x - headNext.x); // Point away from body
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(head.x, head.y);
    ctx.rotate(headAngle);
    
    // Elongated Skull
    const grad = ctx.createLinearGradient(0, 0, 40, 0);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.ellipse(10, 0, 25, 10, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Teeth (Silver)
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(25, -5); ctx.lineTo(30, -2); ctx.lineTo(25, -2);
    ctx.moveTo(25, 5); ctx.lineTo(30, 2); ctx.lineTo(25, 2);
    ctx.fill();

    ctx.restore();
};
