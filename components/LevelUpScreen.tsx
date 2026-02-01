
import React, { useEffect, useState } from 'react';
import { UpgradeOption, UpgradeRarity } from '../types';
import { audio } from '../utils/audio';

interface LevelUpScreenProps {
    options: UpgradeOption[];
    onSelect: (id: string, rarity: any) => void;
}

const getRarityStyles = (rarity: UpgradeRarity) => {
    switch (rarity) {
        case 'COMMON': return {
            border: 'border-slate-700',
            bg: 'bg-slate-900',
            glow: 'shadow-none',
            titleColor: 'text-slate-300',
            descColor: 'text-slate-400',
            badge: 'bg-slate-800 text-slate-400 border-slate-700',
            decor: null
        };
        case 'UNCOMMON': return {
            border: 'border-emerald-600/50',
            bg: 'bg-[#061c10]',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
            titleColor: 'text-emerald-300',
            descColor: 'text-emerald-400/80',
            badge: 'bg-emerald-950 text-emerald-400 border-emerald-800',
            decor: null
        };
        case 'RARE': return {
            border: 'border-cyan-500',
            bg: 'bg-[#081a25]',
            glow: 'shadow-[0_0_25px_rgba(6,182,212,0.2)]',
            titleColor: 'text-cyan-200',
            descColor: 'text-cyan-300/80',
            badge: 'bg-cyan-950 text-cyan-300 border-cyan-600',
            decor: 'bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_70%)]'
        };
        case 'ULTRA_RARE': return {
            border: 'border-purple-500',
            bg: 'bg-[#1a0b2e]',
            glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
            titleColor: 'text-purple-200',
            descColor: 'text-purple-300/80',
            badge: 'bg-purple-950 text-purple-300 border-purple-500',
            decor: 'bg-[conic-gradient(from_90deg,transparent_0,rgba(168,85,247,0.1)_180deg,transparent_360deg)] animate-spin-slow'
        };
        case 'MEGA_RARE': return {
            border: 'border-pink-500',
            bg: 'bg-[#2a0b1e]',
            glow: 'shadow-[0_0_35px_rgba(236,72,153,0.4)]',
            titleColor: 'text-pink-200',
            descColor: 'text-pink-300/80',
            badge: 'bg-pink-950 text-pink-300 border-pink-500',
            decor: 'bg-[linear-gradient(45deg,transparent,rgba(236,72,153,0.1),transparent)] bg-[length:200%_200%] animate-pulse'
        };
        case 'LEGENDARY': return {
            border: 'border-yellow-400',
            bg: 'bg-[#1a1500]',
            glow: 'shadow-[0_0_50px_rgba(250,204,21,0.5)]',
            titleColor: 'text-yellow-100',
            descColor: 'text-yellow-200/80',
            badge: 'bg-gradient-to-r from-yellow-700 to-yellow-500 text-black font-bold border-yellow-300',
            decor: 'foil-shine' 
        };
        case 'OVERCLOCKED': return {
            border: 'border-red-600',
            bg: 'bg-black',
            glow: 'shadow-[0_0_60px_rgba(220,38,38,0.6)]',
            titleColor: 'text-red-500',
            descColor: 'text-red-400',
            badge: 'bg-red-600 text-black font-black border-red-500 animate-pulse',
            decor: 'glitch-bg'
        };
        default: return getRarityStyles('COMMON');
    }
};

export const LevelUpScreen: React.FC<LevelUpScreenProps> = ({ options, onSelect }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        audio.play('UI_HARD_CLICK'); 
    }, []);

    const handleHover = (idx: number) => {
        if (hoveredIdx !== idx) {
            setHoveredIdx(idx);
            audio.play('MOVE');
        }
    };

    const handleSelect = (idx: number) => {
        const opt = options[idx];
        audio.play(opt.rarity === 'LEGENDARY' || opt.rarity === 'OVERCLOCKED' ? 'BONUS' : 'POWER_UP');
        onSelect(opt.id, opt.rarity);
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-8 pointer-events-auto overflow-y-auto custom-scrollbar">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" />
            
            {/* Container for content to ensure it scrolls if screen is too short */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col items-center min-h-0 my-auto">
                
                {/* Header */}
                <div className="text-center mb-8 animate-in slide-in-from-top-10 fade-in duration-500 shrink-0">
                    <div className="inline-block border-y-2 border-cyan-500/50 bg-black/60 px-10 py-3 mb-3 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                        <h2 className="text-3xl md:text-5xl font-black font-display text-cyan-400 tracking-widest drop-shadow-[0_0_10px_cyan]">
                            SYSTEM UPGRADE
                        </h2>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs font-mono text-cyan-600 tracking-[0.3em]">
                        <span className="w-16 h-px bg-cyan-800"></span>
                        <span className="animate-pulse">SELECT PROTOCOL</span>
                        <span className="w-16 h-px bg-cyan-800"></span>
                    </div>
                </div>

                {/* Cards Container */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch justify-center pb-8 md:pb-0 px-4 md:px-0">
                    {options.map((opt, idx) => {
                        const style = getRarityStyles(opt.rarity);
                        const isHovered = hoveredIdx === idx;

                        return (
                            <button
                                key={`${opt.id}-${idx}`}
                                onClick={() => handleSelect(idx)}
                                onMouseEnter={() => handleHover(idx)}
                                onFocus={() => handleHover(idx)}
                                className={`
                                    relative group flex flex-col text-left transition-all duration-300 ease-out transform
                                    border-2 rounded-xl overflow-hidden min-h-[320px] w-full
                                    ${style.border} ${style.bg} ${style.glow}
                                    ${isHovered ? 'scale-[1.03] -translate-y-2 z-20 ring-2 ring-white/20' : 'scale-100 hover:brightness-110'}
                                `}
                            >
                                {/* Decorative Backgrounds */}
                                {style.decor === 'foil-shine' && (
                                    <div className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,215,0,0.3)_120deg,transparent_240deg)] animate-[spin_6s_linear_infinite]" />
                                )}
                                {style.decor === 'glitch-bg' && (
                                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ff0000_2px,#ff0000_4px)] animate-pulse" />
                                )}
                                {style.decor && !['foil-shine', 'glitch-bg'].includes(style.decor) && (
                                    <div className={`absolute inset-0 pointer-events-none ${style.decor}`} />
                                )}

                                {/* Rarity Badge (Top Right) */}
                                <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase rounded-bl-xl z-20 border-l border-b ${style.badge}`}>
                                    {opt.rarity.replace('_', ' ')}
                                </div>

                                {/* Hotkey (Top Left) */}
                                <div className="absolute top-4 left-4 z-20">
                                    <div className={`w-8 h-8 flex items-center justify-center border bg-black/50 text-xs font-mono font-bold rounded ${style.border} ${style.titleColor}`}>
                                        {idx + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
                                    
                                    {/* Icon & Category */}
                                    <div className="flex flex-col items-center mt-6 mb-6">
                                        <div className={`
                                            w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-2xl mb-4
                                            bg-black/40 border-2 ${style.border}
                                            group-hover:scale-110 transition-transform duration-300
                                        `}>
                                            {opt.icon}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-widest font-bold opacity-80 ${style.descColor}`}>
                                            {opt.category} MODULE
                                        </div>
                                    </div>

                                    {/* Title & Desc */}
                                    <div className="text-center mb-6">
                                        <h3 className={`text-2xl font-black font-display uppercase mb-3 leading-tight ${style.titleColor}`}>
                                            {opt.title}
                                        </h3>
                                        <div className={`text-xs font-mono leading-relaxed opacity-90 ${style.descColor}`}>
                                            {opt.description}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="mt-auto grid grid-cols-1 gap-2 w-full">
                                        {opt.stats?.map((stat, i) => (
                                            <div 
                                                key={i} 
                                                className={`
                                                    px-3 py-2 bg-black/40 border rounded text-xs font-bold text-center font-mono
                                                    ${style.border} ${style.titleColor}
                                                `}
                                            >
                                                {stat}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shine Effect on Hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:animate-shine" />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 text-[10px] text-gray-500 font-mono animate-pulse">
                    PRESS [1] [2] [3] TO SELECT
                </div>

            </div>

            <style>{`
                @keyframes shine {
                    100% { transform: translateX(100%); }
                }
                .animate-shine {
                    animation: shine 0.75s;
                }
            `}</style>
        </div>
    );
};
