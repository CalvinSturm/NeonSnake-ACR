
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RPG6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RPG6Layout: React.FC<RPG6LayoutProps> = ({ data, config, children, showUI = true }) => {
  return (
    <div 
        className="relative bg-[#050202] overflow-hidden font-serif text-[#e2d0a4]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── DIVINE GLOW ── */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.1),transparent_50%)]"></div>

      {showUI && (
        <>
            {/* ── TOP CENTER: SOUL COUNTER ── */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="relative">
                    {/* Wings SVG */}
                    <svg width="300" height="60" viewBox="0 0 300 60" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 fill-[#e2d0a4]">
                        <path d="M150 30 C 100 30, 80 10, 20 20 C 50 30, 100 40, 140 40 L 160 40 C 200 40, 250 30, 280 20 C 220 10, 200 30, 150 30 Z" />
                    </svg>
                    
                    <div className="text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#fff] via-[#ffd700] to-[#b8860b] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative z-10">
                        {data.score.current.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs font-bold text-[#b8860b] tracking-[0.5em] uppercase mt-1 border-t border-[#b8860b]/50 pt-1">
                    Divine Favor
                </div>
            </div>

            {/* ── BOTTOM HUD: CELESTIAL ALIGNMENT ── */}
            <div className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-end px-12 pb-8 pointer-events-none">
                
                {/* LEFT: ESSENCE GLOBE (HP) */}
                <div className="relative w-36 h-36 -mb-6 pointer-events-auto group">
                    {/* Ornate Frame */}
                    <div className="absolute inset-[-10px] border-2 border-[#b8860b] rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-[-4px] border border-[#e2d0a4] rounded-full"></div>
                    
                    {/* Globe Mask */}
                    <div className="absolute inset-0 rounded-full bg-[#1a0f0f] overflow-hidden shadow-[inset_0_0_30px_#000]">
                        {/* Fluid Fill */}
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#800000] via-[#ff0000] to-[#ff6666] transition-all duration-500 ease-in-out"
                            style={{ height: `${data.vitals.integrity}%`, filter: 'blur(2px) contrast(1.5)' }}
                        />
                        {/* Bubbles */}
                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
                        {/* Inner Shadow */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)]"></div>
                        {/* Glass Shine */}
                        <div className="absolute top-4 left-6 w-10 h-6 bg-white/20 rounded-full blur-md rotate-[-45deg]"></div>
                    </div>
                    
                    <div className="absolute -bottom-8 w-full text-center font-bold text-[#e2d0a4] text-sm tracking-widest drop-shadow-md">
                        VITALITY
                    </div>
                </div>

                {/* CENTER: CONSTELLATION SKILLS */}
                <div className="flex-1 flex justify-center items-end pb-4 gap-4 pointer-events-auto">
                    {data.loadout.weapons.map((w, i) => (
                        <div key={w.id} className="relative group flex flex-col items-center gap-2">
                            {/* Skill Frame */}
                            <div className={`
                                w-16 h-16 rotate-45 border-2 flex items-center justify-center bg-[#1a1010]/80 backdrop-blur-sm transition-all duration-300
                                ${w.active ? 'border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-[#554433] grayscale opacity-70'}
                            `}>
                                {/* Un-rotate Icon */}
                                <div className="-rotate-45 text-2xl drop-shadow-lg filter contrast-125">
                                    {w.icon}
                                </div>
                                
                                {/* Cooldown Veil */}
                                {!w.active && (
                                    <div className="absolute inset-0 bg-black/60 -rotate-45 origin-bottom transition-all duration-100" style={{ transform: `scaleY(${1-w.cooldownPct})` }}></div>
                                )}
                            </div>
                            
                            {/* Roman Numeral Level */}
                            <div className="text-[10px] text-[#b8860b] font-bold tracking-widest mt-2">
                                {['I','II','III','IV','V','VI','VII','VIII','IX','X'][Math.min(9, w.level-1)] || w.level}
                            </div>
                            
                            <HUDTooltip title={w.label || w.id} description={w.description} level={w.level} />
                        </div>
                    ))}
                </div>

                {/* RIGHT: AETHER GLOBE (XP/Shield) */}
                <div className="relative w-36 h-36 -mb-6 pointer-events-auto group">
                    {/* Ornate Frame */}
                    <div className="absolute inset-[-10px] border-2 border-[#b8860b] rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-[-4px] border border-[#e2d0a4] rounded-full"></div>
                    
                    {/* Globe Mask */}
                    <div className="absolute inset-0 rounded-full bg-[#0f151a] overflow-hidden shadow-[inset_0_0_30px_#000]">
                        {/* Fluid Fill */}
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#000080] via-[#4169e1] to-[#87ceeb] transition-all duration-500 ease-in-out"
                            style={{ height: `${(data.progression.xp / data.progression.xpMax) * 100}%`, filter: 'blur(2px) contrast(1.5)' }}
                        />
                        {/* Inner Shadow */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)]"></div>
                        {/* Glass Shine */}
                        <div className="absolute top-4 right-6 w-10 h-6 bg-white/20 rounded-full blur-md rotate-[45deg]"></div>
                    </div>
                    
                    <div className="absolute -bottom-8 w-full text-center font-bold text-[#e2d0a4] text-sm tracking-widest drop-shadow-md">
                        ASCENSION
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};
