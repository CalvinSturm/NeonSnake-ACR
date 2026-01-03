
import { useCallback, useMemo, useRef } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useProgression } from './useProgression';
import { useFX } from './useFX';
import { GameStatus, EnemyType, Direction, CameraMode } from '../types';
import {
  DIFFICULTY_CONFIGS,
  POINTS_PER_STAGE,
  TRANSITION_DURATION
} from '../constants';
import { generateWalls } from './gameUtils';
import { audio } from '../utils/audio';

const READY_MIN_TIME = 1.0; // seconds (simulation time)

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
    bossOverrideTimerRef,
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
    setUiShield,
    setUiStageStatus,
    requestCameraSwitch,
    addNeonFragments, // Currency
    audioEventsRef
  } = game;

  const { unlockNextDifficulty } = progression;

  const lastStageStatusStrRef = useRef('IN PROGRESS');
  const stageReadyTimeRef = useRef(0);

  // ─────────────────────────────────────────────
  // BOSS CACHE
  // ─────────────────────────────────────────────
  const cacheBossRef = useCallback(() => {
    bossEnemyRef.current = bossActiveRef.current
      ? enemiesRef.current.find(e => e.type === EnemyType.BOSS) ?? null
      : null;
  }, [bossActiveRef, enemiesRef, bossEnemyRef]);

  // ─────────────────────────────────────────────
  // STAGE ADVANCE (AUTHORITATIVE RESET)
  // ─────────────────────────────────────────────
  const advanceStage = useCallback(() => {
    console.log('[STAGE][ADVANCE]', {
      from: stageRef.current,
      to: stageRef.current + 1
    });

    stageRef.current += 1;
    setUiStage(stageRef.current);

    // ── CAMERA MODE LOGIC ──
    // FIXED: Enforce TOP_DOWN for standard progression (Stages 1-12)
    // Removed Side Scroll switching ("Bounce")
    requestCameraSwitch(CameraMode.TOP_DOWN, 1000);

    lastStageStatusStrRef.current = 'IN PROGRESS';
    setUiStageStatus('IN PROGRESS');

    wallsRef.current = generateWalls(stageRef.current);
    stageScoreRef.current = 0;
    bossDefeatedRef.current = false;

    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    prevTailRef.current = { x: 7, y: 10 };
    tailIntegrityRef.current = 100;

    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = [];

    foodRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    terminalsRef.current = [];
    minesRef.current = [];
    digitalRainRef.current = [];

    spawner.spawnFood();

    enemySpawnTimerRef.current = 0;
    terminalSpawnTimerRef.current = 0;
    bossOverrideTimerRef.current = 0;

    fx.clearTransientFX();

    pendingStatusRef.current = null;
    stageArmedRef.current = false;
    stageReadyRef.current = false;
    stageReadyTimeRef.current = 0;
    transitionStartTimeRef.current = 0;

    if (statsRef.current.acquiredUpgradeIds.includes('SHIELD')) {
      statsRef.current.shieldActive = true;
      setUiShield(true);
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
    bossOverrideTimerRef,
    setUiStageStatus,
    requestCameraSwitch
  ]);

  // ─────────────────────────────────────────────
  // TRANSITION HANDLER (ABSOLUTE TIME)
  // ─────────────────────────────────────────────
  const handleTransition = useCallback(() => {
    if (status !== GameStatus.STAGE_TRANSITION) return;

    const elapsed =
      gameTimeRef.current - transitionStartTimeRef.current;

    if (elapsed < TRANSITION_DURATION) return;

    transitionStartTimeRef.current = 0;
    advanceStage();
  }, [
    status,
    gameTimeRef,
    transitionStartTimeRef,
    advanceStage
  ]);

  // ─────────────────────────────────────────────
  // STAGE COMPLETION LOGIC (SOLE AUTHORITY)
  // ─────────────────────────────────────────────
  const checkStageCompletion = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    if (pendingStatusRef.current !== null) return;
    if (!stageArmedRef.current) return;

    const isBossStage = stageRef.current % 5 === 0; // Fixed: Matches useSpawner's 5-stage interval
    const objectivesMet = isBossStage
      ? bossDefeatedRef.current
      : stageScoreRef.current >= POINTS_PER_STAGE;

    // ── ARM READY STATE (ONCE)
    if (objectivesMet && !stageReadyRef.current) {
      stageReadyRef.current = true;
      stageReadyTimeRef.current = gameTimeRef.current;
      setUiStageStatus('CLEARING');
      
      // AWARD CURRENCY
      const reward = isBossStage ? 200 : 50;
      addNeonFragments(reward);
      fx.spawnFloatingText(
          snakeRef.current[0].x * 20, 
          snakeRef.current[0].y * 20, 
          `+${reward} NF`, 
          '#00ffff', 
          20
      );
      audioEventsRef.current.push({ type: 'BONUS' });

      return;
    }

    if (!stageReadyRef.current) return;

    // ── MIN READY TIME
    if (
      gameTimeRef.current - stageReadyTimeRef.current <
      READY_MIN_TIME
    ) {
      return;
    }

    const activeEnemies = enemiesRef.current.filter(e => !e.shouldRemove);
    const activeTerminals = terminalsRef.current.filter(t => !t.shouldRemove);

    if (activeEnemies.length || activeTerminals.length) return;

    const config = DIFFICULTY_CONFIGS[difficulty];
    if (stageRef.current === config.stageGoal) {
      unlockNextDifficulty();
    }

    // ── ENTER TRANSITION (ONCE)
    pendingStatusRef.current = GameStatus.STAGE_TRANSITION;
    transitionStartTimeRef.current = gameTimeRef.current;
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
    stageArmedRef,
    stageReadyRef,
    enemiesRef,
    terminalsRef,
    gameTimeRef,
    setUiStageStatus,
    addNeonFragments,
    fx,
    snakeRef,
    audioEventsRef
  ]);

  return useMemo(
    () => ({
      checkStageCompletion,
      advanceStage,
      handleTransition,
      cacheBossRef
    }),
    [checkStageCompletion, advanceStage, handleTransition, cacheBossRef]
  );
}
