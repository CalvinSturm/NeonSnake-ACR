
import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import {
  Direction,
  Point,
  FoodType,
  EnemyType,
  Difficulty,
  CameraMode
} from '../types';
import {
  DIFFICULTY_CONFIGS,
  DEFAULT_SETTINGS,
  XP_BASE_MAGNET_RADIUS,
  STAMINA_CONFIG
} from '../constants';
import { useSpawner } from './useSpawner';
import { useBossController } from './boss/useBossController';
import { audio } from '../utils/audio';
import { updateInterceptor } from './enemies/interceptorAI';
import { updateShooter } from './enemies/shooterAI';
import { updateDasher } from './enemies/dasherAI';
import { AIContext } from './enemies/enemyTypes';
import { updateTimers, applyMovement } from './physics/movementUtils';

export function useMovement(
  game: ReturnType<typeof useGameState>,
  spawner: ReturnType<typeof useSpawner>,
  bossController?: ReturnType<typeof useBossController>
) {
  const {
    snakeRef,
    prevTailRef,
    directionRef,
    directionQueueRef,
    enemiesRef,
    wallsRef,
    powerUpsRef,
    lastPowerUpStateRef,
    setActivePowerUps,
    difficulty,
    gameTimeRef,
    overclockActiveRef,
    statsRef,
    foodRef,
    uiCombo,
    traitsRef,
    stageReadyRef,
    staminaRef,
    stopIntentRef,
    isStoppedRef,
    stopCooldownRef,
    viewport,
    cameraRef,
    bossActiveRef,
    bossEnemyRef,
    levelRef,
    enemyVisualsRef
  } = game;

  // ─────────────────────────────
  // SNAKE MOVEMENT (TIME-GATED)
  // ─────────────────────────────
  const moveAccumulatorRef = useRef(0);
  
  const getMoveInterval = useCallback(() => {
      let interval = DEFAULT_SETTINGS.initialSpeed;
      
      // EXIT PHASE: SUPER SPEED
      if (stageReadyRef.current) {
          return interval * 0.4;
      }
      
      // TRAIT: SYNTH ADRENALINE (Overdrive)
      if (traitsRef.current.speedComboScaler > 0) {
          const comboBoost = Math.min(0.4, uiCombo * traitsRef.current.speedComboScaler); 
          interval /= (1 + comboBoost);
      }

      // MINOR TRAIT: BASE MOVEMENT SPEED (Overdrive)
      if (traitsRef.current.moveSpeedMod !== 1.0) {
          interval /= traitsRef.current.moveSpeedMod;
      }

      if (overclockActiveRef.current) {
          const lvl = statsRef.current.weapon.overclockLevel;
          const speedBoost = 1.5 + (lvl * 0.1);
          interval /= speedBoost;
      }
      return interval;
  }, [overclockActiveRef, statsRef, traitsRef, uiCombo, stageReadyRef]);

  // ─────────────────────────────
  // STAMINA LOGIC
  // ─────────────────────────────
  const updateStamina = useCallback((dt: number) => {
      const max = STAMINA_CONFIG.MAX;
      const dtSec = dt / 1000;
      
      if (stopCooldownRef.current) {
          if (staminaRef.current > STAMINA_CONFIG.MIN_TO_REENGAGE) {
              stopCooldownRef.current = false;
          } else {
              stopIntentRef.current = false; 
          }
      }

      if (stopIntentRef.current && !stopCooldownRef.current && staminaRef.current > 0) {
          if (!isStoppedRef.current) {
              isStoppedRef.current = true;
              audio.setStopEffect(true);
          }
          
          staminaRef.current -= dtSec * STAMINA_CONFIG.DRAIN_RATE;
          
          if (staminaRef.current <= 0) {
              staminaRef.current = 0;
              isStoppedRef.current = false;
              stopCooldownRef.current = true;
              audio.setStopEffect(false);
              audio.play('UI_HARD_CLICK');
          }
      } else {
          if (isStoppedRef.current) {
              isStoppedRef.current = false;
              audio.setStopEffect(false);
          }
          
          if (staminaRef.current < max) {
              staminaRef.current = Math.min(max, staminaRef.current + dtSec * STAMINA_CONFIG.RECHARGE_RATE);
          }
      }
  }, [staminaRef, stopIntentRef, isStoppedRef, stopCooldownRef]);

  const getMoveProgress = useCallback(() => {
      const interval = getMoveInterval();
      return Math.min(1, Math.max(0, moveAccumulatorRef.current / interval));
  }, [getMoveInterval]);

  // TYPE SAFETY: Explicitly return Point or null
  const getNextHead = useCallback((dt: number): Point | null => {
    updateStamina(dt);

    if (isStoppedRef.current) {
        return null; 
    }

    const interval = getMoveInterval();
    moveAccumulatorRef.current += dt;

    if (moveAccumulatorRef.current < interval) {
      return null;
    }

    moveAccumulatorRef.current -= interval;
    
    // EXIT PHASE: FORCE RIGHT
    if (stageReadyRef.current) {
        directionRef.current = Direction.RIGHT;
        directionQueueRef.current = [];
    } else if (directionQueueRef.current.length > 0) {
        directionRef.current = directionQueueRef.current.shift()!;
    }

    const head = { ...snakeRef.current[0] };

    switch (directionRef.current) {
      case Direction.UP: head.y -= 1; break;
      case Direction.DOWN: head.y += 1; break;
      case Direction.LEFT: head.x -= 1; break;
      case Direction.RIGHT: head.x += 1; break;
    }

    return head;
  }, [directionRef, directionQueueRef, snakeRef, getMoveInterval, updateStamina, isStoppedRef, stageReadyRef]);

  const commitMove = useCallback(
    (newHead: Point, grew: boolean) => {
      const currentHead = snakeRef.current[0];
      if (currentHead && newHead.x === currentHead.x && newHead.y === currentHead.y) {
          return;
      }

      snakeRef.current.unshift(newHead);
      
      if (!grew) {
          const removed = snakeRef.current.pop();
          if (removed) {
              prevTailRef.current = removed;
          }
      } else {
          prevTailRef.current = snakeRef.current[snakeRef.current.length - 1];
      }
    },
    [snakeRef, prevTailRef]
  );

  // ─────────────────────────────
  // LOOT MAGNETISM
  // ─────────────────────────────
  const updateLoot = useCallback((dt: number, head: Point) => {
      const now = gameTimeRef.current;
      const isMagnetActive = now < powerUpsRef.current.magnetUntil;
      const globalRange = isMagnetActive ? 100 : 0; 
      const isCleanupPhase = stageReadyRef.current; 
      
      // Apply Difficulty Scaling to Magnetism
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];
      const difficultyMod = diffConfig.lootMagnetMod || 1.0;
      
      // MAJOR TRAIT: SPECTRE (Magnet Range per Level)
      // Magnet Range = Base + Upgrade Mod + (Level * Scaling)
      const traitScaling = (traitsRef.current.magnetRangePerLevel || 0) * (levelRef.current - 1);
      const scalingRadius = XP_BASE_MAGNET_RADIUS * (1 + traitScaling);
      
      const baseMagnetRange = (scalingRadius + (statsRef.current.magnetRangeMod || 0)) * difficultyMod;
      
      const moveInterval = getMoveInterval();
      const snakeSpeed = 1000 / moveInterval; 
      const chaseSpeed = isCleanupPhase ? snakeSpeed * 3 : snakeSpeed * 1.5; 

      for (const f of foodRef.current) {
          if (f.shouldRemove) continue;
          if (f.type !== FoodType.XP_ORB && !isMagnetActive) continue;

          const dx = head.x - f.x;
          const dy = head.y - f.y;
          const dist = Math.hypot(dx, dy);
          
          let effectiveRange = 0;
          if (f.type === FoodType.XP_ORB) {
              effectiveRange = isCleanupPhase ? 9999 : Math.max(baseMagnetRange, globalRange);
          } else {
              effectiveRange = globalRange;
          }

          if (dist < effectiveRange) {
              if (dist < 0.5) {
                  f.x = head.x;
                  f.y = head.y;
                  continue;
              }

              const speed = chaseSpeed * (dt / 1000); 
              
              if (dist > 0.01) {
                  f.x += (dx / dist) * speed;
                  f.y += (dy / dist) * speed;
              }
          }
      }
  }, [foodRef, powerUpsRef, gameTimeRef, statsRef, getMoveInterval, stageReadyRef, difficulty, traitsRef, levelRef]);

  // ─────────────────────────────
  // ENEMY LOGIC (SMOOTH MOVEMENT)
  // ─────────────────────────────
  // TYPE SAFETY: Explicitly returns void
  const updateEnemies = useCallback(
    (dt: number, snakeHead: Point): void => {
      
      updateLoot(dt, snakeHead);

      const now = gameTimeRef.current;
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];
      const isSideScroll = cameraRef.current.mode === CameraMode.SIDE_SCROLL;

      // Check PowerUps
      const isSlowActive = now < powerUpsRef.current.slowUntil;
      const isMagnetActive = now < powerUpsRef.current.magnetUntil;

      if (
        isSlowActive !== lastPowerUpStateRef.current.slow ||
        isMagnetActive !== lastPowerUpStateRef.current.magnet
      ) {
        lastPowerUpStateRef.current = {
          slow: isSlowActive,
          magnet: isMagnetActive
        };
        setActivePowerUps({ slow: isSlowActive, magnet: isMagnetActive });
      }

      const baseSpeedMod = (isSlowActive ? 0.3 : 1.0) * diffConfig.speedMod;
      const frameUnits = dt / 16.667;
      
      // Determine Boss Context
      const bossPhase = bossActiveRef.current && bossEnemyRef.current 
          ? (bossEnemyRef.current.bossPhase || 1) 
          : 0;

      // Construct shared AI Context
      const aiContext: AIContext = {
          dt,
          playerPos: snakeHead,
          aggressionMod: diffConfig.aiAggressionMod || 1.0,
          bossActive: bossActiveRef.current,
          bossPhase
      };

      enemiesRef.current.forEach(e => {
        // ─── STATE MANAGEMENT (INGRESS) ───
        const isEntering = e.state !== 'ACTIVE';
        if (isEntering) {
            const margin = 0.5;
            const insideX = e.x >= margin && e.x <= viewport.cols - margin;
            const insideY = e.y >= margin && e.y <= viewport.rows - margin;
            
            if (insideX && insideY) {
                e.state = 'ACTIVE';
            } else {
                e.state = 'ENTERING';
            }
        }

        // Global Timers - Visual flash (from enemyVisualsRef)
        const vis = enemyVisualsRef.current.get(e.id);
        if (vis && vis.flash > 0) {
            vis.flash = Math.max(0, vis.flash - frameUnits);
        }
        if (e.hitCooldowns) {
            for (const key in e.hitCooldowns) {
                if (e.hitCooldowns[key] > 0) {
                    e.hitCooldowns[key] = Math.max(0, e.hitCooldowns[key] - frameUnits);
                }
            }
        }
        if (e.stunTimer && e.stunTimer > 0) {
            e.stunTimer -= dt;
            return;
        }

        // Update Timers using central utility
        updateTimers(e, dt, ['stateTimer', 'attackTimer', 'dashTimer']);

        // ─── BOSS LOGIC ───
        if (e.type === EnemyType.BOSS) {
            if (e.state !== 'ACTIVE') {
                const targetY = viewport.rows / 4;
                const dy = targetY - e.y;
                e.y += Math.min(dy, 0.1 * frameUnits);
                return;
            }
            
            // Invoke Boss Controller (Delegate Logic)
            if (bossController) {
                bossController.updateBoss(e, dt, snakeHead);
            }
            return;
        }

        // ─── STANDARD ENEMY AI ───
        const usesGravity = e.physicsProfile?.usesVerticalPhysics && isSideScroll;

        if (e.type === EnemyType.SHOOTER) {
            updateShooter(e, aiContext);
        } else if (e.type === EnemyType.DASHER) {
            updateDasher(e, aiContext);
        } else if (e.type === EnemyType.INTERCEPTOR) {
            updateInterceptor(e, aiContext);
        } else {
            // HUNTER (Default Chase)
            const dx = snakeHead.x - e.x;
            const dy = snakeHead.y - e.y;
            const dist = Math.hypot(dx, dy);
            
            e.intent = 'ATTACKING';
            if (dist > 0.1) {
                const accel = 0.5;
                e.vx += (dx / dist) * accel * baseSpeedMod;
                e.vy += (dy / dist) * accel * baseSpeedMod;
                e.vx *= 0.92;
                e.vy *= 0.92;
            }
        }

        // 2. Physics Correction
        if (usesGravity) {
            // X velocity integration for gravity entities
            const dtSec = dt / 1000;
            const nextX = e.x + e.vx * baseSpeedMod * dtSec;
            
             // Check X Wall
             const checkWall = (x: number, y: number) => {
                if (isEntering) return false;

                const gx = Math.round(x);
                const gy = Math.round(y);
                const isOutOfBounds = gx < 0 || gx >= viewport.cols || gy < 0 || gy >= viewport.rows;
                
                return isOutOfBounds || wallsRef.current.some(w => w.x === gx && w.y === gy);
             };

             if (!checkWall(nextX, e.y)) {
                 e.x = nextX;
             } else {
                 e.vx = 0;
             }
        } else {
             // 3. Standard Integration & Collision using Utility
             // Pass isEntering as ignoreBounds flag
             applyMovement(e, dt, wallsRef.current, viewport.cols, viewport.rows, baseSpeedMod, isEntering);
        }

      });
    },
    [
      difficulty,
      enemiesRef,
      enemyVisualsRef,
      wallsRef,
      directionRef,
      powerUpsRef,
      lastPowerUpStateRef,
      setActivePowerUps,
      gameTimeRef,
      updateLoot,
      getMoveInterval,
      statsRef,
      game.stageRef,
      updateStamina,
      isStoppedRef,
      viewport,
      cameraRef,
      bossActiveRef,
      bossEnemyRef,
      bossController
    ]
  );

  return {
    getNextHead,
    commitMove,
    updateEnemies,
    updateLoot,
    getMoveProgress,
    updateStamina
  };
}
