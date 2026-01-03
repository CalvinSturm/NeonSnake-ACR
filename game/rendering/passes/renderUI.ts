
import { RenderContext } from '../types';
import { GameStatus } from '../../../types';

export const renderUI = (rc: RenderContext, status: GameStatus, transitionStartTime: number) => {
    const { ctx, width, height, now } = rc;

    // TRANSITION OVERLAY
    if (status === GameStatus.STAGE_TRANSITION) {
        const t = now - transitionStartTime;
        
        // Fade effect (Trails)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
        ctx.fillRect(0, 0, width, height);
        
        const cx = width / 2;
        const cy = height / 2;
        const bps = 1.0; 
        const beatPhase = (t / 1000) * bps; 
        const pulse = 1 + Math.pow(Math.sin(beatPhase * Math.PI), 10) * 0.2; 
        
        ctx.save();
        ctx.translate(cx, cy);
        
        const rotSpeed = 0.0005 + (Math.sin(beatPhase * 0.5) * 0.0002);
        ctx.rotate(t * rotSpeed);
        ctx.scale(pulse, pulse);
        
        const numRings = 16;
        const tunnelSpeed = 0.002; 
        const scroll = (t * tunnelSpeed) % 1;
        
        ctx.lineWidth = 2;
        
        for(let i=0; i<numRings; i++) {
            const depth = (i + scroll) / numRings; 
            const z = Math.pow(depth, 4); 
            if (z < 0.001) continue;
            
            const size = width * 2.5 * z;
            const hue = (180 + (t * 0.3) + (depth * 120)) % 360; 
            const alpha = depth * depth; 
            
            ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
            ctx.shadowBlur = 20 * z;
            ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha})`;
            ctx.strokeRect(-size/2, -size/2, size, size);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
};
