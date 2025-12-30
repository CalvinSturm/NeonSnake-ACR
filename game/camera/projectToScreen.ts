
import { CameraState } from './types';
import { CameraMode } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants';

/**
 * Projects world grid coordinates to screen pixel coordinates based on camera state.
 * This is a pure function.
 * 
 * @param worldX World grid X
 * @param worldY World grid Y
 * @param camera Current camera state
 * @returns {x, y} in Screen Pixels
 */
export function projectToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  const gridSize = DEFAULT_SETTINGS.gridSize;
  const worldPxX = worldX * gridSize;
  const worldPxY = worldY * gridSize;

  if (camera.mode === CameraMode.SIDE_SCROLL) {
    return {
      x: worldPxX - camera.x,
      y: worldPxY - camera.y
    };
  }

  // TOP_DOWN (Default)
  return {
    x: worldPxX,
    y: worldPxY
  };
}
