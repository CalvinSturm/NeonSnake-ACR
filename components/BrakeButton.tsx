
import React, { useRef, useEffect } from 'react';
import { useGameState } from '../game/useGameState';
import { STAMINA_CONFIG } from '../constants';

export const BrakeButton: React.FC<{ game: ReturnType<typeof useGameState> }> = ({ game }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let rId: number;
        
        const loop = () => {
            // Poll refs for smooth 60fps updates without React render cycle
            const stamina = game.staminaRef.current;
            const cooldown = game.stopCooldownRef.current;
            const max = STAMINA_CONFIG.MAX;
            const pct = Math.max(0, Math.min(100, (stamina / max) * 100));
            
            if (fillRef.current) {
                // Animate height based on stamina
                fillRef.current.style.height = `${pct}%`;
                // Color shift: Yellow for ready, Red for cooldown
                fillRef.current.style.backgroundColor = cooldown ? '#ef4444' : '#eab308'; 
            }
            
            if (textRef.current) {
                textRef.current.innerText = cooldown ? 'WAIT' : 'BRAKE';
                textRef.current.style.color = cooldown ? '#fca5a5' : '#fef08a';
            }
            
            if (btnRef.current) {
                const borderColor = cooldown ? 'border-red-800' : 'border-yellow-600';
                // Only update class if strictly needed? 
                // To avoid thrashing classList, we can set style directly for dynamic props
                btnRef.current.style.borderColor = cooldown ? '#991b1b' : '#ca8a04';
            }

            rId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(rId);
    }, [game]);

    const handlePress = (pressed: boolean) => {
        game.stopIntentRef.current = pressed;
    };

    return (
        <button
            ref={btnRef}
            className="w-24 h-24 rounded-full border-4 flex items-center justify-center relative overflow-hidden touch-none select-none bg-black/40 backdrop-blur active:scale-95 transition-transform border-yellow-600"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePress(true); }}
            onPointerUp={(e) => { e.preventDefault(); handlePress(false); }}
            onPointerLeave={(e) => { e.preventDefault(); handlePress(false); }}
            onPointerCancel={(e) => { e.preventDefault(); handlePress(false); }}
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <div 
                ref={fillRef}
                className="absolute bottom-0 left-0 w-full opacity-50 pointer-events-none transition-colors duration-200"
                style={{ height: '100%', backgroundColor: '#eab308' }}
            />
            <span ref={textRef} className="font-bold text-lg pointer-events-none text-yellow-200 font-mono tracking-widest drop-shadow-md">
                BRAKE
            </span>
        </button>
    );
};
