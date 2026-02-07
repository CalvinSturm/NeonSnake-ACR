
import { useCallback, RefObject } from 'react';
import { useGameState } from './useGameState';
import { renderFrame } from './rendering/renderFrame';
import {
  beginFrame as webglBeginFrame,
  endFrame as webglEndFrame,
  applyCameraTransform,
  isWebGLReady,
  getFrameMetrics
} from '../graphics/renderManager';
import {
  renderEntitiesWebGL
} from '../graphics/renderers/entities';
import {
  renderProjectilesWebGL
} from '../graphics/renderers/projectiles';
import {
  renderParticlesWebGL
} from '../graphics/renderers/particles';
import { HUD_TOP_HEIGHT } from '../constants';

interface WebGLCallbacks {
  isReady: () => boolean;
}

export function useRendering(
  canvasRef: RefObject<HTMLCanvasElement>,
  game: ReturnType<typeof useGameState>,
  getMoveProgress: () => number,
  uiStyle?: any,
  webgl?: WebGLCallbacks
) {
  const draw = useCallback((alpha: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const now = performance.now();
    const camera = game.cameraRef.current;
    const useWebGL = webgl?.isReady() ?? false;

    // ─────────────────────────────────────────────
    // WEBGL PRE-PASS (Static Entities, Particles, Projectiles)
    // ─────────────────────────────────────────────
    if (useWebGL) {
      webglBeginFrame();

      // Apply camera transform to WebGL layer
      // Account for HUD offset in Y coordinate
      applyCameraTransform(
        camera.x,
        camera.y,
        camera.zoom,
        game.shakeRef.current.x,
        game.shakeRef.current.y
      );

      // Render static entities via WebGL (mines, food, XP orbs)
      renderEntitiesWebGL(
        game.minesRef.current,
        game.foodRef.current,
        now
      );

      // Render particles via WebGL
      renderParticlesWebGL(
        game.particlesRef.current
      );

      // Render projectiles via WebGL (returns fallback list for Canvas2D)
      const { fallback: projectileFallback } = renderProjectilesWebGL(
        game.projectilesRef.current
      );

      // Store fallback projectiles for Canvas2D pass
      // (For now, we let renderFrame handle all projectiles - 
      //  we could optimize by skipping already-rendered ones)

      webglEndFrame();
    }

    // ─────────────────────────────────────────────
    // CANVAS2D PASS (Full frame render)
    // Note: In hybrid mode, this draws over WebGL canvas
    // TODO: Skip entities already rendered by WebGL
    // ─────────────────────────────────────────────
    renderFrame(ctx, game, canvas.width, canvas.height, getMoveProgress(), uiStyle);

  }, [canvasRef, game, getMoveProgress, uiStyle, webgl]);

  return { draw };
}
