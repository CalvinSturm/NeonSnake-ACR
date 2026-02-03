import { useMemo } from 'react';
import { useGameState } from './useGameState';
import { GameStatus } from '../types';

/**
 * Transition Controller
 *
 * Owns:
 * - Transition phase state
 * - Blocking rules for simulation & input
 *
 * Must NOT:
 * - Advance time
 * - Mutate game entities
 * - Perform rendering or FX
 */
export function useTransitions(
  game: ReturnType<typeof useGameState>
) {
  const { status } = game;

  return useMemo(() => {
    const isBlockingSimulation = () => {
      return status === GameStatus.STAGE_TRANSITION ||
        status === GameStatus.RESUMING ||
        status === GameStatus.PAUSED;
    };

    const isBlockingInput = () => {
      return status === GameStatus.STAGE_TRANSITION ||
        status === GameStatus.RESUMING;
    };

    return {
      isBlockingSimulation,
      isBlockingInput
    };
  }, [status]);
}
