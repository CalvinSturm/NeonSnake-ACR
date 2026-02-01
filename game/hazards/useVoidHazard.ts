
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { PHYSICS } from '../../constants';
import { CameraMode } from '../../types';

export function useVoidHazard(
  game: ReturnType<typeof useGameState>,
  triggerPlayerDeath: (reason: string) => void
) {
  const { snakeRef, enemiesRef, cameraRef, viewport } = game;

  const update = useCallback(() => {
    // Only active in side-scroll mode where gravity exists
    if (cameraRef.current.mode !== CameraMode.SIDE_SCROLL) return;

    // Use dynamic viewport rows plus a buffer instead of static constant
    // This prevents death when playing on tall screens
    const voidY = viewport.rows + 5;

    // 1. Check Player
    const head = snakeRef.current[0];
    if (head) {
        if (head.y > voidY) {
            triggerPlayerDeath('CRITICAL_VOID_ERROR');
        }
    }

    // 2. Check Enemies
    for (const enemy of enemiesRef.current) {
        if (enemy.y > voidY) {
            enemy.shouldRemove = true;
        }
    }

  }, [snakeRef, enemiesRef, cameraRef, triggerPlayerDeath, viewport]);

  return { update };
}
