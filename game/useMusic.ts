
import { useRef, useCallback } from 'react';
import { useGameState } from './useGameState';
import { GameStatus } from '../types';
import { audio } from './audio';

export function useMusic(game: ReturnType<typeof useGameState>) {
  const { 
    status, 
    stageRef, 
    terminalsRef, 
    enemiesRef, 
    bossActiveRef,
    uiCombo,
    gameTimeRef
  } = game;
  
  // ── HYSTERESIS STATE ──
  const currentThreatRef = useRef(0);
  const lastThreatChangeTimeRef = useRef(0);

  // ── UPDATE LOOP (Called by Game Loop) ──
  const updateMusic = useCallback(() => {
      if (status !== GameStatus.PLAYING) return;

      // GUARD: Ensure the audio engine knows we are in GAME mode.
      // This safeguards against cases where the initial state transition 
      // might have been missed or overwritten (e.g. fast restarts).
      audio.setMode('GAME');

      const now = gameTimeRef.current;
      const enemyCount = enemiesRef.current.length;
      const isBoss = bossActiveRef.current;

      // 1. CALCULATE HACKING PRESSURE
      let maxProgress = 0;
      for (const t of terminalsRef.current) {
          if (!t.isLocked && t.progress > 0) {
              const p = t.progress / t.totalTime;
              if (p > maxProgress) maxProgress = p;
          }
      }
      audio.setHackProgress(maxProgress);

      // 2. CALCULATE RAW THREAT (0-3)
      let rawThreat = 0;
      if (isBoss) {
          rawThreat = 3; // EXPERT
      } else if (enemyCount >= 6 || uiCombo >= 5) {
          rawThreat = 3; // EXPERT
      } else if (enemyCount >= 4 || uiCombo >= 3) {
          rawThreat = 2; // HARD
      } else if (enemyCount >= 2) {
          rawThreat = 1; // MEDIUM
      } else {
          rawThreat = 0; // LOW
      }

      // 3. APPLY HYSTERESIS (Fast Attack, Slow Decay)
      // Prevents music from flipping constantly when enemies spawn/die rapidly
      if (rawThreat > currentThreatRef.current) {
          // Escalate immediately
          currentThreatRef.current = rawThreat;
          lastThreatChangeTimeRef.current = now;
          audio.setThreat(rawThreat);
      } else if (rawThreat < currentThreatRef.current) {
          // De-escalate only after delay (2 seconds)
          if (now - lastThreatChangeTimeRef.current > 2000) {
              currentThreatRef.current = rawThreat;
              lastThreatChangeTimeRef.current = now;
              audio.setThreat(rawThreat);
          }
      }

      // 4. CALCULATE STAGE (0-3)
      const normalizedStage = Math.max(0, (stageRef.current - 1) % 4);
      audio.setStage(normalizedStage);

  }, [status, terminalsRef, enemiesRef, bossActiveRef, uiCombo, stageRef, gameTimeRef]);

  return { updateMusic };
}

