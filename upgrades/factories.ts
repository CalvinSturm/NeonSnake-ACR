
import { UpgradeOption, UpgradeRarity } from '../types';
import { UpgradeContext, UpgradeId } from './types';
import { DESCRIPTOR_REGISTRY } from '../game/descriptors';
import { UPGRADE_BASES, RARITY_MULTIPLIERS } from '../constants';

const formatPct = (val: number) => `+${Math.round(val * 100)}%`;
const formatFlat = (val: number) => `+${Math.round(val)}`;

const createOption = (id: UpgradeId, rarity: UpgradeRarity): UpgradeOption => {
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

    // SPECIAL EXCEPTION: OVERCLOCKED
    if (id === 'OVERCLOCK' && rarity === 'OVERCLOCKED') {
        return {
            id: desc.id,
            title: 'OVERCLOCK // BREAK',
            description: desc.description,
            color: 'text-red-500',
            category: desc.category,
            rarity,
            icon: desc.icon,
            stats: ['+1 WEAPON SLOT', 'UNSANCTIONED']
        };
    }

    const mod = RARITY_MULTIPLIERS[rarity] || 1.0;
    const stats: string[] = [];

    // DATA INJECTION (Normalized Grammar)
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
        
        // WEAPONS
        case 'CANNON':
            stats.push(`${formatFlat(UPGRADE_BASES.CANNON_DMG * mod)} Damage`);
            stats.push(`-${Math.round(UPGRADE_BASES.CANNON_FIRE_RATE_REDUCTION * mod)}ms Cooldown`);
            break;
        case 'AURA':
            stats.push(`${formatFlat(UPGRADE_BASES.AURA_DMG * mod)} Damage`);
            stats.push(`${formatFlat(UPGRADE_BASES.AURA_RADIUS * mod)} Radius`);
            break;
        case 'MINES':
            stats.push(`${formatFlat(UPGRADE_BASES.MINE_DMG * mod)} Damage`);
            stats.push(`-${Math.round(UPGRADE_BASES.MINE_RATE_REDUCTION * mod)}ms Cooldown`);
            break;
        case 'LIGHTNING':
            stats.push(`${formatPct(UPGRADE_BASES.LIGHTNING_DMG * mod)} Chain Damage`);
            break;
        case 'NANO_SWARM':
            stats.push(`${formatFlat(UPGRADE_BASES.NANO_DMG * mod)} Damage`);
            stats.push(`+1 Drone Unit`);
            break;
        case 'PRISM_LANCE':
            stats.push(`${formatFlat(UPGRADE_BASES.PRISM_DMG * mod)} Damage`);
            break;
        case 'NEON_SCATTER':
            stats.push(`${formatFlat(UPGRADE_BASES.SCATTER_DMG * mod)} Damage`);
            break;
        case 'VOLT_SERPENT':
            stats.push(`${formatFlat(UPGRADE_BASES.SERPENT_DMG * mod)} Damage`);
            break;
        case 'PHASE_RAIL':
            stats.push(`${formatFlat(UPGRADE_BASES.RAIL_DMG * mod)} Damage`);
            break;
    }

    return {
        id: desc.id,
        title: desc.name,
        description: desc.description,
        color: desc.color,
        category: desc.category,
        rarity: rarity,
        icon: desc.icon,
        stats: stats
    };
};

export const UPGRADE_DEFINITIONS: Record<string, (context: UpgradeContext, rarity: UpgradeRarity) => UpgradeOption> = {
  CANNON: (c, r) => createOption('CANNON', r),
  AURA: (c, r) => createOption('AURA', r),
  MINES: (c, r) => createOption('MINES', r),
  LIGHTNING: (c, r) => createOption('LIGHTNING', r),
  NANO_SWARM: (c, r) => createOption('NANO_SWARM', r),
  SHIELD: (c, r) => createOption('SHIELD', r),
  CRITICAL: (c, r) => createOption('CRITICAL', r),
  FOOD: (c, r) => createOption('FOOD', r),
  PRISM_LANCE: (c, r) => createOption('PRISM_LANCE', r),
  NEON_SCATTER: (c, r) => createOption('NEON_SCATTER', r),
  VOLT_SERPENT: (c, r) => createOption('VOLT_SERPENT', r),
  PHASE_RAIL: (c, r) => createOption('PHASE_RAIL', r),
  REFLECTOR_MESH: (c, r) => createOption('REFLECTOR_MESH', r),
  GHOST_COIL: (c, r) => createOption('GHOST_COIL', r),
  NEURAL_MAGNET: (c, r) => createOption('NEURAL_MAGNET', r),
  OVERCLOCK: (c, r) => createOption('OVERCLOCK', r),
  ECHO_CACHE: (c, r) => createOption('ECHO_CACHE', r),
  TERMINAL_PROTOCOL: (c, r) => createOption('TERMINAL_PROTOCOL', r),
  OVERRIDE_PROTOCOL: (c, r) => createOption('OVERRIDE_PROTOCOL', r),
  SCALAR_DAMAGE: (c, r) => createOption('SCALAR_DAMAGE', r),
  SCALAR_FIRE_RATE: (c, r) => createOption('SCALAR_FIRE_RATE', r),
  SCALAR_AREA: (c, r) => createOption('SCALAR_AREA', r),
  LUCK: (c, r) => createOption('LUCK', r)
};
