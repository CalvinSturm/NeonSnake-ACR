
import { UpgradeCategory, UpgradeRarity } from '../types';

export interface Descriptor {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  icon: string;
  color: string;
  maxLevel?: number;
}

export const DESCRIPTOR_REGISTRY: Record<string, Descriptor> = {
  // WEAPONS (Max Level 10)
  CANNON: { id: 'CANNON', name: 'AUTO CANNON', description: 'Automated kinetic projectile system. Targets nearest threat.', category: 'WEAPON', rarity: 'COMMON', icon: '🔫', color: 'text-yellow-400', maxLevel: 10 },
  AURA: { id: 'AURA', name: 'TAIL AURA', description: 'High-voltage field coating your tail segments. Damages contacting enemies.', category: 'WEAPON', rarity: 'RARE', icon: '⭕', color: 'text-red-400', maxLevel: 10 },
  MINES: { id: 'MINES', name: 'PLASMA MINES', description: 'Deploys proximity mines from tail end. High area damage.', category: 'WEAPON', rarity: 'RARE', icon: '💣', color: 'text-orange-400', maxLevel: 10 },
  LIGHTNING: { id: 'LIGHTNING', name: 'VOLT ARC', description: 'Attacks chain electrical damage to multiple nearby targets.', category: 'WEAPON', rarity: 'RARE', icon: '⚡', color: 'text-cyan-400', maxLevel: 10 },
  NANO_SWARM: { id: 'NANO_SWARM', name: 'NANO SWARM', description: 'Autonomous drones orbit your position, intercepting enemies.', category: 'WEAPON', rarity: 'LEGENDARY', icon: '🛰️', color: 'text-pink-400', maxLevel: 10 },
  PRISM_LANCE: { id: 'PRISM_LANCE', name: 'PRISM LANCE', description: 'Fires a high-velocity beam that pierces through multiple enemies.', category: 'WEAPON', rarity: 'RARE', icon: '💎', color: 'text-teal-300', maxLevel: 10 },
  NEON_SCATTER: { id: 'NEON_SCATTER', name: 'NEON SCATTER', description: 'Discharges a shotgun-style burst of energy shards.', category: 'WEAPON', rarity: 'RARE', icon: '🎆', color: 'text-pink-500', maxLevel: 10 },
  VOLT_SERPENT: { id: 'VOLT_SERPENT', name: 'VOLT SERPENT', description: 'Projects a homing energy entity that hunts targets.', category: 'WEAPON', rarity: 'LEGENDARY', icon: '🐉', color: 'text-blue-500', maxLevel: 10 },
  PHASE_RAIL: { id: 'PHASE_RAIL', name: 'PHASE RAIL', description: 'Charges a massive railgun shot. Devastating damage in a line.', category: 'WEAPON', rarity: 'LEGENDARY', icon: '🔦', color: 'text-purple-500', maxLevel: 10 },
  
  // DEFENSE & UTILITY (Unique or Limited Stacking)
  SHIELD: { id: 'SHIELD', name: 'ION SHIELD', description: 'Absorbs one lethal hit or collision. Regenerates each stage.', category: 'DEFENSE', rarity: 'RARE', icon: '🛡️', color: 'text-cyan-400', maxLevel: 1 },
  REFLECTOR_MESH: { id: 'REFLECTOR_MESH', name: 'REFLECTOR MESH', description: 'Chance to reflect enemy projectiles back at the source.', category: 'DEFENSE', rarity: 'RARE', icon: '📡', color: 'text-cyan-200', maxLevel: 5 },
  GHOST_COIL: { id: 'GHOST_COIL', name: 'GHOST COIL', description: 'Grant temporary intangibility (phasing) after taking damage.', category: 'DEFENSE', rarity: 'RARE', icon: '👻', color: 'text-gray-300', maxLevel: 3 },
  LUCK: { id: 'LUCK', name: 'RNG MANIPULATOR', description: 'Increases probability of high-rarity system upgrades.', category: 'UTILITY', rarity: 'RARE', icon: '🎲', color: 'text-green-300', maxLevel: 5 },
  
  // SYSTEM & PASSIVE
  FOOD: { id: 'FOOD', name: 'SYNTHETIC ENZYMES', description: 'Enhances healing and XP gain from consuming data.', category: 'ECONOMY', rarity: 'COMMON', icon: '💊', color: 'text-green-400', maxLevel: 999 },
  NEURAL_MAGNET: { id: 'NEURAL_MAGNET', name: 'NEURAL MAGNET', description: 'Eliminating enemies magnetically attracts nearby loot.', category: 'UTILITY', rarity: 'COMMON', icon: '🧲', color: 'text-indigo-400', maxLevel: 5 },
  OVERCLOCK: { id: 'OVERCLOCK', name: 'OVERCLOCK', description: 'Periodically boosts movement speed and weapon fire rate.', category: 'SYSTEM', rarity: 'LEGENDARY', icon: '🚀', color: 'text-red-500', maxLevel: 5 },
  ECHO_CACHE: { id: 'ECHO_CACHE', name: 'ECHO CACHE', description: 'Accumulates damage dealt, releasing it as a shockwave when full.', category: 'WEAPON', rarity: 'RARE', icon: '💾', color: 'text-orange-300', maxLevel: 5 },
  
  // SCALARS (Infinite Stacking)
  CRITICAL: { id: 'CRITICAL', name: 'TARGETING MATRIX', description: 'Increases critical hit probability and damage multiplier.', category: 'SCALAR', rarity: 'COMMON', icon: '🎯', color: 'text-purple-400', maxLevel: 999 },
  SCALAR_DAMAGE: { id: 'SCALAR_DAMAGE', name: 'OUTPUT AMPLIFIER', description: 'Increases global weapon damage output.', category: 'SCALAR', rarity: 'RARE', icon: '💪', color: 'text-red-500', maxLevel: 999 },
  SCALAR_FIRE_RATE: { id: 'SCALAR_FIRE_RATE', name: 'SYNAPTIC ENHANCER', description: 'Increases firing speed of all weapons.', category: 'SCALAR', rarity: 'RARE', icon: '⏩', color: 'text-yellow-300', maxLevel: 999 },
  SCALAR_AREA: { id: 'SCALAR_AREA', name: 'FLUX EXPANDER', description: 'Increases blast radius and projectile size.', category: 'SCALAR', rarity: 'RARE', icon: '📡', color: 'text-blue-300', maxLevel: 999 },
  
  // HACKING
  TERMINAL_PROTOCOL: { id: 'TERMINAL_PROTOCOL', name: 'TERMINAL OPTIMIZER', description: 'Accelerates hacking speed and increases score rewards.', category: 'HACKING', rarity: 'COMMON', icon: '📶', color: 'text-fuchsia-400', maxLevel: 5 },
  OVERRIDE_PROTOCOL: { id: 'OVERRIDE_PROTOCOL', name: 'PROTOCOL OVERRIDE', description: 'UNSANCTIONED: Force-enables an additional weapon slot.', category: 'SYSTEM', rarity: 'OVERCLOCKED', icon: '🔓', color: 'text-red-600', maxLevel: 1 }
};
