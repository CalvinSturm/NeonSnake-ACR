
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPG4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG4Layout: React.FC<RPG4LayoutProps> = ({ data, config, children, showUI = true }) => {
  const hpPct = data.vitals.integrity;
  const xpPct = (data.progression.xp / data.progression.xpMax) * 100;

  return (
    <div 
        className="relative bg-[#0a0500] overflow-hidden font-serif text-[#eecfa1]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP CENTER: BOSS BAR / THREAT ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-1/3">
                <div className="text-center text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-1 drop-shadow-md bg-black/60 rounded-full px-4 border border-[#554433]">
                    {data.threat.label}
                </div>
                {/* Stage Progress / Timer could go here */}
            </div>

            {/* ── BOTTOM HUD: CLASSIC ARPG ── */}
            <div className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end pointer-events-none">
                
                {/* LEFT GLOBE (HP) */}
                <div className="relative w-40 h-40 -mb-8 -ml-8 pointer-events-auto">
                    <div className="absolute inset-4 rounded-full bg-black border-4 border-[#3d1818] shadow-inner overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#660000] to-[#ff0000] transition-all duration-300"
                            style={{ height: `${hpPct}%` }}
                        />
                        {/* Shine */}
                        <div className="absolute top-2 left-4 w-8 h-4 bg-white/20 rounded-full rotate-[-45deg] blur-md"></div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Frame art would go here */}
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#c5a059] stroke-[3]">
                            <circle cx="50" cy="50" r="48" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl drop-shadow-md">
                        {data.vitals.integrity}
                    </div>
                </div>

                {/* CENTER SKILL BAR */}
                <div className="flex-1 flex flex-col items-center justify-end pb-4 gap-1 pointer-events-auto">
                    {/* XP Bar */}
                    <div className="w-96 h-1.5 bg-[#111] border border-[#333] rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-[#c5a059]" style={{ width: `${xpPct}%` }}></div>
                    </div>

                    <div className="flex gap-1 bg-[#1a1510] p-2 border border-[#554433] rounded shadow-2xl">
                        {data.loadout.weapons.map((w, i) => (
                            <div key={w.id} className="relative group w-12 h-12 bg-[#050505] border border-[#443322] flex items-center justify-center hover:border-[#ffd700] transition-colors">
                                <span className={`text-2xl ${w.active ? 'opacity-100' : 'opacity-40 grayscale'}`}>{w.icon}</span>
                                {!w.active && (
                                    <div className="absolute inset-0 bg-black/60 flex items-end">
                                        <div className="w-full bg-[#c5a059]" style={{ height: `${w.cooldownPct * 100}%` }}></div>
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 text-[8px] bg-[#332211] px-1 border-l border-b border-[#443322] text-[#c5a059]">{i+1}</div>
                                <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                            </div>
                        ))}
                        {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                            <div key={`e-${i}`} className="w-12 h-12 bg-[#050505] border border-[#221a11] flex items-center justify-center opacity-30">
                                <span>+</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-[10px] text-[#887766] uppercase tracking-widest mt-1">
                        LEVEL {data.progression.level} • SCORE {data.score.current.toLocaleString()}
                    </div>
                </div>

                {/* RIGHT GLOBE (MANA/RESOURCE - Just decorative or for secondary resource like Shield?) */}
                {/* Let's make it Shield or just decorative symmetry */}
                <div className="relative w-40 h-40 -mb-8 -mr-8 pointer-events-auto">
                    <div className="absolute inset-4 rounded-full bg-black border-4 border-[#18183d] shadow-inner overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#000066] to-[#3333ff] transition-all duration-300"
                            style={{ height: data.vitals.shieldActive ? '100%' : '0%' }}
                        />
                        {/* Shine */}
                        <div className="absolute top-2 right-4 w-8 h-4 bg-white/20 rounded-full rotate-[45deg] blur-md"></div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#c5a059] stroke-[3]">
                            <circle cx="50" cy="50" r="48" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-blue-200 drop-shadow-md">
                        {data.vitals.shieldActive ? 'SHIELDED' : 'UNSHIELDED'}
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
