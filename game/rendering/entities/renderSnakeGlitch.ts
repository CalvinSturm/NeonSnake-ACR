
import { RenderContext } from '../types';
import { Point, Direction } from '../../../types';
import { COLORS } from '../../../constants';

export const renderSnakeGlitch = (
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
    
    const segments: { x: number, y: number }[] = [];
    
    // Calculate interpolated positions
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
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }

    const charColor = charProfile?.color || COLORS.snakeHead;

    // Draw Glitch Layers (RGB Shift)
    const layers = [
        { color: '#ff0000', offsetX: 3, offsetY: 0 },
        { color: '#00ff00', offsetX: -2, offsetY: 2 },
        { color: '#0000ff', offsetX: 0, offsetY: -3 },
        { color: charColor, offsetX: 0, offsetY: 0 } // Main layer
    ];

    layers.forEach((layer, layerIdx) => {
        ctx.save();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = gridSize * 0.7;
        ctx.lineCap = 'butt'; // Blocky ends
        ctx.lineJoin = 'miter';
        
        // Random jitter per layer per frame (simulated by time)
        // High frequency noise
        const jitterX = (Math.random() - 0.5) * (layerIdx === 3 ? 1 : 4);
        const jitterY = (Math.random() - 0.5) * (layerIdx === 3 ? 1 : 4);
        
        ctx.translate(layer.offsetX + jitterX, layer.offsetY + jitterY);
        
        // Global Alpha flicker for color layers
        if (layer.color !== charColor) {
            ctx.globalAlpha = 0.4 + Math.random() * 0.3;
            ctx.globalCompositeOperation = 'screen';
        }

        ctx.beginPath();
        if (segments[0]) ctx.moveTo(segments[0].x, segments[0].y);
        
        for (let i = 1; i < segments.length; i++) {
            // Randomly skip segments to simulate corruption/packet loss
            // Main layer skips less often
            const skipThreshold = layer.color === charColor ? 0.02 : 0.1;
            
            if (Math.random() > skipThreshold) {
                ctx.lineTo(segments[i].x, segments[i].y);
            } else {
                ctx.moveTo(segments[i].x, segments[i].y);
            }
        }
        ctx.stroke();
        
        // Draw blocks for head
        if (segments[0]) {
            ctx.fillStyle = layer.color;
            ctx.fillRect(segments[0].x - gridSize/2.5, segments[0].y - gridSize/2.5, gridSize*0.8, gridSize*0.8);
        }

        ctx.restore();
    });
};
