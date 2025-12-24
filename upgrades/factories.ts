
import { UpgradeId, UpgradeContext } from './types';
import { UpgradeOption } from '../types';

/* ─────────────────────────────
   Upgrade Factories (PURE)
   ───────────────────────────── */

export const UPGRADE_FACTORIES: Record<
  UpgradeId,
  (ctx: UpgradeContext) => UpgradeOption
> = {
  CANNON: ({ weapon }) => ({
    id: 'CANNON',
    title: `AUTO CANNON MK ${weapon.cannonLevel + 1}`,
    description:
      weapon.cannonLevel >= 3
        ? 'Adds extra projectile and increases speed.'
        : 'Increases fire rate and projectile damage.',
    color: 'text-yellow-400',
    type: 'WEAPON',
    icon: '🔫'
  }),

  AURA: ({ weapon }) => ({
    id: 'AURA',
    title: `TAIL AURA MK ${weapon.auraLevel + 1}`,
    description: 'Expands the damaging field radius and intensity.',
    color: 'text-red-400',
    type: 'WEAPON',
    icon: '⭕'
  }),

  NANO_SWARM: ({ weapon }) => ({
    id: 'NANO_SWARM',
    title:
      weapon.nanoSwarmLevel === 0
        ? 'UNLOCK NANO SWARM'
        : `NANO SWARM MK ${weapon.nanoSwarmLevel + 1}`,
    description:
      weapon.nanoSwarmLevel === 0
        ? 'Deploy 2 drones to orbit and protect you.'
        : 'Adds more drones and increases orbit speed.',
    color: 'text-pink-400',
    type: 'WEAPON',
    icon: '🛰️'
  }),

  MINES: ({ weapon }) => ({
    id: 'MINES',
    title:
      weapon.mineLevel === 0
        ? 'UNLOCK PLASMA MINES'
        : `PLASMA MINES MK ${weapon.mineLevel + 1}`,
    description:
      weapon.mineLevel === 0
        ? 'Periodically deploy explosive mines from tail.'
        : 'Mines trigger larger explosions.',
    color: 'text-orange-400',
    type: 'WEAPON',
    icon: '💣'
  }),

  LIGHTNING: ({ weapon }) => ({
    id: 'LIGHTNING',
    title:
      weapon.chainLightningLevel === 0
        ? 'UNLOCK VOLTAIC ARC'
        : `VOLTAIC ARC MK ${weapon.chainLightningLevel + 1}`,
    description: 'Attacks chain lightning to more distant enemies.',
    color: 'text-cyan-400',
    type: 'WEAPON',
    icon: '⚡'
  }),

  SHOCKWAVE: ({ weapon }) => ({
    id: 'SHOCKWAVE',
    title: `SYSTEM SHOCK MK ${weapon.shockwaveLevel + 1}`,
    description: 'Increases EMP blast radius and reduces cooldown.',
    color: 'text-blue-400',
    type: 'WEAPON',
    icon: '💥'
  }),

  SHIELD: ({ shieldActive }) => ({
    id: 'SHIELD',
    title: shieldActive
      ? 'SHIELD REINFORCEMENT'
      : 'ACTIVATE SHIELD',
    description: shieldActive
      ? 'Adds a temporary defense layer.'
      : 'Protects against one segment collision.',
    color: 'text-cyan-400',
    type: 'DEFENSE',
    icon: '🛡️'
  }),

  CRITICAL: ({ critChance }) => ({
    id: 'CRITICAL',
    title: 'CRIT ALGORITHM',
    description: `Increase Crit Chance to ${Math.floor(
      (critChance + 0.06) * 100
    )}% and damage.`,
    color: 'text-purple-400',
    type: 'UTILITY',
    icon: '🎯'
  }),

  FOOD: () => ({
    id: 'FOOD',
    title: 'GENETIC SYNERGY',
    description: 'Increases XP, Score multiplier, and Magnet range.',
    color: 'text-green-400',
    type: 'UTILITY',
    icon: '🧬'
  }),

  // ── NEW WEAPONS ──

  PRISM_LANCE: ({ weapon }) => ({
    id: 'PRISM_LANCE',
    title: weapon.prismLanceLevel === 0 ? 'UNLOCK PRISM LANCE' : `PRISM LANCE MK ${weapon.prismLanceLevel + 1}`,
    description: 'Fires a piercing energy beam. Refracts on impact.',
    color: 'text-teal-300',
    type: 'WEAPON',
    icon: '💎'
  }),

  NEON_SCATTER: ({ weapon }) => ({
    id: 'NEON_SCATTER',
    title: weapon.neonScatterLevel === 0 ? 'UNLOCK NEON SCATTER' : `NEON SCATTER MK ${weapon.neonScatterLevel + 1}`,
    description: 'Short-range burst of shotgun shards. High close-up damage.',
    color: 'text-pink-500',
    type: 'WEAPON',
    icon: '🎆'
  }),

  VOLT_SERPENT: ({ weapon }) => ({
    id: 'VOLT_SERPENT',
    title: weapon.voltSerpentLevel === 0 ? 'UNLOCK VOLT SERPENT' : `VOLT SERPENT MK ${weapon.voltSerpentLevel + 1}`,
    description: 'Summons a homing lightning snake that hunts targets.',
    color: 'text-blue-500',
    type: 'WEAPON',
    icon: '🐉'
  }),

  PHASE_RAIL: ({ weapon }) => ({
    id: 'PHASE_RAIL',
    title: weapon.phaseRailLevel === 0 ? 'UNLOCK PHASE RAIL' : `PHASE RAIL MK ${weapon.phaseRailLevel + 1}`,
    description: 'Charges up to fire a massive, piercing railgun shot.',
    color: 'text-purple-500',
    type: 'WEAPON',
    icon: '🔦'
  }),

  // ── NEW DEFENSE ──

  REFLECTOR_MESH: ({ weapon }) => ({
    id: 'REFLECTOR_MESH',
    title: weapon.reflectorMeshLevel === 0 ? 'INSTALL REFLECTOR MESH' : `REFLECTOR MESH MK ${weapon.reflectorMeshLevel + 1}`,
    description: 'Chance to reflect enemy projectiles back at them.',
    color: 'text-cyan-200',
    type: 'DEFENSE',
    icon: '📡'
  }),

  GHOST_COIL: ({ weapon }) => ({
    id: 'GHOST_COIL',
    title: weapon.ghostCoilLevel === 0 ? 'INSTALL GHOST COIL' : `GHOST COIL MK ${weapon.ghostCoilLevel + 1}`,
    description: 'Briefly phase through enemies to avoid damage on impact.',
    color: 'text-gray-300',
    type: 'DEFENSE',
    icon: '👻'
  }),

  EMP_BLOOM: ({ weapon }) => ({
    id: 'EMP_BLOOM',
    title: weapon.empBloomLevel === 0 ? 'INSTALL EMP BLOOM' : `EMP BLOOM MK ${weapon.empBloomLevel + 1}`,
    description: 'Taking damage triggers a local EMP stun burst.',
    color: 'text-blue-300',
    type: 'DEFENSE',
    icon: '🎇'
  }),

  // ── NEW UTILITY ──

  NEURAL_MAGNET: ({ weapon }) => ({
    id: 'NEURAL_MAGNET',
    title: weapon.neuralMagnetLevel === 0 ? 'ACTIVATE NEURAL MAGNET' : `NEURAL MAGNET MK ${weapon.neuralMagnetLevel + 1}`,
    description: 'Killed enemies pull nearby XP and pickups towards you.',
    color: 'text-indigo-400',
    type: 'UTILITY',
    icon: '🧲'
  }),

  OVERCLOCK: ({ weapon }) => ({
    id: 'OVERCLOCK',
    title: weapon.overclockLevel === 0 ? 'INSTALL OVERCLOCK INJECTOR' : `OVERCLOCK MK ${weapon.overclockLevel + 1}`,
    description: 'Periodically boosts fire rate and movement speed.',
    color: 'text-red-500',
    type: 'UTILITY',
    icon: '🚀'
  }),

  ECHO_CACHE: ({ weapon }) => ({
    id: 'ECHO_CACHE',
    title: weapon.echoCacheLevel === 0 ? 'INSTALL ECHO CACHE' : `ECHO CACHE MK ${weapon.echoCacheLevel + 1}`,
    description: 'Stores damage dealt and releases it as a shockwave.',
    color: 'text-orange-300',
    type: 'UTILITY',
    icon: '💾'
  })
};
