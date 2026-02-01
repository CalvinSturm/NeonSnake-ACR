
import React from 'react';
import { HUDData, HUDConfig } from '../types';
import { HUDNumber, HUDBar, HUDSkillSlot } from '../HUDPrimitives';
import { HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';

interface RetroLayoutProps {
  data: HUDData;
  config: HUDConfig;
  children?: React.ReactNode;
  showUI?: boolean;
}

export const RetroLayout: React.FC<RetroLayoutProps> = ({ data, config, children, showUI = true }) => {
  // Retro Colors
  const C_GREEN = '#39ff14';
  const C_DIM = '#1a441a';
  const C_BG = '#000000';

  return (
    <div 
        className="relative bg-transparent overflow-hidden font-mono"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      
      {/* ── GAME LAYER ── */}
      <div className="absolute inset-0 z-0">
          {children}
      </div>

      {/* ── RETRO SCANLINE OVERLAY ── */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

      {/* ── TOP HUD (Fixed Height) ── */}
      {showUI && (
        <div 
            className="absolute top-0 left-0 w-full z-20 flex justify-between items-start px-4 pt-4 border-b-4 border-double"
            style={{ 
                height: HUD_TOP_HEIGHT, 
                backgroundColor: 'rgba(0,0,0,0.8)', // Semi-transparent
                borderColor: C_GREEN,
                color: C_GREEN
            }}
        >
            {/* LEFT: SCORE */}
            <div className="flex flex-col">
                <div className="text-xs tracking-widest opacity-80 mb-1">SCORE_VAL</div>
                <div className="text-3xl font-bold tracking-widest leading-none">
                    {data.score.current.toString().padStart(6, '0')}
                </div>
                {data.score.combo > 1 && (
                    <div className="text-sm mt-1 animate-pulse"> COMBO x{data.score.combo}</div>
                )}
            </div>

            {/* CENTER: TITLE / STATUS */}
            <div className="flex flex-col items-center pt-1">
                <div className="text-xs border px-2 py-0.5 mb-1" style={{ borderColor: C_GREEN }}>
                    {data.threat.label}
                </div>
                <div className="text-[10px] tracking-[0.3em]">{data.progression.stageLabel}</div>
            </div>

            {/* RIGHT: STAGE */}
            <div className="text-right">
                <div className="text-xs tracking-widest opacity-80 mb-1">SECTOR</div>
                <div className="text-3xl font-bold leading-none">
                    {data.progression.stage.toString().padStart(2, '0')}
                </div>
            </div>
        </div>
      )}

      {/* ── BOTTOM HUD (Fixed Height) ── */}
      {showUI && (
        <div 
            className="absolute bottom-0 left-0 w-full z-20 flex items-center justify-between px-6 border-t-4 border-double bg-black/80"
            style={{ 
                height: HUD_BOTTOM_HEIGHT, 
                borderColor: C_GREEN 
            }}
        >
            
            {/* LEFT: VITALS */}
            <div className="w-64">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs" style={{ color: C_GREEN }}>INTEGRITY</span>
                    <span className="text-xs">{data.vitals.integrity}%</span>
                </div>
                <HUDBar 
                    value={data.vitals.integrity} 
                    color={data.vitals.integrity < 30 ? '#ff0000' : C_GREEN} 
                    config={{ ...config, layout: 'RETRO' }} 
                    height={10}
                />
                <div className="flex justify-between items-end mt-2 mb-1">
                    <span className="text-xs" style={{ color: C_GREEN }}>SYNC_DATA</span>
                    <span className="text-[10px]">LVL {data.progression.level}</span>
                </div>
                <HUDBar 
                    value={(data.progression.xp / data.progression.xpMax) * 100} 
                    color={C_GREEN} 
                    config={{ ...config, layout: 'RETRO' }} 
                    height={4}
                />
            </div>

            {/* CENTER: LOADOUT */}
            <div className="flex-1 flex justify-center gap-4 h-full items-center">
                {data.loadout.utilities.map(u => (
                    <HUDSkillSlot key={u.id} skill={u} config={{ ...config, layout: 'RETRO' }} />
                ))}
                <div className="w-px h-10 bg-green-900 mx-2"></div>
                {data.loadout.weapons.map(w => (
                    <HUDSkillSlot key={w.id} skill={w} config={{ ...config, layout: 'RETRO' }} />
                ))}
            </div>

            {/* RIGHT: METRICS (Vertical List) */}
            <div className="w-32 text-xs font-mono space-y-1" style={{ color: C_GREEN }}>
                <div className="flex justify-between border-b border-green-900 pb-1">
                    <span>DMG</span>
                    <span>{data.metrics.damage}</span>
                </div>
                <div className="flex justify-between border-b border-green-900 pb-1">
                    <span>SPD</span>
                    <span>{data.metrics.fireRate}</span>
                </div>
                <div className="flex justify-between">
                    <span>CRT</span>
                    <span>{data.metrics.crit}%</span>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};
