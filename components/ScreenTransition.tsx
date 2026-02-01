
import React, { useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { STAGE_NAMES } from '../constants';
import { audio } from '../utils/audio';

interface ScreenTransitionProps {
    status: GameStatus;
    stage: number;
    difficulty: string;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({ status, stage, difficulty }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [displayInfo, setDisplayInfo] = useState({ stage, name: '', difficulty });
    const [decodeText, setDecodeText] = useState('');
    const [progress, setProgress] = useState(0);

    // Capture stage info on transition start
    useEffect(() => {
        if (status === GameStatus.STAGE_TRANSITION) {
            const name = STAGE_NAMES[(stage - 1) % STAGE_NAMES.length] || 'UNKNOWN SECTOR';
            setDisplayInfo({ stage, name, difficulty });
            setIsVisible(true);
            setShouldRender(true);
            setProgress(0);
            
            // Text Decoding Effect
            let iter = 0;
            const targetText = name;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@&%';
            
            const interval = setInterval(() => {
                const current = targetText
                    .split('')
                    .map((char, index) => {
                        if (index < iter) return char;
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');
                
                setDecodeText(current);
                if (iter >= targetText.length) clearInterval(interval);
                iter += 1/2; // Slow down reveal
            }, 30);

            // Fake Loading Bar
            const progInterval = setInterval(() => {
                setProgress(p => Math.min(100, p + (Math.random() * 5)));
            }, 30);
            
            audio.play('CLI_BURST'); // Transition sound

            return () => {
                clearInterval(interval);
                clearInterval(progInterval);
            };
        } else {
            setIsVisible(false);
        }
    }, [status, stage, difficulty]);

    useEffect(() => {
        if (!isVisible) {
            const timer = setTimeout(() => setShouldRender(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Hyperspace Background */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,#00ffff_50%,transparent_100%)] bg-[length:4px_100%] animate-hyperspace opacity-20" />
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_80%)]" />
            </div>

            {/* Central Info Block */}
            <div className={`relative z-10 flex flex-col items-center gap-2 transform transition-all duration-700 ${isVisible ? 'scale-100 translate-y-0' : 'scale-110 translate-y-10'}`}>
                
                <div className="text-cyan-600 font-mono text-xs tracking-[0.5em] uppercase mb-4 animate-pulse">
                    initiating_jump
                </div>

                <div className="relative">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tracking-tighter leading-none font-display">
                        {displayInfo.stage.toString().padStart(2, '0')}
                    </h1>
                    <div className="absolute -top-4 -right-8 text-xs font-bold text-cyan-500 bg-cyan-950/50 px-2 py-0.5 border border-cyan-800 rounded">
                        SECTOR
                    </div>
                </div>

                <div className="h-px w-32 bg-cyan-800 my-4" />

                <div className="text-2xl font-bold text-cyan-400 font-mono tracking-widest uppercase glitch-minor">
                    {decodeText}
                </div>

                <div className="text-xs text-gray-500 font-mono mt-2">
                    THREAT LEVEL: <span className="text-white">{displayInfo.difficulty}</span>
                </div>

            </div>

            {/* Loading Bar at Bottom */}
            <div className="absolute bottom-20 w-64">
                <div className="flex justify-between text-[9px] text-cyan-700 font-mono mb-1">
                    <span>LOADING_ASSETS</span>
                    <span>{Math.floor(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" 
                        style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes hyperspace {
                    0% { transform: scaleX(1); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: scaleX(50); opacity: 0; }
                }
                .animate-hyperspace {
                    animation: hyperspace 0.5s linear infinite;
                }
            `}</style>
        </div>
    );
};
