import { useCallback, useMemo } from 'react';
import { GameStatus, EnemyType, Direction, FoodType } from '../types';
import { DIFFICULTY_CONFIGS, POINTS_PER_STAGE } from '../constants';
import { generateWalls } from './gameUtils';
export function useStageController(game, spawner, fx, progression) {
    const { stageRef, stageScoreRef, setUiStage, wallsRef, snakeRef, directionRef, directionQueueRef, foodRef, enemiesRef, projectilesRef, terminalsRef, minesRef, digitalRainRef, bossActiveRef, bossEnemyRef, bossDefeatedRef, difficulty, enemySpawnTimerRef, terminalSpawnTimerRef, setStatus, pendingStatusRef, transitionStartTimeRef, status, setResumeCountdown, gameTimeRef, stageArmedRef, settings, statsRef, setUiShield } = game;
    const { unlockNextDifficulty } = progression;
    const cacheBossRef = useCallback(() => {
        bossEnemyRef.current = bossActiveRef.current
            ? enemiesRef.current.find(e => e.type === EnemyType.BOSS) ?? null
            : null;
    }, [bossActiveRef, enemiesRef, bossEnemyRef]);
    const checkStageCompletion = useCallback(() => {
        // 1. Must be PLAYING
        if (status !== GameStatus.PLAYING)
            return;
        // 2. Must be ARMED (No implicit completion)
        if (!stageArmedRef.current)
            return;
        // 3. Must not already be transitioning
        if (pendingStatusRef.current !== null)
            return;
        // Check condition based on Stage Type
        const isBossStage = stageRef.current % 4 === 0;
        if (isBossStage) {
            // BOSS STAGE: Must defeat boss to proceed
            if (!bossDefeatedRef.current)
                return;
        }
        else {
            // STANDARD STAGE: Score threshold
            if (stageScoreRef.current < POINTS_PER_STAGE)
                return;
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
        gameTimeRef,
        stageArmedRef
    ]);
    const advanceStage = useCallback(() => {
        // 🛡️ DEV-ONLY INVARIANT: Stats Reference Integrity
        // Ensure statsRef is not being reassigned or wiped
        if (process.env.NODE_ENV !== 'production') {
            if (!statsRef.current || !statsRef.current.activeWeaponIds) {
                console.error("CRITICAL: Stats reference lost or corrupted during stage transition!");
            }
        }
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
        stageArmedRef.current = false; // Disarm for next stage
        transitionStartTimeRef.current = 0;
        // 🛡️ REGENERATE SHIELD IF ACQUIRED
        // Check acquisition via permanent upgrade ID list
        if (statsRef.current.acquiredUpgradeIds.includes('SHIELD')) {
            statsRef.current.shieldActive = true;
            setUiShield(true);
        }
        if (settings.skipCountdown) {
            setStatus(GameStatus.PLAYING);
            // CRITICAL: Immediately arm stage if skipping countdown
            stageArmedRef.current = true;
        }
        else {
            setStatus(GameStatus.RESUMING);
            setResumeCountdown(3);
        }
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
        bossDefeatedRef,
        stageArmedRef,
        settings.skipCountdown,
        statsRef,
        setUiShield
    ]);
    return useMemo(() => ({
        checkStageCompletion,
        advanceStage,
        cacheBossRef
    }), [checkStageCompletion, advanceStage, cacheBossRef]);
}
