
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Holo5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo5Layout: React.FC<Holo5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── ROTATING MANDALAS ── */}
            <div className="absolute top-10 left-10 z-20 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 border border-orange-500/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-yellow-500/50 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-[10px] text-orange-300">ARCANE SCORE</div>
                    <div className="text-xl font-bold text-yellow-100">{data.score.current}</div>
                </div>
            </div>

            <div className="absolute bottom-10 right-10 z-20 w-40 h-40 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                    <div className="text-3xl font-light text-white">{data.vitals.integrity}</div>
                    <div className="text-[10px] text-cyan-400 tracking-[0.3em]">ESSENCE</div>
                </div>
            </div>

            {/* ── FLOATING RUNES (Weapons) ── */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="relative w-12 h-12 flex items-center justify-center">
                        <div className={`absolute inset-0 border border-orange-400 rotate-45 ${w.active ? 'animate-pulse' : 'opacity-50'}`}></div>
                        <span className="relative z-10 text-white text-lg">{w.icon}</span>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};
