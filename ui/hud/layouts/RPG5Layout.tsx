
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPG5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG5Layout: React.FC<RPG5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#080810] overflow-hidden font-serif text-[#e0e0ff]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP: SCORE BANNER ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="relative">
                    {/* Decorative Wings */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-12 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent opacity-20 blur-xl"></div>
                    
                    <div className="text-3xl font-bold tracking-widest text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {data.score.current.toLocaleString()}
                    </div>
                </div>
                {data.score.combo > 1 && (
                    <div className="text-sm font-bold text-white uppercase tracking-widest mt-1">
                        Divine Combo x{data.score.combo}
                    </div>
                )}
            </div>

            {/* ── BOTTOM: CELESTIAL HUD ── */}
            <div className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-8 pb-6 pointer-events-none">
                
                {/* Left: Health Orb */}
                <div className="relative w-32 h-32 pointer-events-auto">
                    <div className="absolute inset-2 rounded-full bg-black border-4 border-[#443322] overflow-hidden shadow-2xl">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#880000] via-[#ff0000] to-[#ff8888] transition-all duration-500"
                            style={{ height: `${data.vitals.integrity}%` }}
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_black] rounded-full pointer-events-none"></div>
                        {/* Shine */}
                        <div className="absolute top-4 left-6 w-8 h-4 bg-white/30 rounded-full rotate-[-45deg] blur-md pointer-events-none"></div>
                    </div>
                    {/* Gold Frame */}
                    <div className="absolute inset-0 border-[6px] border-[#ffd700] rounded-full shadow-[0_0_20px_#ffd700] pointer-events-none opacity-80"></div>
                    <div className="absolute -bottom-4 w-full text-center text-sm font-bold text-[#ffd700] drop-shadow-md">
                        {data.vitals.integrity} HP
                    </div>
                </div>

                {/* Center: Skill Bar (Winged) */}
                <div className="flex-1 flex flex-col items-center justify-end pb-2 pointer-events-auto">
                    <div className="flex items-center gap-2 bg-[#1a1020]/90 p-2 rounded-lg border-2 border-[#554466] shadow-2xl relative">
                        {/* Wing Deco Left */}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-12 h-20 bg-contain bg-no-repeat opacity-50" style={{ backgroundImage: 'radial-gradient(circle at right, #ffd700 0%, transparent 70%)' }}></div>
                        
                        {data.loadout.weapons.map((w, i) => (
                            <div key={w.id} className="relative group w-12 h-12 bg-black border border-[#665577] flex items-center justify-center rounded hover:border-[#ffd700] transition-colors">
                                <span className={`text-2xl drop-shadow-md ${w.active ? 'text-white' : 'text-gray-600 grayscale'}`}>{w.icon}</span>
                                {!w.active && (
                                    <div className="absolute inset-0 bg-black/60 rounded flex items-end">
                                        <div className="w-full bg-[#ffd700]" style={{ height: `${w.cooldownPct * 100}%` }}></div>
                                    </div>
                                )}
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#332244] border border-[#665577] rounded-full flex items-center justify-center text-[10px] font-bold text-[#ffd700]">
                                    {w.level}
                                </div>
                                <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                            </div>
                        ))}

                        {/* Wing Deco Right */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 w-12 h-20 bg-contain bg-no-repeat opacity-50" style={{ backgroundImage: 'radial-gradient(circle at left, #ffd700 0%, transparent 70%)' }}></div>
                    </div>
                    
                    {/* XP Bar */}
                    <div className="w-96 h-2 bg-black border border-[#443355] rounded-full mt-2 relative overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] text-[#aaaaff] mt-1 font-bold tracking-widest uppercase">Level {data.progression.level}</div>
                </div>

                {/* Right: Mana/Shield Orb */}
                <div className="relative w-32 h-32 pointer-events-auto">
                    <div className="absolute inset-2 rounded-full bg-black border-4 border-[#223344] overflow-hidden shadow-2xl">
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#004488] via-[#0088ff] to-[#88ccff] transition-all duration-500"
                            style={{ height: data.vitals.shieldActive ? '100%' : '0%' }}
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_black] rounded-full pointer-events-none"></div>
                        {/* Shine */}
                        <div className="absolute top-4 right-6 w-8 h-4 bg-white/30 rounded-full rotate-[45deg] blur-md pointer-events-none"></div>
                    </div>
                    {/* Silver Frame */}
                    <div className="absolute inset-0 border-[6px] border-[#c0c0c0] rounded-full shadow-[0_0_20px_#c0c0c0] pointer-events-none opacity-80"></div>
                    <div className="absolute -bottom-4 w-full text-center text-sm font-bold text-[#c0c0c0] drop-shadow-md">
                        SHIELD
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
