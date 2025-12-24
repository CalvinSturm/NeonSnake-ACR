
import { WeaponStats } from '../types';

export type UpgradeId =
  | 'CANNON'
  | 'AURA'
  | 'MINES'
  | 'LIGHTNING'
  | 'SHOCKWAVE'
  | 'NANO_SWARM'
  | 'SHIELD'
  | 'CRITICAL'
  | 'FOOD'
  | 'PRISM_LANCE'
  | 'NEON_SCATTER'
  | 'VOLT_SERPENT'
  | 'PHASE_RAIL'
  | 'REFLECTOR_MESH'
  | 'GHOST_COIL'
  | 'EMP_BLOOM'
  | 'NEURAL_MAGNET'
  | 'OVERCLOCK'
  | 'ECHO_CACHE'
  | 'TERMINAL_PROTOCOL';

export type UpgradeContext = {
  weapon: WeaponStats;
  critChance: number;
  shieldActive: boolean;
  hackSpeedMod: number; // Added context for factories
};
