
import React, { useEffect, useState } from 'react';
import { Difficulty } from '../../types';
import { CONFIGURATION_PRESETS } from './configurationPresets';
import { audio } from '../../utils/audio';

interface ModelConfigurationPassProps {
  difficultyId: Difficulty;
  onComplete: () => void;
}

export const ModelConfigurationPass: React.FC<ModelConfigurationPassProps> = ({ difficultyId, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const preset = CONFIGURATION_PRESETS[difficultyId] || CONFIGURATION_PRESETS['EASY'];

  useEffect(() => {
    // ACCELERATED TIMELINE
    // Phase 0: "CONFIGURATION SELECTED" (0ms)
    // Phase 1: Parameter List (100ms)
    // Phase 2: Validating (600ms)
    // Phase 3: Active (600ms + validationMs)
    // Complete: (Phase 3 + 300ms)

    const t1 = setTimeout(() => {
      setPhase(1);
      audio.play('CLI_BURST');
    }, 100);

    const t2 = setTimeout(() => {
      setPhase(2);
      audio.play('MOVE');
    }, 600);

    const t3 = setTimeout(() => {
      setPhase(3);
      audio.play('UI_HARD_CLICK');
    }, 600 + preset.validationMs);

    const t4 = setTimeout(() => {
        onComplete();
    }, 600 + preset.validationMs + 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [preset, onComplete]);

  return (
    <div className="absolute inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center font-mono text-xs md:text-sm text-gray-400 select-none cursor-wait overflow-hidden pointer-events-auto">
        {/* Static Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

        {phase === 0 && (
            <div className="tracking-widest animate-pulse text-gray-500">CONFIGURATION SELECTED</div>
        )}

        {phase >= 1 && phase < 3 && (
            <div className="w-full max-w-md p-8 border-l-2 border-gray-800 bg-black/50 backdrop-blur-sm relative z-10">
                <div className="text-cyan-600 font-bold mb-4 tracking-widest">MODEL: {preset.modelName}</div>
                <div className="space-y-2">
                    {preset.parameters.map((p, i) => (
                        <div key={i} className="flex gap-4 opacity-0 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}>
                            <span className="text-gray-600">-</span>
                            <span className="text-gray-300">{p}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {phase === 2 && (
            <div className="mt-8 w-64 relative z-10">
                <div className="flex justify-between text-[10px] text-gray-600 mb-1 uppercase tracking-wider">
                    <span>Validating</span>
                    <span className="animate-pulse">...</span>
                </div>
                <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500 animate-[progress_1s_ease-out_forwards]" style={{ animationDuration: `${preset.validationMs}ms` }}></div>
                </div>
            </div>
        )}

        {phase === 3 && (
            <div className="text-green-500 font-bold tracking-[0.2em] border border-green-900/50 px-6 py-2 bg-green-950/20 relative z-10">
                MODEL ACTIVE
            </div>
        )}
        
        {/* CSS for custom progress animation */}
        <style>{`
            @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        `}</style>
    </div>
  );
};
