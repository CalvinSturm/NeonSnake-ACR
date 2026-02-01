
import { CameraState } from '../../camera/types';
import { CameraMode } from '../../../types';
import { DEFAULT_SETTINGS } from '../../../constants';
import { projectToScreen } from '../../camera/projectToScreen';

export function projectInterpolated(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  // Current projection includes current tilt
  const currentProjection = projectToScreen(worldX, worldY, camera);
  
  // If not transitioning mode, return current directly
  if (!camera.targetMode) {
    return currentProjection;
  }

  // Create a temporary camera state for the target mode
  const targetCamState = {
    ...camera,
    mode: camera.targetMode,
    tilt: 0 // Assume reset tilt on mode switch unless specified otherwise
  };

  const targetProjection = projectToScreen(worldX, worldY, targetCamState);

  // Linear Interpolation
  const t = Math.max(0, Math.min(1, camera.transitionT));
  
  return {
    x: currentProjection.x + (targetProjection.x - currentProjection.x) * t,
    y: currentProjection.y + (targetProjection.y - currentProjection.y) * t
  };
}
