
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Retro2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro2Layout: React.FC<Retro2LayoutProps> = ({ data, config, children, showUI = true }) => {
  const VECTOR_GREEN = '#33ff00';
  
  // Vector Line Component
  const VectorLine = ({ className, ...props }: any) => (
      <div className={`bg-transparent border border-[${VECTOR_GREEN}] shadow-[0_0_8px_${VECTOR_GREEN},inset_0_0_8px_${VECTOR_GREEN}] ${className}`} {...props} />
  );

  return (
    <div 
        className="relative bg-[#050505] overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── CRT CURVATURE & GLOW OVERLAY ── */}
      <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] rounded-[40px] border-[2px] border-[#111]" />
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,20,0,0.4)_100%)]" />
      
      {/* Scanlines (Thick, scrolling) */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(50,255,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_6px,3px_100%]"></div>

      {/* ── GAME LAYER (Pushed back slightly for depth) ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP VECTOR HEADER ── */}
            <div 
                className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                {/* Score Vector Box */}
                <div className="relative group">
                    <svg width="200" height="60" viewBox="0 0 200 60" className="fill-none stroke-[#33ff00] stroke-[1.5] drop-shadow-[0_0_5px_#33ff00]">
                        <path d="M0 0 L180 0 L200 20 L200 60 L20 60 L0 40 Z" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col justify-center px-6 pb-2">
                        <div className="text-[10px] text-[#33ff00] tracking-[0.2em] opacity-80">SCORE_VECTOR</div>
                        <div className="text-2xl font-bold text-[#33ff00] tracking-widest tabular-nums">
                            {data.score.current.toString().padStart(6, '0')}
                        </div>
                    </div>
                </div>

                {/* Radar / Compass Vector */}
                <div className="flex flex-col items-center">
                    <div className="w-48 h-8 border-b-2 border-[#33ff00] flex justify-center items-center relative overflow-hidden">
                        <div className="absolute bottom-0 w-full h-[2px] bg-[#33ff00] shadow-[0_0_10px_#33ff00]"></div>
                        {/* Ticks */}
                        {Array.from({length: 10}).map((_, i) => (
                            <div key={i} className="h-2 w-px bg-[#33ff00] absolute bottom-0" style={{ left: `${i*10 + 5}%` }}></div>
                        ))}
                        <div className="text-[#33ff00] font-bold tracking-[0.5em] text-sm animate-pulse">{data.threat.label}</div>
                    </div>
                    <div className="text-[9px] text-[#33ff00] mt-1">SECTOR {data.progression.stage}</div>
                </div>

                {/* Combo Vector */}
                <div className="relative text-right">
                    <svg width="120" height="50" viewBox="0 0 120 50" className="fill-none stroke-[#33ff00] stroke-[1.5] drop-shadow-[0_0_5px_#33ff00] opacity-80">
                        <path d="M20 0 L120 0 L120 50 L0 50 Z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-end px-4">
                        {data.score.combo > 1 ? (
                            <span className="text-xl font-bold text-[#33ff00] animate-pulse">x{data.score.combo}</span>
                        ) : (
                            <span className="text-xs text-[#33ff00] opacity-50">NO LINK</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM VECTOR DASHBOARD ── */}
            <div 
                className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end"
                style={{ height: HUD_BOTTOM_HEIGHT + 20 }}
            >
                {/* Vitals Vector Graph */}
                <div className="w-64">
                    <div className="text-[10px] text-[#33ff00] mb-1 tracking-widest">STRUCTURAL INTEGRITY</div>
                    <div className="h-8 w-full border border-[#33ff00] relative p-1">
                        {/* Segmented Bar */}
                        <div className="flex h-full gap-1">
                            {Array.from({length: 20}).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`flex-1 transition-colors duration-200 ${i < data.vitals.integrity / 5 ? 'bg-[#33ff00] shadow-[0_0_5px_#33ff00]' : 'bg-transparent border border-[#33ff00]/30'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-[#33ff00]/70">
                        <span>SHIELD: {data.vitals.shieldActive ? 'ONLINE' : 'OFFLINE'}</span>
                        <span>{data.vitals.integrity}%</span>
                    </div>
                </div>

                {/* Weapon Vectors */}
                <div className="flex gap-4">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group flex flex-col items-center">
                            {/* Hexagon SVG Frame */}
                            <svg width="50" height="55" viewBox="0 0 50 55" className={`fill-none stroke-[1.5] transition-all ${w.cooldownPct >= 1 ? 'stroke-[#33ff00] drop-shadow-[0_0_8px_#33ff00]' : 'stroke-[#115500]'}`}>
                                <path d="M25 0 L50 14 L50 41 L25 55 L0 41 L0 14 Z" />
                            </svg>
                            
                            {/* Icon */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg ${w.active ? 'text-[#33ff00]' : 'text-[#115500]'}`}>
                                {w.icon}
                            </div>

                            {/* Cooldown Fill (Simulated by opacity or internal rect) */}
                            {w.cooldownPct < 1 && (
                                <div className="absolute inset-0 bg-[#000]/80 flex items-end justify-center pb-2">
                                    <div className="w-8 h-1 bg-[#115500]">
                                        <div className="h-full bg-[#33ff00]" style={{ width: `${w.cooldownPct * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Telemetry Data */}
                <div className="text-right font-mono text-[#33ff00] text-xs leading-relaxed opacity-80">
                    <div>DPS_OUTPUT: {data.metrics.damage}</div>
                    <div>CYCLE_SPD: {data.metrics.fireRate}</div>
                    <div>EFFICIENCY: {data.metrics.crit}%</div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
