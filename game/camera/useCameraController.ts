
import { useCallback, useMemo } from 'react';
import { useGameState } from '../useGameState';
import { CameraIntent, CameraBehavior } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLS, GRID_ROWS, DEFAULT_SETTINGS, HUD_TOP_HEIGHT, PLAY_AREA_HEIGHT } from '../../constants';
import { CameraMode } from '../../types';

const LERP = (a: number, b: number, t: number) => a + (b - a) * t;
const EASE_IN_OUT = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export function useCameraController(game: ReturnType<typeof useGameState>) {
  const { cameraRef, snakeRef, cameraIntentsRef, viewport } = game;

  // ─── INTENT QUEUE ───
  const queueCameraIntent = useCallback((intent: CameraIntent) => {
    cameraIntentsRef.current.push(intent);
  }, [cameraIntentsRef]);

  // ─── UPDATE LOOP ───
  const update = useCallback((dt: number) => {
    const cam = cameraRef.current;

    if (typeof cam.tilt === 'undefined') cam.tilt = 0;

    // 1. PROCESS INTENTS
    while (cameraIntentsRef.current.length > 0) {
      const intent = cameraIntentsRef.current.shift()!;

      // Allow ZOOM operations even if camera is locked (e.g. Boss sequences)
      if (cam.isLocked &&
        intent.type !== 'UNLOCK_CAMERA' &&
        intent.type !== 'ADJUST_ZOOM' &&
        intent.type !== 'SET_ZOOM'
      ) {
        continue;
      }

      switch (intent.type) {
        case 'LOCK_CAMERA':
          cam.isLocked = true;
          break;

        case 'UNLOCK_CAMERA':
          cam.isLocked = false;
          break;

        case 'SET_ZOOM':
          const targetZoom = Math.max(0.2, Math.min(4.0, intent.zoom));
          if (intent.duration <= 0) {
            cam.zoom = targetZoom;
            if (cam.transition) {
              cam.transition.start.zoom = targetZoom;
              cam.transition.end.zoom = targetZoom;
            }
          } else {
            cam.transition = {
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
              end: { x: cam.x, y: cam.y, zoom: targetZoom, tilt: cam.tilt },
              t: 0,
              duration: intent.duration
            };
          }
          break;

        case 'ADJUST_ZOOM':
          const newZoom = Math.max(0.2, Math.min(4.0, cam.zoom + intent.delta));
          if (intent.duration <= 0) {
            cam.zoom = newZoom;
          } else {
            cam.transition = {
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
              end: { x: cam.x, y: cam.y, zoom: newZoom, tilt: cam.tilt },
              t: 0,
              duration: intent.duration
            };
          }
          break;

        case 'SET_TILT':
          const targetTilt = Math.max(0, Math.min(1.0, intent.tilt));
          if (intent.duration <= 0) {
            cam.tilt = targetTilt;
            if (cam.transition) {
              cam.transition.start.tilt = targetTilt;
              cam.transition.end.tilt = targetTilt;
            }
          } else {
            cam.transition = {
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
              end: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: targetTilt },
              t: 0,
              duration: intent.duration
            };
          }
          break;

        case 'ADJUST_TILT':
          const newTilt = Math.max(0, Math.min(1.0, cam.tilt + intent.delta));
          if (intent.duration <= 0) {
            cam.tilt = newTilt;
          } else {
            cam.transition = {
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
              end: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: newTilt },
              t: 0,
              duration: intent.duration
            };
          }
          break;

        case 'PAN_TO':
          cam.behavior = CameraBehavior.FIXED;
          cam.transition = {
            start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
            end: { x: intent.x, y: intent.y, zoom: cam.zoom, tilt: cam.tilt },
            t: 0,
            duration: intent.duration
          };
          break;

        case 'PAN_DELTA':
          cam.x -= intent.dx;
          cam.y -= intent.dy;
          if (cam.transition) {
            cam.transition = undefined;
          }
          if (cam.behavior !== CameraBehavior.MANUAL) {
            cam.behavior = CameraBehavior.MANUAL;
          }
          break;

        case 'SET_BEHAVIOR':
          cam.behavior = intent.behavior;
          break;

        case 'CYCLE_MODE':
          if (cam.behavior === CameraBehavior.FOLLOW_PLAYER) {
            cam.behavior = CameraBehavior.SIDE_SCROLL_LOCK;
          } else {
            cam.behavior = CameraBehavior.FOLLOW_PLAYER;
          }
          break;

        case 'SNAP_TO_PLAYER':
          const head = snakeRef.current[0];
          if (head) {
            const tx = head.x * DEFAULT_SETTINGS.gridSize;
            const ty = head.y * DEFAULT_SETTINGS.gridSize;
            cam.x = tx;
            cam.y = ty;
          }
          break;

        case 'RESET_DEFAULT':
          cam.behavior = CameraBehavior.FOLLOW_PLAYER;
          cam.transition = {
            start: { x: cam.x, y: cam.y, zoom: cam.zoom, tilt: cam.tilt },
            end: { x: cam.x, y: cam.y, zoom: 1.0, tilt: 0 },
            t: 0,
            duration: intent.duration
          };
          break;
      }
    }

    // 2. HANDLE TRANSITIONS
    if (cam.transition) {
      cam.transition.t += dt / cam.transition.duration;

      const t = Math.min(1, EASE_IN_OUT(Math.max(0, cam.transition.t)));

      cam.zoom = LERP(cam.transition.start.zoom, cam.transition.end.zoom, t);
      cam.tilt = LERP(cam.transition.start.tilt, cam.transition.end.tilt, t);

      if (cam.behavior === CameraBehavior.FIXED) {
        cam.x = LERP(cam.transition.start.x, cam.transition.end.x, t);
        cam.y = LERP(cam.transition.start.y, cam.transition.end.y, t);
      }

      if (cam.transition.t >= 1) {
        cam.transition = undefined;
      }
    }

    // 3. BEHAVIOR LOGIC (SMOOTH FOLLOW & CLAMPING)
    const head = snakeRef.current[0];

    if (head && !cam.transition) { // Only auto-follow if not transitioning
      const headPxX = head.x * DEFAULT_SETTINGS.gridSize + (DEFAULT_SETTINGS.gridSize / 2);
      const headPxY = head.y * DEFAULT_SETTINGS.gridSize + (DEFAULT_SETTINGS.gridSize / 2);

      // Calculate World Dimensions from dynamic viewport
      const worldW = viewport.cols * DEFAULT_SETTINGS.gridSize;
      const worldH = viewport.rows * DEFAULT_SETTINGS.gridSize;

      // Calculate Viewport Size in World Units
      // We use the raw canvas size for clamping logic to ensure full coverage
      const viewportW = viewport.width / cam.zoom;
      // Use full available height minus top HUD. Bottom HUD is overlay, so we include it in view.
      const viewportH = (viewport.height - HUD_TOP_HEIGHT) / cam.zoom;

      // Calculate Clamping Bounds (Center position limits)
      // If world is smaller than viewport, center it.
      const minX = viewportW < worldW ? viewportW / 2 : worldW / 2;
      const maxX = viewportW < worldW ? worldW - (viewportW / 2) : worldW / 2;

      // Note: Tilt affects visual Y height, but for camera logic we track the un-tilted world Y plane.
      // We clamp Y based on un-tilted world coordinates.
      const minY = viewportH < worldH ? viewportH / 2 : worldH / 2;
      const maxY = viewportH < worldH ? worldH - (viewportH / 2) : worldH / 2;

      const smooth = 0.1; // Smooth factor

      if (cam.behavior === CameraBehavior.FOLLOW_PLAYER) {
        let targetX = headPxX;
        let targetY = headPxY;

        if (cam.mode === CameraMode.SIDE_SCROLL) {
          // Look ahead in side scroll
          targetX = headPxX + (viewportW * 0.2);
          targetY = worldH / 2; // Lock Y center in side scroll usually, or follow loosely
        }

        // Clamp Target
        targetX = Math.max(minX, Math.min(maxX, targetX));
        targetY = Math.max(minY, Math.min(maxY, targetY));

        // Interpolate
        cam.x += (targetX - cam.x) * smooth;
        cam.y += (targetY - cam.y) * smooth;

      } else if (cam.behavior === CameraBehavior.SIDE_SCROLL_LOCK) {
        // Fixed Y behavior
        const targetX = Math.max(minX, Math.min(maxX, headPxX + (viewportW * 0.2)));
        const targetY = worldH / 2; // Center Y

        cam.x += (targetX - cam.x) * smooth;
        cam.y += (targetY - cam.y) * smooth;
      }
    }

    // 4. LEGACY MODE TRANSITION
    if (cam.targetMode) {
      cam.transitionT += dt / cam.transitionDuration;
      if (cam.transitionT >= 1) {
        cam.mode = cam.targetMode;
        cam.targetMode = null;
        cam.transitionT = 0;
        queueCameraIntent({ type: 'SET_ZOOM', zoom: 1.0, duration: 500 });
        queueCameraIntent({ type: 'SET_TILT', tilt: 0, duration: 500 });
      }
    }

  }, [cameraRef, snakeRef, cameraIntentsRef, queueCameraIntent, viewport]);

  return useMemo(() => ({ update, queueCameraIntent }), [update, queueCameraIntent]);
}
