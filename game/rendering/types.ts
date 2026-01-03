
import { CameraState } from '../camera/types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  now: number;
  gameTime: number; // Synced simulation time
  width: number;
  height: number;
  gridSize: number;
  halfGrid: number;
  stageReady: boolean;
  uiStyle?: any;
  snakeStyle?: string;
  shake?: { x: number; y: number };
  camera: CameraState; // NEW: Camera state for projection
  isStopped?: boolean; // NEW: Freeze state
  reduceFlashing?: boolean; // Accessibility Setting
}