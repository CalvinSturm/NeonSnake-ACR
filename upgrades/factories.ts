
import { UpgradeOption, UpgradeRarity } from '../types';
import { UpgradeContext, UpgradeId } from './types';
import { DESCRIPTOR_REGISTRY } from '../game/descriptors';
import { UPGRADE_BASES, RARITY_MULTIPLIERS, WEAPON_GROWTH_CONFIG } from '../constants';
import { WeaponStats } from '../types';

// Formatting helpers
const formatPct = (val: number) => `+${(val * 100).toFixed(1)}%`;
const formatFlat = (val: number) => `+${val.toFixed(1)}`;

// Unified Weapon Growth Display
const getWeaponStatsDisplay = (stats: WeaponStats, id: UpgradeId, rarityMod: number) => {
  switch (id) {
    case 'CANNON':
      return [
        `Lv${stats.cannonLevel}: ${formatPct(stats.cannonDamage / UPGRADE_BASES.CANNON_DMG - 1)} Damage`,
        `${formatPct(1 - stats.cannonFireRate / UPGRADE_BASES.CANNON_FIRE_RATE)} Fire Rate`,
        `Projectiles: ${stats.cannonProjectileCount}`
      ];
    case 'AURA':
      return [
        `Lv${stats.auraLevel}: ${formatPct(stats.auraDamage / UPGRADE_BASES.AURA_DMG - 1)} Damage`,
        `Radius: ${stats.auraRadius.toFixed(1)}`
      ];
    case 'MINES':
      return [
        `Lv${stats.mineLevel}: ${formatPct(stats.mineDamage / UPGRADE_BASES.MINE_DMG - 1)} Damage`,
        `Drop Rate: ${formatPct(stats.mineDropRate / UPGRADE_BASES.MINE_RATE - 1)}`,
        `Radius: ${stats.mineRadius.toFixed(1)}`
      ];
    case 'LIGHTNING':
      return [
        `Lv${stats.chainLightningLevel}: ${formatPct(stats.chainLightningDamage / UPGRADE_BASES.LIGHTNING_DMG - 1)} Damage`,
        `Range: ${stats.chainLightningRange.toFixed(1)}`
      ];
    case 'NANO_SWARM':
      return [
        `Lv${stats.nanoSwarmLevel}: ${formatPct(stats.nanoSwarmDamage / UPGRADE_BASES.NANO_DMG - 1)} Damage`,
        `Drones: ${stats.nanoSwarmCount}`
      ];
    case 'PRISM_LANCE':
      return [`Lv${stats.prismLanceLevel}: ${formatPct(stats.prismLanceDamage / UPGRADE_BASES.PRISM_DMG - 1)} Damage`];
    case 'NEON_SCATTER':
      return [`Lv${stats.neonScatterLevel}: ${formatPct(stats.neonScatterDamage / UPGRADE_BASES.SCATTER_DMG - 1)} Damage`];
    case 'VOLT_SERPENT':
      return [`Lv${stats.voltSerpentLevel}: ${formatPct(stats.voltSerpentDamage / UPGRADE_BASES.SERPENT_DMG - 1)} Damage`];
    case 'PHASE_RAIL':
      return [`Lv${stats.phaseRailLevel}: ${formatPct(stats.phaseRailDamage / UPGRADE_BASES.RAIL_DMG - 1)} Damage`];
    default:
      return [];
  }
};

// Create Upgrade Option
export const createOption = (
  id: UpgradeId,
  rarity: UpgradeRarity,
  context: UpgradeContext
): UpgradeOption => {
  const desc = DESCRIPTOR_REGISTRY[id];
  if (!desc) {
    return {
      id,
      title: 'UNKNOWN UPGRADE',
      description: 'Data corrupted.',
      color: 'text-gray-500',
      category: 'SYSTEM',
      rarity: 'COMMON',
      icon: '?',
      stats: ['ERROR']
    };
  }

  const mod = RARITY_MULTIPLIERS[rarity] || 1.0;
  let stats: string[] = [];

  // Scalars / Utility
  switch (id) {
    case 'SCALAR_DAMAGE':
      stats.push(`${formatPct(UPGRADE_BASES.SCALAR_DAMAGE * mod)} Damage`);
      break;
    case 'SCALAR_FIRE_RATE':
      stats.push(`${formatPct(UPGRADE_BASES.SCALAR_FIRE_RATE * mod)} Fire Rate`);
      break;
    case 'SCALAR_AREA':
      stats.push(`${formatPct(UPGRADE_BASES.SCALAR_AREA * mod)} Area`);
      break;
    case 'CRITICAL':
      stats.push(`${formatPct(UPGRADE_BASES.CRIT_CHANCE * mod)} Crit Chance`);
      stats.push(`${formatPct(UPGRADE_BASES.CRIT_MULT * mod)} Crit Multiplier`);
      break;
    case 'FOOD':
      stats.push(`${formatPct(UPGRADE_BASES.FOOD_QUALITY * mod)} Food Quality`);
      break;
    case 'TERMINAL_PROTOCOL':
      stats.push(`${formatPct(UPGRADE_BASES.HACK_SPEED * mod)} Hack Speed`);
      break;
    case 'LUCK':
      stats.push(`${formatPct(UPGRADE_BASES.LUCK * mod)} Rarity Chance`);
      break;
  }

  // Weapons
  if (desc.category === 'WEAPON') {
    stats.push(...getWeaponStatsDisplay(context.weapon, id, mod));
  }

  // Special Overclock
  if (id === 'OVERCLOCK' && rarity === 'OVERCLOCKED') {
    stats.push('+1 Weapon Slot', 'UNSANCTIONED');
  }

  return {
    id: desc.id,
    title: desc.name,
    description: desc.description,
    color: desc.color,
    category: desc.category,
    rarity,
    icon: desc.icon,
    stats
  };
};

export const UPGRADE_DEFINITIONS: Record<string, (context: UpgradeContext, rarity: UpgradeRarity) => UpgradeOption> = {
  CANNON: (c, r) => createOption('CANNON', r, c),
  AURA: (c, r) => createOption('AURA', r, c),
  MINES: (c, r) => createOption('MINES', r, c),
  LIGHTNING: (c, r) => createOption('LIGHTNING', r, c),
  NANO_SWARM: (c, r) => createOption('NANO_SWARM', r, c),
  SHIELD: (c, r) => createOption('SHIELD', r, c),
  CRITICAL: (c, r) => createOption('CRITICAL', r, c),
  FOOD: (c, r) => createOption('FOOD', r, c),
  PRISM_LANCE: (c, r) => createOption('PRISM_LANCE', r, c),
  NEON_SCATTER: (c, r) => createOption('NEON_SCATTER', r, c),
  VOLT_SERPENT: (c, r) => createOption('VOLT_SERPENT', r, c),
  PHASE_RAIL: (c, r) => createOption('PHASE_RAIL', r, c),
  REFLECTOR_MESH: (c, r) => createOption('REFLECTOR_MESH', r, c),
  GHOST_COIL: (c, r) => createOption('GHOST_COIL', r, c),
  NEURAL_MAGNET: (c, r) => createOption('NEURAL_MAGNET', r, c),
  OVERCLOCK: (c, r) => createOption('OVERCLOCK', r, c),
  ECHO_CACHE: (c, r) => createOption('ECHO_CACHE', r, c),
  TERMINAL_PROTOCOL: (c, r) => createOption('TERMINAL_PROTOCOL', r, c),
  OVERRIDE_PROTOCOL: (c, r) => createOption('OVERRIDE_PROTOCOL', r, c),
  SCALAR_DAMAGE: (c, r) => createOption('SCALAR_DAMAGE', r, c),
  SCALAR_FIRE_RATE: (c, r) => createOption('SCALAR_FIRE_RATE', r, c),
  SCALAR_AREA: (c, r) => createOption('SCALAR_AREA', r, c),
  LUCK: (c, r) => createOption('LUCK', r, c)
};
