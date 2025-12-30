
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDBar, HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface MechLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const MechLayout: React.FC<MechLayoutProps> = ({ data, config, children, showUI = true }) => {
  // Industrial Color Palette
  const AMBER = '#ffaa00';
  const AMBER_DIM = 'rgba(255, 170, 0, 0.4)';
  const METAL_DARK = '#1a1a1a';
  
  return (
    <div 
        className="relative bg-[#050505] overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── COCKPIT OVERLAY EFFECTS ── */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-[radial-gradient(circle_at_center,transparent_60%,#000_120%)]"></div>
      
      {/* ── TOP HUD (Cockpit Header) ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between items-start"
            style={{ height: HUD_TOP_HEIGHT }}
        >
            {/* Top Bar Frame */}
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#111] to-transparent border-b border-[#333]"></div>

            {/* Left Radar/Status */}
            <div className="ml-4 mt-2 bg-[#111] border-l-4 border-amber-600 p-2 clip-mech-left relative">
                <div className="text-[10px] text-amber-600 font-mono tracking-widest mb-1">SYSTEM_STATUS</div>
                <div className="text-xl font-bold text-amber-400 font-display tabular-nums tracking-wider">
                    {data.score.current.toLocaleString()}
                </div>
                <div className="w-32 h-1 bg-[#333] mt-1">
                    <div className="h-full bg-amber-600" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                </div>
            </div>

            {/* Center Compass */}
            <div className="mt-1 flex flex-col items-center">
                <div className="bg-[#1a1a1a]/80 backdrop-blur border border-[#444] px-6 py-1 rounded-b-lg clip-mech-center text-center">
                    <div className="text-[10px] text-gray-400 font-mono">THREAT LEVEL</div>
                    <div className={`text-lg font-bold ${data.threat.colorClass} tracking-widest`}>{data.threat.label}</div>
                </div>
                {data.score.combo > 1 && (
                    <div className="mt-1 text-amber-500 font-bold bg-black/50 px-2 border border-amber-900 text-xs animate-pulse">
                        COMBO x{data.score.combo}
                    </div>
                )}
            </div>

            {/* Right Mission Info */}
            <div className="mr-4 mt-2 bg-[#111] border-r-4 border-amber-600 p-2 text-right clip-mech-right">
                <div className="text-[10px] text-amber-600 font-mono tracking-widest mb-1">MISSION_CLOCK</div>
                <div className="text-xl font-bold text-amber-400 font-display tabular-nums tracking-wider">
                    SEC-{data.progression.stage.toString().padStart(2, '0')}
                </div>
                <div className="text-[9px] text-gray-500 uppercase mt-1">{data.progression.stageLabel}</div>
            </div>
        </div>
      )}

      {/* ── BOTTOM HUD (Dashboard) ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-4 pb-4"
            style={{ height: HUD_BOTTOM_HEIGHT + 20 }}
        >
            {/* Left Console (Vitals) */}
            <div className="w-64 h-24 bg-[#111]/90 border-t-2 border-amber-700 relative clip-mech-console-left p-4 flex flex-col justify-end shadow-lg backdrop-blur">
                <div className="absolute top-0 right-0 w-8 h-8 border-l border-b border-[#333]"></div>
                
                <div className="flex justify-between items-end mb-2">
                    <span className="text-amber-600 font-bold text-xs tracking-wider">HULL INTEGRITY</span>
                    <span className="text-amber-400 font-mono text-lg">{data.vitals.integrity}%</span>
                </div>
                <HUDBar 
                    value={data.vitals.integrity} 
                    color={data.vitals.integrity < 30 ? '#ff0000' : AMBER} 
                    config={{ ...config, layout: 'INDUSTRIAL' }} 
                    height={8}
                />
                
                {/* Shield Indicator */}
                <div className="flex gap-1 mt-2">
                    <div className={`w-3 h-3 rounded-full border border-amber-800 ${data.vitals.shieldActive ? 'bg-cyan-400 shadow-[0_0_5px_#0ff]' : 'bg-black'}`}></div>
                    <span className="text-[9px] text-gray-500">SHIELD</span>
                </div>
            </div>

            {/* Center Console (Weapons) */}
            <div className="flex-1 h-20 mx-4 flex items-end justify-center pb-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex gap-2 p-2 border-b border-amber-900/50 bg-[#0a0a0a]/60 rounded-t-lg backdrop-blur-sm">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-12 h-14 bg-[#151515] border border-[#333] flex flex-col items-center justify-end overflow-hidden">
                            {/* Fill */}
                            <div 
                                className="absolute bottom-0 left-0 w-full bg-amber-900/40 transition-all duration-100"
                                style={{ height: `${w.cooldownPct * 100}%` }}
                            />
                            {/* Icon */}
                            <div className={`z-10 text-xl mb-1 ${w.active ? 'opacity-100 text-amber-200' : 'opacity-40 grayscale'}`}>
                                {w.icon}
                            </div>
                            {/* Status Light */}
                            <div className={`w-full h-1 mt-1 ${w.cooldownPct >= 1 ? 'bg-green-500 shadow-[0_0_5px_#0f0]' : 'bg-red-900'}`}></div>
                            
                            {/* Hotkey */}
                            <div className="absolute top-0 right-0 text-[8px] bg-[#222] text-gray-400 px-1">{i+1}</div>

                            {/* Tooltip */}
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                        <div key={`e-${i}`} className="w-12 h-14 border border-[#222] bg-[#050505] flex items-center justify-center">
                            <span className="text-[#333]">+</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Console (Metrics) */}
            <div className="w-48 h-24 bg-[#111]/90 border-t-2 border-amber-700 relative clip-mech-console-right p-4 flex flex-col justify-center gap-2 shadow-lg backdrop-blur text-right">
                <div className="absolute top-0 left-0 w-8 h-8 border-r border-b border-[#333]"></div>
                
                <div className="flex justify-between border-b border-[#333] pb-1">
                    <span className="text-[9px] text-gray-500">DPS OUT</span>
                    <span className="text-xs text-amber-300 font-mono">{data.metrics.damage}%</span>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-1">
                    <span className="text-[9px] text-gray-500">CYCLE RATE</span>
                    <span className="text-xs text-amber-300 font-mono">{data.metrics.fireRate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[9px] text-gray-500">EFFICIENCY</span>
                    <span className="text-xs text-amber-300 font-mono">{data.metrics.crit}%</span>
                </div>
            </div>
        </div>
      )}
      
      {/* Styles for Clip Paths */}
      <style>{`
        .clip-mech-left { clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); }
        .clip-mech-right { clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%); }
        .clip-mech-center { clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%); }
        .clip-mech-console-left { clip-path: polygon(0 15%, 15% 0, 100% 0, 100% 100%, 0 100%); }
        .clip-mech-console-right { clip-path: polygon(0 0, 85% 0, 100% 15%, 100% 100%, 0 100%); }
      `}</style>
    </div>
  );
};
