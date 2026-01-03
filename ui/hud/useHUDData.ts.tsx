
import { useMemo } from 'react';
import { useGameState } from '../../game/useGameState';
import { DIFFICULTY_CONFIGS, STAMINA_CONFIG } from '../../constants';
import { useVisionProtocol } from '../vision/useVisionProtocol';
import { HUDData, HUDSkillData } from './types';
import { DESCRIPTOR_REGISTRY } from '../../game/descriptors';

export function useHUDData(game: ReturnType<typeof useGameState>): HUDData {
  const { 
    uiScore, highScore, uiCombo, uiLevel, uiXp, uiXpValues, uiStage, uiStageStatus,
    uiStats, uiShield, difficulty, status, statsRef, snakeRef,
    weaponFireTimerRef, mineDropTimerRef,
    prismLanceTimerRef, neonScatterTimerRef, voltSerpentTimerRef, phaseRailChargeRef,
    staminaRef
  } = game;

  const vision = useVisionProtocol();

  return useMemo(() => {
    // 1. Map Weapons
    const weapons: HUDSkillData[] = uiStats.activeWeapons.map(id => {
      const desc = DESCRIPTOR_REGISTRY[id];
      let cooldown = 1; // Default to Ready (1.0) for passives like AURA, LIGHTNING, NANO_SWARM
      
      const stats = statsRef.current;
      const fireRateMod = stats.globalFireRateMod;

      // Calculate readiness (0 = Just fired, 1 = Ready)
      // Note: Timers in useCombat accumulate UP to the threshold.
      if (id === 'CANNON') {
         const max = stats.weapon.cannonFireRate / fireRateMod;
         cooldown = weaponFireTimerRef.current / max;
      } else if (id === 'MINES') {
         const max = stats.weapon.mineDropRate / fireRateMod;
         cooldown = mineDropTimerRef.current / max;
      } else if (id === 'PRISM_LANCE') {
         const max = 2000 / fireRateMod;
         cooldown = prismLanceTimerRef.current / max;
      } else if (id === 'NEON_SCATTER') {
         const max = 1200 / fireRateMod;
         cooldown = neonScatterTimerRef.current / max;
      } else if (id === 'VOLT_SERPENT') {
         const max = 3000 / fireRateMod;
         cooldown = voltSerpentTimerRef.current / max;
      } else if (id === 'PHASE_RAIL') {
         const max = 4000 / fireRateMod;
         cooldown = phaseRailChargeRef.current / max;
      }

      return {
        id,
        label: desc?.name || id,
        level: uiStats.weaponLevels[id] || 1,
        cooldownPct: Math.max(0, Math.min(1, cooldown)),
        active: true,
        icon: desc?.icon || '?',
        description: desc?.description
      };
    });

    // 2. Map Utilities
    const utilities: HUDSkillData[] = statsRef.current.acquiredUpgradeIds
      .filter(id => ['SHIELD', 'NEURAL_MAGNET', 'GHOST_COIL', 'REFLECTOR_MESH'].includes(id))
      .map(id => {
        const desc = DESCRIPTOR_REGISTRY[id];
        return {
          id,
          label: desc?.name || id,
          level: 1,
          cooldownPct: 0,
          active: true,
          icon: desc?.icon || '?',
          description: desc?.description
        };
      });

    const head = snakeRef.current[0] || { x: 0, y: 0 };
    
    // Calculate Stamina Percentage
    const staminaPct = Math.min(100, Math.max(0, (staminaRef.current / STAMINA_CONFIG.MAX) * 100));

    return {
      status,
      headPosition: { x: head.x, y: head.y },
      score: {
        current: Math.floor(uiScore),
        high: highScore,
        combo: uiCombo
      },
      threat: {
        label: DIFFICULTY_CONFIGS[difficulty].label,
        colorClass: DIFFICULTY_CONFIGS[difficulty].color,
        level: difficulty
      },
      progression: {
        level: uiLevel,
        xp: uiXpValues.current,
        xpMax: uiXpValues.max,
        stage: uiStage,
        stageLabel: uiStageStatus || 'IN PROGRESS'
      },
      vitals: {
        integrity: Math.floor(uiStats.tailIntegrity),
        shieldActive: uiShield,
        stamina: staminaPct
      },
      metrics: {
        damage: Math.round(uiStats.globalDamage * 100),
        fireRate: Math.round(uiStats.globalFireRate * 100),
        range: Math.round(uiStats.globalArea * 100),
        crit: Math.round(uiStats.critChance * 100)
      },
      loadout: {
        weapons,
        utilities,
        maxWeaponSlots: uiStats.maxWeaponSlots
      },
      visibility: {
        showScore: true,
        showWeapons: vision.layout.showWeaponBar,
        showMetrics: vision.layout.showMetrics,
        showControls: true
      }
    };
  }, [
    uiScore, highScore, uiCombo, uiLevel, uiXp, uiXpValues, uiStage, uiStageStatus,
    uiStats, uiShield, difficulty, status, vision,
    weaponFireTimerRef.current, mineDropTimerRef.current, prismLanceTimerRef.current,
    neonScatterTimerRef.current, voltSerpentTimerRef.current, phaseRailChargeRef.current,
    snakeRef.current[0],
    staminaRef.current
  ]);
}
