
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Arcade6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade6Layout: React.FC<Arcade6LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#1a0525] overflow-hidden font-sans italic"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP BAR: VERSUS STYLE ── */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 flex justify-between items-start">
                
                {/* Left: Player Health (Slanted) */}
                <div className="flex flex-col w-[45%]">
                    <div className="flex justify-between items-end mb-1 px-2">
                        <span className="text-2xl font-black text-yellow-400 drop-shadow-[2px_2px_0_#000]">PLAYER 1</span>
                        <span className="text-sm font-bold text-white">LVL {data.progression.level}</span>
                    </div>
                    {/* Slanted Container */}
                    <div className="h-8 w-full bg-gray-900 border-2 border-white transform -skew-x-12 relative overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 transition-all duration-200"
                            style={{ width: `${data.vitals.integrity}%` }}
                        />
                        {/* Grid Pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:20px_100%]"></div>
                    </div>
                </div>

                {/* Center: Timer / Stage */}
                <div className="flex flex-col items-center -mt-2">
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_#fff]">
                        {data.progression.stage}
                    </div>
                    <div className="text-[10px] font-bold bg-pink-600 text-white px-2 rounded">STAGE</div>
                </div>

                {/* Right: Score (Slanted Reverse) */}
                <div className="flex flex-col w-[45%] items-end">
                    <div className="flex justify-between items-end mb-1 px-2 w-full">
                        <span className="text-sm font-bold text-white">HI: {data.score.high}</span>
                        <span className="text-2xl font-black text-cyan-400 drop-shadow-[2px_2px_0_#000]">SCORE</span>
                    </div>
                    <div className="h-8 w-full bg-gray-900 border-2 border-white transform skew-x-12 relative overflow-hidden shadow-[-4px_4px_0_rgba(0,0,0,0.5)] flex items-center justify-end px-4">
                        <span className="text-2xl font-bold text-white transform -skew-x-12">{data.score.current.toLocaleString()}</span>
                    </div>
                </div>

            </div>

            {/* ── COMBO BURST (Center) ── */}
            {data.score.combo > 1 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pink-600 blur-lg rounded-full opacity-50 animate-pulse"></div>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-300 drop-shadow-[4px_4px_0_#d946ef] rotate-[-5deg]">
                            {data.score.combo} HITS
                        </div>
                    </div>
                </div>
            )}

            {/* ── BOTTOM: SUPER METER ── */}
            <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end">
                
                {/* Super Gauge (XP) */}
                <div className="flex-1 mr-8">
                    <div className="text-xs font-black text-blue-400 mb-1 tracking-widest">EX GAUGE</div>
                    <div className="h-4 w-full bg-gray-900 border border-blue-500 rounded-full overflow-hidden relative">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_blue]"
                            style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Skills (Arcade Buttons) */}
                <div className="flex gap-3">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group">
                            <div className={`
                                w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.5)] transition-transform active:translate-y-1 active:shadow-none
                                ${w.active ? 'bg-gradient-to-b from-gray-700 to-gray-900 border-gray-400' : 'bg-gray-800 border-gray-600 opacity-50'}
                            `}>
                                <div className={`w-10 h-10 rounded-full ${w.active ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-gray-700'} flex items-center justify-center`}>
                                    <span className="text-white text-lg drop-shadow-md">{w.icon}</span>
                                </div>
                            </div>
                            {/* Key Hint */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">BTN {i+1}</div>
                        </div>
                    ))}
                </div>

            </div>
        </>
      )}
    </div>
  );
};
