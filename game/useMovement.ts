
import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import {
  Direction,
  Point,
  FoodType,
  EnemyType,
  Difficulty
} from '../types';
import {
  GRID_COLS,
  GRID_ROWS,
  PROJECTILE_SPEED,
  DIFFICULTY_CONFIGS,
  DEFAULT_SETTINGS,
  MAGNET_RADIUS,
  XP_BASE_MAGNET_RADIUS,
  STAMINA_CONFIG
} from '../constants';
import { useSpawner } from './useSpawner';
import { audio } from '../utils/audio';

export function useMovement(
  game: ReturnType<typeof useGameState>,
  spawner: ReturnType<typeof useSpawner>
) {
  const {
    snakeRef,
    prevTailRef, // Access for tail tracking
    directionRef,
    directionQueueRef,
    enemiesRef,
    wallsRef,
    powerUpsRef,
    lastPowerUpStateRef,
    setActivePowerUps,
    difficulty,
    projectilesRef,
    gameTimeRef,
    overclockActiveRef,
    statsRef,
    foodRef,
    audioEventsRef,
    terminalsRef, // Need access to terminal state for Boss logic
    uiCombo,
    traitsRef, // NEW: Traits Access
    stageReadyRef, // NEW: Access stage completion state
    staminaRef,
    stopIntentRef,
    isStoppedRef,
    stopCooldownRef
  } = game;

  const { spawnEnemy } = spawner;

  // ─────────────────────────────
  // SNAKE MOVEMENT (TIME-GATED)
  // ─────────────────────────────
  const moveAccumulatorRef = useRef(0);
  const bossAudioThrottleRef = useRef(0);
  
  const getMoveInterval = useCallback(() => {
      let interval = DEFAULT_SETTINGS.initialSpeed;
      
      // TRAIT: SYNTH ADRENALINE (Overdrive)
      if (traitsRef.current.speedComboScaler > 0) {
          const comboBoost = Math.min(0.4, uiCombo * traitsRef.current.speedComboScaler); 
          interval /= (1 + comboBoost);
      }

      if (overclockActiveRef.current) {
          const lvl = statsRef.current.weapon.overclockLevel;
          const speedBoost = 1.5 + (lvl * 0.1);
          interval /= speedBoost;
      }
      return interval;
  }, [overclockActiveRef, statsRef, traitsRef, uiCombo]);

  // ─────────────────────────────
  // STAMINA LOGIC
  // ─────────────────────────────
  const updateStamina = useCallback((dt: number) => {
      const max = STAMINA_CONFIG.MAX;
      
      // Determine if we can stop
      // If cooldown is active, we must wait until stamina reaches threshold
      if (stopCooldownRef.current) {
          if (staminaRef.current > STAMINA_CONFIG.MIN_TO_REENGAGE) {
              stopCooldownRef.current = false;
          } else {
              // Force release
              stopIntentRef.current = false; // Logically ignore input even if held
          }
      }

      // Check Intent
      if (stopIntentRef.current && !stopCooldownRef.current && staminaRef.current > 0) {
          // ENGAGE STOP
          if (!isStoppedRef.current) {
              isStoppedRef.current = true;
              audio.setStopEffect(true);
          }
          
          // Drain
          staminaRef.current -= dt * STAMINA_CONFIG.DRAIN_RATE;
          
          // Depletion Check
          if (staminaRef.current <= 0) {
              staminaRef.current = 0;
              isStoppedRef.current = false;
              stopCooldownRef.current = true; // Trigger cooldown
              audio.setStopEffect(false);
              audio.play('UI_HARD_CLICK'); // Release snap sound
          }
      } else {
          // DISENGAGE / RECHARGE
          if (isStoppedRef.current) {
              isStoppedRef.current = false;
              audio.setStopEffect(false);
          }
          
          // Recharge
          if (staminaRef.current < max) {
              staminaRef.current = Math.min(max, staminaRef.current + dt * STAMINA_CONFIG.RECHARGE_RATE);
          }
      }
  }, [staminaRef, stopIntentRef, isStoppedRef, stopCooldownRef]);

  const getMoveProgress = useCallback(() => {
      const interval = getMoveInterval();
      // Returns 0.0 to 1.0 representing progress TOWARDS the next grid cell
      // Since logic commits instantly at 1.0 and resets to 0, 
      // 0.0 means "Just arrived at new cell", 0.9 means "About to move"
      return Math.min(1, Math.max(0, moveAccumulatorRef.current / interval));
  }, [getMoveInterval]);

  const getNextHead = useCallback((dt: number): Point | null => {
    // 1. Update Stamina System first
    updateStamina(dt);

    // 2. If Stopped, freeze movement accumulator
    if (isStoppedRef.current) {
        // We do NOT increment accumulator.
        return null; 
    }

    const interval = getMoveInterval();

    moveAccumulatorRef.current += dt;

    if (moveAccumulatorRef.current < interval) {
      return null;
    }

    moveAccumulatorRef.current -= interval;

    if (directionQueueRef.current.length > 0) {
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
  }, [directionRef, directionQueueRef, snakeRef, getMoveInterval, updateStamina, isStoppedRef]);


  const commitMove = useCallback(
    (newHead: Point, grew: boolean) => {
      // 🛑 INVARIANT CHECK: HEAD OVERLAP (FRAME STABILITY)
      const currentHead = snakeRef.current[0];
      if (currentHead && newHead.x === currentHead.x && newHead.y === currentHead.y) {
          // Warning suppressed for browser build
          return;
      }

      // COMMIT PHASE
      snakeRef.current.unshift(newHead);
      
      if (!grew) {
          // Capture the tail before removing it for interpolation
          const removed = snakeRef.current.pop();
          if (removed) {
              prevTailRef.current = removed;
          }
      } else {
          // Growing: Tail stays put, so prevTail effectively equals current tail
          // But visually the 'phantom' tail is the current tail position
          // This keeps the end segment stable during growth
          prevTailRef.current = snakeRef.current[snakeRef.current.length - 1];
      }

      // 🛑 INVARIANT REPAIR: DUPLICATE SEGMENT REMOVAL
      // If head and neck are identical after update (oscillation bug), repair immediately
      const head = snakeRef.current[0];
      const neck = snakeRef.current[1];
      if (neck && head.x === neck.x && head.y === neck.y) {
          // Error suppressed for browser build
          // Remove the duplicate neck segment to restore manifold
          snakeRef.current.splice(1, 1);
      }
    },
    [snakeRef, prevTailRef]
  );

  // ─────────────────────────────
  // LOOT MAGNETISM (PHYSICS)
  // ─────────────────────────────
  const updateLoot = useCallback((dt: number, head: Point) => {
      const now = gameTimeRef.current;
      const isMagnetActive = now < powerUpsRef.current.magnetUntil;
      const globalRange = isMagnetActive ? 100 : 0; // Effectively global
      
      // AUTO-CLEANUP: If stage is ready, pull ALL XP orbs globally
      const isCleanupPhase = stageReadyRef.current; 
      
      const baseMagnetRange = XP_BASE_MAGNET_RADIUS + (statsRef.current.magnetRangeMod || 0);
      
      // Dynamic Speed Calculation
      const moveInterval = getMoveInterval();
      const snakeSpeed = 1000 / moveInterval; // Tiles per second
      
      // Accelerated pickup during cleanup
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
              // SNAP LOGIC
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
  }, [foodRef, powerUpsRef, gameTimeRef, statsRef, getMoveInterval, stageReadyRef]);

  // ─────────────────────────────
  // ENEMY LOGIC (SMOOTH MOVEMENT)
  // ─────────────────────────────
  const updateEnemies = useCallback(
    (dt: number, snakeHead: { x: number; y: number }) => {
      
      // 0. Update Loot Physics First
      updateLoot(dt, snakeHead);

      const now = gameTimeRef.current;
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];

      // 1. Check PowerUps State
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

      // 2. Base Speed Calculation
      const baseSpeedMod = (isSlowActive ? 0.3 : 1.0) * diffConfig.speedMod;
      const moveDistance = 3.5 * baseSpeedMod * (dt / 1000);

      const bpm = audio.getBpm();
      const beatInterval = 60000 / bpm;
      const beatPhase = (now % beatInterval) / beatInterval;
      const rhythmicSpeedMod = 0.2 + 1.6 * Math.pow(Math.sin(beatPhase * Math.PI), 4);

      // 3. Iterate Enemies
      const frameUnits = dt / 16.667;
      
      enemiesRef.current.forEach(e => {
        // ─── STATE MANAGEMENT (INGRESS) ───
        if (e.state !== 'ACTIVE') {
            const margin = 0.5;
            const insideX = e.x >= margin && e.x <= GRID_COLS - margin;
            const insideY = e.y >= margin && e.y <= GRID_ROWS - margin;
            
            if (insideX && insideY) {
                e.state = 'ACTIVE';
            } else {
                e.state = 'ENTERING';
            }
        }

        if (e.flash && e.flash > 0) e.flash = Math.max(0, e.flash - frameUnits);
        
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

        // ─── BOSS AI ───
        if (e.type === EnemyType.BOSS) {
          if (e.state !== 'ACTIVE') {
              const targetY = GRID_ROWS / 4;
              const dy = targetY - e.y;
              e.y += Math.min(dy, 0.1 * frameUnits);
              return; 
          }

          // ** WARDEN LOGIC (OPEN ARENA CHASE) **
          if (e.bossConfigId === 'WARDEN_07') {
               if (snakeHead) {
                   const dist = Math.hypot(snakeHead.x - e.x, snakeHead.y - e.y);
                   const targetDist = 4; // Get close for sword
                   
                   // Move towards player if far, back up if too close
                   if (dist > targetDist) {
                       const angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                       e.x += Math.cos(angle) * 0.05 * frameUnits;
                       e.y += Math.sin(angle) * 0.05 * frameUnits;
                   }
               }
               // Keep in bounds
               e.x = Math.max(2, Math.min(GRID_COLS - 2, e.x));
               e.y = Math.max(2, Math.min(GRID_ROWS - 2, e.y));
               return;
          }

          // ** NEOPHYTE STAGE 4 LOGIC BRANCH **
          if (difficulty === Difficulty.EASY && game.stageRef.current <= 4) {
              if (!snakeHead) return; // Safety: Do not calculate angles if player is undefined

              const dist = Math.hypot(snakeHead.x - e.x, snakeHead.y - e.y);
              const targetDist = 12;
              const angleToSnake = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
              
              let moveAngle = angleToSnake;
              if (dist < targetDist) moveAngle += Math.PI; 
              
              moveAngle += Math.sin(now / 1500) * 0.8;

              const neophyteSpeed = 0.03 * frameUnits;
              e.x += Math.cos(moveAngle) * neophyteSpeed;
              e.y += Math.sin(moveAngle) * neophyteSpeed;
              
              e.x = Math.max(2, Math.min(GRID_COLS - 2, e.x));
              e.y = Math.max(2, Math.min(GRID_ROWS - 2, e.y));

              // 3. SCATTER SHOT ATTACK (Unconditional)
              e.attackTimer = (e.attackTimer || 0) + dt;
              
              if (e.attackTimer > 2000 && e.attackTimer < 2500) {
                  e.flash = 2; 
              }

              if (e.attackTimer >= 2500) {
                  e.attackTimer = 0;
                  
                  const spread = 0.25; 
                  const baseAngle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                  
                  for (let i = -1; i <= 1; i++) {
                      const angle = baseAngle + (i * spread);
                      projectilesRef.current.push({
                          id: Math.random().toString(36),
                          x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          vx: Math.cos(angle) * PROJECTILE_SPEED * 0.5 * (DEFAULT_SETTINGS.gridSize / 20),
                          vy: Math.sin(angle) * PROJECTILE_SPEED * 0.5 * (DEFAULT_SETTINGS.gridSize / 20),
                          damage: 15,
                          color: '#ff3333',
                          owner: 'ENEMY',
                          size: 6,
                          type: 'STANDARD',
                          usesGravity: false
                      });
                  }
                  audioEventsRef.current.push({ type: 'SHOOT' });
              }
              
              return; 
          }

          // ** STANDARD BOSS BEHAVIOR (Sentinel) **
          const hpRatio = e.hp / e.maxHp;
          const prevPhase = e.bossPhase || 1;
          
          let phase = 1;
          if (hpRatio < 0.3) phase = 3;
          else if (hpRatio < 0.6) phase = 2;
          
          if (phase !== prevPhase) {
              e.bossPhase = phase;
              e.summons = 0; 
              audioEventsRef.current.push({ type: 'EMP' }); 
          }

          e.attackTimer = (e.attackTimer || 0) + dt;
          e.dashTimer = (e.dashTimer || 0) + dt;

          if (phase === 1) {
              const dist = Math.hypot(snakeHead.x - e.x, snakeHead.y - e.y);
              const targetDist = 15; 
              
              const angleToSnake = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
              
              let moveAngle = angleToSnake;
              if (dist < targetDist) moveAngle += Math.PI; 
              
              moveAngle += Math.sin(now / 1500) * 0.8;

              e.x += Math.cos(moveAngle) * 0.04 * frameUnits;
              e.y += Math.sin(moveAngle) * 0.04 * frameUnits;

              if (e.attackTimer > 2000) {
                  e.attackTimer = 0;
                  if (projectilesRef.current.length < 200) {
                      const burstCount = 3;
                      for(let i=0; i<burstCount; i++) {
                          const spread = 0.15;
                          const a = angleToSnake + (i - 1) * spread;
                          projectilesRef.current.push({
                              id: Math.random().toString(36),
                              x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              vx: Math.cos(a) * PROJECTILE_SPEED * 0.6 * (DEFAULT_SETTINGS.gridSize / 20),
                              vy: Math.sin(a) * PROJECTILE_SPEED * 0.6 * (DEFAULT_SETTINGS.gridSize / 20),
                              damage: 20,
                              color: '#ff3333',
                              owner: 'ENEMY',
                              size: 6,
                              type: 'STANDARD',
                              usesGravity: false
                          });
                      }
                      audioEventsRef.current.push({ type: 'SHOOT' });
                  }
              }
          } 
          else if (phase === 2) {
              const cx = GRID_COLS / 2;
              const cy = GRID_ROWS / 2;
              const dx = cx - e.x;
              const dy = cy - e.y;
              const distToCenter = Math.hypot(dx, dy);
              
              if (distToCenter > 2) {
                  e.x += (dx / distToCenter) * 0.06 * frameUnits;
                  e.y += (dy / distToCenter) * 0.06 * frameUnits;
              } else {
                  e.x = cx + Math.cos(now / 1000) * 2;
                  e.y = cy + Math.sin(now / 1000) * 2;
              }

              if (e.spawnTimer === undefined) e.spawnTimer = 0;
              e.spawnTimer += dt;
              
              if (e.spawnTimer > 4500) {
                  e.spawnTimer = 0;
                  if ((e.summons || 0) < 6 && enemiesRef.current.length < 8) {
                      spawnEnemy(EnemyType.INTERCEPTOR);
                      spawnEnemy(EnemyType.INTERCEPTOR);
                      e.summons = (e.summons || 0) + 2;
                  }
              }

              if (e.attackTimer > 2800) {
                  e.attackTimer = 0;
                  if (projectilesRef.current.length < 200) {
                      const count = 12;
                      for(let i=0; i<count; i++) {
                          const a = (i / count) * Math.PI * 2 + (now / 1000);
                          projectilesRef.current.push({
                              id: Math.random().toString(36),
                              x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              vx: Math.cos(a) * PROJECTILE_SPEED * 0.45 * (DEFAULT_SETTINGS.gridSize / 20),
                              vy: Math.sin(a) * PROJECTILE_SPEED * 0.45 * (DEFAULT_SETTINGS.gridSize / 20),
                              damage: 15,
                              color: '#cc00ff',
                              owner: 'ENEMY',
                              size: 7,
                              type: 'STANDARD',
                              usesGravity: false
                          });
                      }
                      audioEventsRef.current.push({ type: 'SHOOT' });
                  }
              }
          }
          else if (phase === 3) {
              if (e.dashState === 'IDLE') {
                  if (e.dashTimer > 2500) {
                      e.dashState = 'CHARGE';
                      e.dashTimer = 0;
                      e.targetPos = { x: snakeHead.x, y: snakeHead.y };
                  }
                  e.x += (Math.random() - 0.5) * 0.2 * frameUnits;
                  e.y += (Math.random() - 0.5) * 0.2 * frameUnits;
              } 
              else if (e.dashState === 'CHARGE') {
                  if (e.dashTimer > 600) {
                      e.dashState = 'DASH';
                      e.dashTimer = 0;
                      const dx = (e.targetPos?.x || 0) - e.x;
                      const dy = (e.targetPos?.y || 0) - e.y;
                      e.angle = Math.atan2(dy, dx);
                  }
              }
              else if (e.dashState === 'DASH') {
                  const dashSpeed = 0.5;
                  const nextX = e.x + Math.cos(e.angle || 0) * dashSpeed * frameUnits;
                  const nextY = e.y + Math.sin(e.angle || 0) * dashSpeed * frameUnits;
                  
                  if (nextX < 2 || nextX > GRID_COLS - 2 || nextY < 2 || nextY > GRID_ROWS - 2) {
                      e.dashState = 'IDLE';
                      e.dashTimer = 0;
                  } else {
                      e.x = nextX;
                      e.y = nextY;
                  }
                  
                  if (e.dashTimer > 400) {
                      e.dashState = 'IDLE';
                      e.dashTimer = 0;
                  }
                  
                  if (Math.random() < 0.4 && projectilesRef.current.length < 200) {
                       projectilesRef.current.push({
                          id: Math.random().toString(36),
                          x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          vx: 0,
                          vy: 0, 
                          damage: 25,
                          color: '#ff4400',
                          owner: 'ENEMY',
                          size: 6,
                          life: 120,
                          type: 'STANDARD',
                          usesGravity: false
                      });
                  }
              }

              if (e.dashState !== 'DASH') {
                  if (e.attackTimer > 120) { 
                      e.attackTimer = 0;
                      if (projectilesRef.current.length < 200) {
                          const spiralAngle = (now / 150) % (Math.PI * 2);
                          
                          [0, Math.PI].forEach(offset => {
                              const a = spiralAngle + offset;
                              projectilesRef.current.push({
                                  id: Math.random().toString(36),
                                  x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                                  y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                                  vx: Math.cos(a) * PROJECTILE_SPEED * 0.5 * (DEFAULT_SETTINGS.gridSize / 20),
                                  vy: Math.sin(a) * PROJECTILE_SPEED * 0.5 * (DEFAULT_SETTINGS.gridSize / 20),
                                  damage: 12,
                                  color: '#ffaa00',
                                  owner: 'ENEMY',
                                  size: 5,
                                  type: 'STANDARD',
                                  usesGravity: false
                              });
                          });
                          
                          if (now - bossAudioThrottleRef.current > 200) {
                              audioEventsRef.current.push({ type: 'SHOOT' });
                              bossAudioThrottleRef.current = now;
                          }
                      }
                  }
              }
          }

          e.x = Math.max(1, Math.min(GRID_COLS - 2, e.x));
          e.y = Math.max(1, Math.min(GRID_ROWS - 2, e.y));
          
          return;
        }

        // ─── STANDARD ENEMY ───
        
        const dx = snakeHead.x - e.x;
        const dy = snakeHead.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.1) {
            const nx = dx / dist;
            const ny = dy / dist;

            let finalSpeed = moveDistance;
            if (e.state !== 'ACTIVE') {
                finalSpeed *= rhythmicSpeedMod;
            }

            const nextX = e.x + nx * finalSpeed;
            const nextY = e.y + ny * finalSpeed;

            const checkWall = (x: number, y: number) => {
                if (e.state !== 'ACTIVE') return false;

                const gx = Math.round(x);
                const gy = Math.round(y);
                return gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS || 
                       wallsRef.current.some(w => w.x === gx && w.y === gy);
            };

            if (!checkWall(nextX, e.y)) {
                e.x = nextX;
            }
            if (!checkWall(e.x, nextY)) {
                e.y = nextY;
            }
        }
      });
    },
    [
      difficulty,
      enemiesRef,
      wallsRef,
      directionRef,
      powerUpsRef,
      lastPowerUpStateRef,
      setActivePowerUps,
      spawnEnemy,
      projectilesRef,
      gameTimeRef,
      updateLoot,
      audioEventsRef,
      getMoveInterval,
      statsRef,
      game.stageRef,
      terminalsRef,
      updateStamina, // Added dependency
      isStoppedRef, // Added dependency
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
