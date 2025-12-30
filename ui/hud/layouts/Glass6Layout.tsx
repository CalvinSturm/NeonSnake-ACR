
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Glass6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass6Layout: React.FC<Glass6LayoutProps> = ({ data, config, children, showUI = true }) => {
  // Ultra-Premium Glass Panel
  const PrismPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
      <div className={`
          relative bg-white/5 backdrop-blur-2xl border border-white/20 
          shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] 
          rounded-[24px] overflow-hidden
          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none
          ${className}
      `}>
          {children}
      </div>
  );

  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER (Blurry depth) ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP BAR: FLOATING CAPSULE ── */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <PrismPanel className="px-8 py-3 flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Score</span>
                        <span className="text-3xl font-light text-white tracking-tight drop-shadow-sm">{data.score.current.toLocaleString()}</span>
                    </div>
                    
                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Zone</span>
                        <span className="text-xl font-medium text-white">{data.progression.stage.toString().padStart(2, '0')}</span>
                    </div>

                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full shadow-inner ${data.threat.level === 'INSANE' ? 'bg-red-500 shadow-red-900' : 'bg-green-400 shadow-green-800'}`}></div>
                        <span className="text-xs font-bold text-white/80">{data.threat.label}</span>
                    </div>
                </PrismPanel>
            </div>

            {/* ── BOTTOM DOCK: SPATIAL UI ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-end gap-6 pointer-events-auto">
                
                {/* Left: Health Orb (Glassmorphism Style) */}
                <div className="relative w-24 h-24 rounded-full shadow-2xl flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 group">
                    {/* Fluid wave */}
                    <div className="absolute inset-2 rounded-full overflow-hidden bg-black/20">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-500 to-pink-400 transition-all duration-500"
                            style={{ height: `${data.vitals.integrity}%` }}
                        />
                    </div>
                    {/* Glass Glare */}
                    <div className="absolute top-4 left-6 w-8 h-4 bg-white/20 rounded-full rotate-[-45deg] blur-md pointer-events-none"></div>
                    
                    <span className="relative z-10 text-2xl font-bold text-white drop-shadow-md">{data.vitals.integrity}</span>
                    
                    {data.vitals.shieldActive && (
                        <div className="absolute inset-[-4px] rounded-full border-2 border-cyan-400/50 animate-pulse pointer-events-none"></div>
                    )}
                </div>

                {/* Center: App Dock (Weapons) */}
                <PrismPanel className="p-2 flex gap-2 h-20 items-center">
                    {data.loadout.weapons.map((w) => (
                        <div 
                            key={w.id} 
                            className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:shadow-lg group"
                        >
                            <span className={`text-2xl filter drop-shadow-lg ${w.active ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>{w.icon}</span>
                            
                            {/* Cooldown (Frosted Overlay) */}
                            {w.cooldownPct < 1 && (
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] rounded-2xl flex flex-col justify-end overflow-hidden">
                                    <div className="w-full bg-white/40" style={{ height: `${(1-w.cooldownPct) * 100}%` }}></div>
                                </div>
                            )}
                            
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                    {/* Add Button */}
                    <div className="w-16 h-16 rounded-2xl border border-dashed border-white/20 flex items-center justify-center opacity-30">
                        <span className="text-white text-xl">+</span>
                    </div>
                </PrismPanel>

                {/* Right: XP Stack */}
                <PrismPanel className="p-4 flex flex-col justify-center h-24 w-32">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-white/50 uppercase">Sync</span>
                        <span className="text-sm font-bold text-white">Lvl {data.progression.level}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-300 to-blue-500 shadow-[0_0_10px_cyan]" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                    </div>
                </PrismPanel>

            </div>
        </>
      )}
    </div>
  );
};