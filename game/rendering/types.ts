
import { CameraState } from '../camera/types';
import { Point, Direction } from '../../types';

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
}

export type SnakeRenderer = (
    rc: RenderContext,
    snake: Point[],
    prevTail: Point | null,
    direction: Direction,
    stats: any,
    charProfile: any,
    moveProgress: number,
    visualNsAngle: number,
    tailIntegrity: number,
    phaseRailCharge: number,
    echoDamageStored: number,
    prismLanceTimer: number
) => void;
