
import { RenderContext } from '../types';
import { COLORS } from '../../../constants';
import { CameraMode } from '../../../types';

export const renderFloor = (rc: RenderContext) => {
    const { ctx, camera, width, height, gridSize, now } = rc;

    if (camera.mode !== CameraMode.SIDE_SCROLL) return;

    const segmentWidth = gridSize * 10;
    const startSegment = Math.floor(camera.x / segmentWidth);
    const visibleSegments = Math.ceil(width / segmentWidth) + 1;

    ctx.save();
    
    // Floor Gradient
    const floorY = height - (gridSize * 2); // Floor level relative to play area
    
    for (let i = 0; i < visibleSegments; i++) {
        const segIdx = startSegment + i;
        const x = (segIdx * segmentWidth); // World X of segment start
        
        // Draw Floor Tile
        // Pattern logic: Alternate slightly
        const isAlt = segIdx % 2 === 0;
        
        ctx.fillStyle = isAlt ? '#0a0a0a' : '#0f0f0f';
        ctx.fillRect(x, 0, segmentWidth, height);
        
        // Grid Lines
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.1;
        
        ctx.beginPath();
        for(let gx = 0; gx < 10; gx++) {
            ctx.moveTo(x + gx * gridSize, 0);
            ctx.lineTo(x + gx * gridSize, height);
        }
        for(let gy = 0; gy < height/gridSize; gy++) {
             ctx.moveTo(x, gy * gridSize);
             ctx.lineTo(x + segmentWidth, gy * gridSize);
        }
        ctx.stroke();

        // Deco: Hazard markers on floor
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#333';
        if (segIdx % 3 === 0) {
            ctx.fillRect(x + gridSize, height - gridSize*4, gridSize*2, gridSize);
        }
    }
    
    ctx.restore();
};
