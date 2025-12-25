
import { WeaponStats } from '../types';

export type UpgradeId =
  | 'CANNON'
  | 'AURA'
  | 'MINES'
  | 'LIGHTNING'
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
  | 'NEURAL_MAGNET'
  | 'OVERCLOCK'
  | 'ECHO_CACHE'
  | 'TERMINAL_PROTOCOL'
  | 'OVERCLOCK_WEAPON_SLOT'
  | 'SCALAR_DAMAGE'
  | 'SCALAR_FIRE_RATE'
  | 'SCALAR_AREA';

export type UpgradeContext = {
  weapon: WeaponStats;
  critChance: number;
  shieldActive: boolean;
  hackSpeedMod: number; 
};
