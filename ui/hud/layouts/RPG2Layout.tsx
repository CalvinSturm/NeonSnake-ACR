
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPG2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG2Layout: React.FC<RPG2LayoutProps> = ({ data, config, children, showUI = true }) => {
  const hpPct = data.vitals.integrity;
  const xpPct = (data.progression.xp / data.progression.xpMax) * 100;

  // MMO Skill Slot
  const SkillSlot: React.FC<{ skill: any; hotkey: string }> = ({ skill, hotkey }) => {
      const isReady = skill.cooldownPct >= 1;
      return (
          <div className="relative group flex flex-col items-center">
              <div className={`
                  w-12 h-12 bg-[#1a1510] border-2 relative overflow-hidden shadow-lg
                  ${isReady ? 'border-[#ffd700] shadow-[0_0_10px_#ffd700]' : 'border-[#555]'}
                  transition-all duration-200 rounded
              `}>
                  {/* Icon */}
                  <div className={`absolute inset-0 flex items-center justify-center text-xl ${isReady ? 'text-white' : 'text-gray-500 grayscale'}`}>
                      {skill.icon}
                  </div>
                  
                  {/* Cooldown Sweep (Clockwise) */}
                  {!isReady && (
                      <div 
                          className="absolute inset-0 bg-black/70 origin-center"
                          style={{ height: `${(1-skill.cooldownPct) * 100}%` }}
                      />
                  )}

                  {/* Gloss */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                  
                  {/* Hotkey Badge */}
                  <div className="absolute top-0.5 right-0.5 text-[9px] font-bold text-[#ddd] bg-black/80 px-1 rounded-bl border-l border-b border-[#333]">
                      {hotkey}
                  </div>
                  
                  {/* Level Pips */}
                  <div className="absolute bottom-0 left-0 w-full flex justify-center gap-0.5 p-0.5 bg-black/50">
                      {Array.from({length: Math.min(3, skill.level)}).map((_,i) => <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full"></div>)}
                  </div>
              </div>
              <HUDTooltip title={skill.label || skill.id} description={skill.description} level={skill.level} />
          </div>
      );
  };

  return (
    <div 
        className="relative bg-[#050505] overflow-hidden font-serif"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── RPG2 UI LAYER ── */}
      {showUI && (
        <>
            {/* TOP LEFT: UNIT FRAME */}
            <div className="absolute top-4 left-4 flex gap-3 z-20">
                {/* Portrait */}
                <div className="w-16 h-16 rounded-full border-2 border-[#c5a059] bg-[#222] shadow-xl relative z-10 overflow-hidden flex items-center justify-center">
                    <span className="text-4xl filter grayscale contrast-125">🐍</span>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]"></div>
                    <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent"></div>
                    <div className="absolute bottom-1 text-[10px] text-[#c5a059] font-bold tracking-widest text-center w-full">LVL {data.progression.level}</div>
                </div>
                
                {/* Bars */}
                <div className="flex flex-col justify-center mt-1">
                    <div className="text-sm font-bold text-[#eecfa1] tracking-wide drop-shadow-md mb-1">OPERATOR</div>
                    
                    {/* HP */}
                    <div className="w-40 h-4 bg-[#1a0f0f] border border-[#3d1818] rounded-sm relative overflow-hidden mb-1">
                        <div 
                            className="h-full bg-gradient-to-r from-[#8b0000] to-[#ff3333] transition-all duration-300"
                            style={{ width: `${hpPct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90 shadow-black drop-shadow-md">
                            {Math.floor(hpPct)} / 100
                        </span>
                    </div>

                    {/* MANA (XP) */}
                    <div className="w-36 h-3 bg-[#0f121a] border border-[#18233d] rounded-sm relative overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#00338b] to-[#3388ff] transition-all duration-300"
                            style={{ width: `${xpPct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/80 shadow-black drop-shadow-md">
                            XP
                        </span>
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: QUEST / SCORE */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end pointer-events-none">
                <div className="bg-[#1a1510]/90 border border-[#c5a059] p-3 rounded-lg shadow-xl w-48 backdrop-blur-sm">
                    <div className="text-[#c5a059] text-xs font-bold border-b border-[#c5a059]/30 pb-1 mb-1 text-center uppercase tracking-widest">
                        Sector {data.progression.stage}
                    </div>
                    <div className="flex justify-between text-xs text-[#ddd] mb-1">
                        <span>Score:</span>
                        <span className="text-white font-mono">{data.score.current.toLocaleString()}</span>
                    </div>
                    {data.score.combo > 1 && (
                        <div className="text-right text-yellow-400 font-bold text-xs animate-pulse">
                            Combo Bonus: x{data.score.combo}
                        </div>
                    )}
                    <div className="mt-2 text-[10px] text-[#888] text-center italic">
                        "{data.threat.label}"
                    </div>
                </div>
            </div>

            {/* BOTTOM CENTER: HOTBAR */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-end gap-1">
                {/* Decorative Wing Left */}
                <div className="w-12 h-14 bg-gradient-to-r from-transparent to-[#1a1510]/90 border-t border-[#c5a059] skew-y-6 translate-y-2 opacity-80"></div>

                <div className="bg-[#1a1510]/95 border-2 border-[#554433] border-t-[#c5a059] p-2 rounded-t-lg flex gap-1 shadow-2xl backdrop-blur-md relative">
                    {/* Active Weapons */}
                    {data.loadout.weapons.map((w, i) => (
                        <SkillSlot key={w.id} skill={w} hotkey={`${i+1}`} />
                    ))}
                    
                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                        <div key={`e-${i}`} className="w-12 h-12 bg-[#0a0805] border border-[#333] rounded flex items-center justify-center opacity-50">
                            <span className="text-[#444] text-xs">+</span>
                        </div>
                    ))}

                    {/* Passive Slots Mini */}
                    {data.loadout.utilities.length > 0 && (
                        <div className="ml-2 pl-2 border-l border-[#443322] flex gap-1">
                            {data.loadout.utilities.map((u, i) => (
                                <div key={u.id} className="relative group w-8 h-8 bg-[#111] border border-[#444] rounded flex items-center justify-center">
                                    <span className="text-sm text-gray-400">{u.icon}</span>
                                    <HUDTooltip title={u.label || u.id} description={u.description} level={u.level} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Decorative Wing Right */}
                <div className="w-12 h-14 bg-gradient-to-l from-transparent to-[#1a1510]/90 border-t border-[#c5a059] -skew-y-6 translate-y-2 opacity-80"></div>
            </div>
        </>
      )}
    </div>
  );
};