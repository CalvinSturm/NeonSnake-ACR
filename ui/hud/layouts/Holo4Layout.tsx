
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Holo4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Holo4Layout: React.FC<Holo4LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono perspective-[1000px]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* Floating Panels skewed into 3D space */}
            
            {/* Top Left: Score Board */}
            <div 
                className="absolute top-10 left-10 z-20 bg-blue-900/40 border border-blue-400 p-4 transform rotateY(20deg) rotateX(10deg) shadow-[0_0_20px_blue]"
            >
                <div className="text-xs text-blue-300">SCORE_MATRIX</div>
                <div className="text-3xl text-white font-bold">{data.score.current}</div>
            </div>

            {/* Top Right: Status */}
            <div 
                className="absolute top-10 right-10 z-20 bg-blue-900/40 border border-blue-400 p-4 transform rotateY(-20deg) rotateX(10deg) shadow-[0_0_20px_blue] text-right"
            >
                <div className="text-xs text-blue-300">THREAT_ANALYSIS</div>
                <div className="text-xl text-white font-bold">{data.threat.label}</div>
            </div>

            {/* Bottom Floor Projection: Vitals & Loadout */}
            <div 
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-3/4 flex justify-between transform rotateX(45deg) bg-blue-900/20 border-t border-blue-500/50 pt-4 px-10 pb-10 origin-bottom"
            >
                {/* Vitals */}
                <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_white]">{data.vitals.integrity}</div>
                    <div className="text-xs text-blue-300 tracking-widest">INTEGRITY</div>
                </div>

                {/* Weapons */}
                <div className="flex gap-4">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 border border-blue-400 flex items-center justify-center bg-blue-500/20 ${w.active ? 'shadow-[0_0_15px_blue]' : 'opacity-50'}`}>
                                <span className="text-white text-xl">{w.icon}</span>
                            </div>
                            {/* Reflection */}
                            <div className="w-12 h-4 bg-gradient-to-b from-blue-500/30 to-transparent scale-y-[-1] opacity-50"></div>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
