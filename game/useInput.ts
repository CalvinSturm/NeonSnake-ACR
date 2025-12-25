
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
    setResumeCountdown
  } = game;

  // Explicit local typing
  const upgrades = upgradeOptions as UpgradeOption[];

  const handleInput = useCallback((newDir: Direction) => {
    // BLOCK INPUT IF MODAL OPEN
    if (modalState !== 'NONE') return;

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
  }, [directionRef, directionQueueRef, modalState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. SETTINGS OVERRIDE (Must close settings first)
    if (modalState === 'SETTINGS') {
        if (e.key === 'Escape') {
            closeSettings();
        }
        return; // Block all other input
    }

    // 2. RESUME / PAUSE CONTROLS
    // Allow skipping countdown with Space or Enter
    if (status === GameStatus.RESUMING && (e.key === ' ' || e.key === 'Enter')) {
         setResumeCountdown(0);
         setStatus(GameStatus.PLAYING);
         return;
    }

    // Toggle Pause with Escape, P, or Space
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === ' ') {
        if (status === GameStatus.PLAYING || status === GameStatus.PAUSED) {
            togglePause();
            return;
        }
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

    // 5. GAMEPLAY (Only if playing and no modal)
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
    setStatus
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleInput };
}
