import { useCallback } from 'react';
import { GameStatus, EnemyType, FoodType } from '../types';
import { DEFAULT_SETTINGS, COLORS, GRID_COLS, GRID_ROWS, MAGNET_RADIUS } from '../constants';
export function useCollisions(game, combat, spawner, fx, progression) {
    const { snakeRef, wallsRef, enemiesRef, foodRef, terminalsRef, projectilesRef, gameTimeRef, setStatus, failureMessageRef, audioEventsRef, setUiShield, statsRef, terminalsHackedRef, invulnerabilityTimeRef, powerUpsRef, // Use REF, not state, to avoid stale closures in frozen loops
    ghostCoilCooldownRef, empBloomCooldownRef } = game;
    const { createParticles, triggerShake, spawnFloatingText, triggerShockwave } = fx;
    const { onTerminalHacked } = progression;
    // 1. Move Collisions (Walls, Self, Shield)
    const checkMoveCollisions = useCallback((head) => {
        // Wall Collision Logic
        if (head.x < 0 || head.x >= GRID_COLS ||
            head.y < 0 || head.y >= GRID_ROWS ||
            wallsRef.current.some(w => w.x === head.x && w.y === head.y)) {
            // 1. Safe bounce if invulnerable (prevent death loop)
            if (invulnerabilityTimeRef.current > 0) {
                head.x = Math.max(0, Math.min(GRID_COLS - 1, head.x));
                head.y = Math.max(0, Math.min(GRID_ROWS - 1, head.y));
                return false;
            }
            // 2. Shield Protection
            if (statsRef.current.shieldActive) {
                statsRef.current.shieldActive = false;
                setUiShield(false);
                triggerShake(20, 20);
                audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                // CRITICAL: Grant invulnerability so user doesn't die next frame
                invulnerabilityTimeRef.current = 2000;
                // Bounce back
                head.x = Math.max(0, Math.min(GRID_COLS - 1, head.x));
                head.y = Math.max(0, Math.min(GRID_ROWS - 1, head.y));
                return false; // Survived
            }
            // 3. Death
            setStatus(GameStatus.GAME_OVER);
            failureMessageRef.current = 'SEGMENTATION_FAULT // WALL_IMPACT';
            audioEventsRef.current.push({ type: 'GAME_OVER' });
            triggerShake(30, 30);
            return true;
        }
        // Self Collision
        // Note: head is the *next* position. snakeRef contains current positions.
        for (let i = 0; i < snakeRef.current.length - 1; i++) {
            const segment = snakeRef.current[i];
            if (head.x === segment.x && head.y === segment.y) {
                if (invulnerabilityTimeRef.current > 0)
                    return false;
                if (statsRef.current.shieldActive) {
                    statsRef.current.shieldActive = false;
                    setUiShield(false);
                    triggerShake(20, 20);
                    audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                    invulnerabilityTimeRef.current = 2000;
                    return false;
                }
                setStatus(GameStatus.GAME_OVER);
                failureMessageRef.current = 'RECURSION_ERROR // SELF_COLLISION';
                audioEventsRef.current.push({ type: 'GAME_OVER' });
                triggerShake(30, 30);
                return true;
            }
        }
        return false;
    }, [
        wallsRef, snakeRef, statsRef, setUiShield, triggerShake,
        audioEventsRef, setStatus, failureMessageRef, invulnerabilityTimeRef
    ]);
    // 2. Dynamic Collisions (Enemies, Projectiles)
    const checkDynamicCollisions = useCallback(() => {
        const head = snakeRef.current[0];
        if (!head)
            return;
        if (invulnerabilityTimeRef.current > 0)
            return;
        const now = gameTimeRef.current;
        // Snake vs Enemies (Head Contact = Death)
        for (const enemy of enemiesRef.current) {
            if (enemy.hp <= 0)
                continue;
            if (Math.abs(head.x - enemy.x) < 0.8 && Math.abs(head.y - enemy.y) < 0.8) {
                // GHOST COIL Check
                if (statsRef.current.weapon.ghostCoilLevel > 0 && now > ghostCoilCooldownRef.current) {
                    ghostCoilCooldownRef.current = now + 10000; // 10s Cooldown
                    invulnerabilityTimeRef.current = 1500; // Phase duration
                    triggerShake(5, 5);
                    audioEventsRef.current.push({ type: 'POWER_UP' });
                    spawnFloatingText(head.x * DEFAULT_SETTINGS.gridSize, head.y * DEFAULT_SETTINGS.gridSize, "PHASE SHIFT", '#888888', 14);
                    return;
                }
                // Shield Check
                if (statsRef.current.shieldActive) {
                    statsRef.current.shieldActive = false;
                    setUiShield(false);
                    triggerShake(20, 20);
                    audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                    invulnerabilityTimeRef.current = 2000; // iframe
                    // EMP BLOOM TRIGGER (On Shield Break)
                    if (statsRef.current.weapon.empBloomLevel > 0) {
                        combat.triggerSystemShock(); // Free EMP
                    }
                    return;
                }
                setStatus(GameStatus.GAME_OVER);
                failureMessageRef.current = 'FATAL_EXCEPTION // ENEMY_CONTACT';
                audioEventsRef.current.push({ type: 'GAME_OVER' });
                triggerShake(40, 40);
                return;
            }
        }
        // Enemy vs Snake Body (Tail Defense = Kill Enemy)
        if (snakeRef.current.length > 1) {
            for (const enemy of enemiesRef.current) {
                if (enemy.hp <= 0)
                    continue;
                let hitTail = false;
                for (let i = 1; i < snakeRef.current.length; i++) {
                    const seg = snakeRef.current[i];
                    if (Math.abs(seg.x - enemy.x) < 0.7 && Math.abs(seg.y - enemy.y) < 0.7) {
                        hitTail = true;
                        break;
                    }
                }
                if (hitTail) {
                    if (enemy.type === EnemyType.BOSS) {
                        combat.damageEnemy(enemy, 50, false, false);
                        triggerShake(10, 10);
                    }
                    else {
                        combat.damageEnemy(enemy, 9999, true, false);
                        triggerShake(5, 5);
                        createParticles(enemy.x, enemy.y, COLORS.enemyHunter, 6);
                    }
                }
            }
        }
        // Snake vs Projectiles
        for (const p of projectilesRef.current) {
            if (p.owner === 'PLAYER')
                continue; // Ignore own projectiles
            const phx = p.x / DEFAULT_SETTINGS.gridSize - 0.5;
            const phy = p.y / DEFAULT_SETTINGS.gridSize - 0.5;
            if (Math.abs(head.x - phx) < 0.5 && Math.abs(head.y - phy) < 0.5) {
                // REFLECTOR MESH Check
                if (statsRef.current.weapon.reflectorMeshLevel > 0) {
                    const chance = 0.2 + (statsRef.current.weapon.reflectorMeshLevel * 0.1);
                    if (Math.random() < chance) {
                        // Reflect!
                        p.owner = 'PLAYER';
                        p.vx *= -1;
                        p.vy *= -1;
                        p.color = COLORS.shield;
                        audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                        spawnFloatingText(p.x, p.y, "REFLECT", COLORS.shield, 10);
                        return;
                    }
                }
                if (statsRef.current.shieldActive) {
                    statsRef.current.shieldActive = false;
                    setUiShield(false);
                    triggerShake(15, 15);
                    audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                    p.shouldRemove = true;
                    invulnerabilityTimeRef.current = 2000; // Grant iframes
                    // EMP BLOOM TRIGGER (On Shield Break)
                    if (statsRef.current.weapon.empBloomLevel > 0) {
                        combat.triggerSystemShock();
                    }
                    return;
                }
                setStatus(GameStatus.GAME_OVER);
                failureMessageRef.current = 'DATA_CORRUPTION // PROJECTILE_HIT';
                audioEventsRef.current.push({ type: 'GAME_OVER' });
                triggerShake(30, 30);
                return;
            }
        }
    }, [
        snakeRef, enemiesRef, projectilesRef, invulnerabilityTimeRef,
        statsRef, setUiShield, triggerShake, audioEventsRef, setStatus,
        failureMessageRef, combat, createParticles, ghostCoilCooldownRef,
        spawnFloatingText, gameTimeRef
    ]);
    // 3. Food Consumption
    const handleEat = useCallback((head) => {
        let ate = false;
        // Check magnet status dynamically from REF (not stale closure)
        const isMagnetActive = gameTimeRef.current < powerUpsRef.current.magnetUntil;
        // Magnet check
        const magnetRange = isMagnetActive
            ? MAGNET_RADIUS + (statsRef.current.magnetRangeMod || 0) + 2 // Bonus range
            : MAGNET_RADIUS + (statsRef.current.magnetRangeMod || 0);
        for (const f of foodRef.current) {
            if (f.shouldRemove)
                continue;
            const dist = Math.hypot(head.x - f.x, head.y - f.y);
            const isDirectHit = head.x === f.x && head.y === f.y;
            if (isDirectHit || dist <= magnetRange) {
                progression.onFoodConsumed({
                    type: f.type,
                    byMagnet: !isDirectHit,
                    value: f.value
                });
                f.shouldRemove = true;
                // Different particles for XP orbs
                if (f.type === FoodType.XP_ORB) {
                    createParticles(f.x, f.y, COLORS.xpOrb, 4);
                    audioEventsRef.current.push({ type: 'XP_COLLECT' });
                }
                else {
                    createParticles(f.x, f.y, COLORS.foodNormal, 6);
                }
                ate = true;
            }
        }
        return ate;
    }, [foodRef, powerUpsRef, statsRef, progression, createParticles, audioEventsRef, gameTimeRef]);
    /* ─────────────────────────────
       TERMINALS
       ───────────────────────────── */
    const updateTerminals = useCallback((dt) => {
        const head = snakeRef.current[0];
        if (!head)
            return;
        const now = gameTimeRef.current;
        const hx = head.x * DEFAULT_SETTINGS.gridSize +
            DEFAULT_SETTINGS.gridSize / 2;
        const hy = head.y * DEFAULT_SETTINGS.gridSize +
            DEFAULT_SETTINGS.gridSize / 2;
        for (let i = terminalsRef.current.length - 1; i >= 0; i--) {
            const t = terminalsRef.current[i];
            // ── RETIRE ONE-FRAME FLAGS (deterministic) ──
            t.justDisconnected = false;
            t.justCompleted = false;
            if (t.shouldRemove)
                continue;
            const tx = t.x * DEFAULT_SETTINGS.gridSize +
                DEFAULT_SETTINGS.gridSize / 2;
            const ty = t.y * DEFAULT_SETTINGS.gridSize +
                DEFAULT_SETTINGS.gridSize / 2;
            const dist = Math.hypot(hx - tx, hy - ty);
            const range = t.radius * DEFAULT_SETTINGS.gridSize;
            if (dist <= range) {
                // Progress update using STATS MODIFIER
                const speedMod = statsRef.current.hackSpeedMod || 1.0;
                t.progress += dt * speedMod;
                // Deterministic particles (Accumulator Pattern)
                // Prevents "Death Spiral" where lag causes more particles to spawn
                t.particleTimer = (t.particleTimer || 0) + dt;
                if (t.particleTimer > 250) {
                    createParticles(t.x, t.y, t.color, 3); // Reduced count slightly
                    t.particleTimer = 0;
                }
                if (t.progress >= t.totalTime) {
                    onTerminalHacked();
                    triggerShake(15, 15);
                    spawnFloatingText(tx, ty, 'HACKED', COLORS.terminal, 20);
                    // Spawn large amount of XP orbs instead of instant XP
                    spawner.spawnXpOrbs(t.x, t.y, 500);
                    triggerShockwave({
                        id: Math.random().toString(),
                        x: tx,
                        y: ty,
                        currentRadius: 10,
                        maxRadius: 200,
                        damage: 0,
                        opacity: 0.6,
                    });
                    terminalsHackedRef.current += 1;
                    // Emit: completed
                    t.justCompleted = true;
                    t.shouldRemove = true;
                }
            }
            else if (t.progress > 0) {
                // Emit: disconnect (debounced)
                if (t.progress > 500 && now - (t.lastEffectTime || 0) > 1000) {
                    t.justDisconnected = true;
                    t.lastEffectTime = now;
                }
                t.progress = Math.max(0, t.progress - dt * 1.5);
            }
        }
    }, [
        snakeRef,
        terminalsRef,
        terminalsHackedRef,
        createParticles,
        triggerShake,
        triggerShockwave,
        spawnFloatingText,
        onTerminalHacked,
        gameTimeRef,
        spawner,
        statsRef
    ]);
    return {
        checkMoveCollisions,
        checkDynamicCollisions,
        handleEat,
        updateTerminals,
    };
}
