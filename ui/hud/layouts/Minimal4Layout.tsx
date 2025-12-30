
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SETTINGS } from '../../../constants';

interface Minimal4LayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const Minimal4Layout: React.FC<Minimal4LayoutProps> = ({ data, config, children, showUI = true }) => {
  // Convert grid coordinates to pixel coordinates for the tracker
  const px = data.headPosition.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
  const py = data.headPosition.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

  // Clamp to screen edges so UI doesn't disappear
  const cx = Math.max(50, Math.min(CANVAS_WIDTH - 50, px));
  const cy = Math.max(50, Math.min(CANVAS_HEIGHT - 50, py));

  return (
    <div 
        className="relative bg-black overflow-hidden font-sans"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {showUI && (
        <div 
            className="absolute z-30 pointer-events-none transition-transform duration-75 ease-out will-change-transform"
            style={{ 
                left: 0, top: 0,
                transform: `translate(${cx}px, ${cy}px)` 
            }}
        >
            {/* Orbit Ring (Health) */}
            <div className="absolute -inset-10 w-20 h-20 -translate-x-1/2 -translate-y-1/2">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle 
                        cx="40" cy="40" r="30" fill="none" 
                        stroke={data.vitals.integrity < 30 ? '#ff0000' : '#ffffff'} 
                        strokeWidth="4" 
                        strokeDasharray={188}
                        strokeDashoffset={188 * (1 - data.vitals.integrity / 100)}
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            {/* Weapon Dots (Bottom) */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-1 pt-2">
                {data.loadout.weapons.map((w, i) => (
                    <div 
                        key={w.id} 
                        className={`w-2 h-2 rounded-full ${w.cooldownPct >= 1 ? 'bg-white shadow-[0_0_5px_white]' : 'bg-gray-600'}`}
                    />
                ))}
            </div>

            {/* XP (Top) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pb-2 opacity-50">
                <span className="text-[8px] font-bold text-white">LVL {data.progression.level}</span>
            </div>

        </div>
      )}
    </div>
  );
};
