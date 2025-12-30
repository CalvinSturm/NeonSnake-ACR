
import React, { useRef, useState } from 'react';
import { Direction } from '../types';

interface VirtualJoystickProps {
  onDirection: (dir: Direction) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onDirection }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const center = useRef({ x: 0, y: 0 });
  const lastDirection = useRef<Direction | null>(null);

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    center.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    setActive(true);
    // Don't move immediately on start to allow tapping center, 
    // but useful for instant reaction if tap is off-center
    handleMove(clientX, clientY, true); 
  };

  const handleMove = (clientX: number, clientY: number, forceActive = false) => {
    if (!active && !forceActive) return;
    
    const dx = clientX - center.current.x;
    const dy = clientY - center.current.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40; // Joystick radius
    const angle = Math.atan2(dy, dx);
    
    const clampedDist = Math.min(distance, maxDist);
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;
    
    setPosition({ x, y });

    // Threshold for direction trigger
    if (distance > 10) { 
        const deg = angle * (180 / Math.PI);
        let dir: Direction | null = null;

        // 4-Way Direction Logic with 90 degree sectors
        // Right: -45 to 45
        // Down: 45 to 135
        // Left: 135 to 180 or -180 to -135
        // Up: -135 to -45

        if (deg > -45 && deg <= 45) dir = Direction.RIGHT;
        else if (deg > 45 && deg <= 135) dir = Direction.DOWN;
        else if (deg > -135 && deg <= -45) dir = Direction.UP;
        else dir = Direction.LEFT;
        
        if (dir && dir !== lastDirection.current) {
            lastDirection.current = dir;
            onDirection(dir);
            
            // Haptic Feedback if available
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    lastDirection.current = null;
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-32 h-32 bg-gray-900/50 backdrop-blur-md rounded-full border-2 border-cyan-900/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] touch-none select-none"
        onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            handleStart(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
            e.preventDefault();
            handleMove(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
            e.preventDefault();
            handleEnd();
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
            e.preventDefault();
            handleEnd();
        }}
    >
        {/* Decorative Crosshair */}
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-cyan-900/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[1px] h-full bg-cyan-900/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Stick */}
        <div 
            className="absolute w-14 h-14 bg-gradient-to-br from-cyan-600 to-cyan-900 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out z-10"
            style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
            }}
        >
            <div className="absolute top-2 left-3 w-4 h-2 bg-white/20 rounded-full rotate-[-15deg]" />
        </div>
    </div>
  );
};
