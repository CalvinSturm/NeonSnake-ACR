
import React, { useState } from 'react';
import { audio } from '../utils/audio';

interface TitleScreenProps {
    onStart: () => void;
    onArchive: () => void;
    onCosmetics: () => void;
    onSettings: () => void;
    hasUnreadArchive: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
    onStart, onArchive, onCosmetics, onSettings, hasUnreadArchive
}) => {
    const [transitionMode, setTransitionMode] = useState<'NONE' | 'ARCHIVE'>('NONE');

    const handleHover = () => {
        if (transitionMode === 'NONE') audio.play('MOVE');
    };

    const handleAction = (action: () => void, mode: 'STANDARD' | 'ARCHIVE' = 'STANDARD') => {
        if (transitionMode !== 'NONE') return;

        audio.play('UI_HARD_CLICK');
        
        if (mode === 'ARCHIVE') {
            setTransitionMode('ARCHIVE');
            audio.play('CLI_BURST'); // Data burst sound
            // Delay actual state change to allow animation to play
            setTimeout(action, 800);
        } else {
            action();
        }
    };

    const containerClasses = transitionMode === 'ARCHIVE' 
        ? 'opacity-0 scale-[3] blur-sm duration-700 ease-in' 
        : 'opacity-100 scale-100 duration-1000';

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020202] overflow-hidden select-none">
            
            {/* ── BACKGROUND ── */}
            {/* Animated Grid Floor */}
            <div className={`absolute inset-0 pointer-events-none opacity-20 transition-all ${containerClasses}`}
                style={{
                    backgroundImage: `
                        linear-gradient(transparent 95%, rgba(0, 255, 255, 0.3) 95%),
                        linear-gradient(90deg, transparent 95%, rgba(0, 255, 255, 0.3) 95%)
                    `,
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(60deg) translateY(0)',
                    animation: transitionMode === 'NONE' ? 'grid-scroll 3s linear infinite' : 'none'
                }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)] pointer-events-none" />
            
            {/* ── CONTENT ── */}
            <div className={`relative z-10 flex flex-col items-center w-full max-w-md gap-12 transition-all ${containerClasses}`}>
                
                {/* LOGO (Slide Down) */}
                <div className="text-center relative group cursor-default animate-in slide-in-from-top-10 fade-in duration-1000 delay-200 fill-mode-backwards">
                    <div className="absolute -inset-10 bg-cyan-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity" />
                    
                    <h1 className="text-7xl md:text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] relative z-10">
                        NEON
                        <br />
                        <span className="text-6xl md:text-7xl tracking-widest text-cyan-700/80 group-hover:text-cyan-500 transition-colors">SNAKE</span>
                    </h1>
                    
                    <div className="text-xs font-mono text-cyan-600 tracking-[1em] mt-4 uppercase border-t border-cyan-900/50 pt-2 opacity-80">
                        Cyber Protocol
                    </div>
                </div>

                {/* MENU (Staggered Entry from Bottom) */}
                <div className="w-full flex flex-col gap-3">
                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards" style={{ animationDelay: '400ms' }}>
                        <MenuButton onClick={() => handleAction(onStart)} onHover={handleHover} primary>
                            INITIATE RUN
                        </MenuButton>
                    </div>

                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards" style={{ animationDelay: '500ms' }}>
                         <MenuButton onClick={() => handleAction(onArchive, 'ARCHIVE')} onHover={handleHover}>
                            ARCHIVE
                            {hasUnreadArchive && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#0f0]" />
                            )}
                        </MenuButton>
                        
                        <MenuButton onClick={() => handleAction(onCosmetics)} onHover={handleHover}>
                            CUSTOMIZE
                        </MenuButton>
                    </div>

                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards" style={{ animationDelay: '600ms' }}>
                        <MenuButton onClick={() => handleAction(onSettings)} onHover={handleHover}>
                            SYSTEM CONFIG
                        </MenuButton>
                    </div>
                </div>

            </div>

            {/* ── FOOTER ── */}
            <div className={`absolute bottom-6 w-full text-center text-[10px] font-mono text-gray-600 tracking-widest uppercase animate-in fade-in duration-1000 delay-1000 ${transitionMode !== 'NONE' ? 'opacity-0' : 'opacity-100'}`}>
                <div>Neural Link Established • v2.1.0</div>
                <div className="mt-1 opacity-50">Authorized Personnel Only</div>
            </div>
            
            <style>{`
                @keyframes grid-scroll {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 40px; }
                }
            `}</style>
        </div>
    );
};

const MenuButton: React.FC<{ children: React.ReactNode, onClick: () => void, onHover: () => void, primary?: boolean }> = ({ children, onClick, onHover, primary }) => (
    <button
        onClick={onClick}
        onMouseEnter={onHover}
        className={`
            relative group overflow-hidden px-6 py-4 w-full text-left transition-all duration-200
            border-l-4 
            ${primary 
                ? 'bg-cyan-950/30 border-cyan-500 hover:bg-cyan-900/50' 
                : 'bg-black/40 border-gray-800 hover:bg-gray-900 hover:border-gray-500'}
        `}
    >
        {/* Hover Highlight */}
        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out skew-x-12" />
        
        <div className="relative z-10 flex justify-between items-center">
            <span className={`
                font-bold tracking-[0.2em] font-display text-sm md:text-base
                ${primary ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}
            `}>
                {children}
            </span>
            
            <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs ${primary ? 'text-cyan-400' : 'text-gray-500'}`}>
                {`>>`}
            </span>
        </div>
    </button>
);
