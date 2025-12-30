
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Cyber4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Cyber4Layout: React.FC<Cyber4LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono text-red-500"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(45deg,#220000_25%,transparent_25%,transparent_50%,#220000_50%,#220000_75%,transparent_75%,transparent)] bg-[length:4px_4px]"></div>
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0 mix-blend-screen">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP BAR: SYSTEM ALERT ── */}
            <div 
                className="absolute top-0 left-0 w-full z-20 flex justify-between items-start px-6 pt-4"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                {/* Left: Score Breach */}
                <div className="bg-red-950/80 border-b-2 border-red-600 px-4 py-1 skew-x-12 relative shadow-[0_0_15px_#f00]">
                    <div className="-skew-x-12 flex flex-col">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white">SCORE_INJECTION</span>
                        <span className="text-3xl font-black tracking-tighter text-white drop-shadow-[2px_2px_0_#ff0000]">{data.score.current.toLocaleString()}</span>
                    </div>
                    {/* Deco */}
                    <div className="absolute top-0 right-0 w-2 h-full bg-red-600/50"></div>
                </div>

                {/* Right: Threat Warning */}
                <div className="bg-red-950/80 border-b-2 border-red-600 px-6 py-1 -skew-x-12 relative flex flex-col items-end">
                    <div className="skew-x-12 text-right">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white animate-pulse">WARNING_LEVEL</span>
                        <div className="text-2xl font-bold text-red-500 uppercase">{data.threat.label}</div>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM BAR: WEAPON PAYLOAD ── */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-6 pb-6 pointer-events-none"
                style={{ height: HUD_BOTTOM_HEIGHT + 30 }}
            >
                {/* Left: Vitals Graph */}
                <div className="pointer-events-auto bg-black/80 border border-red-800 p-2 relative w-64">
                    <div className="absolute -top-3 left-0 bg-red-600 text-black text-[10px] font-bold px-2">INTEGRITY_CHECK</div>
                    <div className="flex gap-1 h-8 items-end">
                        {Array.from({length: 20}).map((_, i) => (
                            <div 
                                key={i} 
                                className={`flex-1 transition-all duration-75 ${i < data.vitals.integrity / 5 ? 'bg-red-500 shadow-[0_0_5px_#f00]' : 'bg-red-950/30'}`}
                                style={{ height: `${50 + Math.random() * 50}%` }} // Glitch height
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-red-400">
                        <span>SHIELD: {data.vitals.shieldActive ? 'ON' : 'OFF'}</span>
                        <span className="font-bold text-white">{data.vitals.integrity}%</span>
                    </div>
                </div>

                {/* Right: Loadout Grid */}
                <div className="pointer-events-auto flex gap-2">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-12 h-12 bg-red-950/50 border border-red-700 flex items-center justify-center overflow-hidden">
                            <span className={`text-lg z-10 ${w.active ? 'text-white' : 'text-red-900'}`}>{w.icon}</span>
                            
                            {/* Cooldown shutter */}
                            {!w.active && (
                                <div 
                                    className="absolute inset-0 bg-black/80 flex flex-col justify-end"
                                >
                                    <div className="w-full bg-red-600" style={{ height: '2px' }}></div>
                                    <div className="w-full bg-red-900/50" style={{ height: `${(1-w.cooldownPct) * 100}%` }}></div>
                                </div>
                            )}
                            
                            <div className="absolute top-0 left-0 text-[8px] bg-red-800 text-black px-1 font-bold">{i+1}</div>
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
