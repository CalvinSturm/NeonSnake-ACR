
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDTooltip } from '../HUDPrimitives';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SETTINGS } from '../../../constants';

interface Minimal6LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal6Layout: React.FC<Minimal6LayoutProps> = ({ data, config, children, showUI = true }) => {
  // We attach UI directly near the player character to keep focus central
  const px = data.headPosition.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
  const py = data.headPosition.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

  // Clamp
  const cx = Math.max(100, Math.min(CANVAS_WIDTH - 100, px));
  const cy = Math.max(100, Math.min(CANVAS_HEIGHT - 100, py));

  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <>
            {/* ── CONTEXTUAL ISLAND (Follows Player) ── */}
            <div 
                className="absolute z-30 pointer-events-none transition-transform duration-100 ease-out will-change-transform"
                style={{ 
                    left: 0, top: 0,
                    transform: `translate(${cx}px, ${cy}px)` 
                }}
            >
                {/* Health Arc (Bottom) */}
                <svg className="absolute -translate-x-1/2 translate-y-6 w-24 h-12 overflow-visible">
                    <path 
                        d="M 0 0 Q 12 12 24 0" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.2)" 
                        strokeWidth="3" 
                        transform="scale(4 1) translate(-12 0)"
                    />
                    <path 
                        d="M 0 0 Q 12 12 24 0" 
                        fill="none" 
                        stroke={data.vitals.integrity < 30 ? "#ef4444" : "#ffffff"} 
                        strokeWidth="3" 
                        transform="scale(4 1) translate(-12 0)"
                        strokeDasharray="30"
                        strokeDashoffset={30 * (1 - data.vitals.integrity/100)}
                    />
                </svg>

                {/* Ammo/Cooldown Dots (Top) */}
                <div className="absolute -translate-x-1/2 -translate-y-10 flex gap-1">
                    {data.loadout.weapons.map((w, i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${w.cooldownPct >= 1 ? 'bg-white scale-125' : 'bg-white/20 scale-100'}`}
                        />
                    ))}
                </div>
            </div>

            {/* ── STATIC ESSENTIALS (Corners) ── */}
            <div className="absolute top-6 right-6 z-30 text-right opacity-50">
                <div className="text-xl font-bold text-white">{data.score.current.toLocaleString()}</div>
            </div>

            <div className="absolute bottom-6 left-6 z-30 opacity-50">
                <div className="text-xs font-bold text-white uppercase tracking-widest">LVL {data.progression.level}</div>
            </div>
        </>
      )}
    </div>
  );
};
