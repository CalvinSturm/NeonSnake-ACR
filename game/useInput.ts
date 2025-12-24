
/**
 * ARCHITECTURE LOCK:
 *
 * useInput is an INTENT CAPTURE system.
 *
 * It may:
 * - Translate player input into intents
 * - Route intents to authoritative systems
 * - Gate input based on GameStatus
 *
 * It must NOT:
 * - Mutate game simulation state directly
 * - Decide game flow transitions
 * - Apply upgrades or progression itself
 *
 * All state mutation must occur in owned systems.
 */

/**
 * ARCHITECTURE LOCK:
 *
 * useInput is an INTENT CAPTURE system.
 */

import { useEffect, useCallback } from 'react';
import { Direction, GameStatus, UpgradeOption } from '../types';
import { useGameState } from './useGameState';
import { useTransitions } from './useTransitions';
import { UpgradeId } from '../upgrades/types';

export function useInput(
  game: ReturnType<typeof useGameState>,
  applyUpgrade: (id: UpgradeId) => void,
  triggerSystemShock: () => void,
  triggerChronoSurge: () => void,
  handleStartClick: () => void
) {
  const {
    status,
    setStatus,
    directionRef,
    directionQueueRef,
    upgradeOptions
  } = game;

  // Explicit local typing (does NOT fix id by itself)
  const upgrades = upgradeOptions as UpgradeOption[];

  const transitions = useTransitions(game);

  const handleInput = useCallback((newDir: Direction) => {
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
  }, [directionRef, directionQueueRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. RESUME SKIP
    if (status === GameStatus.RESUMING) {
       if (e.key === ' ' || e.key === 'Enter') {
           game.setResumeCountdown(0);
           setStatus(GameStatus.PLAYING);
       }
       return;
    }

    // 2. PAUSE TOGGLE
    // Only allow pausing if we are strictly playing or paused.
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === ' ') {
        if (status === GameStatus.PLAYING) {
            setStatus(GameStatus.PAUSED);
            return;
        }
        if (status === GameStatus.PAUSED) {
            setStatus(GameStatus.PLAYING);
            return;
        }
        // If GAME_OVER, fall through to step 3
    }

    // 3. GAME OVER
    if (status === GameStatus.GAME_OVER) {
      if (e.key === ' ' || e.key === 'Enter') {
        handleStartClick();
      }
      return;
    }

    // 4. LEVEL UP
    if (status === GameStatus.LEVEL_UP) {
      if (e.key === '1' && upgrades[0])
        applyUpgrade(upgrades[0].id as UpgradeId);
      if (e.key === '2' && upgrades[1])
        applyUpgrade(upgrades[1].id as UpgradeId);
      if (e.key === '3' && upgrades[2])
        applyUpgrade(upgrades[2].id as UpgradeId);
      return;
    }

    if (status !== GameStatus.PLAYING) return;

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
      case 'Shift':
        e.preventDefault();
        triggerSystemShock();
        break;
      case 'q':
      case 'Q':
        e.preventDefault();
        triggerChronoSurge();
        break;
    }
  }, [
    status,
    setStatus,
    upgrades,
    applyUpgrade,
    handleStartClick,
    handleInput,
    triggerSystemShock,
    triggerChronoSurge,
    transitions,
    game
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleInput };
}
