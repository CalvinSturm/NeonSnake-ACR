
import { RenderContext } from '../types';
import { useGameState } from '../../useGameState';
import { DEFAULT_SETTINGS } from '../../../constants';

export const renderDebug = (
    ctx: CanvasRenderingContext2D,
    game: ReturnType<typeof useGameState>,
    rc: RenderContext
) => {
    const flags = game.debugFlagsRef.current;
    if (!flags.showHitboxes && !flags.showPathing) return;

    const { gridSize, halfGrid } = rc;

    ctx.save();
    ctx.lineWidth = 1;
    
    // Reset transform to world space (without camera tilt/zoom for 2D overlay) or keep camera transform?
    // We want to draw on top of the world, so we need camera transform.
    // renderFrame has already applied camera transform in the play area stack.
    // However, `renderFrame` restores context before calling this if we call it outside.
    // Let's assume we are called INSIDE the camera transform block in renderFrame.

    // If flags.showHitboxes
    if (flags.showHitboxes) {
        // Draw Enemy Hitboxes
        game.enemiesRef.current.forEach(e => {
            const x = e.x * gridSize + halfGrid;
            const y = e.y * gridSize + halfGrid;
            
            ctx.strokeStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(x, y, gridSize * 0.4, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw Velocity Vector
            ctx.strokeStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + e.vx * 0.5, y + e.vy * 0.5);
            ctx.stroke();
        });

        // Draw Boss Hitboxes (Zones)
        game.hitboxesRef.current.forEach(h => {
             const x = (h.x - h.width/2) * gridSize;
             const y = (h.y - h.height/2) * gridSize;
             const w = h.width * gridSize;
             const ht = h.height * gridSize;
             
             ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
             ctx.fillRect(x, y, w, ht);
             ctx.strokeStyle = '#ff0000';
             ctx.strokeRect(x, y, w, ht);
        });

        // Draw Projectile Hitboxes
        game.projectilesRef.current.forEach(p => {
             ctx.strokeStyle = '#ffff00';
             ctx.beginPath();
             ctx.arc(p.x, p.y, p.size || 5, 0, Math.PI*2);
             ctx.stroke();
        });
    }
    
    // Draw Pathing / Grid
    if (flags.showPathing) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const cols = game.viewport.cols;
        const rows = game.viewport.rows;

        ctx.beginPath();
        for(let x=0; x<=cols; x++) {
            ctx.moveTo(x*gridSize, 0);
            ctx.lineTo(x*gridSize, rows*gridSize);
        }
        for(let y=0; y<=rows; y++) {
            ctx.moveTo(0, y*gridSize);
            ctx.lineTo(cols*gridSize, y*gridSize);
        }
        ctx.stroke();
        
        // Draw Wall Colliders
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        game.wallsRef.current.forEach(w => {
            ctx.fillRect(w.x * gridSize, w.y * gridSize, gridSize, gridSize);
        });
    }

    ctx.restore();
};
