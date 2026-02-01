
import React, { useRef, useEffect } from 'react';
import { renderSnake } from '../game/rendering/entities/renderSnake';
import { RenderContext } from '../game/rendering/types';
import { Direction, CameraMode } from '../types';
import { CameraBehavior } from '../game/camera/types';

interface SnakePreviewProps {
    snakeStyle: any;
    charColor?: string;
    characterId?: string;
}

export const SnakePreview: React.FC<SnakePreviewProps> = ({ snakeStyle, charColor = '#00ffff', characterId = 'striker' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const gridSize = 20;
        // Set internal resolution
        canvas.width = 460;
        canvas.height = 140; 
        
        const width = canvas.width;
        const height = canvas.height;
        
        const cx = Math.floor(width / gridSize / 2);
        const cy = Math.floor(height / gridSize / 2);

        // Static snake for preview
        const snake = [
            { x: cx + 1, y: cy },
            { x: cx, y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy },
            { x: cx - 3, y: cy }
        ];
        const prevTail = { x: cx - 4, y: cy };

        const stats = {
            shieldActive: false,
            weapon: {
                nanoSwarmLevel: 0,
                nanoSwarmCount: 0,
                // Dummy values for safety
                cannonLevel: 0, auraLevel: 0, mineLevel: 0,
                chainLightningLevel: 0, prismLanceLevel: 0,
                neonScatterLevel: 0, voltSerpentLevel: 0,
                phaseRailLevel: 0, reflectorMeshLevel: 0,
                ghostCoilLevel: 0, neuralMagnetLevel: 0,
                overclockLevel: 0, echoCacheLevel: 0
            }
        };

        const profile = { color: charColor, id: characterId };

        const render = (time: number) => {
            // Clear
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            // Grid
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x=0; x<width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
            for(let y=0; y<height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
            ctx.stroke();

            const rc: RenderContext = {
                ctx,
                now: time,
                gameTime: time,
                width,
                height,
                gridSize,
                halfGrid: gridSize / 2,
                stageReady: false,
                snakeStyle,
                stage: 1,
                bossActive: false,
                viewport: {
                    width,
                    height,
                    cols: Math.floor(width / gridSize),
                    rows: Math.floor(height / gridSize)
                },
                camera: {
                    mode: CameraMode.TOP_DOWN,
                    behavior: CameraBehavior.MANUAL,
                    x: 0,
                    y: 0,
                    zoom: 1,
                    tilt: 0,
                    isLocked: false,
                    scrollSpeed: 0,
                    targetMode: null,
                    transitionT: 0,
                    transitionDuration: 0
                }
            };

            renderSnake(
                rc,
                snake,
                prevTail,
                Direction.RIGHT,
                stats,
                profile,
                0, // moveProgress
                0, // visualNsAngle
                100, // tailIntegrity
                0, // phaseRailCharge
                0, // echoDamageStored
                0 // prismLanceTimer
            );

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationRef.current);
    }, [snakeStyle, charColor, characterId]);

    return (
        <div className="w-full h-36 rounded-md border border-gray-800 bg-black relative mb-4 overflow-hidden group shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-[10px] text-cyan-500 border border-cyan-900/50 rounded font-mono backdrop-blur-sm">
                VISUAL_PREVIEW // {snakeStyle}
            </div>
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
        </div>
    );
};
