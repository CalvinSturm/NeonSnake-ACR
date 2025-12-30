
import React, { useEffect, useState } from 'react';
import { HUDData, HUDConfig } from '../types';
import { useUIStyle } from '../../useUIStyle';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface HoloLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const HoloLayout: React.FC<HoloLayoutProps> = ({ data, config, children, showUI = true }) => {
  const style = useUIStyle();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Mouse Parallax Effect
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setTilt({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
        className="relative bg-black overflow-hidden perspective-[1200px]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* GAME LAYER */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* HOLO OVERLAY */}
      {showUI && (
        <>
            {/* TOP LEFT: SCORE */}
            <div
                className="absolute top-4 left-6 z-20 origin-top-left transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateY(${5 + tilt.x * 1}deg) rotateX(${5 - tilt.y * 1}deg) translateZ(0px)`
                }}
            >
                <div className="bg-cyan-950/40 border-l-2 border-cyan-400 pl-4 py-2 pr-6 backdrop-blur-md skew-x-6 shadow-[0_0_20px_rgba(0,255,255,0.1)] relative overflow-hidden">
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:100%_3px] pointer-events-none opacity-30" />

                    <div className="-skew-x-6">
                        <div className="text-[10px] text-cyan-300 tracking-[0.2em] font-display mb-0.5 opacity-80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                            RUNTIME_SCORE
                        </div>
                        <div className="text-3xl font-bold font-mono text-white drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] tracking-tighter leading-none">
                            {data.score.current.toLocaleString()}
                        </div>
                        {data.score.combo > 1 && (
                            <div className="text-yellow-400 font-bold tracking-widest text-[10px] mt-1 border-t border-yellow-500/30 pt-0.5 inline-block">
                                CHAIN_MULT :: x{data.score.combo}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: STATUS */}
            <div
                className="absolute top-4 right-6 z-20 origin-top-right transition-transform duration-100 ease-out text-right"
                style={{
                    transform: `rotateY(${-5 + tilt.x * 1}deg) rotateX(${5 - tilt.y * 1}deg) translateZ(0px)`
                }}
            >
                <div className="bg-red-950/40 border-r-2 border-red-500 pl-6 py-2 pr-4 backdrop-blur-md -skew-x-6 shadow-[0_0_20px_rgba(255,0,0,0.1)] relative overflow-hidden">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_1px,transparent_1px)] bg-[length:100%_3px] pointer-events-none opacity-30" />

                    <div className="skew-x-6">
                        <div className="text-[10px] text-red-300 tracking-[0.2em] font-display mb-0.5 opacity-80">THREAT_LEVEL</div>
                        <div className={`text-2xl font-bold font-display ${data.threat.colorClass} drop-shadow-[0_0_8px_currentColor] uppercase leading-none`}>
                            {data.threat.label}
                        </div>
                        <div className="flex justify-end items-center gap-2 mt-1 border-t border-red-500/30 pt-0.5">
                            <span className="text-white/70 text-[10px] font-mono tracking-widest">SECTOR {data.progression.stage.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM CONSOLE (3D Dashboard) */}
            <div
                className="absolute bottom-0 left-0 w-full z-20 flex justify-center perspective-[800px] pointer-events-none"
                style={{ height: HUD_BOTTOM_HEIGHT + 30 }}
            >
                {/* Dashboard Plane */}
                <div
                    className="w-full h-full bg-gradient-to-b from-cyan-950/80 via-gray-900/95 to-black border-t border-cyan-500/40 backdrop-blur-xl flex items-end px-8 pb-4 pointer-events-auto relative transition-transform duration-100 ease-out"
                    style={{
                        transform: `rotateX(${30 - tilt.y * 5}deg) translateY(${25 + tilt.y * 5}px)`,
                        transformOrigin: 'bottom center',
                        boxShadow: '0 -10px 40px rgba(0,255,255,0.1)',
                        clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)'
                    }}
                >
                    {/* Holographic Grid Surface */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(0deg,rgba(0,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.2)_1px,transparent_1px)] bg-[length:40px_40px] [transform:perspective(500px)_rotateX(20deg)]"></div>

                    {/* ── LEFT INSTRUMENTS ── */}
                    <div className="flex-1 flex flex-col gap-3 mb-2 relative z-10 justify-end h-full">

                        {/* Radar Circle */}
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full border border-cyan-800/60 bg-black/40 relative overflow-hidden shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 border-r border-cyan-900/30 left-1/2" />
                                <div className="absolute inset-0 border-b border-cyan-900/30 top-1/2" />
                                <div className="absolute inset-2 rounded-full border border-cyan-900/20" />

                                {/* Sweep */}
                                <div className="absolute inset-0 origin-center animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,255,0.1)_300deg,rgba(0,255,255,0.5)_360deg)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-cyan-500 font-mono tracking-widest">SCANNER</span>
                                <span className="text-xs text-white font-display">ACTIVE</span>
                            </div>
                        </div>

                        {/* HP Bar */}
                        <div className="w-48">
                            <div className="flex justify-between text-[9px] text-cyan-400 font-display tracking-widest mb-1">
                                <span>HULL INTEGRITY</span>
                                <span className="font-mono">{data.vitals.integrity}%</span>
                            </div>
                            <div className="h-2 bg-black/60 border border-cyan-900/50 rounded-sm relative overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 relative"
                                    style={{ width: `${data.vitals.integrity}%`, transition: 'width 0.3s' }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:8px_8px] opacity-50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER: WEAPON ARRAY ── */}
                    <div className="flex-[2] flex justify-center items-end gap-3 pb-2 relative z-10 h-full">
                        
                        {/* Iterate Weapons */}
                        {data.loadout.weapons.map((w) => (
                            <div key={w.id} className="relative group flex flex-col items-center justify-end h-24">
                                {/* Projection Light */}
                                <div 
                                    className={`absolute bottom-0 w-8 h-full bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none transition-opacity duration-300 ${w.active ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)' }}
                                />

                                {/* Floating Icon */}
                                <div className={`
                                    w-10 h-10 mb-3 rounded flex items-center justify-center 
                                    bg-black/40 border border-cyan-500/30 backdrop-blur-sm
                                    shadow-[0_0_10px_rgba(0,255,255,0.1)]
                                    transform transition-all duration-300 group-hover:scale-110 group-hover:border-cyan-300 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]
                                    ${w.active ? 'opacity-100' : 'opacity-40 grayscale'}
                                `}>
                                    <span className="text-lg filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10">{w.icon}</span>
                                </div>

                                {/* Cooldown Bar (Curved under) */}
                                <div className="w-10 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-cyan-400 shadow-[0_0_5px_#0ff]"
                                        style={{ width: `${w.cooldownPct * 100}%` }}
                                    />
                                </div>

                                {/* Level Indicator */}
                                <div className="mt-1 text-[8px] font-mono text-cyan-500/70">
                                    LVL {w.level}
                                </div>
                            </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, data.loadout.maxWeaponSlots - data.loadout.weapons.length) }).map((_, i) => (
                             <div key={`empty-${i}`} className="w-10 h-24 flex flex-col justify-end items-center opacity-20 pb-4">
                                 <div className="w-10 h-10 border border-dashed border-cyan-500/50 rounded flex items-center justify-center">
                                     <span className="text-cyan-500 text-xs">+</span>
                                 </div>
                             </div>
                        ))}
                    </div>

                    {/* ── RIGHT INSTRUMENTS ── */}
                    <div className="flex-1 flex flex-col justify-end items-end mb-2 relative z-10 gap-3 h-full">
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-[200px]">
                            <div className="text-right">
                                <div className="text-[8px] text-gray-500 font-display tracking-wider">DPS</div>
                                <div className="text-xs font-mono text-cyan-300">{data.metrics.damage}<span className="text-[8px] text-cyan-700 ml-0.5">%</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] text-gray-500 font-display tracking-wider">CYC</div>
                                <div className="text-xs font-mono text-cyan-300">{data.metrics.fireRate}<span className="text-[8px] text-cyan-700 ml-0.5">Hz</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] text-gray-500 font-display tracking-wider">CRT</div>
                                <div className="text-xs font-mono text-yellow-300">{data.metrics.crit}<span className="text-[8px] text-yellow-700 ml-0.5">%</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] text-gray-500 font-display tracking-wider">RNG</div>
                                <div className="text-xs font-mono text-blue-300">{data.metrics.range}<span className="text-[8px] text-blue-700 ml-0.5">m</span></div>
                            </div>
                        </div>

                        {/* System Log */}
                        <div className="w-full border-t border-cyan-900/40 pt-1 mt-1">
                            <div className="text-[8px] font-mono text-cyan-600/80 leading-tight text-right">
                                {`> SYS: ONLINE`}<br/>
                                {`> NET: SECURE`}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
      )}
    </div>
  );
};
