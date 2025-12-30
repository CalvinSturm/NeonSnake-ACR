
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { HUDTooltip } from '../HUDPrimitives';

interface GlassLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const GlassLayout: React.FC<GlassLayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── TOP HUD (Floating Bubbles) ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between px-6 pt-6 pointer-events-none"
            style={{ height: HUD_TOP_HEIGHT + 40 }}
        >
            {/* Left: Score Widget */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 flex flex-col shadow-lg pointer-events-auto">
                <span className="text-[10px] uppercase text-white/60 font-bold tracking-widest">Runtime Score</span>
                <span className="text-3xl font-light text-white tracking-wide">{data.score.current.toLocaleString()}</span>
                {data.score.combo > 1 && (
                    <div className="text-xs font-bold text-cyan-300 mt-1">
                        Chain x{data.score.combo}
                    </div>
                )}
            </div>

            {/* Right: Threat Widget */}
            <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 flex flex-col items-end shadow-lg pointer-events-auto">
                    <span className="text-[10px] uppercase text-white/60 font-bold tracking-widest">Sector</span>
                    <span className="text-2xl font-bold text-white">0{data.progression.stage}</span>
                </div>
                
                <div className={`bg-white/10 backdrop-blur-xl border rounded-2xl w-14 flex items-center justify-center shadow-lg transition-colors ${data.threat.level === 'INSANE' ? 'border-red-500/50 bg-red-900/20' : 'border-white/20'}`}>
                    <div className={`w-3 h-3 rounded-full ${data.threat.level === 'INSANE' ? 'bg-red-500 animate-pulse' : data.threat.level === 'HARD' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                </div>
            </div>
        </div>
      )}

      {/* ── BOTTOM HUD (Dock) ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-8 pb-8 pointer-events-none"
            style={{ height: HUD_BOTTOM_HEIGHT + 40 }}
        >
            
            {/* Left: Health Orb */}
            <div className="relative w-20 h-20 pointer-events-auto">
                {/* Back blur */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-full border border-white/10"></div>
                {/* Progress Circle (SVG) */}
                <svg className="absolute inset-0 -rotate-90 transform" width="80" height="80">
                    <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                    <circle 
                        cx="40" cy="40" r="36" 
                        stroke={data.vitals.integrity < 30 ? '#ff4d4d' : '#00eaff'} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * data.vitals.integrity) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-white">{data.vitals.integrity}</span>
                    <span className="text-[8px] text-white/50 font-bold uppercase">Hull</span>
                </div>
            </div>

            {/* Center: Weapon Dock */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-2 py-2 flex gap-3 shadow-2xl pointer-events-auto mb-2">
                {data.loadout.weapons.map((w) => (
                    <div key={w.id} className="relative w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 hover:scale-105 group">
                        <div className={`text-xl drop-shadow-md ${w.active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            {w.icon}
                        </div>
                        {/* Cooldown Pie Overlay */}
                        {w.cooldownPct < 1 && (
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-end justify-center overflow-hidden">
                                <div className="bg-white/20 w-full" style={{ height: `${(1 - w.cooldownPct) * 100}%` }}></div>
                            </div>
                        )}
                        {/* Tooltip */}
                        <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                    </div>
                ))}
                {/* Add button for upgrade context */}
                <div className="w-12 h-12 rounded-xl border border-white/10 border-dashed flex items-center justify-center opacity-30">
                    <span className="text-white">+</span>
                </div>
            </div>

            {/* Right: XP Pill */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 flex flex-col items-end w-40 pointer-events-auto mb-4">
                <div className="flex justify-between w-full text-[10px] font-bold text-white/60 mb-1">
                    <span>SYNC</span>
                    <span>LVL {data.progression.level}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};
