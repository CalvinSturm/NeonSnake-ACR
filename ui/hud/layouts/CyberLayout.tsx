
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDBar, HUDTooltip } from '../HUDPrimitives';
import { useUIStyle } from '../../useUIStyle';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT } from '../../../constants';

interface CyberLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

// Custom Slot Component for Protocol Look (Defined outside to maintain stable reference)
const ProtocolSlot: React.FC<{ skill: any; index: number; type: 'WEAPON' | 'PASSIVE' }> = ({ skill, index, type }) => {
    const isActive = skill.cooldownPct >= 1;
    const isPassive = type === 'PASSIVE';
    
    return (
        <div className="relative group">
            {/* Connector Line */}
            <div className={`absolute bottom-full left-1/2 w-px h-2 -translate-x-1/2 mb-1 ${isPassive ? 'bg-gray-700' : 'bg-cyan-900/50'}`}></div>
            
            {/* Hex Frame */}
            <div 
                className={`
                  relative w-12 h-12 flex items-center justify-center 
                  border backdrop-blur-sm cursor-help
                  transition-all duration-200
                  ${isActive 
                      ? (isPassive ? 'border-gray-500 bg-gray-900/80 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'border-cyan-400 bg-black/80 shadow-[0_0_15px_rgba(0,255,255,0.2)]') 
                      : 'border-cyan-900/30 bg-black/60 opacity-60'}
                  group-hover:border-white group-hover:scale-105
                `}
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                <span className={`text-xl z-10 ${isActive ? (isPassive ? 'text-gray-200' : 'text-cyan-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]') : 'text-cyan-900 grayscale'}`}>
                    {skill.icon}
                </span>
                
                {/* Cooldown Veil */}
                {!isActive && !isPassive && (
                    <div 
                      className="absolute inset-0 bg-cyan-950/80 z-20"
                      style={{ height: `${(1 - skill.cooldownPct) * 100}%`, transition: 'height 0.1s linear' }}
                    />
                )}

                {/* Hotkey Indicator */}
                {!isPassive && <div className="absolute top-0 right-0 p-0.5 text-[8px] font-mono text-cyan-700 bg-black/50">{index + 1}</div>}
            </div>
            
            {/* Level Pip */}
            <div className="flex justify-center mt-1 gap-0.5">
                {Array.from({length: Math.min(3, skill.level)}).map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${isPassive ? 'bg-gray-500' : 'bg-cyan-400 shadow-[0_0_2px_#0ff]'}`}></div>
                ))}
            </div>

            {/* Tooltip */}
            <HUDTooltip title={skill.label || skill.id} description={skill.description} level={skill.level} />
        </div>
    );
};

export const CyberLayout: React.FC<CyberLayoutProps> = ({ data, config, children, showUI = true }) => {
  const style = useUIStyle();

  return (
    <div 
        className="relative bg-transparent overflow-hidden font-mono"
        style={{ width: '100%', height: '100%' }}
    >
      {/* ── BACKGROUND GRID (Subtle diagnostic layer) ── */}
      {/* Reduced opacity as it overlays the game background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 z-0"
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
                className="absolute top-4 left-4 z-20 pl-4 pr-8 py-2 bg-black/60 border-l-2 border-cyan-500 backdrop-blur-md transition-all duration-300 hover:bg-black/80"
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
            >
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-cyan-500 animate-pulse shadow-[0_0_5px_cyan]"></div>
                        <span className="text-[10px] tracking-[0.2em] text-cyan-400 opacity-80">KERNEL_SCORE</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-white tracking-wider tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                        {data.score.current.toLocaleString()}
                    </div>
                    
                    {/* COMBO INDICATOR */}
                    <div className={`mt-2 transition-all duration-300 origin-left ${data.score.combo > 1 ? 'opacity-100 scale-100' : 'opacity-50 scale-90 grayscale'}`}>
                        <div className="flex items-center gap-2">
                             <div className="text-yellow-400 text-xs font-bold font-display tracking-widest bg-yellow-900/30 px-2 py-0.5 border-l-2 border-yellow-500">
                                COMBO x{data.score.combo}
                             </div>
                             {data.score.combo > 1 && (
                                 <div className="text-[9px] text-yellow-600 font-mono font-bold animate-pulse">
                                    +{(data.score.combo * 10).toFixed(0)}% BONUS
                                 </div>
                             )}
                        </div>
                    </div>
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
                <div className="w-72 flex flex-col gap-3 pb-1">
                    {/* Health */}
                    <div>
                        <div className="flex justify-between text-[10px] text-cyan-500 tracking-widest mb-1">
                            <span>HULL_INTEGRITY</span>
                            <span className={data.vitals.integrity < 30 ? 'text-red-500 animate-pulse font-bold' : 'text-white'}>{data.vitals.integrity}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-900/50 border border-gray-700 skew-x-[-20deg] relative overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${data.vitals.integrity < 30 ? 'bg-red-500 shadow-[0_0_10px_#f00]' : 'bg-cyan-500 shadow-[0_0_10px_#0ff]'}`}
                                style={{ width: `${data.vitals.integrity}%` }}
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[length:4px_100%] opacity-30"></div>
                        </div>
                    </div>

                    {/* XP / Sync - EXPANDED */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-cyan-600 tracking-widest">DATA_SYNC</span>
                                 <span className="text-xs text-white font-bold bg-cyan-900/50 px-1.5 rounded border border-cyan-700/50">v{data.progression.level}</span>
                            </div>
                            <span className="text-[9px] text-cyan-400 font-mono tracking-wide">{data.progression.xp} / {data.progression.xpMax} XP</span>
                        </div>
                        <div className="h-2 w-full bg-gray-900/80 skew-x-[-20deg] relative overflow-hidden border border-gray-700/50">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_#00f] transition-all duration-300"
                                style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}
                            />
                            {/* Grid pattern overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[length:10px_100%] opacity-20"></div>
                        </div>
                        <div className="text-[8px] text-gray-600 mt-1 text-right tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">Next Protocol Unlocks at Max</div>
                    </div>

                    {/* Stamina / Brake */}
                    <div className="mt-1">
                        <div className="flex justify-between text-[10px] text-yellow-500 tracking-widest mb-0.5 opacity-80">
                            <span>BRAKE_HYDRAULICS</span>
                            <span>{Math.floor(data.vitals.stamina)}%</span>
                        </div>
                        <div className="h-1 w-full bg-gray-900/50 skew-x-[-20deg] relative overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-100 ${data.vitals.stamina < 20 ? 'bg-red-500' : 'bg-yellow-600'}`}
                                style={{ width: `${data.vitals.stamina}%` }}
                            />
                        </div>
                    </div>
                    
                    {/* Shield Status */}
                    {data.vitals.shieldActive && (
                        <div className="text-[10px] text-cyan-300 border border-cyan-500/30 bg-cyan-900/20 px-2 py-1 inline-block w-max mt-1 skew-x-[-10deg] animate-pulse">
                            🛡️ ION_SHIELD: ONLINE
                        </div>
                    )}
                </div>

                {/* CENTER: WEAPON ARRAY */}
                <div className="flex-1 flex flex-col items-center justify-end pb-2">
                    <div className="text-[9px] text-gray-500 tracking-[0.3em] mb-2 uppercase flex items-center gap-2">
                        <span className="w-10 h-px bg-gray-800"></span>
                        ACTIVE PROTOCOLS
                        <span className="w-10 h-px bg-gray-800"></span>
                    </div>
                    
                    <div className="flex items-end gap-3">
                        {/* Utility Slots (Passive) */}
                        {data.loadout.utilities.map((u, i) => (
                            <ProtocolSlot key={`util-${i}`} skill={u} index={i + 90} type="PASSIVE" /> 
                        ))}
                        
                        {/* Divider */}
                        {data.loadout.utilities.length > 0 && <div className="w-px h-8 bg-gray-800 mx-1"></div>}

                        {/* Active Weapons */}
                        {data.loadout.weapons.map((w, i) => (
                            <ProtocolSlot key={`wep-${i}`} skill={w} index={i} type="WEAPON" />
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-12 h-12 border border-dashed border-gray-800 flex items-center justify-center opacity-20" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                                <span className="text-gray-600 text-xs">+</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: ANALYTICS */}
                <div className="w-48 text-right font-mono text-xs space-y-1 relative pb-2">
                    <div className="absolute -left-2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-900 to-transparent"></div>
                    
                    <div className="text-[9px] text-gray-600 mb-2 uppercase tracking-widest">Performance Metrics</div>

                    <div className="flex justify-between text-cyan-200/60 hover:text-cyan-200 transition-colors cursor-default">
                        <span>DPS_OUT</span>
                        <span className="text-white font-bold">{data.metrics.damage}%</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60 hover:text-cyan-200 transition-colors cursor-default">
                        <span>CYCLE_HZ</span>
                        <span className="text-white font-bold">{data.metrics.fireRate}</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60 hover:text-cyan-200 transition-colors cursor-default">
                        <span>EFF_RANGE</span>
                        <span className="text-white font-bold">{data.metrics.range}</span>
                    </div>
                    <div className="flex justify-between text-cyan-200/60 hover:text-cyan-200 transition-colors cursor-default border-t border-gray-800 mt-1 pt-1">
                        <span>CRIT_PROB</span>
                        <span className="text-yellow-400 font-bold">{data.metrics.crit}%</span>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
