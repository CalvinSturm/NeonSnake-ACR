import { useMemo } from 'react';
import { useGameState } from './useGameState';

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
  const { transitionStateRef } = game;

  return useMemo(() => {
    const isBlockingSimulation = () => {
      return transitionStateRef.current.phase !== 'NONE';
    };

    const isBlockingInput = () => {
      return transitionStateRef.current.phase !== 'NONE';
    };

    return {
      isBlockingSimulation,
      isBlockingInput
    };
  }, [transitionStateRef]);
}
