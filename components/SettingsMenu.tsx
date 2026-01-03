
import React, { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../game/useGameState';
import { audio } from '../utils/audio';
import { MobileControlScheme } from '../types';

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
      setIsFullscreen(!!document.fullscreenElement);
      const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', onFsChange);
      return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
      } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
      }
      audio.play('UI_HARD_CLICK');
  };
  
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

  const handleMouseMove = () => {
      if (menuOpacity < 1) {
          setMenuOpacity(1);
      }
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
            <div className="text-xs font-mono text-gray-500">REV. 7.2</div>
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

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Invert Rotation</label>
                        <button 
                            onClick={() => setSettings(s => ({ ...s, invertRotation: !s.invertRotation }))}
                            className={`w-8 h-4 rounded-full relative transition-colors ${settings.invertRotation ? 'bg-cyan-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${settings.invertRotation ? 'left-4.5' : 'left-0.5'}`} />
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

            {/* VISUALS */}
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Video & Accessibility</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Full Screen</label>
                        <button 
                            onClick={toggleFullscreen}
                            className={`w-8 h-4 rounded-full relative transition-colors ${isFullscreen ? 'bg-cyan-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${isFullscreen ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">FX Intensity</label>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={settings.fxIntensity} onChange={(e) => setSettings(s => ({ ...s, fxIntensity: parseFloat(e.target.value) }))}
                            className="w-32 accent-cyan-500"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Screen Shake</label>
                        <button 
                            onClick={() => setSettings(s => ({ ...s, screenShake: !s.screenShake }))}
                            className={`w-8 h-4 rounded-full relative transition-colors ${settings.screenShake ? 'bg-cyan-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${settings.screenShake ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">High Contrast</label>
                        <button 
                            onClick={() => setSettings(s => ({ ...s, highContrast: !s.highContrast }))}
                            className={`w-8 h-4 rounded-full relative transition-colors ${settings.highContrast ? 'bg-cyan-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${settings.highContrast ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    
                    {/* NEW SETTINGS */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">CRT Scanlines</label>
                        <button 
                            onClick={() => setSettings(s => ({ ...s, crtEffect: !s.crtEffect }))}
                            className={`w-8 h-4 rounded-full relative transition-colors ${settings.crtEffect ? 'bg-cyan-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${settings.crtEffect ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-yellow-100">Reduce Flashing (Photosensitivity)</label>
                        <button 
                            onClick={() => setSettings(s => ({ ...s, reduceFlashing: !s.reduceFlashing }))}
                            className={`w-8 h-4 rounded-full relative transition-colors ${settings.reduceFlashing ? 'bg-yellow-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${settings.reduceFlashing ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
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
