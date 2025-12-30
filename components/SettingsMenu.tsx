
import React, { useState } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../game/useGameState';
import { audio } from '../utils/audio';
import { MobileControlScheme } from '../types';
import { HUDLayoutMode } from '../ui/hud/types';
import { SnakePreview } from './SnakePreview';
import { COSMETIC_REGISTRY } from '../game/cosmetics/CosmeticRegistry';

interface SettingsMenuProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onClose: () => void;
  unlockedCosmetics?: Set<string>;
  cameraControlsEnabled: boolean;
  setCameraControlsEnabled: (v: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    settings, setSettings, onClose, unlockedCosmetics = new Set(),
    cameraControlsEnabled, setCameraControlsEnabled
}) => {
  const [menuOpacity, setMenuOpacity] = useState(1);
  
  const handleMusicVol = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setSettings(s => ({ ...s, musicVolume: val }));
      audio.setVolume(val, settings.sfxVolume);
  };

  const handleSfxVol = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setSettings(s => ({ ...s, sfxVolume: val }));
      audio.setVolume(settings.musicVolume, val);
  };

  const setControlScheme = (scheme: MobileControlScheme) => {
      setSettings(s => ({ ...s, mobileControlScheme: scheme }));
  };

  // Helper to parse current style into Category + Version
  const getStyleComponents = (style: string) => {
      if (style === 'AUTO') return { category: 'AUTO', variant: 1 };
      
      const match = style.match(/^([A-Z]+)(\d*)$/);
      if (match) {
          return { 
              category: match[1], 
              variant: match[2] ? parseInt(match[2]) : 1 
          };
      }
      return { category: 'MECH', variant: 1 };
  };

  const { category: currentCat, variant: currentVar } = getStyleComponents(settings.snakeStyle);

  const CATEGORIES = ['AUTO', 'MECH', 'FLUX', 'NEON', 'PIXEL', 'MINIMAL', 'GLITCH', 'ORGANIC', 'PROTOCOL', 'SYSTEM'];
  
  const updateStyle = (cat: string, ver: number) => {
      if (cat === 'AUTO') {
          setSettings(s => ({ ...s, snakeStyle: 'AUTO' }));
          return;
      }
      
      let suffix = '';
      if (ver > 1) suffix = ver.toString();
      
      const newStyle = `${cat}${suffix}`;
      
      if (unlockedCosmetics.has(newStyle)) {
          setSettings(s => ({ ...s, snakeStyle: newStyle as any }));
      }
  };

  const setHudLayout = (layout: HUDLayoutMode) => {
      if (unlockedCosmetics.has(layout)) {
          setSettings(s => ({ 
              ...s, 
              hudConfig: { ...s.hudConfig, layout } 
          }));
          setMenuOpacity(0.1);
      }
  };

  const handleMouseMove = () => {
      if (menuOpacity < 1) {
          setMenuOpacity(1);
      }
  };

  const layoutGroups = [
      { name: 'Cyber', modes: ['CYBER', 'CYBER2', 'CYBER3', 'CYBER4', 'CYBER5', 'CYBER6', 'CYBER7'] },
      { name: 'RPG', modes: ['RPG', 'RPG2', 'RPG3', 'RPG4', 'RPG5', 'RPG6', 'RPG7'] },
      { name: 'Industrial', modes: ['INDUSTRIAL', 'INDUSTRIAL2', 'INDUSTRIAL3', 'INDUSTRIAL4', 'INDUSTRIAL5', 'INDUSTRIAL6', 'INDUSTRIAL7'] },
      { name: 'Glass', modes: ['GLASS', 'GLASS2', 'GLASS3', 'GLASS4', 'GLASS5', 'GLASS6', 'GLASS7'] },
      { name: 'Arcade', modes: ['ARCADE', 'ARCADE2', 'ARCADE3', 'ARCADE4', 'ARCADE5', 'ARCADE6', 'ARCADE7'] },
      { name: 'Retro', modes: ['RETRO', 'RETRO2', 'RETRO3', 'RETRO4', 'RETRO5', 'RETRO6', 'RETRO7'] },
      { name: 'Holo', modes: ['HOLO', 'HOLO2', 'HOLO3', 'HOLO4', 'HOLO5', 'HOLO6', 'HOLO7'] },
      { name: 'Zen', modes: ['ZEN', 'ZEN2', 'ZEN3', 'ZEN4', 'ZEN5', 'ZEN6', 'ZEN7'] },
  ];

  const isStyleUnlocked = (cat: string, ver: number) => {
      if (cat === 'AUTO') return true;
      const suffix = ver > 1 ? ver.toString() : '';
      return unlockedCosmetics.has(`${cat}${suffix}`);
  };

  return (
    <div 
        className="absolute inset-0 bg-transparent z-50 flex items-center justify-center p-4 pointer-events-auto"
        onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 bg-black/10" onClick={onClose}></div>

      <div 
        className="w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-sm border border-cyan-900/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] p-6 rounded-lg relative overflow-hidden animate-in zoom-in-95 duration-200 z-10 transition-opacity duration-300 ease-out"
        style={{ opacity: menuOpacity }}
      >
        
        <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-2">
            <h2 className="text-2xl font-display text-cyan-400 tracking-widest">SYSTEM CONFIG</h2>
            <div className="text-xs font-mono text-gray-500">REV. 7.0</div>
        </div>

        <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* CAMERA & INPUT */}
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Input & Camera</h3>
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                        <div>
                            <div className="text-sm font-bold text-white">Manual Camera Control</div>
                            <div className="text-[10px] text-gray-400 font-mono">Unlock Zoom (Wheel) & Angle (Key C)</div>
                        </div>
                        <button 
                            onClick={() => {
                                setCameraControlsEnabled(!cameraControlsEnabled);
                                audio.play('UI_HARD_CLICK');
                            }}
                            className={`w-12 h-6 rounded-full border relative transition-colors ${cameraControlsEnabled ? 'bg-cyan-900 border-cyan-500' : 'bg-black border-gray-700'}`}
                        >
                            <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all ${cameraControlsEnabled ? 'left-6 bg-cyan-400 shadow-[0_0_5px_cyan]' : 'left-1 bg-gray-500'}`} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {['JOYSTICK', 'ARROWS', 'SWIPE'].map(scheme => (
                            <button
                                key={scheme}
                                onClick={() => setControlScheme(scheme as MobileControlScheme)}
                                className={`
                                    py-2 text-xs font-bold border rounded transition-all
                                    ${settings.mobileControlScheme === scheme 
                                        ? 'bg-cyan-900 border-cyan-500 text-white' 
                                        : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500'}
                                `}
                            >
                                {scheme}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* AUDIO */}
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Audio</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Music Volume</label>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={settings.musicVolume} onChange={handleMusicVol}
                            className="w-32 accent-cyan-500"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">SFX Volume</label>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={settings.sfxVolume} onChange={handleSfxVol}
                            className="w-32 accent-cyan-500"
                        />
                    </div>
                </div>
            </section>

            {/* INTERFACE */}
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Interface Protocol</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {layoutGroups.map(group => (
                            <div key={group.name} className="flex flex-col gap-1 p-2 bg-gray-900/30 rounded border border-gray-800">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">{group.name}</div>
                                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                    {group.modes.map(mode => {
                                        const isActive = settings.hudConfig.layout === mode;
                                        const isUnlocked = unlockedCosmetics.has(mode);
                                        const def = COSMETIC_REGISTRY[mode];
                                        
                                        let label = 'I';
                                        if (mode.endsWith('2')) label = 'II';
                                        if (mode.endsWith('3')) label = 'III';
                                        if (mode.endsWith('4')) label = 'IV';
                                        if (mode.endsWith('5')) label = 'V';
                                        if (mode.endsWith('6')) label = 'VI';
                                        if (mode.endsWith('7')) label = 'VII';

                                        return (
                                            <button
                                                key={mode}
                                                onClick={() => setHudLayout(mode as HUDLayoutMode)}
                                                disabled={!isUnlocked}
                                                title={isUnlocked ? def?.displayName : `LOCKED: ${def?.unlockHint}`}
                                                className={`
                                                    flex-1 min-w-[24px] px-1 py-2 text-[8px] font-bold border rounded transition-all relative overflow-hidden
                                                    ${isActive 
                                                        ? 'bg-cyan-700 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)] ring-1 ring-cyan-300/50' 
                                                        : isUnlocked
                                                            ? 'bg-black/40 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                                            : 'bg-black/20 border-gray-800 text-gray-700 cursor-not-allowed opacity-50'
                                                    }
                                                `}
                                            >
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none" />
                                                )}
                                                {isUnlocked ? label : '🔒'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* VISUALS */}
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Video</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">FX Intensity</label>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={settings.fxIntensity} onChange={(e) => setSettings(s => ({ ...s, fxIntensity: parseFloat(e.target.value) }))}
                            className="w-32 accent-cyan-500"
                        />
                    </div>
                    
                    <div className="pt-2 border-t border-gray-800/50 mt-2">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-mono text-cyan-100">Snake Render Style</label>
                            <span className="text-[9px] text-gray-500 font-mono tracking-wider">VISUAL OVERRIDE</span>
                        </div>
                        
                        <SnakePreview snakeStyle={settings.snakeStyle} />

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase tracking-widest">Archetype</label>
                                <select 
                                    value={currentCat}
                                    onChange={(e) => {
                                        const newCat = e.target.value;
                                        updateStyle(newCat, 1);
                                    }}
                                    className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono p-2 rounded focus:border-cyan-500 outline-none hover:border-gray-500 transition-colors"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-32">
                                <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase tracking-widest">Version</label>
                                <select 
                                    value={currentVar}
                                    onChange={(e) => updateStyle(currentCat, parseInt(e.target.value))}
                                    disabled={currentCat === 'AUTO'}
                                    className={`w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono p-2 rounded focus:border-cyan-500 outline-none transition-all ${currentCat === 'AUTO' ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}
                                >
                                    {[1, 2, 3, 4, 5, 6].map(ver => {
                                        const unlocked = isStyleUnlocked(currentCat, ver);
                                        return (
                                            <option key={ver} value={ver} disabled={!unlocked}>
                                                {unlocked ? `MK ${['I','II','III','IV','V','VI'][ver-1]}` : `LOCKED (MK ${['I','II','III','IV','V','VI'][ver-1]})`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button 
                onClick={() => {
                    setSettings(DEFAULT_USER_SETTINGS);
                    audio.setVolume(DEFAULT_USER_SETTINGS.musicVolume, DEFAULT_USER_SETTINGS.sfxVolume);
                    setCameraControlsEnabled(false);
                }}
                className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-950/30 rounded transition-colors"
            >
                RESET DEFAULTS
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all"
            >
                APPLY & CLOSE
            </button>
        </div>

      </div>
    </div>
  );
};
