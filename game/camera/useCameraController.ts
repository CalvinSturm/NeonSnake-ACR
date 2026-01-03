
import { useCallback, useRef } from 'react';
import { useGameState } from '../useGameState';
import { CameraState, CameraIntent, CameraBehavior } from './types';
import { CameraMode } from '../../types';
import { DEFAULT_SETTINGS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

const LERP = (a: number, b: number, t: number) => a + (b - a) * t;
const EASE_IN_OUT = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export function useCameraController(game: ReturnType<typeof useGameState>) {
  const { cameraRef, snakeRef } = game;
  const intentsRef = useRef<CameraIntent[]>([]);

  // ─── INTENT QUEUE ───
  const queueCameraIntent = useCallback((intent: CameraIntent) => {
    intentsRef.current.push(intent);
  }, []);

  // ─── UPDATE LOOP ───
  const update = useCallback((dt: number) => {
    const cam = cameraRef.current;
    
    // 1. PROCESS INTENTS
    while (intentsRef.current.length > 0) {
      const intent = intentsRef.current.shift()!;
      
      // Boss overrides all intents except UNLOCK
      if (cam.isLocked && intent.type !== 'UNLOCK_CAMERA') {
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
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: cam.rotation },
              end: { x: cam.x, y: cam.y, zoom: targetZoom, rotation: cam.rotation },
              t: 0,
              duration: intent.duration
            };
          }
          break;

        case 'ADJUST_ZOOM':
            // Relative Zoom with clamping
            const newZoom = Math.max(0.2, Math.min(4.0, cam.zoom + intent.delta));
            if (intent.duration <= 0) {
                cam.zoom = newZoom;
            } else {
                cam.transition = {
                  start: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: cam.rotation },
                  end: { x: cam.x, y: cam.y, zoom: newZoom, rotation: cam.rotation },
                  t: 0,
                  duration: intent.duration
                };
            }
            break;

        case 'ROTATE':
          if (intent.duration <= 0) {
            cam.rotation = intent.angle;
            if (cam.transition) {
                cam.transition.start.rotation = intent.angle;
                cam.transition.end.rotation = intent.angle;
            }
          } else {
            cam.transition = {
              start: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: cam.rotation },
              end: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: intent.angle },
              t: 0,
              duration: intent.duration
            };
          }
          break;
          
        case 'PAN_TO':
          cam.behavior = CameraBehavior.FIXED;
          cam.transition = {
            start: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: cam.rotation },
            end: { x: intent.x, y: intent.y, zoom: cam.zoom, rotation: cam.rotation },
            t: 0,
            duration: intent.duration
          };
          break;

        case 'PAN_DELTA':
          cam.x -= intent.dx;
          cam.y -= intent.dy;
          if (cam.transition && (cam.transition.start.x !== cam.transition.end.x || cam.transition.start.y !== cam.transition.end.y)) {
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
          // Toggle between FOLLOW_PLAYER and SIDE_SCROLL_LOCK (or MANUAL if explicitly set)
          if (cam.behavior === CameraBehavior.FOLLOW_PLAYER) {
             cam.behavior = CameraBehavior.SIDE_SCROLL_LOCK;
          } else {
             cam.behavior = CameraBehavior.FOLLOW_PLAYER;
          }
          // Reset rotation for standard modes
          cam.rotation = 0;
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
            start: { x: cam.x, y: cam.y, zoom: cam.zoom, rotation: cam.rotation },
            end: { x: cam.x, y: cam.y, zoom: 1.0, rotation: 0 }, 
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
      cam.rotation = LERP(cam.transition.start.rotation, cam.transition.end.rotation, t);
      
      if (cam.behavior === CameraBehavior.FIXED) {
          cam.x = LERP(cam.transition.start.x, cam.transition.end.x, t);
          cam.y = LERP(cam.transition.start.y, cam.transition.end.y, t);
      }

      if (cam.transition.t >= 1) {
        cam.transition = undefined;
      }
    }

    // 3. BEHAVIOR LOGIC
    const head = snakeRef.current[0];
    
    if (head) {
        const headPxX = head.x * DEFAULT_SETTINGS.gridSize;
        const headPxY = head.y * DEFAULT_SETTINGS.gridSize;
        const viewportW = CANVAS_WIDTH / cam.zoom;
        const smooth = 0.1;

        if (cam.behavior === CameraBehavior.FOLLOW_PLAYER) {
            // Standard Follow: Matches mode physics
            let targetX = headPxX;
            let targetY = headPxY;

            if (cam.mode === CameraMode.SIDE_SCROLL) {
                targetX = headPxX - (viewportW * 0.3);
                targetY = 0; 
            } else {
                targetX = 0; // Top Down Centered
                targetY = 0;
            }
            
            cam.x += (targetX - cam.x) * smooth;
            cam.y += (targetY - cam.y) * smooth;
        
        } else if (cam.behavior === CameraBehavior.SIDE_SCROLL_LOCK) {
            // Force Side Scroll Behavior (X-only follow) regardless of mode
            const targetX = headPxX - (viewportW * 0.3);
            const targetY = 0;
            
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
             queueCameraIntent({ type: 'ROTATE', angle: 0, duration: 500 });
         }
    }

  }, [cameraRef, snakeRef]);

  return { update, queueCameraIntent };
}
