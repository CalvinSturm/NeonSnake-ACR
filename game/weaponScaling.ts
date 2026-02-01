
import { WeaponStats, UpgradeRarity } from '../types';
import { UpgradeId } from '../upgrades/types';
import { WEAPON_GROWTH_CONFIG, RARITY_MULTIPLIERS } from '../constants';

const RARITY_MODIFIER_COUNT: Record<string, number> = {
  'COMMON': 1,
  'UNCOMMON': 2,
  'RARE': 3,
  'ULTRA_RARE': 4,
  'MEGA_RARE': 5,
  'LEGENDARY': 5,
  'OVERCLOCKED': 5
};

export const applyWeaponGrowth = (stats: WeaponStats, id: UpgradeId, rarity: UpgradeRarity) => {
  const iterations = RARITY_MODIFIER_COUNT[rarity] || 1;
  const rarityMod = RARITY_MULTIPLIERS[rarity] || 1.0;

  for (let i = 0; i < iterations; i++) {
    switch (id) {
      case 'CANNON':
        stats.cannonLevel++;
        stats.cannonDamage = Math.ceil(stats.cannonDamage * (1 + WEAPON_GROWTH_CONFIG.CANNON * rarityMod));
        stats.cannonFireRate = Math.max(50, stats.cannonFireRate * (1 - 0.05 * rarityMod));
        if (stats.cannonLevel % 5 === 0) stats.cannonProjectileCount++;
        break;

      case 'AURA':
        stats.auraLevel++;
        stats.auraDamage = Math.ceil(stats.auraDamage * (1 + WEAPON_GROWTH_CONFIG.AURA * rarityMod));
        stats.auraRadius += 0.2 * rarityMod;
        break;

      case 'MINES':
        stats.mineLevel++;
        stats.mineDamage = Math.ceil(stats.mineDamage * (1 + WEAPON_GROWTH_CONFIG.MINES * rarityMod));
        stats.mineDropRate = Math.max(500, stats.mineDropRate * (1 - 0.05 * rarityMod));
        stats.mineRadius += 0.1 * rarityMod;
        break;

      case 'LIGHTNING':
        stats.chainLightningLevel++;
        stats.chainLightningDamage = Math.ceil(stats.chainLightningDamage * (1 + WEAPON_GROWTH_CONFIG.LIGHTNING * rarityMod));
        stats.chainLightningRange += 0.5 * rarityMod;
        break;

      case 'NANO_SWARM':
        stats.nanoSwarmLevel++;
        stats.nanoSwarmDamage = Math.ceil(stats.nanoSwarmDamage * (1 + WEAPON_GROWTH_CONFIG.NANO_SWARM * rarityMod));
        stats.nanoSwarmCount += 1;
        break;

      case 'PRISM_LANCE':
        stats.prismLanceLevel++;
        stats.prismLanceDamage = Math.ceil(stats.prismLanceDamage * (1 + WEAPON_GROWTH_CONFIG.PRISM_LANCE * rarityMod));
        break;

      case 'NEON_SCATTER':
        stats.neonScatterLevel++;
        stats.neonScatterDamage = Math.ceil(stats.neonScatterDamage * (1 + WEAPON_GROWTH_CONFIG.NEON_SCATTER * rarityMod));
        break;

      case 'VOLT_SERPENT':
        stats.voltSerpentLevel++;
        stats.voltSerpentDamage = Math.ceil(stats.voltSerpentDamage * (1 + WEAPON_GROWTH_CONFIG.VOLT_SERPENT * rarityMod));
        break;

      case 'PHASE_RAIL':
        stats.phaseRailLevel++;
        stats.phaseRailDamage = Math.ceil(stats.phaseRailDamage * (1 + WEAPON_GROWTH_CONFIG.PHASE_RAIL * rarityMod));
        break;

      // Utilities
      case 'REFLECTOR_MESH': stats.reflectorMeshLevel++; break;
      case 'GHOST_COIL': stats.ghostCoilLevel++; break;
      case 'NEURAL_MAGNET': stats.neuralMagnetLevel++; break;
      case 'OVERCLOCK': stats.overclockLevel++; break;
      case 'ECHO_CACHE': stats.echoCacheLevel++; break;
      case 'LUCK': stats.luckLevel++; break;
    }
  }
};
