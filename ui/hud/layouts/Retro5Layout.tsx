
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Retro5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro5Layout: React.FC<Retro5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#100020] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── SUNSET GRID FLOOR ── */}
      <div className="absolute bottom-0 w-full h-1/3 bg-[linear-gradient(to_bottom,transparent,rgba(255,0,255,0.2))] pointer-events-none z-10" 
           style={{ 
               backgroundImage: `
                   linear-gradient(0deg, transparent 24%, rgba(255, 0, 255, .3) 25%, rgba(255, 0, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, .3) 75%, rgba(255, 0, 255, .3) 76%, transparent 77%, transparent),
                   linear-gradient(90deg, transparent 24%, rgba(255, 0, 255, .3) 25%, rgba(255, 0, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, .3) 75%, rgba(255, 0, 255, .3) 76%, transparent 77%, transparent)
               `,
               backgroundSize: '50px 50px',
               transform: 'perspective(200px) rotateX(60deg) translateY(100px)'
           }} 
      />

      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── CHROME HEADER ── */}
            <div className="absolute top-0 w-full h-16 bg-gradient-to-b from-purple-900/80 to-transparent z-20 flex justify-between px-6 pt-4">
                <div className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[2px_2px_0_rgba(255,255,255,0.5)]">
                    {data.score.current}
                </div>
                <div className="text-xl font-bold text-pink-400 tracking-widest drop-shadow-[0_0_10px_#ff00ff] animate-pulse">
                    {data.threat.label}
                </div>
            </div>

            {/* ── DASHBOARD BOTTOM ── */}
            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black to-transparent z-20 flex items-end justify-center pb-4 gap-8">
                {/* Vitals Dial */}
                <div className="w-32 text-center">
                    <div className="text-cyan-300 font-bold mb-1 text-xs tracking-widest">INTEGRITY</div>
                    <div className="w-full h-4 bg-gray-800 rounded-full border border-cyan-500 shadow-[0_0_10px_#00ffff]">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                </div>

                {/* Weapon Cassettes */}
                <div className="flex gap-2 bg-black/50 p-2 rounded-lg border border-pink-500/50 backdrop-blur-sm">
                    {data.loadout.weapons.map((w) => (
                        <div key={w.id} className="w-10 h-10 bg-purple-900/50 border border-pink-500 flex items-center justify-center">
                            <span className="text-white text-xs">{w.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
