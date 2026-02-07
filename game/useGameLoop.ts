/**
 * useGameLoop - React Adapter for Game Loop
 * 
 * MIGRATION STATUS: Hybrid
 * - Uses LegacyGameLoop for backward compatibility
 * - Simulation logic still in hooks (to be migrated)
 * - Target: Full SimulationWorld integration
 * 
 * Phase 1 changes:
 * - GameLoop is now owned by this hook
 * - React cannot influence timing (callbacks are stable refs)
 * - rAF is authoritative within LegacyGameLoop
 */

import { useEffect, useRef, useCallback } from 'react';
import { GameStatus } from '../types';
import { useGameState } from './useGameState';
import { useTransitions } from './useTransitions';
import { useVerticalPhysics } from './physics/useVerticalPhysics';
import { useCameraController } from './camera/useCameraController';
import { LegacyGameLoop } from '../engine/loop';

/**
 * Game loop hook that drives the game simulation.
 * 
 * @param game - Game state facade
 * @param update - Update callback (simulation logic)
 * @param draw - Draw callback (render trigger)
 */
export function useGameLoop(
  game: ReturnType<typeof useGameState>,
  update: (dt: number) => void,
  draw: (alpha: number) => void
) {
  const transitions = useTransitions(game);
  const physics = useVerticalPhysics(game);
  const cameraController = useCameraController(game);

  // Stable refs for callbacks to avoid re-instantiating the loop
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  const gameRef = useRef(game);
  const physicsRef = useRef(physics);
  const cameraRef = useRef(cameraController);

  // Keep refs in sync
  useEffect(() => { updateRef.current = update; }, [update]);
  useEffect(() => { drawRef.current = draw; }, [draw]);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { physicsRef.current = physics; }, [physics]);
  useEffect(() => { cameraRef.current = cameraController; }, [cameraController]);

  // Loop instance ref for cleanup
  const loopRef = useRef<LegacyGameLoop | null>(null);

  useEffect(() => {
    // Define the Authoritative Update Cycle
    // NOTE: Simulation gate logic should move to SimulationWorld in Phase 2
    const onUpdate = (dt: number) => {
      const g = gameRef.current;
      const p = physicsRef.current;
      const c = cameraRef.current;

      // SIMULATION GATE: Update based on status
      if (g.status === GameStatus.PLAYING && g.modalState === 'NONE') {
        g.gameTimeRef.current += dt;

        // 1. Physics (Pre-movement)
        p.update(dt);

        // 2. Logic
        updateRef.current(dt);

        // 3. Camera Update Phase
        c.update(dt);

      } else if (g.status === GameStatus.STAGE_TRANSITION) {
        g.gameTimeRef.current += dt;
        updateRef.current(dt);
        c.update(dt);

      } else if (g.status === GameStatus.CAMERA_EDIT) {
        c.update(dt);

      } else if (g.status === GameStatus.DYING) {
        g.gameTimeRef.current += dt;
        updateRef.current(dt);
        c.update(dt);
      }
    };

    const onDraw = (alpha: number) => {
      drawRef.current(alpha);
    };

    // Instantiate and start the Authoritative Loop
    const loop = new LegacyGameLoop(onUpdate, onDraw);
    loopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      loopRef.current = null;
    };
  }, []); // Empty deps - loop is created once, uses refs for current values

  // Return loop control functions for external use
  return {
    isRunning: loopRef.current?.isActive ?? false
  };
}

// ═══════════════════════════════════════════════════════════════
// FUTURE: New useSimulatedGame hook for Phase 2
// ═══════════════════════════════════════════════════════════════

/*
import { GameLoop } from '../engine/loop';
import { SimulationWorld, getSimulationWorld } from '../engine/simulation/SimulationWorld';
import { SimulationSnapshot, SimulationConfig } from '../engine/simulation/types';
import { CharacterProfile } from '../types';

export function useSimulatedGame(
    config: SimulationConfig,
    profile: CharacterProfile
) {
    const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
    const loopRef = useRef<GameLoop | null>(null);
    const input = useInputSnapshot();

    useEffect(() => {
        const world = getSimulationWorld();
        world.init(config);
        world.reset(profile);

        const loop = new GameLoop(world);
        loopRef.current = loop;

        const unsubscribe = loop.subscribe((snap, alpha) => {
            setSnapshot(snap);
        });

        loop.start();

        return () => {
            unsubscribe();
            loop.stop();
        };
    }, [config, profile]);

    // Forward input each frame
    useEffect(() => {
        if (loopRef.current) {
            loopRef.current.setInput(input.getSnapshot());
            input.clear();
        }
    });

    return snapshot;
}
*/
