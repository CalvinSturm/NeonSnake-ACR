
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Glass5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass5Layout: React.FC<Glass5LayoutProps> = ({ data, config, children, showUI = true }) => {
  const GlassPill = ({ children, className }: any) => (
      <div className={`bg-white/10 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full ${className}`}>
          {children}
      </div>
  );

  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* Top Bar: Floating Status */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                <GlassPill className="px-6 py-2 flex flex-col items-center min-w-[120px]">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Score</span>
                    <span className="text-xl font-bold text-white">{data.score.current.toLocaleString()}</span>
                </GlassPill>
                
                <GlassPill className="px-6 py-2 flex flex-col items-center min-w-[120px]">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Threat</span>
                    <span className={`text-xl font-bold ${data.threat.level === 'INSANE' ? 'text-red-300' : 'text-white'}`}>{data.threat.label}</span>
                </GlassPill>
            </div>

            {/* Bottom Dock */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <GlassPill className="p-3 flex items-center gap-6">
                    {/* Health Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                            <circle 
                                cx="24" cy="24" r="20" 
                                stroke={data.vitals.integrity < 30 ? '#ff6b6b' : '#4ecdc4'} 
                                strokeWidth="4" 
                                strokeDasharray={125}
                                strokeDashoffset={125 * (1 - data.vitals.integrity/100)}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                        <span className="text-xs font-bold text-white">{data.vitals.integrity}</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/20"></div>

                    {/* Weapon Icons */}
                    <div className="flex gap-2">
                        {data.loadout.weapons.map((w) => (
                            <div key={w.id} className="relative group w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center cursor-help">
                                <span className="text-sm drop-shadow">{w.icon}</span>
                                {w.cooldownPct < 1 && (
                                    <div className="absolute inset-0 bg-black/40 rounded-full" style={{ clipPath: `inset(${w.cooldownPct*100}% 0 0 0)` }} />
                                )}
                                <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/20"></div>

                    {/* Level Badge */}
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[8px] font-bold text-white/60">LEVEL</span>
                        <span className="text-lg font-bold text-white">{data.progression.level}</span>
                    </div>
                </GlassPill>
            </div>
        </>
      )}
    </div>
  );
};
