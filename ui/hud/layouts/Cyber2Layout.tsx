import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Cyber2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

// ─── UTILITIES ───
// A reusable SVG container for the corner brackets
const CornerBracket = ({ className, rotate = 0 }: { className?: string; rotate?: number }) => (
    <svg 
        className={className} 
        style={{ transform: `rotate(${rotate}deg)` }} 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
    >
        <path d="M0 100 V 20 L 20 0 H 100" strokeDasharray="180" strokeDashoffset="0" />
        <path d="M10 100 V 30 L 30 10 H 100" strokeWidth="1" opacity="0.5" />
    </svg>
);

// Modular Weapon Cartridge
const WeaponModule: React.FC<{ skill: any; index: number }> = ({ skill, index }) => {
    const isActive = skill.cooldownPct >= 1;
    const barHeight = skill.cooldownPct * 100;
    
    return (
        <div className="relative group w-14 h-16">
            {/* Visual Cartridge Container (Clipped & Overflow Hidden) */}
            <div className={`
                absolute inset-0 
                bg-[#080808] border border-cyan-900/50 clip-cartridge 
                flex flex-col items-center justify-end overflow-hidden 
                transition-all hover:border-cyan-500/50 hover:bg-[#0a1015]
            `}>
                {/* Charge Bar Background */}
                <div className="absolute inset-0 w-full h-full bg-cyan-900/10" />
                
                {/* Fill Animation */}
                <div 
                    className="absolute bottom-0 w-full bg-cyan-600/20 border-t border-cyan-400/50 transition-all duration-100 ease-linear"
                    style={{ height: `${barHeight}%` }}
                >
                    {isActive && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />}
                </div>

                {/* Icon */}
                <div className={`relative z-10 text-2xl mb-2 transition-all duration-300 ${isActive ? 'text-cyan-100 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] scale-110' : 'text-cyan-900 grayscale scale-100'}`}>
                    {skill.icon}
                </div>

                {/* Index Indicator */}
                <div className="absolute top-0 left-0 text-[8px] font-mono text-cyan-700 p-0.5 bg-black/50">{index + 1}</div>
                
                {/* Level Bits */}
                <div className="absolute bottom-0.5 w-full flex justify-center gap-0.5">
                    {Array.from({length: skill.level}).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-cyan-500 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Hover Tooltip (Outside Clipped Area) */}
            <HUDTooltip title={skill.label || skill.id} description={skill.description} level={skill.level} />
            
            <style>{`
                .clip-cartridge {
                    clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 100%, 0 100%, 0 10%);
                }
            `}</style>
        </div>
    );
};

export const Cyber2Layout: React.FC<Cyber2LayoutProps> = ({ data, config, children, showUI = true }) => {
  const HEALTH_COLOR = data.vitals.integrity < 30 ? '#ef4444' : (data.vitals.shieldActive ? '#00ffff' : '#22c55e');
  
  // XP Arc Calculations
  const xpPct = data.progression.xp / data.progression.xpMax;
  const xpCircumference = 2 * Math.PI * 46; // r=46
  const xpDashOffset = xpCircumference - (xpPct * xpCircumference);

  return (
    <div 
        className="relative bg-[#020202] overflow-hidden shadow-2xl font-mono text-cyan-50 select-none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── BACKGROUND VFX ── */}
      {/* Vignette & Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ffff_2px,#00ffff_4px)]" />

      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP HUD: SYSTEM HEADER ── */}
            <div 
                className="absolute top-0 left-0 w-full z-30 flex justify-between items-start px-2 py-2"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                {/* Left: Operations Log */}
                <div className="flex flex-col w-48 relative">
                    <div className="text-[10px] text-cyan-600 tracking-widest mb-1 border-b border-cyan-900/50 pb-1"> SYSTEM_LOG</div>
                    <div className="text-[9px] text-cyan-400/60 font-mono leading-tight space-y-0.5">
                        <div>NET: SECURE // PING 12ms</div>
                        <div>ENV: STABLE // GRID OK</div>
                        {data.score.combo > 1 && <div className="text-yellow-400 animate-pulse"> COMBO SEQUENCE ACTIVE</div>}
                    </div>
                    <CornerBracket className="absolute -top-1 -left-1 w-6 h-6 text-cyan-800" />
                </div>

                {/* Center: Stage Indicator */}
                <div className="flex flex-col items-center">
                    <div className="bg-cyan-950/80 border-x border-b border-cyan-500/30 px-6 py-1 clip-trapezoid-down backdrop-blur-sm">
                        <div className="text-xs font-display tracking-[0.2em] text-cyan-100">SECTOR {data.progression.stage.toString().padStart(2,'0')}</div>
                    </div>
                    <div className="text-[9px] text-cyan-600 mt-1 tracking-widest">{data.progression.stageLabel}</div>
                </div>

                {/* Right: Threat Assessment */}
                <div className="flex flex-col items-end w-48 relative">
                    <div className="text-[10px] text-red-500 tracking-widest mb-1 border-b border-red-900/50 pb-1 w-full text-right">THREAT_ASSESSMENT</div>
                    <div className={`text-xl font-display font-bold ${data.threat.colorClass} tracking-wider`}>
                        {data.threat.label}
                    </div>
                    <CornerBracket className="absolute -top-1 -right-1 w-6 h-6 text-red-900" rotate={90} />
                </div>
            </div>

            {/* ── BOTTOM HUD: DASHBOARD ── */}
            <div 
                className="absolute bottom-0 left-0 w-full z-30 flex items-end justify-between px-6 pb-4"
                style={{ height: HUD_BOTTOM_HEIGHT + 30 }}
            >
                {/* LEFT: REACTOR CORE (Health/XP) */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* SVG Gauge */}
                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                        {/* XP Arc (Outer) */}
                        <circle 
                            cx="50" cy="50" r="46" fill="none" stroke="#0e7490" strokeWidth="2"
                            strokeDasharray={xpCircumference} strokeDashoffset={xpDashOffset}
                            strokeLinecap="butt"
                            className="transition-all duration-500"
                        />
                        {/* Health Circle (Inner) */}
                        <circle 
                            cx="50" cy="50" r="38" fill="none" 
                            stroke={HEALTH_COLOR} strokeWidth="4" 
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={(2 * Math.PI * 38) * (1 - data.vitals.integrity / 100)}
                            className="transition-all duration-300 drop-shadow-[0_0_5px_currentColor]"
                        />
                    </svg>
                    
                    {/* Center Text */}
                    <div className="flex flex-col items-center justify-center z-10 text-center">
                        <span className="text-2xl font-bold font-display leading-none tracking-tighter" style={{ color: HEALTH_COLOR }}>
                            {data.vitals.integrity}%
                        </span>
                        <span className="text-[8px] text-cyan-600 tracking-widest mt-1">INTEGRITY</span>
                        {data.vitals.shieldActive && (
                            <span className="text-[8px] text-cyan-400 animate-pulse border border-cyan-500/50 px-1 rounded mt-1">SHIELD</span>
                        )}
                    </div>

                    {/* Decorative Ring */}
                    <div className="absolute inset-0 border border-cyan-900/30 rounded-full animate-[spin_10s_linear_infinite]" style={{ borderStyle: 'dashed' }}></div>
                </div>

                {/* CENTER: WEAPON ARRAY */}
                <div className="flex-1 flex justify-center items-end gap-2 px-8 pb-2">
                    {/* Utility Sidecar */}
                    {data.loadout.utilities.map((u, i) => (
                        <div key={u.id} className="mb-2">
                            <WeaponModule skill={u} index={i + 90} />
                        </div>
                    ))}
                    
                    {/* Divider */}
                    {data.loadout.utilities.length > 0 && <div className="w-px h-12 bg-cyan-900/50 mx-2 mb-2"></div>}

                    {/* Main Weapons */}
                    {data.loadout.weapons.map((w, i) => (
                        <WeaponModule key={w.id} skill={w} index={i} />
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                        <div key={`e-${i}`} className="w-14 h-16 border border-dashed border-cyan-900/30 bg-black/40 flex items-center justify-center clip-cartridge opacity-50">
                            <span className="text-cyan-900 text-xs">+</span>
                        </div>
                    ))}
                </div>

                {/* RIGHT: LIVE ANALYTICS */}
                <div className="w-48 bg-black/80 border border-cyan-900/50 p-3 relative clip-hud-panel backdrop-blur-md">
                    <div className="flex justify-between items-end border-b border-cyan-900/50 pb-1 mb-2">
                        <span className="text-[10px] text-cyan-500 font-bold">SCORE_METRIC</span>
                        <span className="text-lg font-mono text-white leading-none">{data.score.current.toLocaleString()}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] font-mono text-cyan-400/80">
                        <div className="flex justify-between">
                            <span>DPS</span>
                            <span className="text-white">{data.metrics.damage}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>SPD</span>
                            <span className="text-white">{data.metrics.fireRate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CRT</span>
                            <span className="text-yellow-400">{data.metrics.crit}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>LVL</span>
                            <span className="text-white">{data.progression.level}</span>
                        </div>
                    </div>

                    <CornerBracket className="absolute bottom-0 right-0 w-4 h-4 text-cyan-800" rotate={180} />
                </div>
            </div>
        </>
      )}

      <style>{`
        .clip-trapezoid-down { clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%); }
        .clip-hud-panel { clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 15%); }
      `}</style>
    </div>
  );
};