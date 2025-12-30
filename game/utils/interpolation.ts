
import { Point } from '../../types';

export const getInterpolatedSegments = (
    snake: Point[],
    prevTail: Point | null,
    moveProgress: number,
    gridSize: number,
    halfGrid: number
): { x: number; y: number }[] => {
    const segments: { x: number; y: number }[] = [];
    
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        let prev = snake[i + 1]; 
        
        if (i === snake.length - 1) {
            prev = prevTail || curr;
        }
        
        let ix = curr.x;
        let iy = curr.y;

        if (prev) {
            ix = prev.x + (curr.x - prev.x) * moveProgress;
            iy = prev.y + (curr.y - prev.y) * moveProgress;
        }
        
        segments.push({ x: ix * gridSize + halfGrid, y: iy * gridSize + halfGrid });
    }
    
    return segments;
};
