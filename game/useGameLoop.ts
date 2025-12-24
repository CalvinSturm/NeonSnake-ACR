
import { useEffect, useRef } from 'react';
import { GameStatus } from '../types';
import { useGameState } from './useGameState';
import { useTransitions } from './useTransitions';

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
        // Update logic based on state
        if (game.status === GameStatus.PLAYING) {
          game.gameTimeRef.current += FIXED_DT;
          updateRef.current(FIXED_DT);
        } else if (game.status === GameStatus.STAGE_TRANSITION) {
          // Advance time for animation continuity, but skip simulation update
          game.gameTimeRef.current += FIXED_DT;
        }
        
        accumulatorRef.current -= FIXED_DT;
      }

      // Draw every frame, interpolating if needed (passing alpha)
      drawRef.current(accumulatorRef.current / FIXED_DT);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [game.status, game.gameTimeRef]); 
}
