
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Retro6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Retro6Layout: React.FC<Retro6LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#050010] overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── SUNSET GRID (Animated via CSS) ── */}
      <div 
        className="absolute bottom-0 w-full h-1/2 pointer-events-none z-10 opacity-60"
        style={{ 
            backgroundImage: `
                linear-gradient(transparent 95%, #ff00ff 95%),
                linear-gradient(90deg, transparent 95%, #ff00ff 95%)
            `,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(100px)'
        }}
      />
      
      {/* ── SUNSET GRADIENT ── */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#050010] via-[#2a003b] to-[#ff0055] opacity-50 z-0"></div>

      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── TOP HEADER (Chrome Text) ── */}
            <div className="absolute top-0 left-0 w-full z-20 p-4 flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 drop-shadow-[2px_2px_0_#ff00ff]">
                        {data.score.current.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-pink-500 tracking-[0.5em] animate-pulse">HIGH SCORE</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-2xl font-black italic text-yellow-400 drop-shadow-[2px_2px_0_#000]">
                        STAGE {data.progression.stage}
                    </span>
                    <span className="text-xs text-cyan-400 font-bold uppercase">{data.threat.label}</span>
                </div>
            </div>

            {/* ── BOTTOM DASHBOARD (Car Interior) ── */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-20 flex items-end px-8 pb-4 gap-8">
                
                {/* Left: Speedometer (Fire Rate) */}
                <div className="relative w-32 h-16 overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-t-[10px] border-l-[10px] border-r-[10px] border-cyan-500 box-border border-b-transparent rotate-45 transform origin-center"></div>
                    <div className="absolute bottom-0 w-full text-center text-cyan-300 font-bold text-xl">{data.metrics.fireRate} <span className="text-xs">RPM</span></div>
                </div>

                {/* Center: Cassette Deck (Weapons) */}
                <div className="flex-1 h-20 bg-black/60 border-t-2 border-pink-500 rounded-t-lg flex items-center justify-center gap-4 px-4 shadow-[0_-5px_20px_#ff00ff]">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className={`w-12 h-8 border-2 ${w.active ? 'border-yellow-400 bg-yellow-900/50' : 'border-gray-600 bg-gray-800'} flex items-center justify-center`}>
                            <span className="text-white text-xs">{w.icon}</span>
                        </div>
                    ))}
                </div>

                {/* Right: Fuel Gauge (Health) */}
                <div className="w-48 mb-2">
                    <div className="flex justify-between text-pink-500 font-bold italic text-xs mb-1">
                        <span>E</span>
                        <span>F</span>
                    </div>
                    <div className="w-full h-4 bg-gray-900 border border-pink-500 skew-x-[-20deg] overflow-hidden p-0.5">
                        <div 
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            style={{ width: `${data.vitals.integrity}%` }}
                        />
                    </div>
                    <div className="text-center text-xs text-cyan-300 font-bold mt-1 tracking-widest">INTEGRITY</div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
