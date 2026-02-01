
import { CameraMode, Point } from '../../types';

export enum CameraBehavior {
  FOLLOW_PLAYER = 'FOLLOW_PLAYER',
  FIXED = 'FIXED', // Locks X/Y to specific coordinates
  MANUAL = 'MANUAL', // Controlled via intents only
  SIDE_SCROLL_LOCK = 'SIDE_SCROLL_LOCK' // Follows X, locks Y
}

export interface CameraState {
  // Base Properties
  mode: CameraMode; // Determines Physics/Renderer Base (TOP_DOWN | SIDE_SCROLL)
  behavior: CameraBehavior;
  
  // Transform
  x: number; // World X (Center)
  y: number; // World Y (Center)
  zoom: number;
  tilt: number; // Radians (0 to ~1.0)
  
  // Control State
  isLocked: boolean; // Overrides player control (e.g. Boss sequences)

  // Transition State (Internal)
  transition?: {
    start: { x: number; y: number; zoom: number; tilt: number };
    end: { x: number; y: number; zoom: number; tilt: number };
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
  | { type: 'SET_TILT'; tilt: number; duration: number } // New Tilt
  | { type: 'ADJUST_TILT'; delta: number; duration: number } // Relative Tilt
  | { type: 'PAN_TO'; x: number; y: number; duration: number }
  | { type: 'PAN_DELTA'; dx: number; dy: number }
  | { type: 'SET_BEHAVIOR'; behavior: CameraBehavior }
  | { type: 'CYCLE_MODE' } // Toggles between allowed behaviors
  | { type: 'SNAP_TO_PLAYER' }
  | { type: 'RESET_DEFAULT'; duration: number }
  | { type: 'LOCK_CAMERA' }
  | { type: 'UNLOCK_CAMERA' };
