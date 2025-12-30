
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Arcade3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade3Layout: React.FC<Arcade3LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#110022] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── BACKGROUND PULSE ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0 scale-[0.9] border-4 border-pink-500 rounded-lg shadow-[0_0_30px_#ff00cc]">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── MASSIVE COMBO COUNTER (Center Top) ── */}
            {data.score.combo > 1 && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                    <div className="text-6xl font-black text-yellow-300 italic tracking-tighter drop-shadow-[4px_4px_0_#ff00cc] animate-bounce">
                        {data.score.combo}X
                    </div>
                    <div className="text-xl font-bold text-white uppercase tracking-widest bg-pink-600 px-4 py-1 -skew-x-12">
                        COMBO!
                    </div>
                </div>
            )}

            {/* ── SCORE TICKER (Bottom Center) ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-black/80 border-t-4 border-yellow-400 px-10 py-2 rounded-b-xl">
                <div className="text-4xl font-bold text-white font-mono tracking-widest text-center">
                    {data.score.current.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-400 text-center uppercase font-bold tracking-[0.5em] mt-1">
                    HIGH SCORE: {data.score.high}
                </div>
            </div>

            {/* ── SIDE BARS (Like Rhythm Game Lanes) ── */}
            {/* Left: Health Lane */}
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-black/50 border-r-2 border-pink-500 flex flex-col justify-end p-2 z-20">
                <div className="flex-1 w-full bg-gray-900 rounded-full relative overflow-hidden mb-4">
                    <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 to-pink-500 transition-all duration-200"
                        style={{ height: `${data.vitals.integrity}%` }}
                    />
                </div>
                <div className="text-center font-bold text-pink-500 rotate-[-90deg] mb-8">POWER</div>
            </div>

            {/* Right: Stage Lane */}
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-black/50 border-l-2 border-blue-500 flex flex-col p-2 z-20 items-center pt-8">
                <div className="text-center font-bold text-blue-500 mb-2">STAGE</div>
                <div className="text-3xl font-black text-white">{data.progression.stage}</div>
                <div className="mt-8 flex flex-col gap-2">
                    {data.loadout.weapons.map((w,i) => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-blue-600 shadow-[0_0_10px_blue] ${w.active ? 'scale-100' : 'scale-90 opacity-50 grayscale'}`}>
                            <span className="text-xs">{w.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
