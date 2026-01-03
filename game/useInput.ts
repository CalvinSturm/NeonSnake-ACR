
import { useEffect, useCallback, useRef } from 'react';
import { Direction, GameStatus, UpgradeOption, CameraMode } from '../types';
import { useGameState } from './useGameState';
import { useTransitions } from './useTransitions';
import { UpgradeId } from '../upgrades/types';
import { useCameraController } from './camera/useCameraController';
import { CameraBehavior } from './camera/types';

export function useInput(
  game: ReturnType<typeof useGameState>,
  applyUpgrade: (id: UpgradeId) => void,
  handleStartClick: () => void
) {
  const {
    status,
    setStatus,
    directionRef,
    directionQueueRef,
    upgradeOptions,
    modalState,
    togglePause,
    closeSettings,
    setResumeCountdown,
    cameraRef,
    jumpIntentRef, 
    cameraControlsEnabled,
    stopIntentRef,
    settings // Access settings for invert flag
  } = game;

  const { queueCameraIntent } = useCameraController(game);

  // Explicit local typing
  const upgrades = upgradeOptions as UpgradeOption[];

  // Mouse State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const handleInput = useCallback((newDir: Direction) => {
    // BLOCK INPUT IF MODAL OPEN
    if (modalState !== 'NONE') return;

    // SIDE SCROLL OVERRIDE: 
    // In Side Scroll mode, UP acts as Jump, not directional change.
    if (cameraRef.current.mode === CameraMode.SIDE_SCROLL) {
        if (newDir === Direction.UP) {
            jumpIntentRef.current = true;
            return;
        }
    }

    const lastDir =
      directionQueueRef.current.length > 0
        ? directionQueueRef.current[directionQueueRef.current.length - 1]
        : directionRef.current;

    const isOpposite =
      (newDir === Direction.UP && lastDir === Direction.DOWN) ||
      (newDir === Direction.DOWN && lastDir === Direction.UP) ||
      (newDir === Direction.LEFT && lastDir === Direction.RIGHT) ||
      (newDir === Direction.RIGHT && lastDir === Direction.LEFT);

    if (newDir !== lastDir && !isOpposite) {
      if (directionQueueRef.current.length < 3) {
        directionQueueRef.current.push(newDir);
      }
    }
  }, [directionRef, directionQueueRef, modalState, cameraRef, jumpIntentRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. SETTINGS OVERRIDE (Must close settings first)
    if (modalState === 'SETTINGS') {
        if (e.key === 'Escape') {
            closeSettings();
        }
        return; // Block all other input
    }

    // 2. MENU NAVIGATION (Escape Back)
    if (e.key === 'Escape') {
        if (status === GameStatus.DIFFICULTY_SELECT) {
             setStatus(GameStatus.IDLE);
             return;
        }
        if (status === GameStatus.CHARACTER_SELECT) {
             setStatus(GameStatus.DIFFICULTY_SELECT);
             return;
        }
    }

    // 3. RESUME / PAUSE CONTROLS
    // Allow skipping countdown with Space or Enter
    if (status === GameStatus.RESUMING && (e.key === ' ' || e.key === 'Enter')) {
         setResumeCountdown(0);
         setStatus(GameStatus.PLAYING);
         return;
    }

    // Toggle Pause with Escape, P, or Space
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === ' ') {
        if (status === GameStatus.PLAYING || status === GameStatus.PAUSED) {
            const isJumpMode = cameraRef.current.mode === CameraMode.SIDE_SCROLL;

            if (e.key === ' ' && isJumpMode) {
                // JUMP
                jumpIntentRef.current = true;
                return;
            }
            
            togglePause();
            return;
        }
    }

    // 4. GAME OVER
    if (status === GameStatus.GAME_OVER) {
      if (e.key === ' ' || e.key === 'Enter') {
        handleStartClick();
      }
      return;
    }

    // 5. LEVEL UP
    if (status === GameStatus.LEVEL_UP) {
      if (e.key === '1' && upgrades[0])
        applyUpgrade(upgrades[0].id as UpgradeId);
      if (e.key === '2' && upgrades[1])
        applyUpgrade(upgrades[1].id as UpgradeId);
      if (e.key === '3' && upgrades[2])
        applyUpgrade(upgrades[2].id as UpgradeId);
      return;
    }

    // 6. CAMERA CONTROLS (GATED)
    if (status === GameStatus.PLAYING && cameraControlsEnabled) {
        if (e.key === '=' || e.key === '+') {
            queueCameraIntent({ type: 'ADJUST_ZOOM', delta: 0.1, duration: 150 });
        }
        if (e.key === '-' || e.key === '_') {
            queueCameraIntent({ type: 'ADJUST_ZOOM', delta: -0.1, duration: 150 });
        }
        if (e.key === '0') {
             queueCameraIntent({ type: 'RESET_DEFAULT', duration: 400 });
        }
        
        // Rotation (Q/E)
        const invertMult = settings.invertRotation ? -1 : 1;
        
        if (e.key === 'q' || e.key === 'Q') {
            queueCameraIntent({ type: 'ROTATE', angle: cameraRef.current.rotation - (Math.PI / 4) * invertMult, duration: 300 });
        }
        if (e.key === 'e' || e.key === 'E') {
            queueCameraIntent({ type: 'ROTATE', angle: cameraRef.current.rotation + (Math.PI / 4) * invertMult, duration: 300 });
        }

        // Cycle Mode (C)
        if (e.key === 'c' || e.key === 'C') {
            queueCameraIntent({ type: 'CYCLE_MODE' });
        }
    }

    // 7. STOP MECHANIC (Shift)
    if (status === GameStatus.PLAYING && modalState === 'NONE') {
        if (e.key === 'Shift') {
            stopIntentRef.current = true;
        }
    }

    // 8. GAMEPLAY (Only if playing and no modal)
    if (status !== GameStatus.PLAYING || modalState !== 'NONE') return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        handleInput(Direction.UP);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        handleInput(Direction.DOWN);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        handleInput(Direction.LEFT);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        handleInput(Direction.RIGHT);
        break;
    }
  }, [
    status,
    modalState,
    upgrades,
    applyUpgrade,
    handleStartClick,
    handleInput,
    togglePause,
    closeSettings,
    setResumeCountdown,
    setStatus,
    cameraRef,
    jumpIntentRef,
    queueCameraIntent,
    cameraControlsEnabled,
    stopIntentRef,
    settings.invertRotation
  ]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
      if (e.key === 'Shift') {
          stopIntentRef.current = false;
      }
  }, [stopIntentRef]);

  useEffect(() => {
    // ─── MOUSE / WHEEL HANDLERS ───
    const handleWheel = (e: WheelEvent) => {
        if (status !== GameStatus.PLAYING || !cameraControlsEnabled) return;
        
        const delta = Math.sign(e.deltaY) * -0.2; // Invert scroll for intuitive zoom (Up = In)
        queueCameraIntent({ type: 'ADJUST_ZOOM', delta, duration: 150 });
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (status !== GameStatus.PLAYING || !cameraControlsEnabled) return;

        // Middle Mouse Button (1) -> Rotation
        if (e.button === 1) {
            e.preventDefault(); 
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
        
        // Right Mouse Button (2) -> Pan (Only in Manual or Force Override)
        if (e.button === 2) {
            isPanningRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (status !== GameStatus.PLAYING || !cameraControlsEnabled) return;

        // Correct delta based on current viewport scale
        const scale = settings.gameScale || 1.0;
        const dx = (e.clientX - lastMousePosRef.current.x) / scale;
        const dy = (e.clientY - lastMousePosRef.current.y) / scale;
        
        const cam = cameraRef.current;

        if (isDraggingRef.current) {
            // Rotation Logic
            const sensitivity = 0.01;
            const invertMult = settings.invertRotation ? -1 : 1;
            const newRotation = cam.rotation + (dx * sensitivity * invertMult);
            
            queueCameraIntent({ type: 'ROTATE', angle: newRotation, duration: 0 }); // Instant
            
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        } 
        else if (isPanningRef.current) {
            // Panning Logic (Relative to Rotation)
            const r = -cam.rotation;
            const cos = Math.cos(r);
            const sin = Math.sin(r);
            
            const worldDx = (dx * cos - dy * sin);
            const worldDy = (dx * sin + dy * cos);
            
            queueCameraIntent({ 
                type: 'PAN_DELTA', 
                dx: worldDx / cam.zoom, 
                dy: worldDy / cam.zoom 
            });
            
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 1) isDraggingRef.current = false;
        if (e.button === 2) isPanningRef.current = false;
    };
    
    const handleContextMenu = (e: MouseEvent) => {
        if (status === GameStatus.PLAYING && cameraControlsEnabled) e.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleKeyUp, status, cameraRef, queueCameraIntent, cameraControlsEnabled, settings.invertRotation, settings.gameScale]);

  return { handleInput };
}
