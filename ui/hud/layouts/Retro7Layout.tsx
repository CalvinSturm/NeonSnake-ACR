
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Retro7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro7Layout: React.FC<Retro7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#8b9bb4] overflow-hidden font-mono text-[#43523d]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── LCD SCREEN (Game Layer) ── */}
      <div 
        className="absolute left-0 z-0 bg-[#c6d0ad]"
        style={{ top: HUD_TOP_HEIGHT, height: PLAY_AREA_HEIGHT, width: '100%' }}
      >
          {children}
          {/* LCD Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:4px_4px] pointer-events-none opacity-20"></div>
      </div>

      {/* ── PLASTIC SHELL UI ── */}
      {showUI && (
        <>
            {/* Top Shell */}
            <div 
                className="absolute top-0 left-0 w-full z-20 flex justify-between px-8 items-center bg-[#8b9bb4] shadow-md"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="bg-[#6b7b94] px-4 py-2 rounded-lg inset-shadow text-[#c6d0ad]">
                    SCORE: {data.score.current}
                </div>
                <div className="text-[#303030] font-bold italic text-xl">GAME SYSTEM</div>
                <div className="bg-[#6b7b94] px-4 py-2 rounded-lg inset-shadow text-[#c6d0ad]">
                    LV: {data.progression.level}
                </div>
            </div>

            {/* Bottom Shell */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex justify-between px-8 items-center bg-[#8b9bb4] shadow-[0_-4px_10px_rgba(0,0,0,0.2)]"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#303030]">POWER</span>
                    <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${data.vitals.integrity > 0 ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${data.vitals.integrity > 50 ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${data.vitals.integrity > 80 ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                    </div>
                </div>

                <div className="flex gap-4">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#303030] border-b-2 border-white flex items-center justify-center text-[#c6d0ad] text-xs">
                                {w.active ? w.icon : ''}
                            </div>
                            <span className="text-[9px] font-bold text-[#303030] mt-1">{i === 0 ? 'A' : 'B'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
