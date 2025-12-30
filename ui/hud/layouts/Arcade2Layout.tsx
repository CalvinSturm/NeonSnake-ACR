
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Arcade2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade2Layout: React.FC<Arcade2LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#111] overflow-hidden font-mono flex items-center justify-center"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── CABINET BEZEL ART ── */}
      <div className="absolute inset-0 z-50 pointer-events-none">
          {/* Wood Grain / Plastic Texture */}
          <div className="absolute inset-0 border-[40px] border-[#222] shadow-[inset_0_0_20px_black] rounded-xl"></div>
          
          {/* Screen Glare */}
          <div className="absolute inset-[40px] rounded-lg bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
          
          {/* CRT Curvature Shadow */}
          <div className="absolute inset-[40px] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] pointer-events-none rounded-lg"></div>
      </div>

      {/* ── GAME CONTAINER (Shrunk slightly to fit bezel) ── */}
      <div className="relative w-[calc(100%-80px)] h-[calc(100%-80px)] overflow-hidden bg-black rounded-lg">
          
          {/* CRT Scanlines Overlay (Intense) */}
          <div className="absolute inset-0 pointer-events-none z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-20"></div>
          
          {/* ── GAME LAYER ── */}
          <div className="absolute inset-0 z-0 scale-[1.02]">
              {children}
          </div>

          {/* ── ARCADE UI ── */}
          {showUI && (
            <>
                {/* COIN INSERT */}
                <div className="absolute top-4 left-4 z-20 text-red-500 font-black text-xl animate-pulse tracking-widest drop-shadow-[2px_2px_0_white]">
                    INSERT COIN
                </div>

                {/* SCORE MARQUEE */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-900/80 border-2 border-white px-6 py-1 -skew-x-12 shadow-[4px_4px_0_black]">
                    <div className="text-center transform skew-x-12">
                        <span className="block text-xs text-yellow-300 font-bold">1UP SCORE</span>
                        <span className="text-2xl text-white font-bold tracking-widest">{data.score.current}</span>
                    </div>
                </div>

                {/* HIGH SCORE */}
                <div className="absolute top-4 right-4 z-20 text-right">
                    <div className="text-xs text-blue-400 font-bold">HI-SCORE</div>
                    <div className="text-xl text-white font-bold">{Math.max(data.score.high, data.score.current)}</div>
                </div>

                {/* BOTTOM STATUS BAR */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-black border-t-4 border-white z-20 flex items-center px-4 justify-between">
                    
                    {/* LIVES / HEALTH */}
                    <div className="flex gap-2">
                        <span className="text-red-500 font-bold text-sm">PWR</span>
                        <div className="flex">
                            {Array.from({length: 10}).map((_,i) => (
                                <div key={i} className={`w-3 h-4 border border-black ${i < data.vitals.integrity/10 ? 'bg-yellow-400' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* WEAPONS */}
                    <div className="flex gap-2">
                        {data.loadout.weapons.map((w,i) => (
                            <div key={i} className={`w-10 h-10 border-2 border-white flex items-center justify-center ${w.active ? 'bg-blue-600' : 'bg-gray-900'}`}>
                                <span className="text-white text-xs">{w.icon}</span>
                            </div>
                        ))}
                    </div>

                    {/* STAGE */}
                    <div className="text-white font-bold text-xl">
                        STG <span className="text-green-400">{data.progression.stage}</span>
                    </div>
                </div>
            </>
          )}
      </div>
    </div>
  );
};
