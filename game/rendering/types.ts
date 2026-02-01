
import { CameraState } from '../camera/types';
import { GameStatus } from '../../types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  now: number;
  gameTime: number; // Synced simulation time
  width: number;
  height: number;
  gridSize: number;
  halfGrid: number;
  stageReady: boolean;
  stageReadyTime?: number; // Added
  uiStyle?: any;
  snakeStyle?: string;
  shake?: { x: number; y: number };
  camera: CameraState; // NEW: Camera state for projection
  isStopped?: boolean; // NEW: Freeze state
  reduceFlashing?: boolean; // Accessibility Setting
  
  // Theming Context
  stage: number;
  bossActive: boolean;
  bossConfigId?: string;
  
  // Game Status for effects
  status?: GameStatus;

  // World Limits
  viewport: { width: number; height: number; cols: number; rows: number };
}

export interface EntityAnchors {
  base: { x: number, y: number };
  center: { x: number, y: number };
  top: { x: number, y: number };
}

export interface UIRequest {
  type: 'HEALTH_BAR';
  x: number; // Screen Space X
  y: number; // Screen Space Y
  value: number;
  max: number;
  color: string;
  width: number;
  height: number;
}
