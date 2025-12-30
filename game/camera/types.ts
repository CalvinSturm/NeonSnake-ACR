
import { CameraMode, Point } from '../../types';

export enum CameraBehavior {
  FOLLOW_PLAYER = 'FOLLOW_PLAYER',
  FIXED = 'FIXED', // Locks X/Y to specific coordinates
  MANUAL = 'MANUAL', // Controlled via intents only
  SIDE_SCROLL_LOCK = 'SIDE_SCROLL_LOCK', // Follows X, locks Y
  AUTO_SCROLL_X = 'AUTO_SCROLL_X' // Automatically advances X at a fixed rate
}

export interface CameraState {
  // Base Properties
  mode: CameraMode; // Determines Physics/Renderer Base (TOP_DOWN | SIDE_SCROLL)
  behavior: CameraBehavior;
  
  // Transform
  x: number; // World X (Center)
  y: number; // World Y (Center)
  zoom: number;
  rotation: number; // New: Radians
  
  // Control State
  isLocked: boolean; // Overrides player control (e.g. Boss sequences)

  // Transition State (Internal)
  transition?: {
    start: { x: number; y: number; zoom: number; rotation: number };
    end: { x: number; y: number; zoom: number; rotation: number };
    t: number; // 0-1
    duration: number; // ms
  };

  // Legacy (Keep for compatibility until refactored)
  scrollSpeed: number; 
  targetMode: CameraMode | null;
  transitionT: number;
  transitionDuration: number;
}

export type CameraIntent = 
  | { type: 'SET_ZOOM'; zoom: number; duration: number }
  | { type: 'ADJUST_ZOOM'; delta: number; duration: number } // Relative zoom
  | { type: 'ROTATE'; angle: number; duration: number }
  | { type: 'PAN_TO'; x: number; y: number; duration: number }
  | { type: 'PAN_DELTA'; dx: number; dy: number } // New: Relative Pan
  | { type: 'SET_BEHAVIOR'; behavior: CameraBehavior }
  | { type: 'CYCLE_MODE' } // Toggles between allowed behaviors
  | { type: 'SNAP_TO_PLAYER' }
  | { type: 'RESET_DEFAULT'; duration: number }
  | { type: 'LOCK_CAMERA' }
  | { type: 'UNLOCK_CAMERA' }
  | { type: 'SET_SCROLL_SPEED'; speed: number }; // NEW
