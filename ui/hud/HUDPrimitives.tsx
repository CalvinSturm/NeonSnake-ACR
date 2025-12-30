
import React from 'react';
import { HUDConfig, HUDSkillData } from './types';
import { useUIStyle } from '../useUIStyle';

// ─── TOOLTIP HELPER ───
interface HUDTooltipProps {
  title: string;
  description?: string;
  level?: number;
}

export const HUDTooltip: React.FC<HUDTooltipProps> = ({ title, description, level }) => (
  <div className="absolute bottom-[120%] left-1/2 -translate-x-1/2 w-48 bg-black/95 border border-cyan-500/50 p-3 text-left opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] shadow-[0_0_20px_rgba(0,0,0,0.9)] backdrop-blur-xl rounded-sm">
      <div className="flex justify-between items-center mb-1 border-b border-gray-800 pb-1">
          <span className="font-bold text-cyan-100 font-display tracking-widest text-xs uppercase">{title}</span>
          {level !== undefined && <span className="text-[9px] font-mono text-cyan-500">MK.{level}</span>}
      </div>
      {description && <div className="text-gray-400 text-[10px] leading-relaxed font-mono">{description}</div>}
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500"></div>
      
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cyan-500/50"></div>
  </div>
);

// ─── NUMBER DISPLAY ───
interface HUDNumberProps {
  label: string;
  value: string | number;
  config: HUDConfig;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const HUDNumber: React.FC<HUDNumberProps> = ({ label, value, config, size = 'md', color }) => {
  const style = useUIStyle();
  const finalColor = config.layout === 'RETRO' ? '#39ff14' : (color || style.colors.text);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-3xl'
  };

  const fontClass = config.layout === 'RETRO' ? 'font-mono' :
                    config.numberStyle === 'DIGITAL' ? 'font-mono tracking-widest' : 
                    config.numberStyle === 'GLYPH' ? 'font-display' : 'font-sans';

  return (
    <div className={`flex flex-col ${config.layout === 'ZEN' ? 'items-start' : 'items-center'}`}>
      <span 
        className="text-[9px] uppercase tracking-wider opacity-70" 
        style={{ color: config.layout === 'RETRO' ? '#39ff14' : style.colors.secondary }}
      >
        {label}
      </span>
      <span 
        className={`${sizeClasses[size]} ${fontClass} font-bold tabular-nums`}
        style={{ 
            color: finalColor,
            textShadow: config.theme === 'NEON' ? `0 0 10px ${finalColor}` : 'none'
        }}
      >
        {value}
      </span>
    </div>
  );
};

// ─── PROGRESS BAR ───
interface HUDBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  color: string;
  config: HUDConfig;
  height?: number;
}

export const HUDBar: React.FC<HUDBarProps> = ({ value, max = 100, label, color, config, height = 6 }) => {
  const style = useUIStyle();
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  
  const isRetro = config.layout === 'RETRO';
  const barHeight = isRetro ? height + 4 : height;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-[10px] mb-1 font-mono uppercase tracking-widest" style={{ color: isRetro ? '#39ff14' : style.colors.text }}>
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      
      <div 
        className="w-full relative overflow-hidden"
        style={{ 
            height: `${barHeight}px`,
            backgroundColor: isRetro ? '#000' : 'rgba(20,20,20,0.8)',
            border: isRetro ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: config.layout === 'RPG' ? '4px' : '0px',
            transform: config.layout === 'CYBER' ? 'skewX(-15deg)' : 'none'
        }}
      >
        {/* Background Grid (Cyber Only) */}
        {config.layout === 'CYBER' && (
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: `linear-gradient(90deg, transparent 50%, ${style.colors.grid} 50%)`, backgroundSize: '4px 100%' }} 
            />
        )}

        {/* Fill */}
        <div 
            className="h-full transition-all duration-300 ease-out"
            style={{ 
                width: `${pct}%`,
                backgroundColor: color,
                boxShadow: (config.theme === 'NEON' && !isRetro) ? `0 0 10px ${color}` : 'none'
            }}
        />
        
        {/* Retro Grid Overlay */}
        {isRetro && (
             <div className="absolute inset-0" 
                  style={{ backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '4px 100%' }} 
             />
        )}
        
        {/* Scanline Overlay */}
        {config.showAnimations && !isRetro && (
            <div className="absolute inset-0 bg-white/10 animate-pulse" style={{ mixBlendMode: 'overlay' }} />
        )}
      </div>
    </div>
  );
};

// ─── SKILL SLOT ───
interface HUDSkillSlotProps {
  skill: HUDSkillData;
  config: HUDConfig;
  hotkey?: string;
}

export const HUDSkillSlot: React.FC<HUDSkillSlotProps> = ({ skill, config, hotkey }) => {
  const style = useUIStyle();
  const isActive = skill.cooldownPct >= 1; // 1 = Ready
  const isRetro = config.layout === 'RETRO';

  // Layout-specific container styles
  const containerStyle: React.CSSProperties = {
    borderColor: isActive 
        ? (isRetro ? '#39ff14' : style.colors.primary) 
        : (isRetro ? '#1a441a' : style.colors.secondary),
    backgroundColor: isRetro ? '#000' : 'rgba(0,0,0,0.6)',
    boxShadow: isActive && config.theme === 'NEON' && !isRetro ? `0 0 15px ${style.colors.primary}40` : 'none',
  };

  let shapeClass = "w-12 h-12 border-2 flex items-center justify-center relative transition-all duration-200";
  
  if (config.layout === 'CYBER') shapeClass += " rounded-none skew-x-[-10deg]";
  else if (config.layout === 'RPG') shapeClass += " rounded-md";
  else if (config.layout === 'RETRO') shapeClass += " rounded-none border-[3px]"; 
  else if (config.layout === 'ZEN') shapeClass = "w-10 h-10 border rounded-full flex items-center justify-center relative";

  return (
    <div className="group relative">
        <div className={shapeClass} style={containerStyle}>
            {/* Icon */}
            <div className={`text-xl ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                {skill.icon}
            </div>

            {/* Cooldown Overlay */}
            {!isActive && (
                <div 
                    className={`absolute inset-0 origin-bottom transition-all duration-100 ${isRetro ? 'bg-black/80' : 'bg-black/60'}`}
                    style={{ height: `${(1 - skill.cooldownPct) * 100}%` }}
                >
                    {isRetro && (
                        <div className="absolute top-0 left-0 w-full border-t border-green-900"></div>
                    )}
                </div>
            )}

            {/* Level Badge */}
            <div 
                className={`absolute -top-2 -right-2 text-[9px] px-1 font-mono 
                ${isRetro ? 'bg-black text-[#39ff14] border border-[#39ff14]' : 'bg-black border border-gray-700 text-white rounded'}`}
            >
                v{skill.level}
            </div>

            {/* Hotkey */}
            {hotkey && config.layout === 'RPG' && (
                <div className="absolute -bottom-2 right-1/2 translate-x-1/2 text-[8px] bg-gray-800 px-1 rounded text-gray-300">
                    {hotkey}
                </div>
            )}
        </div>
        
        {/* Tooltip */}
        <HUDTooltip 
            title={skill.label || skill.id} 
            description={skill.description} 
            level={skill.level} 
        />
    </div>
  );
};
