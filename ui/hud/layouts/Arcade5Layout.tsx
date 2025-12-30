
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Arcade5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade5Layout: React.FC<Arcade5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#1a0033] overflow-hidden font-sans italic"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── SPLATTER BACKGROUNDS ── */}
            {data.score.combo > 1 && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 opacity-50 scale-150 animate-pulse pointer-events-none">
                    <div className="text-[100px] font-black text-yellow-400 rotate-[-10deg] drop-shadow-[10px_10px_0_#ff00cc]">
                        {data.score.combo}X
                    </div>
                </div>
            )}

            {/* ── TOP LEFT: SCORE ── */}
            <div className="absolute top-6 left-6 z-20 transform -rotate-2">
                <div className="bg-yellow-400 text-black font-black px-4 py-1 text-sm inline-block shadow-[4px_4px_0_black]">
                    SCORE
                </div>
                <div className="text-5xl font-black text-white stroke-black drop-shadow-[4px_4px_0_#ff00cc]">
                    {data.score.current.toLocaleString()}
                </div>
            </div>

            {/* ── BOTTOM RIGHT: VITALS ── */}
            <div className="absolute bottom-6 right-6 z-20 flex items-end">
                <div className="relative">
                    <div className="absolute bottom-0 right-0 w-64 h-12 bg-black skew-x-[-20deg] shadow-[5px_5px_0_rgba(0,0,0,0.5)]"></div>
                    <div className="relative z-10 w-60 h-8 bg-gray-800 skew-x-[-20deg] mb-2 mr-2 overflow-hidden border-2 border-white">
                        <div 
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            style={{ width: `${data.vitals.integrity}%` }}
                        />
                    </div>
                    <div className="absolute -top-6 right-4 text-2xl font-black text-white italic drop-shadow-[2px_2px_0_black]">
                        HP {data.vitals.integrity}%
                    </div>
                </div>
            </div>

            {/* ── BOTTOM LEFT: WEAPONS ── */}
            <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="w-12 h-12 bg-black border-2 border-yellow-400 flex items-center justify-center transform hover:scale-110 transition-transform">
                        <div className={`text-2xl ${w.active ? 'text-white' : 'text-gray-600'}`}>{w.icon}</div>
                        <div className="absolute -top-2 -left-2 bg-pink-500 text-white text-xs font-bold px-1">{i+1}</div>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};
