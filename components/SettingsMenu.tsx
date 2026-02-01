
import React, { useState, useEffect, useRef } from 'react';
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
  onEditCamera?: () => void;
}

type TabId = 'GAME' | 'CONTROLS' | 'VIDEO' | 'AUDIO';

// ─── UI PRIMITIVES ───

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center gap-2 mb-4 mt-2">
        <div className="h-px bg-cyan-900/50 flex-1"></div>
        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em]">{title}</span>
        <div className="h-px bg-cyan-900/50 flex-1"></div>
    </div>
);

const CyberToggle: React.FC<{ 
    label: string; 
    description?: string; 
    checked: boolean; 
    onChange: () => void; 
    warning?: boolean;
}> = ({ label, description, checked, onChange, warning }) => {
    return (
        <div className="flex items-center justify-between py-2 group hover:bg-white/5 px-2 rounded transition-colors" onMouseEnter={() => audio.play('MOVE')}>
            <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-wide ${checked ? 'text-white' : 'text-gray-400'} transition-colors`}>{label}</span>
                {description && <span className="text-[10px] text-gray-500 font-mono">{description}</span>}
            </div>
            <button 
                onClick={() => { onChange(); audio.play('UI_HARD_CLICK'); }}
                className={`
                    relative w-12 h-6 rounded-sm border transition-all duration-300
                    ${checked 
                        ? (warning ? 'bg-yellow-900/50 border-yellow-500' : 'bg-cyan-900/50 border-cyan-500') 
                        : 'bg-black border-gray-700'}
                `}
            >
                <div className={`
                    absolute top-0.5 bottom-0.5 w-5 bg-white shadow-md transition-all duration-300
                    ${checked ? 'left-[26px] bg-white' : 'left-0.5 bg-gray-500'}
                `} />
                <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-widest pointer-events-none ${checked ? 'text-transparent' : 'text-gray-600'}`}>OFF</span>
                <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-widest pointer-events-none ${checked ? (warning ? 'text-yellow-400' : 'text-cyan-400') : 'text-transparent'}`}>ON</span>
            </button>
        </div>
    );
};

const CyberSlider: React.FC<{
    label: string;
    value: number; // 0 to 1
    onChange: (val: number) => void;
    steps?: number;
}> = ({ label, value, onChange, steps = 10 }) => {
    const handleStepClick = (idx: number) => {
        const newValue = (idx + 1) / steps;
        onChange(newValue);
        audio.play('UI_HARD_CLICK');
    };

    return (
        <div className="py-2 px-2 hover:bg-white/5 rounded transition-colors group" onMouseEnter={() => audio.play('MOVE')}>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{label}</span>
                <span className="text-xs font-mono text-cyan-500">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-1 h-4">
                {Array.from({ length: steps }).map((_, i) => {
                    const active = (i / steps) < value;
                    return (
                        <button
                            key={i}
                            onMouseDown={() => handleStepClick(i)}
                            className={`
                                flex-1 transition-all duration-200
                                ${active ? 'bg-cyan-500 shadow-[0_0_5px_cyan]' : 'bg-gray-800'}
                                hover:bg-cyan-300
                            `}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ 
    label: string; 
    active: boolean; 
    onClick: () => void; 
}> = ({ label, active, onClick }) => (
    <button
        onClick={() => { onClick(); audio.play('CLI_BURST'); }}
        className={`
            flex-1 py-3 text-xs font-bold tracking-[0.15em] border-b-2 transition-all relative overflow-hidden group
            ${active 
                ? 'text-cyan-400 border-cyan-500 bg-cyan-950/20' 
                : 'text-gray-500 border-gray-800 hover:text-gray-300 hover:bg-gray-900'}
        `}
    >
        {active && <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />}
        <span className="relative z-10">{label}</span>
    </button>
);

// ─── MAIN COMPONENT ───

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    settings, setSettings, onClose, unlockedCosmetics = new Set(),
    cameraControlsEnabled, setCameraControlsEnabled, onEditCamera
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('GAME');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
      setIsFullscreen(!!document.fullscreenElement);
      // Play open sound
      audio.play('CLI_BURST');
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
      } else {
          if (document.exitFullscreen) document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
  };
  
  const handleMusicVol = (val: number) => {
      setSettings(s => ({ ...s, musicVolume: val }));
      audio.setVolume(val, settings.sfxVolume);
  };

  const handleSfxVol = (val: number) => {
      setSettings(s => ({ ...s, sfxVolume: val }));
      audio.setVolume(settings.musicVolume, val);
      // Play test sound on release/click
      audio.play('UI_HARD_CLICK'); 
  };

  // ─── RENDER CONTENT ───

  const renderGameTab = () => (
      <div className="space-y-2 animate-in slide-in-from-right-4 fade-in duration-300">
          <SectionHeader title="Camera Systems" />
          
          <div className="bg-black/30 border border-gray-800 p-4 rounded mb-4">
              <div className="flex justify-between items-center mb-2">
                  <div>
                      <div className="text-white font-bold text-sm">Free Cam Mode</div>
                      <div className="text-gray-500 text-xs">Unlock manual camera controls</div>
                  </div>
                  <CyberToggle label="" checked={cameraControlsEnabled} onChange={() => setCameraControlsEnabled(!cameraControlsEnabled)} />
              </div>
              
              {cameraControlsEnabled && onEditCamera && (
                  <button 
                    onClick={() => { audio.play('CLI_BURST'); onEditCamera(); }}
                    className="w-full py-2 mt-2 bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-widest hover:bg-cyan-900/50 hover:border-cyan-400 transition-all"
                  >
                      ENTER CAMERA EDITOR
                  </button>
              )}
          </div>

          <CyberToggle 
              label="Invert Rotation" 
              description="Reverse turning direction."
              checked={settings.invertRotation} 
              onChange={() => setSettings(s => ({ ...s, invertRotation: !s.invertRotation }))} 
          />
          <CyberToggle 
              label="Quick Start" 
              description="Skip 3-2-1 countdown on resume."
              checked={settings.skipCountdown} 
              onChange={() => setSettings(s => ({ ...s, skipCountdown: !s.skipCountdown }))} 
          />

          <SectionHeader title="HUD Overlay" />
          
          <CyberToggle 
              label="HUD Visible" 
              checked={settings.hudConfig.visible} 
              onChange={() => setSettings(s => ({ ...s, hudConfig: { ...s.hudConfig, visible: !s.hudConfig.visible } }))} 
          />
          <CyberSlider 
              label="HUD Opacity" 
              value={settings.hudConfig.opacity} 
              onChange={(val) => setSettings(s => ({ ...s, hudConfig: { ...s.hudConfig, opacity: val } }))} 
          />
      </div>
  );

  const renderControlsTab = () => (
      <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
          <SectionHeader title="Input Protocol" />
          
          <div className="grid grid-cols-3 gap-2 mb-4">
              {['JOYSTICK', 'ARROWS', 'SWIPE'].map(scheme => (
                  <button
                      key={scheme}
                      onClick={() => { setSettings(s => ({ ...s, mobileControlScheme: scheme as MobileControlScheme })); audio.play('UI_HARD_CLICK'); }}
                      className={`
                          py-3 text-[10px] font-bold border rounded transition-all flex flex-col items-center gap-1
                          ${settings.mobileControlScheme === scheme 
                              ? 'bg-cyan-950 border-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.2)]' 
                              : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}
                      `}
                  >
                      <span>{scheme === 'JOYSTICK' ? '🕹️' : scheme === 'ARROWS' ? '⬅️' : '👆'}</span>
                      <span>{scheme}</span>
                  </button>
              ))}
          </div>

          {settings.mobileControlScheme === 'SWIPE' && (
              <div className="p-3 bg-gray-900/50 border border-gray-700 rounded mb-4">
                  <div className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-widest">Brake Action</div>
                  <div className="flex gap-2">
                      <button
                          onClick={() => setSettings(s => ({ ...s, swipeBrakeBehavior: 'BUTTON' }))}
                          className={`flex-1 py-2 text-[10px] font-bold border rounded ${settings.swipeBrakeBehavior === 'BUTTON' ? 'bg-cyan-900 border-cyan-500 text-white' : 'bg-black border-gray-700 text-gray-500'}`}
                      >
                          BUTTON TAP
                      </button>
                      <button
                          onClick={() => setSettings(s => ({ ...s, swipeBrakeBehavior: 'HOLD' }))}
                          className={`flex-1 py-2 text-[10px] font-bold border rounded ${settings.swipeBrakeBehavior === 'HOLD' ? 'bg-cyan-900 border-cyan-500 text-white' : 'bg-black border-gray-700 text-gray-500'}`}
                      >
                          PRESS & HOLD
                      </button>
                  </div>
              </div>
          )}

          <SectionHeader title="Layout & Accessibility" />
          
          <CyberToggle 
              label="Force Touch Controls" 
              description="Show mobile controls on desktop."
              checked={settings.forceTouchControls} 
              onChange={() => setSettings(s => ({ ...s, forceTouchControls: !s.forceTouchControls }))} 
          />
          <CyberToggle 
              label="Swap Hands" 
              description="Move movement controls to right side."
              checked={settings.swapControls} 
              onChange={() => setSettings(s => ({ ...s, swapControls: !s.swapControls }))} 
          />
          
          <CyberSlider 
              label="Control Opacity" 
              value={settings.controlOpacity} 
              onChange={(val) => setSettings(s => ({ ...s, controlOpacity: val }))} 
          />
      </div>
  );

  const renderVideoTab = () => (
      <div className="space-y-2 animate-in slide-in-from-right-4 fade-in duration-300">
          <SectionHeader title="Display" />
          
          <CyberToggle 
              label="Fullscreen Mode" 
              checked={isFullscreen} 
              onChange={toggleFullscreen} 
          />
          <CyberToggle 
              label="High Contrast" 
              description="Boost visibility of entities."
              checked={settings.highContrast} 
              onChange={() => setSettings(s => ({ ...s, highContrast: !s.highContrast }))} 
          />

          <SectionHeader title="Post-Processing" />
          
          <CyberToggle 
              label="CRT Scanlines" 
              description="Retro aesthetic overlay."
              checked={settings.crtEffect} 
              onChange={() => setSettings(s => ({ ...s, crtEffect: !s.crtEffect }))} 
          />
          <CyberToggle 
              label="Screen Shake" 
              description="Camera movement on impact."
              checked={settings.screenShake} 
              onChange={() => setSettings(s => ({ ...s, screenShake: !s.screenShake }))} 
          />
          <CyberToggle 
              label="Reduce Flashing" 
              description="Limit strobe effects for photosensitivity."
              checked={settings.reduceFlashing} 
              onChange={() => setSettings(s => ({ ...s, reduceFlashing: !s.reduceFlashing }))} 
              warning
          />

          <div className="mt-4">
              <CyberSlider 
                  label="FX Intensity" 
                  value={settings.fxIntensity} 
                  onChange={(val) => setSettings(s => ({ ...s, fxIntensity: val }))} 
              />
          </div>
      </div>
  );

  const renderAudioTab = () => (
      <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <SectionHeader title="Volume Levels" />
          
          <CyberSlider 
              label="Music" 
              value={settings.musicVolume} 
              onChange={handleMusicVol}
              steps={20}
          />
          <CyberSlider 
              label="Sound Effects" 
              value={settings.sfxVolume} 
              onChange={handleSfxVol}
              steps={20}
          />

          <div className="p-4 bg-gray-900/50 border-l-2 border-gray-600 italic text-xs text-gray-400 mt-4">
              "The silence of the void is broken only by the hum of the drive."
          </div>
      </div>
  );

  return (
    <div className="absolute inset-0 bg-transparent z-[60] flex items-start justify-center pt-24 p-4 pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Main Container */}
      <div className="w-full max-w-xl bg-[#080a0c] border border-cyan-900/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col h-[70vh] md:h-[75vh] animate-in zoom-in-95 duration-200">
        
        {/* CRT Scanline Overlay inside modal */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0"></div>

        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-cyan-900/50 bg-[#0e1216] relative z-10 shrink-0">
            <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-widest flex items-center gap-2">
                    <span className="text-cyan-500 text-lg">⚙</span> SYSTEM CONFIG
                </h2>
                <div className="text-[10px] font-mono text-cyan-700 tracking-[0.2em] mt-1">ACCESS_LEVEL: ADMIN</div>
            </div>
            <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-white px-3 py-1 border border-transparent hover:border-gray-600 transition-all font-mono"
            >
                [ESC]
            </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-cyan-900/30 bg-[#0a0c10] relative z-10 shrink-0">
            {(['GAME', 'CONTROLS', 'VIDEO', 'AUDIO'] as TabId[]).map(tab => (
                <TabButton 
                    key={tab} 
                    label={tab} 
                    active={activeTab === tab} 
                    onClick={() => setActiveTab(tab)} 
                />
            ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10 bg-gradient-to-b from-[#080a0c] to-[#050608]">
            {activeTab === 'GAME' && renderGameTab()}
            {activeTab === 'CONTROLS' && renderControlsTab()}
            {activeTab === 'VIDEO' && renderVideoTab()}
            {activeTab === 'AUDIO' && renderAudioTab()}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center p-4 bg-[#0e1216] border-t border-cyan-900/50 relative z-10 shrink-0">
            <button 
                onClick={() => {
                    audio.play('UI_HARD_CLICK');
                    setSettings(DEFAULT_USER_SETTINGS);
                    audio.setVolume(DEFAULT_USER_SETTINGS.musicVolume, DEFAULT_USER_SETTINGS.sfxVolume);
                    setCameraControlsEnabled(false);
                }}
                className="text-[10px] font-bold text-red-500 hover:text-red-300 hover:underline tracking-widest"
            >
                FACTORY_RESET
            </button>
            
            <button 
                onClick={onClose}
                className="px-8 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all clip-button"
            >
                APPLY_CHANGES
            </button>
        </div>

      </div>

      <style>{`
        .clip-button {
            clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
      `}</style>
    </div>
  );
};
