
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Minimal3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal3Layout: React.FC<Minimal3LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            {/* ── UNIFIED PILL CONTAINER ── */}
            <div className="flex items-center bg-zinc-900/90 border border-zinc-700 rounded-full px-4 py-2 shadow-2xl gap-6 backdrop-blur-xl">
                
                {/* Health (Circular Graph) */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#333" strokeWidth="3" />
                        <circle 
                            cx="20" cy="20" r="18" fill="none" 
                            stroke={data.vitals.integrity < 30 ? "#ef4444" : "#fff"} 
                            strokeWidth="3" 
                            strokeDasharray="113" 
                            strokeDashoffset={113 * (1 - data.vitals.integrity/100)} 
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="text-xs font-bold text-white">{data.vitals.integrity}</span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-zinc-700"></div>

                {/* Score & Stage */}
                <div className="flex flex-col items-center">
                    <div className="text-sm font-bold text-white tabular-nums">{data.score.current.toLocaleString()}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                        SEC {data.progression.stage} • LVL {data.progression.level}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-zinc-700"></div>

                {/* Weapons (Minimal Dots) */}
                <div className="flex gap-2">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group cursor-help">
                            <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ${w.active ? 'text-white' : 'text-zinc-600'}`}>
                                <span className="text-[10px]">{w.icon}</span>
                            </div>
                            {w.cooldownPct < 1 && (
                                <div className="absolute inset-0 bg-black/50 rounded-full" style={{ clipPath: `inset(${w.cooldownPct * 100}% 0 0 0)` }}></div>
                            )}
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

            </div>
        </div>
      )}
    </div>
  );
};
