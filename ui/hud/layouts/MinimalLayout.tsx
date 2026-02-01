
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface MinimalLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ data, config, children, showUI = true }) => {
  
  // Helper for simple bars
  const SimpleBar = ({ value, color, height = 2, width = '100%' }: { value: number, color: string, height?: number, width?: string }) => (
    <div className="bg-white/10 rounded-full overflow-hidden backdrop-blur-sm" style={{ height, width }}>
      <div 
        className="h-full transition-all duration-300"
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );

  return (
    <div 
        className="relative bg-transparent overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── TOP HUD (Minimal) ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between items-end px-6 pb-2"
            style={{ height: HUD_TOP_HEIGHT }}
        >
            {/* Score */}
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Score</span>
                <span className="text-2xl font-light tracking-wide text-white tabular-nums leading-none">
                    {data.score.current.toLocaleString()}
                </span>
            </div>

            {/* Combo Indicator (Only if active) */}
            {data.score.combo > 1 && (
                <div className="flex-1 text-center pb-1">
                    <span className="text-yellow-400 font-bold tracking-widest text-sm animate-pulse">
                        {data.score.combo}X COMBO
                    </span>
                </div>
            )}

            {/* Level/Stage */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Sector {data.progression.stage}</span>
                <span className="text-sm font-bold text-white tracking-widest">
                    LVL {data.progression.level}
                </span>
            </div>
        </div>
      )}

      {/* ── BOTTOM HUD (Minimal) ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-center px-8"
            style={{ height: HUD_BOTTOM_HEIGHT }}
        >
            
            <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
                
                {/* Weapon Dots (Tiny Indicators) */}
                <div className="flex gap-1">
                    {data.loadout.weapons.map((w, i) => (
                        <div 
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${w.cooldownPct >= 1 ? 'bg-white shadow-[0_0_5px_white]' : 'bg-gray-700'}`}
                        />
                    ))}
                </div>

                {/* Central Vitals */}
                <div className="flex-1 flex flex-col gap-1.5">
                    {/* Integrity */}
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-gray-500 w-8 text-right">HULL</span>
                        <SimpleBar 
                            value={data.vitals.integrity} 
                            color={data.vitals.integrity < 30 ? '#ef4444' : '#ffffff'} 
                            height={4} 
                        />
                        <span className="text-[9px] font-bold text-gray-500 w-8">{data.vitals.integrity}%</span>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-3 opacity-60">
                        <span className="text-[9px] font-bold text-gray-600 w-8 text-right">SYNC</span>
                        <SimpleBar 
                            value={(data.progression.xp / data.progression.xpMax) * 100} 
                            color="#00ffff" 
                            height={2} 
                        />
                        <span className="text-[9px] font-bold text-gray-600 w-8"></span>
                    </div>
                </div>

                {/* Shield Indicator */}
                <div className={`w-4 h-4 border rounded-full flex items-center justify-center transition-opacity ${data.vitals.shieldActive ? 'border-cyan-400 opacity-100' : 'border-gray-800 opacity-20'}`}>
                    <div className={`w-1.5 h-1.5 bg-cyan-400 rounded-full ${data.vitals.shieldActive ? 'animate-pulse' : 'hidden'}`} />
                </div>

            </div>

        </div>
      )}
    </div>
  );
};
