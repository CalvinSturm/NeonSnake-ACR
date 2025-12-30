
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Holo7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo7Layout: React.FC<Holo7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#050510] overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── PROJECTED BOUNDARY ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y border-blue-500/50"
        style={{ top: HUD_TOP_HEIGHT, height: PLAY_AREA_HEIGHT }}
      >
          <div className="absolute top-0 w-full h-4 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
          <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
      </div>

      {showUI && (
        <>
            {/* ── FLOATING TOP HUD ── */}
            <div 
                className="absolute top-0 left-0 w-full z-20 flex justify-center items-center gap-12 pt-6"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="text-center">
                    <div className="text-[10px] text-blue-400">SIMULATION_SCORE</div>
                    <div className="text-3xl text-white font-bold drop-shadow-[0_0_10px_blue]">{data.score.current}</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-blue-400">THREAT_METRIC</div>
                    <div className="text-xl text-white">{data.threat.label}</div>
                </div>
            </div>

            {/* ── FLOATING BOTTOM HUD ── */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex justify-center items-center gap-12 pb-6"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                <div className="text-center">
                    <div className="text-3xl text-white font-bold">{data.vitals.integrity}%</div>
                    <div className="text-[10px] text-blue-400">INTEGRITY</div>
                </div>
                
                <div className="flex gap-4">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="w-10 h-10 border border-blue-500/50 flex items-center justify-center rounded-full">
                            <span className="text-white">{w.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
