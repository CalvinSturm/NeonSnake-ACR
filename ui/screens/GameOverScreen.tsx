
import React, { useEffect, useState } from 'react';
import { audio } from '../../utils/audio';
import { COSMETIC_REGISTRY } from '../../game/cosmetics/CosmeticRegistry';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  stage: number;
  level: number;
  kills: number;
  failureReason: string;
  newUnlocks: string[];
  onRestart: () => void;
  onMenu: () => void;
  onCustomize: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  stage,
  level,
  kills,
  failureReason,
  newUnlocks,
  onRestart,
  onMenu,
  onCustomize
}) => {
  const [hexDump, setHexDump] = useState<string>('');
  const isNewHighScore = score > highScore;

  // Generate random hex dump background effect
  useEffect(() => {
    let str = '';
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < 400; i++) {
      str += chars[Math.floor(Math.random() * 16)];
      if (i % 2 === 1) str += ' ';
      if (i % 16 === 15) str += '\n';
    }
    setHexDump(str);
  }, []);

  return (
    <div className="absolute inset-0 z-[60] bg-red-950/95 flex flex-col items-center justify-center overflow-hidden select-none animate-in fade-in duration-300">
      
      {/* ── BACKGROUND FX ── */}
      <div className="absolute inset-0 pointer-events-none opacity-10 font-mono text-[10px] leading-tight text-red-500 whitespace-pre overflow-hidden">
        {hexDump}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none"></div>
      
      {/* ── MAIN CONTAINER ── */}
      <div className="relative z-10 w-full max-w-3xl p-8 flex flex-col items-center">
        
        {/* HEADER */}
        <div className="mb-6 text-center">
            <div className="text-red-500 font-mono text-sm tracking-[0.5em] mb-2 animate-pulse">
                CRITICAL_PROCESS_DIED
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[4px_4px_0_#450a0a] glitch-minor">
                FATAL ERROR
            </h1>
            <div className="mt-2 inline-block bg-black/60 border border-red-500/50 px-4 py-1 rounded text-red-300 font-mono text-xs">
                CODE: {failureMessageToHex(failureReason)}
            </div>
        </div>

        {/* STATS PANEL */}
        <div className="w-full bg-black/80 border-y-2 border-red-600 backdrop-blur-md p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl relative">
            {/* Decorative Brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

            {/* LEFT: PRIMARY SCORE */}
            <div className="flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-red-900/50 pb-6 md:pb-0 md:pr-6">
                <div className="text-xs font-bold text-red-500 tracking-widest mb-1">RUNTIME_SCORE</div>
                <div className={`text-5xl font-mono font-bold tracking-tight ${isNewHighScore ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                    {Math.floor(score).toLocaleString()}
                </div>
                {isNewHighScore && (
                    <div className="mt-2 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-2 py-0.5 border border-yellow-500/50">
                        NEW RECORD ESTABLISHED
                    </div>
                )}
                {!isNewHighScore && (
                    <div className="mt-2 text-red-400/50 text-xs font-mono">
                        HI-SCORE: {highScore.toLocaleString()}
                    </div>
                )}
            </div>

            {/* RIGHT: DIAGNOSTICS */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 content-center">
                <StatRow label="SECTOR_REACHED" value={stage.toString().padStart(2,'0')} />
                <StatRow label="THREATS_NEUTRALIZED" value={kills.toString()} />
                <StatRow label="SYSTEM_LEVEL" value={level.toString()} />
                <StatRow label="FAILURE_CAUSE" value={formatReason(failureReason)} isError />
            </div>
        </div>

        {/* REWARDS PANEL (Conditional) */}
        {newUnlocks.length > 0 && (
            <div className="w-full mt-4 bg-cyan-950/30 border border-cyan-500/30 p-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] mb-3 uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    Decrypted Protocols
                </div>
                <div className="flex flex-wrap gap-3">
                    {newUnlocks.map(id => {
                        const def = COSMETIC_REGISTRY[id];
                        if (!def) return null;
                        return (
                            <div key={id} className="flex items-center gap-3 bg-black/60 border border-cyan-800 px-3 py-2 rounded group">
                                <div className="text-lg">{def.type === 'HUD' ? '🖥️' : '🎨'}</div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-cyan-200 font-bold uppercase">{def.displayName}</span>
                                    <span className="text-[8px] text-cyan-600 font-mono">{def.type} MODULE</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 w-full max-w-lg">
            <button 
                onClick={onRestart}
                className="group relative flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 tracking-widest transition-all clip-button active:scale-95 text-center"
            >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-shine opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>REBOOT SYSTEM</span>
                    <span className="text-[10px] bg-white/20 px-1.5 rounded">[ENTER]</span>
                </span>
            </button>

            {newUnlocks.length > 0 && (
                 <button 
                    onClick={onCustomize}
                    className="flex-1 bg-cyan-900/40 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-300 font-bold py-4 px-4 tracking-widest transition-all clip-button text-xs text-center"
                >
                    ARMORY
                </button>
            )}

            <button 
                onClick={onMenu}
                className="flex-1 bg-transparent border border-red-800 hover:border-red-500 hover:bg-red-950/30 text-red-400 hover:text-red-200 font-bold py-4 px-4 tracking-widest transition-all clip-button text-xs text-center"
            >
                BIOS
            </button>
        </div>

        <div className="mt-6 text-[10px] text-red-900 font-mono">
            CORE DUMP SAVED TO /VAR/LOG/CRASH_{Date.now().toString(16).toUpperCase()}.DMP
        </div>

      </div>

      <style>{`
        .clip-button {
            clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
        @keyframes shine {
            0% { background-position: 100% 0; }
            100% { background-position: 0 100%; }
        }
        .animate-shine {
            animation: shine 0.5s linear forwards;
        }
      `}</style>
    </div>
  );
};

const StatRow = ({ label, value, isError = false }: { label: string, value: string, isError?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-[9px] text-red-700 font-bold tracking-wider">{label}</span>
        <span className={`font-mono text-lg ${isError ? 'text-red-400' : 'text-gray-300'}`}>{value}</span>
    </div>
);

const formatReason = (reason: string) => {
    return reason.replace(/_/g, ' ').substring(0, 12);
};

const failureMessageToHex = (msg: string) => {
    return '0x' + (msg.length * 1234).toString(16).toUpperCase().padStart(8, '0');
};
