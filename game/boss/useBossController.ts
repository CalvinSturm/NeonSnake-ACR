
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { useSpawner } from '../useSpawner';
import { SENTINEL_BOSS_CONFIG } from './definitions/SentinelBoss';
import { WARDEN_BOSS_CONFIG } from './definitions/WardenBoss';
import { SPACESHIP_BOSS_CONFIG } from './definitions/SpaceshipBoss';
import { BossConfig, BossIntent } from './types';
import { Enemy, Point } from '../../types';
import { audio } from '../../utils/audio';

const BOSS_REGISTRY: Record<string, BossConfig> = {
    'SENTINEL': SENTINEL_BOSS_CONFIG,
    'WARDEN_07': WARDEN_BOSS_CONFIG,
    'SPACESHIP_BOSS': SPACESHIP_BOSS_CONFIG
};

export function useBossController(
    game: ReturnType<typeof useGameState>,
    spawner: ReturnType<typeof useSpawner>
) {
    const { hitboxesRef, gameTimeRef, powerUpsRef, audioEventsRef, viewport, projectilesRef } = game;
    const { spawnEnemy } = spawner;

    // ─── MOVEMENT ENGINE ───
    const updateBossMovement = useCallback((boss: Enemy, player: Point, dt: number) => {
        const stateId = boss.bossState?.stateId || 'IDLE';
        const configId = boss.bossConfigId;
        const dtSec = dt / 1000;

        // 1. SENTINEL MOVEMENT
        if (configId === 'SENTINEL') {
            const hoverHeight = 5; // Grid units
            const floorHeight = viewport.rows - 4;

            if (stateId.includes('IDLE')) {
                // Hover and track X
                const targetX = player.x;
                const dx = targetX - boss.x;
                boss.vx = dx * 1.5; // Smooth track
                
                // Bobbing Y
                const targetY = hoverHeight + Math.sin(gameTimeRef.current / 500) * 1.5;
                const dy = targetY - boss.y;
                boss.vy = dy * 2.0;

            } else if (stateId.includes('TELEGRAPH_SLAM')) {
                // Stop X, slight rise
                boss.vx *= 0.9;
                const targetY = hoverHeight - 2;
                boss.vy = (targetY - boss.y) * 2;

            } else if (stateId.includes('EXECUTE_SLAM')) {
                // Crash down
                boss.vx = 0;
                boss.vy += 80 * dtSec; // Heavy gravity accel
                if (boss.y > floorHeight) {
                    boss.y = floorHeight;
                    boss.vy = 0;
                }

            } else if (stateId.includes('RECOVERY')) {
                // Slowly rise back
                boss.vx = 0;
                const targetY = hoverHeight;
                const dy = targetY - boss.y;
                boss.vy = dy * 1.0; // Slow rise
            }
            
            // Apply Velocity
            boss.x += boss.vx * dtSec;
            boss.y += boss.vy * dtSec;
        }

        // 2. WARDEN MOVEMENT
        else if (configId === 'WARDEN_07') {
            if (stateId.includes('IDLE')) {
                const dx = player.x - boss.x;
                if (Math.abs(dx) > 1) boss.facing = Math.sign(dx);
            }
        }

        // 3. SPACESHIP MOVEMENT
        else if (configId === 'SPACESHIP_BOSS') {
            // Strafing Logic
            const targetY = 5; // Top of screen
            boss.y += (targetY - boss.y) * 2 * dtSec;
            
            if (stateId.includes('IDLE')) {
                 // Sine wave strafe
                 boss.vx = Math.sin(gameTimeRef.current / 1000) * 5;
            } else if (stateId === 'CHARGE_CANNON') {
                 // Slow down to aim
                 boss.vx *= 0.95;
            }
             
            boss.x += boss.vx * dtSec;
        }

        // Boundary Clamps
        boss.x = Math.max(1, Math.min(viewport.cols - 2, boss.x));
        if (configId !== 'SENTINEL' && configId !== 'WARDEN_07') {
             boss.y = Math.max(1, Math.min(viewport.rows - 2, boss.y));
        }

    }, [viewport, gameTimeRef]);

    const processIntents = useCallback((intents: BossIntent[], bossId: string, bossX: number, bossY: number, facing: number) => {
        if (!intents) return;

        for (const intent of intents) {
            switch (intent.type) {
                case 'SPAWN_HITBOX':
                    if (intent.hitboxDef) {
                        const def = intent.hitboxDef;
                        const finalOffsetX = def.offsetX * facing;
                        
                        hitboxesRef.current.push({
                            id: `${bossId}_${def.tag}`,
                            ownerId: bossId,
                            x: bossX + finalOffsetX, 
                            y: bossY + def.offsetY, 
                            width: def.width,
                            height: def.height,
                            damage: def.damage,
                            color: def.color
                        });
                    }
                    break;

                case 'DESPAWN_HITBOX':
                    if (intent.tag) {
                        const targetId = `${bossId}_${intent.tag}`;
                        const idx = hitboxesRef.current.findIndex(h => h.id === targetId);
                        if (idx !== -1) {
                            hitboxesRef.current.splice(idx, 1);
                        }
                    }
                    break;
                
                case 'SPAWN_MINIONS':
                    for(let i=0; i<intent.count; i++) {
                        const offset = intent.offset || { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 };
                        const spawnPos = { x: bossX + offset.x, y: bossY + offset.y };
                        spawnEnemy(intent.enemyType, spawnPos);
                    }
                    audioEventsRef.current.push({ type: 'ENEMY_SPAWN' });
                    break;

                case 'APPLY_EFFECT':
                    const now = gameTimeRef.current;
                    if (intent.effect === 'SLOW') {
                        powerUpsRef.current.slowUntil = now + intent.duration;
                        audio.play('EMP'); // Sound effect for slow
                    } else if (intent.effect === 'MAGNET') {
                        powerUpsRef.current.magnetUntil = now + intent.duration;
                    }
                    break;

                case 'SPAWN_PROJECTILE':
                    const projCount = intent.count || 1;
                    const projSpread = intent.spread || 0;
                    const projBaseAngle = intent.angle;

                    // Use proper grid size and velocity scaling (same as player projectiles)
                    const gridSize = viewport.cols > 0 ? (1920 / viewport.cols) : 32; // Approximate grid size
                    const velocityScale = gridSize / 20; // Match player projectile scaling

                    for (let i = 0; i < projCount; i++) {
                        // Calculate angle with spread for multiple projectiles
                        let projAngle = projBaseAngle;
                        if (projCount > 1) {
                            const angleOffset = (i / (projCount - 1) - 0.5) * projSpread;
                            projAngle = projBaseAngle + angleOffset;
                        }

                        // Convert grid position to pixel position
                        const projX = bossX * gridSize + gridSize / 2;
                        const projY = bossY * gridSize + gridSize / 2;

                        // Scale velocity properly
                        const projSpeed = intent.speed * velocityScale;

                        projectilesRef.current.push({
                            id: `boss_proj_${Date.now()}_${i}`,
                            x: projX,
                            y: projY,
                            vx: Math.cos(projAngle) * projSpeed,
                            vy: Math.sin(projAngle) * projSpeed,
                            damage: intent.damage,
                            color: '#ff4444',
                            size: 10,
                            type: 'BOSS_PROJECTILE',
                            owner: 'ENEMY'
                        });
                    }
                    audio.play('SHOOT');
                    break;

                case 'LOCK_CAMERA':
                    break;
            }
        }
    }, [hitboxesRef, spawnEnemy, powerUpsRef, gameTimeRef, audioEventsRef, projectilesRef, viewport]);

    // Exposed method for single entity update
    const updateBoss = useCallback((boss: Enemy, dt: number, playerHead: Point) => {
        if (!boss.bossConfigId || !boss.bossState) return;

        const config = BOSS_REGISTRY[boss.bossConfigId];
        if (!config) return;

        const stateRuntime = boss.bossState;
        const currentPhase = config.phases[stateRuntime.phaseIndex];
        const stateTable = currentPhase.table;
        const currentStateDef = stateTable[stateRuntime.stateId];

        if (!currentStateDef) return;

        // 2. Update Movement & Aiming
        if (playerHead) {
            updateBossMovement(boss, playerHead, dt);
        }

        // 3. Advance Timer
        stateRuntime.timer += dt;

        // 4. Transition Check
        if (stateRuntime.timer >= currentStateDef.duration) {
            // Exit Actions
            if (currentStateDef.onExit) {
                processIntents(currentStateDef.onExit, boss.id, boss.x, boss.y, boss.facing || 1);
            }

            // Phase Logic
            const currentHp = boss.hp;
            let nextPhaseIndex = stateRuntime.phaseIndex;
            
            // Check if we pushed past a threshold
            for (let i = stateRuntime.phaseIndex + 1; i < config.phases.length; i++) {
                    if ((currentHp / boss.maxHp) <= config.phases[i].threshold) {
                        nextPhaseIndex = i;
                    }
            }

            if (nextPhaseIndex !== stateRuntime.phaseIndex) {
                // PHASE TRANSITION
                stateRuntime.phaseIndex = nextPhaseIndex;
                const newPhase = config.phases[nextPhaseIndex];
                stateRuntime.stateId = newPhase.entryState;
                stateRuntime.timer = 0;
                
                // Enter New Phase State
                const newState = newPhase.table[newPhase.entryState];
                if (newState && newState.onEnter) {
                    processIntents(newState.onEnter, boss.id, boss.x, boss.y, boss.facing || 1);
                }
            } else {
                // STATE TRANSITION
                const nextId = currentStateDef.next;
                if (nextId) {
                    stateRuntime.stateId = nextId;
                    stateRuntime.timer = 0;
                    
                    const nextState = stateTable[nextId];
                    if (nextState && nextState.onEnter) {
                        processIntents(nextState.onEnter, boss.id, boss.x, boss.y, boss.facing || 1);
                    }
                } else {
                    stateRuntime.stateId = 'IDLE';
                    stateRuntime.timer = 0;
                }
            }
        }
    }, [processIntents, updateBossMovement]);

    // Keep legacy update for global management if needed, but primary logic is now delegated
    const update = useCallback((dt: number) => {
        // No-op or global boss state management
    }, []);

    return { update, updateBoss };
}
