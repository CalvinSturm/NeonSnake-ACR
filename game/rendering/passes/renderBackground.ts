
import { RenderContext } from '../types';
import { COLORS, GRID_COLS, GRID_ROWS } from '../../../constants';

export const renderBackground = (rc: RenderContext) => {
    const { ctx, width, height, now, gridSize, stageReady } = rc;
    
    // Note: This function is called within a Translated + Clipped context.
    // (0,0) is top-left of Play Area.
    // 'width' is canvas width.
    // 'height' passed in is Full Canvas Height, but we only draw up to GRID_ROWS * gridSize.

    const playHeight = GRID_ROWS * gridSize;

    // Grid Lines
    if (stageReady) {
        const pulse = Math.sin(now / 320) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.2})`;
        ctx.lineWidth = 1 + pulse;
    } else {
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15 + (Math.sin(now / 2000) * 0.05); // Breathing grid
    }

    ctx.beginPath();
    // Vertical
    for (let x = 0; x <= GRID_COLS; x += 1) {
      ctx.moveTo(x * gridSize, 0);
      ctx.lineTo(x * gridSize, playHeight);
    }
    // Horizontal
    for (let y = 0; y <= GRID_ROWS; y += 1) {
      ctx.moveTo(0, y * gridSize);
      ctx.lineTo(width, y * gridSize);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // Floor Glow (Center of Play Area)
    const g = ctx.createRadialGradient(width/2, playHeight/2, 0, width/2, playHeight/2, playHeight);
    g.addColorStop(0, 'rgba(0, 20, 40, 0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,playHeight);

    // Border Glow (Stage Ready)
    if (stageReady) {
        const pulse = Math.sin(now / 320) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.4})`;
        ctx.lineWidth = 4 + pulse * 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.strokeRect(0, 0, width, playHeight);
        ctx.shadowBlur = 0;
    }
};
