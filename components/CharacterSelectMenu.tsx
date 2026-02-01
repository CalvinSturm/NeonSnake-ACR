
import React, { useState, useEffect } from 'react';
import { CHARACTERS } from '../constants';
import { CharacterProfile } from '../types';
import { SnakePreview } from './SnakePreview';
import { audio } from '../utils/audio';

interface CharacterSelectMenuProps {
    onSelect: (char: CharacterProfile) => void;
}

export const CharacterSelectMenu: React.FC<CharacterSelectMenuProps> = ({ onSelect }) => {
    const [selectedId, setSelectedId] = useState<string>(CHARACTERS[0].id);
    const selectedChar = CHARACTERS.find(c => c.id === selectedId) || CHARACTERS[0];

    const handleHover = (id: string) => {
        if (id !== selectedId) {
            audio.play('MOVE');
        }
    };

    const handleClick = (id: string) => {
        setSelectedId(id);
        audio.play('UI_HARD_CLICK');
    };

    const handleConfirm = () => {
        audio.play('CLI_BURST');
        onSelect(selectedChar);
    };

    // Helper to estimate stats for visual bars based on traits
    const getStatBars = (char: CharacterProfile) => {
        let speed = 50;
        let offense = 50;
        let defense = 30;
        let utility = 30;

        switch(char.id) {
            case 'striker': offense = 90; speed = 70; break;
            case 'spectre': utility = 90; speed = 60; defense = 20; break;
            case 'volt': offense = 80; utility = 60; break;
            case 'rigger': utility = 80; defense = 60; break;
            case 'bulwark': defense = 100; speed = 30; break;
            case 'overdrive': speed = 100; offense = 70; defense = 10; break;
        }

        return { speed, offense, defense, utility };
    };

    const stats = getStatBars(selectedChar);

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,50,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,50,0.1)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>
            
            <div className="relative w-full max-w-6xl h-full md:h-[80vh] bg-black/80 border border-gray-800 flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                
                {/* ── LEFT COLUMN: ROSTER ── */}
                <div className="w-full md:w-1/3 border-r border-gray-800 bg-gray-900/50 flex flex-col">
                    <div className="p-6 border-b border-gray-800">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Deployment</div>
                        <h2 className="text-2xl font-display font-bold text-white tracking-wider">OPERATOR_SELECT</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {CHARACTERS.map((char, index) => {
                            const isSelected = char.id === selectedId;
                            return (
                                <button
                                    key={char.id}
                                    onClick={() => handleClick(char.id)}
                                    onMouseEnter={() => handleHover(char.id)}
                                    className={`
                                        w-full p-4 border text-left transition-all duration-200 group relative overflow-hidden
                                        animate-in slide-in-from-left-4 fade-in duration-300 fill-mode-backwards
                                        ${isSelected 
                                            ? 'bg-white/5 border-l-4' 
                                            : 'bg-black/40 border-gray-800 border-l-2 hover:bg-white/5 hover:border-gray-600'}
                                    `}
                                    style={{
                                        borderColor: isSelected ? char.color : undefined,
                                        borderLeftColor: isSelected ? char.color : undefined,
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <div className={`text-lg font-bold font-display uppercase ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {char.name}
                                            </div>
                                            <div className="text-[10px] font-mono tracking-widest opacity-60" style={{ color: isSelected ? char.color : 'inherit' }}>
                                                {char.tag}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: char.color }}></div>
                                        )}
                                    </div>
                                    
                                    {/* Selection Glow */}
                                    {isSelected && (
                                        <div 
                                            className="absolute inset-0 opacity-10 pointer-events-none"
                                            style={{ backgroundColor: char.color }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT COLUMN: DETAILS ── */}
                <div className="flex-1 flex flex-col relative animate-in slide-in-from-right-8 fade-in duration-500 delay-150 fill-mode-backwards">
                    {/* Header */}
                    <div className="p-6 md:p-8 flex justify-between items-start border-b border-gray-800 bg-black/20">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black font-display text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {selectedChar.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 tracking-widest border border-white/10">
                                    CLASS: {selectedChar.tag}
                                </span>
                                <div className="h-px w-12 bg-gray-700"></div>
                                <span className="text-xs text-gray-400 font-mono">ID: {selectedChar.id.toUpperCase()}</span>
                            </div>
                        </div>
                        <div 
                            className="text-4xl opacity-20 font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent pointer-events-none"
                            style={{ textShadow: `0 0 50px ${selectedChar.color}` }}
                        >
                            0{CHARACTERS.indexOf(selectedChar) + 1}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="flex flex-col gap-8">
                            
                            {/* Visual Preview */}
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold tracking-widest mb-2 uppercase">Protocol Visualization</div>
                                <SnakePreview snakeStyle="AUTO" charColor={selectedChar.color} characterId={selectedChar.id} />
                                <p className="text-sm text-gray-400 italic border-l-2 border-gray-700 pl-4 py-1">
                                    "{selectedChar.description}"
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Stats Panel */}
                                <div className="flex-1 space-y-3">
                                    <StatBar label="OFFENSE" value={stats.offense} color={selectedChar.color} delay={200} />
                                    <StatBar label="DEFENSE" value={stats.defense} color={selectedChar.color} delay={250} />
                                    <StatBar label="SPEED" value={stats.speed} color={selectedChar.color} delay={300} />
                                    <StatBar label="UTILITY" value={stats.utility} color={selectedChar.color} delay={350} />
                                </div>

                                {/* Traits Panel */}
                                <div className="flex-1 bg-white/5 border border-gray-700 rounded p-4">
                                    <div className="text-[10px] text-gray-400 font-bold tracking-widest mb-3 uppercase">Combat Subroutines</div>
                                    <div className="space-y-4">
                                        {selectedChar.traits.map((trait, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${trait.type === 'MAJOR' ? 'bg-yellow-400 shadow-[0_0_8px_yellow]' : 'bg-gray-500'}`} />
                                                <div>
                                                    <div className={`text-xs font-bold ${trait.type === 'MAJOR' ? 'text-white' : 'text-gray-300'}`}>
                                                        {trait.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                        {trait.description}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-800 bg-black/40 flex justify-end gap-4 items-center">
                        <div className="hidden md:block mr-auto text-[10px] text-gray-600 font-mono">
                            SYSTEM_READY // AWAITING_INPUT
                        </div>
                        
                        <button 
                            onClick={handleConfirm}
                            className="
                                relative overflow-hidden group
                                bg-white text-black font-black font-display tracking-widest text-sm md:text-base
                                px-8 py-3 md:px-12 md:py-4 clip-button transition-all hover:scale-105 active:scale-95
                            "
                            style={{ 
                                boxShadow: `0 0 20px ${selectedChar.color}40`,
                            }}
                        >
                            <div 
                                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" 
                                style={{ backgroundColor: selectedChar.color }} 
                            />
                            INITIATE LINK
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

const StatBar: React.FC<{ label: string; value: number; color: string; delay: number }> = ({ label, value, color, delay }) => (
    <div className="flex items-center gap-4">
        <div className="w-16 text-[9px] font-bold text-gray-500 tracking-widest text-right">{label}</div>
        <div className="flex-1 h-2 bg-gray-800 rounded-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_3px)] z-10 opacity-30"></div>
            <div 
                className="h-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full"
                style={{ 
                    width: `${value}%`, 
                    backgroundColor: color, 
                    boxShadow: `0 0 10px ${color}60`,
                    animationDelay: `${delay}ms`,
                    animationFillMode: 'backwards'
                }}
            />
        </div>
        <div className="w-6 text-[9px] font-mono text-gray-400 text-right">{value}%</div>
    </div>
);
