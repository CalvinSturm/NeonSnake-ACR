
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Glass4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass4Layout: React.FC<Glass4LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#eee] overflow-hidden font-sans text-slate-800"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0 bg-black">
          {children}
      </div>

      {showUI && (
        <>
            {/* Top Bar: Floating Pill */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-8 py-3 flex gap-8 shadow-xl items-center">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-white">Score</span>
                    <span className="text-xl font-bold text-white">{data.score.current.toLocaleString()}</span>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-white">Level</span>
                    <span className="text-xl font-bold text-white">{data.progression.level}</span>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-white">Zone</span>
                    <span className="text-xl font-bold text-white">{data.progression.stage}</span>
                </div>
            </div>

            {/* Bottom Left: Vitals Card */}
            <div className="absolute bottom-8 left-8 z-20 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 w-48 shadow-2xl">
                <div className="flex justify-between items-center mb-2 text-white">
                    <span className="font-bold text-sm">Vitality</span>
                    <span className="font-mono">{data.vitals.integrity}%</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${data.vitals.integrity}%` }}></div>
                </div>
            </div>

            {/* Bottom Right: Weapon Grid */}
            <div className="absolute bottom-8 right-8 z-20 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 grid grid-cols-3 gap-2 shadow-2xl">
                {data.loadout.weapons.map((w) => (
                    <div key={w.id} className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center relative group hover:bg-white/20 transition-colors">
                        <span className="text-lg text-white drop-shadow-md">{w.icon}</span>
                        {w.cooldownPct < 1 && (
                            <div className="absolute inset-0 bg-black/30 rounded-lg" style={{ clipPath: `inset(${w.cooldownPct*100}% 0 0 0)` }}></div>
                        )}
                        <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};
