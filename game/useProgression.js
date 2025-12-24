import { useCallback, useRef, useMemo } from 'react';
import { PASSIVE_SCORE_PER_SEC, COMBO_WINDOW } from '../constants';
import { UPGRADE_FACTORIES } from '../upgrades/factories';
import { GameStatus, Difficulty, FoodType } from '../types';
/* ─────────────────────────────
   Difficulty Order
   ───────────────────────────── */
export const DIFFICULTY_ORDER = [
    Difficulty.EASY,
    Difficulty.MEDIUM,
    Difficulty.HARD,
    Difficulty.INSANE
];
/* ─────────────────────────────
   useProgression
   ───────────────────────────── */
export function useProgression(game) {
    const { xpRef, xpToNextLevelRef, levelRef, setUiLevel, setUiXp, scoreRef, stageScoreRef, setUiScore, lastEatTimeRef, comboMultiplierRef, setUiCombo, statsRef, difficulty, setUnlockedDifficulties, setStatus, setUiShield, setResumeCountdown, setUpgradeOptions, gameTimeRef, audioEventsRef } = game;
    /* ─────────────────────────────
       Difficulty
       ───────────────────────────── */
    const unlockNextDifficulty = useCallback(() => {
        setUnlockedDifficulties(prev => {
            const idx = DIFFICULTY_ORDER.indexOf(difficulty);
            const next = DIFFICULTY_ORDER[idx + 1];
            if (!next || prev.includes(next))
                return prev;
            const updated = [...prev, next];
            localStorage.setItem('snake_unlocked_difficulties', JSON.stringify(updated));
            return updated;
        });
    }, [difficulty, setUnlockedDifficulties]);
    /* ─────────────────────────────
       Passive Score
       ───────────────────────────── */
    const passiveAccumulatorRef = useRef(0);
    const applyPassiveScore = useCallback((dt) => {
        passiveAccumulatorRef.current += dt;
        if (passiveAccumulatorRef.current >= 1000) {
            const bonus = PASSIVE_SCORE_PER_SEC *
                statsRef.current.scoreMultiplier;
            scoreRef.current += bonus;
            stageScoreRef.current += bonus;
            setUiScore(scoreRef.current);
            passiveAccumulatorRef.current -= 1000;
        }
    }, [statsRef, scoreRef, stageScoreRef, setUiScore]);
    /* ─────────────────────────────
       Upgrades Generation
       ───────────────────────────── */
    const generateUpgradeOptions = useCallback(() => {
        const stats = statsRef.current;
        const ctx = {
            weapon: stats.weapon,
            critChance: stats.critChance,
            shieldActive: stats.shieldActive
        };
        return Object.entries(UPGRADE_FACTORIES)
            .map(([_, f]) => f(ctx))
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
    }, [statsRef]);
    /* ─────────────────────────────
       Leveling
       ───────────────────────────── */
    const checkLevelUp = useCallback(() => {
        // Prevent overlapping transitions (e.g. Game Over taking precedence)
        if (game.pendingStatusRef.current)
            return;
        while (xpRef.current >= xpToNextLevelRef.current) {
            // If we are already pending level up, break to let user choose.
            if (game.pendingStatusRef.current === GameStatus.LEVEL_UP)
                break;
            // Lock the state FIRST to prevent audio spam or re-entry
            game.pendingStatusRef.current = GameStatus.LEVEL_UP;
            // EMIT LEVEL UP SOUND (Context Aware)
            // Level is +1 because we are about to increment
            audioEventsRef.current.push({
                type: 'LEVEL_UP',
                data: {
                    level: levelRef.current + 1,
                    difficulty: difficulty,
                    combo: comboMultiplierRef.current
                }
            });
            // Generate and set options immediately to avoid UI flicker
            const options = generateUpgradeOptions();
            setUpgradeOptions(options);
            setStatus(GameStatus.LEVEL_UP);
            xpRef.current -= xpToNextLevelRef.current;
            xpToNextLevelRef.current = Math.floor(xpToNextLevelRef.current * 1.3);
            levelRef.current += 1;
            setUiLevel(levelRef.current);
        }
        setUiXp((xpRef.current / xpToNextLevelRef.current) * 100);
    }, [
        xpRef,
        xpToNextLevelRef,
        levelRef,
        setUiLevel,
        setUiXp,
        setStatus,
        game.pendingStatusRef,
        generateUpgradeOptions,
        setUpgradeOptions,
        audioEventsRef,
        difficulty,
        comboMultiplierRef
    ]);
    /* ─────────────────────────────
       Food
       ───────────────────────────── */
    const onFoodConsumed = useCallback(({ type, byMagnet, value }) => {
        const now = gameTimeRef.current;
        // XP ORBS (New System)
        // They give XP but do NOT affect Combo Timer or Multiplier to prevent cheese.
        if (type === FoodType.XP_ORB) {
            xpRef.current += (value || 10);
            // Tiny score just for feedback
            scoreRef.current += 5;
            stageScoreRef.current += 5;
            setUiScore(scoreRef.current);
            checkLevelUp();
            return;
        }
        // STANDARD FOOD (Original Logic)
        if (now - lastEatTimeRef.current < COMBO_WINDOW) {
            comboMultiplierRef.current = Math.min(8, comboMultiplierRef.current * 2);
        }
        else {
            comboMultiplierRef.current = 1;
        }
        lastEatTimeRef.current = now;
        setUiCombo(comboMultiplierRef.current);
        let baseScore = 15;
        let baseXp = 25;
        if (type === FoodType.BONUS) {
            baseScore = 60;
            baseXp = 60;
        }
        const scoreDelta = baseScore *
            comboMultiplierRef.current *
            statsRef.current.scoreMultiplier;
        scoreRef.current += scoreDelta;
        stageScoreRef.current += scoreDelta;
        setUiScore(scoreRef.current);
        xpRef.current += baseXp;
        // Audio trigger with combo context
        if (type !== FoodType.POISON) {
            audioEventsRef.current.push({ type: 'EAT', data: { multiplier: comboMultiplierRef.current } });
        }
        checkLevelUp();
    }, [
        gameTimeRef,
        lastEatTimeRef,
        comboMultiplierRef,
        setUiCombo,
        statsRef,
        scoreRef,
        stageScoreRef,
        setUiScore,
        xpRef,
        checkLevelUp,
        audioEventsRef
    ]);
    /* ─────────────────────────────
       Enemy
       ───────────────────────────── */
    const onEnemyDefeated = useCallback(({ xp = 40, score = 100 } = {}) => {
        const scoreDelta = score * statsRef.current.scoreMultiplier;
        scoreRef.current += scoreDelta;
        stageScoreRef.current += scoreDelta;
        setUiScore(scoreRef.current);
        xpRef.current += xp;
        checkLevelUp();
    }, [
        scoreRef,
        stageScoreRef,
        statsRef,
        setUiScore,
        xpRef,
        checkLevelUp
    ]);
    /* ─────────────────────────────
       Terminal
       ───────────────────────────── */
    const onTerminalHacked = useCallback(() => {
        const scoreDelta = 3000 * statsRef.current.scoreMultiplier;
        scoreRef.current += scoreDelta;
        stageScoreRef.current += scoreDelta;
        setUiScore(scoreRef.current);
        // REMOVED INSTANT XP - Handled by Orbs in useCollisions
        // xpRef.current += 500; 
        checkLevelUp();
    }, [
        scoreRef,
        stageScoreRef,
        statsRef,
        setUiScore,
        xpRef,
        checkLevelUp
    ]);
    const resetCombo = useCallback(() => {
        comboMultiplierRef.current = 1;
        setUiCombo(1);
    }, [comboMultiplierRef, setUiCombo]);
    /* ─────────────────────────────
       Upgrades
       ───────────────────────────── */
    const applyUpgrade = useCallback((upgradeId) => {
        const stats = statsRef.current;
        const w = stats.weapon;
        // Apply mutation logic based on ID
        switch (upgradeId) {
            case 'CANNON':
                w.cannonLevel += 1;
                if (w.cannonLevel === 1) {
                    w.cannonDamage = 12;
                    w.cannonFireRate = 1200;
                    w.cannonProjectileCount = 1;
                    w.cannonProjectileSpeed = 16;
                }
                else {
                    w.cannonDamage += 5;
                    w.cannonFireRate = Math.max(200, w.cannonFireRate * 0.9);
                    if (w.cannonLevel >= 3) {
                        w.cannonProjectileCount += 1;
                        w.cannonProjectileSpeed += 2;
                    }
                }
                break;
            case 'AURA':
                w.auraLevel += 1;
                if (w.auraLevel === 1) {
                    w.auraRadius = 2.0;
                    w.auraDamage = 15;
                }
                else {
                    w.auraRadius += 0.5;
                    w.auraDamage += 5;
                }
                break;
            case 'NANO_SWARM':
                w.nanoSwarmLevel += 1;
                if (w.nanoSwarmLevel === 1) {
                    w.nanoSwarmCount = 2;
                    w.nanoSwarmDamage = 15;
                }
                else {
                    w.nanoSwarmCount += 1;
                    w.nanoSwarmDamage += 5;
                }
                break;
            case 'MINES':
                w.mineLevel += 1;
                if (w.mineLevel === 1) {
                    w.mineDamage = 40;
                    w.mineRadius = 3.0;
                    w.mineDropRate = 3000;
                }
                else {
                    w.mineDamage += 20;
                    w.mineRadius += 0.5;
                    w.mineDropRate = Math.max(500, w.mineDropRate * 0.9);
                }
                break;
            case 'LIGHTNING':
                w.chainLightningLevel += 1;
                if (w.chainLightningLevel === 1) {
                    w.chainLightningDamage = 0.5;
                    w.chainLightningRange = 6;
                }
                else {
                    w.chainLightningDamage += 0.15;
                    w.chainLightningRange += 1;
                }
                break;
            case 'SHOCKWAVE':
                w.shockwaveLevel += 1;
                if (w.shockwaveLevel === 1) {
                    w.shockwaveRadius = 8;
                    w.shockwaveDamage = 50;
                }
                else {
                    w.shockwaveRadius += 2;
                    w.shockwaveDamage += 30;
                    stats.empCooldownMod *= 0.85;
                }
                break;
            case 'SHIELD':
                stats.shieldActive = true;
                setUiShield(true);
                break;
            case 'CRITICAL':
                stats.critChance += 0.06;
                stats.critMultiplier += 0.25;
                break;
            case 'FOOD':
                stats.scoreMultiplier += 0.2;
                stats.magnetRangeMod += 1.0;
                stats.foodQualityMod += 0.2;
                break;
            case 'PRISM_LANCE':
                w.prismLanceLevel += 1;
                if (w.prismLanceLevel === 1) {
                    w.prismLanceDamage = 25;
                }
                else {
                    w.prismLanceDamage += 10;
                }
                break;
            case 'NEON_SCATTER':
                w.neonScatterLevel += 1;
                if (w.neonScatterLevel === 1) {
                    w.neonScatterDamage = 10;
                }
                else {
                    w.neonScatterDamage += 4;
                }
                break;
            case 'VOLT_SERPENT':
                w.voltSerpentLevel += 1;
                if (w.voltSerpentLevel === 1) {
                    w.voltSerpentDamage = 20;
                }
                else {
                    w.voltSerpentDamage += 8;
                }
                break;
            case 'PHASE_RAIL':
                w.phaseRailLevel += 1;
                if (w.phaseRailLevel === 1) {
                    w.phaseRailDamage = 200;
                }
                else {
                    w.phaseRailDamage += 100;
                }
                break;
            case 'REFLECTOR_MESH':
                w.reflectorMeshLevel += 1;
                break;
            case 'GHOST_COIL':
                w.ghostCoilLevel += 1;
                break;
            case 'EMP_BLOOM':
                w.empBloomLevel += 1;
                break;
            case 'NEURAL_MAGNET':
                w.neuralMagnetLevel += 1;
                break;
            case 'OVERCLOCK':
                w.overclockLevel += 1;
                break;
            case 'ECHO_CACHE':
                w.echoCacheLevel += 1;
                break;
        }
        game.pendingStatusRef.current = null; // Release the lock
        // Check if we have enough XP for another level immediately
        checkLevelUp();
        // If checkLevelUp triggered another level, it will set pendingStatusRef to LEVEL_UP
        if (game.pendingStatusRef.current === GameStatus.LEVEL_UP) {
            return;
        }
        setStatus(GameStatus.RESUMING);
        setResumeCountdown(3);
    }, [statsRef, setUiShield, setStatus, setResumeCountdown, game.pendingStatusRef, checkLevelUp]);
    /* ───────────────────────────── */
    return useMemo(() => ({
        applyPassiveScore: applyPassiveScore,
        checkLevelUp: checkLevelUp,
        applyUpgrade: applyUpgrade,
        generateUpgradeOptions: generateUpgradeOptions,
        unlockNextDifficulty: unlockNextDifficulty,
        onFoodConsumed: onFoodConsumed,
        onTerminalHacked: onTerminalHacked,
        onEnemyDefeated: onEnemyDefeated,
        resetCombo: resetCombo
    }), [
        applyPassiveScore,
        checkLevelUp,
        applyUpgrade,
        generateUpgradeOptions,
        unlockNextDifficulty,
        onFoodConsumed,
        onTerminalHacked,
        onEnemyDefeated,
        resetCombo
    ]);
}
