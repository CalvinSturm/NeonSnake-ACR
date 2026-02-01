
import React, { useState } from 'react';
import { DIFFICULTY_CONFIGS } from '../constants';
import { Difficulty } from '../types';
import { audio } from '../utils/audio';

interface DifficultySelectMenuProps {
    unlockedDifficulties: Difficulty[];
    onSelect: (diff: Difficulty) => void;
    onBack: () => void;
}

export const DifficultySelectMenu: React.FC<DifficultySelectMenuProps> = ({ unlockedDifficulties, onSelect, onBack }) => {
    const [selectedId, setSelectedId] = useState<Difficulty>(Difficulty.EASY);
    const selectedDiff = DIFFICULTY_CONFIGS[selectedId];

    const handleHover = (id: Difficulty) => {
        if (id !== selectedId) {
            audio.play('MOVE');
        }
    };

    const handleClick = (id: Difficulty) => {
        setSelectedId(id);
        audio.play('UI_HARD_CLICK');
    };

    const handleConfirm = () => {
        audio.play('CLI_BURST');
        onSelect(selectedId);
    };

    // Helper for stat bars
    const renderStatBar = (label: string, value: number, max: number, color: string, inverse: boolean = false) => {
        let pct = (value / max) * 100;
        if (inverse) {
            pct = Math.min(100, Math.max(10, ((2.0 - value) / 1.5) * 100));
        } else {
             pct = Math.min(100, Math.max(10, pct));
        }

        return (
            <div className="flex flex-col gap-1 mb-3">
                <div className="flex justify-between text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                    <span>{label}</span>
                </div>
                <div className="h-2 w-full bg-gray-900/50 border border-gray-800 rounded-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.8)_2px,rgba(0,0,0,0.8)_4px)] z-10 opacity-30"></div>
                    <div 
                        className="h-full transition-all duration-300 ease-out relative"
                        style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,0,0,0.1)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

            <div className="relative w-full max-w-5xl h-full md:h-[80vh] bg-black/80 border border-red-900/30 flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                
                {/* ── LEFT: SELECTION LIST ── */}
                <div className="w-full md:w-1/3 border-r border-red-900/30 bg-black/60 flex flex-col">
                    <div className="p-6 border-b border-red-900/30 bg-red-950/10">
                        <div className="text-[10px] text-red-700 font-bold tracking-widest uppercase mb-1">Risk Assessment</div>
                        <h2 className="text-2xl font-display font-bold text-red-500 tracking-wider">SELECT THREAT</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {Object.values(DIFFICULTY_CONFIGS).map((diff, index) => {
                            const isUnlocked = unlockedDifficulties.includes(diff.id);
                            const isSelected = diff.id === selectedId;
                            const baseColor = diff.color.split('-')[1];

                            return (
                                <button
                                    key={diff.id}
                                    onClick={() => handleClick(diff.id)}
                                    onMouseEnter={() => handleHover(diff.id)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className={`
                                        w-full p-4 border-l-4 text-left transition-all duration-200 group relative overflow-hidden flex flex-col gap-1
                                        animate-in slide-in-from-left-4 fade-in duration-300 fill-mode-backwards
                                        ${isSelected 
                                            ? `bg-${baseColor}-950/20 border-${baseColor}-500` 
                                            : 'bg-black/40 border-gray-800 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className={`text-lg font-bold font-display tracking-widest transition-colors ${isSelected ? 'text-white' : (isUnlocked ? diff.color : 'text-gray-600')}`}>
                                            {diff.label}
                                        </span>
                                        {!isUnlocked && <span className="text-[9px] bg-gray-900 text-gray-500 px-2 py-0.5 rounded border border-gray-700">LOCKED</span>}
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-500 truncate relative z-10">
                                        {diff.description}
                                    </div>
                                    
                                    {/* Selection Glow */}
                                    {isSelected && <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-${baseColor}-500/10 pointer-events-none`}></div>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-red-900/30">
                         <button onClick={onBack} className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-600 transition-all uppercase tracking-widest">
                            [ Abort Mission ]
                         </button>
                    </div>
                </div>

                {/* ── RIGHT: DETAILS ── */}
                <div className="flex-1 flex flex-col relative bg-gradient-to-br from-black to-[#0a0505] animate-in fade-in duration-500 delay-150 fill-mode-backwards">
                    {/* Header */}
                    <div className="p-8 border-b border-red-900/20 flex justify-between items-start relative overflow-hidden">
                        {/* Background Splatter */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedDiff.color.split('-')[1]}-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-4xl md:text-5xl font-black font-display tracking-tighter uppercase ${selectedDiff.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                                    {selectedDiff.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 font-mono border-l-2 border-gray-800 pl-4 py-1 max-w-md leading-relaxed">
                                {selectedDiff.description}
                            </p>
                        </div>
                        <div className="text-8xl font-black text-white/5 pointer-events-none font-display absolute right-4 top-2">
                            0{Object.values(DIFFICULTY_CONFIGS).indexOf(selectedDiff) + 1}
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            
                            {/* Stats Column */}
                            <div className="space-y-6">
                                <div className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    Hostile Parameters
                                </div>
                                
                                {renderStatBar('THREAT DENSITY', selectedDiff.spawnRateMod, 0, '#ef4444', true)} 
                                {renderStatBar('UNIT DURABILITY', selectedDiff.hpMod, 2.5, '#f97316')}
                                {renderStatBar('MOVEMENT SPEED', selectedDiff.speedMod, 1.5, '#eab308')}
                                {renderStatBar('AI AGGRESSION', selectedDiff.aiAggressionMod || 1.0, 1.5, '#ec4899')}
                                
                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-gray-900/30 border border-gray-800 p-3 rounded flex flex-col items-center">
                                        <div className="text-[9px] text-green-600 font-bold uppercase mb-1">XP Gain</div>
                                        <div className="text-xl font-mono text-green-400">x{selectedDiff.xpMultiplier}</div>
                                    </div>
                                    <div className="bg-gray-900/30 border border-gray-800 p-3 rounded flex flex-col items-center">
                                        <div className="text-[9px] text-yellow-600 font-bold uppercase mb-1">Loot Rate</div>
                                        <div className="text-xl font-mono text-yellow-400">x{selectedDiff.lootSpawnRate}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Column */}
                            <div className="space-y-6">
                                <div className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Encounter Profile
                                </div>

                                <div className="bg-[#0f0505] border border-gray-800 p-4 rounded">
                                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-3">Detected Signatures</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDiff.allowedEnemies.map(e => (
                                            <span key={e} className="text-[10px] px-2 py-1 bg-gray-900 text-gray-300 border border-gray-700 rounded uppercase font-mono tracking-wide">
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#0f0505] border border-gray-800 p-4 rounded">
                                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">Operation Parameters</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-gray-800/50 pb-1">
                                            <span>Target Sector</span>
                                            <span className="text-white font-bold">{selectedDiff.stageGoal === 999 ? 'UNBOUNDED' : selectedDiff.stageGoal}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                                            <span>Boss Scalar</span>
                                            <span className="text-red-400 font-bold">x{selectedDiff.bossHpMod}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {!unlockedDifficulties.includes(selectedId) && (
                                    <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-xs font-bold text-center uppercase tracking-widest animate-pulse">
                                        LOCKED: {selectedDiff.unlockCondition}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-gray-800 bg-black/40 flex justify-end items-center gap-4">
                        <div className="hidden md:block mr-auto text-[10px] text-gray-600 font-mono">
                            CONFIRM_PROTOCOL_SELECTION // {selectedId}
                        </div>

                         <button 
                            onClick={handleConfirm}
                            disabled={!unlockedDifficulties.includes(selectedId)}
                            className={`
                                group relative px-8 md:px-12 py-4 font-black font-display tracking-widest uppercase transition-all
                                ${unlockedDifficulties.includes(selectedId) 
                                    ? `bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95` 
                                    : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'}
                                clip-button
                            `}
                        >
                            {unlockedDifficulties.includes(selectedId) ? 'INITIATE PROTOCOL' : 'ACCESS DENIED'}
                        </button>
                    </div>
                </div>

            </div>

            <style>{`
                .clip-button {
                    clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
                }
            `}</style>
        </div>
    );
};
