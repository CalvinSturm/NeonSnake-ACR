
import { useCallback } from 'react';
import { FoodType, EnemyType, Point, Direction, Difficulty, TerminalType, BossEnemy, Enemy, DifficultyConfig } from '../types';
import {
  ENEMY_BASE_HP, BOSS_BASE_HP,
  TERMINAL_HACK_RADIUS, TERMINAL_HACK_TIME, TERMINAL_TIME_BY_DIFFICULTY, DIFFICULTY_CONFIGS, COLORS,
  ENEMY_PHYSICS_DEFAULTS,
  SPAWN_CONFIG, XP_CHUNK_THRESHOLDS, XP_CHUNK_VALUES,
  FALLBACK_SPAWN_POS, NEOPHYTE_SPAWN_WEIGHTS, STAGE_ENEMY_UNLOCKS,
  BOSS_SPAWN_SHAKE, BASE_ENEMY_SPEED
} from '../constants';
import { getRandomPos } from './gameUtils';
import { useGameState } from './useGameState';
import { ROOT_FILESYSTEM } from '../archive/data';
import { getUnlockedMemoryIds } from './memory/MemorySystem';
import { SENTINEL_BOSS_CONFIG } from './boss/definitions/SentinelBoss';
import { WARDEN_BOSS_CONFIG } from './boss/definitions/WardenBoss';
import { SPACESHIP_BOSS_CONFIG } from './boss/definitions/SpaceshipBoss';
import { getTierFromDifficulty, getMaxEnemies, scaleEnemy, getSpawnBurstCount, getSpawnInterval } from './difficultyScaler';

// ─── HELPERS ───

// Calculates scaled HP with diminishing returns for high stages
export const calculateEnemyHp = (baseHp: number, stage: number, level: number, diffConfig: DifficultyConfig): number => {
    let stageFactor = stage * 0.35;
    // Diminishing returns after stage 50 to prevent bullet sponges
    if (stage > 50) {
        stageFactor = 50 * 0.35 + (stage - 50) * 0.15;
    }
    return baseHp * (1 + stageFactor + level * 0.12) * diffConfig.hpMod; // Using hpMod which is mapped to hpMultiplier in constants
};

// Generates optimized XP orb values
export const getChunkedXpValues = (total: number, diffConfig: DifficultyConfig, maxOrbs: number = 20): number[] => {
    const values: number[] = [];
    // Apply Difficulty Multiplier
    const scaledTotal = Math.floor(total * (diffConfig.xpMultiplier || 1.0));
    
    let remaining = scaledTotal;
    
    // Determine efficient chunk size based on total
    let chunkSize = XP_CHUNK_VALUES.SMALL;
    if (scaledTotal >= XP_CHUNK_THRESHOLDS.HUGE) chunkSize = XP_CHUNK_VALUES.HUGE;
    else if (scaledTotal >= XP_CHUNK_THRESHOLDS.LARGE) chunkSize = XP_CHUNK_VALUES.LARGE;
    else if (scaledTotal >= XP_CHUNK_THRESHOLDS.MEDIUM) chunkSize = XP_CHUNK_VALUES.MEDIUM;
    
    // Fill up to maxOrbs - 1 with chunks
    while (remaining >= chunkSize && values.length < maxOrbs - 1) {
        values.push(chunkSize);
        remaining -= chunkSize;
    }
    
    // If we still have remaining XP and slots, use smaller chunks
    while (remaining > 0 && values.length < maxOrbs) {
        const take = Math.min(remaining, XP_CHUNK_VALUES.SMALL);
        values.push(take);
        remaining -= take;
    }

    // Dump any remainder into the last orb if we ran out of slots
    if (remaining > 0 && values.length > 0) {
        values[values.length - 1] += remaining;
    } else if (remaining > 0) {
        // Edge case: no slots used yet (shouldn't happen with logic above but safe)
        values.push(remaining);
    }
    
    return values;
};

// Calculates a valid off-screen spawn position
export const getOffscreenSpawnPos = (
    viewportCols: number, 
    viewportRows: number, 
    head: Point | undefined,
    difficulty: Difficulty,
    stage: number,
    direction: Direction
): { pos: Point, side: string } => {
    const margin = SPAWN_CONFIG.spawnMargin;
    const safetyRadius = SPAWN_CONFIG.spawnSafeRadius;
    
    // Neophyte Spawn Bias (Avoid front of player)
    let weights = [1, 1, 1, 1]; // Top, Right, Bottom, Left
    const isNeophyte = difficulty === Difficulty.EASY && stage <= 4;
    
    if (isNeophyte) {
        weights = NEOPHYTE_SPAWN_WEIGHTS[direction];
    }

    const getRandomSide = (w: number[]) => {
        const total = w.reduce((a,b) => a+b, 0);
        let r = Math.random() * total;
        for(let i=0; i<4; i++) {
            r -= w[i];
            if (r <= 0) return i;
        }
        return 3;
    };

    let validPos: Point | null = null;
    let spawnSide = 'TOP';
    let attempts = 0;

    while (attempts < 10) {
        attempts++;
        const sideIdx = getRandomSide(weights);
        let sx = 0, sy = 0;

        switch (sideIdx) {
            case 0: // Top
                sx = Math.floor(Math.random() * viewportCols);
                sy = -margin;
                spawnSide = 'TOP';
                break;
            case 1: // Right
                sx = viewportCols + margin;
                sy = Math.floor(Math.random() * viewportRows);
                spawnSide = 'RIGHT';
                break;
            case 2: // Bottom
                sx = Math.floor(Math.random() * viewportCols);
                sy = viewportRows + margin;
                spawnSide = 'BOTTOM';
                break;
            case 3: // Left
                sx = -margin;
                sy = Math.floor(Math.random() * viewportRows);
                spawnSide = 'LEFT';
                break;
        }

        // Distance Check from Head
        if (head) {
            const dist = Math.hypot(head.x - sx, head.y - sy);
            if (dist < safetyRadius) continue;
        }
        
        validPos = { x: sx, y: sy };
        break;
    }

    // Fallback if safety check fails repeatedly
    if (!validPos) {
        console.warn('Spawn safety check failed, using fallback.');
        validPos = FALLBACK_SPAWN_POS;
        spawnSide = 'TOP';
    }

    return { pos: validPos, side: spawnSide };
};


export function useSpawner(
  game: ReturnType<typeof useGameState>,
  triggerShake: (x: number, y: number) => void
) {
  const {
    snakeRef, foodRef, enemiesRef, wallsRef, terminalsRef,
    stageRef, bossActiveRef, setBossActive, difficulty, levelRef, gameTimeRef,
    enemySpawnTimerRef, terminalSpawnTimerRef, audioEventsRef, stageReadyRef,
    directionRef, bossOverrideTimerRef, viewport
  } = game;

  // ─────────────────────────────
  // FOOD
  // ─────────────────────────────
  const spawnFood = useCallback(() => {
    const occupied = [...foodRef.current, ...enemiesRef.current];
    const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current, viewport.cols, viewport.rows);

    if (!pos) return; 

    foodRef.current.push({
      ...pos,
      type: FoodType.NORMAL,
      id: crypto.randomUUID(),
      createdAt: gameTimeRef.current
    });
  }, [foodRef, enemiesRef, snakeRef, wallsRef, gameTimeRef, viewport]);

  const spawnLoot = useCallback((x: number, y: number) => {
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];
      const spawnChance = diffConfig.lootSpawnRate || 1.0;
      
      // Scale spawn count by difficulty
      const count = Math.random() < spawnChance ? 2 : 1;

      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = SPAWN_CONFIG.lootScatterDist; 
          
          const fx = Math.max(1, Math.min(viewport.cols - 2, x + Math.cos(angle) * dist));
          const fy = Math.max(1, Math.min(viewport.rows - 2, y + Math.sin(angle) * dist));

          foodRef.current.push({
              x: fx,
              y: fy,
              type: FoodType.NORMAL,
              id: crypto.randomUUID(),
              createdAt: gameTimeRef.current
          });
      }
  }, [foodRef, gameTimeRef, viewport, difficulty]);

  // ─────────────────────────────
  // XP DROPS
  // ─────────────────────────────
  const spawnXpOrbs = useCallback((x: number, y: number, totalXp: number) => {
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];
      const orbValues = getChunkedXpValues(totalXp, diffConfig);
      
      orbValues.forEach(val => {
          const offsetX = (Math.random() - 0.5) * SPAWN_CONFIG.foodOffset; 
          const offsetY = (Math.random() - 0.5) * SPAWN_CONFIG.foodOffset;
          
          let spawnX = x + offsetX;
          let spawnY = y + offsetY;

          spawnX = Math.max(SPAWN_CONFIG.xpOrbMargin, Math.min(viewport.cols - (SPAWN_CONFIG.xpOrbMargin + 1), spawnX));
          spawnY = Math.max(SPAWN_CONFIG.xpOrbMargin, Math.min(viewport.rows - (SPAWN_CONFIG.xpOrbMargin + 1), spawnY));

          foodRef.current.push({
              x: spawnX,
              y: spawnY,
              type: FoodType.XP_ORB,
              value: val,
              id: crypto.randomUUID(),
              createdAt: gameTimeRef.current,
              lifespan: SPAWN_CONFIG.xpOrbLifespan
          });
      });
  }, [foodRef, gameTimeRef, viewport, difficulty]);

  // ─────────────────────────────
  // CLEANUP
  // ─────────────────────────────
  const cleanupFood = useCallback(() => {
    const now = gameTimeRef.current;
    // Optimized filter
    foodRef.current = foodRef.current.filter(f => !f.lifespan || now - f.createdAt <= f.lifespan);
  }, [foodRef, gameTimeRef]);

  const pruneEnemies = useCallback(() => {
      let bossRemoved = false;
      for (const e of enemiesRef.current) {
          if (e.hp <= 0) {
              e.shouldRemove = true;
              if (e.type === EnemyType.BOSS) {
                  bossRemoved = true;
              }
          }
      }

      if (bossRemoved) {
          setBossActive(false);
          bossActiveRef.current = false;
      }
  }, [enemiesRef, setBossActive, bossActiveRef]);

  // ─────────────────────────────
  // TERMINAL
  // ─────────────────────────────
  const spawnTerminal = useCallback((forcedPos?: Point, forcedId?: string) => {
    if (!forcedPos && !forcedId && terminalsRef.current.length > 0) return;

    let pos: Point | null = forcedPos || null;

    if (!pos) {
        const occupied = [...foodRef.current, ...enemiesRef.current, ...snakeRef.current];
        pos = getRandomPos(snakeRef.current, occupied, wallsRef.current, viewport.cols, viewport.rows);
    }

    if (pos) {
        let type: TerminalType = 'RESOURCE';
        let color = COLORS.terminal;
        let associatedFileId: string | undefined;
        // Scale terminal hack time by difficulty
        const diffTimeScale = TERMINAL_TIME_BY_DIFFICULTY[difficulty] || 1.0;
        let totalTime = TERMINAL_HACK_TIME * diffTimeScale;

        if (forcedId === 'BOSS_OVERRIDE') {
            type = 'OVERRIDE';
            color = '#ffaa00';
            totalTime = SPAWN_CONFIG.terminalOverrideTime * diffTimeScale;
        } else {
            // Memory Terminal Logic
            if (Math.random() < 0.15) {
                const unlocked = getUnlockedMemoryIds();
                const files = ROOT_FILESYSTEM.contents.filter(f => f.type === 'file');
                const lockedFiles = files.filter(f => !unlocked.includes(f.id));

                if (lockedFiles.length > 0) {
                    type = 'MEMORY';
                    color = '#ffd700'; // Gold
                    const file = lockedFiles[Math.floor(Math.random() * lockedFiles.length)];
                    associatedFileId = file.id;
                    totalTime = SPAWN_CONFIG.terminalMemoryTime * diffTimeScale;
                }
            }
        }

        terminalsRef.current.push({
          ...pos,
          id: forcedId || crypto.randomUUID(),
          type,
          radius: TERMINAL_HACK_RADIUS,
          progress: 0,
          totalTime, 
          isLocked: false,
          color,
          associatedFileId
        });
    }
  }, [terminalsRef, foodRef, enemiesRef, snakeRef, wallsRef, viewport, difficulty]);

  // ─────────────────────────────
  // ENEMY
  // ─────────────────────────────
  const spawnEnemy = useCallback((forcedType?: EnemyType, forcedPos?: Point) => {
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    const tier = getTierFromDifficulty(difficulty);
    const maxEnemies = getMaxEnemies(tier);
    
    const isBossStage = stageRef.current % 5 === 0;

    // BOSS SPAWN
    if (isBossStage && !bossActiveRef.current && !game.bossDefeatedRef.current) {
      const bossHp = calculateEnemyHp(BOSS_BASE_HP, stageRef.current, 0, diffConfig); // Using full config for HP

      let bossConfig = SENTINEL_BOSS_CONFIG;
      let startState = 'IDLE';
      let spawnY = SPAWN_CONFIG.bossSpawnY;
      let physics = ENEMY_PHYSICS_DEFAULTS[EnemyType.BOSS];
      
      if (stageRef.current === 10) {
          bossConfig = SPACESHIP_BOSS_CONFIG;
          startState = 'IDLE';
          spawnY = SPAWN_CONFIG.bossSpawnY;
      }
      else if (stageRef.current === 15) {
          bossConfig = WARDEN_BOSS_CONFIG;
          startState = 'IDLE_1';
          spawnY = SPAWN_CONFIG.bossSpawnY; 
          physics = { usesVerticalPhysics: false, canJump: false, jumpCooldown: 0 };
      }

      // Populate phases from config to state
      const phasesTrigger = bossConfig.phases.map(p => ({
          thresholdHp: bossHp * p.threshold,
          newState: p.entryState
      }));

      // Strictly typed boss
      const bossEnemy: BossEnemy = {
        x: Math.floor(viewport.cols / 2),
        y: spawnY,
        id: 'BOSS',
        type: EnemyType.BOSS,
        state: 'SPAWNING',
        spawnSide: 'TOP',
        spawnTime: gameTimeRef.current,
        hp: bossHp,
        maxHp: bossHp,
        flash: 0,
        hitCooldowns: {},
        bossPhase: 1,
        attackTimer: 0,
        spawnTimer: 0,
        dashTimer: 0,
        dashState: 'IDLE',
        vx: 0,
        vy: 0,
        speed: 0,
        isGrounded: false,
        physicsProfile: physics,
        jumpCooldownTimer: 0,
        jumpIntent: false,
        bossConfigId: bossConfig.id,
        bossState: {
            stateId: startState,
            timer: 0,
            phaseIndex: 0,
            phases: phasesTrigger
        },
        facing: -1,
        aiState: 'BOSS_LOGIC',
        intent: 'ATTACKING'
      };

      enemiesRef.current.push(bossEnemy);

      setBossActive(true);
      bossActiveRef.current = true;
      
      audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
      triggerShake(BOSS_SPAWN_SHAKE, BOSS_SPAWN_SHAKE);
      return;
    }

    if (bossActiveRef.current && !forcedType) return;
    if (enemiesRef.current.length >= maxEnemies) return;

    // STANDARD ENEMY SPAWN
    let validPos: Point;
    let spawnSide: string;

    if (forcedPos) {
        validPos = forcedPos;
        // Infer side
        if (validPos.y < 0) spawnSide = 'TOP';
        else if (validPos.y > viewport.rows) spawnSide = 'BOTTOM';
        else if (validPos.x < 0) spawnSide = 'LEFT';
        else spawnSide = 'RIGHT';
    } else {
        const result = getOffscreenSpawnPos(
            viewport.cols, 
            viewport.rows, 
            snakeRef.current[0], 
            difficulty, 
            stageRef.current, 
            directionRef.current
        );
        validPos = result.pos;
        spawnSide = result.side;
    }

    // ── PROGRESSIVE UNLOCK LOGIC ──
    // Filter by BOTH stage unlock AND difficulty config's allowedEnemies
    const allowedByDiff = new Set(diffConfig.allowedEnemies);
    const currentStage = stageRef.current;

    // Build available types based on stage thresholds AND difficulty allowlist
    const availableTypes: EnemyType[] = [];

    // Hunter is always base
    if (allowedByDiff.has(EnemyType.HUNTER) && currentStage >= STAGE_ENEMY_UNLOCKS[EnemyType.HUNTER]) {
        availableTypes.push(EnemyType.HUNTER);
    }

    // Interceptor unlocks at stage 2+
    if (allowedByDiff.has(EnemyType.INTERCEPTOR) && currentStage >= STAGE_ENEMY_UNLOCKS[EnemyType.INTERCEPTOR]) {
        availableTypes.push(EnemyType.INTERCEPTOR);
    }

    // Shooter unlocks at stage 4+
    if (allowedByDiff.has(EnemyType.SHOOTER) && currentStage >= STAGE_ENEMY_UNLOCKS[EnemyType.SHOOTER]) {
        availableTypes.push(EnemyType.SHOOTER);
    }

    // Dasher unlocks at stage 6+
    if (allowedByDiff.has(EnemyType.DASHER) && currentStage >= STAGE_ENEMY_UNLOCKS[EnemyType.DASHER]) {
        availableTypes.push(EnemyType.DASHER);
    }

    // Fallback to Hunter if somehow empty
    if (availableTypes.length === 0) {
        availableTypes.push(EnemyType.HUNTER);
    }

    // Weighted selection - newer enemy types have slightly higher spawn weight
    // to make progression feel impactful
    const getWeightedType = (): EnemyType => {
        const weights: number[] = availableTypes.map((_, idx) => {
            // Base weight + bonus for being a "newer" unlock
            return 1.0 + (idx * 0.3);
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;

        for (let i = 0; i < availableTypes.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return availableTypes[i];
        }
        return availableTypes[availableTypes.length - 1];
    };

    const type = forcedType ?? getWeightedType();

    const finalHp = (type === EnemyType.INTERCEPTOR && bossActiveRef.current) 
        ? ENEMY_BASE_HP * 0.5 
        : calculateEnemyHp(ENEMY_BASE_HP, stageRef.current, levelRef.current, diffConfig);

    const enemy: Enemy = {
      ...validPos,
      id: crypto.randomUUID(),
      type,
      state: 'SPAWNING',
      spawnSide,
      spawnTime: gameTimeRef.current,
      hp: finalHp,
      maxHp: finalHp,
      flash: 0,
      hitCooldowns: {},
      attackTimer: 0,
      spawnTimer: 0,
      dashTimer: 0,
      aiState: 'IDLE', 
      intent: 'IDLE',
      dashState: 'IDLE',
      vx: 0,
      vy: 0,
      speed: BASE_ENEMY_SPEED,
      isGrounded: false,
      physicsProfile: ENEMY_PHYSICS_DEFAULTS[type],
      jumpCooldownTimer: 0,
      jumpIntent: false
    };

    // Apply scaling
    scaleEnemy(enemy, tier);

    enemiesRef.current.push(enemy);
    audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });

  }, [
    difficulty, stageRef, bossActiveRef, enemiesRef, snakeRef, wallsRef,
    setBossActive, triggerShake, levelRef, audioEventsRef,
    game.bossDefeatedRef, directionRef, viewport, gameTimeRef
  ]);

  // ─────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────
  const update = useCallback((dt: number) => {
    cleanupFood();

    // CLEANUP ENEMIES
    if (enemiesRef.current.length > 0) {
         enemiesRef.current = enemiesRef.current.filter(e => !e.shouldRemove);
    }

    // Food Replenishment
    if (!stageReadyRef.current) {
        const normalFoodCount = foodRef.current.filter(f => f.type === FoodType.NORMAL).length;
        if (normalFoodCount < 1) {
            spawnFood();
        }
    }

    // Boss Mechanics (Override Terminal)
    if (bossActiveRef.current) {
        terminalSpawnTimerRef.current = 0;

        const hasOverride = terminalsRef.current.some(t => t.type === 'OVERRIDE');
        
        if (!hasOverride) {
            bossOverrideTimerRef.current += dt;
            if (bossOverrideTimerRef.current > SPAWN_CONFIG.bossOverrideInterval) {
                spawnTerminal(undefined, 'BOSS_OVERRIDE');
                bossOverrideTimerRef.current = 0;
                audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
            }
        } else {
            bossOverrideTimerRef.current = 0;
        }
    }

    // Timers
    enemySpawnTimerRef.current += dt;
    terminalSpawnTimerRef.current += dt;

    // Calculate difficulty-adjusted spawn interval
    const tier = getTierFromDifficulty(difficulty);
    const baseInterval = SPAWN_CONFIG.baseEnemySpawnInterval;
    const adjustedInterval = Math.max(
        SPAWN_CONFIG.minEnemySpawnInterval,
        getSpawnInterval(tier, baseInterval)
    );

    if (enemySpawnTimerRef.current >= adjustedInterval) {
      // Only spawn if stage is NOT clearing
      if (!stageReadyRef.current) {
          // Burst spawning - spawn multiple enemies at once on higher difficulties
          const burstCount = getSpawnBurstCount(tier, stageRef.current);
          const maxEnemies = getMaxEnemies(tier);

          for (let i = 0; i < burstCount; i++) {
              // Check max enemies limit per spawn
              if (enemiesRef.current.length < maxEnemies) {
                  spawnEnemy();
              }
          }
      }
      enemySpawnTimerRef.current -= adjustedInterval;
    }

    if (terminalSpawnTimerRef.current >= SPAWN_CONFIG.terminalSpawnInterval) {
      if (terminalsRef.current.length === 0 && !bossActiveRef.current && !stageReadyRef.current) {
          spawnTerminal();
      }
      terminalSpawnTimerRef.current -= SPAWN_CONFIG.terminalSpawnInterval;
    }
  }, [
      difficulty, bossActiveRef, spawnEnemy, spawnTerminal, terminalsRef,
      enemySpawnTimerRef, terminalSpawnTimerRef, foodRef, spawnFood,
      stageReadyRef, bossOverrideTimerRef, audioEventsRef, cleanupFood,
      enemiesRef, stageRef
  ]);

  return { update, spawnFood, spawnLoot, spawnXpOrbs, spawnEnemy, spawnTerminal, cleanupFood, pruneEnemies };
}
