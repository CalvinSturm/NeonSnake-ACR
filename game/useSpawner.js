import { useCallback } from 'react';
import { FoodType, EnemyType } from '../types';
import { CHANCE_BONUS, CHANCE_POISON, CHANCE_SLOW, CHANCE_MAGNET, CHANCE_COMPRESSOR, GRID_COLS, GRID_ROWS, ENEMY_BASE_HP, BOSS_BASE_HP, TERMINAL_HACK_RADIUS, TERMINAL_HACK_TIME, DIFFICULTY_CONFIGS, COLORS, ENEMY_SPAWN_INTERVAL } from '../constants';
import { getRandomPos } from './gameUtils';
export function useSpawner(game, triggerShake) {
    const { snakeRef, foodRef, enemiesRef, wallsRef, terminalsRef, stageRef, bossActiveRef, setBossActive, difficulty, levelRef, gameTimeRef, enemySpawnTimerRef, terminalSpawnTimerRef, audioEventsRef } = game;
    // ─────────────────────────────
    // FOOD
    // ─────────────────────────────
    const spawnFood = useCallback((forceType) => {
        const occupied = [...foodRef.current, ...enemiesRef.current];
        const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
        let type = FoodType.NORMAL;
        if (!forceType) {
            const roll = Math.random() * 100;
            let c = CHANCE_BONUS;
            if (roll < c)
                type = FoodType.BONUS;
            else if (roll < (c += CHANCE_POISON))
                type = FoodType.POISON;
            else if (roll < (c += CHANCE_SLOW))
                type = FoodType.SLOW;
            else if (roll < (c += CHANCE_MAGNET))
                type = FoodType.MAGNET;
            else if (roll < (c += CHANCE_COMPRESSOR))
                type = FoodType.COMPRESSOR;
        }
        else {
            type = forceType;
        }
        const isTemporary = [
            FoodType.BONUS,
            FoodType.SLOW,
            FoodType.MAGNET,
            FoodType.COMPRESSOR
        ].includes(type);
        foodRef.current.push({
            ...pos,
            type,
            id: Math.random().toString(36),
            createdAt: gameTimeRef.current,
            lifespan: isTemporary ? 6000 : undefined
        });
    }, [foodRef, enemiesRef, snakeRef, wallsRef]);
    // ─────────────────────────────
    // XP DROPS
    // ─────────────────────────────
    const spawnXpOrbs = useCallback((x, y, totalXp) => {
        // Chunking logic:
        // Prefer 50s, then 10s.
        // Small scatter radius.
        let remaining = totalXp;
        const orbs = [];
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
            foodRef.current.push({
                x: x + offsetX,
                y: y + offsetY,
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
        // Architecture: Do not filter ref.current directly. Mark for removal.
        for (const f of foodRef.current) {
            if (f.lifespan && now - f.createdAt > f.lifespan) {
                f.shouldRemove = true;
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
        }
    }, [enemiesRef, setBossActive]);
    // ─────────────────────────────
    // TERMINAL
    // ─────────────────────────────
    const spawnTerminal = useCallback(() => {
        if (terminalsRef.current.length > 0)
            return;
        const occupied = [...foodRef.current, ...enemiesRef.current, ...snakeRef.current];
        const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
        terminalsRef.current.push({
            ...pos,
            id: Math.random().toString(36),
            radius: TERMINAL_HACK_RADIUS,
            progress: 0,
            totalTime: TERMINAL_HACK_TIME,
            isLocked: false,
            color: COLORS.terminal
        });
    }, [terminalsRef, foodRef, enemiesRef, snakeRef, wallsRef]);
    // ─────────────────────────────
    // ENEMY
    // ─────────────────────────────
    const spawnEnemy = useCallback((forcedType) => {
        const diffConfig = DIFFICULTY_CONFIGS[difficulty];
        const isBossStage = stageRef.current % 4 === 0;
        // Use REF for sync logic
        // Prevent double spawn if boss already active OR defeated
        if (isBossStage && !bossActiveRef.current && !game.bossDefeatedRef.current) {
            const bossHp = BOSS_BASE_HP *
                diffConfig.bossHpMod *
                (1 + stageRef.current * 0.25);
            enemiesRef.current.push({
                x: Math.floor(GRID_COLS / 2),
                y: Math.floor(GRID_ROWS / 4),
                id: 'BOSS',
                type: EnemyType.BOSS,
                spawnTime: gameTimeRef.current,
                hp: bossHp,
                maxHp: bossHp,
                flash: 0,
                hitCooldowns: {},
                bossPhase: 1,
                attackTimer: 0,
                spawnTimer: 0,
                targetPos: { x: GRID_COLS / 2, y: GRID_ROWS / 2 },
                angle: 0
            });
            setBossActive(true);
            audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
            triggerShake(25, 25);
            return;
        }
        if (bossActiveRef.current && enemiesRef.current.length > 5)
            return;
        const head = snakeRef.current[0];
        let pos;
        let attempts = 0;
        do {
            pos = getRandomPos(snakeRef.current, enemiesRef.current, wallsRef.current);
            attempts++;
        } while (Math.abs(pos.x - head.x) + Math.abs(pos.y - head.y) < 10 &&
            attempts < 15);
        const type = forcedType ??
            diffConfig.allowedEnemies[Math.floor(Math.random() * diffConfig.allowedEnemies.length)];
        const hpScale = (1 + stageRef.current * 0.35 + levelRef.current * 0.12) *
            diffConfig.hpMod;
        enemiesRef.current.push({
            ...pos,
            id: Math.random().toString(36),
            type,
            spawnTime: gameTimeRef.current,
            hp: ENEMY_BASE_HP * hpScale,
            maxHp: ENEMY_BASE_HP * hpScale,
            flash: 0,
            hitCooldowns: {},
            attackTimer: 0,
            dashTimer: 0,
            dashState: 'IDLE'
        });
        audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
    }, [
        difficulty,
        stageRef,
        bossActiveRef, // Dependency on ref container is stable
        enemiesRef,
        snakeRef,
        wallsRef,
        setBossActive,
        triggerShake,
        levelRef,
        audioEventsRef,
        game.bossDefeatedRef
    ]);
    // ─────────────────────────────
    // UPDATE LOOP
    // ─────────────────────────────
    const update = useCallback((dt) => {
        // Fail-safe: Ensure food exists
        if (foodRef.current.length === 0) {
            spawnFood();
        }
        if (bossActiveRef.current) {
            terminalSpawnTimerRef.current = 0;
        }
        enemySpawnTimerRef.current += dt;
        terminalSpawnTimerRef.current += dt;
        if (enemySpawnTimerRef.current >= ENEMY_SPAWN_INTERVAL) {
            spawnEnemy();
            enemySpawnTimerRef.current -= ENEMY_SPAWN_INTERVAL;
        }
        if (terminalSpawnTimerRef.current >= 8000) {
            if (terminalsRef.current.length === 0 && !bossActiveRef.current) {
                spawnTerminal();
            }
            terminalSpawnTimerRef.current -= 8000;
        }
    }, [difficulty, bossActiveRef, spawnEnemy, spawnTerminal, terminalsRef, enemySpawnTimerRef, terminalSpawnTimerRef, foodRef, spawnFood]);
    return { update, spawnFood, spawnXpOrbs, spawnEnemy, spawnTerminal, cleanupFood, pruneEnemies };
}
