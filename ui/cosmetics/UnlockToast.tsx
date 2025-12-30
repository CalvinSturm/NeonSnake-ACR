
import React, { useEffect, useState } from 'react';
import { COSMETIC_REGISTRY } from '../../game/cosmetics/CosmeticRegistry';
import { audio } from '../../utils/audio';

interface UnlockToastProps {
    queue: string[];
    onClear: () => void;
}

export const UnlockToast: React.FC<UnlockToastProps> = ({ queue, onClear }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 1. Queue Watcher: Promote next item if idle
    useEffect(() => {
        if (!activeId && queue.length > 0) {
            setActiveId(queue[0]);
        }
    }, [queue, activeId]);

    // 2. Toast Lifecycle Manager
    useEffect(() => {
        if (!activeId) return;

        const def = COSMETIC_REGISTRY[activeId];
        
        // Guard: Invalid ID
        if (!def) {
            setActiveId(null);
            onClear();
            return;
        }

        // A. Start Sequence
        audio.play('BONUS');
        
        // Small delay to ensure DOM is mounted with opacity-0 before transitioning
        const enterTimer = setTimeout(() => {
            setIsVisible(true);
        }, 50);

        // B. Exit Sequence
        const DURATION = 4000;
        const FADE_OUT = 500;

        const exitTimer = setTimeout(() => {
            setIsVisible(false);
        }, DURATION);

        // C. Cleanup Sequence
        const cleanupTimer = setTimeout(() => {
            // Critical: Clear local state FIRST to unmount the UI immediately
            setIsVisible(false);
            setActiveId(null);
            // Then notify parent to update queue
            onClear(); 
        }, DURATION + FADE_OUT);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
            clearTimeout(cleanupTimer);
        };
    }, [activeId]); 

    if (!activeId) return null;

    const def = COSMETIC_REGISTRY[activeId];
    if (!def) return null;

    return (
        <div 
            className={`
                fixed top-24 left-1/2 -translate-x-1/2 z-[100] 
                transition-all duration-500 ease-out transform pointer-events-none
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95'}
            `}
        >
            {/* Container */}
            <div className="bg-[#050505] border border-green-500/50 shadow-[0_0_30px_rgba(0,255,0,0.2)] p-1 min-w-[320px] rounded-sm relative overflow-hidden group">
                
                {/* Scanline BG */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none" />
                
                {/* Progress Bar (Visual timer) */}
                <div 
                    className={`absolute bottom-0 left-0 h-0.5 bg-green-500/50 transition-all ease-linear`}
                    style={{ 
                        width: isVisible ? '0%' : '100%', 
                        transitionDuration: isVisible ? '4000ms' : '0ms' 
                    }}
                />

                <div className="bg-green-950/20 backdrop-blur-md p-3 flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 border border-green-500/30 bg-black/50 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-xl filter drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">
                            {def.type === 'HUD' ? '🖥️' : '🎨'}
                        </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">
                                SYSTEM UNLOCK
                            </span>
                            <span className="text-[9px] text-green-600/70 font-mono">
                                [{def.type}]
                            </span>
                        </div>
                        
                        <div className="text-sm font-bold text-white font-mono truncate shadow-black drop-shadow-md">
                            {def.displayName}
                        </div>
                        
                        <div className="text-[10px] text-green-400/70 font-mono mt-0.5 leading-tight">
                            {def.description}
                        </div>
                    </div>
                </div>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500"></div>
            </div>
        </div>
    );
};
