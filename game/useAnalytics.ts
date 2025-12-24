
import { useCallback } from 'react';
import { useGameState } from './useGameState';

export function useAnalytics(game: ReturnType<typeof useGameState>) {
  const { 
    enemiesKilledRef, terminalsHackedRef, startTimeRef 
  } = game;

  const recordKill = useCallback(() => {
    enemiesKilledRef.current += 1;
  }, [enemiesKilledRef]);

  const recordTerminalHack = useCallback(() => {
    terminalsHackedRef.current += 1;
  }, [terminalsHackedRef]);

  return { recordKill, recordTerminalHack };
}
