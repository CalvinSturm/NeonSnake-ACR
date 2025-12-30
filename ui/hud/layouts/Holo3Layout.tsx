
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Holo3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo3Layout: React.FC<Holo3LayoutProps> = ({ data, config, children, showUI = true }) => {
  // Color: Iron Man Gold/Red or Tech Blue? Let's stick to Tactical Cyan/White.
  
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── CORNER BRACKETS (Focus Frame) ── */}
            <div className="absolute inset-8 border-2 border-cyan-500/30 pointer-events-none z-20 rounded-lg">
                {/* Corners */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>
            </div>

            {/* ── FLOATING DATA CLUSTERS ── */}
            
            {/* Top Center: Threat Analysis */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <div className="text-[10px] text-cyan-500 uppercase tracking-widest bg-black/60 px-2">Scanning Hostiles</div>
                <div className="w-px h-8 bg-cyan-500/50"></div>
                <div className={`text-lg font-bold ${data.threat.colorClass} bg-black/40 px-4 py-1 border border-cyan-500/30`}>
                    {data.threat.label}
                </div>
            </div>

            {/* Right Side: Weapon Systems List */}
            <div className="absolute top-1/2 right-12 -translate-y-1/2 z-30 flex flex-col gap-4 items-end">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-2 group">
                        <div className="text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">{w.label}</div>
                        <div className={`w-2 h-2 rounded-full ${w.active ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-gray-600'}`}></div>
                        <div className="text-xs font-bold text-white border border-cyan-500/30 p-1 w-6 h-6 flex items-center justify-center">{i+1}</div>
                    </div>
                ))}
            </div>

            {/* Bottom: Vitals & Score Bar */}
            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end z-30">
                <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-500">ARMOR STATUS</span>
                    <div className="text-4xl font-light text-white">{data.vitals.integrity}<span className="text-lg">%</span></div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-cyan-500">SCORE</span>
                    <div className="text-2xl font-bold text-white">{data.score.current.toLocaleString()}</div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
