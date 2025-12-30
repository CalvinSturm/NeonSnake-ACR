
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_HEIGHT } from '../../../constants';

interface Cyber7LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Cyber7Layout: React.FC<Cyber7LayoutProps> = ({ data, config, children, showUI = true }) => {
  const BORDER_COLOR = '#00ffcc';
  
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── EXPLICIT BOUNDARY FRAME ── */}
      <div 
        className="absolute left-0 w-full pointer-events-none z-10 border-y-2 border-[#00ffcc]"
        style={{ 
            top: HUD_TOP_HEIGHT, 
            height: PLAY_AREA_HEIGHT,
            boxShadow: `inset 0 0 20px rgba(0, 255, 204, 0.1)`
        }}
      >
          {/* Corner Markers for Clarity */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#00ffcc]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#00ffcc]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#00ffcc]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#00ffcc]"></div>
          
          {/* Guide Text */}
          <div className="absolute top-2 left-2 text-[9px] text-[#00ffcc] opacity-50">PLAY_AREA_ACTIVE</div>
      </div>

      {showUI && (
        <>
            {/* ── TOP UI ZONE (Opaque) ── */}
            <div 
                className="absolute top-0 left-0 w-full bg-[#050a0a] z-20 flex justify-between px-6 items-center border-b border-gray-800"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE_INDEX</span>
                    <span className="text-3xl text-white font-bold tracking-widest tabular-nums">{data.score.current.toLocaleString()}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">THREAT_LEVEL</span>
                    <span className={`text-xl font-bold uppercase ${data.threat.colorClass}`}>{data.threat.label}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">SECTOR</span>
                    <span className="text-2xl text-white font-bold">{data.progression.stage.toString().padStart(2, '0')}</span>
                </div>
            </div>

            {/* ── BOTTOM UI ZONE (Opaque) ── */}
            <div 
                className="absolute bottom-0 left-0 w-full bg-[#050a0a] z-20 flex items-center justify-between px-6 border-t border-gray-800"
                style={{ height: HUD_BOTTOM_HEIGHT }}
            >
                {/* Vitals */}
                <div className="flex flex-col w-48">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>INTEGRITY</span>
                        <span className={data.vitals.integrity < 30 ? "text-red-500 font-bold" : "text-white"}>{data.vitals.integrity}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-800 border border-gray-600">
                        <div className="h-full bg-cyan-600" style={{ width: `${data.vitals.integrity}%` }}></div>
                    </div>
                </div>

                {/* Skills */}
                <div className="flex gap-3">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-12 h-12 bg-gray-900 border border-gray-700 flex items-center justify-center">
                            <span className={`text-xl ${w.active ? 'text-white' : 'text-gray-600'}`}>{w.icon}</span>
                            {w.cooldownPct < 1 && (
                                <div className="absolute inset-0 bg-black/60 flex items-end">
                                    <div className="w-full bg-cyan-500/50" style={{ height: `${w.cooldownPct * 100}%` }}></div>
                                </div>
                            )}
                            <div className="absolute top-0 right-0 text-[8px] bg-gray-800 text-white px-1">{i+1}</div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Metrics */}
                <div className="w-32 text-right text-xs font-mono text-gray-400">
                    <div>DMG: {data.metrics.damage}</div>
                    <div>SPD: {data.metrics.fireRate}</div>
                    <div>CRT: {data.metrics.crit}%</div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
