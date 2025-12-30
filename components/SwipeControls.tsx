
import React, { useRef } from 'react';
import { Direction } from '../types';

interface SwipeControlsProps {
  onDirection: (dir: Direction) => void;
}

export const SwipeControls: React.FC<SwipeControlsProps> = ({ onDirection }) => {
  const startRef = useRef<{x: number, y: number} | null>(null);

  const handleStart = (e: React.TouchEvent) => {
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleEnd = (e: React.TouchEvent) => {
    if (!startRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startRef.current.x;
    const dy = endY - startRef.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (Math.abs(dx) > 30) { // Threshold
            onDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
        }
    } else {
        // Vertical
        if (Math.abs(dy) > 30) {
            onDirection(dy > 0 ? Direction.DOWN : Direction.UP);
        }
    }
    startRef.current = null;
  };

  return (
    <div 
      className="fixed inset-0 z-40 touch-none pointer-events-auto"
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    />
  );
};
