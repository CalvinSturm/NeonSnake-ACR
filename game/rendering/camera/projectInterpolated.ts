
import { CameraState } from '../../camera/types';
import { CameraMode } from '../../../types';
import { DEFAULT_SETTINGS } from '../../../constants';
import { projectToScreen } from '../../camera/projectToScreen';

export function projectInterpolated(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  const currentProjection = projectToScreen(worldX, worldY, camera);
  
  // If not transitioning, return current directly
  if (!camera.targetMode) {
    return currentProjection;
  }

  // Create a temporary camera state for the target mode
  // The 'x' and 'y' in the real camera are already being updated towards target by updateCamera logic,
  // but projectToScreen uses 'mode' to decide whether to subtract them.
  const targetCamState = {
    ...camera,
    mode: camera.targetMode
  };

  const targetProjection = projectToScreen(worldX, worldY, targetCamState);

  // Linear Interpolation
  const t = Math.max(0, Math.min(1, camera.transitionT));
  
  return {
    x: currentProjection.x + (targetProjection.x - currentProjection.x) * t,
    y: currentProjection.y + (targetProjection.y - currentProjection.y) * t
  };
}
