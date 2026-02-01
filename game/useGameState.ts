
import { useCallback, useEffect } from 'react';
import { CharacterProfile, CameraMode } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// Sub-hooks (The Split)
import { useSessionState } from './state/useSessionState';
import { usePlayerState } from './state/usePlayerState';
import { useEntityState } from './state/useEntityState';
import { useCameraState } from './state/useCameraState';
import { useUIState } from './state/useUIState';
import { useWeaponTimers } from './state/useWeaponTimers';
import { useCosmeticState } from './state/useCosmeticState';

// Re-export types for consumers
export * from './state/useSessionState';
export * from './state/useUIState';

// Main Facade Hook
export function useGameState() {
  
  // 1. Initialize all sub-hooks
  const session = useSessionState();
  const player = usePlayerState();
  const entities = useEntityState();
  const camera = useCameraState();
  const ui = useUIState();
  const weapons = useWeaponTimers();
  const cosmetics = useCosmeticState();

  // 2. Glue Logic: Cross-Cutting Concerns

  /**
   * Sync UI stats requires access to Player traits/stats
   * We wrap it here to maintain the API signature () => void
   */
  const syncUiStats = useCallback(() => {
     ui.syncUiStats(player.statsRef.current, player.tailIntegrityRef.current);
  }, [ui.syncUiStats, player.statsRef, player.tailIntegrityRef]);

  // Sync initial stats on mount or char change
  useEffect(() => {
      syncUiStats();
  }, [syncUiStats, session.selectedChar]);

  /**
   * Reset Game: Orchestrates resetting all sub-systems
   */
  const resetGame = useCallback((charProfile: CharacterProfile) => {
    // 1. Session & Meta
    session.runIdRef.current += 1;
    session.setModalState('NONE');
    
    // 2. Player (Needs start position)
    const startX = 10;
    const startY = 10;
    player.resetPlayer(charProfile, startX, startY);

    // 3. Entities & Physics
    entities.resetEntities();

    // 4. Camera & Floor
    camera.resetCamera(startX, startY, ui.viewport.rows);
    // Add default camera intent to ensure we start correctly
    camera.cameraIntentsRef.current = [];

    // 5. UI & Score
    const initialShield = !!player.statsRef.current.shieldActive;
    ui.resetUI(initialShield);
    
    // 6. Timers
    weapons.resetWeaponTimers(player.statsRef.current.weapon.mineDropRate || 0);

    // 7. Cosmetics (Session unlocks)
    cosmetics.resetSessionUnlocks();
    
    // 8. Final Sync
    syncUiStats();
    
    // 9. Reset specific session trackers
    session.startTimeRef.current = Date.now();
    session.debugFlagsRef.current = { godMode: false, showHitboxes: false, showPathing: false, disableSpawning: false };

    // 10. Reset score & progression refs
    session.scoreRef.current = 0;
    session.stageScoreRef.current = 0;
    session.lastEatTimeRef.current = 0;
    session.pendingStatusRef.current = null;
    session.maxComboRef.current = 0;
    session.enemiesKilledRef.current = 0;
    session.terminalsHackedRef.current = 0;
    session.failureMessageRef.current = '';
    session.deathTimerRef.current = 0;
    session.transitionStartTimeRef.current = 0;
    session.bossOverrideTimerRef.current = 0;
    session.stageRef.current = 1;
    session.stageArmedRef.current = false;
    session.stageReadyRef.current = false;
    session.stageReadyTimeRef.current = 0;
    session.gameTimeRef.current = 0;

  }, [
    session.runIdRef, session.setModalState, session.startTimeRef, session.debugFlagsRef,
    session.scoreRef, session.stageScoreRef, session.lastEatTimeRef, session.pendingStatusRef,
    session.maxComboRef, session.enemiesKilledRef, session.terminalsHackedRef, session.failureMessageRef,
    session.deathTimerRef, session.transitionStartTimeRef, session.bossOverrideTimerRef,
    session.stageRef, session.stageArmedRef, session.stageReadyRef,
    session.stageReadyTimeRef, session.gameTimeRef,
    player.resetPlayer, player.statsRef,
    entities.resetEntities,
    camera.resetCamera, camera.cameraIntentsRef,
    ui.resetUI, ui.viewport.rows,
    weapons.resetWeaponTimers,
    cosmetics.resetSessionUnlocks,
    syncUiStats
  ]);


  // 3. Facade Return (Merging all APIs)
  return {
    // Session
    ...session,
    
    // Player
    ...player,
    
    // Entities
    ...entities,
    
    // Camera
    ...camera,
    
    // UI
    ...ui,
    
    // Weapons
    ...weapons,
    
    // Cosmetics
    ...cosmetics,

    // Overrides / Glue
    resetGame,
    syncUiStats 
  };
}
