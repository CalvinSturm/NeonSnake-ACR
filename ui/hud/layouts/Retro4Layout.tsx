
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Retro4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro4Layout: React.FC<Retro4LayoutProps> = ({ data, config, children, showUI = true }) => {
  const C_AMBER = '#ffb000';
  
  return (
    <div 
        className="relative bg-[#1a1000] overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0 opacity-80 sepia brightness-50 contrast-125">
          {children}
      </div>

      {/* Amber Filter */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[#ffb000] mix-blend-overlay opacity-20"></div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-50"></div>

      {showUI && (
        <div className="absolute inset-4 border-2 border-[#ffb000] z-20 p-2 flex flex-col justify-between" style={{ color: C_AMBER, textShadow: '0 0 5px #ffb000' }}>
            
            {/* Header */}
            <div className="flex justify-between border-b border-[#ffb000] pb-1">
                <div>
                    <span>SCORE: {data.score.current}</span>
                    {data.score.combo > 1 && <span className="ml-4 animate-pulse">[COMBO x{data.score.combo}]</span>}
                </div>
                <div>SECTOR {data.progression.stage} // {data.threat.label}</div>
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-[#ffb000] pt-1">
                <div className="flex gap-4">
                    <span>HP: [{'|'.repeat(Math.floor(data.vitals.integrity / 10)).padEnd(10, '.')}] {data.vitals.integrity}%</span>
                    <span>XP: {Math.floor((data.progression.xp / data.progression.xpMax) * 100)}%</span>
                </div>
                <div className="flex gap-2">
                    {data.loadout.weapons.map((w, i) => (
                        <span key={w.id} className={w.active ? '' : 'opacity-50'}>
                            [{w.icon}]
                        </span>
                    ))}
                </div>
            </div>

        </div>
      )}
    </div>
  );
};
