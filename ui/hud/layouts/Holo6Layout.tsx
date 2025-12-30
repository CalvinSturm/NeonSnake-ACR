
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Holo6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo6Layout: React.FC<Holo6LayoutProps> = ({ data, config, children, showUI = true }) => {
  const COLOR_MAIN = '#00aaff'; // Arc Reactor Blue
  
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── CORNER ARCS (Helmet HUD) ── */}
            <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full opacity-80" stroke={COLOR_MAIN} fill="none" strokeWidth="2">
                <path d="M 40 100 A 100 100 0 0 1 100 40" strokeOpacity="0.5" />
                <path d="M 40 100 L 20 120" strokeWidth="1" />
                
                <path d={`M ${CANVAS_WIDTH-40} 100 A 100 100 0 0 0 ${CANVAS_WIDTH-100} 40`} strokeOpacity="0.5" />
                
                <path d={`M 40 ${CANVAS_HEIGHT-100} A 100 100 0 0 0 100 ${CANVAS_HEIGHT-40}`} strokeOpacity="0.5" />
                
                <path d={`M ${CANVAS_WIDTH-40} ${CANVAS_HEIGHT-100} A 100 100 0 0 1 ${CANVAS_WIDTH-100} ${CANVAS_HEIGHT-40}`} strokeOpacity="0.5" />
            </svg>

            {/* ── CENTER RETICLE (Rotating) ── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-40">
                <div className="w-64 h-64 border border-cyan-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-4 border border-dashed border-cyan-500/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                </div>
            </div>

            {/* ── LEFT WING: VITALS ── */}
            <div className="absolute bottom-20 left-12 z-30">
                <div className="relative w-32 h-32">
                    {/* Concentric Rings */}
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-900 border-l-cyan-400 rotate-[-45deg]"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-cyan-900/50"></div>
                    
                    {/* Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-200">
                        <span className="text-3xl font-bold">{data.vitals.integrity}</span>
                        <span className="text-[9px]">ARMOR</span>
                    </div>
                </div>
            </div>

            {/* ── RIGHT WING: WEAPONS ── */}
            <div className="absolute bottom-20 right-12 z-30 text-right">
                <div className="text-[10px] text-cyan-500 mb-2">SYSTEMS_ONLINE</div>
                <div className="flex flex-col gap-2 items-end">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="flex items-center gap-2">
                            <span className="text-xs text-cyan-200">{w.label?.split(' ')[0]}</span>
                            <div className={`w-32 h-2 bg-cyan-900/50 border border-cyan-600/50 relative overflow-hidden`}>
                                <div className={`h-full ${w.active ? 'bg-cyan-400' : 'bg-cyan-900'}`} style={{ width: `${w.cooldownPct * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── TOP: DATA FEED ── */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="text-xs text-cyan-600 tracking-[0.5em] mb-1">{data.threat.label}</div>
                <div className="text-2xl font-bold text-white tracking-widest">{data.score.current}</div>
            </div>
        </>
      )}
    </div>
  );
};
