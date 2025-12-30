
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Arcade7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Arcade7Layout: React.FC<Arcade7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#222] overflow-hidden font-sans italic"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── BEZEL FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y-[4px] border-white"
        style={{ top: HUD_TOP_HEIGHT, height: PLAY_AREA_HEIGHT }}
      ></div>

      {showUI && (
        <>
            {/* ── TOP HEADER ── */}
            <div 
                className="absolute top-0 left-0 w-full bg-blue-900 z-20 flex justify-between items-center px-6"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="text-white">
                    <div className="text-sm font-black text-yellow-400">1UP</div>
                    <div className="text-4xl font-black">{data.score.current}</div>
                </div>
                
                {data.score.combo > 1 && (
                    <div className="text-4xl font-black text-pink-500 animate-bounce">{data.score.combo} HITS!</div>
                )}

                <div className="text-right text-white">
                    <div className="text-sm font-black text-blue-300">STAGE</div>
                    <div className="text-4xl font-black">{data.progression.stage}</div>
                </div>
            </div>

            {/* ── BOTTOM FOOTER ── */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-black z-20 flex justify-between items-center px-6"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                {/* Health Bar (Fighter Style) */}
                <div className="w-1/2">
                    <div className="flex justify-between text-yellow-400 font-bold text-xs mb-1">
                        <span>PLAYER</span>
                        <span>{data.vitals.integrity}%</span>
                    </div>
                    <div className="w-full h-6 bg-red-900 border-2 border-white skew-x-[-15deg] overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                </div>

                {/* Weapons */}
                <div className="flex gap-2">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className={`w-10 h-10 border-2 border-white flex items-center justify-center ${w.active ? 'bg-blue-600' : 'bg-gray-800'}`}>
                            <span className="text-white font-bold">{w.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
