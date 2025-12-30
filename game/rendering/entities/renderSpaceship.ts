
import { Enemy } from '../../../types';
import { drawVolumetricThruster, drawShadow } from '../primitives';

export const renderSpaceship = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    gridSize: number,
    halfGrid: number,
    now: number
) => {
    // Facing Left by default
    const cx = e.x * gridSize + halfGrid;
    const cy = e.y * gridSize + halfGrid;
    
    const stateId = e.bossState?.stateId || 'IDLE';
    const isCharging = stateId === 'CHARGE_CANNON';
    const isFiring = stateId === 'FIRE_CANNON';
    
    const scale = 1.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    // Hover
    const hoverY = Math.sin(now / 800) * 5;
    ctx.translate(0, hoverY);

    // 1. Thrusters (Right Side)
    drawVolumetricThruster(ctx, 30, -10, 10, 40, '#00ffff', now);
    drawVolumetricThruster(ctx, 30, 10, 10, 40, '#00ffff', now, 100);

    // 2. Main Body (Sleek Interceptor)
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(40, 0);   // Rear Center
    ctx.lineTo(20, -20); // Rear Top
    ctx.lineTo(-10, -20); // Mid Top
    ctx.lineTo(-40, -5);  // Nose Top
    ctx.lineTo(-45, 0);   // Nose Tip
    ctx.lineTo(-40, 5);   // Nose Bot
    ctx.lineTo(-10, 20);  // Mid Bot
    ctx.lineTo(20, 20);   // Rear Bot
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 3. Cannon Glow (Charging)
    if (isCharging) {
        const charge = (Math.sin(now / 50) + 1) * 0.5;
        const radius = 5 + (charge * 15);
        
        ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + charge * 0.5})`;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20 + (charge * 20);
        
        ctx.beginPath();
        ctx.arc(-45, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 4. Beam (Firing)
    if (isFiring) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff00ff'; // Magenta Beam
        ctx.fillRect(-800, -2, 800, 4); // Infinite beam to left
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(-800, 0);
        ctx.stroke();
    }
    
    // 5. Cockpit
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(10, -5);
    ctx.lineTo(15, 0);
    ctx.lineTo(10, 5);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
};
