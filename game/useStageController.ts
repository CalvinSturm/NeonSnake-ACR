
import { useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useProgression } from './useProgression';
import { useFX } from './useFX';
import { GameStatus, EnemyType, Direction, FoodType } from '../types';
import { DIFFICULTY_CONFIGS, POINTS_PER_STAGE, TRANSITION_DURATION } from '../constants';
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
    setStatus,
    pendingStatusRef,
    transitionStartTimeRef,
    status,
    setResumeCountdown,
    gameTimeRef
  } = game;

  const { unlockNextDifficulty } = progression;

  const cacheBossRef = useCallback(() => {
    bossEnemyRef.current = bossActiveRef.current
      ? enemiesRef.current.find(e => e.type === EnemyType.BOSS) ?? null
      : null;
  }, [bossActiveRef, enemiesRef, bossEnemyRef]);

  const checkStageCompletion = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    if (pendingStatusRef.current !== null) return;
    
    // Check condition based on Stage Type
    const isBossStage = stageRef.current % 4 === 0;

    if (isBossStage) {
        // BOSS STAGE: Must defeat boss to proceed
        if (!bossDefeatedRef.current) return;
    } else {
        // STANDARD STAGE: Score threshold
        if (stageScoreRef.current < POINTS_PER_STAGE) return;
    }

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
    gameTimeRef
  ]);

  const advanceStage = useCallback(() => {
    stageRef.current += 1;
    setUiStage(stageRef.current);

    wallsRef.current = generateWalls(stageRef.current);
    stageScoreRef.current = 0;
    bossDefeatedRef.current = false; // Reset boss flag

    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = [];

    foodRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    terminalsRef.current = [];
    minesRef.current = [];
    digitalRainRef.current = [];

    spawner.spawnFood(FoodType.NORMAL);

    enemySpawnTimerRef.current = 0;
    terminalSpawnTimerRef.current = 0;

    fx.clearTransientFX();

    pendingStatusRef.current = null;
    transitionStartTimeRef.current = 0;

    setStatus(GameStatus.RESUMING);
    setResumeCountdown(3);
  }, [
    stageRef,
    setUiStage,
    wallsRef,
    snakeRef,
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
    bossDefeatedRef
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
