
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Mech3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech3Layout: React.FC<Mech3LayoutProps> = ({ data, config, children, showUI = true }) => {
  const HUD_GREEN = '#00ff00';
  const HUD_DIM = 'rgba(0, 255, 0, 0.3)';

  // Reusable Tape Component
  const LadderTape = ({ value, label, side }: { value: number, label: string, side: 'left' | 'right' }) => (
      <div className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-20' : 'right-20'} h-64 w-12 flex flex-col items-center overflow-hidden border-y border-${side === 'left' ? 'r' : 'l'} border-[${HUD_GREEN}]`}>
          <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-black to-transparent z-10"></div>
          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black to-transparent z-10"></div>
          
          <div className="flex flex-col gap-2 transition-transform duration-300" style={{ transform: `translateY(${value % 10 * 2}px)` }}>
              {Array.from({length: 15}).map((_, i) => (
                  <div key={i} className="flex items-center gap-1 w-full justify-between px-1">
                      {side === 'left' && <span className="text-[8px] text-[#00ff00] opacity-50">--</span>}
                      <div className="w-full h-px bg-[#00ff00] opacity-30"></div>
                      {side === 'right' && <span className="text-[8px] text-[#00ff00] opacity-50">--</span>}
                  </div>
              ))}
          </div>
          
          {/* Center Indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex items-center justify-center z-20">
              <div className={`border border-[#00ff00] bg-black px-1 text-xs font-bold text-[#00ff00]`}>
                  {Math.floor(value)}
              </div>
          </div>
          
          <div className={`absolute top-0 ${side === 'left' ? '-left-8' : '-right-8'} text-[10px] text-[#00ff00] font-bold rotate-90 origin-center translate-y-10`}>{label}</div>
      </div>
  );

  return (
    <div 
        className="relative bg-[#001100] overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── HUD OVERLAY ── */}
      <div className="absolute inset-0 pointer-events-none z-10">
          {/* Artificial Horizon Line (Static for now) */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-[#00ff00] opacity-20"></div>
          <div className="absolute top-0 left-1/2 h-full w-px bg-[#00ff00] opacity-10"></div>
          
          {/* Center Reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-[#00ff00] opacity-50 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-[#00ff00]"></div>
          </div>
      </div>

      {showUI && (
        <>
            {/* LEFT TAPE: SPEED (Fire Rate) */}
            <LadderTape value={data.metrics.fireRate} label="RPM" side="left" />
            
            {/* RIGHT TAPE: ALTITUDE (Score/100) */}
            <LadderTape value={data.score.current / 100} label="ALT" side="right" />

            {/* TOP BAR: HEADING */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center w-64 bg-black/40 border border-[#00ff00] px-2 py-1">
                <div className="flex justify-between w-full text-[10px] text-[#00ff00]">
                    <span>090</span>
                    <span className="font-bold text-lg">{data.threat.label}</span>
                    <span>270</span>
                </div>
                <div className="w-full flex justify-center text-[#00ff00]">
                    ▼
                </div>
            </div>

            {/* BOTTOM LEFT: WEAPONS */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                <div className="text-[10px] text-[#00ff00] border-b border-[#00ff00] w-full mb-1">ORDNANCE</div>
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 border border-[#00ff00] ${w.active ? 'bg-[#00ff00]' : 'bg-transparent'}`}></div>
                        <span className={`text-xs ${w.active ? 'text-[#00ff00]' : 'text-green-900'} font-bold`}>
                            {w.label || 'WPN ' + (i+1)}
                        </span>
                        {w.cooldownPct < 1 && <span className="text-[10px] text-red-500">REL</span>}
                    </div>
                ))}
            </div>

            {/* BOTTOM RIGHT: SYSTEMS */}
            <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1">
                <div className="text-[10px] text-[#00ff00] border-b border-[#00ff00] w-full text-right mb-1">SYSTEMS</div>
                <div className="flex justify-between w-32">
                    <span className="text-xs text-green-700">INTEGRITY</span>
                    <span className={`text-xs font-bold ${data.vitals.integrity < 30 ? 'text-red-500 animate-pulse' : 'text-[#00ff00]'}`}>{data.vitals.integrity}%</span>
                </div>
                <div className="flex justify-between w-32">
                    <span className="text-xs text-green-700">FUEL</span>
                    <span className="text-xs text-[#00ff00]">OK</span>
                </div>
                {data.vitals.shieldActive && (
                    <div className="flex justify-between w-32">
                        <span className="text-xs text-green-700">SHIELD</span>
                        <span className="text-xs text-cyan-400 font-bold">ONLINE</span>
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};
