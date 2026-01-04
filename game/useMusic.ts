
import { useRef, useCallback, useEffect } from 'react';
import { useGameState } from './useGameState';
import { audio } from '../utils/audio';
import { GameStatus } from '../types';

export function useMusic(game: ReturnType<typeof useGameState>) {
  const { 
    status, 
    stageRef, 
    terminalsRef, 
    bossActiveRef,
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

      // 1. CALCULATE HACKING PRESSURE (SFX Layer)
      let maxProgress = 0;
      for (const t of terminalsRef.current) {
          if (!t.isLocked && t.progress > 0) {
              const p = t.progress / t.totalTime;
              if (p > maxProgress) maxProgress = p;
          }
      }
      audio.setHackProgress(maxProgress);

      // 2. CALCULATE RAW THREAT
      // STABILITY CHANGE: Threat is now strictly determined by Boss presence.
      // We no longer scale based on enemy count to prevent jarring music shifts within a level.
      let rawThreat = 0;
      if (isBoss) {
          rawThreat = 3; // Boss Theme (Max Intensity)
      }

      // 3. APPLY HYSTERESIS (Fast Attack, Slow Decay for Boss Transitions)
      if (rawThreat > currentThreatRef.current) {
          // Escalate immediately
          currentThreatRef.current = rawThreat;
          lastThreatChangeTimeRef.current = now;
          audio.setThreat(rawThreat);
      } else if (rawThreat < currentThreatRef.current) {
          // De-escalate only after delay (3 seconds for smoother flow)
          if (now - lastThreatChangeTimeRef.current > 3000) {
              currentThreatRef.current = rawThreat;
              lastThreatChangeTimeRef.current = now;
              audio.setThreat(rawThreat);
          }
      }

      // 4. CALCULATE STAGE
      // The Audio Controller handles the specific intensity ramp (1-5)
      audio.setStage(stageRef.current);

  }, [status, terminalsRef, bossActiveRef, stageRef, gameTimeRef]);

  return { updateMusic };
}
