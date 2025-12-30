
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface ArcadeLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const ArcadeLayout: React.FC<ArcadeLayoutProps> = ({ data, config, children, showUI = true }) => {
  // 8-bit Palette
  const C_PINK = '#ff00cc';
  const C_CYAN = '#00ffff';
  const C_YELLOW = '#ffff00';
  const C_RED = '#ff0000';

  return (
    <div 
        className="relative bg-black overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── ARCADE TOP HEADER ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between items-start px-4 pt-2"
            style={{ height: HUD_TOP_HEIGHT }}
        >
            {/* P1 SCORE */}
            <div className="flex flex-col">
                <div className="text-xl font-black text-red-500 animate-pulse drop-shadow-[2px_2px_0px_#fff]">1UP</div>
                <div className="text-2xl font-bold text-white tracking-widest drop-shadow-[2px_2px_0px_#000]">
                    {data.score.current.toString()}
                </div>
            </div>

            {/* HI SCORE */}
            <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-yellow-400 tracking-wider">HIGH SCORE</div>
                <div className="text-xl font-bold text-white tracking-widest drop-shadow-[2px_2px_0px_#000]">
                    {Math.max(data.score.current, data.score.high).toString()}
                </div>
                {data.score.combo > 1 && (
                    <div className="mt-1 text-cyan-300 font-bold bg-blue-900/80 px-2 border-2 border-white rotate-[-3deg]">
                        {data.score.combo}X CHAIN!
                    </div>
                )}
            </div>

            {/* STAGE INFO */}
            <div className="text-right">
                <div className="text-xl font-black text-blue-500 drop-shadow-[2px_2px_0px_#fff]">ROUND</div>
                <div className="text-2xl font-bold text-white tracking-widest drop-shadow-[2px_2px_0px_#000]">
                    {data.progression.stage}
                </div>
            </div>
        </div>
      )}

      {/* ── ARCADE BOTTOM FOOTER ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end pb-2 px-4 pointer-events-none"
            style={{ height: HUD_BOTTOM_HEIGHT + 20 }}
        >
            
            {/* Main Bar Container */}
            <div className="w-full bg-[#222] border-4 border-white p-2 flex justify-between items-center pointer-events-auto shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                
                {/* Health (Hearts/Blocks) */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white bg-red-600 px-1 w-min">PWR</span>
                    <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-3 h-4 border border-black ${i < data.vitals.integrity / 10 ? 'bg-yellow-400' : 'bg-gray-700'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Status Message */}
                <div className="flex-1 text-center px-4">
                    {data.score.combo > 4 ? (
                        <span className="text-pink-500 font-bold animate-pulse tracking-widest">MAXIMUM POWER!</span>
                    ) : (
                        <span className="text-gray-500 font-bold tracking-widest text-xs animate-[pulse_2s_infinite]">INSERT COIN TO JOIN</span>
                    )}
                </div>

                {/* Weapons (Icons) */}
                <div className="flex gap-2">
                    {data.loadout.weapons.map((w) => (
                        <div key={w.id} className={`w-8 h-8 border-2 border-white flex items-center justify-center bg-blue-800 ${w.cooldownPct < 1 ? 'opacity-50' : 'opacity-100'}`}>
                            <span className="text-white text-xs">{w.icon}</span>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                        <div key={`e-${i}`} className="w-8 h-8 border-2 border-gray-600 bg-black"></div>
                    ))}
                </div>

            </div>
            
            {/* Level Progress (Bottom Strip) */}
            <div className="w-full h-2 bg-gray-800 border-x-4 border-b-4 border-white mt-1">
                <div className="h-full bg-cyan-500" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
            </div>

        </div>
      )}
    </div>
  );
};
