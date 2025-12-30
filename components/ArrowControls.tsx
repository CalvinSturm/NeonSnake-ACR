
import React from 'react';
import { Direction } from '../types';

interface ArrowControlsProps {
  onDirection: (dir: Direction) => void;
}

export const ArrowControls: React.FC<ArrowControlsProps> = ({ onDirection }) => {
  const btnClass = "w-14 h-14 bg-gray-900/50 backdrop-blur border border-cyan-900/50 rounded flex items-center justify-center active:bg-cyan-800/50 active:border-cyan-500 touch-none select-none text-cyan-400 text-2xl font-bold transition-colors";

  return (
    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
      <div />
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirection(Direction.UP); }}>▲</button>
      <div />
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirection(Direction.LEFT); }}>◀</button>
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirection(Direction.DOWN); }}>▼</button>
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirection(Direction.RIGHT); }}>▶</button>
    </div>
  );
};
