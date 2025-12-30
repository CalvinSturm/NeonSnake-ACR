
import React, { useEffect, useState, useRef } from 'react';
import { audio } from '../utils/audio';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 
  // 0: Black, 1: Cursor, 2: Typing, 3: Output, 4: Glitch
  
  const [typedText, setTypedText] = useState('');
  const [memoryStatus, setMemoryStatus] = useState('OFFLINE');
  const [showExtra, setShowExtra] = useState(false);
  
  const COMMAND = 'acr_boot --target=NEON_SNAKE --mode=containment';
  
  // Rare variant check
  useEffect(() => {
      if (Math.random() < 0.02) setShowExtra(true);
  }, []);

  useEffect(() => {
    // TIMELINE ORCHESTRATION
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };

    // PHASE 0: BLACK (0ms - 600ms)
    // PHASE 1: CURSOR WAKE (600ms)
    schedule(() => {
        setPhase(1);
        audio.play('CLI_POWER');
    }, 600);

    // PHASE 2: TYPING (1000ms - 1800ms)
    schedule(() => {
        setPhase(2);
        audio.play('CLI_BURST');
    }, 1000);

    // PHASE 3: OUTPUT (2000ms)
    schedule(() => {
        setPhase(3);
        audio.play('MOVE'); // Soft tick for pending line
    }, 2000);

    // PHASE 4: GLITCH (3000ms)
    schedule(() => {
        setPhase(4);
        setMemoryStatus('DEFERRED'); // The Lore Seed
        // Glitch sound if we want, but spec says "no sound per line... Silence implies success" for the final output.
        // However, the glitch event is visually jarring. Let's keep it silent as per spec "Silence implies success"
        // actually refers to CLI output resolution. 
        // But for the GLITCH event itself? 
        // Spec for BootSequence doesn't explicitly demand a glitch sound here, only for the "First Initialize" click.
        // "Audio hooks required (silence is better)" for this boot sequence.
    }, 3000);

    // PHASE 5: CUT (3800ms)
    schedule(() => {
        onComplete();
    }, 3800);

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  // TYPING EFFECT
  useEffect(() => {
      if (phase === 2) {
          let i = 0;
          const interval = setInterval(() => {
              i++;
              setTypedText(COMMAND.slice(0, i));
              if (i >= COMMAND.length) clearInterval(interval);
          }, 20); // Machine speed typing
          return () => clearInterval(interval);
      }
  }, [phase]);

  if (phase === 0) {
      return <div className="fixed inset-0 bg-[#020202] z-[9999] cursor-none" />;
  }

  return (
    <div className="fixed inset-0 bg-[#080808] z-[9999] flex flex-col p-8 md:p-16 font-mono text-sm md:text-base leading-relaxed text-gray-400 select-none cursor-none overflow-hidden">
      
      {/* ── CRT FLICKER OVERLAY ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

      {/* ── TERMINAL CONTENT ── */}
      <div className="relative z-10 max-w-3xl">
          
          {/* INPUT LINE */}
          <div className="flex items-center gap-3 mb-6">
              <span className="text-gray-600">{'>'}</span>
              <span className="text-gray-300">{typedText}</span>
              {phase < 3 && (
                  <span className="w-2.5 h-5 bg-gray-500 animate-[pulse_1s_steps(2)_infinite]"></span>
              )}
          </div>

          {/* RESPONSE BLOCK */}
          {phase >= 3 && (
              <div className="flex flex-col gap-1 text-xs md:text-sm tracking-wide">
                  <div className="text-gray-500">INITIALIZING ADAPTIVE CONTAINMENT ROUTINE...</div>
                  
                  <div className="flex gap-4">
                      <span className="w-48 text-gray-600">SECURITY CONTEXT</span>
                      <span className="text-green-900 font-bold">VERIFIED</span>
                  </div>

                  <div className="flex gap-4">
                      <span className="w-48 text-gray-600">MEMORY SUBSYSTEM</span>
                      <span className={`
                          font-bold transition-colors duration-100
                          ${phase === 4 ? 'text-yellow-600 glitch-minor' : 'text-red-900'}
                      `}>
                          {memoryStatus}
                      </span>
                  </div>

                  <div className="flex gap-4">
                      <span className="w-48 text-gray-600">HANDOFF</span>
                      <span className="text-gray-500 animate-pulse">PENDING...</span>
                  </div>

                  {showExtra && (
                      <div className="flex gap-4 mt-4 opacity-50">
                          <span className="w-48 text-red-900">OPERATOR ID</span>
                          <span className="text-red-900">UNKNOWN</span>
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* ── VERSION FOOTER ── */}
      <div className="absolute bottom-8 left-8 text-[10px] text-[#1a1a1a]">
          ACR_KERNEL v0.9.4
      </div>
    </div>
  );
};
