
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Minimal2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal2Layout: React.FC<Minimal2LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#111] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── TYPOGRAPHIC OVERLAY ── */}
      {showUI && (
        <>
            {/* TOP BAR: Ultra clean text */}
            <div 
                className="absolute top-0 left-0 w-full z-20 flex justify-between items-start p-6"
                style={{ height: HUD_TOP_HEIGHT + 20 }}
            >
                {/* Score Block */}
                <div className="flex flex-col items-start">
                    <div className="text-6xl font-black text-white leading-none tracking-tighter mix-blend-difference">
                        {data.score.current.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-2 bg-white"></div>
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Score Index</span>
                    </div>
                </div>

                {/* Stage Identifier (Vertical) */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Sector {data.progression.stage.toString().padStart(2,'0')}</span>
                        <div className={`h-2 w-2 ${data.threat.level === 'INSANE' ? 'bg-red-500' : 'bg-white'}`}></div>
                    </div>
                    <div className="text-4xl font-bold text-white/20 tracking-tighter mt-1">
                        {data.threat.label}
                    </div>
                </div>
            </div>

            {/* BOTTOM BAR: Grid Layout */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex items-end justify-between p-6 pointer-events-none"
                style={{ height: HUD_BOTTOM_HEIGHT + 40 }}
            >
                {/* Left: Vitals (Numeric Only) */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white leading-none tracking-tighter">{data.vitals.integrity}</span>
                        <span className="text-sm font-bold text-gray-500">%</span>
                    </div>
                    <div className="w-32 h-1 bg-gray-800">
                        <div className="h-full bg-white" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hull Integrity</span>
                </div>

                {/* Center: Weapons (Minimal Icons) */}
                <div className="flex gap-4 pointer-events-auto items-end">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group">
                            <div className={`
                                w-12 h-12 flex items-center justify-center border-2 border-white transition-colors
                                ${w.active ? 'bg-white text-black' : 'bg-transparent text-white opacity-50'}
                            `}>
                                <span className="text-lg">{w.icon}</span>
                            </div>
                            
                            {/* Cooldown Line */}
                            <div className="w-full h-1 bg-gray-800 mt-1">
                                <div className="h-full bg-white" style={{ width: `${w.cooldownPct * 100}%` }}></div>
                            </div>

                            <div className="text-[9px] font-bold text-gray-500 mt-1 text-center">0{i+1}</div>
                            
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                    
                    {/* Empty Slots: Dashed outlines */}
                    {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                        <div key={`e-${i}`} className="w-12 h-12 border-2 border-dashed border-gray-700 flex items-center justify-center opacity-30">
                            <span className="text-gray-500">+</span>
                        </div>
                    ))}
                </div>

                {/* Right: Data Barcode */}
                <div className="flex flex-col items-end pointer-events-auto">
                    {/* Fake Barcode */}
                    <div className="flex h-8 gap-[2px] items-end mb-2 opacity-50">
                        {Array.from({length: 20}).map((_, i) => (
                            <div key={i} className="w-[3px] bg-white" style={{ height: `${Math.random() * 100}%` }}></div>
                        ))}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Data Sync
                    </div>
                    <div className="text-xl font-bold text-white">
                        LVL {data.progression.level}
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
