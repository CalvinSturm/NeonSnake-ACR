
import { Difficulty } from '../../types';

export interface ConfigPreset {
  modelName: string;
  parameters: string[];
  validationMs: number;
}

export const CONFIGURATION_PRESETS: Record<Difficulty, ConfigPreset> = {
  [Difficulty.EASY]: {
    modelName: 'CONTAINMENT_PROTOCOL_MINIMAL',
    parameters: [
      'THREAT_DENSITY: LOW',
      'REACTION_WINDOW: EXTENDED',
      'ERROR_TOLERANCE: 200%',
      'AGGRESSION_HEURISTIC: PASSIVE'
    ],
    validationMs: 600
  },
  [Difficulty.MEDIUM]: {
    modelName: 'CONTAINMENT_PROTOCOL_STANDARD',
    parameters: [
      'THREAT_DENSITY: NOMINAL',
      'REACTION_WINDOW: STANDARD',
      'ERROR_TOLERANCE: 100%',
      'AGGRESSION_HEURISTIC: BALANCED'
    ],
    validationMs: 800
  },
  [Difficulty.HARD]: {
    modelName: 'CONTAINMENT_PROTOCOL_ELEVATED',
    parameters: [
      'THREAT_DENSITY: HIGH',
      'REACTION_WINDOW: REDUCED',
      'ERROR_TOLERANCE: 0%',
      'AGGRESSION_HEURISTIC: AGGRESSIVE'
    ],
    validationMs: 1000
  },
  [Difficulty.INSANE]: {
    modelName: 'CONTAINMENT_PROTOCOL_UNBOUND',
    parameters: [
      'THREAT_DENSITY: MAXIMUM',
      'REACTION_WINDOW: MINIMAL',
      'ERROR_TOLERANCE: N/A',
      'AGGRESSION_HEURISTIC: LETHAL',
      'SAFEGUARDS: DISABLED'
    ],
    validationMs: 1500
  }
};
