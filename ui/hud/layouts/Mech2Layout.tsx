
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Mech2LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Mech2Layout: React.FC<Mech2LayoutProps> = ({ data, config, children, showUI = true }) => {
  const AMBER = '#ffaa00';
  
  // Analog Gauge Component
  const Gauge = ({ label, value, max = 100, color = AMBER }: any) => {
      const pct = Math.min(1, value / max);
      const angle = -90 + (pct * 180); // -90 to +90
      
      return (
          <div className="relative w-20 h-12 flex flex-col items-center justify-end overflow-hidden">
              {/* Arc Background */}
              <div className="absolute bottom-0 w-16 h-16 rounded-full border-[6px] border-[#333] border-b-0 border-l-0 border-r-0 mask-half"></div>
              {/* Needle */}
              <div 
                  className="absolute bottom-0 left-1/2 w-1 h-14 bg-red-600 origin-bottom shadow-md transition-transform duration-300 ease-out z-10"
                  style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
              ></div>
              {/* Pivot */}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#111] rounded-full border border-gray-600 z-20"></div>
              
              <div className="z-30 text-[9px] font-bold bg-black/80 px-1 text-gray-400 mb-6">{label}</div>
          </div>
      );
  };

  return (
    <div 
        className="relative bg-[#0a0a0a] overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── COCKPIT FRAME (SVG Overlay) ── */}
      <div className="absolute inset-0 pointer-events-none z-10">
          <svg width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                  <pattern id="caution-stripe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="10" height="20" fill="#222" />
                      <rect x="10" width="10" height="20" fill="#332a00" />
                  </pattern>
              </defs>
              {/* Top Corners */}
              <path d={`M0 0 H${CANVAS_WIDTH} V40 L${CANVAS_WIDTH-60} 80 H60 L0 40 Z`} fill="none" stroke="#333" strokeWidth="2" opacity="0.5" />
              {/* Bottom Console Base */}
              <path d={`M0 ${CANVAS_HEIGHT} V${CANVAS_HEIGHT-100} L80 ${CANVAS_HEIGHT-140} H${CANVAS_WIDTH-80} L${CANVAS_WIDTH} ${CANVAS_HEIGHT-100} V${CANVAS_HEIGHT} Z`} fill="url(#caution-stripe)" opacity="0.3" />
          </svg>
      </div>

      {showUI && (
        <>
            {/* ── TOP BAR (Compass & Status) ── */}
            <div className="absolute top-0 left-0 w-full h-[80px] z-20 flex justify-between px-4 pt-2 bg-gradient-to-b from-black/90 to-transparent">
                {/* Left: Score Tape */}
                <div className="bg-[#111] border border-[#333] p-1 flex flex-col w-32 relative">
                    <div className="text-[9px] text-amber-700 tracking-widest">SCORE_TAPE</div>
                    <div className="text-xl text-amber-500 font-bold tabular-nums tracking-widest">
                        {data.score.current.toString().padStart(6, '0')}
                    </div>
                    {/* Fake tape holes */}
                    <div className="absolute right-1 top-1 bottom-1 w-2 flex flex-col gap-1">
                        {Array.from({length: 4}).map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#222] rounded-full"></div>)}
                    </div>
                </div>

                {/* Center: Compass */}
                <div className="flex flex-col items-center w-64">
                    <div className="w-full h-6 border-x border-[#444] relative overflow-hidden bg-[#050505] flex justify-center items-center">
                        <div className="text-xs text-amber-600 font-bold">N • • • E • • • S • • • W</div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/50"></div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase bg-black/50 px-2">{data.threat.label}</div>
                </div>

                {/* Right: Timer */}
                <div className="bg-[#111] border border-[#333] p-1 text-right w-32">
                    <div className="text-[9px] text-amber-700 tracking-widest">MSN_CLOCK</div>
                    <div className="text-xl text-amber-500 font-bold tabular-nums">
                        {data.progression.stage.toString().padStart(2,'0')}:00
                    </div>
                </div>
            </div>

            {/* ── BOTTOM CONSOLE ── */}
            <div className="absolute bottom-0 left-0 w-full h-[140px] z-20 flex justify-between items-end px-2 pb-2">
                
                {/* Left Panel: Integrity */}
                <div className="w-64 h-full bg-[#111] border-t-4 border-amber-800 clip-mech-panel-left p-4 flex gap-4 items-end relative shadow-2xl">
                    <div className="absolute top-2 left-4 text-[10px] text-amber-800 font-bold">STRUCTURAL_INTEGRITY</div>
                    
                    {/* Big Percentage */}
                    <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-amber-500 tabular-nums">{data.vitals.integrity}%</div>
                        <div className="w-full h-2 bg-[#222] mt-1 border border-[#444]">
                            <div className="h-full bg-amber-600" style={{ width: `${data.vitals.integrity}%` }}></div>
                        </div>
                    </div>

                    {/* Shield Toggle Graphic */}
                    <div className="flex flex-col items-center gap-1 mb-1">
                        <div className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${data.vitals.shieldActive ? 'border-cyan-500 bg-cyan-900/50' : 'border-[#333] bg-black'}`}>
                            <span className={data.vitals.shieldActive ? 'text-cyan-400' : 'text-[#333]'}>SHLD</span>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Weapons */}
                <div className="flex-1 h-24 mx-2 bg-[#0f0f0f]/90 border-t-2 border-[#444] rounded-t-xl flex items-end justify-center pb-2 gap-2 backdrop-blur-sm relative">
                    {/* Decorative Screws */}
                    <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#333] flex items-center justify-center"><div className="w-1 h-0.5 bg-[#111] rotate-45"></div></div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#333] flex items-center justify-center"><div className="w-1 h-0.5 bg-[#111] rotate-45"></div></div>

                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group w-14 h-16 bg-[#1a1a1a] border border-[#333] flex flex-col items-center justify-end overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-black/50 shadow-[inset_0_0_10px_black]"></div>
                            
                            {/* Heat Bar (Cooldown) */}
                            <div 
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-amber-600 to-amber-900/50 transition-all duration-100"
                                style={{ height: `${w.cooldownPct * 100}%` }}
                            />
                            
                            {/* Icon */}
                            <div className={`relative z-10 text-xl mb-2 ${w.cooldownPct >= 1 ? 'text-amber-100' : 'text-amber-900'}`}>{w.icon}</div>
                            
                            {/* LED */}
                            <div className={`w-8 h-1 mb-1 rounded-full ${w.cooldownPct >= 1 ? 'bg-green-500 shadow-[0_0_5px_#0f0]' : 'bg-red-900'}`}></div>
                            
                            <div className="absolute top-0 left-1 text-[8px] text-[#555]">{i+1}</div>
                            
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Right Panel: Analytics */}
                <div className="w-56 h-full bg-[#111] border-t-4 border-amber-800 clip-mech-panel-right p-4 flex gap-2 justify-end items-end relative shadow-2xl">
                    <div className="absolute top-2 right-4 text-[10px] text-amber-800 font-bold">SYSTEM_METRICS</div>
                    
                    <Gauge label="DPS" value={data.metrics.damage} max={200} />
                    <Gauge label="RPM" value={data.metrics.fireRate} max={200} />
                    <Gauge label="CRT" value={data.metrics.crit} max={100} color="#ffff00" />
                </div>

            </div>
        </>
      )}

      <style>{`
        .clip-mech-panel-left { clip-path: polygon(0 20%, 10% 0, 100% 0, 100% 100%, 0 100%); }
        .clip-mech-panel-right { clip-path: polygon(0 0, 90% 0, 100% 20%, 100% 100%, 0 100%); }
      `}</style>
    </div>
  );
};
