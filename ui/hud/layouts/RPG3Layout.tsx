
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPG3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG3Layout: React.FC<RPG3LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#0a0505] overflow-hidden font-serif text-slate-200"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />

      {showUI && (
        <>
            {/* ── TOP RIGHT: SOULS (SCORE) ── */}
            <div className="absolute top-8 right-8 z-20 flex flex-col items-end">
                <div className="bg-gradient-to-l from-black/80 to-transparent p-2 pr-4 border-r-2 border-slate-600">
                    <div className="text-3xl font-medium tracking-widest text-slate-100 drop-shadow-md">
                        {data.score.current.toLocaleString()}
                    </div>
                    {data.score.combo > 1 && (
                        <div className="text-right text-amber-600 text-sm font-bold tracking-wider">
                            Combos: {data.score.combo}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM LEFT: VITALS ── */}
            <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2">
                {/* Health Bar */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-900 border border-red-500 flex items-center justify-center text-[10px] text-red-200 shadow-[0_0_10px_red]">HP</div>
                    <div className="w-64 h-3 bg-black/60 border border-slate-700 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-300"
                            style={{ width: `${data.vitals.integrity}%` }}
                        />
                    </div>
                </div>

                {/* XP Bar (Stamina) */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-900 border border-green-500 flex items-center justify-center text-[10px] text-green-200">XP</div>
                    <div className="w-48 h-2 bg-black/60 border border-slate-700 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-green-900 to-green-600 transition-all duration-300"
                            style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}
                        />
                    </div>
                </div>
                
                {/* Buffs Row */}
                <div className="flex gap-2 mt-1 pl-8">
                    {data.vitals.shieldActive && (
                        <div className="w-6 h-6 border border-blue-500 bg-blue-900/50 rounded-sm flex items-center justify-center text-[10px]" title="Shield">🛡️</div>
                    )}
                    <div className="text-xs text-slate-500 self-center uppercase tracking-widest">{data.threat.label}</div>
                </div>
            </div>

            {/* ── BOTTOM RIGHT: EQUIPMENT DIAMOND ── */}
            <div className="absolute bottom-8 right-8 z-20">
                <div className="relative w-32 h-32">
                    {/* Rotate container to make diamond */}
                    <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-2 rotate-45 transform origin-center">
                        {data.loadout.weapons.slice(0,4).map((w, i) => (
                            <div key={w.id} className="relative w-12 h-12 bg-slate-900/90 border-2 border-slate-600 shadow-xl flex items-center justify-center group overflow-hidden">
                                {/* Un-rotate icon */}
                                <div className={`-rotate-45 text-2xl ${w.active ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {w.icon}
                                </div>
                                
                                {/* Cooldown Overlay */}
                                {!w.active && (
                                    <div 
                                        className="absolute inset-0 bg-black/70 origin-bottom transition-all duration-100"
                                        style={{ height: `${(1-w.cooldownPct)*100}%` }}
                                    />
                                )}

                                {/* Hover Info (Rotated back) */}
                                <div className="-rotate-45 absolute bottom-[120%] right-[120%] w-32 bg-black/90 p-2 text-xs border border-slate-600 opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                    <div className="font-bold text-amber-500">{w.label}</div>
                                    <div className="text-[10px] text-slate-400">{w.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
