
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Glass7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass7Layout: React.FC<Glass7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#111] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── GLASS FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y border-white/10"
        style={{ top: HUD_TOP_HEIGHT, height: PLAY_AREA_HEIGHT }}
      ></div>

      {showUI && (
        <>
            {/* ── TOP PANE ── */}
            <div 
                className="absolute top-0 left-0 w-full bg-black/80 backdrop-blur-xl z-20 flex justify-between px-8 items-center"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="text-white">
                    <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Runtime Score</div>
                    <div className="text-3xl font-light tracking-wide">{data.score.current.toLocaleString()}</div>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Sector</div>
                        <div className="text-xl font-bold text-white">{data.progression.stage.toString().padStart(2,'0')}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${data.threat.level === 'INSANE' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                        {data.threat.label}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM PANE ── */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl z-20 flex justify-between px-8 items-center"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                <div className="flex gap-4 items-center">
                    <div className="relative w-12 h-12 flex items-center justify-center border border-white/20 rounded-full">
                        <span className="text-sm font-bold text-white">{data.vitals.integrity}</span>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="23" fill="none" stroke={data.vitals.integrity < 30 ? '#ef4444' : '#ffffff'} strokeWidth="2" strokeDasharray="144" strokeDashoffset={144 * (1 - data.vitals.integrity/100)} />
                        </svg>
                    </div>
                    {data.vitals.shieldActive && <span className="text-xs text-cyan-400 font-bold tracking-widest">SHIELD ON</span>}
                </div>

                <div className="flex gap-3">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="group relative w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                            <span className="text-xl text-white opacity-80">{w.icon}</span>
                            {w.cooldownPct < 1 && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl" style={{ clipPath: `inset(${w.cooldownPct * 100}% 0 0 0)` }}></div>
                            )}
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
