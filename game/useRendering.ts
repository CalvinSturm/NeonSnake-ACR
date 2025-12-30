
import { useCallback, RefObject } from 'react';
import { useGameState } from './useGameState';
import { renderFrame } from './rendering/renderFrame';

export function useRendering(
  canvasRef: RefObject<HTMLCanvasElement>,
  game: ReturnType<typeof useGameState>,
  getMoveProgress: () => number,
  uiStyle?: any
) {
  const draw = useCallback((alpha: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    renderFrame(ctx, game, canvas.width, canvas.height, getMoveProgress(), uiStyle);

  }, [canvasRef, game, getMoveProgress, uiStyle]);

  return { draw };
}
