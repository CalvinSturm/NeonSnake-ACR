
import { Enemy } from '../../../types';
import { COLORS } from '../../../constants';

export const renderBarrier = (
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    gridSize: number,
    halfGrid: number,
    now: number
) => {
    // Barrier is vertical, height based on GRID_ROWS
    // Assuming pos is center.
    // Width is minimal, height is full screen roughly.
    
    const cx = e.x * gridSize + halfGrid;
    const cy = e.y * gridSize + halfGrid;
    
    const hpRatio = e.hp / e.maxHp;
    const flicker = Math.random() < (1 - hpRatio) * 0.5; // Flicker increases as HP drops
    
    if (flicker) return;

    ctx.save();
    
    // Hexagonal Field Effect
    const height = 30 * gridSize; // Tall
    const width = 1 * gridSize; 
    
    const grad = ctx.createLinearGradient(0, -height/2, 0, height/2);
    grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
    grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.4)');
    grad.addColorStop(0.8, 'rgba(0, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.translate(cx, cy);
    
    ctx.fillStyle = grad;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20 * hpRatio;
    
    // Main Field
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Hex Pattern Overlay
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * hpRatio})`;
    ctx.lineWidth = 2;
    
    const hexSize = 20;
    const rows = height / hexSize;
    
    ctx.beginPath();
    for(let i=0; i<rows; i++) {
        const y = -height/2 + (i * hexSize) + ((now * 0.05) % hexSize);
        // Simple honeycomb approximation lines
        ctx.moveTo(-width/2, y);
        ctx.lineTo(width/2, y + hexSize/2);
        ctx.lineTo(-width/2, y + hexSize);
    }
    ctx.stroke();
    
    // Cracks
    if (hpRatio < 0.8) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        
        const cracks = Math.floor((1 - hpRatio) * 10);
        
        ctx.beginPath();
        for(let i=0; i<cracks; i++) {
            const y = (Math.sin(i * 132 + now) * height/2);
            ctx.moveTo(0, y);
            ctx.lineTo((Math.random()-0.5)*30, y + (Math.random()-0.5)*30);
        }
        ctx.stroke();
    }
    
    ctx.restore();
};
