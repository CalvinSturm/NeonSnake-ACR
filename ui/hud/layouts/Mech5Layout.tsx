
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Mech5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech5Layout: React.FC<Mech5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#0d0d0d] overflow-hidden font-mono text-gray-300"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── COCKPIT FRAME ── */}
      <div className="absolute inset-0 pointer-events-none z-10 border-[20px] border-[#151515] rounded-[30px] opacity-80 shadow-[inset_0_0_50px_black]"></div>

      {showUI && (
        <>
            {/* ── TOP: TITAN HEADER ── */}
            <div className="absolute top-0 left-0 w-full z-20 flex justify-between bg-[#111] border-b-4 border-[#333] px-8 py-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-orange-600 font-bold tracking-widest">UNIT SCORE</span>
                    <span className="text-2xl font-bold text-white tabular-nums">{data.score.current.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-orange-600 font-bold tracking-widest">THREAT DETECTED</span>
                    <span className={`text-xl font-bold uppercase ${data.threat.colorClass}`}>{data.threat.label}</span>
                </div>
            </div>

            {/* ── BOTTOM: CONTROL DECK ── */}
            <div className="absolute bottom-0 left-0 w-full z-20 h-32 bg-[#151515] border-t-4 border-[#333] flex items-center px-8 gap-6 shadow-[0_-10px_30px_black]">
                
                {/* Left: Engine Status (Health) */}
                <div className="w-48 h-20 bg-black border border-[#444] relative p-2 flex items-center justify-center">
                    <div className="absolute top-1 left-2 text-[9px] text-gray-500 font-bold">CORE INTEGRITY</div>
                    <div className="text-4xl font-bold text-white z-10 relative">{data.vitals.integrity}%</div>
                    {/* Fill BG */}
                    <div 
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-900 to-orange-600 opacity-50 transition-all duration-300"
                        style={{ height: `${data.vitals.integrity}%` }}
                    />
                </div>

                {/* Center: Weapon Hardpoints */}
                <div className="flex-1 h-24 bg-[#0a0a0a] border border-[#333] rounded p-2 flex items-center justify-center gap-3 shadow-inner">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-14 h-16 bg-[#181818] border-2 border-[#444] flex flex-col items-center justify-center hover:border-orange-500 transition-colors">
                            <span className={`text-xl ${w.active ? 'text-orange-400' : 'text-gray-700'}`}>{w.icon}</span>
                            <div className="w-full h-1 bg-black mt-2">
                                <div className="h-full bg-green-500" style={{ width: `${w.cooldownPct * 100}%` }}></div>
                            </div>
                            <div className="absolute top-0 right-1 text-[8px] text-gray-600">{i+1}</div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Right: Analytics */}
                <div className="w-48 h-20 bg-black border border-[#444] p-2 flex flex-col justify-center gap-1 font-mono text-xs">
                    <div className="flex justify-between text-gray-500"><span>DMG</span><span className="text-white">{data.metrics.damage}</span></div>
                    <div className="flex justify-between text-gray-500"><span>RPM</span><span className="text-white">{data.metrics.fireRate}</span></div>
                    <div className="flex justify-between text-gray-500"><span>RNG</span><span className="text-white">{data.metrics.range}m</span></div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
