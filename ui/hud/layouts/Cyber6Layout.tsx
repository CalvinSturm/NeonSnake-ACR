
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Cyber6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Cyber6Layout: React.FC<Cyber6LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono text-cyan-50"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER (Integrated) ── */}
      <div className="absolute inset-0 z-0 scale-[0.98] transition-transform duration-500">
          {children}
      </div>

      {/* ── SINGULARITY OVERLAY ── */}
      {/* Scan Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      {/* Vignette Corners */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,20,0.8)_100%)]" />

      {showUI && (
        <>
            {/* ── TOP CLUSTER: NEURAL LINK ── */}
            <div className="absolute top-4 w-full flex justify-between px-8 items-start z-20">
                
                {/* Left: Score Node */}
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 border-2 border-cyan-500 rounded-full flex items-center justify-center relative bg-black/60 backdrop-blur-md shadow-[0_0_20px_cyan]">
                        <div className="absolute inset-1 border border-cyan-300 rounded-full animate-spin-slow border-t-transparent" />
                        <span className="font-bold text-cyan-100">{data.progression.level}</span>
                        <div className="absolute -bottom-6 text-[9px] text-cyan-500 tracking-widest">SYNC_LVL</div>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-[10px] text-cyan-400 font-bold tracking-[0.3em] uppercase mb-1">Score_Kernel</div>
                        <div className="text-4xl font-black text-white tracking-widest leading-none drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                            {data.score.current.toLocaleString()}
                        </div>
                        {data.score.combo > 1 && (
                            <div className="text-sm font-bold text-yellow-400 animate-pulse tracking-widest mt-1">
                                 CHAIN_LINK_ACTIVE x{data.score.combo}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Threat Node */}
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-red-500 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] tracking-[0.3em] font-bold">THREAT_VECTOR</span>
                    </div>
                    <div className={`text-2xl font-black uppercase ${data.threat.colorClass} tracking-widest`}>
                        {data.threat.label}
                    </div>
                    <div className="w-full h-1 bg-red-900/50 mt-1 overflow-hidden">
                        <div className="h-full bg-red-500 animate-[scan_2s_linear_infinite] w-full origin-left transform scale-x-50"></div>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM HUD: CYBERDECK ── */}
            <div className="absolute bottom-8 left-8 right-8 z-20 flex justify-between items-end">
                
                {/* Left: Vitals Graph */}
                <div className="w-72 bg-black/80 border-t border-l border-cyan-500/50 p-4 relative backdrop-blur-md clip-cyber-left">
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500"></div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-cyan-400 font-bold tracking-widest">INTEGRITY_CHECK</span>
                        <span className="text-2xl font-bold text-white">{data.vitals.integrity}%</span>
                    </div>
                    {/* Complex Bar */}
                    <div className="h-4 w-full bg-gray-900/80 relative overflow-hidden flex gap-0.5">
                        {Array.from({length: 20}).map((_, i) => (
                            <div 
                                key={i}
                                className={`flex-1 transition-all duration-300 ${i < data.vitals.integrity / 5 ? (data.vitals.integrity < 30 ? 'bg-red-500' : 'bg-cyan-500') : 'bg-transparent'}`}
                                style={{ 
                                    opacity: i < data.vitals.integrity / 5 ? 1 : 0.1,
                                    boxShadow: i < data.vitals.integrity / 5 ? `0 0 5px ${data.vitals.integrity < 30 ? 'red' : 'cyan'}` : 'none'
                                }}
                            />
                        ))}
                    </div>
                    {data.vitals.shieldActive && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-400 rotate-45 animate-pulse shadow-[0_0_10px_cyan]"></div>
                            <span className="text-xs text-cyan-200 font-bold tracking-widest">ION_SHIELD ONLINE</span>
                        </div>
                    )}
                </div>

                {/* Center: Weapon Hex Grid */}
                <div className="flex gap-2 items-end pb-2">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group">
                            <div className={`
                                w-14 h-16 clip-hex flex items-center justify-center border-2 transition-all duration-300
                                ${w.active ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'bg-black/60 border-gray-800 opacity-60'}
                            `}>
                                <div className={`text-xl z-10 ${w.active ? 'text-white drop-shadow-[0_0_5px_cyan]' : 'text-gray-500 grayscale'}`}>{w.icon}</div>
                                
                                {/* Cooldown Fill */}
                                {!w.active && (
                                    <div 
                                        className="absolute inset-0 bg-black/80 z-20 origin-bottom transition-all duration-75"
                                        style={{ height: `${(1-w.cooldownPct) * 100}%` }}
                                    />
                                )}
                            </div>
                            {/* Level Pip */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {Array.from({length: Math.min(3, w.level)}).map((_, i) => (
                                    <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_2px_cyan]"></div>
                                ))}
                            </div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Right: Analytics Stream */}
                <div className="w-48 bg-black/80 border-t border-r border-cyan-500/50 p-4 relative backdrop-blur-md clip-cyber-right text-right">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500"></div>
                    <div className="text-[10px] text-cyan-400 font-bold tracking-widest mb-2">LIVE_METRICS</div>
                    
                    <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-cyan-600">
                            <span>DPS_OUTPUT</span>
                            <span className="text-white font-bold">{data.metrics.damage}</span>
                        </div>
                        <div className="flex justify-between text-cyan-600">
                            <span>CYCLE_RATE</span>
                            <span className="text-white font-bold">{data.metrics.fireRate}</span>
                        </div>
                        <div className="flex justify-between text-cyan-600">
                            <span>CRIT_PROB</span>
                            <span className="text-yellow-400 font-bold">{data.metrics.crit}%</span>
                        </div>
                    </div>
                </div>

            </div>
        </>
      )}

      <style>{`
        .clip-cyber-left { clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%); }
        .clip-cyber-right { clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%); }
        .clip-hex { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
      `}</style>
    </div>
  );
};
