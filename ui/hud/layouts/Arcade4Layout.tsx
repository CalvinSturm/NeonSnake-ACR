
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Arcade4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade4Layout: React.FC<Arcade4LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-sans italic"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP RIGHT: LAP TIMER / STAGE ── */}
            <div className="absolute top-4 right-0 z-20 bg-gradient-to-l from-blue-600 to-blue-800 text-white px-8 py-2 -skew-x-12 translate-x-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)] border-b-4 border-white">
                <div className="skew-x-12 text-right">
                    <div className="text-xs font-black">STAGE TIME</div>
                    <div className="text-3xl font-black leading-none">
                        {data.progression.stage}<span className="text-sm">/12</span>
                    </div>
                </div>
            </div>

            {/* ── TOP LEFT: SCORE ODOMETER ── */}
            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-baseline gap-1 drop-shadow-[2px_2px_0_#000]">
                    <span className="text-4xl font-black text-yellow-400 tracking-tighter">
                        {data.score.current.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-white">PTS</span>
                </div>
                {data.score.combo > 1 && (
                    <div className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold inline-block transform -rotate-2">
                        COMBO x{data.score.combo}!!!
                    </div>
                )}
            </div>

            {/* ── BOTTOM: DASHBOARD ── */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                
                {/* Speedometer (Fire Rate) */}
                <div className="relative w-24 h-24 bg-black/50 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-yellow-500 border-b-red-500 rotate-45"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{data.metrics.fireRate}</span>
                        <span className="text-[8px] font-bold text-gray-400">RPM</span>
                    </div>
                </div>

                {/* Center: Weapons */}
                <div className="flex gap-2">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className={`w-12 h-12 bg-white/10 border-2 border-white -skew-x-12 flex items-center justify-center ${w.active ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="skew-x-12 text-xl">{w.icon}</div>
                        </div>
                    ))}
                </div>

                {/* Health Bar (Angled) */}
                <div className="w-64 h-6 bg-gray-800 -skew-x-12 border-2 border-white relative overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
                        style={{ width: `${data.vitals.integrity}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white skew-x-12 drop-shadow-md">
                        ENERGY
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
