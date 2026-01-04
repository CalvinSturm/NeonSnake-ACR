
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

type TabId = 'GAME' | 'CONTROLS' | 'VIDEO' | 'AUDIO';

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    settings, setSettings, onClose, unlockedCosmetics = new Set(),
    cameraControlsEnabled, setCameraControlsEnabled
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('GAME');
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

  const enterControlEditMode = () => {
      setSettings(s => ({ ...s, isControlEditMode: true }));
  };

  // If in edit mode, hide this menu entirely so the Game component can show the editor
  if (settings.isControlEditMode) return null;

  // Helper for Toggle Switch
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
      <button 
          onClick={onChange}
          className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-cyan-600' : 'bg-gray-700'}`}
      >
          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
  );
  
  // Custom Color Toggle for warning settings
  const WarningToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-yellow-600' : 'bg-gray-700'}`}
    >
        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
);

  return (
    <div 
        className="absolute inset-0 bg-transparent z-50 flex items-center justify-center p-4 pointer-events-auto"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose}></div>

      <div 
        className="w-full max-w-xl bg-[#0a0a0a] border border-cyan-900/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-lg relative overflow-hidden animate-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]"
        style={{ opacity: menuOpacity }}
      >
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#0f0f0f]">
            <div>
                <h2 className="text-2xl font-display text-cyan-400 tracking-widest">SYSTEM CONFIG</h2>
                <div className="text-xs font-mono text-gray-500">REV. 7.3 // TERMINAL ACCESS</div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white px-2">
                [X]
            </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-800 bg-[#0a0a0a]">
            {(['GAME', 'CONTROLS', 'VIDEO', 'AUDIO'] as TabId[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors border-b-2 ${
                        activeTab === tab 
                        ? 'text-cyan-400 border-cyan-500 bg-cyan-950/20' 
                        : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-900'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {activeTab === 'GAME' && (
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                        <div>
                            <div className="text-sm font-bold text-white">Manual Camera Control</div>
                            <div className="text-[10px] text-gray-400 font-mono">Unlock Zoom (Wheel) & Angle (Key C)</div>
                        </div>
                        <ToggleSwitch 
                            checked={cameraControlsEnabled} 
                            onChange={() => {
                                setCameraControlsEnabled(!cameraControlsEnabled);
                                audio.play('UI_HARD_CLICK');
                            }} 
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Invert Rotation</label>
                        <ToggleSwitch 
                            checked={settings.invertRotation}
                            onChange={() => setSettings(s => ({ ...s, invertRotation: !s.invertRotation }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Skip Countdown</label>
                        <ToggleSwitch 
                            checked={settings.skipCountdown}
                            onChange={() => setSettings(s => ({ ...s, skipCountdown: !s.skipCountdown }))}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'CONTROLS' && (
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Input Method</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {['JOYSTICK', 'ARROWS', 'SWIPE'].map(scheme => (
                                <button
                                    key={scheme}
                                    onClick={() => setControlScheme(scheme as MobileControlScheme)}
                                    className={`
                                        py-3 text-xs font-bold border rounded transition-all
                                        ${settings.mobileControlScheme === scheme 
                                            ? 'bg-cyan-900/50 border-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.2)]' 
                                            : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}
                                    `}
                                >
                                    {scheme}
                                </button>
                            ))}
                        </div>
                    </div>

                    {settings.mobileControlScheme === 'SWIPE' && (
                        <div className="p-3 bg-gray-900/50 border border-gray-700 rounded space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Swipe Brake Action</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSettings(s => ({ ...s, swipeBrakeBehavior: 'BUTTON' }))}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded ${settings.swipeBrakeBehavior === 'BUTTON' ? 'bg-cyan-900 border-cyan-500 text-white' : 'bg-black border-gray-700 text-gray-500'}`}
                                >
                                    BUTTON
                                </button>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, swipeBrakeBehavior: 'HOLD' }))}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded ${settings.swipeBrakeBehavior === 'HOLD' ? 'bg-cyan-900 border-cyan-500 text-white' : 'bg-black border-gray-700 text-gray-500'}`}
                                >
                                    TOUCH & HOLD
                                </button>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                                {settings.swipeBrakeBehavior === 'BUTTON' ? "Use the dedicated 'Brake' button on-screen." : "Touch and hold anywhere to brake. Release to move."}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-mono text-cyan-100">Force Touch Controls</div>
                                <div className="text-[10px] text-gray-500 font-mono">Always show onscreen controls</div>
                            </div>
                            <ToggleSwitch 
                                checked={settings.forceTouchControls}
                                onChange={() => setSettings(s => ({ ...s, forceTouchControls: !s.forceTouchControls }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-mono text-cyan-100">Swap Sides</div>
                                <div className="text-[10px] text-gray-500 font-mono">Flip Movement & Action inputs</div>
                            </div>
                            <ToggleSwitch 
                                checked={settings.swapControls}
                                onChange={() => setSettings(s => ({ ...s, swapControls: !s.swapControls }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-mono text-cyan-100">Control Opacity</div>
                            </div>
                            <input 
                                type="range" min="0.1" max="1" step="0.1" 
                                value={settings.controlOpacity} onChange={(e) => setSettings(s => ({ ...s, controlOpacity: parseFloat(e.target.value) }))}
                                className="w-32 accent-cyan-500"
                            />
                        </div>

                        <button 
                            onClick={enterControlEditMode}
                            className="w-full py-3 border border-dashed border-cyan-700 text-cyan-500 hover:bg-cyan-950/30 hover:text-cyan-300 rounded text-xs font-bold tracking-widest uppercase transition-all"
                        >
                            [ CUSTOMIZE LAYOUT ]
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'VIDEO' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">Full Screen</label>
                        <ToggleSwitch checked={isFullscreen} onChange={toggleFullscreen} />
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
                        <ToggleSwitch 
                            checked={settings.screenShake} 
                            onChange={() => setSettings(s => ({ ...s, screenShake: !s.screenShake }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">High Contrast</label>
                        <ToggleSwitch 
                            checked={settings.highContrast} 
                            onChange={() => setSettings(s => ({ ...s, highContrast: !s.highContrast }))}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-cyan-100">CRT Scanlines</label>
                        <ToggleSwitch 
                            checked={settings.crtEffect} 
                            onChange={() => setSettings(s => ({ ...s, crtEffect: !s.crtEffect }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-mono text-yellow-100">Reduce Flashing</label>
                        <WarningToggleSwitch 
                            checked={settings.reduceFlashing} 
                            onChange={() => setSettings(s => ({ ...s, reduceFlashing: !s.reduceFlashing }))}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'AUDIO' && (
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
            )}

        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-4 bg-[#0f0f0f] border-t border-gray-800">
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
                className="px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded text-xs tracking-wide shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all"
            >
                APPLY & CLOSE
            </button>
        </div>

      </div>
    </div>
  );
};
