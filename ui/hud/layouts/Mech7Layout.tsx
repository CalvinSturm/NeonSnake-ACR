
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Mech7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech7Layout: React.FC<Mech7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#0a0a0a] overflow-hidden font-mono text-yellow-500"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── TARGETING FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-[1px] border-yellow-600/30"
        style={{ 
            top: HUD_TOP_HEIGHT, 
            height: PLAY_AREA_HEIGHT,
        }}
      >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-500"></div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-900/50 text-yellow-500 text-[10px] px-2">LIVE_FEED</div>
      </div>

      {showUI && (
        <>
            {/* ── TOP PANEL ── */}
            <div 
                className="absolute top-0 left-0 w-full bg-[#151515] z-20 border-b border-yellow-900 flex justify-between px-4 py-2"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="bg-black border border-yellow-800 p-2 w-48">
                    <div className="text-[9px] text-yellow-700">MISSION SCORE</div>
                    <div className="text-2xl font-bold">{data.score.current}</div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                    <div className="text-xs font-bold bg-yellow-900/20 px-4 py-1 border border-yellow-700 rounded text-yellow-500">
                        {data.threat.label}
                    </div>
                </div>

                <div className="bg-black border border-yellow-800 p-2 w-32 text-right">
                    <div className="text-[9px] text-yellow-700">TIME/SEC</div>
                    <div className="text-xl font-bold">{data.progression.stage.toString().padStart(2,'0')}</div>
                </div>
            </div>

            {/* ── BOTTOM PANEL ── */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-[#151515] z-20 border-t border-yellow-900 flex justify-between px-4 py-2"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                {/* Systems */}
                <div className="w-64 bg-black border border-yellow-800 p-2 flex flex-col justify-between">
                    <div className="flex justify-between text-xs">
                        <span>HULL</span>
                        <span className={data.vitals.integrity < 30 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}>{data.vitals.integrity}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 mt-1">
                        <div className="h-full bg-yellow-600" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                    {data.vitals.shieldActive && <div className="text-[9px] text-cyan-500 mt-1">SHIELD ACTIVE</div>}
                </div>

                {/* Weapons */}
                <div className="flex gap-2 items-center">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-12 h-14 bg-black border border-yellow-800 flex flex-col items-center justify-end pb-1">
                            <span className="text-lg text-yellow-500 mb-1">{w.icon}</span>
                            <div className="w-8 h-1 bg-gray-800">
                                <div className="h-full bg-green-500" style={{ width: `${w.cooldownPct * 100}%` }}></div>
                            </div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
