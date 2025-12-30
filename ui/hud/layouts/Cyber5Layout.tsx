
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface Cyber5LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Cyber5Layout: React.FC<Cyber5LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-black overflow-hidden font-mono tracking-tight"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── AMBIENT DATA MESH ── */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(0deg,transparent_24%,rgba(32,255,255,0.3)_25%,rgba(32,255,255,0.3)_26%,transparent_27%,transparent_74%,rgba(32,255,255,0.3)_75%,rgba(32,255,255,0.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(32,255,255,0.3)_25%,rgba(32,255,255,0.3)_26%,transparent_27%,transparent_74%,rgba(32,255,255,0.3)_75%,rgba(32,255,255,0.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]" />

      {showUI && (
        <>
            {/* ── TOP: DATA STREAMS ── */}
            <div 
                className="absolute top-0 left-0 w-full z-20 px-6 pt-4 flex justify-between items-start pointer-events-none"
                style={{ height: HUD_TOP_HEIGHT }}
            >
                {/* Left Stream (Score) */}
                <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-2 text-cyan-500/50 text-[10px]">
                        <span className="w-2 h-2 bg-cyan-500 animate-ping rounded-full"></span>
                        <span>LIVE_FEED :: SCORE_KERNEL</span>
                    </div>
                    <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_cyan]">
                        {data.score.current.toLocaleString()}
                    </div>
                    {data.score.combo > 1 && (
                        <div className="text-sm text-yellow-400 font-bold bg-yellow-900/20 border border-yellow-500/50 px-2 skew-x-12">
                            CHAIN x{data.score.combo}
                        </div>
                    )}
                </div>

                {/* Right Stream (Threat) */}
                <div className="flex flex-col gap-1 items-end">
                    <div className="text-[10px] text-red-500/50">THREAT_ANALYSIS_DAEMON</div>
                    <div className={`text-2xl font-bold ${data.threat.colorClass} border-b border-current pb-1`}>
                        {data.threat.label}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold">
                        SECTOR {data.progression.stage.toString().padStart(3,'0')}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM: NEURAL INTERFACE ── */}
            <div 
                className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-4 pb-4 pointer-events-none"
                style={{ height: HUD_BOTTOM_HEIGHT + 20 }}
            >
                {/* Left: Vitals Graph */}
                <div className="w-64 h-16 relative bg-gray-900/50 border border-gray-800 backdrop-blur pointer-events-auto">
                    <div className="absolute inset-0 flex items-center px-4 gap-4">
                        <div className="text-2xl font-bold text-white">{data.vitals.integrity}%</div>
                        <div className="flex-1 h-2 bg-gray-800 overflow-hidden relative">
                            {/* Glitchy Bar */}
                            <div 
                                className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_10px_cyan]" 
                                style={{ width: `${data.vitals.integrity}%` }}
                            />
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_4px)] opacity-50"></div>
                        </div>
                    </div>
                    {data.vitals.shieldActive && (
                        <div className="absolute -top-3 left-0 bg-cyan-500 text-black text-[10px] font-bold px-2">SHIELD_ACTIVE</div>
                    )}
                </div>

                {/* Center: Skill Nodes */}
                <div className="flex gap-4 mb-2 pointer-events-auto">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group">
                            {/* Hex Node */}
                            <div className={`
                                w-14 h-14 bg-black border border-cyan-800 flex items-center justify-center 
                                transition-all duration-200 relative overflow-hidden
                                ${w.active ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'opacity-60'}
                            `} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                <div className={`text-xl ${w.active ? 'text-white' : 'text-gray-500 grayscale'}`}>{w.icon}</div>
                                
                                {/* Cooldown Curtain */}
                                {!w.active && (
                                    <div 
                                        className="absolute inset-0 bg-cyan-900/80 transition-all duration-75"
                                        style={{ transform: `translateY(${(1-w.cooldownPct)*100}%)` }}
                                    />
                                )}
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-cyan-600 font-bold">MK.{w.level}</div>
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* Right: Waveform Analytics */}
                <div className="w-48 h-16 bg-gray-900/50 border border-gray-800 backdrop-blur flex flex-col justify-center px-4 gap-1 pointer-events-auto text-right">
                    <div className="text-[10px] text-gray-500">DPS_OUTPUT</div>
                    <div className="text-xl font-bold text-cyan-400">{data.metrics.damage}</div>
                    <div className="w-full h-px bg-cyan-900/50"></div>
                    <div className="flex justify-between text-[9px] text-gray-400">
                        <span>SPD: {data.metrics.fireRate}</span>
                        <span>CRT: {data.metrics.crit}%</span>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
