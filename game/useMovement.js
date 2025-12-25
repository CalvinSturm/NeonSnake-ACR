import { useCallback, useRef } from 'react';
import { Direction, EnemyType, FoodType } from '../types';
import { GRID_COLS, GRID_ROWS, PROJECTILE_SPEED, DIFFICULTY_CONFIGS, DEFAULT_SETTINGS, XP_BASE_MAGNET_RADIUS } from '../constants';
export function useMovement(game, spawner) {
    const { snakeRef, directionRef, directionQueueRef, enemiesRef, wallsRef, powerUpsRef, lastPowerUpStateRef, setActivePowerUps, difficulty, projectilesRef, gameTimeRef, overclockActiveRef, statsRef, foodRef, audioEventsRef } = game;
    const { spawnEnemy } = spawner;
    // ─────────────────────────────
    // SNAKE MOVEMENT (TIME-GATED)
    // ─────────────────────────────
    const moveAccumulatorRef = useRef(0);
    const bossAudioThrottleRef = useRef(0);
    const getMoveInterval = useCallback(() => {
        let interval = DEFAULT_SETTINGS.initialSpeed;
        if (overclockActiveRef.current) {
            const lvl = statsRef.current.weapon.overclockLevel;
            const speedBoost = 1.5 + (lvl * 0.1);
            interval /= speedBoost;
        }
        return interval;
    }, [overclockActiveRef, statsRef]);
    const getMoveProgress = useCallback(() => {
        const interval = getMoveInterval();
        // Returns 0.0 to 1.0 representing progress TOWARDS the next grid cell
        // Since logic commits instantly at 1.0 and resets to 0, 
        // 0.0 means "Just arrived at new cell", 0.9 means "About to move"
        return Math.min(1, Math.max(0, moveAccumulatorRef.current / interval));
    }, [getMoveInterval]);
    const getNextHead = useCallback((dt) => {
        const interval = getMoveInterval();
        moveAccumulatorRef.current += dt;
        if (moveAccumulatorRef.current < interval) {
            return null;
        }
        moveAccumulatorRef.current -= interval;
        if (directionQueueRef.current.length > 0) {
            directionRef.current = directionQueueRef.current.shift();
        }
        const head = { ...snakeRef.current[0] };
        switch (directionRef.current) {
            case Direction.UP:
                head.y -= 1;
                break;
            case Direction.DOWN:
                head.y += 1;
                break;
            case Direction.LEFT:
                head.x -= 1;
                break;
            case Direction.RIGHT:
                head.x += 1;
                break;
        }
        return head;
    }, [directionRef, directionQueueRef, snakeRef, getMoveInterval]);
    const commitMove = useCallback((newHead, grew) => {
        // 🛑 INVARIANT CHECK: HEAD OVERLAP
        // Ensure the new head is not identical to the current head (zero velocity frame glitch)
        const currentHead = snakeRef.current[0];
        if (currentHead && newHead.x === currentHead.x && newHead.y === currentHead.y) {
            console.warn("Snake invariant violated: Head didn't move. Skipping frame.");
            return;
        }
        snakeRef.current.unshift(newHead);
        if (!grew)
            snakeRef.current.pop();
    }, [snakeRef]);
    // ─────────────────────────────
    // LOOT MAGNETISM (PHYSICS)
    // ─────────────────────────────
    const updateLoot = useCallback((dt, head) => {
        const now = gameTimeRef.current;
        const isMagnetActive = now < powerUpsRef.current.magnetUntil;
        const globalRange = isMagnetActive ? 100 : 0; // Effectively global
        const baseMagnetRange = XP_BASE_MAGNET_RADIUS + (statsRef.current.magnetRangeMod || 0);
        // Dynamic Speed Calculation
        const moveInterval = getMoveInterval();
        const snakeSpeed = 1000 / moveInterval; // Tiles per second
        const chaseSpeed = snakeSpeed * 1.5; // Always faster than snake
        for (const f of foodRef.current) {
            if (f.shouldRemove)
                continue;
            if (f.type !== FoodType.XP_ORB && !isMagnetActive)
                continue;
            const dx = head.x - f.x;
            const dy = head.y - f.y;
            const dist = Math.hypot(dx, dy);
            let effectiveRange = 0;
            if (f.type === FoodType.XP_ORB) {
                effectiveRange = Math.max(baseMagnetRange, globalRange);
            }
            else {
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
    }, [foodRef, powerUpsRef, gameTimeRef, statsRef, getMoveInterval]);
    // ─────────────────────────────
    // ENEMY LOGIC (SMOOTH MOVEMENT)
    // ─────────────────────────────
    const updateEnemies = useCallback((dt, snakeHead) => {
        // 0. Update Loot Physics First
        updateLoot(dt, snakeHead);
        const now = gameTimeRef.current;
        const diffConfig = DIFFICULTY_CONFIGS[difficulty];
        // 1. Check PowerUps State
        const isSlowActive = now < powerUpsRef.current.slowUntil;
        const isMagnetActive = now < powerUpsRef.current.magnetUntil;
        if (isSlowActive !== lastPowerUpStateRef.current.slow ||
            isMagnetActive !== lastPowerUpStateRef.current.magnet) {
            lastPowerUpStateRef.current = {
                slow: isSlowActive,
                magnet: isMagnetActive
            };
            setActivePowerUps({ slow: isSlowActive, magnet: isMagnetActive });
        }
        // 2. Base Speed Calculation
        // 3.5 grid units per second base speed for standard enemies
        const speedMultiplier = (isSlowActive ? 0.3 : 1.0) * diffConfig.speedMod;
        const moveDistance = 3.5 * speedMultiplier * (dt / 1000);
        // 3. Iterate Enemies
        const frameUnits = dt / 16.667;
        enemiesRef.current.forEach(e => {
            // Decay timers
            if (e.flash && e.flash > 0)
                e.flash = Math.max(0, e.flash - frameUnits);
            // Decay hit cooldowns (logic gating)
            if (e.hitCooldowns) {
                for (const key in e.hitCooldowns) {
                    if (e.hitCooldowns[key] > 0) {
                        e.hitCooldowns[key] = Math.max(0, e.hitCooldowns[key] - frameUnits);
                    }
                }
            }
            // EMP STUN LOGIC
            if (e.stunTimer && e.stunTimer > 0) {
                e.stunTimer -= dt;
                return; // Skip AI if stunned
            }
            // ─── BOSS AI: FIREWALL SENTINEL ───
            if (e.type === EnemyType.BOSS) {
                const hpRatio = e.hp / e.maxHp;
                const prevPhase = e.bossPhase || 1;
                // Phase Transitions
                let phase = 1;
                if (hpRatio < 0.3)
                    phase = 3;
                else if (hpRatio < 0.6)
                    phase = 2;
                if (phase !== prevPhase) {
                    e.bossPhase = phase;
                    e.summons = 0; // Reset summons cap on phase change
                    audioEventsRef.current.push({ type: 'EMP' }); // Audio cue for phase change
                }
                // Timers
                e.attackTimer = (e.attackTimer || 0) + dt;
                e.dashTimer = (e.dashTimer || 0) + dt;
                // PHASE 1: SURVEILLANCE (Sniper Mode)
                if (phase === 1) {
                    // Behavior: Kiting / Maintaining distance
                    const dist = Math.hypot(snakeHead.x - e.x, snakeHead.y - e.y);
                    const targetDist = 15; // Maintain 15 grid units distance
                    const angleToSnake = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                    let moveAngle = angleToSnake;
                    if (dist < targetDist)
                        moveAngle += Math.PI; // Retreat
                    // Add gentle strafe
                    moveAngle += Math.sin(now / 1500) * 0.8;
                    e.x += Math.cos(moveAngle) * 0.04 * frameUnits;
                    e.y += Math.sin(moveAngle) * 0.04 * frameUnits;
                    // Attack: Precision Burst
                    if (e.attackTimer > 2000) {
                        e.attackTimer = 0;
                        if (projectilesRef.current.length < 200) {
                            const burstCount = 3;
                            for (let i = 0; i < burstCount; i++) {
                                const spread = 0.15;
                                const a = angleToSnake + (i - 1) * spread;
                                projectilesRef.current.push({
                                    id: Math.random().toString(36),
                                    x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                    y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                    vx: Math.cos(a) * PROJECTILE_SPEED * 0.6 * DEFAULT_SETTINGS.gridSize,
                                    vy: Math.sin(a) * PROJECTILE_SPEED * 0.6 * DEFAULT_SETTINGS.gridSize,
                                    damage: 20,
                                    color: '#ff3333',
                                    owner: 'ENEMY',
                                    size: 4
                                });
                            }
                            audioEventsRef.current.push({ type: 'SHOOT' });
                        }
                    }
                }
                // PHASE 2: CONTAINMENT (Summoner/Area Denial)
                else if (phase === 2) {
                    // Behavior: Control Center
                    const cx = GRID_COLS / 2;
                    const cy = GRID_ROWS / 2;
                    const dx = cx - e.x;
                    const dy = cy - e.y;
                    const distToCenter = Math.hypot(dx, dy);
                    if (distToCenter > 2) {
                        e.x += (dx / distToCenter) * 0.06 * frameUnits;
                        e.y += (dy / distToCenter) * 0.06 * frameUnits;
                    }
                    else {
                        // Orbit center slightly
                        e.x = cx + Math.cos(now / 1000) * 2;
                        e.y = cy + Math.sin(now / 1000) * 2;
                    }
                    // Attack 1: Summon Interceptors (Capped per phase)
                    if (e.spawnTimer === undefined)
                        e.spawnTimer = 0;
                    e.spawnTimer += dt;
                    if (e.spawnTimer > 4500) {
                        e.spawnTimer = 0;
                        // Cap summons to 6 per phase cycle to prevent flooding
                        if ((e.summons || 0) < 6 && enemiesRef.current.length < 8) {
                            spawnEnemy(EnemyType.INTERCEPTOR);
                            spawnEnemy(EnemyType.INTERCEPTOR);
                            e.summons = (e.summons || 0) + 2;
                        }
                    }
                    // Attack 2: Radial Blast
                    if (e.attackTimer > 2800) {
                        e.attackTimer = 0;
                        if (projectilesRef.current.length < 200) {
                            const count = 12;
                            for (let i = 0; i < count; i++) {
                                const a = (i / count) * Math.PI * 2 + (now / 1000);
                                projectilesRef.current.push({
                                    id: Math.random().toString(36),
                                    x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                    y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                    vx: Math.cos(a) * PROJECTILE_SPEED * 0.45 * DEFAULT_SETTINGS.gridSize,
                                    vy: Math.sin(a) * PROJECTILE_SPEED * 0.45 * DEFAULT_SETTINGS.gridSize,
                                    damage: 15,
                                    color: '#cc00ff',
                                    owner: 'ENEMY',
                                    size: 5
                                });
                            }
                            audioEventsRef.current.push({ type: 'SHOOT' });
                        }
                    }
                }
                // PHASE 3: PURGE (Bullet Hell / Dash)
                else if (phase === 3) {
                    // Behavior: Dash Cycle
                    if (e.dashState === 'IDLE') {
                        if (e.dashTimer > 2500) {
                            e.dashState = 'CHARGE';
                            e.dashTimer = 0;
                            // Target last known snake position
                            e.targetPos = { x: snakeHead.x, y: snakeHead.y };
                        }
                        // Erratic jitter while idle
                        e.x += (Math.random() - 0.5) * 0.2 * frameUnits;
                        e.y += (Math.random() - 0.5) * 0.2 * frameUnits;
                    }
                    else if (e.dashState === 'CHARGE') {
                        // Telegraph dash
                        if (e.dashTimer > 600) {
                            e.dashState = 'DASH';
                            e.dashTimer = 0;
                            const dx = (e.targetPos?.x || 0) - e.x;
                            const dy = (e.targetPos?.y || 0) - e.y;
                            e.angle = Math.atan2(dy, dx);
                        }
                    }
                    else if (e.dashState === 'DASH') {
                        const dashSpeed = 0.5; // Very fast
                        const nextX = e.x + Math.cos(e.angle || 0) * dashSpeed * frameUnits;
                        const nextY = e.y + Math.sin(e.angle || 0) * dashSpeed * frameUnits;
                        // Wall Collision Avoidance
                        if (nextX < 2 || nextX > GRID_COLS - 2 || nextY < 2 || nextY > GRID_ROWS - 2) {
                            e.dashState = 'IDLE';
                            e.dashTimer = 0;
                        }
                        else {
                            e.x = nextX;
                            e.y = nextY;
                        }
                        if (e.dashTimer > 400) {
                            e.dashState = 'IDLE';
                            e.dashTimer = 0;
                        }
                        // Leave "Minelayer" trail
                        if (Math.random() < 0.4 && projectilesRef.current.length < 200) {
                            projectilesRef.current.push({
                                id: Math.random().toString(36),
                                x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                vx: 0,
                                vy: 0,
                                damage: 25,
                                color: '#ff4400',
                                owner: 'ENEMY',
                                size: 6,
                                life: 120 // 2 seconds
                            });
                        }
                    }
                    // Attack: Spiral (Continuous unless dashing)
                    if (e.dashState !== 'DASH') {
                        if (e.attackTimer > 120) { // Rapid fire
                            e.attackTimer = 0;
                            if (projectilesRef.current.length < 200) {
                                const spiralAngle = (now / 150) % (Math.PI * 2);
                                // Dual spiral
                                [0, Math.PI].forEach(offset => {
                                    const a = spiralAngle + offset;
                                    projectilesRef.current.push({
                                        id: Math.random().toString(36),
                                        x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                        y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                                        vx: Math.cos(a) * PROJECTILE_SPEED * 0.5 * DEFAULT_SETTINGS.gridSize,
                                        vy: Math.sin(a) * PROJECTILE_SPEED * 0.5 * DEFAULT_SETTINGS.gridSize,
                                        damage: 12,
                                        color: '#ffaa00',
                                        owner: 'ENEMY',
                                        size: 3
                                    });
                                });
                                // Audio Throttling
                                if (now - bossAudioThrottleRef.current > 200) {
                                    audioEventsRef.current.push({ type: 'SHOOT' });
                                    bossAudioThrottleRef.current = now;
                                }
                            }
                        }
                    }
                }
                // Boundary checks for boss (keep inside arena)
                e.x = Math.max(1, Math.min(GRID_COLS - 2, e.x));
                e.y = Math.max(1, Math.min(GRID_ROWS - 2, e.y));
                return;
            }
            // ─── STANDARD ENEMY SMOOTH MOVEMENT ───
            // Calculate vector to target (Snake Head)
            const dx = snakeHead.x - e.x;
            const dy = snakeHead.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.1) {
                // Normalize
                const nx = dx / dist;
                const ny = dy / dist;
                // Proposed positions
                const nextX = e.x + nx * moveDistance;
                const nextY = e.y + ny * moveDistance;
                // Wall Collision Check (Rounded to nearest grid)
                const checkWall = (x, y) => {
                    const gx = Math.round(x);
                    const gy = Math.round(y);
                    return gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS ||
                        wallsRef.current.some(w => w.x === gx && w.y === gy);
                };
                // Apply Separately for "Sliding" along walls
                if (!checkWall(nextX, e.y)) {
                    e.x = nextX;
                }
                if (!checkWall(e.x, nextY)) {
                    e.y = nextY;
                }
            }
        });
    }, [
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
        getMoveInterval
    ]);
    return {
        getNextHead,
        commitMove,
        updateEnemies,
        updateLoot,
        getMoveProgress
    };
}
