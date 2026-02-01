
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDNumber, HUDBar, HUDSkillSlot } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPGLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPGLayout: React.FC<RPGLayoutProps> = ({ data, config, children, showUI = true }) => {
  // Generate placeholders for empty slots
  const emptySlots = Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length);
  const emptySlotArray = Array(emptySlots).fill(null);

  return (
    <div 
        className="relative bg-transparent overflow-hidden font-sans select-none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── TOP HUD ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between px-4 pt-3"
            style={{ height: HUD_TOP_HEIGHT }}
        >
            
            {/* LEFT: Unit Frame */}
            <div className="flex items-start gap-3 bg-gray-900/80 p-2 rounded-lg border border-gray-700 shadow-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-black border border-gray-600 rounded flex items-center justify-center text-2xl relative overflow-hidden">
                    <span className="relative z-10">🤖</span>
                    <div className="absolute bottom-0 w-full h-1 bg-cyan-500"></div>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wide text-sm">OPERATOR</span>
                        <span className="text-[10px] bg-cyan-900 text-cyan-200 px-1 rounded border border-cyan-800">LVL {data.progression.level}</span>
                    </div>
                    <div className="w-32 mt-1">
                        <HUDBar 
                            value={data.vitals.integrity} 
                            color={data.vitals.integrity < 30 ? '#ef4444' : '#22c55e'} 
                            config={{ ...config, layout: 'RPG' }} 
                            height={6}
                        />
                    </div>
                    <div className="flex justify-between w-32 text-[9px] text-gray-400 mt-0.5 font-mono">
                        <span>HULL</span>
                        <span>{data.vitals.integrity}/100</span>
                    </div>
                </div>
            </div>

            {/* CENTER: Threat/Boss Status */}
            <div className="flex flex-col items-center pt-1">
                <div className="bg-black/60 px-4 py-1 rounded-full border border-gray-800 backdrop-blur-sm mb-1">
                    <span className={`text-xs font-bold ${data.threat.colorClass}`}>{data.threat.label}</span>
                </div>
                {data.score.combo > 1 && (
                    <div className="text-yellow-400 font-bold text-lg animate-pulse drop-shadow-md">
                        {data.score.combo}x COMBO
                    </div>
                )}
            </div>

            {/* RIGHT: Score & Stage */}
            <div className="flex flex-col items-end gap-1 bg-gray-900/80 p-2 rounded-lg border border-gray-700 shadow-xl backdrop-blur-sm">
                <div className="text-right">
                    <span className="text-[10px] text-gray-400 block uppercase">Sector</span>
                    <span className="text-xl font-bold text-white leading-none">{data.progression.stage}</span>
                </div>
                <div className="text-right border-t border-gray-700 pt-1 mt-1 w-full">
                    <span className="text-[10px] text-gray-400 block uppercase">Score</span>
                    <span className="text-sm font-mono text-cyan-300">{data.score.current.toLocaleString()}</span>
                </div>
            </div>

        </div>
      )}

      {/* ── BOTTOM HUD ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end pb-4 px-6 pointer-events-none"
            style={{ height: HUD_BOTTOM_HEIGHT + 20 }} // Slightly taller for the stacked bar
        >
            
            {/* ACTION BAR CONTAINER */}
            <div className="bg-gray-900/90 border-t border-x border-gray-600 rounded-t-xl mx-auto flex flex-col items-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-auto">
                
                {/* 1. XP Bar (Thin line on top) */}
                <div className="w-full h-1 bg-gray-800 rounded-t-xl overflow-hidden">
                    <div 
                        className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300"
                        style={{ width: `${(data.progression.xp / data.progression.xpMax) * 100}%` }}
                    />
                </div>

                {/* 2. Skills Row */}
                <div className="flex items-center gap-1 p-2">
                    
                    {/* Utilities Group */}
                    {data.loadout.utilities.length > 0 && (
                        <>
                            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-700">
                                {data.loadout.utilities.map(u => (
                                    <HUDSkillSlot key={u.id} skill={u} config={config} hotkey="PASSIVE" />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Weapons Group */}
                    <div className="flex gap-1">
                        {data.loadout.weapons.map((w, i) => (
                            <HUDSkillSlot key={w.id} skill={w} config={config} hotkey={`${i + 1}`} />
                        ))}
                        
                        {/* Empty Slots */}
                        {emptySlotArray.map((_, i) => (
                            <div 
                                key={`empty-${i}`} 
                                className="w-12 h-12 rounded-md border border-gray-700 bg-black/40 flex items-center justify-center relative group"
                            >
                                <span className="text-gray-700 text-xl font-bold opacity-30">+</span>
                                <div className="absolute top-0.5 right-1 text-[8px] text-gray-600">{data.loadout.weapons.length + i + 1}</div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-gray-700 p-1 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    EMPTY SLOT
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* METRICS (Bottom Right Corner) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 text-[10px] font-mono text-gray-400 bg-black/60 p-2 rounded border border-gray-800">
                <div className="flex justify-between gap-4">
                    <span>DPS%</span>
                    <span className="text-white">{data.metrics.damage}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>CRIT</span>
                    <span className="text-yellow-300">{data.metrics.crit}%</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>SPD</span>
                    <span className="text-cyan-300">{data.metrics.fireRate}</span>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};
