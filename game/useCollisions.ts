
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { useCombat } from './useCombat';
import { useSpawner } from './useSpawner';
import { useFX } from './useFX';
import { useProgression } from './useProgression';
import { Point, GameStatus, FoodType, CameraMode } from '../types';
import { COLORS, DEFAULT_SETTINGS } from '../constants';
import { audio } from '../utils/audio';

// Helper: Point line distance squared
function distToSegmentSquared(p: Point, v: Point, w: Point) {
  const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
  if (l2 == 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - v.x - t * (w.x - v.x))**2 + (p.y - v.y - t * (w.y - v.y))**2;
}

export function useCollisions(
  game: ReturnType<typeof useGameState>,
  combat: ReturnType<typeof useCombat>,
  spawner: ReturnType<typeof useSpawner>,
  fx: ReturnType<typeof useFX>,
  progression: ReturnType<typeof useProgression>
) {
  const {
    snakeRef,
    wallsRef,
    enemiesRef,
    foodRef,
    terminalsRef,
    projectilesRef,
    hitboxesRef,
    status,
    setStatus,
    statsRef,
    tailIntegrityRef,
    invulnerabilityTimeRef,
    setUiShield,
    failureMessageRef,
    traitsRef,
    cameraRef,
    viewport,
    debugFlagsRef,
    stageReadyRef // Added
  } = game;

  const { spawnFloatingText, triggerShake, triggerShockwave, createParticles } = fx;
  const { damageEnemy } = combat;

  // 1. Helpers for Damage/Death
  const handleDeath = useCallback((reason: string) => {
      // GOD MODE CHECK
      if (debugFlagsRef.current.godMode) return;

      // Legacy godmode check (kept for compatibility if needed, but redundant)
      if (invulnerabilityTimeRef.current > 1000000) return;

      if (invulnerabilityTimeRef.current > 0) return;
      if (statsRef.current.shieldActive) {
          statsRef.current.shieldActive = false;
          setUiShield(false);
          invulnerabilityTimeRef.current = 2000;
          triggerShake(10, 10);
          audio.play('SHIELD_HIT');
          if (snakeRef.current[0]) {
              spawnFloatingText(snakeRef.current[0].x * DEFAULT_SETTINGS.gridSize, snakeRef.current[0].y * DEFAULT_SETTINGS.gridSize, "SHIELD BROKEN", '#00ffff', 20);
          }
          return;
      }
      
      failureMessageRef.current = reason;
      
      // Start Death Sequence
      setStatus(GameStatus.DYING);
      game.deathTimerRef.current = 2000; // 2 seconds animation
      
      audio.play('GAME_OVER'); // Play sound immediately
      triggerShake(30, 30); // Heavy shake
      
      // Explosion Effect
      const head = snakeRef.current[0];
      if (head) {
          // Shockwave
          triggerShockwave({
              id: 'death-wave',
              x: head.x * DEFAULT_SETTINGS.gridSize,
              y: head.y * DEFAULT_SETTINGS.gridSize,
              currentRadius: 0,
              maxRadius: 300,
              damage: 0,
              opacity: 1
          });
          // Debris
          createParticles(head.x, head.y, '#ff0000', 30);
      }
      
  }, [invulnerabilityTimeRef, statsRef, setUiShield, triggerShake, spawnFloatingText, failureMessageRef, setStatus, snakeRef, triggerShockwave, createParticles, debugFlagsRef]);

  const takeDamage = useCallback((amount: number, reason: string) => {
      // GOD MODE CHECK
      if (debugFlagsRef.current.godMode) return;

      if (invulnerabilityTimeRef.current > 1000000) return;

      if (invulnerabilityTimeRef.current > 0) return;
      
      if (statsRef.current.shieldActive) {
          statsRef.current.shieldActive = false;
          setUiShield(false);
          invulnerabilityTimeRef.current = 1500;
          triggerShake(5, 5);
          audio.play('SHIELD_HIT');
          return;
      }
      handleDeath(reason);
  }, [invulnerabilityTimeRef, statsRef, setUiShield, triggerShake, handleDeath, debugFlagsRef]);

  // 2. Static Collisions (Walls, Self)
  const checkMoveCollisions = useCallback((head: Point): boolean => {
    const isSideScroll = cameraRef.current.mode === CameraMode.SIDE_SCROLL;
    
    // EXIT PHASE: IGNORE COLLISIONS
    if (stageReadyRef.current) {
        return false;
    }

    // Walls
    if (head.x < 0 || head.x >= viewport.cols || head.y < 0 || head.y >= viewport.rows) {
        if (isSideScroll) return false;
        
        handleDeath('GRID_BOUNDARY_EXCEEDED');
        return true;
    }

    if (wallsRef.current.some(w => w.x === head.x && w.y === head.y)) {
        if (isSideScroll) return false;

        handleDeath('STRUCTURAL_IMPACT');
        return true;
    }

    // Self (Body)
    for (let i = 0; i < snakeRef.current.length; i++) {
        const seg = snakeRef.current[i];
        if (head.x === seg.x && head.y === seg.y) {
             if (i !== snakeRef.current.length - 1) {
                 handleDeath('SELF_INTERSECTION');
                 return true;
             }
        }
    }

    return false;
  }, [wallsRef, snakeRef, handleDeath, cameraRef, viewport, stageReadyRef]);

  // 3. Eat Logic
  const handleEat = useCallback((head: Point): boolean => {
    let grew = false;
    const foodIndex = foodRef.current.findIndex(f => 
        Math.abs(f.x - head.x) < 0.5 && Math.abs(f.y - head.y) < 0.5
    );

    if (foodIndex !== -1) {
        const item = foodRef.current[foodIndex];
        foodRef.current.splice(foodIndex, 1);
        
        progression.onFoodConsumed({ type: item.type, byMagnet: false, value: item.value });
        
        // XP Floating Text
        const gridSize = DEFAULT_SETTINGS.gridSize;
        const px = head.x * gridSize + gridSize / 2;
        const py = head.y * gridSize;

        if (item.type === FoodType.NORMAL) {
            grew = true;
            createParticles(head.x, head.y, COLORS.foodNormal, 6);
            const xp = 10 * statsRef.current.foodQualityMod;
            spawnFloatingText(px, py - 10, `+${Math.floor(xp)} XP`, '#ffff00', 12);
        } else {
            createParticles(head.x, head.y, COLORS.xpOrb, 4);
            const xp = item.value || 0;
            if (xp > 0) {
                 spawnFloatingText(px, py - 10, `+${xp} XP`, '#ffff00', 12);
            }
        }
    }
    return grew;
  }, [foodRef, progression, createParticles, spawnFloatingText, statsRef]);

  // 4. Dynamic Entities (Enemies, Projectiles)
  const checkDynamicCollisions = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    
    // EXIT PHASE: IGNORE DYNAMIC COLLISIONS TOO
    if (stageReadyRef.current) return;

    const head = snakeRef.current[0];
    if (!head) return;

    // A. Snake vs Enemies
    const snakeBody = snakeRef.current;
    
    enemiesRef.current.forEach(e => {
        if (e.state !== 'ACTIVE') return;
        if (e.shouldRemove) return; // FIX: Ignore dead enemies

        // Check against Head (Lethal)
        const distHead = Math.hypot(e.x - head.x, e.y - head.y);
        if (distHead < 0.8) {
            takeDamage(20, 'KINETIC_IMPACT');
            const ang = Math.atan2(e.y - head.y, e.x - head.x);
            e.x += Math.cos(ang) * 2;
            e.y += Math.sin(ang) * 2;
        }

        // SPACESHIP BOSS BEAM CHECK
        if (e.bossConfigId === 'SPACESHIP_BOSS' && e.bossState?.stateId === 'FIRE_CANNON') {
            const angle = e.angle || 0;
            const beamLength = 60; // Grid units (1200px)
            const beamWidth = 1.0; // Grid units
            
            // Beam Start (Offset from center roughly to nose)
            const startX = e.x + Math.cos(angle) * 3; 
            const startY = e.y + Math.sin(angle) * 3;
            const endX = startX + Math.cos(angle) * beamLength;
            const endY = startY + Math.sin(angle) * beamLength;
            
            // Distance from head to beam segment
            const distSq = distToSegmentSquared({x: head.x, y: head.y}, {x: startX, y: startY}, {x: endX, y: endY});
            
            if (distSq < (beamWidth/2)**2) {
                takeDamage(40, 'PARTICLE_BEAM');
            }
        }

        if (traitsRef.current.collisionDodgeChance > 0 && Math.random() < traitsRef.current.collisionDodgeChance) {
             return; 
        }

        // Check against Body (Tail is invulnerable - only knockback enemies)
        for (let i = 1; i < snakeBody.length; i++) {
             const seg = snakeBody[i];
             const d = Math.hypot(e.x - seg.x, e.y - seg.y);
             if (d < 0.8) {
                 // Reactive lightning still triggers on contact
                 if (traitsRef.current.reactiveLightningChance > 0 && Math.random() < traitsRef.current.reactiveLightningChance) {
                     damageEnemy(e, 20);
                     fx.triggerLightning({
                         id: Math.random().toString(),
                         x1: seg.x * DEFAULT_SETTINGS.gridSize + 10,
                         y1: seg.y * DEFAULT_SETTINGS.gridSize + 10,
                         x2: e.x * DEFAULT_SETTINGS.gridSize + 10,
                         y2: e.y * DEFAULT_SETTINGS.gridSize + 10,
                         life: 0.5,
                         color: '#ffff00'
                     });
                 }

                 // Knockback enemy away from tail segment (no damage to tail)
                 const ang = Math.atan2(e.y - seg.y, e.x - seg.x);
                 e.x += Math.cos(ang) * 0.5;
                 e.y += Math.sin(ang) * 0.5;
                 break;
             }
        }
    });

    // B. Snake vs Projectiles
    projectilesRef.current.forEach(p => {
        if (p.shouldRemove) return;
        if (p.owner !== 'ENEMY') return; 

        // Convert projectile pixel pos to grid pos (float)
        // Projectiles are spawned at center of tile (e.g. x.5)
        const pGridX = p.x / DEFAULT_SETTINGS.gridSize;
        const pGridY = p.y / DEFAULT_SETTINGS.gridSize;
        
        // Snake head is at integer grid coordinates (top-left of cell)
        // Center of snake head is head.x + 0.5, head.y + 0.5
        const hCenterX = head.x + 0.5;
        const hCenterY = head.y + 0.5;

        const dist = Math.hypot(pGridX - hCenterX, pGridY - hCenterY);
        
        if (dist < 0.8) { // Overlap threshold
            takeDamage(p.damage, 'PROJECTILE_PENETRATION');
            p.shouldRemove = true;
            createParticles(head.x, head.y, '#ff0000', 5);
        }
    });

    // C. Snake vs Boss Hitboxes (Zones)
    // Hitboxes are simple AABBs defined in grid coordinates
    hitboxesRef.current.forEach(h => {
        const hCenterX = h.x; 
        const hCenterY = h.y;
        // Half-extents
        const hw = h.width / 2;
        const hh = h.height / 2;
        
        const snakeCenterX = head.x + 0.5;
        const snakeCenterY = head.y + 0.5;
        
        // Simple AABB vs Point check (Snake head center)
        if (
            Math.abs(snakeCenterX - hCenterX) < hw + 0.3 && // 0.3 buffer for snake size
            Math.abs(snakeCenterY - hCenterY) < hh + 0.3
        ) {
             takeDamage(h.damage, 'HIGH_ENERGY_IMPACT');
        }
    });

  }, [status, snakeRef, enemiesRef, projectilesRef, hitboxesRef, traitsRef, tailIntegrityRef, fx, damageEnemy, takeDamage, createParticles, stageReadyRef]);

  // 5. Terminals & Timers
  const updateCollisionLogic = useCallback((dt: number) => {
      // DECREMENT INVULNERABILITY
      if (invulnerabilityTimeRef.current > 0 && invulnerabilityTimeRef.current < 1000000) {
          invulnerabilityTimeRef.current = Math.max(0, invulnerabilityTimeRef.current - dt);
      }

      const head = snakeRef.current[0];
      if (!head) return;

      terminalsRef.current.forEach(t => {
          if (t.isLocked) return;

          const dist = Math.hypot(t.x - head.x, t.y - head.y);
          const activeRadius = t.radius;

          if (dist < activeRadius) {
              // Track when hacking started for sound effect
              if (!t.isBeingHacked) {
                  t.lastEffectTime = Date.now();
              }
              t.isBeingHacked = true;
              t.progress += dt;
              
              if (t.progress >= t.totalTime && !t.justCompleted) {
                  t.justCompleted = true;
                  t.shouldRemove = true;
                  
                  // NEW: Pass the associatedFileId for MEMORY terminals
                  // Capture returned XP for visual feedback
                  const xp = progression.onTerminalHacked(t.type, t.associatedFileId);
                  
                  const tx = t.x * DEFAULT_SETTINGS.gridSize;
                  const ty = t.y * DEFAULT_SETTINGS.gridSize;
                  
                  // Specific feedback for Memory
                  if (t.type === 'MEMORY') {
                      spawnFloatingText(tx, ty, 'MEMORY DECRYPTED', t.color, 24);
                  } else {
                      spawnFloatingText(tx, ty, 'SYSTEM BREACH', t.color, 20);
                  }
                  
                  // XP Feedback
                  if (xp > 0) {
                      spawnFloatingText(tx, ty - 25, `+${xp} XP`, '#ffff00', 16);
                  }
                  
                  triggerShake(15, 15);
                  triggerShockwave({
                      id: Math.random().toString(),
                      x: tx + 10,
                      y: ty + 10,
                      currentRadius: 10,
                      maxRadius: 200,
                      damage: 50, 
                      opacity: 0.6
                  });
                  // Mitigated audio call with context data
                  audio.play('HACK_COMPLETE', { terminalType: t.type });
              }
          } else {
              t.isBeingHacked = false;
              if (t.progress > 0) {
                  t.progress = Math.max(0, t.progress - dt * 2);
                  if (t.progress === 0 && t.lastEffectTime) {
                      audio.play('HACK_LOST');
                  }
              }
          }
      });
      terminalsRef.current = terminalsRef.current.filter(t => !t.shouldRemove);

  }, [snakeRef, terminalsRef, progression, spawnFloatingText, triggerShockwave, triggerShake, invulnerabilityTimeRef]);

  // 6. XP Collection (Vacuum)
  const checkXPCollection = useCallback(() => {
      const head = snakeRef.current[0];
      if (!head) return;

      const collectRadius = 1.5; // Trigger range for collection
      
      // Iterate backwards to allow safe removal
      for (let i = foodRef.current.length - 1; i >= 0; i--) {
          const f = foodRef.current[i];
          if (f.type !== FoodType.XP_ORB) continue;

          const dist = Math.hypot(f.x - head.x, f.y - head.y);
          
          if (dist < collectRadius) {
              foodRef.current.splice(i, 1);
              progression.onFoodConsumed({ type: f.type, byMagnet: false, value: f.value });
              createParticles(f.x, f.y, COLORS.xpOrb, 4);
              audio.play('XP_COLLECT');
              
              // XP POPUP
              const gridSize = DEFAULT_SETTINGS.gridSize;
              const px = f.x * gridSize + gridSize/2;
              const py = f.y * gridSize + gridSize/2;
              const xp = f.value || 0;
              if (xp > 0) {
                   spawnFloatingText(px, py, `+${xp} XP`, '#ffff00', 10);
              }
          }
      }
  }, [snakeRef, foodRef, progression, createParticles, spawnFloatingText]);

  return {
    checkMoveCollisions,
    handleEat,
    checkDynamicCollisions,
    updateCollisionLogic,
    checkXPCollection,
    handleDeath // Exported for Hazard System
  };
}
