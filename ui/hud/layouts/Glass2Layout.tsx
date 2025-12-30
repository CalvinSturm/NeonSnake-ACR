
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Glass2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass2Layout: React.FC<Glass2LayoutProps> = ({ data, config, children, showUI = true }) => {
  
  const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
      <div className={`bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[2rem] ${className}`}>
          {children}
      </div>
  );

  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER (Scaled down slightly for spatial feel) ── */}
      <div className="absolute inset-0 z-0 bg-black">
          {children}
      </div>

      {/* ── AMBIENT GLOW ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-white/5 blur-3xl pointer-events-none rounded-full"></div>

      {/* ── UI LAYER ── */}
      {showUI && (
        <>
            {/* TOP BAR: Floating Island */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-4xl flex justify-between items-center pointer-events-none">
                
                {/* Score Widget */}
                <GlassPanel className="px-6 py-3 flex gap-4 items-center pointer-events-auto transition-transform hover:scale-105 duration-300">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Score</span>
                        <span className="text-3xl font-light text-white tracking-wide">{data.score.current.toLocaleString()}</span>
                    </div>
                    {data.score.combo > 1 && (
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">
                            x{data.score.combo}
                        </div>
                    )}
                </GlassPanel>

                {/* Threat Indicator */}
                <GlassPanel className="px-4 py-2 flex items-center gap-2 pointer-events-auto">
                    <div className={`w-2 h-2 rounded-full ${data.threat.level === 'INSANE' ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-xs font-bold text-white/80 tracking-wide uppercase">{data.threat.label}</span>
                </GlassPanel>

                {/* Stage Info */}
                <GlassPanel className="px-6 py-3 text-right pointer-events-auto">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">Sector</span>
                    <span className="text-2xl font-bold text-white">{data.progression.stage.toString().padStart(2,'0')}</span>
                </GlassPanel>
            </div>

            {/* BOTTOM DOCK: Inspired by macOS/VisionOS */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
                
                {/* Health Bubble */}
                <div className="relative group pointer-events-auto">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <GlassPanel className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-500 to-pink-500 transition-all duration-500"
                            style={{ height: `${data.vitals.integrity}%` }}
                        />
                        <div className="relative z-10 text-xs font-bold text-white mix-blend-overlay">{data.vitals.integrity}</div>
                        {data.vitals.shieldActive && (
                            <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-pulse"></div>
                        )}
                    </GlassPanel>
                </div>

                {/* Weapon Dock */}
                <GlassPanel className="px-3 py-2 flex gap-3 pointer-events-auto items-center h-20">
                    {data.loadout.weapons.map((w) => (
                        <div 
                            key={w.id} 
                            className={`
                                w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group
                                transition-all duration-200 hover:-translate-y-2 hover:bg-white/10 hover:scale-110
                            `}
                        >
                            <span className={`text-2xl drop-shadow-md ${w.active ? 'opacity-100' : 'opacity-40 grayscale'}`}>{w.icon}</span>
                            
                            {/* Cooldown Overlay (Pie) */}
                            {!w.active && (
                                <svg className="absolute inset-0 w-full h-full rotate-[-90deg] opacity-50" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="36"
                                        strokeDasharray={`${w.cooldownPct * 100}, 100`}
                                    />
                                </svg>
                            )}
                            
                            {/* Tooltip */}
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                    
                    {/* Add Button */}
                    <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center opacity-50">
                        <span className="text-white text-lg">+</span>
                    </div>
                </GlassPanel>

                {/* XP Pill */}
                <GlassPanel className="px-4 py-2 flex flex-col justify-center h-16 w-32 pointer-events-auto">
                    <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                        <span>XP</span>
                        <span>LVL {data.progression.level}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                    </div>
                </GlassPanel>

            </div>
        </>
      )}
    </div>
  );
};