
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { audio } from '../utils/audio';

// DEPRECATED: Music logic is now handled directly by the Orchestrator (SnakeGame.tsx)
// This hook remains only to handle dynamic SFX updates like hacking progress if needed, 
// but state changes (Layers/Intro) are forbidden here.
export function useMusic(game: ReturnType<typeof useGameState>) {
  const { terminalsRef } = game;
  
  const updateMusic = useCallback(() => {
      // 1. CALCULATE HACKING PRESSURE (SFX Only)
      let maxProgress = 0;
      for (const t of terminalsRef.current) {
          if (!t.isLocked && t.progress > 0) {
              const p = t.progress / t.totalTime;
              if (p > maxProgress) maxProgress = p;
          }
      }
      audio.setHackProgress(maxProgress);
  }, [terminalsRef]);

  return { updateMusic };
}
