
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Holo2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo2Layout: React.FC<Holo2LayoutProps> = ({ data, config, children, showUI = true }) => {
  const BLUE_HOLO = 'rgba(0, 200, 255, 0.8)';
  const BLUE_DIM = 'rgba(0, 200, 255, 0.2)';

  // Reusable Holo Panel
  const HoloPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
      <div className={`relative bg-cyan-900/10 border border-cyan-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(0,200,255,0.15)] ${className}`}>
          {/* Scanline overlay */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.05)_3px)] pointer-events-none" />
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
          {children}
      </div>
  );

  return (
    <div 
        className="relative bg-[#00050a] overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── PROJECTOR LIGHT SOURCE ── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-t-full" />

      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0 opacity-90 mix-blend-screen">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── FLOATING HUD ELEMENTS ── */}
            
            {/* Top Bar: Orbiting Info */}
            <div 
                className="absolute top-8 left-0 w-full z-20 flex justify-between px-10 pointer-events-none"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <HoloPanel className="px-6 py-2 transform -skew-x-12 pointer-events-auto">
                    <div className="transform skew-x-12 text-center">
                        <div className="text-[10px] text-cyan-300 font-bold tracking-widest uppercase">Score</div>
                        <div className="text-3xl text-cyan-50 font-display tracking-wider drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                            {data.score.current.toLocaleString()}
                        </div>
                    </div>
                </HoloPanel>

                <div className="flex flex-col items-center">
                    <div className="text-cyan-500 text-xs font-mono mb-1 animate-pulse">/// SECTOR {data.progression.stage} ///</div>
                    <div className={`px-4 py-1 border border-cyan-500/50 bg-black/40 text-cyan-100 font-bold text-sm tracking-widest rounded shadow-[0_0_10px_rgba(0,255,255,0.2)]`}>
                        {data.threat.label}
                    </div>
                </div>

                <HoloPanel className="px-6 py-2 transform skew-x-12 pointer-events-auto">
                    <div className="transform -skew-x-12 text-center">
                        <div className="text-[10px] text-cyan-300 font-bold tracking-widest uppercase">Sync Lvl</div>
                        <div className="text-3xl text-cyan-50 font-display tracking-wider drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                            {data.progression.level}
                        </div>
                    </div>
                </HoloPanel>
            </div>

            {/* Bottom Arc: Projection Base */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex justify-center items-end pb-6"
                style={{ height: HUD_BOTTOM_HEIGHT + 40 }}
            >
                {/* Curved Container simulation via Radial Gradient mask or SVG */}
                <div className="relative w-full max-w-4xl flex items-end justify-between px-12">
                    
                    {/* Left: Vitals Hologram */}
                    <div className="relative group">
                        {/* Spinning Rings */}
                        <div className="absolute inset-0 border-2 border-dashed border-cyan-800 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="w-24 h-24 rounded-full border border-cyan-500/30 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                            <span className="text-2xl font-bold text-cyan-100 drop-shadow-[0_0_5px_cyan]">{data.vitals.integrity}%</span>
                            <span className="text-[9px] text-cyan-500">INTEGRITY</span>
                            
                            {/* Water-like fill */}
                            <div 
                                className="absolute bottom-0 left-0 w-full bg-cyan-500/20 transition-all duration-500"
                                style={{ height: `${data.vitals.integrity}%` }}
                            />
                        </div>
                    </div>

                    {/* Center: Weapons Projection */}
                    <div className="flex gap-4 mb-2">
                        {data.loadout.weapons.map((w, i) => (
                            <div key={w.id} className="flex flex-col items-center gap-2 group">
                                {/* Floating Holo Icon */}
                                <div className={`
                                    w-12 h-12 border border-cyan-500/40 bg-cyan-900/10 backdrop-blur-sm rounded-lg 
                                    flex items-center justify-center relative transition-all duration-300
                                    group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_cyan] group-hover:border-cyan-300
                                `}>
                                    <div className={`text-xl ${w.active ? 'text-cyan-100 drop-shadow-[0_0_5px_cyan]' : 'text-cyan-800'}`}>
                                        {w.icon}
                                    </div>
                                    
                                    {/* Cooldown shutter */}
                                    {w.cooldownPct < 1 && (
                                        <div 
                                            className="absolute inset-0 bg-black/60 rounded-lg flex items-end overflow-hidden"
                                        >
                                            <div className="w-full bg-cyan-500/30" style={{ height: `${w.cooldownPct * 100}%` }}></div>
                                        </div>
                                    )}
                                </div>
                                {/* Projection Beam */}
                                <div className="w-8 h-8 bg-gradient-to-t from-cyan-500/20 to-transparent clip-triangle opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                            </div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                            <div key={`e-${i}`} className="w-12 h-12 border border-dashed border-cyan-900/30 rounded-lg flex items-center justify-center mb-10">
                                <span className="text-cyan-900 text-xs">+</span>
                            </div>
                        ))}
                    </div>

                    {/* Right: Metrics Holo */}
                    <div className="w-24 h-24 bg-black/40 border-l border-b border-cyan-500/30 backdrop-blur-md p-2 flex flex-col justify-end text-right">
                        <div className="text-[9px] text-cyan-600 mb-1">ANALYSIS</div>
                        <div className="text-xs font-mono text-cyan-200">
                            DMG: {data.metrics.damage}%
                        </div>
                        <div className="text-xs font-mono text-cyan-200">
                            SPD: {data.metrics.fireRate}
                        </div>
                        <div className="text-xs font-mono text-yellow-200">
                            CRT: {data.metrics.crit}%
                        </div>
                    </div>

                </div>
            </div>
        </>
      )}

      <style>{`
        .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
      `}</style>
    </div>
  );
};