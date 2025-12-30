
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Mech4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech4Layout: React.FC<Mech4LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#111] overflow-hidden font-mono text-yellow-500"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── HAZARD STRIPES OVERLAY ── */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#eab308_10px,#eab308_20px)] border-b-2 border-black z-20 opacity-80"></div>
      <div className="absolute bottom-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#eab308_10px,#eab308_20px)] border-t-2 border-black z-20 opacity-80"></div>

      {showUI && (
        <>
            {/* ── TOP DATA PANEL ── */}
            <div className="absolute top-4 left-0 w-full z-20 flex justify-between px-4">
                <div className="bg-[#222] border-2 border-[#444] p-2 shadow-lg">
                    <div className="text-[10px] text-gray-400">OPERATIONAL_SCORE</div>
                    <div className="text-2xl font-bold text-white tabular-nums">{data.score.current.toLocaleString()}</div>
                </div>
                <div className="bg-[#222] border-2 border-[#444] p-2 shadow-lg text-right">
                    <div className="text-[10px] text-gray-400">THREAT_LEVEL</div>
                    <div className={`text-xl font-bold uppercase ${data.threat.level === 'INSANE' ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>{data.threat.label}</div>
                </div>
            </div>

            {/* ── BOTTOM CONTROL PANEL ── */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between bg-[#1a1a1a] border-2 border-[#333] p-2 rounded shadow-2xl">
                
                {/* Left: Gauges */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="h-20 w-6 bg-black border border-gray-600 relative">
                            <div className="absolute bottom-0 w-full bg-gradient-to-t from-green-600 to-green-400" style={{ height: `${data.vitals.integrity}%` }}></div>
                            {/* Ticks */}
                            <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5">
                                {Array.from({length: 5}).map((_,i) => <div key={i} className="w-2 h-px bg-black/50"></div>)}
                            </div>
                        </div>
                        <div className="text-[9px] mt-1 font-bold">INTEGRITY</div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <div className="h-20 w-6 bg-black border border-gray-600 relative">
                            <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400" style={{ width: '100%', height: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                        </div>
                        <div className="text-[9px] mt-1 font-bold">XP_TANK</div>
                    </div>
                </div>

                {/* Center: Toggle Switches (Weapons) */}
                <div className="flex gap-2 bg-[#111] p-2 rounded border border-[#333] shadow-inner">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="flex flex-col items-center group relative">
                            <div className={`w-10 h-14 border-2 flex items-center justify-center bg-[#222] ${w.active ? 'border-yellow-600' : 'border-gray-700'}`}>
                                <span className={`text-lg ${w.active ? 'text-yellow-400' : 'text-gray-600'}`}>{w.icon}</span>
                            </div>
                            {/* Toggle Switch Graphic */}
                            <div className="w-10 h-4 bg-[#333] mt-1 flex justify-center items-center">
                                <div className={`w-3 h-3 rounded-full ${w.cooldownPct >= 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Right: Readout */}
                <div className="w-32 bg-black border border-[#333] p-1 font-mono text-[10px] text-green-500 leading-tight">
                    <div>sys.status: OK</div>
                    <div>wep.temp: {Math.floor(Math.random()*100)}F</div>
                    <div>ext.rad: {data.metrics.range}m</div>
                    <div>cycle: {data.metrics.fireRate}Hz</div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
