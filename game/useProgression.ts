
import { useCallback, useRef, useMemo } from 'react';
import { useGameState } from './useGameState';

import {
  PASSIVE_SCORE_PER_SEC,
  COMBO_WINDOW
} from '../constants';

import { UPGRADE_FACTORIES } from '../upgrades/factories';
import { UpgradeContext, UpgradeId } from '../upgrades/types';

import {
  GameStatus,
  UpgradeOption,
  Difficulty,
  FoodType
} from '../types';

/* ─────────────────────────────
   API
   ───────────────────────────── */

export interface ProgressionAPI {
  applyPassiveScore: (dt: number) => void;
  checkLevelUp: () => void;
  applyUpgrade: (upgradeId: UpgradeId) => void;
  generateUpgradeOptions: () => UpgradeOption[];
  unlockNextDifficulty: () => void;
  onFoodConsumed: (args: { type: FoodType; byMagnet?: boolean; value?: number }) => void;
  onTerminalHacked: () => void;
  onEnemyDefeated: (args?: { xp?: number; score?: number }) => void;
  resetCombo: () => void;
}

/* ─────────────────────────────
   Difficulty Order
   ───────────────────────────── */

export const DIFFICULTY_ORDER: Difficulty[] = [
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.INSANE
];

/* ─────────────────────────────
   useProgression
   ───────────────────────────── */

export function useProgression(
  game: ReturnType<typeof useGameState>
): ProgressionAPI {
  const {
    xpRef,
    xpToNextLevelRef,
    levelRef,
    setUiLevel,
    setUiXp,

    scoreRef,
    stageScoreRef,
    setUiScore,

    lastEatTimeRef,
    comboMultiplierRef,
    setUiCombo,

    statsRef,

    difficulty,
    setUnlockedDifficulties,

    setStatus,
    setUiShield,
    setResumeCountdown,
    setUpgradeOptions,

    gameTimeRef,
    audioEventsRef
  } = game;

  /* ─────────────────────────────
     Difficulty
     ───────────────────────────── */

  const unlockNextDifficulty = useCallback(() => {
    setUnlockedDifficulties(prev => {
      const idx = DIFFICULTY_ORDER.indexOf(difficulty);
      const next = DIFFICULTY_ORDER[idx + 1];
      if (!next || prev.includes(next)) return prev;

      const updated = [...prev, next];
      localStorage.setItem(
        'snake_unlocked_difficulties',
        JSON.stringify(updated)
      );
      return updated;
    });
  }, [difficulty, setUnlockedDifficulties]);

  /* ─────────────────────────────
     Passive Score
     ───────────────────────────── */

  const passiveAccumulatorRef = useRef(0);

  const applyPassiveScore = useCallback((dt: number) => {
    passiveAccumulatorRef.current += dt;

    if (passiveAccumulatorRef.current >= 1000) {
      const bonus =
        PASSIVE_SCORE_PER_SEC *
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

  const generateUpgradeOptions = useCallback((): UpgradeOption[] => {
    const stats = statsRef.current;
    
    const ctx: UpgradeContext = {
      weapon: stats.weapon,
      critChance: stats.critChance,
      shieldActive: stats.shieldActive,
      hackSpeedMod: stats.hackSpeedMod
    };

    const lockedWeaponCount = stats.activeWeaponIds.length;
    const MAX_WEAPONS = 3;

    // 1. Generate all possible options
    const allOptions = Object.values(UPGRADE_FACTORIES).map(f => f(ctx));

    // 2. Filter valid options
    const validOptions = allOptions.filter(opt => {
        // If it's a new weapon (level 0), check slot limits
        if (opt.category === 'WEAPON' && opt.isNewWeapon) {
            if (lockedWeaponCount >= MAX_WEAPONS) return false;
        }
        return true;
    });

    // 3. Shuffle
    const shuffled = validOptions.sort(() => Math.random() - 0.5);

    // 4. Select 3 distinct options with category diversity
    const selected: UpgradeOption[] = [];
    const usedCategories = new Set<string>();

    for (const opt of shuffled) {
        if (selected.length >= 3) break;
        
        // Try to prioritize new categories
        if (!usedCategories.has(opt.category) || selected.length >= 2) {
            selected.push(opt);
            usedCategories.add(opt.category);
        }
    }
    
    // Fill if we skipped too many due to category diversity (fallback)
    if (selected.length < 3) {
        for (const opt of shuffled) {
            if (selected.length >= 3) break;
            if (!selected.includes(opt)) {
                selected.push(opt);
            }
        }
    }

    return selected;
  }, [statsRef]);

  /* ─────────────────────────────
     Leveling
     ───────────────────────────── */

  const checkLevelUp = useCallback(() => {
    // Prevent overlapping transitions (e.g. Game Over taking precedence)
    if (game.pendingStatusRef.current) return;

    while (xpRef.current >= xpToNextLevelRef.current) {
      // If we are already pending level up, break to let user choose.
      if (game.pendingStatusRef.current === GameStatus.LEVEL_UP) break;

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
      xpToNextLevelRef.current = Math.floor(
        xpToNextLevelRef.current * 1.3
      );

      levelRef.current += 1;
      setUiLevel(levelRef.current);
    }

    setUiXp(
      (xpRef.current / xpToNextLevelRef.current) * 100
    );
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

  const onFoodConsumed = useCallback(({ type, byMagnet, value }: { type: FoodType; byMagnet?: boolean; value?: number }) => {
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
      comboMultiplierRef.current = Math.min(
        8,
        comboMultiplierRef.current * 2
      );
    } else {
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

    const scoreDelta =
      baseScore *
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

  const onEnemyDefeated = useCallback(
    ({ xp = 40, score = 100 } = {}) => {
      const scoreDelta = score * statsRef.current.scoreMultiplier;
      
      scoreRef.current += scoreDelta;
      stageScoreRef.current += scoreDelta;
      setUiScore(scoreRef.current);

      xpRef.current += xp;
      
      checkLevelUp();
    },
    [
      scoreRef,
      stageScoreRef,
      statsRef,
      setUiScore,
      xpRef,
      checkLevelUp
    ]
  );

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

  const applyUpgrade = useCallback((upgradeId: UpgradeId) => {
    const stats = statsRef.current;
    const w = stats.weapon;

    // Apply mutation logic based on ID
    switch (upgradeId) {
      case 'CANNON':
        if (w.cannonLevel === 0) stats.activeWeaponIds.push('CANNON');
        w.cannonLevel += 1;
        if (w.cannonLevel === 1) {
            w.cannonDamage = 12;
            w.cannonFireRate = 1200;
            w.cannonProjectileCount = 1;
            w.cannonProjectileSpeed = 16;
        } else {
            w.cannonDamage += 5;
            w.cannonFireRate = Math.max(200, w.cannonFireRate * 0.9);
            if (w.cannonLevel >= 3) {
                w.cannonProjectileCount += 1;
                w.cannonProjectileSpeed += 2;
            }
        }
        break;
      
      case 'AURA':
        if (w.auraLevel === 0) stats.activeWeaponIds.push('AURA');
        w.auraLevel += 1;
        if (w.auraLevel === 1) {
            w.auraRadius = 2.0;
            w.auraDamage = 15;
        } else {
            w.auraRadius += 0.5;
            w.auraDamage += 5;
        }
        break;
      
      case 'NANO_SWARM':
        if (w.nanoSwarmLevel === 0) stats.activeWeaponIds.push('NANO_SWARM');
        w.nanoSwarmLevel += 1;
        if (w.nanoSwarmLevel === 1) {
            w.nanoSwarmCount = 2;
            w.nanoSwarmDamage = 15;
        } else {
            w.nanoSwarmCount += 1;
            w.nanoSwarmDamage += 5;
        }
        break;
      
      case 'MINES':
        if (w.mineLevel === 0) stats.activeWeaponIds.push('MINES');
        w.mineLevel += 1;
        if (w.mineLevel === 1) {
            w.mineDamage = 40;
            w.mineRadius = 3.0;
            w.mineDropRate = 3000;
        } else {
            w.mineDamage += 20;
            w.mineRadius += 0.5;
            w.mineDropRate = Math.max(500, w.mineDropRate * 0.9);
        }
        break;
      
      case 'LIGHTNING':
        if (w.chainLightningLevel === 0) stats.activeWeaponIds.push('LIGHTNING');
        w.chainLightningLevel += 1;
        if (w.chainLightningLevel === 1) {
            w.chainLightningDamage = 0.5;
            w.chainLightningRange = 6;
        } else {
            w.chainLightningDamage += 0.15;
            w.chainLightningRange += 1;
        }
        break;
      
      case 'SHOCKWAVE':
        w.shockwaveLevel += 1;
        if (w.shockwaveLevel === 1) {
            w.shockwaveRadius = 8;
            w.shockwaveDamage = 50;
        } else {
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
        if (w.prismLanceLevel === 0) stats.activeWeaponIds.push('PRISM_LANCE');
        w.prismLanceLevel += 1;
        if (w.prismLanceLevel === 1) {
            w.prismLanceDamage = 25;
        } else {
            w.prismLanceDamage += 10;
        }
        break;

      case 'NEON_SCATTER':
        if (w.neonScatterLevel === 0) stats.activeWeaponIds.push('NEON_SCATTER');
        w.neonScatterLevel += 1;
        if (w.neonScatterLevel === 1) {
            w.neonScatterDamage = 10; 
        } else {
            w.neonScatterDamage += 4;
        }
        break;

      case 'VOLT_SERPENT':
        if (w.voltSerpentLevel === 0) stats.activeWeaponIds.push('VOLT_SERPENT');
        w.voltSerpentLevel += 1;
        if (w.voltSerpentLevel === 1) {
            w.voltSerpentDamage = 20;
        } else {
            w.voltSerpentDamage += 8;
        }
        break;

      case 'PHASE_RAIL':
        if (w.phaseRailLevel === 0) stats.activeWeaponIds.push('PHASE_RAIL');
        w.phaseRailLevel += 1;
        if (w.phaseRailLevel === 1) {
            w.phaseRailDamage = 200;
        } else {
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
      
      case 'TERMINAL_PROTOCOL':
        stats.hackSpeedMod *= 1.25; // 25% faster
        stats.scoreMultiplier += 0.1; // 10% more score
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

  return useMemo<ProgressionAPI>(() => ({
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
