
import { useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useProgression } from './useProgression';
import { useFX } from './useFX';
import { GameStatus, EnemyType, Direction, CameraMode } from '../types';
import {
  DIFFICULTY_CONFIGS,
  POINTS_PER_STAGE,
  TRANSITION_DURATION,
  STAMINA_CONFIG
} from '../constants';
import { generateWalls } from './gameUtils';
import { audio } from '../utils/audio';

const READY_MIN_TIME = 2000; // ms (2 Seconds of "CLEARING")

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
    stageReadyTimeRef, // Use from game state
    settings,
    statsRef,
    setUiShield,
    setUiStageStatus,
    requestCameraSwitch,
    addNeonFragments, // Currency
    audioEventsRef,
    viewport, // NEW: Viewport Access
    // Brake/Stamina state (reset on stage advance)
    isStoppedRef,
    stopIntentRef,
    staminaRef,
    stopCooldownRef
  } = game;

  const { unlockNextDifficulty } = progression;

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

    setUiStageStatus('IN PROGRESS');

    wallsRef.current = generateWalls(stageRef.current, viewport.cols, viewport.rows);
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

    // Reset brake/stamina state to prevent stuck braking on new stage
    isStoppedRef.current = false;
    stopIntentRef.current = false;
    stopCooldownRef.current = false;
    staminaRef.current = STAMINA_CONFIG.MAX;
    audio.setStopEffect(false); // Stop brake audio

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
      // Changed from RESUMING to READY for manual start press
      setStatus(GameStatus.READY);
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
    stageReadyTimeRef,
    settings.skipCountdown,
    statsRef,
    setUiShield,
    bossOverrideTimerRef,
    setUiStageStatus,
    requestCameraSwitch,
    viewport,
    isStoppedRef,
    stopIntentRef,
    staminaRef,
    stopCooldownRef
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
      setUiStageStatus('EXIT OPEN >>');
      
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

      // Clear enemies for exit run
      const activeEnemies = enemiesRef.current.filter(e => !e.shouldRemove);
      const activeTerminals = terminalsRef.current.filter(t => !t.shouldRemove);
      
      activeEnemies.forEach(e => {
        e.shouldRemove = true;
        fx.createParticles(e.x, e.y, '#ffffff', 8);
      });
      activeTerminals.forEach(t => {
        t.shouldRemove = true;
        fx.createParticles(t.x, t.y, '#00ffff', 5);
      });
      audio.play('COMPRESS');

      return;
    }

    if (!stageReadyRef.current) return;

    // ── EXIT CONDITION: SNAKE LEFT SCREEN OR TIMEOUT
    const head = snakeRef.current[0];
    const hasExited = head.x > viewport.cols + 2;
    const timeSinceReady = gameTimeRef.current - stageReadyTimeRef.current;
    
    // Fallback: If player somehow stuck for 8 seconds, force transition
    if (hasExited || timeSinceReady > 8000) {
        const config = DIFFICULTY_CONFIGS[difficulty];
        if (stageRef.current === config.stageGoal) {
          unlockNextDifficulty();
        }

        // ── ENTER TRANSITION
        pendingStatusRef.current = GameStatus.STAGE_TRANSITION;
        transitionStartTimeRef.current = gameTimeRef.current;
        setStatus(GameStatus.STAGE_TRANSITION);
    }

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
    stageReadyTimeRef,
    enemiesRef,
    terminalsRef,
    gameTimeRef,
    setUiStageStatus,
    addNeonFragments,
    fx,
    snakeRef,
    audioEventsRef,
    viewport
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
