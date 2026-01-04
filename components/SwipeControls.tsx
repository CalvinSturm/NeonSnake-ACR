
import React, { useRef, useState, useEffect } from 'react';
import { Direction } from '../types';

interface SwipeControlsProps {
  onDirection: (dir: Direction) => void;
  onBrake?: (active: boolean) => void;
  brakeMode?: 'BUTTON' | 'HOLD';
}

export const SwipeControls: React.FC<SwipeControlsProps> = ({ onDirection, onBrake, brakeMode = 'BUTTON' }) => {
  const startRef = useRef<{x: number, y: number} | null>(null);
  const brakeTimerRef = useRef<number | null>(null);
  const [trail, setTrail] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdPos, setHoldPos] = useState({ x: 0, y: 0 });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (brakeTimerRef.current) clearTimeout(brakeTimerRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only track primary pointer (e.g. first finger)
    if (!e.isPrimary) return;
    
    startRef.current = { x: e.clientX, y: e.clientY };
    setTrail(null);
    
    if (brakeMode === 'HOLD' && onBrake) {
        // Clear any existing timer
        if (brakeTimerRef.current) clearTimeout(brakeTimerRef.current);
        
        // Start delay timer for brake
        // This prevents "Brake" from triggering instantly if the user is just starting a swipe
        brakeTimerRef.current = window.setTimeout(() => {
            setIsHolding(true);
            setHoldPos({ x: e.clientX, y: e.clientY });
            onBrake(true);
            brakeTimerRef.current = null;
        }, 150); // 150ms buffer to detect swipe vs hold
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (brakeMode === 'HOLD') {
          // If we are moving, update the visualizer
          if (isHolding) {
              setHoldPos({ x: e.clientX, y: e.clientY });
          }

          // SWIPE DETECTION CANCELLATION
          // If user moves significantly, they are swiping, not braking.
          if (startRef.current) {
              const dist = Math.hypot(e.clientX - startRef.current.x, e.clientY - startRef.current.y);
              if (dist > 10) {
                  // Movement detected > 10px
                  
                  // 1. Cancel pending brake timer if it hasn't fired yet
                  if (brakeTimerRef.current) {
                      clearTimeout(brakeTimerRef.current);
                      brakeTimerRef.current = null;
                  }

                  // 2. If brake IS active, release it (transition to move)
                  if (isHolding && onBrake) {
                      setIsHolding(false);
                      onBrake(false);
                  }
              }
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!e.isPrimary || !startRef.current) return;
    
    // Clear pending brake timer immediately
    if (brakeTimerRef.current) {
        clearTimeout(brakeTimerRef.current);
        brakeTimerRef.current = null;
    }

    const endX = e.clientX;
    const endY = e.clientY;
    const dx = endX - startRef.current.x;
    const dy = endY - startRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    // Threshold to register as swipe
    if (absDx > 30 || absDy > 30) {
        // Draw trail
        setTrail({ x1: startRef.current.x, y1: startRef.current.y, x2: endX, y2: endY });
        setTimeout(() => setTrail(null), 300);

        if (absDx > absDy) {
            onDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
        } else {
            onDirection(dy > 0 ? Direction.DOWN : Direction.UP);
        }
    }
    
    cleanupHold();
  };

  const cleanupHold = () => {
    startRef.current = null;
    if (brakeTimerRef.current) {
        clearTimeout(brakeTimerRef.current);
        brakeTimerRef.current = null;
    }
    if (brakeMode === 'HOLD' && onBrake) {
        setIsHolding(false);
        onBrake(false);
    }
  };

  return (
    <>
      <div 
        className="absolute inset-0 z-30 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cleanupHold}
        onPointerLeave={cleanupHold}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Swipe Trail */}
      {trail && (
        <svg className="absolute inset-0 z-30 pointer-events-none w-full h-full overflow-visible">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <line 
                x1={trail.x1} y1={trail.y1} 
                x2={trail.x2} y2={trail.y2} 
                stroke="#00ffff" 
                strokeWidth="4" 
                strokeLinecap="round"
                filter="url(#glow)"
                className="animate-[fadeOut_0.3s_ease-out_forwards]"
            />
            <circle cx={trail.x2} cy={trail.y2} r="6" fill="#00ffff" filter="url(#glow)" className="animate-[fadeOut_0.3s_ease-out_forwards]" />
        </svg>
      )}

      {/* Hold Visualizer (Gravity Well) */}
      {isHolding && brakeMode === 'HOLD' && (
          <div 
            className="absolute z-30 pointer-events-none w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center animate-[pulse_1s_infinite]"
            style={{ left: holdPos.x, top: holdPos.y }}
          >
              <div className="w-12 h-12 rounded-full border border-yellow-400 opacity-50"></div>
              <div className="absolute text-[10px] text-yellow-300 font-mono tracking-widest mt-12 bg-black/60 px-2 rounded">BRAKING</div>
          </div>
      )}

      <style>{`
        @keyframes fadeOut {
            from { opacity: 0.8; }
            to { opacity: 0; }
        }
      `}</style>
    </>
  );
};
