
import { useRef, useCallback, useEffect } from 'react';
import { useGameState } from './useGameState';
import { audio } from '../utils/audio';
import { GameStatus } from '../types';

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

  // ── MODE SWITCHING EFFECT ──
  useEffect(() => {
      // Handle Audio Mode based on High Level Game Status
      if (status === GameStatus.PLAYING) {
          audio.setMode('GAME');
      } else if (
          status === GameStatus.IDLE || 
          status === GameStatus.DIFFICULTY_SELECT ||
          status === GameStatus.CHARACTER_SELECT ||
          status === GameStatus.CONFIGURATION ||
          status === GameStatus.READY ||
          status === GameStatus.GAME_OVER
      ) {
          audio.setMode('MENU');
          // Ensure loop is active if we are in a menu state
          audio.startMusic();
      }
  }, [status]);

  // ── UPDATE LOOP (Called by Game Loop) ──
  const updateMusic = useCallback(() => {
      // Dynamic Threat Updates only apply during Gameplay
      if (status !== GameStatus.PLAYING) return;

      const now = gameTimeRef.current;
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

      // 2. CALCULATE RAW THREAT
      // Normalized to Level 2 (High/Full Mix) to provide a consistent musical experience
      // regardless of enemy count, preventing jarring transitions during gameplay.
      let rawThreat = 2; 

      if (isBoss) {
          rawThreat = 3; // Boss Theme (Max Intensity)
      }

      // 3. APPLY HYSTERESIS (Fast Attack, Slow Decay)
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

  }, [status, terminalsRef, bossActiveRef, stageRef, gameTimeRef]);

  return { updateMusic };
}
