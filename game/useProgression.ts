
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { UpgradeId } from '../upgrades/types';
import { XP_TO_LEVEL_UP, PASSIVE_SCORE_PER_SEC, COMBO_WINDOW, DIFFICULTY_CONFIGS, RARITY_MULTIPLIERS, UPGRADE_BASES } from '../constants';
import { UPGRADE_DEFINITIONS } from '../upgrades/factories';
import { GameStatus, Difficulty, WeaponStats, TerminalType, EnemyType, UpgradeRarity } from '../types';
import { DESCRIPTOR_REGISTRY } from './descriptors';

export interface ProgressionAPI {
  applyUpgrade: (id: UpgradeId, rarity?: UpgradeRarity) => void;
  onEnemyDefeated: (data: { xp: number }) => void;
  onFoodConsumed: (data: { type: string, byMagnet: boolean, value?: number }) => void;
  onTerminalHacked: (type: TerminalType) => void;
  applyPassiveScore: (dt: number) => void;
  unlockNextDifficulty: () => void;
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
  ECHO_CACHE: 'echoCacheLevel'
};

// Rolling Logic
const rollRarity = (id: UpgradeId): UpgradeRarity => {
    // Overclock Exception: Small chance to break limits
    if (id === 'OVERCLOCK') {
        if (Math.random() < 0.05) return 'OVERCLOCKED';
    }

    const r = Math.random();
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
    enemiesRef // Access enemies for Override effects
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
            // 🎲 ROLL RARITY HERE
            const rarity = rollRarity(pickedId);
            options.push(UPGRADE_DEFINITIONS[pickedId](context, rarity));
            currentPool = currentPool.filter(id => id !== pickedId);
        }
    } 
    
    while (options.length < 3) {
         const rarity = rollRarity('SCALAR_DAMAGE');
         options.push(UPGRADE_DEFINITIONS['SCALAR_DAMAGE'](context, rarity));
    }
    
    setUpgradeOptions(options);
  }, [setStatus, audioEventsRef, levelRef, difficulty, uiCombo, statsRef, setUpgradeOptions]);

  // 🔒 RESTORED XP AUTHORITY
  const gainXp = useCallback((amount: number) => {
      // Invariant 1: Always increment XP
      xpRef.current += amount;
      
      // Temporary Debug Assertion
      if (process.env.NODE_ENV === 'development' && xpRef.current > 0 && uiXp === 0) {
          console.warn('[INVARIANT VIOLATION] XP gained but UI not updating. uiXp:', uiXp, 'xpRef:', xpRef.current);
      }

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
  }, [xpRef, nextLevelXpRef, levelRef, setUiLevel, setUiXp, levelUp, uiXp]);

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

  const onTerminalHacked = useCallback((type: TerminalType) => {
      // 🔒 AUTHORITATIVE TERMINAL REWARD HANDLER
      // Terminals grant rewards based on TYPE. 
      // FOOD DROPS ARE STRICTLY FORBIDDEN FROM THIS PATH.
      
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

  }, [scoreRef, statsRef, stageScoreRef, setUiScore, gainXp, enemiesRef]);

  const applyPassiveScore = useCallback((dt: number) => {
      const inc = PASSIVE_SCORE_PER_SEC * (dt / 1000) * statsRef.current.scoreMultiplier;
      scoreRef.current += inc;
      stageScoreRef.current += inc;
      setUiScore(Math.floor(scoreRef.current));
      
      if (uiCombo > 0 && gameTimeRef.current - lastEatTimeRef.current > COMBO_WINDOW) {
          setUiCombo(0);
      }
  }, [statsRef, scoreRef, stageScoreRef, setUiScore, uiCombo, gameTimeRef, lastEatTimeRef, setUiCombo]);

  // 💡 UPGRADE APPLICATION (WITH RARITY SCALING)
  const applyUpgrade = useCallback((id: UpgradeId, rarity: UpgradeRarity = 'COMMON') => {
    const stats = statsRef.current;
    
    // Apply stats scalar based on rarity
    const mod = RARITY_MULTIPLIERS[rarity] || 1.0;
    
    stats.acquiredUpgradeIds.push(id);

    // 🛠️ OVERCLOCK EXCEPTION LOGIC
    if (id === 'OVERCLOCK' && rarity === 'OVERCLOCKED') {
        stats.maxWeaponSlots = Math.min(UPGRADE_BASES.MAX_WEAPON_SLOTS, stats.maxWeaponSlots + 1);
        // Also apply the base overclock level bump below
    }

    switch (id) {
      // ── SCALARS ──
      case 'SCALAR_DAMAGE':
        stats.globalDamageMod += UPGRADE_BASES.SCALAR_DAMAGE * mod;
        break;
      case 'SCALAR_FIRE_RATE':
        stats.globalFireRateMod += UPGRADE_BASES.SCALAR_FIRE_RATE * mod;
        break;
      case 'SCALAR_AREA':
        stats.globalAreaMod += UPGRADE_BASES.SCALAR_AREA * mod;
        break;
      
      // ── WEAPONS (Mod scales damage or stats) ──
      case 'CANNON':
        stats.weapon.cannonLevel++;
        stats.weapon.cannonDamage += UPGRADE_BASES.CANNON_DMG * mod;
        // Fire rate improvements diminish
        stats.weapon.cannonFireRate = Math.max(100, stats.weapon.cannonFireRate - (UPGRADE_BASES.CANNON_FIRE_RATE_REDUCTION * mod));
        if (stats.weapon.cannonLevel >= 5 && stats.weapon.cannonLevel % 5 === 0) stats.weapon.cannonProjectileCount++;
        if (!stats.activeWeaponIds.includes('CANNON')) stats.activeWeaponIds.push('CANNON');
        break;
      case 'AURA':
        stats.weapon.auraLevel++;
        stats.weapon.auraRadius += UPGRADE_BASES.AURA_RADIUS * mod;
        stats.weapon.auraDamage += UPGRADE_BASES.AURA_DMG * mod;
        if (!stats.activeWeaponIds.includes('AURA')) stats.activeWeaponIds.push('AURA');
        break;
      case 'MINES':
        stats.weapon.mineLevel++;
        stats.weapon.mineDamage += UPGRADE_BASES.MINE_DMG * mod;
        stats.weapon.mineDropRate = Math.max(500, stats.weapon.mineDropRate - (UPGRADE_BASES.MINE_RATE_REDUCTION * mod));
        if (!stats.activeWeaponIds.includes('MINES')) stats.activeWeaponIds.push('MINES');
        break;
      case 'LIGHTNING':
        stats.weapon.chainLightningLevel++;
        stats.weapon.chainLightningDamage += UPGRADE_BASES.LIGHTNING_DMG * mod; 
        stats.weapon.chainLightningRange += UPGRADE_BASES.LIGHTNING_RANGE * mod;
        if (!stats.activeWeaponIds.includes('LIGHTNING')) stats.activeWeaponIds.push('LIGHTNING');
        break;
      case 'NANO_SWARM':
        stats.weapon.nanoSwarmLevel++;
        stats.weapon.nanoSwarmCount += 1; 
        stats.weapon.nanoSwarmDamage += UPGRADE_BASES.NANO_DMG * mod;
        if (!stats.activeWeaponIds.includes('NANO_SWARM')) stats.activeWeaponIds.push('NANO_SWARM');
        break;
      case 'PRISM_LANCE':
        stats.weapon.prismLanceLevel++;
        stats.weapon.prismLanceDamage += UPGRADE_BASES.PRISM_DMG * mod;
        if (!stats.activeWeaponIds.includes('PRISM_LANCE')) stats.activeWeaponIds.push('PRISM_LANCE');
        break;
      case 'NEON_SCATTER':
        stats.weapon.neonScatterLevel++;
        stats.weapon.neonScatterDamage += UPGRADE_BASES.SCATTER_DMG * mod;
        if (!stats.activeWeaponIds.includes('NEON_SCATTER')) stats.activeWeaponIds.push('NEON_SCATTER');
        break;
      case 'VOLT_SERPENT':
        stats.weapon.voltSerpentLevel++;
        stats.weapon.voltSerpentDamage += UPGRADE_BASES.SERPENT_DMG * mod;
        if (!stats.activeWeaponIds.includes('VOLT_SERPENT')) stats.activeWeaponIds.push('VOLT_SERPENT');
        break;
      case 'PHASE_RAIL':
        stats.weapon.phaseRailLevel++;
        stats.weapon.phaseRailDamage += UPGRADE_BASES.RAIL_DMG * mod;
        if (!stats.activeWeaponIds.includes('PHASE_RAIL')) stats.activeWeaponIds.push('PHASE_RAIL');
        break;
        
      // ── UTILITY / PASSIVE ──
      case 'SHIELD':
        stats.shieldActive = true;
        setUiShield(true);
        break;
      case 'CRITICAL':
        stats.critChance += UPGRADE_BASES.CRIT_CHANCE * mod;
        stats.critMultiplier += UPGRADE_BASES.CRIT_MULT * mod;
        break;
      case 'FOOD':
        stats.foodQualityMod += UPGRADE_BASES.FOOD_QUALITY * mod;
        break;
      case 'REFLECTOR_MESH':
        stats.weapon.reflectorMeshLevel++;
        break;
      case 'GHOST_COIL':
        stats.weapon.ghostCoilLevel++;
        break;
      case 'NEURAL_MAGNET':
        stats.weapon.neuralMagnetLevel++;
        break;
      case 'OVERCLOCK':
        stats.weapon.overclockLevel++;
        break;
      case 'ECHO_CACHE':
        stats.weapon.echoCacheLevel++;
        break;
      case 'TERMINAL_PROTOCOL':
        stats.hackSpeedMod *= (1 + (UPGRADE_BASES.HACK_SPEED * mod)); 
        stats.scoreMultiplier += UPGRADE_BASES.SCORE_MULT * mod;
        break;
      case 'OVERRIDE_PROTOCOL':
        stats.maxWeaponSlots = Math.min(4, stats.maxWeaponSlots + 1);
        break;
    }

    if (pendingStatusRef.current) {
        setStatus(pendingStatusRef.current);
        pendingStatusRef.current = null;
    } else {
        setStatus(GameStatus.RESUMING);
    }
    
    // Play sound based on rarity
    if (rarity === 'MEGA_RARE' || rarity === 'OVERCLOCKED') {
        audioEventsRef.current.push({ type: 'BONUS' });
    } else {
        audioEventsRef.current.push({ type: 'POWER_UP' });
    }
    
  }, [statsRef, pendingStatusRef, setStatus, setUiShield, audioEventsRef]);

  return {
    applyUpgrade,
    onEnemyDefeated,
    onFoodConsumed,
    onTerminalHacked,
    applyPassiveScore,
    unlockNextDifficulty
  };
}
