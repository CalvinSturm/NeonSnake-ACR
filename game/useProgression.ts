
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { UpgradeId } from '../upgrades/types';
import { XP_TO_LEVEL_UP, PASSIVE_SCORE_PER_SEC, COMBO_WINDOW, DIFFICULTY_CONFIGS, RARITY_MULTIPLIERS, UPGRADE_BASES } from '../constants';
import { UPGRADE_DEFINITIONS } from '../upgrades/factories';
import { GameStatus, Difficulty, WeaponStats, TerminalType, EnemyType, UpgradeRarity, FoodType } from '../types';
import { DESCRIPTOR_REGISTRY } from './descriptors';
import { unlockMemoryId } from './memory/MemorySystem';
import { ROOT_FILESYSTEM } from '../archive/data';
import { applyWeaponGrowth } from './weaponScaling';

export interface ProgressionAPI {
  applyUpgrade: (id: UpgradeId, rarity?: UpgradeRarity) => void;
  onEnemyDefeated: (data: { xp: number }) => void;
  onFoodConsumed: (data: { type: string, byMagnet: boolean, value?: number }) => void;
  onTerminalHacked: (type: TerminalType, associatedFileId?: string) => number; 
  applyPassiveScore: (dt: number) => void;
  unlockNextDifficulty: () => void;
  addXp: (amount: number) => void; // Expose for DevTools
}

// Helper to map upgrade IDs to their stat keys in WeaponStats
const WEAPON_STAT_MAP: Partial<Record<UpgradeId, keyof WeaponStats>> = {
  CANNON: 'cannonLevel',
  AURA: 'auraLevel',
  MINES: 'mineLevel',
  LIGHTNING: 'chainLightningLevel',
  NANO_SWARM: 'nanoSwarmLevel',
  PRISM_LANCE: 'prismLanceLevel',
  NEON_SCATTER: 'neonScatterLevel',
  VOLT_SERPENT: 'voltSerpentLevel',
  PHASE_RAIL: 'phaseRailLevel',
  REFLECTOR_MESH: 'reflectorMeshLevel',
  GHOST_COIL: 'ghostCoilLevel',
  NEURAL_MAGNET: 'neuralMagnetLevel',
  OVERCLOCK: 'overclockLevel',
  ECHO_CACHE: 'echoCacheLevel',
  LUCK: 'luckLevel'
};

// Rolling Logic with Luck
const rollRarity = (id: UpgradeId, luck: number = 0): UpgradeRarity => {
    // Overclock Exception: Small chance to break limits
    if (id === 'OVERCLOCK') {
        if (Math.random() < 0.05 + (luck * 0.1)) return 'OVERCLOCKED';
    }

    const r = Math.random() + luck;
    if (r < 0.50) return 'COMMON';
    if (r < 0.80) return 'UNCOMMON';
    if (r < 0.95) return 'RARE';
    if (r < 0.99) return 'ULTRA_RARE';
    return 'MEGA_RARE';
};

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
    addNeonFragments, // New Currency
    traitsRef,
    tailIntegrityRef // For Regen
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

    const stats = statsRef.current;
    const allIds = Object.keys(UPGRADE_DEFINITIONS) as UpgradeId[];
    
    // 1. Filter Valid Upgrades based on caps and uniqueness
    const validIds = allIds.filter(id => {
        const desc = DESCRIPTOR_REGISTRY[id];
        if (!desc) return false;

        // MAX LEVEL / UNIQUE CHECK
        const maxLevel = desc.maxLevel || 999;
        
        // Check current level
        let currentLevel = 0;
        const statKey = WEAPON_STAT_MAP[id];
        if (statKey) {
            currentLevel = stats.weapon[statKey];
        } else if (stats.acquiredUpgradeIds.includes(id)) {
            if (maxLevel === 1) return false;
        }

        if (currentLevel >= maxLevel) return false;

        // SLOT CHECK (Only for new WEAPON acquisition)
        if (desc.category === 'WEAPON') {
            const isActive = stats.activeWeaponIds.includes(id);
            const slotsFull = stats.activeWeaponIds.length >= stats.maxWeaponSlots;
            if (!isActive && slotsFull) return false;
        }
        
        return true;
    });

    // 2. Generate Options with Weights
    const options = [];
    const context = {
        weapon: statsRef.current.weapon,
        critChance: statsRef.current.critChance,
        shieldActive: statsRef.current.shieldActive,
        hackSpeedMod: statsRef.current.hackSpeedMod
    };

    const getWeight = (id: string) => {
        const desc = DESCRIPTOR_REGISTRY[id];
        if (!desc) return 0;
        if (desc.category === 'SCALAR') return 10;
        if (desc.category === 'WEAPON') return 5;
        return 1;
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
            // 🎲 ROLL RARITY HERE (Using LUCK)
            let rarity = rollRarity(pickedId, stats.luck);
            
            // Force Red Rarity for Override Protocol
            if (pickedId === 'OVERRIDE_PROTOCOL') {
                rarity = 'OVERCLOCKED';
            }
            
            options.push(UPGRADE_DEFINITIONS[pickedId](context, rarity));
            currentPool = currentPool.filter(id => id !== pickedId);
        }
    } 
    
    while (options.length < 3) {
         const rarity = rollRarity('SCALAR_DAMAGE', stats.luck);
         options.push(UPGRADE_DEFINITIONS['SCALAR_DAMAGE'](context, rarity));
    }
    
    setUpgradeOptions(options);
  }, [setStatus, audioEventsRef, levelRef, difficulty, uiCombo, statsRef, setUpgradeOptions]);

  // 🔒 RESTORE XP AUTHORITY
  const gainXp = useCallback((amount: number) => {
      // Invariant 1: Always increment XP
      xpRef.current += amount;
      
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
  }, [xpRef, nextLevelXpRef, levelRef, setUiLevel, setUiXp, setUiXpValues, levelUp]);

  const onEnemyDefeated = useCallback(({ xp }: { xp: number }) => {
      if (xp > 0) gainXp(xp);
      scoreRef.current += 100 * statsRef.current.scoreMultiplier;
      stageScoreRef.current += 100;
  }, [gainXp, scoreRef, statsRef, stageScoreRef]);

  const onFoodConsumed = useCallback(({ type, byMagnet, value }: { type: string, byMagnet: boolean, value?: number }) => {
      lastEatTimeRef.current = gameTimeRef.current;
      
      // FIXED: Only increment combo for Normal Food (not XP orbs) to make combo skill-based
      if ((type === FoodType.NORMAL || type === 'BONUS') && uiCombo < 10) {
          setUiCombo(c => c + 1);
      }
      
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

  const onTerminalHacked = useCallback((type: TerminalType, associatedFileId?: string): number => {
      // 🔒 AUTHORITATIVE TERMINAL REWARD HANDLER
      
      const stats = statsRef.current;
      let xpGained = 0;

      if (type === 'RESOURCE') {
          // Standard Terminal: Grants high XP & Score
          const baseTerminalXp = 300; 
          const xpGain = Math.floor(baseTerminalXp * stats.hackSpeedMod);
          
          gainXp(xpGain);
          xpGained = xpGain;

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
                  xpGained = 800;
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

      return xpGained;
  }, [scoreRef, statsRef, stageScoreRef, setUiScore, gainXp, enemiesRef, game.setHasUnreadArchiveData]);

  const applyPassiveScore = useCallback((dt: number) => {
      // NEW: Award Neon Fragments on stage clear
      if (game.stageReadyRef.current && game.pendingStatusRef.current === null) {
          // Check if we just cleared boss
          if (game.bossDefeatedRef.current) {
              // Boss award happens in processDeath inside useCombat to avoid multiple triggers,
              // but standard stage clear award can happen here if needed.
          }
      }

      // MAJOR TRAIT: BULWARK (Hull Regen)
      // Regenerate based on level scaling
      if (traitsRef.current.regenPerLevel > 0) {
          const regenAmount = traitsRef.current.regenPerLevel * levelRef.current * (dt / 1000);
          tailIntegrityRef.current = Math.min(100, tailIntegrityRef.current + regenAmount);
      }

      const inc = PASSIVE_SCORE_PER_SEC * (dt / 1000) * statsRef.current.scoreMultiplier;
      scoreRef.current += inc;
      stageScoreRef.current += inc;
      setUiScore(Math.floor(scoreRef.current));
      
      // FIXED: Combo Counter Logic (Reset if window passed)
      if (uiCombo > 0 && gameTimeRef.current - lastEatTimeRef.current > COMBO_WINDOW) {
          setUiCombo(0);
      }
  }, [statsRef, scoreRef, stageScoreRef, setUiScore, uiCombo, gameTimeRef, lastEatTimeRef, setUiCombo, game.stageReadyRef, game.pendingStatusRef, traitsRef, levelRef, tailIntegrityRef]);

  // 💡 UPGRADE APPLICATION (WITH RARITY SCALING)
  const applyUpgrade = useCallback((id: UpgradeId, rarity: UpgradeRarity = 'COMMON') => {
    const stats = statsRef.current;
    
    // Apply stats scalar based on rarity
    const mod = RARITY_MULTIPLIERS[rarity] || 1.0;
    
    stats.acquiredUpgradeIds.push(id);

    // 🛠️ OVERCLOCK EXCEPTION LOGIC
    if (id === 'OVERCLOCK' && rarity === 'OVERCLOCKED') {
        stats.maxWeaponSlots = Math.min(UPGRADE_BASES.MAX_WEAPON_SLOTS, stats.maxWeaponSlots + 1);
    }

    // ── SCALARS & UTILITY ──
    if (id === 'SCALAR_DAMAGE') stats.globalDamageMod += UPGRADE_BASES.SCALAR_DAMAGE * mod;
    else if (id === 'SCALAR_FIRE_RATE') stats.globalFireRateMod += UPGRADE_BASES.SCALAR_FIRE_RATE * mod;
    else if (id === 'SCALAR_AREA') stats.globalAreaMod += UPGRADE_BASES.SCALAR_AREA * mod;
    else if (id === 'SHIELD') { stats.shieldActive = true; setUiShield(true); }
    else if (id === 'CRITICAL') { stats.critChance += UPGRADE_BASES.CRIT_CHANCE * mod; stats.critMultiplier += UPGRADE_BASES.CRIT_MULT * mod; }
    else if (id === 'FOOD') stats.foodQualityMod += UPGRADE_BASES.FOOD_QUALITY * mod;
    else if (id === 'TERMINAL_PROTOCOL') { stats.hackSpeedMod *= (1 + (UPGRADE_BASES.HACK_SPEED * mod)); stats.scoreMultiplier += UPGRADE_BASES.SCORE_MULT * mod; }
    else if (id === 'OVERRIDE_PROTOCOL') stats.maxWeaponSlots = Math.min(UPGRADE_BASES.MAX_WEAPON_SLOTS, stats.maxWeaponSlots + 1);
    
    // ── WEAPON LEVELING ──
    else {
        // Handle Initialization Logic (Level 0 -> 1)
        const key = WEAPON_STAT_MAP[id];
        const isNewUnlock = key && stats.weapon[key] === 0;

        if (isNewUnlock) {
            // First time unlock: Set base stats
            stats.weapon[key] = 1;
            stats.activeWeaponIds.push(id);
            
            // Apply Base Constants for Level 1
            if (id === 'CANNON') {
                stats.weapon.cannonDamage = UPGRADE_BASES.CANNON_DMG;
                stats.weapon.cannonFireRate = UPGRADE_BASES.CANNON_FIRE_RATE;
            } else if (id === 'AURA') {
                stats.weapon.auraDamage = UPGRADE_BASES.AURA_DMG;
                stats.weapon.auraRadius = UPGRADE_BASES.AURA_RADIUS;
            } else if (id === 'MINES') {
                stats.weapon.mineDamage = UPGRADE_BASES.MINE_DMG;
                stats.weapon.mineDropRate = UPGRADE_BASES.MINE_RATE;
                stats.weapon.mineRadius = 2.5;
            } else if (id === 'LIGHTNING') {
                stats.weapon.chainLightningDamage = UPGRADE_BASES.LIGHTNING_DMG;
                stats.weapon.chainLightningRange = UPGRADE_BASES.LIGHTNING_RANGE;
            } else if (id === 'NANO_SWARM') {
                stats.weapon.nanoSwarmDamage = UPGRADE_BASES.NANO_DMG;
                stats.weapon.nanoSwarmCount = 1;
            } else if (id === 'PRISM_LANCE') {
                stats.weapon.prismLanceDamage = UPGRADE_BASES.PRISM_DMG;
            } else if (id === 'NEON_SCATTER') {
                stats.weapon.neonScatterDamage = UPGRADE_BASES.SCATTER_DMG;
            } else if (id === 'VOLT_SERPENT') {
                stats.weapon.voltSerpentDamage = UPGRADE_BASES.SERPENT_DMG;
            } else if (id === 'PHASE_RAIL') {
                stats.weapon.phaseRailDamage = UPGRADE_BASES.RAIL_DMG;
            }
        } else {
            // Standard Level Up: Apply Scaling
            applyWeaponGrowth(stats.weapon, id, rarity);
        }
    }

    if (pendingStatusRef.current) {
        setStatus(pendingStatusRef.current);
        pendingStatusRef.current = null;
    } else {
        if (settings.skipCountdown) {
            setStatus(GameStatus.RESUMING); // Will instant transition if count is 0
        } else {
            setResumeCountdown(3);
            setStatus(GameStatus.RESUMING);
        }
    }
    
    // Play sound based on rarity
    if (rarity === 'MEGA_RARE' || rarity === 'OVERCLOCKED') {
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
