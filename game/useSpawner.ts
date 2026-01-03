
import { useCallback } from 'react';
import { FoodType, FoodItem, EnemyType, Point, Direction, Difficulty, TerminalType } from '../types';
import {
  GRID_COLS, GRID_ROWS, ENEMY_BASE_HP, BOSS_BASE_HP,
  TERMINAL_HACK_RADIUS, TERMINAL_HACK_TIME, DIFFICULTY_CONFIGS, COLORS,
ENEMY_SPAWN_INTERVAL, ENEMY_PHYSICS_DEFAULTS, PHYSICS
} from '../constants';
import { getRandomPos } from './gameUtils';
import { useGameState } from './useGameState';
import { ROOT_FILESYSTEM } from '../archive/data';
import { getUnlockedMemoryIds } from './memory/MemorySystem';
import { SENTINEL_BOSS_CONFIG } from './boss/definitions/SentinelBoss';
import { WARDEN_BOSS_CONFIG } from './boss/definitions/WardenBoss';

export function useSpawner(
  game: ReturnType<typeof useGameState>,
  triggerShake: (x: number, y: number) => void
) {
  const {
    snakeRef, foodRef, enemiesRef, wallsRef, terminalsRef,
    stageRef, bossActiveRef, setBossActive, difficulty, levelRef, gameTimeRef,
    enemySpawnTimerRef, terminalSpawnTimerRef, audioEventsRef, stageReadyRef,
    directionRef, bossOverrideTimerRef // NEW
  } = game;

  // ─────────────────────────────
  // FOOD
  // ─────────────────────────────
  const spawnFood = useCallback(() => {
    const occupied = [...foodRef.current, ...enemiesRef.current];
    const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);

    if (!pos) return; // Abort if no space

    // Canonical Food: Always NORMAL, simple, safe.
    foodRef.current.push({
      ...pos,
      type: FoodType.NORMAL,
      id: Math.random().toString(36),
      createdAt: gameTimeRef.current
      // No lifespan for normal food
    });
  }, [foodRef, enemiesRef, snakeRef, wallsRef, gameTimeRef]);

  // NEW: Spawn specific loot rewards (e.g. from Terminals)
  const spawnLoot = useCallback((x: number, y: number) => {
      // Spawn 2 food items nearby
      for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 1.5; // 1.5 grid units scatter
          
          // Clamp to grid boundaries to prevent out-of-bounds spawn
          const fx = Math.max(1, Math.min(GRID_COLS - 2, x + Math.cos(angle) * dist));
          const fy = Math.max(1, Math.min(GRID_ROWS - 2, y + Math.sin(angle) * dist));

          foodRef.current.push({
              x: fx,
              y: fy,
              type: FoodType.NORMAL,
              id: Math.random().toString(36),
              createdAt: gameTimeRef.current
          });
      }
  }, [foodRef, gameTimeRef]);

  // ─────────────────────────────
  // XP DROPS
  // ─────────────────────────────
  const spawnXpOrbs = useCallback((x: number, y: number, totalXp: number) => {
      // Chunking logic:
      // Prefer 50s, then 10s.
      // Small scatter radius.
      
      let remaining = totalXp;
      const orbs: { val: number }[] = [];
      
      while (remaining >= 50) {
          orbs.push({ val: 50 });
          remaining -= 50;
      }
      while (remaining > 0) {
          orbs.push({ val: 10 });
          remaining -= 10;
      }
      
      // Cap spawn to avoid entity flooding if XP is huge (unlikely but safe)
      if (orbs.length > 20) {
          // Consolidate if too many
          const megaOrbVal = Math.floor(totalXp / 10) * 10;
          orbs.length = 0;
          let r = totalXp;
          while (r > 0) {
              const v = Math.min(r, 100);
              orbs.push({ val: v });
              r -= v;
          }
      }

      orbs.forEach(orb => {
          const offsetX = (Math.random() - 0.5) * 2; 
          const offsetY = (Math.random() - 0.5) * 2;
          
          let spawnX = x + offsetX;
          let spawnY = y + offsetY;

          // SAFE CLAMPING: Ensure XP always lands inside the playable arena
          // Padded by 1.5 units to keep away from absolute edge walls
          spawnX = Math.max(1.5, Math.min(GRID_COLS - 2.5, spawnX));
          spawnY = Math.max(1.5, Math.min(GRID_ROWS - 2.5, spawnY));

          foodRef.current.push({
              x: spawnX,
              y: spawnY,
              type: FoodType.XP_ORB,
              value: orb.val,
              id: Math.random().toString(36),
              createdAt: gameTimeRef.current,
              lifespan: 15000 // 15s lifespan
          });
      });

  }, [foodRef, gameTimeRef]);

  // ─────────────────────────────
  // CLEANUP
  // ─────────────────────────────
  const cleanupFood = useCallback(() => {
    const now = gameTimeRef.current;
    // Filter in place
    let i = foodRef.current.length;
    while (i--) {
        const f = foodRef.current[i];
        if (f.lifespan && now - f.createdAt > f.lifespan) {
            foodRef.current.splice(i, 1);
        }
    }
  }, [foodRef, gameTimeRef]);

  const pruneEnemies = useCallback(() => {
      let bossRemoved = false;
      
      // Architecture: Do not filter ref.current directly. Mark for removal.
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
          bossActiveRef.current = false; // Sync ref immediately
      }
  }, [enemiesRef, setBossActive, bossActiveRef]);

  // ─────────────────────────────
  // TERMINAL
  // ─────────────────────────────
  const spawnTerminal = useCallback((forcedPos?: Point, forcedId?: string) => {
    // Limit standard terminal count if not forcing a specific override ID
    if (!forcedPos && !forcedId && terminalsRef.current.length > 0) return;

    let pos: Point | null = forcedPos || null;

    if (!pos) {
        const occupied = [...foodRef.current, ...enemiesRef.current, ...snakeRef.current];
        pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
    }

    if (pos) {
        let type: TerminalType = 'RESOURCE';
        let color = COLORS.terminal;
        let associatedFileId: string | undefined;
        let totalTime = TERMINAL_HACK_TIME;

        if (forcedId === 'BOSS_OVERRIDE') {
            type = 'OVERRIDE';
            color = '#ffaa00';
            totalTime = 2000;
        } else {
            // RARE SPAWN CHECK: Memory Terminal
            // 15% Chance, but only if there are locked files
            if (Math.random() < 0.15) {
                const unlocked = getUnlockedMemoryIds();
                const files = ROOT_FILESYSTEM.contents.filter(f => f.type === 'file');
                const lockedFiles = files.filter(f => !unlocked.includes(f.id));
                
                if (lockedFiles.length > 0) {
                    type = 'MEMORY';
                    color = '#ffd700'; // Gold
                    // Pick a random locked file
                    const file = lockedFiles[Math.floor(Math.random() * lockedFiles.length)];
                    associatedFileId = file.id;
                    totalTime = 3500; // Harder to hack
                }
            }
        }

        terminalsRef.current.push({
          ...pos,
          id: forcedId || Math.random().toString(36),
          type,
          radius: TERMINAL_HACK_RADIUS,
          progress: 0,
          totalTime, 
          isLocked: false,
          color,
          associatedFileId
        });
    }
  }, [terminalsRef, foodRef, enemiesRef, snakeRef, wallsRef]);

  // ─────────────────────────────
  // ENEMY
  // ─────────────────────────────
  const spawnEnemy = useCallback((forcedType?: EnemyType, forcedPos?: Point) => {
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    const isBossStage = stageRef.current % 5 === 0; // Trigger every 5 stages now (includes WARDEN at 5)

    // Use REF for sync logic
    // Prevent double spawn if boss already active OR defeated
    if (isBossStage && !bossActiveRef.current && !game.bossDefeatedRef.current) {
      const bossHp =
        BOSS_BASE_HP *
        diffConfig.bossHpMod *
        (1 + stageRef.current * 0.25);

      // SELECT BOSS CONFIG
      let bossConfig = SENTINEL_BOSS_CONFIG;
      let startState = 'IDLE';
      let spawnY = -5;
      let physics = ENEMY_PHYSICS_DEFAULTS[EnemyType.BOSS];
      
      // Stage 10 Specific: Warden (Moved from Stage 5)
      if (stageRef.current === 10) {
          bossConfig = WARDEN_BOSS_CONFIG;
          startState = 'IDLE_1';
          spawnY = -5; // Spawn from top, same as Sentinel
          // Disable vertical physics so it floats in Top Down
          physics = { usesVerticalPhysics: false, canJump: false, jumpCooldown: 0 };
      }

      enemiesRef.current.push({
        x: Math.floor(GRID_COLS / 2),
        y: spawnY,
        id: 'BOSS',
        type: EnemyType.BOSS,
        state: 'SPAWNING', // Start invulnerable
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
        // Physics
        vx: 0,
        vy: 0,
        isGrounded: false,
        physicsProfile: physics,
        jumpCooldownTimer: 0,
        jumpIntent: false,
        // STATE MACHINE INIT
        bossConfigId: bossConfig.id,
        bossState: {
            stateId: startState,
            timer: 0,
            phaseIndex: 0
        },
        facing: -1 // Face left towards start
      });

      setBossActive(true);
      bossActiveRef.current = true; // Sync Ref Immediately to block next spawn
      
      audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
      triggerShake(25, 25);
      return;
    }

    // Stop ambient spawns if boss is active (allow forced summons like Interceptors)
    if (bossActiveRef.current && !forcedType) return;

    if (bossActiveRef.current && enemiesRef.current.length > 5) return;

    // 🛑 OFFSCREEN SPAWN LOGIC (INGRESS SAFETY) & NEOPHYTE BIAS
    // 1. Pick a side (0: Top, 1: Right, 2: Bottom, 3: Left)
    let validPos: Point | null = forcedPos || null;
    let spawnSide: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' = 'TOP';
    let attempts = 0;
    const margin = 2; // Distance outside grid
    const spawnSafetyRadius = 8; // Safety distance from snake head

    // NEOPHYTE BIAS: Weight selection to avoid spawning in front of snake
    // Default weights: Equal chance
    let weights = [1, 1, 1, 1]; // Top, Right, Bottom, Left
    const isNeophyte = difficulty === Difficulty.EASY && stageRef.current <= 4;
    
    if (isNeophyte) {
        const dir = directionRef.current;
        // Direction.UP -> Avoid TOP (0), Prefer BOTTOM (2)
        if (dir === Direction.UP) weights = [0.1, 1, 3, 1];
        // Direction.RIGHT -> Avoid RIGHT (1), Prefer LEFT (3)
        else if (dir === Direction.RIGHT) weights = [1, 0.1, 1, 3];
        // Direction.DOWN -> Avoid BOTTOM (2), Prefer TOP (0)
        else if (dir === Direction.DOWN) weights = [3, 1, 0.1, 1];
        // Direction.LEFT -> Avoid LEFT (3), Prefer RIGHT (1)
        else if (dir === Direction.LEFT) weights = [1, 3, 1, 0.1];
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

    const head = snakeRef.current[0];

    // Only calculate random pos if not forced
    if (!validPos) {
        while (attempts < 10) {
            attempts++;
            const side = getRandomSide(weights);
            let sx = 0;
            let sy = 0;

            switch (side) {
                case 0: // Top
                    sx = Math.floor(Math.random() * GRID_COLS);
                    sy = -margin;
                    spawnSide = 'TOP';
                    break;
                case 1: // Right
                    sx = GRID_COLS + margin;
                    sy = Math.floor(Math.random() * GRID_ROWS);
                    spawnSide = 'RIGHT';
                    break;
                case 2: // Bottom
                    sx = Math.floor(Math.random() * GRID_COLS);
                    sy = GRID_ROWS + margin;
                    spawnSide = 'BOTTOM';
                    break;
                case 3: // Left
                    sx = -margin;
                    sy = Math.floor(Math.random() * GRID_ROWS);
                    spawnSide = 'LEFT';
                    break;
            }

            // Distance Check from Head (Prevent spawning directly in path if head is near edge)
            if (head) {
                const dist = Math.hypot(head.x - sx, head.y - sy);
                if (dist < spawnSafetyRadius) continue;
            }

            validPos = { x: sx, y: sy };
            break;
        }
    } else {
        // Infer side for forced pos (simple heuristic)
        if (validPos.y < 0) spawnSide = 'TOP';
        else if (validPos.y > GRID_ROWS) spawnSide = 'BOTTOM';
        else if (validPos.x < 0) spawnSide = 'LEFT';
        else spawnSide = 'RIGHT';
    }

    // Fallback if safe spawn fails (Rare offscreen, but safe)
    if (!validPos) {
        validPos = { x: -5, y: -5 };
        spawnSide = 'TOP';
    }

    const type =
      forcedType ??
      diffConfig.allowedEnemies[
        Math.floor(Math.random() * diffConfig.allowedEnemies.length)
      ];

    const hpScale =
      (1 + stageRef.current * 0.35 + levelRef.current * 0.12) *
      diffConfig.hpMod;

    // For boss minions, we might want lower HP
    const finalHp = (type === EnemyType.INTERCEPTOR && bossActiveRef.current) 
        ? ENEMY_BASE_HP * 0.5 
        : ENEMY_BASE_HP * hpScale;

    enemiesRef.current.push({
      ...validPos,
      id: Math.random().toString(36),
      type,
      state: 'SPAWNING', // INGRESS STATE
      spawnSide, // Track for visual indicators
      spawnTime: gameTimeRef.current,
      hp: finalHp,
      maxHp: finalHp,
      flash: 0,
      hitCooldowns: {},
      attackTimer: 0,
      spawnTimer: 0,
      dashTimer: 0,
      dashState: 'IDLE',
      // Physics
      vx: 0,
      vy: 0,
      isGrounded: false,
      physicsProfile: ENEMY_PHYSICS_DEFAULTS[type],
      jumpCooldownTimer: 0,
      jumpIntent: false
    });

    audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
  }, [
    difficulty,
    stageRef,
    bossActiveRef,
    enemiesRef,
    snakeRef,
    wallsRef,
    setBossActive,
    triggerShake,
    levelRef,
    audioEventsRef,
    game.bossDefeatedRef,
    directionRef
  ]);

  // ─────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────
  const update = useCallback((dt: number) => {
    // 1. Housekeeping
    cleanupFood();

    // 2. FOOD SUSTAINABILITY CHECK (Classic Mode)
    // Ensure we always have at least 1 regular food item on the field.
    // If food is eaten (count < 1), spawn a new one immediately.
    
    // Stop spawning if stage is ready for completion
    if (stageReadyRef.current) return;

    const normalFoodCount = foodRef.current.filter(f => f.type === FoodType.NORMAL).length;
    if (normalFoodCount < 1) {
        spawnFood();
    }

    if (bossActiveRef.current) {
        // Stop normal terminals from spawning
        terminalSpawnTimerRef.current = 0;

        // BOSS OVERRIDE TERMINAL LOGIC
        // Check if the special override terminal exists
        const hasOverride = terminalsRef.current.some(t => t.type === 'OVERRIDE');
        
        if (!hasOverride) {
            bossOverrideTimerRef.current += dt;
            // Spawn periodic Override Switch (every 15s to allow pacing)
            if (bossOverrideTimerRef.current > 15000) {
                spawnTerminal(undefined, 'BOSS_OVERRIDE');
                bossOverrideTimerRef.current = 0;
                // Audio Cue for new opportunity
                audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
            }
        } else {
            // While active, do not increment timer
            bossOverrideTimerRef.current = 0;
        }
    }

    enemySpawnTimerRef.current += dt;
    terminalSpawnTimerRef.current += dt;

    if (enemySpawnTimerRef.current >= ENEMY_SPAWN_INTERVAL) {
      spawnEnemy();
      enemySpawnTimerRef.current -= ENEMY_SPAWN_INTERVAL;
    }

    if (
      terminalSpawnTimerRef.current >= 8000
    ) {
      if (terminalsRef.current.length === 0 && !bossActiveRef.current) {
          spawnTerminal();
      }
      terminalSpawnTimerRef.current -= 8000;
    }
  }, [
      difficulty, bossActiveRef, spawnEnemy, spawnTerminal, terminalsRef, 
      enemySpawnTimerRef, terminalSpawnTimerRef, foodRef, spawnFood, 
      stageReadyRef, bossOverrideTimerRef, audioEventsRef, cleanupFood
  ]);


    return { update, spawnFood, spawnLoot, spawnXpOrbs, spawnEnemy, spawnTerminal, cleanupFood, pruneEnemies };
}
