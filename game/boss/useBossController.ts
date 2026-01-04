
import { useCallback } from 'react';
import { useGameState } from '../useGameState';
import { SENTINEL_BOSS_CONFIG } from './definitions/SentinelBoss';
import { WARDEN_BOSS_CONFIG } from './definitions/WardenBoss';
import { SPACESHIP_BOSS_CONFIG } from './definitions/SpaceshipBoss';
import { BossConfig, BossIntent } from './types';
import { DEFAULT_SETTINGS } from '../../constants';

const BOSS_REGISTRY: Record<string, BossConfig> = {
    'SENTINEL': SENTINEL_BOSS_CONFIG,
    'WARDEN_07': WARDEN_BOSS_CONFIG,
    'SPACESHIP_BOSS': SPACESHIP_BOSS_CONFIG
};

export function useBossController(game: ReturnType<typeof useGameState>) {
    const { enemiesRef, hitboxesRef, gameTimeRef, snakeRef } = game;

    const processIntents = useCallback((intents: BossIntent[], bossId: string, bossX: number, bossY: number, facing: number) => {
        if (!intents) return;

        for (const intent of intents) {
            switch (intent.type) {
                case 'SPAWN_HITBOX':
                    if (intent.hitboxDef) {
                        const def = intent.hitboxDef;
                        // Flip offset based on facing
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
                case 'LOCK_CAMERA':
                    // Camera lock logic would go here
                    break;
            }
        }
    }, [hitboxesRef]);

    const update = useCallback((dt: number) => {
        const playerHead = snakeRef.current[0];

        for (const enemy of enemiesRef.current) {
            // 1. Filter Bosses
            if (!enemy.bossConfigId || !enemy.bossState) continue;

            const config = BOSS_REGISTRY[enemy.bossConfigId];
            if (!config) continue;

            const stateRuntime = enemy.bossState;
            const currentPhase = config.phases[stateRuntime.phaseIndex];
            const stateTable = currentPhase.table;
            const currentStateDef = stateTable[stateRuntime.stateId];

            if (!currentStateDef) {
                console.error(`Unknown boss state: ${stateRuntime.stateId}`);
                continue;
            }

            // 2. Facing / Aiming Logic
            
            // Standard Platformer Bosses (Sentinel, Warden)
            if (enemy.bossConfigId !== 'SPACESHIP_BOSS') {
                const isIdle = stateRuntime.stateId.startsWith('IDLE');
                if (enemy.facing === undefined) enemy.facing = 1;

                if (isIdle && playerHead) {
                    const dx = playerHead.x - enemy.x;
                    if (Math.abs(dx) > 1) { // Hysteresis
                        enemy.facing = Math.sign(dx);
                    }
                }
            } 
            // Spaceship Boss (Top Down Rotation)
            else if (enemy.bossConfigId === 'SPACESHIP_BOSS') {
                // Tracking States: IDLE, CHARGE
                // Locked States: FIRE, COOLDOWN
                const isTracking = ['IDLE', 'CHARGE_CANNON'].includes(stateRuntime.stateId);
                
                if (playerHead && isTracking) {
                    const targetAngle = Math.atan2(playerHead.y - enemy.y, playerHead.x - enemy.x);
                    
                    if (enemy.angle === undefined) enemy.angle = targetAngle;
                    
                    // Smooth turn
                    const diff = targetAngle - enemy.angle;
                    // Normalize -PI to PI
                    const dNorm = Math.atan2(Math.sin(diff), Math.cos(diff));
                    
                    // Turn speed (slower when charging to give player chance to dodge)
                    const turnSpeed = stateRuntime.stateId === 'CHARGE_CANNON' ? 2.0 : 4.0;
                    
                    enemy.angle += dNorm * turnSpeed * (dt / 1000);
                }
                
                if (enemy.angle === undefined) enemy.angle = Math.PI; // Default left
            }

            // 3. Advance Timer
            stateRuntime.timer += dt;

            // 4. Transition Check
            if (stateRuntime.timer >= currentStateDef.duration) {
                // State Complete. Resolve Exit.
                if (currentStateDef.onExit) {
                    processIntents(currentStateDef.onExit, enemy.id, enemy.x, enemy.y, enemy.facing || 1);
                }

                // Check for Phase Transition
                const hpRatio = enemy.hp / enemy.maxHp;
                let nextPhaseIndex = stateRuntime.phaseIndex;
                
                // Check if we qualify for a later phase (Iterate from end)
                for (let i = config.phases.length - 1; i > stateRuntime.phaseIndex; i--) {
                    if (hpRatio <= config.phases[i].threshold) {
                        nextPhaseIndex = i;
                        break;
                    }
                }

                if (nextPhaseIndex !== stateRuntime.phaseIndex) {
                    // PHASE SWITCH
                    stateRuntime.phaseIndex = nextPhaseIndex;
                    const newPhase = config.phases[nextPhaseIndex];
                    stateRuntime.stateId = newPhase.entryState;
                    stateRuntime.timer = 0;
                    
                    // Enter new state (from new phase)
                    const newState = newPhase.table[newPhase.entryState];
                    if (newState && newState.onEnter) {
                        processIntents(newState.onEnter, enemy.id, enemy.x, enemy.y, enemy.facing || 1);
                    }
                } else {
                    // STANDARD TRANSITION
                    const nextId = currentStateDef.next;
                    if (nextId) {
                        stateRuntime.stateId = nextId;
                        stateRuntime.timer = 0;
                        
                        const nextState = stateTable[nextId];
                        if (nextState && nextState.onEnter) {
                            processIntents(nextState.onEnter, enemy.id, enemy.x, enemy.y, enemy.facing || 1);
                        }
                    } else {
                        // Loop fallback
                        stateRuntime.stateId = 'IDLE';
                        stateRuntime.timer = 0;
                    }
                }
            }
        }
    }, [enemiesRef, processIntents, snakeRef]);

    return { update };
}
