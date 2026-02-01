
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audio } from '../utils/audio';

interface BootSequenceProps {
  onComplete: () => void;
}

const LOAD_STEPS = [
    "MOUNTING_VIRTUAL_DRIVE...",
    "VERIFYING_SECURITY_TOKEN...",
    "ESTABLISHING_NEURAL_LINK...",
    "LOADING_ASSETS...",
    "SYNCING_WAVEFORMS...",
    "OPTICAL_RECOGNITION_ONLINE",
    "SYSTEM_READY"
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  
  // Refs for cleanup
  const timeoutsRef = useRef<number[]>([]);
  const frameRef = useRef<number>(0);

  const addTimeout = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timeoutsRef.current.push(id);
      return id;
  };

  const finishBoot = useCallback(() => {
      if (isExiting) return;
      setIsExiting(true);
      audio.play('CLI_BURST'); // Confirmation sound
      
      // Exit Animation Duration
      setTimeout(() => {
          onComplete();
      }, 800);
  }, [isExiting, onComplete]);

  const handleSkip = useCallback(() => {
      if (isExiting) return;
      if (isSkipped) {
          // If already skipped, instant finish
          finishBoot();
          return;
      }
      
      setIsSkipped(true);
      setStepIndex(LOAD_STEPS.length - 1);
      setProgress(100);
      audio.play('UI_HARD_CLICK');
      
      // Allow a brief moment to see "100%" before transitioning
      addTimeout(finishBoot, 600);
  }, [isExiting, isSkipped, finishBoot]);

  // Main Sequence Logic
  useEffect(() => {
    if (isSkipped) return;

    // Simulate loading progress
    let currentProgress = 0;
    const animateProgress = () => {
        if (currentProgress < 100) {
            // Non-linear loading speed
            const increment = Math.random() * 2 + 0.5;
            currentProgress = Math.min(100, currentProgress + increment);
            setProgress(currentProgress);
            
            // Map progress to steps
            const totalSteps = LOAD_STEPS.length;
            const currentStep = Math.floor((currentProgress / 100) * (totalSteps - 1));
            setStepIndex(currentStep);

            if (Math.random() < 0.1) audio.play('MOVE'); // Random ticking sound

            frameRef.current = requestAnimationFrame(animateProgress);
        } else {
            // Done
            setStepIndex(LOAD_STEPS.length - 1);
            addTimeout(finishBoot, 800);
        }
    };

    frameRef.current = requestAnimationFrame(animateProgress);
    audio.play('CLI_POWER'); // Start sound

    return () => {
        cancelAnimationFrame(frameRef.current);
        timeoutsRef.current.forEach(clearTimeout);
    };
  }, [isSkipped, finishBoot]);

  // Keyboard listener for skip
  useEffect(() => {
      const handleKey = () => handleSkip();
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [handleSkip]);

  return (
    <div 
        className="absolute inset-0 bg-[#020202] z-[9999] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        onClick={handleSkip}
    >
        {/* ── BACKGROUND ── */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: `radial-gradient(circle at center, #112233 0%, #000000 70%)`
            }}
        />
        
        {/* ── CONTENT CONTAINER ── */}
        <div 
            className={`
                relative z-10 w-full max-w-lg p-8 flex flex-col gap-6
                transition-all duration-700 ease-in-out
                ${isExiting ? 'scale-150 opacity-0 blur-sm' : 'scale-100 opacity-100'}
            `}
        >
            {/* LOGO GLITCH */}
            <div className="flex flex-col items-center mb-8">
                <div className="text-4xl font-black font-display text-cyan-500 tracking-widest animate-pulse">
                    NEON_SNAKE
                </div>
                <div className="text-[10px] font-mono text-cyan-800 tracking-[1em] mt-2">
                    PROTOCOL INITIALIZATION
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden relative">
                <div 
                    className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_15px_cyan] transition-all duration-75 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* TERMINAL OUTPUT */}
            <div className="h-32 flex flex-col justify-end font-mono text-xs md:text-sm">
                {LOAD_STEPS.map((step, i) => (
                    <div 
                        key={i} 
                        className={`
                            transition-all duration-200
                            ${i === stepIndex ? 'text-white font-bold opacity-100 translate-x-2' : 'text-gray-600 opacity-50 translate-x-0'}
                            ${i > stepIndex ? 'hidden' : 'block'}
                        `}
                    >
                        <span className="mr-2 text-cyan-700">{i === stepIndex ? '>' : '✓'}</span>
                        {step}
                    </div>
                ))}
            </div>

            {/* SKIP HINT */}
            <div className="absolute -bottom-20 left-0 w-full text-center">
                 <span className={`text-[10px] text-gray-700 font-mono tracking-widest transition-opacity duration-500 ${progress < 100 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                     [ PRESS ANY KEY TO ACCELERATE ]
                 </span>
            </div>
        </div>

        {/* ── CRT OVERLAY EFFECTS ── */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
        
        {/* Flash on Exit */}
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-700 ${isExiting ? 'opacity-10' : 'opacity-0'}`} />
    </div>
  );
};
