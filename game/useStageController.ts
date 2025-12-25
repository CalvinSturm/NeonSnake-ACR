
import { useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useProgression } from './useProgression';
import { useFX } from './useFX';
import { GameStatus, EnemyType, Direction, FoodType } from '../types';
import { DIFFICULTY_CONFIGS, POINTS_PER_STAGE, TRANSITION_DURATION, DEFAULT_SETTINGS } from '../constants';
import { generateWalls } from './gameUtils';

export function useStageController(
  game: ReturnType<typeof useGameState>,
  spawner: ReturnType<typeof useSpawner>,
  fx: ReturnType<typeof useFX>,
  progression: ReturnType<typeof useProgression>
) {
  const {
    stageRef,
    stageScoreRef,
    setUiStage,
    wallsRef,
    snakeRef,
    prevTailRef,
    tailIntegrityRef,
    directionRef,
    directionQueueRef,
    foodRef,
    enemiesRef,
    projectilesRef,
    terminalsRef,
    minesRef,
    digitalRainRef,
    bossActiveRef,
    bossEnemyRef,
    bossDefeatedRef,
    difficulty,
    enemySpawnTimerRef,
    terminalSpawnTimerRef,
    bossOverrideTimerRef, // NEW
    setStatus,
    pendingStatusRef,
    transitionStartTimeRef,
    status,
    setResumeCountdown,
    gameTimeRef,
    stageArmedRef,
    stageReadyRef,
    settings,
    statsRef,
    setUiShield
  } = game;

  const { unlockNextDifficulty } = progression;

  const cacheBossRef = useCallback(() => {
    bossEnemyRef.current = bossActiveRef.current
      ? enemiesRef.current.find(e => e.type === EnemyType.BOSS) ?? null
      : null;
  }, [bossActiveRef, enemiesRef, bossEnemyRef]);

  const checkStageCompletion = useCallback(() => {
    // 1. Basic Status Checks
    if (status !== GameStatus.PLAYING) return;
    if (pendingStatusRef.current !== null) return;
    
    // 2. CHECK OBJECTIVES (ARMING PHASE)
    // Only proceed if armed (gameplay active), but do not block XP elsewhere
    if (!stageArmedRef.current) return;

    const isBossStage = stageRef.current % 4 === 0;
    let objectivesMet = false;

    if (isBossStage) {
        if (bossDefeatedRef.current) objectivesMet = true;
    } else {
        if (stageScoreRef.current >= POINTS_PER_STAGE) objectivesMet = true;
    }

    if (objectivesMet) {
        stageReadyRef.current = true;
    }

    // 3. TRANSITION GATES (Must be ready AND clear)
    if (!stageReadyRef.current) return;

    // Gate 1: Clear all enemies
    if (enemiesRef.current.length > 0) return;

    // Gate 2: Collect all XP
    const hasXp = foodRef.current.some(f => f.type === FoodType.XP_ORB);
    if (hasXp) return;

    // Gate 3: Finish active hacks
    const activeHack = terminalsRef.current.some(t => t.progress > 0 && !t.isLocked);
    if (activeHack) return;

    // 4. EXECUTE TRANSITION
    const config = DIFFICULTY_CONFIGS[difficulty];
    if (stageRef.current === config.stageGoal) {
      unlockNextDifficulty();
    }

    // Set timestamp BEFORE state change to prevent render race conditions
    transitionStartTimeRef.current = gameTimeRef.current;
    pendingStatusRef.current = GameStatus.STAGE_TRANSITION;
    setStatus(GameStatus.STAGE_TRANSITION);
  }, [
    status,
    stageRef,
    stageScoreRef,
    bossDefeatedRef,
    difficulty,
    unlockNextDifficulty,
    pendingStatusRef,
    setStatus,
    transitionStartTimeRef,
    gameTimeRef,
    stageArmedRef,
    stageReadyRef,
    enemiesRef,
    foodRef,
    terminalsRef
  ]);

  const advanceStage = useCallback(() => {
    // 🛡️ DEV-ONLY INVARIANT: Stats Reference Integrity
    if (process.env.NODE_ENV !== 'production') {
        if (!statsRef.current || !statsRef.current.activeWeaponIds) {
            console.error("CRITICAL: Stats reference lost or corrupted during stage transition!");
        }
    }

    stageRef.current += 1;
    setUiStage(stageRef.current);

    wallsRef.current = generateWalls(stageRef.current);
    stageScoreRef.current = 0;
    bossDefeatedRef.current = false;

    // SAFE INITIALIZATION
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    prevTailRef.current = { x: 7, y: 10 };
    
    // RESTORE TAIL INTEGRITY
    tailIntegrityRef.current = 100;

    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = [];

    foodRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    terminalsRef.current = [];
    minesRef.current = [];
    digitalRainRef.current = [];

    // 🔒 CLASSIC FOOD SPAWN
    // Spawn exactly 1 initial food item.
    // The spawner system will maintain this count (replenishing when eaten).
    spawner.spawnFood();

    enemySpawnTimerRef.current = 0;
    terminalSpawnTimerRef.current = 0;
    bossOverrideTimerRef.current = 0; // Reset boss timer

    fx.clearTransientFX();

    pendingStatusRef.current = null;
    stageArmedRef.current = false; // Disarm for next stage
    stageReadyRef.current = false; // Reset completion readiness
    transitionStartTimeRef.current = 0;
    
    // 🛡️ REGENERATE SHIELD IF ACQUIRED
    if (statsRef.current.acquiredUpgradeIds.includes('SHIELD')) {
        statsRef.current.shieldActive = true;
        setUiShield(true);
        fx.spawnFloatingText(
            10 * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2, 
            10 * DEFAULT_SETTINGS.gridSize, 
            "SHIELD RESTORED", 
            '#00ffff', 
            16
        );
    }

    if (settings.skipCountdown) {
        setStatus(GameStatus.PLAYING);
        stageArmedRef.current = true;
    } else {
        setStatus(GameStatus.RESUMING);
        setResumeCountdown(3);
    }
  }, [
    stageRef,
    setUiStage,
    wallsRef,
    snakeRef,
    prevTailRef,
    tailIntegrityRef,
    directionRef,
    directionQueueRef,
    foodRef,
    enemiesRef,
    projectilesRef,
    terminalsRef,
    minesRef,
    digitalRainRef,
    spawner,
    fx,
    setStatus,
    pendingStatusRef,
    transitionStartTimeRef,
    setResumeCountdown,
    bossDefeatedRef,
    stageArmedRef,
    stageReadyRef,
    settings.skipCountdown,
    statsRef,
    setUiShield,
    bossOverrideTimerRef
  ]);

  return useMemo(
    () => ({
      checkStageCompletion,
      advanceStage,
      cacheBossRef
    }),
    [checkStageCompletion, advanceStage, cacheBossRef]
  );
}
