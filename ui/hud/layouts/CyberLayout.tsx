
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDBar, HUDTooltip } from '../HUDPrimitives';
import { useUIStyle } from '../../useUIStyle';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface CyberLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

// Custom Slot Component for Protocol Look (Defined outside to maintain stable reference)
const ProtocolSlot: React.FC<{ skill: any; index: number }> = ({ skill, index }) => {
    const isActive = skill.cooldownPct >= 1;
    return (
        <div className="relative group">
            {/* Connector Line */}
            <div className="absolute bottom-full left-1/2 w-px h-2 bg-cyan-900/50 -translate-x-1/2 mb-1"></div>
            
            {/* Hex Frame */}
            <div 
                className={`
                  relative w-12 h-12 flex items-center justify-center 
                  border border-cyan-500/30 bg-black/80 backdrop-blur-sm
                  transition-all duration-200
                  ${isActive ? 'shadow-[0_0_15px_rgba(0,255,255,0.2)] border-cyan-400' : 'opacity-60'}
                `}
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                <span className={`text-xl z-10 ${isActive ? 'text-cyan-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'text-cyan-900 grayscale'}`}>
                    {skill.icon}
                </span>
                
                {/* Cooldown Veil */}
                {!isActive && (
                    <div 
                      className="absolute inset-0 bg-cyan-950/80 z-20"
                      style={{ height: `${(1 - skill.cooldownPct) * 100}%`, transition: 'height 0.1s linear' }}
                    />
                )}

                {/* Hotkey Indicator */}
                <div className="absolute top-0 right-0 p-0.5 text-[8px] font-mono text-cyan-700">{index + 1}</div>
            </div>
            
            {/* Level Pip */}
            <div className="flex justify-center mt-1 gap-0.5">
                {Array.from({length: Math.min(3, skill.level)}).map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_2px_#0ff]"></div>
                ))}
            </div>

            {/* Tooltip */}
            <HUDTooltip title={skill.label || skill.id} description={skill.description} level={skill.level} />
        </div>
    );
};

export const CyberLayout: React.FC<CyberLayoutProps> = ({ data, config, children, showUI = true }) => {
  const style = useUIStyle();
  const primaryColor = style.colors.primary; // Cyan usually
  const dangerColor = style.colors.danger;

  return (
    <div 
        className="relative bg-[#050505] overflow-hidden shadow-2xl font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── BACKGROUND GRID (Subtle diagnostic layer) ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
            backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
        }}
      />

      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── HUD OVERLAY LAYER ── */}
      {showUI && (
        <>
            {/* ┌── TOP LEFT: SCORE KERNEL ──┐ */}
            <div 
                className="absolute top-4 left-4 z-20 pl-4 pr-8 py-2 bg-black/60 border-l-2 border-cyan-500 backdrop-blur-md"
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
            >
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-cyan-500 animate-pulse"></div>
                        <span className="text-[10px] tracking-[0.2em] text-cyan-400 opacity-80">KERNEL_SCORE</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-white tracking-wider tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                        {data.score.current.toLocaleString()}
                    </div>
                    {data.score.combo > 1 && (
                        <div className="absolute -bottom-6 left-0 text-yellow-400 text-xs font-bold tracking-widest bg-black/80 px-2 py-0.5 border border-yellow-600/50">
                            CHAIN_LINK :: x{data.score.combo}
                        </div>
                    )}
                </div>
            </div>

            {/* ┌── TOP RIGHT: THREAT METRICS ──┐ */}
            <div 
                className="absolute top-4 right-4 z-20 pr-4 pl-8 py-2 bg-black/60 border-r-2 border-cyan-500 backdrop-blur-md text-right"
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
            >
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] tracking-[0.2em] text-cyan-400 opacity-80">SECTOR_THREAT</span>
                        <div className={`w-2 h-2 rounded-full ${data.threat.level === 'INSANE' ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`}></div>
                    </div>
                    <div className={`text-2xl font-display font-bold ${data.threat.colorClass} tracking-widest leading-none drop-shadow-[0_0_8px_currentColor]`}>
                        {data.threat.label}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-mono">
                        SEC-{data.progression.stage.toString().padStart(2, '0')} // {data.progression.stageLabel}
                    </div>
                </div>
            </div>

            {/* ┌── BOTTOM BAR: DIAGNOSTIC DASHBOARD ──┐ */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex items-end justify-between px-6 pb-4 pt-8 bg-gradient-to-t from-black via-black/80 to-transparent"
                style={{ height: HUD_BOTTOM_HEIGHT + 20 }}
            >
                {/* LEFT: INTEGRITY & SYNC */}
                <div className="w-64 flex flex-col gap-2">
                    {/* Health */}
                    <div>
                        <div className="flex justify-between text-[10px] text-cyan-500 tracking-widest mb-1">
                            <span>HULL_INTEGRITY</span>
                            <span className={data.vitals.integrity < 30 ? 'text-red-500 animate-pulse' : 'text-white'}>{data.vitals.integrity}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-900/50 border border-gray-700 skew-x-[-20deg] relative overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${data.vitals.integrity < 30 ? 'bg-red-500 shadow-[0_0_10px_#f00]' : 'bg-cyan-500 shadow-[0_0_10px_#0ff]'}`}
                                style={{ width: `${data.vitals.integrity}%` }}
                            />
                            {/* Grid Overlay on Bar */}
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[length:4px_100%] opacity-30"></div>
                        </div>
                    </div>

                    {/* STAMINA BAR */}
                    <div className="mt-1">
                        <div className="flex justify-between text-[10px] text-yellow-500 tracking-widest mb-0.5">
                            <span>BRAKE_HYDRO</span>
                            <span>{Math.floor(data.vitals.stamina)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900/50 skew-x-[-20deg] relative overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-100 ${data.vitals.stamina < 20 ? 'bg-red-500' : 'bg-yellow-400 shadow-[0_0_5px_#fbbf24]'}`}
                                style={{ width: `${data.vitals.stamina}%` }}
                            />
                        </div>
                    </div>

                    {/* XP / Sync */}
                    <div>
                        <div className="flex justify-between text-[10px] text-cyan-600 tracking-widest mb-1">
                            <span>DATA_SYNC</span>
                            <span>v{data.progression.level}.0</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900/50 skew-x-[-20deg] relative overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 shadow-[0_0_5px_#00f] transition-all duration-300"
                                style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}
                            />
                        </div>
                    </div>
                    
                    {/* Shield Status */}
                    {data.vitals.shieldActive && (
                        <div className="text-[10px] text-cyan-300 border border-cyan-500/30 bg-cyan-900/20 px-2 py-1 inline-block w-max mt-1 skew-x-[-10deg]">
                            🛡️ ION_SHIELD: ONLINE
                        </div>
                    )}
                </div>

                {/* CENTER: WEAPON ARRAY */}
                <div className="flex-1 flex flex-col items-center justify-end pb-2">
                    <div className="text-[9px] text-gray-500 tracking-[0.3em] mb-2 uppercase">Protocol_Loadout</div>
                    <div className="flex items-end gap-3">
                        {/* Utility Slots (Passive) */}
                        {data.loadout.utilities.map((u, i) => (
                            <ProtocolSlot key={`util-${i}`} skill={u} index={i + 90} /> 
                        ))}
                        
                        {/* Divider */}
                        {data.loadout.utilities.length > 0 && <div className="w-px h-8 bg-gray-800 mx-1"></div>}

                        {/* Active Weapons */}
                        {data.loadout.weapons.map((w, i) => (
                            <ProtocolSlot key={`wep-${i}`} skill={w} index={i} />
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-12 h-12 border border-dashed border-gray-800 flex items-center justify-center opacity-30" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                                <span className="text-gray-600 text-xs">+</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: ANALYTICS */}
                <div className="w-48 text-right font-mono text-xs space-y-1 relative">
                    <div className="absolute -left-2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-900 to-transparent"></div>
                    
                    <div className="flex justify-between text-cyan-200/60">
                        <span>DPS_OUT</span>
                        <span className="text-white">{data.metrics.damage}%</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60">
                        <span>CYCLE_HZ</span>
                        <span className="text-white">{data.metrics.fireRate}</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60">
                        <span>EFF_RANGE</span>
                        <span className="text-white">{data.metrics.range}</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60">
                        <span>CRIT_PROB</span>
                        <span className="text-yellow-400">{data.metrics.crit}%</span>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
