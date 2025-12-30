
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Minimal7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal7Layout: React.FC<Minimal7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── THE FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y border-white"
        style={{ top: HUD_TOP_HEIGHT, height: PLAY_AREA_HEIGHT }}
      ></div>

      {showUI && (
        <>
            <div className="absolute top-8 left-8 z-20 text-white font-bold text-xl">
                {data.score.current}
            </div>
            
            <div className="absolute bottom-8 left-8 z-20 text-white font-bold text-xl">
                {data.vitals.integrity}%
            </div>

            <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                {data.loadout.weapons.map((w) => (
                    <span key={w.id} className="text-white text-sm opacity-50">{w.icon}</span>
                ))}
            </div>
        </>
      )}
    </div>
  );
};
