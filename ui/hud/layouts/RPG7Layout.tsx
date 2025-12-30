
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface RPG7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG7Layout: React.FC<RPG7LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#1a1208] overflow-hidden font-serif text-[#d4c5a3]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── ORNATE FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y-[4px] border-[#8b7355]"
        style={{ 
            top: HUD_TOP_HEIGHT, 
            height: PLAY_AREA_HEIGHT,
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.8)`
        }}
      ></div>

      {showUI && (
        <>
            {/* ── TOP PARCHMENT ── */}
            <div 
                className="absolute top-0 left-0 w-full bg-[#261c10] z-20 flex justify-center items-center border-b border-[#5e4b35]"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="flex items-center gap-8 w-full max-w-2xl justify-between px-8">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-[#8b7355] uppercase tracking-widest">Score</span>
                        <span className="text-3xl font-bold text-[#f0e6d2]">{data.score.current.toLocaleString()}</span>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-xl font-bold text-[#eecfa1] tracking-widest uppercase border-b border-[#8b7355] pb-1 mb-1">{data.threat.label}</div>
                        <div className="text-xs text-[#8b7355]">Level {data.progression.level}</div>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-[#8b7355] uppercase tracking-widest">Stage</span>
                        <span className="text-2xl font-bold text-[#f0e6d2]">{data.progression.stage}</span>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM STONE ── */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-[#181008] z-20 flex items-center justify-between px-8 border-t border-[#5e4b35]"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                {/* Health Globe Simulation */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-black border-4 border-[#5e4b35] relative overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-[#8b0000]"
                            style={{ height: `${data.vitals.integrity}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow-md">{data.vitals.integrity}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#d4c5a3]">VITALITY</span>
                        {data.vitals.shieldActive && <span className="text-xs text-blue-400">SHIELDED</span>}
                    </div>
                </div>

                {/* Skills */}
                <div className="flex gap-2 bg-[#2a2018] p-2 rounded border border-[#5e4b35]">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-12 h-12 bg-[#120c08] border border-[#5e4b35] flex items-center justify-center">
                            <span className={`text-2xl ${w.active ? 'text-[#f0e6d2]' : 'text-[#554433]'}`}>{w.icon}</span>
                            {!w.active && <div className="absolute inset-0 bg-black/60" />}
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
