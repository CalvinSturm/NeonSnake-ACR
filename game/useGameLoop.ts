
import { useEffect, useRef } from 'react';
import { GameStatus } from '../types';
import { useGameState } from './useGameState';
import { useTransitions } from './useTransitions';
import { useVerticalPhysics } from './physics/useVerticalPhysics';
import { useCameraController } from './camera/useCameraController';

export function useGameLoop(
  game: ReturnType<typeof useGameState>,
  update: (dt: number) => void,
  draw: (alpha: number) => void
) {
  const FIXED_DT = 1000 / 60;

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const transitions = useTransitions(game);
  const physics = useVerticalPhysics(game);
  const cameraController = useCameraController(game); // New Controller

  const updateRef = useRef(update);
  const drawRef = useRef(draw);

  useEffect(() => { updateRef.current = update; }, [update]);
  useEffect(() => { drawRef.current = draw; }, [draw]);

  useEffect(() => {
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;

    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const frameDt = Math.min(100, time - lastTimeRef.current);
      lastTimeRef.current = time;
      accumulatorRef.current += frameDt;

      while (accumulatorRef.current >= FIXED_DT) {
        // SIMULATION GATE: Update based on status
        if (game.status === GameStatus.PLAYING && game.modalState === 'NONE') {
          game.gameTimeRef.current += FIXED_DT;
          
          // 1. Physics (Pre-movement)
          physics.update(FIXED_DT);
          
          // 2. Logic
          updateRef.current(FIXED_DT);
          
          // 3. Camera Update Phase (New)
          cameraController.update(FIXED_DT);
          
        } else if (game.status === GameStatus.STAGE_TRANSITION) {
          // Advance time for animation continuity AND transition logic
          game.gameTimeRef.current += FIXED_DT;
          updateRef.current(FIXED_DT);
          // Allow camera to settle/animate during transitions?
          cameraController.update(FIXED_DT); 
        } else if (game.status === GameStatus.CAMERA_EDIT) {
          // Camera Editing Mode: Only update camera
          cameraController.update(FIXED_DT);
        } else if (game.status === GameStatus.DYING) {
          // Death Animation Phase
          game.gameTimeRef.current += FIXED_DT;
          updateRef.current(FIXED_DT); // Essential: This runs the timer logic in SnakeGame.tsx
          cameraController.update(FIXED_DT); // Essential: This runs the camera shake
        }
        
        accumulatorRef.current -= FIXED_DT;
      }

      // Draw every frame, interpolating if needed (passing alpha)
      drawRef.current(accumulatorRef.current / FIXED_DT);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [game.status, game.gameTimeRef, game.modalState, physics, cameraController]); 
}
