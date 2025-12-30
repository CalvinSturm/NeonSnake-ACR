
import { CameraMode, EnemyType, TerminalType, Point } from '../../types';

export type DevIntent =
  | { type: 'DEV_FORCE_STAGE'; stageId: number }
  | { type: 'DEV_SPAWN_ENEMY'; enemyType: EnemyType; pos?: Point }
  | { type: 'DEV_SPAWN_TERMINAL'; terminalType: TerminalType; pos?: Point }
  | { type: 'DEV_REMOVE_ENTITY'; entityId: string }
  | { type: 'DEV_GIVE_XP'; amount: number }
  | { type: 'DEV_GIVE_SCORE'; amount: number }
  | { type: 'DEV_CLEAR_ENEMIES' }
  | { type: 'DEV_CLEAR_FOOD' }
  | { type: 'DEV_SET_CAMERA_MODE'; mode: CameraMode }
  | { type: 'DEV_SET_ZOOM'; zoom: number }
  | { type: 'DEV_UNLOCK_ALL_COSMETICS' }
  | { type: 'DEV_TOGGLE_GOD_MODE' }
  | { type: 'DEV_SET_SCROLL_SPEED'; speed: number }
  | { type: 'RESET_GAME' }; // NEW: Full reset with overrides
