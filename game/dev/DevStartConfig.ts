
import { Difficulty } from '../../types';

export type DevStartConfig = {
  enabled: boolean;

  characterId?: string;
  stageId?: number;
  difficulty?: Difficulty;

  // Loadout overrides: WeaponID -> Level
  weapons?: Partial<Record<string, number>>;
  
  // Intrinsic Trait overrides
  traitMods?: Partial<Record<string, number>>;

  // Global flags
  mods?: {
    godMode?: boolean;
    freeMovement?: boolean;
  };
};

export const DEV_START_CONFIG: DevStartConfig = {
  enabled: false
};
