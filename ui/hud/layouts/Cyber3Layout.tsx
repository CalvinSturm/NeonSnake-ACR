
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Cyber3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Cyber3Layout: React.FC<Cyber3LayoutProps> = ({ data, config, children, showUI = true }) => {
  const SynapseLine = ({ x1, y1, x2, y2, active = false }: any) => (
      <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <path 
            d={`M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`}
            fill="none"
            stroke={active ? "rgba(0, 255, 255, 0.4)" : "rgba(0, 255, 255, 0.1)"}
            strokeWidth={active ? "2" : "1"}
            strokeDasharray={active ? "none" : "4 4"}
          />
      </svg>
  );

  return (
    <div 
        className="relative bg-[#030305] overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── NEURAL WEB BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_70%)]" />

      {showUI && (
        <>
            {/* ── CENTRAL HUD CLUSTER (Top) ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="text-[10px] text-cyan-500 tracking-[0.3em] mb-1">NEURAL_LINK</div>
                <div className="flex items-end gap-4">
                    {/* Score Node */}
                    <div className="flex flex-col items-end">
                        <div className="text-3xl font-display font-bold text-white drop-shadow-[0_0_10px_cyan]">
                            {data.score.current.toLocaleString()}
                        </div>
                    </div>
                    {/* Level Hex */}
                    <div className="w-10 h-10 bg-cyan-900/50 border border-cyan-400 flex items-center justify-center rotate-45 shadow-[0_0_15px_cyan]">
                        <div className="-rotate-45 text-white font-bold">{data.progression.level}</div>
                    </div>
                    {/* Stage Node */}
                    <div className="flex flex-col items-start">
                        <div className="text-xl font-display font-bold text-cyan-200">
                            SEC-{data.progression.stage.toString().padStart(2,'0')}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FLOATING PERIPHERAL NODES ── */}
            
            {/* Left: Vitals Cluster */}
            <div className="absolute bottom-20 left-10 z-20">
                <div className="relative">
                    {/* Central HP Orb */}
                    <div className="w-20 h-20 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative bg-black/60 backdrop-blur-sm">
                        <div className="absolute inset-2 rounded-full border border-cyan-500/20 animate-spin-slow"></div>
                        <span className="text-2xl font-bold text-white">{data.vitals.integrity}%</span>
                        {/* Fill Ring */}
                        <svg className="absolute inset-[-4px] w-[88px] h-[88px] -rotate-90">
                            <circle cx="44" cy="44" r="42" fill="none" stroke={data.vitals.integrity < 30 ? "#f00" : "#0ff"} strokeWidth="4" strokeDasharray="264" strokeDashoffset={264 * (1 - data.vitals.integrity/100)} />
                        </svg>
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-cyan-500 font-mono tracking-widest">INTEGRITY</div>
                </div>
            </div>

            {/* Right: Combat Cluster */}
            <div className="absolute bottom-20 right-10 z-20 flex flex-col items-end gap-4">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-3 group relative">
                        {/* Label (Slide out on hover) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-cyan-300 font-mono absolute right-14 whitespace-nowrap bg-black/80 px-2 py-1 rounded">
                            {w.label || w.id}
                        </div>
                        
                        {/* Node */}
                        <div className={`
                            w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all
                            ${w.active ? 'border-cyan-400 shadow-[0_0_10px_cyan]' : 'border-gray-700 opacity-50'}
                        `}>
                            <span className="text-lg">{w.icon}</span>
                            
                            {/* Cooldown Ring */}
                            {w.cooldownPct < 1 && (
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="22" cy="22" r="20" fill="none" stroke="#00ffff" strokeWidth="2" strokeDasharray="125" strokeDashoffset={125 * (1 - w.cooldownPct)} />
                                </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── CONNECTING SYNAPSE LINES (Simulated positions) ── */}
            {/* Lines are purely decorative here, imagining dynamic positions would require refs */}
            {/* Visual fluff for bottom center */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center z-20 opacity-70">
                <div className="text-[9px] text-cyan-600 tracking-[0.5em] animate-pulse">{data.threat.label}</div>
                <div className="w-64 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-1"></div>
            </div>
        </>
      )}
    </div>
  );
};
