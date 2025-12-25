
import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import { useCombat } from './useCombat';
import { useSpawner } from './useSpawner';
import { useFX } from './useFX';
import { ProgressionAPI } from './useProgression';
import { Point, GameStatus, EnemyType, FoodType } from '../types';
import { DEFAULT_SETTINGS, COLORS, GRID_COLS, GRID_ROWS, MAGNET_RADIUS, COLLISION_CONFIG } from '../constants';

export function useCollisions(
  game: ReturnType<typeof useGameState>,
  combat: ReturnType<typeof useCombat>,
  spawner: ReturnType<typeof useSpawner>,
  fx: ReturnType<typeof useFX>,
  progression: ProgressionAPI
) {
  const {
    snakeRef,
    wallsRef,
    enemiesRef,
    foodRef,
    terminalsRef,
    projectilesRef,
    gameTimeRef,
    setStatus,
    failureMessageRef,
    audioEventsRef,
    setUiShield,
    statsRef,
    terminalsHackedRef,
    invulnerabilityTimeRef,
    powerUpsRef, 
    ghostCoilCooldownRef,
    tailIntegrityRef, 
    chromaticAberrationRef,
    traitsRef 
  } = game;

  const { createParticles, triggerShake, spawnFloatingText, triggerShockwave, triggerLightning } = fx;
  const { onTerminalHacked, onFoodConsumed } = progression;
  const { damageEnemy } = combat; 

  const collisionCandidatesRef = useRef<Record<string, number>>({});

  const updateCollisionLogic = useCallback((dt: number) => {
      if (tailIntegrityRef.current < 100) {
          tailIntegrityRef.current = Math.min(100, tailIntegrityRef.current + (dt / 1000) * 15);
      }
      
      const head = snakeRef.current[0];
      if (!head) return;

      const now = gameTimeRef.current;
      const hx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
      const hy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

      for (let i = terminalsRef.current.length - 1; i >= 0; i--) {
        const t = terminalsRef.current[i];
        t.justDisconnected = false;
        t.justCompleted = false;

        if (t.shouldRemove) continue;

        const tx = t.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
        const ty = t.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

        const dist = Math.hypot(hx - tx, hy - ty);
        const range = t.radius * DEFAULT_SETTINGS.gridSize;

        if (dist <= range) {
          const speedMod = statsRef.current.hackSpeedMod || 1.0;
          t.progress += dt * speedMod;
          t.particleTimer = (t.particleTimer || 0) + dt;
          if (t.particleTimer > 250) {
            createParticles(t.x, t.y, t.color, 3);
            t.particleTimer = 0;
          }

          if (t.progress >= t.totalTime) {
            
            onTerminalHacked(t.type);
            terminalsHackedRef.current += 1;

            if (t.type === 'OVERRIDE') {
                const boss = enemiesRef.current.find(e => e.type === EnemyType.BOSS);
                if (boss) {
                    spawnFloatingText(
                        boss.x * DEFAULT_SETTINGS.gridSize,
                        boss.y * DEFAULT_SETTINGS.gridSize,
                        "SYSTEM OVERRIDE",
                        '#ffaa00',
                        24
                    );
                    triggerShockwave({
                        id: Math.random().toString(),
                        x: boss.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y: boss.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        currentRadius: 10, maxRadius: 300,
                        damage: 0, opacity: 0.8
                    });
                }
            } else {
                const xpAmount = Math.floor(300 * statsRef.current.hackSpeedMod);
                spawnFloatingText(
                    t.x * DEFAULT_SETTINGS.gridSize, 
                    t.y * DEFAULT_SETTINGS.gridSize - 20, 
                    `+${xpAmount} XP`, 
                    '#ffff00', 
                    16
                );
            }

            triggerShake(15, 15);
            spawnFloatingText(tx, ty, 'HACKED', t.color, 20);
            triggerShockwave({
              id: Math.random().toString(),
              x: tx, y: ty,
              currentRadius: 10, maxRadius: 200,
              damage: 0, opacity: 0.6,
            });
            
            t.justCompleted = true;
            t.shouldRemove = true;
          }
        } else if (t.progress > 0) {
          if (t.progress > 500 && now - (t.lastEffectTime || 0) > 1000) {
            t.justDisconnected = true;
            t.lastEffectTime = now;
          }
          t.progress = Math.max(0, t.progress - dt * 1.5);
        }
      }
  }, [snakeRef, terminalsRef, terminalsHackedRef, tailIntegrityRef, gameTimeRef, statsRef, createParticles, triggerShake, spawnFloatingText, triggerShockwave, onTerminalHacked, enemiesRef]);

  const checkMoveCollisions = useCallback((head: Point): boolean => {
    if (
      head.x < 0 || head.x >= GRID_COLS ||
      head.y < 0 || head.y >= GRID_ROWS ||
      wallsRef.current.some(w => w.x === head.x && w.y === head.y)
    ) {
      if (invulnerabilityTimeRef.current > 0) {
          head.x = Math.max(0, Math.min(GRID_COLS - 1, head.x));
          head.y = Math.max(0, Math.min(GRID_ROWS - 1, head.y));
          return false;
      }

      if (statsRef.current.shieldActive) {
        statsRef.current.shieldActive = false;
        setUiShield(false);
        triggerShake(20, 20);
        audioEventsRef.current.push({ type: 'SHIELD_HIT' });
        invulnerabilityTimeRef.current = 2000; 
        head.x = Math.max(0, Math.min(GRID_COLS - 1, head.x));
        head.y = Math.max(0, Math.min(GRID_ROWS - 1, head.y));
        return false;
      }
      
      setStatus(GameStatus.GAME_OVER);
      failureMessageRef.current = 'SEGMENTATION_FAULT // WALL_IMPACT';
      audioEventsRef.current.push({ type: 'GAME_OVER' });
      triggerShake(30, 30);
      return true;
    }

    for (let i = 0; i < snakeRef.current.length - 1; i++) {
      const segment = snakeRef.current[i];
      if (head.x === segment.x && head.y === segment.y) {
        if (invulnerabilityTimeRef.current > 0) return false;

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

  const checkDynamicCollisions = useCallback(() => {
    const head = snakeRef.current[0];
    if (!head) return;
    
    if (invulnerabilityTimeRef.current > 0) {
        collisionCandidatesRef.current = {};
        return;
    }

    const now = gameTimeRef.current;
    const neck = snakeRef.current[1] || head;
    const traits = traitsRef.current; 

    const distToSegment = (p: Point, a: Point, b: Point) => {
        const l2 = (a.x - b.x)**2 + (a.y - b.y)**2;
        if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
    };

    const lethalHitThreshold = COLLISION_CONFIG.PLAYER_HEAD_RADIUS + COLLISION_CONFIG.ENEMY_RADIUS;
    const proximityThreshold = lethalHitThreshold + COLLISION_CONFIG.PROXIMITY_BUFFER;
    
    const currentLethalOverlaps = new Set<string>();

    for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0) continue;
        if (enemy.state !== 'ACTIVE') continue;
        
        const dist = distToSegment(enemy, head, neck);
        
        if (dist < proximityThreshold && dist >= lethalHitThreshold) {
             delete collisionCandidatesRef.current[enemy.id];
             
             if (Math.random() < 0.3) {
                 triggerShake(1, 1);
             }
             continue; 
        }

        if (dist < lethalHitThreshold) {
            currentLethalOverlaps.add(enemy.id);
            
            const currentFrames = (collisionCandidatesRef.current[enemy.id] || 0) + 1;
            collisionCandidatesRef.current[enemy.id] = currentFrames;

            if (currentFrames >= COLLISION_CONFIG.CONFIRMATION_FRAMES) {
                collisionCandidatesRef.current = {};

                if (traits.collisionDodgeChance > 0 && Math.random() < traits.collisionDodgeChance) {
                    invulnerabilityTimeRef.current = 500;
                    spawnFloatingText(head.x * DEFAULT_SETTINGS.gridSize, head.y * DEFAULT_SETTINGS.gridSize, "DODGE", '#00ffcc', 14);
                    return;
                }

                if (statsRef.current.weapon.ghostCoilLevel > 0 && now > ghostCoilCooldownRef.current) {
                    ghostCoilCooldownRef.current = now + 10000;
                    invulnerabilityTimeRef.current = 1500;
                    chromaticAberrationRef.current = 1.0; 
                    triggerShake(5, 5);
                    audioEventsRef.current.push({ type: 'POWER_UP' });
                    spawnFloatingText(head.x * DEFAULT_SETTINGS.gridSize, head.y * DEFAULT_SETTINGS.gridSize, "PHASE SHIFT", '#888888', 14);
                    return;
                }

                if (statsRef.current.shieldActive) {
                    statsRef.current.shieldActive = false;
                    setUiShield(false);
                    triggerShake(20, 20);
                    audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                    invulnerabilityTimeRef.current = 2000;
                    return;
                }

                setStatus(GameStatus.GAME_OVER);
                failureMessageRef.current = 'FATAL_EXCEPTION // ENEMY_CONTACT';
                audioEventsRef.current.push({ type: 'GAME_OVER' });
                triggerShake(40, 40);
                return;
            }
        }
    }

    for (const id in collisionCandidatesRef.current) {
        if (!currentLethalOverlaps.has(id)) {
            delete collisionCandidatesRef.current[id];
        }
    }

    if (snakeRef.current.length > 1 && tailIntegrityRef.current > 0) {
        for (const enemy of enemiesRef.current) {
            if (enemy.hp <= 0 || enemy.state !== 'ACTIVE') continue;
            
            let nearestSeg: Point | null = null;
            let minDist = Infinity;

            for (let i = 1; i < snakeRef.current.length; i++) {
                const seg = snakeRef.current[i];
                const dx = enemy.x - seg.x;
                const dy = enemy.y - seg.y;
                if (Math.abs(dx) < 1.0 && Math.abs(dy) < 1.0) {
                    const d = Math.hypot(dx, dy);
                    if (d < minDist) {
                        minDist = d;
                        nearestSeg = seg;
                    }
                }
            }

            if (nearestSeg && minDist < 0.8) {
                
                let integrityDmg = 20;
                let pushStrength = 0.5;
                let stunTime = 200;

                if (enemy.type === EnemyType.BOSS) {
                    integrityDmg = 100; 
                    pushStrength = 0; 
                    stunTime = 0;
                } else if (enemy.type === EnemyType.DASHER) {
                    integrityDmg = 50;
                    pushStrength = 1.0;
                    stunTime = 500;
                } else if (enemy.type === EnemyType.SHOOTER || enemy.type === EnemyType.INTERCEPTOR) {
                    integrityDmg = 30;
                }

                integrityDmg *= traits.tailIntegrityDamageMod;

                tailIntegrityRef.current = Math.max(0, tailIntegrityRef.current - integrityDmg);

                if (traits.reactiveLightningChance > 0 && Math.random() < traits.reactiveLightningChance) {
                    damageEnemy(enemy, 25, false, false);
                    triggerLightning({
                        id: Math.random().toString(),
                        x1: nearestSeg.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y1: nearestSeg.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        x2: enemy.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y2: enemy.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        life: 0.5,
                        color: COLORS.lightning
                    });
                }

                if (pushStrength > 0) {
                    const dx = enemy.x - nearestSeg.x;
                    const dy = enemy.y - nearestSeg.y;
                    const len = Math.hypot(dx, dy) || 1; 
                    const pushX = (dx / len) * pushStrength;
                    const pushY = (dy / len) * pushStrength;
                    
                    enemy.x += pushX;
                    enemy.y += pushY;
                    
                    if (enemy.type === EnemyType.DASHER && enemy.dashState === 'DASH') {
                        enemy.dashState = 'IDLE';
                        enemy.dashTimer = 0;
                    }
                }

                if (stunTime > 0) {
                    enemy.stunTimer = stunTime;
                }

                createParticles(enemy.x, enemy.y, '#ffffff', 4);
                
                if (tailIntegrityRef.current <= 0) {
                    triggerShake(10, 10);
                    spawnFloatingText(enemy.x * DEFAULT_SETTINGS.gridSize, enemy.y * DEFAULT_SETTINGS.gridSize, "BREACH", '#ff0000', 16);
                    audioEventsRef.current.push({ type: 'SHIELD_HIT' }); 
                } else {
                    audioEventsRef.current.push({ type: 'COMPRESS' }); 
                }
            }
        }
    }

    const projectileHitThreshold = COLLISION_CONFIG.PLAYER_HEAD_RADIUS + COLLISION_CONFIG.PROJECTILE_RADIUS;

    for (const p of projectilesRef.current) {
        if (p.owner === 'PLAYER') continue;
        const phx = p.x / DEFAULT_SETTINGS.gridSize - 0.5;
        const phy = p.y / DEFAULT_SETTINGS.gridSize - 0.5;
        const dist = distToSegment({ x: phx, y: phy }, head, neck);
        
        if (dist < projectileHitThreshold) {
             if (statsRef.current.weapon.reflectorMeshLevel > 0) {
                 const chance = 0.2 + (statsRef.current.weapon.reflectorMeshLevel * 0.1);
                 if (Math.random() < chance) {
                     p.owner = 'PLAYER';
                     p.vx *= -1;
                     p.vy *= -1;
                     p.color = COLORS.shield;
                     audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                     spawnFloatingText(p.x, p.y, "REFLECT", COLORS.shield, 10);
                     triggerShockwave({
                         id: Math.random().toString(),
                         x: p.x, y: p.y,
                         currentRadius: 5, maxRadius: 30,
                         damage: 0, opacity: 0.5
                     });
                     return;
                 }
             }

             if (statsRef.current.shieldActive) {
                statsRef.current.shieldActive = false;
                setUiShield(false);
                triggerShake(15, 15);
                audioEventsRef.current.push({ type: 'SHIELD_HIT' });
                p.shouldRemove = true;
                invulnerabilityTimeRef.current = 2000;
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
      spawnFloatingText, gameTimeRef, tailIntegrityRef, chromaticAberrationRef, 
      triggerShockwave, traitsRef, damageEnemy, triggerLightning
  ]);

  const handleEat = useCallback((head: Point): boolean => {
      const pickupRadius = 0.8;
      
      const fIndex = foodRef.current.findIndex(f => {
          const dist = Math.hypot(f.x - head.x, f.y - head.y);
          return dist < pickupRadius;
      });

      if (fIndex !== -1) {
          const item = foodRef.current[fIndex];
          foodRef.current.splice(fIndex, 1);

          onFoodConsumed({
              type: item.type,
              byMagnet: false,
              value: item.value
          });

          createParticles(item.x, item.y, item.type === FoodType.XP_ORB ? COLORS.xpOrb : COLORS.foodNormal, 6);

          return item.type === FoodType.NORMAL;
      }
      return false;
  }, [foodRef, onFoodConsumed, createParticles]);

  return {
    checkMoveCollisions,
    checkDynamicCollisions,
    handleEat,
    updateCollisionLogic,
  };
}
