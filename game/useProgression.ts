
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { UpgradeId } from '../upgrades/types';
import { XP_TO_LEVEL_UP, PASSIVE_SCORE_PER_SEC, COMBO_WINDOW, DIFFICULTY_CONFIGS, RARITY_MULTIPLIERS, UPGRADE_BASES } from '../constants';
import { UPGRADE_DEFINITIONS } from '../upgrades/factories';
import { GameStatus, Difficulty, WeaponStats, TerminalType, EnemyType, UpgradeRarity, UpgradeOption, StatModifier } from '../types';
import { DESCRIPTOR_REGISTRY } from './descriptors';
import { unlockMemoryId } from './memory/MemorySystem';
import { ROOT_FILESYSTEM } from '../archive/data';

export interface ProgressionAPI {
  applyUpgrade: (option: UpgradeOption) => void;
  onEnemyDefeated: (data: { xp: number }) => void;
  onFoodConsumed: (data: { type: string, byMagnet: boolean, value?: number }) => void;
  onTerminalHacked: (type: TerminalType, associatedFileId?: string) => void; 
  applyPassiveScore: (dt: number) => void;
  unlockNextDifficulty: () => void;
  addXp: (amount: number) => void; // Expose for DevTools
}

export function useProgression(game: ReturnType<typeof useGameState>): ProgressionAPI {
  const {
    statsRef,
    scoreRef,
    xpRef,
    nextLevelXpRef,
    levelRef,
    setUiScore,
    setUiXp,
    setUiXpValues,
    setUiLevel,
    setUiCombo,
    setUiShield,
    setStatus,
    setUpgradeOptions,
    audioEventsRef,
    uiCombo,
    gameTimeRef,
    lastEatTimeRef,
    stageScoreRef,
    unlockedDifficulties,
    setUnlockedDifficulties,
    difficulty,
    pendingStatusRef,
    uiXp, // Used for debug assertion
    enemiesRef, // Access enemies for Override effects
    settings,
    setResumeCountdown,
    syncUiStats, // Import sync
    unlockCosmetic, // Using the cosmetic toaster for memory reveals
    traitsRef, // Access Traits
    recalcTraits // NEW: Update traits on level
  } = game;

  const unlockNextDifficulty = useCallback(() => {
    const order = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.INSANE];
    const idx = order.indexOf(difficulty);
    if (idx >= 0 && idx < order.length - 1) {
      const next = order[idx + 1];
      if (!unlockedDifficulties.includes(next)) {
        setUnlockedDifficulties(prev => [...prev, next]);
      }
    }
  }, [difficulty, unlockedDifficulties, setUnlockedDifficulties]);

  const levelUp = useCallback(() => {
    setStatus(GameStatus.LEVEL_UP);
    audioEventsRef.current.push({ type: 'LEVEL_UP', data: { level: levelRef.current, difficulty, combo: uiCombo } });

    // RECALCULATE INTRINSIC TRAITS (Scaling per level)
    recalcTraits();

    const stats = statsRef.current;
    
    // Generate context for factories
    const context = {
        weapon: statsRef.current.weapon,
        critChance: statsRef.current.critChance,
        shieldActive: statsRef.current.shieldActive,
        hackSpeedMod: statsRef.current.hackSpeedMod,
        luck: statsRef.current.luck,
        globalDamageMod: statsRef.current.globalDamageMod,
        globalFireRateMod: statsRef.current.globalFireRateMod,
        globalAreaMod: statsRef.current.globalAreaMod,
        globalProjectileSpeedMod: statsRef.current.globalProjectileSpeedMod,
        maxWeaponSlots: statsRef.current.maxWeaponSlots,
        activeWeaponIds: statsRef.current.activeWeaponIds,
        acquiredUpgradeIds: statsRef.current.acquiredUpgradeIds
    };
    
    // We import from factories directly, but we need the keys.
    // Assuming factories exports UPGRADE_DEFINITIONS object keys.
    const allIds = Object.keys(UPGRADE_DEFINITIONS) as UpgradeId[];
    
    // 1. Filter Valid Upgrades based on caps and uniqueness
    const validIds = allIds.filter(id => {
        const desc = DESCRIPTOR_REGISTRY[id];
        if (!desc) return false;

        const maxLevel = desc.maxLevel || 999;
        
        // Dynamic level check from context to ensure filtering is accurate
        let currentLevel = 0;
        // @ts-ignore
        if (desc.category === 'WEAPON' && context.weapon[desc.id.toLowerCase() + 'Level'] !== undefined) {
             // @ts-ignore
             currentLevel = context.weapon[desc.id.toLowerCase() + 'Level'];
        }
        
        // SLOT CHECK (Only for new WEAPON acquisition)
        if (desc.category === 'WEAPON') {
            const isActive = stats.activeWeaponIds.includes(id);
            const slotsFull = stats.activeWeaponIds.length >= stats.maxWeaponSlots;
            if (!isActive && slotsFull) return false;
        }
        
        // Unique check
        if (maxLevel === 1 && stats.acquiredUpgradeIds.includes(id)) return false;

        return true;
    });

    // 2. Generate Options with Weights
    const options: UpgradeOption[] = [];
    
    const getWeight = (id: string) => {
        const desc = DESCRIPTOR_REGISTRY[id];
        if (!desc) return 0;
        if (desc.category === 'SCALAR') return 10;
        if (desc.category === 'WEAPON') return 5;
        return 1;
    };
    
    // Roll Rarity
    const rollRarity = (id: UpgradeId, luck: number): UpgradeRarity => {
        // Overclock Exception
        if (id === 'OVERCLOCK') {
            if (Math.random() < 0.05 + (luck * 0.1)) return 'OVERCLOCKED';
        }
        // Apply Intrinsic Luck Bonus
        const totalLuck = luck + traitsRef.current.luckBonus;
        
        const r = Math.random() + (totalLuck * 0.1); 
        if (r < 0.50) return 'COMMON';
        if (r < 0.80) return 'UNCOMMON';
        if (r < 0.95) return 'RARE';
        if (r < 0.99) return 'ULTRA_RARE';
        return 'MEGA_RARE';
    };

    if (validIds.length > 0) {
        let currentPool = [...validIds];
        for(let i=0; i<3; i++) {
            if (currentPool.length === 0) break;
            const totalWeight = currentPool.reduce((acc, id) => acc + getWeight(id), 0);
            let r = Math.random() * totalWeight;
            let pickedId = currentPool[0];
            for (const id of currentPool) {
                r -= getWeight(id);
                if (r <= 0) {
                    pickedId = id as UpgradeId;
                    break;
                }
            }
            
            const rarity = rollRarity(pickedId, stats.luck);
            // Factory Call
            // @ts-ignore
            const option = UPGRADE_DEFINITIONS[pickedId](context, rarity);
            options.push(option);
            currentPool = currentPool.filter(id => id !== pickedId);
        }
    } 
    
    // Fill with scalar fallback if empty
    while (options.length < 3) {
         const rarity = rollRarity('SCALAR_DAMAGE' as UpgradeId, stats.luck);
         // @ts-ignore
         options.push(UPGRADE_DEFINITIONS['SCALAR_DAMAGE'](context, rarity));
    }
    
    setUpgradeOptions(options);
  }, [setStatus, audioEventsRef, levelRef, difficulty, uiCombo, statsRef, setUpgradeOptions, recalcTraits, traitsRef]);

  // 🔒 RESTORED XP AUTHORITY
  const gainXp = useCallback((amount: number) => {
      // Apply Intrinsic XP Multiplier
      const finalAmount = amount * (1 + traitsRef.current.xpGainBonus);

      // Invariant 1: Always increment XP
      xpRef.current += finalAmount;
      
      // Invariant 2: Immediate Level-Up Trigger
      if (xpRef.current >= nextLevelXpRef.current) {
          xpRef.current -= nextLevelXpRef.current;
          levelRef.current += 1;
          nextLevelXpRef.current = Math.floor(nextLevelXpRef.current * 1.2);
          
          setUiLevel(levelRef.current);
          levelUp();
      }
      
      // Always update UI
      setUiXp((xpRef.current / nextLevelXpRef.current) * 100);
      setUiXpValues({ current: Math.floor(xpRef.current), max: nextLevelXpRef.current });
  }, [xpRef, nextLevelXpRef, levelRef, setUiLevel, setUiXp, setUiXpValues, levelUp, traitsRef]);

  const onEnemyDefeated = useCallback(({ xp }: { xp: number }) => {
      if (xp > 0) gainXp(xp);
      scoreRef.current += 100 * statsRef.current.scoreMultiplier;
      stageScoreRef.current += 100;
  }, [gainXp, scoreRef, statsRef, stageScoreRef]);

  const onFoodConsumed = useCallback(({ type, byMagnet, value }: { type: string, byMagnet: boolean, value?: number }) => {
      lastEatTimeRef.current = gameTimeRef.current;
      if (uiCombo < 10) setUiCombo(c => c + 1);
      
      const baseScore = 50;
      const comboMult = 1 + (uiCombo * 0.1);
      const val = value || baseScore;
      const finalScore = val * comboMult * statsRef.current.scoreMultiplier;
      
      scoreRef.current += finalScore;
      stageScoreRef.current += finalScore;
      setUiScore(scoreRef.current);

      audioEventsRef.current.push({ 
          type: 'EAT', 
          data: { multiplier: 1 + (uiCombo * 0.1) } 
      });

      // Explicitly call gainXp without stage checks
      if (type === 'XP_ORB' && value) {
          gainXp(value);
      } else if (type === 'NORMAL') {
          gainXp(10 * statsRef.current.foodQualityMod);
      }
  }, [gameTimeRef, lastEatTimeRef, uiCombo, setUiCombo, statsRef, scoreRef, stageScoreRef, setUiScore, audioEventsRef, gainXp]);

  const onTerminalHacked = useCallback((type: TerminalType, associatedFileId?: string) => {
      // 🔒 AUTHORITATIVE TERMINAL REWARD HANDLER
      
      const stats = statsRef.current;

      if (type === 'RESOURCE') {
          // Standard Terminal: Grants high XP & Score
          const baseTerminalXp = 300; 
          const xpGain = Math.floor(baseTerminalXp * stats.hackSpeedMod);
          
          gainXp(xpGain);

          scoreRef.current += 1000 * stats.scoreMultiplier;
          stageScoreRef.current += 1000;
          setUiScore(scoreRef.current);
      } 
      else if (type === 'MEMORY') {
          // 🧠 MEMORY UNLOCK
          if (associatedFileId) {
              const unlocked = unlockMemoryId(associatedFileId);
              if (unlocked) {
                  game.setHasUnreadArchiveData(true); // Flag global state
                  
                  // Find file name for toast
                  const file = ROOT_FILESYSTEM.contents.find(f => f.id === associatedFileId);
                  
                  gainXp(800); // Massive XP for lore
                  audioEventsRef.current.push({ type: 'BONUS' });
              }
          }
      }
      else if (type === 'OVERRIDE') {
          // Boss Override: Stuns the boss (System Shutdown)
          const boss = enemiesRef.current.find(e => e.type === EnemyType.BOSS);
          if (boss) {
              boss.stunTimer = 4000; // Disable boss firing for 4s
              boss.flash = 10;
          }
      }
      else if (type === 'CLEARANCE') {
          // Future proofing for keycard terminals
          scoreRef.current += 500;
          setUiScore(scoreRef.current);
      }

  }, [scoreRef, statsRef, stageScoreRef, setUiScore, gainXp, enemiesRef, game.setHasUnreadArchiveData]);

  const applyPassiveScore = useCallback((dt: number) => {
      const inc = PASSIVE_SCORE_PER_SEC * (dt / 1000) * statsRef.current.scoreMultiplier;
      scoreRef.current += inc;
      stageScoreRef.current += inc;
      setUiScore(Math.floor(scoreRef.current));
      
      if (uiCombo > 0 && gameTimeRef.current - lastEatTimeRef.current > COMBO_WINDOW) {
          setUiCombo(0);
      }
  }, [statsRef, scoreRef, stageScoreRef, setUiScore, uiCombo, gameTimeRef, lastEatTimeRef, setUiCombo]);

  // 💡 UPGRADE APPLICATION (Data-Driven)
  const applyUpgrade = useCallback((option: UpgradeOption) => {
    const stats = statsRef.current;
    
    // 1. Record Acquisition
    stats.acquiredUpgradeIds.push(option.id);
    
    // 2. Handle New Weapon Unlock logic
    // Safe-guard: Even if isNewWeapon is false (due to level mismatch), 
    // if the category is WEAPON and it's not active, activate it.
    if (option.category === 'WEAPON' || option.isNewWeapon) {
        if (!stats.activeWeaponIds.includes(option.id)) {
            stats.activeWeaponIds.push(option.id);
        }
    }

    // 3. Apply Modifiers
    option.modifiers.forEach((mod: StatModifier) => {
        const pathParts = mod.path.split('.');
        let target: any = stats;
        
        // Navigate Path
        for (let i = 0; i < pathParts.length - 1; i++) {
            target = target[pathParts[i]];
        }
        const key = pathParts[pathParts.length - 1];

        // Apply Op
        if (mod.op === 'ADD') {
            target[key] += mod.value;
        } else if (mod.op === 'MULTIPLY') {
            target[key] *= mod.value;
        } else if (mod.op === 'SET') {
            target[key] = mod.value;
        }
    });

    // 4. Special Logic Triggers (Side Effects of state change)
    // Check if Shield was just activated
    if (option.id === 'SHIELD' && stats.shieldActive) {
        setUiShield(true);
    }
    
    // Resume Game
    if (pendingStatusRef.current) {
        setStatus(pendingStatusRef.current);
        pendingStatusRef.current = null;
    } else {
        if (settings.skipCountdown) {
            setStatus(GameStatus.RESUMING);
        } else {
            setResumeCountdown(3);
            setStatus(GameStatus.RESUMING);
        }
    }
    
    // Play sound based on rarity
    if (option.rarity === 'MEGA_RARE' || option.rarity === 'OVERCLOCKED') {
        audioEventsRef.current.push({ type: 'BONUS' });
    } else {
        audioEventsRef.current.push({ type: 'POWER_UP' });
    }
    
    // UPDATE HUD METRICS
    syncUiStats();
    
  }, [statsRef, pendingStatusRef, setStatus, setUiShield, audioEventsRef, settings.skipCountdown, setResumeCountdown, syncUiStats]);

  return {
    applyUpgrade,
    onEnemyDefeated,
    onFoodConsumed,
    onTerminalHacked,
    applyPassiveScore,
    unlockNextDifficulty,
    addXp: gainXp
  };
}
