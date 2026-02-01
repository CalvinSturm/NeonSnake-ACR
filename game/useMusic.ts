
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
      } else {
          // Whenever we are not playing (Paused, Menu, Game Over), stop continuous SFX loops
          audio.stopGameplayLoops();
      }

      if (
          status === GameStatus.IDLE ||
          status === GameStatus.DIFFICULTY_SELECT ||
          status === GameStatus.CHARACTER_SELECT ||
          status === GameStatus.CONFIGURATION ||
          status === GameStatus.READY ||
          status === GameStatus.GAME_OVER
      ) {
          audio.setMode('MENU');
          // Reset threat state so music starts fresh on new game
          currentThreatRef.current = 0;
          lastThreatChangeTimeRef.current = 0;
          audio.setThreat(0);
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
      // Threat builds based on stage progression within 5-stage cycle, maxing at boss
      let rawThreat = 0;
      if (isBoss) {
          rawThreat = 3; // Boss Theme (Max Intensity)
      } else {
          // Build up threat based on stage within 5-stage cycle (0-4)
          const stageInCycle = ((stageRef.current - 1) % 5); // 0, 1, 2, 3, 4
          rawThreat = Math.min(2, Math.floor(stageInCycle / 2)); // 0, 0, 1, 1, 2
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
