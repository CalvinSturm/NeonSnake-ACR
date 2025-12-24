import { useCallback, useRef } from 'react';
import { EnemyType } from '../types';
import { DEFAULT_SETTINGS, COLORS, ABILITIES, CANVAS_WIDTH, CANVAS_HEIGHT, SHOCKWAVE_SPEED } from '../constants';
export function useCombat(game, spawner, fx, progression) {
    const { enemiesRef, statsRef, snakeRef, foodRef, gameTimeRef, abilityCooldownsRef, powerUpsRef, projectilesRef, shockwavesRef, minesRef, lightningArcsRef, weaponFireTimerRef, auraTickTimerRef, mineDropTimerRef, audioEventsRef, bossDefeatedRef, enemiesKilledRef, 
    // NEW REFS
    prismLanceTimerRef, neonScatterTimerRef, voltSerpentTimerRef, phaseRailChargeRef, echoDamageStoredRef, overclockActiveRef, overclockTimerRef } = game;
    const { spawnFloatingText, createParticles, triggerShake, triggerShockwave, triggerLightning } = fx;
    const shootAudioThrottleRef = useRef(0);
    function isPlayerHomingProjectile(p) {
        return p.owner === 'PLAYER' && p.homing === true;
    }
    /* ─────────────────────────────
       Internal Combat Logic
       ───────────────────────────── */
    const applyDamage = useCallback((enemy, amount) => {
        enemy.hp -= amount;
        enemy.flash = 5; // Visual flash
    }, []);
    const processDeath = useCallback((enemy) => {
        enemiesKilledRef.current += 1;
        // Spawn XP Orbs (Reward)
        spawner.spawnXpOrbs(enemy.x, enemy.y, 40);
        // Grant Score (Event), but XP is now 0 (handled by orbs)
        progression.onEnemyDefeated({ xp: 0 });
        // Neural Magnet Logic
        if (statsRef.current.weapon.neuralMagnetLevel > 0) {
            const pullRadius = 10 + (statsRef.current.weapon.neuralMagnetLevel * 5);
            const snakeHead = snakeRef.current[0];
            // Check food within radius of DEAD ENEMY
            foodRef.current.forEach(f => {
                const dist = Math.hypot(f.x - enemy.x, f.y - enemy.y);
                if (dist < pullRadius) {
                    // Teleport close to player for pickup
                    if (snakeHead) {
                        const angle = Math.random() * Math.PI * 2;
                        const r = 2; // Close range
                        f.x = snakeHead.x + Math.cos(angle) * r;
                        f.y = snakeHead.y + Math.sin(angle) * r;
                    }
                }
            });
        }
        if (enemy.type === EnemyType.BOSS) {
            bossDefeatedRef.current = true; // Mark defeated
            triggerShake(20, 20);
            audioEventsRef.current.push({ type: 'EMP' });
        }
        else {
            // Standard enemy death sound handled here if needed, or by orchestration
            audioEventsRef.current.push({ type: 'ENEMY_DESTROY' });
        }
    }, [enemiesKilledRef, spawner, progression, statsRef, snakeRef, foodRef, bossDefeatedRef, triggerShake, audioEventsRef]);
    /* ─────────────────────────────
       Orchestrator: Damage Enemy
       ───────────────────────────── */
    const damageEnemy = useCallback((enemy, baseDamage, forceCrit = false, allowChain = true) => {
        const stats = statsRef.current;
        let damage = baseDamage;
        let isCrit = forceCrit;
        if (!forceCrit && Math.random() < stats.critChance) {
            damage *= stats.critMultiplier;
            isCrit = true;
        }
        // 1. Apply Damage (State)
        applyDamage(enemy, damage);
        // 2. Echo Cache (Buff)
        if (stats.weapon.echoCacheLevel > 0) {
            const cap = 500 + (stats.weapon.echoCacheLevel * 500);
            echoDamageStoredRef.current += damage;
            if (echoDamageStoredRef.current >= cap) {
                echoDamageStoredRef.current = 0;
                const head = snakeRef.current[0];
                if (head) {
                    triggerShockwave({
                        id: Math.random().toString(),
                        x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        currentRadius: 0,
                        maxRadius: 150 + (stats.weapon.echoCacheLevel * 25),
                        damage: cap * 0.5,
                        opacity: 0.8
                    });
                    audioEventsRef.current.push({ type: 'EMP' });
                    spawnFloatingText(head.x * DEFAULT_SETTINGS.gridSize, head.y * DEFAULT_SETTINGS.gridSize, "ECHO BURST", '#ffaa00', 16);
                }
            }
        }
        // 3. Visuals (Text)
        const ex = enemy.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const ey = enemy.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        spawnFloatingText(ex, ey, Math.floor(damage).toString(), isCrit ? COLORS.critText : COLORS.damageText, isCrit ? 24 : 12);
        // 4. Chain Lightning (Effect)
        if (allowChain && stats.weapon.chainLightningLevel > 0) {
            let nearest = null;
            let minDistSq = Infinity;
            const rangeSq = stats.weapon.chainLightningRange ** 2;
            for (const other of enemiesRef.current) {
                if (other === enemy)
                    continue;
                const d2 = (other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2;
                if (d2 < rangeSq && d2 < minDistSq) {
                    minDistSq = d2;
                    nearest = other;
                }
            }
            if (nearest) {
                // Recursive call is safe here because chain lightning decays damage or we pass allowChain=false
                damageEnemy(nearest, damage * stats.weapon.chainLightningDamage, false, false);
                triggerLightning({
                    id: Math.random().toString(36),
                    x1: ex,
                    y1: ey,
                    x2: nearest.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                    y2: nearest.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                    life: 1,
                    color: COLORS.lightning
                });
            }
        }
        // 5. Audio (Throttled Hit)
        // Only play hit sound if not dead, death sound handled in processDeath
        if (enemy.hp > 0) {
            audioEventsRef.current.push({ type: 'HIT' });
        }
        // 6. Death Check
        if (enemy.hp <= 0) {
            processDeath(enemy);
        }
    }, [
        statsRef,
        enemiesRef,
        snakeRef,
        spawnFloatingText,
        triggerLightning,
        triggerShockwave,
        audioEventsRef,
        echoDamageStoredRef,
        applyDamage,
        processDeath
    ]);
    /* ─────────────────────────────
       EMP Ability (System Shock)
       ───────────────────────────── */
    const triggerSystemShock = useCallback(() => {
        const now = gameTimeRef.current;
        if (now < abilityCooldownsRef.current.systemShock)
            return;
        const cooldown = ABILITIES.SYSTEM_SHOCK.COOLDOWN * statsRef.current.empCooldownMod;
        abilityCooldownsRef.current.systemShock = now + cooldown;
        const head = snakeRef.current[0];
        if (!head)
            return;
        const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const radiusMod = statsRef.current.weapon.shockwaveRadius;
        triggerShockwave({
            id: Math.random().toString(36),
            x: cx,
            y: cy,
            currentRadius: 0,
            maxRadius: (ABILITIES.SYSTEM_SHOCK.RADIUS + radiusMod) * DEFAULT_SETTINGS.gridSize,
            damage: statsRef.current.weapon.shockwaveDamage,
            opacity: 0.85,
            stunDuration: ABILITIES.SYSTEM_SHOCK.DURATION
        });
        triggerShake(15, 15);
        audioEventsRef.current.push({ type: 'EMP' });
    }, [statsRef, snakeRef, gameTimeRef, abilityCooldownsRef, triggerShockwave, triggerShake, audioEventsRef]);
    /* ─────────────────────────────
       Chrono Surge
       ───────────────────────────── */
    const triggerChronoSurge = useCallback(() => {
        const now = gameTimeRef.current;
        if (now < abilityCooldownsRef.current.chrono)
            return;
        powerUpsRef.current.slowUntil = now + ABILITIES.CHRONO.DURATION;
        abilityCooldownsRef.current.chrono = now + ABILITIES.CHRONO.COOLDOWN;
        audioEventsRef.current.push({ type: 'POWER_UP' });
        triggerShake(5, 5);
        const head = snakeRef.current[0];
        if (!head)
            return;
        const hx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const hy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        triggerShockwave({
            id: Math.random().toString(),
            x: hx,
            y: hy,
            currentRadius: 0,
            maxRadius: ABILITIES.CHRONO.RADIUS * DEFAULT_SETTINGS.gridSize,
            damage: 0,
            opacity: 0.4
        });
    }, [gameTimeRef, abilityCooldownsRef, powerUpsRef, snakeRef, triggerShockwave, triggerShake, audioEventsRef]);
    const triggerTacticalPing = useCallback((gx, gy) => {
        const now = gameTimeRef.current;
        if (now < abilityCooldownsRef.current.ping)
            return;
        abilityCooldownsRef.current.ping = now + ABILITIES.PING.COOLDOWN;
        const px = gx * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const py = gy * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        triggerShockwave({
            id: Math.random().toString(36),
            x: px,
            y: py,
            currentRadius: 0,
            maxRadius: ABILITIES.PING.RADIUS * DEFAULT_SETTINGS.gridSize,
            damage: ABILITIES.PING.DAMAGE,
            opacity: 0.65
        });
        audioEventsRef.current.push({ type: 'SHOOT' });
        triggerShake(6, 6);
    }, [gameTimeRef, abilityCooldownsRef, triggerShockwave, triggerShake, audioEventsRef]);
    /* ─────────────────────────────
       Main Combat Loop
       ───────────────────────────── */
    const update = useCallback((dt) => {
        const head = snakeRef.current[0];
        if (!head)
            return;
        const frame = dt / 16.667;
        const now = gameTimeRef.current;
        const wStats = statsRef.current.weapon;
        // ── OVERCLOCK UPDATE ──
        if (wStats.overclockLevel > 0) {
            overclockTimerRef.current += dt;
            if (overclockActiveRef.current) {
                const duration = 3000 + (wStats.overclockLevel * 500);
                if (overclockTimerRef.current > duration) {
                    overclockActiveRef.current = false;
                    overclockTimerRef.current = 0;
                }
            }
            else {
                const cooldown = Math.max(5000, 15000 - (wStats.overclockLevel * 1000));
                if (overclockTimerRef.current > cooldown) {
                    overclockActiveRef.current = true;
                    overclockTimerRef.current = 0;
                    audioEventsRef.current.push({ type: 'POWER_UP' });
                    spawnFloatingText(head.x * DEFAULT_SETTINGS.gridSize, head.y * DEFAULT_SETTINGS.gridSize - 20, "OVERCLOCK ENGAGED", '#ff0044', 16);
                }
            }
        }
        // 1. AUTO CANNON
        if (wStats.cannonLevel > 0) {
            weaponFireTimerRef.current += dt;
            let fireRate = wStats.cannonFireRate;
            if (overclockActiveRef.current)
                fireRate *= 0.5;
            if (weaponFireTimerRef.current >= fireRate) {
                const enemies = enemiesRef.current;
                if (enemies.length === 0)
                    return;
                let nearest = null;
                let minDist = Infinity;
                for (const e of enemies) {
                    const dx = e.x - head.x;
                    const dy = e.y - head.y;
                    const d = dx * dx + dy * dy;
                    if (d < minDist) {
                        minDist = d;
                        nearest = e;
                    }
                }
                if (!nearest)
                    return;
                const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
                const count = wStats.cannonProjectileCount;
                const spread = 0.15;
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * spread;
                    const finalAngle = angle + offset;
                    projectilesRef.current.push({
                        id: Math.random().toString(36),
                        x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        vx: Math.cos(finalAngle) *
                            wStats.cannonProjectileSpeed *
                            (DEFAULT_SETTINGS.gridSize / 20),
                        vy: Math.sin(finalAngle) *
                            wStats.cannonProjectileSpeed *
                            (DEFAULT_SETTINGS.gridSize / 20),
                        damage: wStats.cannonDamage,
                        color: COLORS.projectile,
                        size: 3 + Math.min(wStats.cannonLevel, 4),
                        type: 'STANDARD',
                        owner: 'PLAYER'
                    });
                }
                if (now - shootAudioThrottleRef.current > 100) {
                    audioEventsRef.current.push({ type: 'SHOOT' });
                    shootAudioThrottleRef.current = now;
                }
                weaponFireTimerRef.current = 0;
            }
        }
        // 2. PRISM LANCE
        if (wStats.prismLanceLevel > 0) {
            prismLanceTimerRef.current += dt;
            const fireRate = overclockActiveRef.current ? 1000 : 2000;
            if (prismLanceTimerRef.current >= fireRate) {
                const enemies = enemiesRef.current;
                let nearest = null;
                let minDist = Infinity;
                const hx = head.x * DEFAULT_SETTINGS.gridSize;
                const hy = head.y * DEFAULT_SETTINGS.gridSize;
                for (const e of enemies) {
                    const ex = e.x * DEFAULT_SETTINGS.gridSize;
                    const ey = e.y * DEFAULT_SETTINGS.gridSize;
                    const dx = ex - hx;
                    const dy = ey - hy;
                    const d = dx * dx + dy * dy;
                    if (d < minDist) {
                        minDist = d;
                        nearest = e;
                    }
                }
                if (nearest !== null) {
                    const angle = Math.atan2(nearest.y * DEFAULT_SETTINGS.gridSize - hy, nearest.x * DEFAULT_SETTINGS.gridSize - hx);
                    const speed = 30;
                    projectilesRef.current.push({
                        id: Math.random().toString(36),
                        x: hx + DEFAULT_SETTINGS.gridSize / 2,
                        y: hy + DEFAULT_SETTINGS.gridSize / 2,
                        vx: Math.cos(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                        vy: Math.sin(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                        damage: wStats.prismLanceDamage,
                        color: COLORS.prismLance,
                        size: 4,
                        type: 'LANCE',
                        piercing: true,
                        hitIds: [],
                        owner: 'PLAYER'
                    });
                    audioEventsRef.current.push({ type: 'SHOOT' });
                    prismLanceTimerRef.current = 0;
                }
            }
        }
        // 3. NEON SCATTER
        if (wStats.neonScatterLevel > 0) {
            neonScatterTimerRef.current += dt;
            let fireRate = 1200;
            if (overclockActiveRef.current)
                fireRate = 600;
            if (neonScatterTimerRef.current >= fireRate) {
                const enemies = enemiesRef.current;
                if (enemies.length === 0) {
                    neonScatterTimerRef.current = 0;
                }
                else {
                    let nearest = null;
                    let minDist = Infinity;
                    for (const e of enemies) {
                        const dx = e.x - head.x;
                        const dy = e.y - head.y;
                        const d = dx * dx + dy * dy;
                        if (d < 100 && d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                    const target = nearest ?? enemies[0];
                    if (!target) {
                        neonScatterTimerRef.current = 0;
                    }
                    else {
                        const baseAngle = Math.atan2(target.y - head.y, target.x - head.x);
                        const shards = 3 + wStats.neonScatterLevel;
                        const spread = 0.5;
                        for (let i = 0; i < shards; i++) {
                            const a = baseAngle - spread / 2 + Math.random() * spread;
                            const speed = 15 + Math.random() * 5;
                            projectilesRef.current.push({
                                id: Math.random().toString(36),
                                x: head.x * DEFAULT_SETTINGS.gridSize +
                                    DEFAULT_SETTINGS.gridSize / 2,
                                y: head.y * DEFAULT_SETTINGS.gridSize +
                                    DEFAULT_SETTINGS.gridSize / 2,
                                vx: Math.cos(a) *
                                    speed *
                                    (DEFAULT_SETTINGS.gridSize / 20),
                                vy: Math.sin(a) *
                                    speed *
                                    (DEFAULT_SETTINGS.gridSize / 20),
                                damage: wStats.neonScatterDamage,
                                color: COLORS.neonScatter,
                                size: 3,
                                type: 'SHARD',
                                life: 25,
                                owner: 'PLAYER'
                            });
                        }
                        audioEventsRef.current.push({ type: 'SHOOT' });
                        neonScatterTimerRef.current = 0;
                    }
                }
            }
        }
        // 5. PHASE RAIL
        if (wStats.phaseRailLevel > 0) {
            phaseRailChargeRef.current += dt;
            const chargeTime = 4000;
            if (phaseRailChargeRef.current >= chargeTime) {
                const enemies = enemiesRef.current;
                if (enemies.length === 0) {
                    phaseRailChargeRef.current = 0;
                }
                else {
                    let nearest = null;
                    let minDist = Infinity;
                    for (const e of enemies) {
                        const dx = e.x - head.x;
                        const dy = e.y - head.y;
                        const d = dx * dx + dy * dy;
                        if (d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                    if (nearest) {
                        const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
                        const speed = 60;
                        projectilesRef.current.push({
                            id: Math.random().toString(36),
                            x: head.x * DEFAULT_SETTINGS.gridSize +
                                DEFAULT_SETTINGS.gridSize / 2,
                            y: head.y * DEFAULT_SETTINGS.gridSize +
                                DEFAULT_SETTINGS.gridSize / 2,
                            vx: Math.cos(angle) *
                                speed *
                                (DEFAULT_SETTINGS.gridSize / 20),
                            vy: Math.sin(angle) *
                                speed *
                                (DEFAULT_SETTINGS.gridSize / 20),
                            damage: wStats.phaseRailDamage,
                            color: COLORS.phaseRail,
                            size: 6,
                            type: 'RAIL',
                            piercing: true,
                            hitIds: [],
                            owner: 'PLAYER'
                        });
                        audioEventsRef.current.push({ type: 'SHOOT' });
                        triggerShake(10, 10);
                        phaseRailChargeRef.current = 0;
                    }
                }
            }
        }
        // 6. NANO SWARM
        if (wStats.nanoSwarmLevel > 0) {
            const count = wStats.nanoSwarmCount;
            const radius = 3.8 * DEFAULT_SETTINGS.gridSize;
            const speed = now / (350 - wStats.nanoSwarmLevel * 10);
            const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
            const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
            for (let i = 0; i < count; i++) {
                const angle = speed + (i * (Math.PI * 2 / count));
                const sx = cx + Math.cos(angle) * radius;
                // FIX: Use CY center reference for correct orbiting, not raw head.y
                const sy = cy + Math.sin(angle) * radius;
                enemiesRef.current.forEach(e => {
                    // Debounce: NANO
                    if (e.hitCooldowns && e.hitCooldowns['NANO'] > 0)
                        return;
                    const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
                    const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
                    const d = Math.hypot(ex - sx, ey - sy);
                    if (d < DEFAULT_SETTINGS.gridSize) {
                        damageEnemy(e, wStats.nanoSwarmDamage);
                        createParticles(e.x, e.y, COLORS.nanoSwarm, 3);
                        if (!e.hitCooldowns)
                            e.hitCooldowns = {};
                        e.hitCooldowns['NANO'] = 15; // ~250ms cooldown
                    }
                });
            }
        }
        // 7. PLASMA MINES
        if (wStats.mineLevel > 0) {
            mineDropTimerRef.current += dt;
            if (mineDropTimerRef.current >= wStats.mineDropRate) {
                const snake = snakeRef.current;
                if (snake.length > 0) {
                    const tail = snake[snake.length - 1];
                    minesRef.current.push({
                        id: Math.random().toString(36),
                        x: tail.x,
                        y: tail.y,
                        damage: wStats.mineDamage,
                        radius: wStats.mineRadius,
                        triggerRadius: 1.5,
                        createdAt: now
                    });
                }
                mineDropTimerRef.current = 0;
            }
            const enemies = enemiesRef.current;
            for (let i = minesRef.current.length - 1; i >= 0; i--) {
                const mine = minesRef.current[i];
                if (mine.shouldRemove)
                    continue;
                let triggered = false;
                for (const e of enemies) {
                    const dx = e.x - mine.x;
                    const dy = e.y - mine.y;
                    if (dx * dx + dy * dy <= mine.triggerRadius * mine.triggerRadius) {
                        triggered = true;
                        break;
                    }
                }
                if (triggered) {
                    triggerShockwave({
                        id: Math.random().toString(36),
                        x: mine.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        y: mine.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                        currentRadius: 0,
                        maxRadius: mine.radius * DEFAULT_SETTINGS.gridSize,
                        damage: mine.damage,
                        opacity: 1
                    });
                    createParticles(mine.x, mine.y, COLORS.mine, 20);
                    audioEventsRef.current.push({ type: 'COMPRESS' });
                    mine.shouldRemove = true;
                }
            }
        }
        // 8. AURA
        if (wStats.auraLevel > 0) {
            auraTickTimerRef.current += dt;
            if (auraTickTimerRef.current >= 250) {
                const enemies = enemiesRef.current;
                const snake = snakeRef.current;
                const r2 = wStats.auraRadius * wStats.auraRadius;
                for (const e of enemies) {
                    let hit = false;
                    for (const seg of snake) {
                        const dx = e.x - seg.x;
                        const dy = e.y - seg.y;
                        if (dx * dx + dy * dy <= r2) {
                            hit = true;
                            break;
                        }
                    }
                    if (hit) {
                        damageEnemy(e, wStats.auraDamage);
                        createParticles(e.x, e.y, COLORS.aura, 1);
                    }
                }
                auraTickTimerRef.current = 0;
            }
        }
        // 9. PROJECTILES UPDATE
        const margin = 100;
        for (const p of projectilesRef.current) {
            if (p.shouldRemove) {
                continue;
            }
            if (isPlayerHomingProjectile(p)) {
                if (!p.targetId) {
                    let nearest = null;
                    let minDist = Infinity;
                    for (const e of enemiesRef.current) {
                        const dx = e.x * DEFAULT_SETTINGS.gridSize - p.x;
                        const dy = e.y * DEFAULT_SETTINGS.gridSize - p.y;
                        const d = dx * dx + dy * dy;
                        if (d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                    if (nearest)
                        p.targetId = nearest.id;
                }
                const enemies = enemiesRef.current;
                const target = p.targetId
                    ? enemies.find((e) => e.id === p.targetId)
                    : undefined;
                if (!target) {
                    p.shouldRemove = true;
                }
                else {
                    const tx = target.x * DEFAULT_SETTINGS.gridSize +
                        DEFAULT_SETTINGS.gridSize / 2;
                    const ty = target.y * DEFAULT_SETTINGS.gridSize +
                        DEFAULT_SETTINGS.gridSize / 2;
                    const dx = tx - p.x;
                    const dy = ty - p.y;
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.hypot(p.vx, p.vy);
                    p.vx = p.vx * 0.9 + Math.cos(angle) * speed * 0.1;
                    p.vy = p.vy * 0.9 + Math.sin(angle) * speed * 0.1;
                }
            }
            // ── Movement ───────────────────────────────
            p.x += p.vx * frame;
            p.y += p.vy * frame;
            if (p.life !== undefined) {
                p.life -= frame;
                if (p.life <= 0)
                    p.shouldRemove = true;
            }
            if (p.x < -margin ||
                p.x > CANVAS_WIDTH + margin ||
                p.y < -margin ||
                p.y > CANVAS_HEIGHT + margin) {
                p.shouldRemove = true;
                continue;
            }
            // ── Player Projectile vs Enemy ─────────────
            if (p.owner === 'PLAYER') {
                const enemies = enemiesRef.current;
                for (const e of enemies) {
                    if (p.piercing && p.hitIds?.includes(e.id))
                        continue;
                    const ex = e.x * DEFAULT_SETTINGS.gridSize +
                        DEFAULT_SETTINGS.gridSize / 2;
                    const ey = e.y * DEFAULT_SETTINGS.gridSize +
                        DEFAULT_SETTINGS.gridSize / 2;
                    if (Math.abs(p.x - ex) < 25 &&
                        Math.abs(p.y - ey) < 25) {
                        damageEnemy(e, p.damage);
                        createParticles(e.x, e.y, p.color, 3);
                        if (p.piercing) {
                            p.hitIds ?? (p.hitIds = []);
                            p.hitIds.push(e.id);
                        }
                        else {
                            p.shouldRemove = true;
                        }
                        break;
                    }
                }
            }
        }
        // 10. SHOCKWAVES
        shockwavesRef.current.forEach(s => {
            if (s.shouldRemove)
                return;
            // Normalize growth
            s.currentRadius += SHOCKWAVE_SPEED * frame * 10;
            s.opacity -= 0.02 * frame;
            if (s.damage > 0 || s.stunDuration) {
                const rSq = s.currentRadius ** 2;
                enemiesRef.current.forEach(e => {
                    // Debounce: SHOCKWAVE
                    if (e.hitCooldowns && e.hitCooldowns['SHOCKWAVE'] > 0)
                        return;
                    const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
                    const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
                    const dSq = Math.pow(ex - s.x, 2) + Math.pow(ey - s.y, 2);
                    if (dSq <= rSq && dSq >= (s.currentRadius - 20) ** 2) {
                        if (s.damage > 0)
                            damageEnemy(e, s.damage, true);
                        if (s.stunDuration) {
                            e.stunTimer = s.stunDuration;
                            createParticles(e.x, e.y, '#00ffff', 5);
                        }
                        const angle = Math.atan2(ey - s.y, ex - s.x);
                        e.x += Math.cos(angle) * 1.5;
                        e.y += Math.sin(angle) * 1.5;
                        if (!e.hitCooldowns)
                            e.hitCooldowns = {};
                        e.hitCooldowns['SHOCKWAVE'] = 20; // 300ms cooldown
                    }
                });
            }
            if (s.opacity <= 0 || s.currentRadius >= s.maxRadius) {
                s.shouldRemove = true;
            }
        });
        // 11. LIGHTNING
        lightningArcsRef.current.forEach(arc => {
            if (arc.shouldRemove)
                return;
            arc.life -= frame * 0.08; // Normalized decay
            if (arc.life <= 0)
                arc.shouldRemove = true;
        });
    }, [
        statsRef,
        snakeRef,
        enemiesRef,
        projectilesRef,
        shockwavesRef,
        minesRef,
        lightningArcsRef,
        gameTimeRef,
        damageEnemy,
        createParticles,
        triggerShockwave,
        game,
        audioEventsRef,
        overclockActiveRef,
        echoDamageStoredRef,
        triggerShake,
        spawnFloatingText,
        applyDamage,
        processDeath
    ]);
    return {
        damageEnemy,
        triggerSystemShock,
        triggerChronoSurge,
        triggerTacticalPing,
        update
    };
}
