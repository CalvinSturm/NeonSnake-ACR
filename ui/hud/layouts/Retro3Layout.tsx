
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Retro3LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro3Layout: React.FC<Retro3LayoutProps> = ({ data, config, children, showUI = true }) => {
  // Gameboy Palette
  const GB_0 = '#0f380f'; // Darkest
  const GB_1 = '#306230';
  const GB_2 = '#8bac0f';
  const GB_3 = '#9bbc0f'; // Lightest

  return (
    <div 
        className="relative bg-[#9bbc0f] overflow-hidden font-mono flex items-center justify-center"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── DOT MATRIX FILTER OVERLAY ── */}
      <div 
        className="absolute inset-0 pointer-events-none z-50 mix-blend-multiply opacity-30"
        style={{ backgroundImage: `radial-gradient(${GB_0} 20%, transparent 20%)`, backgroundSize: '4px 4px' }}
      ></div>

      {/* ── PLASTIC BEZEL ── */}
      <div className="absolute inset-0 border-[30px] rounded-t-xl rounded-b-3xl z-40 pointer-events-none" style={{ borderColor: '#ddd' }}>
          <div className="absolute top-full mt-4 right-12 text-gray-400 font-bold italic text-2xl">NINTENDO</div>
      </div>

      {/* ── GAME LAYER (Recolored via CSS Filter) ── */}
      <div className="absolute inset-[30px] z-0 bg-[#9bbc0f] overflow-hidden grayscale contrast-[200%] brightness-[0.9] sepia-[100%] hue-rotate-[50deg] saturate-[300%]">
          {children}
      </div>

      {showUI && (
        <div className="absolute inset-[30px] z-30 flex flex-col justify-between p-2 pointer-events-none">
            {/* Top Bar */}
            <div className="flex justify-between border-b-2 border-[#0f380f] pb-1 mb-2" style={{ color: GB_0 }}>
                <div className="font-bold">SCORE:{data.score.current}</div>
                <div className="font-bold">LV:{data.progression.level}</div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between border-t-2 border-[#0f380f] pt-1 mt-2 items-end" style={{ color: GB_0 }}>
                <div className="flex flex-col">
                    <span className="text-xs font-bold">HP</span>
                    <div className="flex">
                        {Array.from({length: 5}).map((_,i) => (
                            <div key={i} className={`w-3 h-3 border border-[#0f380f] mr-1 ${i < data.vitals.integrity/20 ? 'bg-[#0f380f]' : 'bg-transparent'}`}></div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-1">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={i} className="w-6 h-6 border-2 border-[#0f380f] flex items-center justify-center text-xs font-bold">
                            {w.icon}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
