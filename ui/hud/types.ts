
import { Difficulty, GameStatus, Point } from '../../types';

export type HUDLayoutMode = 
  | 'CYBER' | 'CYBER2' | 'CYBER3' | 'CYBER4' | 'CYBER5' | 'CYBER6' | 'CYBER7'
  | 'ZEN' | 'ZEN2' | 'ZEN3' | 'ZEN4' | 'ZEN5' | 'ZEN6' | 'ZEN7'
  | 'RPG' | 'RPG2' | 'RPG3' | 'RPG4' | 'RPG5' | 'RPG6' | 'RPG7'
  | 'RETRO' | 'RETRO2' | 'RETRO3' | 'RETRO4' | 'RETRO5' | 'RETRO6' | 'RETRO7'
  | 'HOLO' | 'HOLO2' | 'HOLO3' | 'HOLO4' | 'HOLO5' | 'HOLO6' | 'HOLO7'
  | 'INDUSTRIAL' | 'INDUSTRIAL2' | 'INDUSTRIAL3' | 'INDUSTRIAL4' | 'INDUSTRIAL5' | 'INDUSTRIAL6' | 'INDUSTRIAL7'
  | 'ARCADE' | 'ARCADE2' | 'ARCADE3' | 'ARCADE4' | 'ARCADE5' | 'ARCADE6' | 'ARCADE7'
  | 'GLASS' | 'GLASS2' | 'GLASS3' | 'GLASS4' | 'GLASS5' | 'GLASS6' | 'GLASS7';

export type HUDNumberStyle = 'DIGITAL' | 'MONO' | 'GLYPH';
export type HUDTheme = 'NEON' | 'AMBER' | 'HIGH_CONTRAST';

export interface HUDConfig {
  layout: HUDLayoutMode;
  numberStyle: HUDNumberStyle;
  theme: HUDTheme;
  showAnimations: boolean;
  opacity: number;
  visible: boolean;
  autoHide: boolean;
}

export interface HUDItemData {
  id: string;
  label: string;
  value: string | number;
  max?: number; // For bars
  icon?: string;
  color?: string; // Hex override
  alert?: boolean; // Pulse/Flash
}

export interface HUDSkillData {
  id: string;
  label?: string; // Display name (e.g. "Auto Cannon")
  level: number;
  cooldownPct: number; // 0-1
  active: boolean;
  icon: string;
  description?: string;
}

// The normalized data object passed to layouts
export interface HUDData {
  status: GameStatus;
  headPosition: Point; // NEW: For tracking UI
  score: {
    current: number;
    high: number;
    combo: number;
  };
  threat: {
    label: string;
    colorClass: string;
    level: Difficulty;
  };
  progression: {
    level: number;
    xp: number;
    xpMax: number;
    stage: number;
    stageLabel: string;
  };
  vitals: {
    integrity: number; // 0-100
    shieldActive: boolean;
    stamina: number; // 0-100 (percentage)
  };
  metrics: {
    damage: number;
    fireRate: number;
    range: number;
    crit: number;
  };
  loadout: {
    weapons: HUDSkillData[];
    utilities: HUDSkillData[];
    maxWeaponSlots: number;
  };
  // Vision Protocol Visibility Flags (Derived from current VisionProtocol)
  visibility: {
    showScore: boolean;
    showWeapons: boolean;
    showMetrics: boolean;
    showControls: boolean;
  };
}
