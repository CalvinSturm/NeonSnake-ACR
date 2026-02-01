
import { CameraState } from '../../camera/types';
import { CameraMode } from '../../../types';
import { DEFAULT_SETTINGS } from '../../../constants';

/**
 * Projects world grid coordinates to screen pixel coordinates based on camera state.
 * This is a pure function used for UI overlays.
 * Includes Tilt (Y-compression).
 * 
 * @param worldX World grid X
 * @param worldY World grid Y
 * @param camera Current camera state
 * @returns {x, y} in Screen Pixels relative to camera origin
 */
export function projectToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  const gridSize = DEFAULT_SETTINGS.gridSize;
  const worldPxX = worldX * gridSize;
  const worldPxY = worldY * gridSize;

  // Apply tilt compression
  const tiltScale = Math.cos(camera.tilt || 0);

  if (camera.mode === CameraMode.SIDE_SCROLL) {
    return {
      x: worldPxX - camera.x,
      y: (worldPxY - camera.y) * tiltScale
    };
  }

  // TOP_DOWN (Default)
  return {
    x: worldPxX,
    y: worldPxY * tiltScale
  };
}

/**
 * Calculates the 2D offset for a 3D vertical displacement given the camera tilt.
 * Central source of truth for "Height" projection.
 */
export function projectVector(x: number, y: number, z: number, tilt: number): { x: number, y: number } {
  // In 2.5D, Z (Up) corresponds to negative Y on screen, compressed by tilt.
  // Tilt 0 (Top Down) -> No Z visibility (0 offset)
  // Tilt 1 (Front View) -> Full Z visibility (not strictly correct for ortho but stylized)
  // Our system: tilt implies viewing angle. Z moves 'up' the screen.
  // We strictly follow the visual style: y_screen = y_world - (z * tilt)
  return {
    x: x,
    y: y - (z * tilt)
  };
}

/**
 * Converts a point from the current Context coordinate space (Local) to Absolute Screen coordinates.
 * Essential for decoupling UI from World transforms.
 */
export function localToScreen(ctx: CanvasRenderingContext2D, localX: number, localY: number): { x: number, y: number } {
  const m = ctx.getTransform();
  return {
    x: localX * m.a + localY * m.c + m.e,
    y: localX * m.b + localY * m.d + m.f
  };
}
