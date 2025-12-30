
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Mech6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech6Layout: React.FC<Mech6LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#1a1a1a] overflow-hidden font-mono text-[#eab308]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── DIRTY GLASS OVERLAY ── */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dirty-old-shirt.png')]"></div>
      
      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.9)_120%)]"></div>

      {showUI && (
        <>
            {/* ── TOP HUD: HEADS UP DISPLAY ── */}
            <div className="absolute top-0 left-0 w-full z-30 pointer-events-none">
                {/* Hazard Stripe Bar */}
                <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#000,#000_10px,#eab308_10px,#eab308_20px)] border-b border-black"></div>
                
                <div className="flex justify-between px-4 pt-2">
                    {/* Radar Group */}
                    <div className="bg-[#222]/90 border-2 border-[#444] p-1 flex gap-2 rounded-br-lg shadow-lg">
                        <div className="w-16 h-16 bg-[#000] rounded-full border border-[#333] relative overflow-hidden flex items-center justify-center">
                            <div className="absolute w-full h-px bg-[#333]"></div>
                            <div className="absolute h-full w-px bg-[#333]"></div>
                            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,0,0.2)_300deg)] animate-spin"></div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] text-gray-500 font-bold">TGT: {data.threat.label}</span>
                            <span className="text-xl font-bold text-white tabular-nums">{data.score.current}</span>
                        </div>
                    </div>

                    {/* Stage Group */}
                    <div className="bg-[#222]/90 border-2 border-[#444] p-2 rounded-bl-lg shadow-lg text-right">
                        <span className="text-[10px] text-gray-500 font-bold">SECTOR</span>
                        <div className="text-2xl font-bold text-white tabular-nums">{data.progression.stage.toString().padStart(2, '0')}</div>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM HUD: COCKPIT CONTROLS ── */}
            <div 
                className="absolute bottom-0 left-0 w-full z-30 flex items-end justify-between"
                style={{ height: HUD_BOTTOM_HEIGHT + 40 }}
            >
                {/* LEFT CONSOLE: ARMOR */}
                <div className="bg-[#262626] border-t-4 border-r-4 border-[#111] p-4 pb-6 rounded-tr-[40px] shadow-2xl relative w-80 clip-console-left pointer-events-auto">
                    {/* Screws */}
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_0_2px_#555] flex items-center justify-center"><div className="w-1.5 h-0.5 bg-[#333] rotate-45"></div></div>
                    <div className="absolute bottom-2 right-12 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_0_2px_#555] flex items-center justify-center"><div className="w-1.5 h-0.5 bg-[#333] rotate-45"></div></div>

                    <div className="text-xs font-bold text-gray-500 mb-1 pl-4">HULL INTEGRITY</div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-4xl font-black text-[#eab308] tabular-nums">{data.vitals.integrity}%</div>
                        <div className="flex-1 h-6 bg-black border-2 border-[#333] relative">
                            <div className="absolute inset-0.5 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#000_4px,#000_5px)] z-10 opacity-50"></div>
                            <div 
                                className="h-full bg-gradient-to-r from-red-600 to-green-600"
                                style={{ width: `${data.vitals.integrity}%` }}
                            />
                        </div>
                    </div>
                    {data.vitals.shieldActive && (
                        <div className="mt-2 ml-2 inline-block px-2 py-0.5 bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 text-[10px] font-bold rounded">
                            SHIELD: ACTIVE
                        </div>
                    )}
                </div>

                {/* CENTER CONSOLE: WEAPON TOGGLES */}
                <div className="bg-[#1f1f1f] border-t-4 border-x-4 border-[#111] px-6 py-4 rounded-t-[20px] shadow-2xl pointer-events-auto">
                    <div className="flex gap-4">
                        {data.loadout.weapons.map((w, i) => (
                            <div key={w.id} className="group relative flex flex-col items-center gap-1">
                                {/* Toggle Switch Housing */}
                                <div className={`
                                    w-14 h-20 bg-[#111] rounded border-2 relative flex flex-col items-center justify-between p-1
                                    ${w.active ? 'border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'border-[#333]'}
                                `}>
                                    {/* Icon Display */}
                                    <div className="w-full h-8 bg-black flex items-center justify-center border border-[#333]">
                                        <span className={`text-lg ${w.active ? 'text-yellow-500' : 'text-gray-700'}`}>{w.icon}</span>
                                    </div>
                                    
                                    {/* Physical Switch */}
                                    <div className="w-8 h-6 bg-[#222] rounded border border-[#444] relative">
                                        <div className={`
                                            absolute w-full h-4 bg-gradient-to-b from-[#555] to-[#222] rounded-sm transition-all duration-100
                                            ${w.cooldownPct >= 1 ? 'top-0 bg-green-900' : 'bottom-0 bg-red-900'}
                                        `}>
                                            <div className={`w-full h-1 ${w.cooldownPct >= 1 ? 'bg-green-500' : 'bg-red-500'} mt-1 mx-auto w-4 rounded-full`}></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[9px] text-gray-500 font-bold">WPN-{i+1}</span>
                                <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT CONSOLE: METRICS */}
                <div className="bg-[#262626] border-t-4 border-l-4 border-[#111] p-4 pb-6 rounded-tl-[40px] shadow-2xl w-64 text-right clip-console-right pointer-events-auto">
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_0_2px_#555] flex items-center justify-center"><div className="w-1.5 h-0.5 bg-[#333] rotate-45"></div></div>
                    
                    <div className="text-xs font-bold text-gray-500 mb-2 pr-4">SYSTEM OUTPUT</div>
                    <div className="flex flex-col gap-1 pr-2 font-mono text-xs text-yellow-600">
                        <div className="flex justify-between border-b border-[#333] pb-0.5">
                            <span>DPS</span>
                            <span className="text-white">{data.metrics.damage}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#333] pb-0.5">
                            <span>RPM</span>
                            <span className="text-white">{data.metrics.fireRate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>EFFICIENCY</span>
                            <span className="text-white">{data.metrics.crit}%</span>
                        </div>
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
