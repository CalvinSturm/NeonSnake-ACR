
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Glass3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Glass3Layout: React.FC<Glass3LayoutProps> = ({ data, config, children, showUI = true }) => {
  const Shard = ({ children, className }: any) => (
      <div className={`
          bg-white/5 backdrop-blur-2xl border-t border-l border-white/40 border-b border-r border-white/10 
          shadow-[5px_5px_20px_rgba(0,0,0,0.3)]
          ${className}
      `}>
          {children}
      </div>
  );

  return (
    <div 
        className="relative bg-[#1a1a1a] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── PRISMATIC OVERLAYS ── */}
      {showUI && (
        <>
            {/* Top Left: Score Shard */}
            <Shard className="absolute top-0 left-0 p-6 pr-12 clip-shard-tl">
                <div className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Score Index</div>
                <div className="text-4xl font-light text-white tracking-tighter drop-shadow-md">
                    {data.score.current.toLocaleString()}
                </div>
            </Shard>

            {/* Top Right: Status Shard */}
            <Shard className="absolute top-0 right-0 p-6 pl-12 text-right clip-shard-tr flex flex-col items-end">
                <div className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Threat</div>
                <div className={`text-xl font-bold ${data.threat.level === 'INSANE' ? 'text-red-300' : 'text-white'}`}>
                    {data.threat.label}
                </div>
                <div className="text-xs text-white/70 mt-1">Sector {data.progression.stage}</div>
            </Shard>

            {/* Bottom Left: Vitals Shard */}
            <Shard className="absolute bottom-0 left-0 p-8 pt-12 clip-shard-bl w-64 h-32 flex items-end">
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1 text-white">
                        <span className="text-xs font-bold opacity-60">VITALS</span>
                        <span className="text-2xl font-light">{data.vitals.integrity}</span>
                    </div>
                    <div className="h-1 w-full bg-white/20">
                        <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                </div>
            </Shard>

            {/* Bottom Right: Weapon Shard */}
            <Shard className="absolute bottom-0 right-0 p-8 pt-12 clip-shard-br w-auto h-32 flex items-end justify-end gap-3">
                {data.loadout.weapons.map((w, i) => (
                    <div key={w.id} className="relative group w-12 h-12 rotate-45 border border-white/30 flex items-center justify-center bg-white/5 transition-all hover:bg-white/20 hover:scale-110 overflow-hidden">
                        <div className="-rotate-45 text-lg text-white drop-shadow-md">{w.icon}</div>
                        
                        {/* Shimmer on cooldown */}
                        {w.cooldownPct < 1 && (
                            <div className="absolute inset-0 bg-black/50 -rotate-45 transform origin-bottom transition-transform" style={{ transform: `scaleY(${1-w.cooldownPct})` }} />
                        )}
                        <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                    </div>
                ))}
            </Shard>
        </>
      )}

      <style>{`
        .clip-shard-tl { clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
        .clip-shard-tr { clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%); }
        .clip-shard-bl { clip-path: polygon(0 20%, 100% 0, 100% 100%, 0 100%); }
        .clip-shard-br { clip-path: polygon(0 0, 100% 20%, 100% 100%, 0 100%); }
      `}</style>
    </div>
  );
};
