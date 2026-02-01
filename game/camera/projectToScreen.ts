
import { CameraState } from './types';
import { CameraMode } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants';

/**
 * Projects world grid coordinates to screen pixel coordinates based on camera state.
 * This is a pure function used for UI overlays.
 * Includes Tilt (Y-compression).
 * 
 * @param worldX World grid X
 * @param worldY World grid Y
 * @param camera Current camera state
 * @returns {x, y} in Screen Pixels relative to camera origin (Center of Screen)
 */
export function projectToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  const gridSize = DEFAULT_SETTINGS.gridSize;
  const worldPxX = worldX * gridSize;
  const worldPxY = worldY * gridSize;

  // Apply tilt compression to the relative Y distance
  const tiltScale = Math.cos(camera.tilt || 0);
  
  // Calculate relative position from camera center
  // In both modes, we want to project relative to the camera's position
  const relX = worldPxX - camera.x;
  const relY = worldPxY - camera.y;

  return {
    x: relX,
    y: relY * tiltScale
  };
}
