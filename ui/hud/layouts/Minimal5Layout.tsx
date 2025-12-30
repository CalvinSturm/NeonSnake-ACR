
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Minimal5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal5Layout: React.FC<Minimal5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* Absolute minimal data */}
            <div className="absolute bottom-8 left-8 z-30 text-white/80 pointer-events-none">
                <div className="text-6xl font-thin tracking-tighter opacity-80">{data.vitals.integrity}</div>
            </div>

            <div className="absolute top-8 right-8 z-30 text-right pointer-events-none">
                <div className="text-xl font-bold tracking-widest text-white/50">{data.score.current}</div>
                <div className="text-xs text-white/30 uppercase tracking-[0.5em] mt-1">{data.threat.label}</div>
            </div>

            {/* Center Bottom Dots for Loadout */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30 opacity-50">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className={`w-1 h-1 rounded-full ${w.active ? 'bg-white' : 'bg-gray-600'}`}></div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};
