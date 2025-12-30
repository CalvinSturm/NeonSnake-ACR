
import { useCallback, useMemo, useRef } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useProgression } from './useProgression';
import { useFX } from './useFX';
import { GameStatus, EnemyType, Direction, CameraMode } from '../types';
import {
  DIFFICULTY_CONFIGS,
  POINTS_PER_STAGE,
  TRANSITION_DURATION,
  GRID_COLS
} from '../constants';
import { generateWalls } from './gameUtils';
import { CameraBehavior } from './camera/types';
import { SPACESHIP_BOSS_CONFIG } from './boss/definitions/SpaceshipBoss';
import { ENEMY_PHYSICS_DEFAULTS } from '../constants';

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
    cameraRef,
    devHelper,
    stageStatsRef,
    masteryRef
  } = game;

  const { unlockNextDifficulty } = progression;

  const lastStageStatusStrRef = useRef('IN PROGRESS');
  const stageReadyTimeRef = useRef(0);
  const stageAdvanceRequestedRef = useRef(false);
  const lastTransitionRequestTimeRef = useRef(0); // Debounce
  const barrierBrokenRef = useRef(false); // Track if barrier break event fired

  // ─────────────────────────────────────────────
  // BOSS CACHE
  // ─────────────────────────────────────────────
  const cacheBossRef = useCallback(() => {
    bossEnemyRef.current = bossActiveRef.current
      ? enemiesRef.current.find(e => e.type === EnemyType.BOSS) ?? null
      : null;
  }, [bossActiveRef, enemiesRef, bossEnemyRef]);

  // ─────────────────────────────────────────────
  // STAGE RESET (Executed by Orchestrator)
  // ─────────────────────────────────────────────
  const resetForNewStage = useCallback((newStageIndex: number) => {
    console.log('[STAGE][RESET]', newStageIndex);

    setUiStage(newStageIndex);
    
    // RESET ADAPTIVE METRICS
    stageStatsRef.current = { damageTaken: 0, startTime: gameTimeRef.current };
    
    // ── CAMERA MODE LOGIC ──
    // FIXED: Enforce TOP_DOWN for standard progression (Stages 1-12)
    requestCameraSwitch(CameraMode.TOP_DOWN, 1000);

    lastStageStatusStrRef.current = 'IN PROGRESS';
    setUiStageStatus('IN PROGRESS');

    // ── WALL GENERATION (Adaptive Stage 2) ──
    if (newStageIndex === 2) {
        if (masteryRef.current) {
            wallsRef.current = generateWalls(newStageIndex);
        } else {
            wallsRef.current = []; // Remedial Stage 2
        }
    } else {
        wallsRef.current = generateWalls(newStageIndex);
    }
    
    // Reset Mastery for current stage tracking
    masteryRef.current = false;

    stageScoreRef.current = 0;
    bossDefeatedRef.current = false;
    barrierBrokenRef.current = false;

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
    
    // FIX: Set transition time to current time to prevent 'checkTransition' 
    // from immediately re-triggering if multiple updates occur in one frame loop.
    transitionStartTimeRef.current = gameTimeRef.current;
    
    stageAdvanceRequestedRef.current = false;

    if (statsRef.current.acquiredUpgradeIds.includes('SHIELD')) {
      statsRef.current.shieldActive = true;
      setUiShield(true);
    }

    // ─── STAGE 5 SPECIFIC SETUP ───
    if (newStageIndex === 5) {
        setupStage5();
    }

    if (settings.skipCountdown) {
      setStatus(GameStatus.PLAYING);
      stageArmedRef.current = true;
    } else {
      setStatus(GameStatus.RESUMING);
      setResumeCountdown(3);
    }
  }, [
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
    requestCameraSwitch,
    stageStatsRef,
    masteryRef,
    gameTimeRef
  ]);

  const setupStage5 = () => {
      // 1. Clear Walls
      wallsRef.current = [];

      // 2. Spawn Barrier (Centered, blocking)
      const barrierX = 20; // Grid column
      enemiesRef.current.push({
          id: 'BARRIER_GATE',
          type: EnemyType.BARRIER,
          x: barrierX,
          y: 15, // Centered Y
          hp: 2000,
          maxHp: 2000,
          state: 'ACTIVE',
          spawnTime: 0,
          flash: 0,
          vy: 0, isGrounded: false, physicsProfile: ENEMY_PHYSICS_DEFAULTS[EnemyType.BOSS],
          jumpCooldownTimer: 0, jumpIntent: false
      });

      // 3. Spawn Spaceship Boss (Behind barrier)
      const bossX = 28;
      enemiesRef.current.push({
          id: 'BOSS_SPACESHIP',
          type: EnemyType.BOSS,
          x: bossX,
          y: 15,
          hp: 10000, // Effectively invincible until sequence end
          maxHp: 10000,
          state: 'ACTIVE',
          spawnTime: 0,
          flash: 0,
          bossConfigId: 'SPACESHIP_BOSS',
          bossState: { stateId: 'IDLE', timer: 0, phaseIndex: 0 },
          bossPhase: 1,
          vy: 0, isGrounded: false, physicsProfile: ENEMY_PHYSICS_DEFAULTS[EnemyType.BOSS],
          jumpCooldownTimer: 0, jumpIntent: false,
          facing: -1 // Face Left
      });

      bossActiveRef.current = true;
      setUiStageStatus('ENGAGE');
      
      // Lock Camera to Arena
      devHelper.queueDevIntent({ 
          type: 'DEV_SET_ZOOM', 
          zoom: 1.0 
      });
      // Ensure behavior is FIXED or FOLLOW_PLAYER clamped
      cameraRef.current.behavior = CameraBehavior.FOLLOW_PLAYER;
  };

  // ─────────────────────────────────────────────
  // TRANSITION HANDLER (ABSOLUTE TIME)
  // ─────────────────────────────────────────────
  const checkTransition = useCallback(() => {
    if (status !== GameStatus.STAGE_TRANSITION) return;

    // DEBOUNCE: Prevent multiple transition requests in short succession
    // This fixes the "Stage 4 -> 7" jump bug where update loops might re-trigger 
    // before state is fully settled.
    if (gameTimeRef.current - lastTransitionRequestTimeRef.current < 2000) return;

    const elapsed =
      gameTimeRef.current - transitionStartTimeRef.current;

    if (elapsed < TRANSITION_DURATION) return;
    
    // Emit Intent: Request Advance
    stageAdvanceRequestedRef.current = true;
    lastTransitionRequestTimeRef.current = gameTimeRef.current;
  }, [
    status,
    gameTimeRef,
    transitionStartTimeRef
  ]);

  // ─────────────────────────────────────────────
  // STAGE COMPLETION LOGIC
  // ─────────────────────────────────────────────
  const checkStageCompletion = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    
    // ─── STAGE 5 SPECIAL LOGIC: BARRIER BREAK ───
    if (stageRef.current === 5 && !barrierBrokenRef.current) {
        const barrier = enemiesRef.current.find(e => e.type === EnemyType.BARRIER);
        if (!barrier) {
            barrierBrokenRef.current = true;
            setUiStageStatus('SCROLL_INIT');
            fx.triggerShake(30, 30);
            fx.spawnFloatingText(20 * 20, 15 * 20, "BARRIER BREACHED", '#00ffff', 30);
            
            devHelper.queueDevIntent({ type: 'DEV_SET_SCROLL_SPEED', speed: 80 }); // 80px/s
            cameraRef.current.behavior = CameraBehavior.AUTO_SCROLL_X;
        }
    }

    if (pendingStatusRef.current !== null) return;
    if (!stageArmedRef.current) return;

    const isBossStage = stageRef.current % 5 === 0;
    
    let objectivesMet = false;

    // ─── ADAPTIVE LOGIC (Stage 1) ───
    if (stageRef.current === 1) {
        const timeElapsedSec = (gameTimeRef.current - stageStatsRef.current.startTime) / 1000;
        const damage = stageStatsRef.current.damageTaken;
        const score = stageScoreRef.current;

        if (timeElapsedSec > 30 && score >= 300 && damage === 0) {
            objectivesMet = true;
            masteryRef.current = true;
            console.log('[STAGE 1] Mastery Exit Triggered');
        }
        else if (timeElapsedSec > 120) {
            objectivesMet = true;
            masteryRef.current = false;
        }
        else if (score >= POINTS_PER_STAGE) {
             objectivesMet = true;
             masteryRef.current = damage === 0 && timeElapsedSec < 90;
        }
    } else {
        objectivesMet = isBossStage
          ? bossDefeatedRef.current
          : stageScoreRef.current >= POINTS_PER_STAGE;
    }

    // ── ARM READY STATE (ONCE)
    if (objectivesMet && !stageReadyRef.current) {
      stageReadyRef.current = true;
      stageReadyTimeRef.current = gameTimeRef.current;
      setUiStageStatus('CLEARING');
      
      if (cameraRef.current.behavior === CameraBehavior.AUTO_SCROLL_X) {
          cameraRef.current.behavior = CameraBehavior.FOLLOW_PLAYER;
      }
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
    fx,
    devHelper,
    cameraRef,
    stageStatsRef,
    masteryRef
  ]);

  return useMemo(
    () => ({
      checkStageCompletion,
      checkTransition,
      resetForNewStage,
      cacheBossRef,
      stageAdvanceRequestedRef
    }),
    [checkStageCompletion, checkTransition, resetForNewStage, cacheBossRef, stageAdvanceRequestedRef]
  );
}
