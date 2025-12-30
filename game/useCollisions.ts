
import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { useCombat } from './useCombat';
import { useSpawner } from './useSpawner';
import { useFX } from './useFX';
import { useProgression } from './useProgression';
import { Point, GameStatus, FoodType, CameraMode, EnemyType } from '../types';
import { GRID_COLS, GRID_ROWS, COLORS, DEFAULT_SETTINGS } from '../constants';
import { audio } from '../utils/audio';
import { ROOT_FILESYSTEM } from '../archive/data';

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
    status,
    setStatus,
    statsRef,
    tailIntegrityRef,
    invulnerabilityTimeRef,
    setUiShield,
    failureMessageRef,
    traitsRef,
    devModeFlagsRef,
    cameraRef,
    hitboxesRef, // Added for Boss Hitboxes
    scoreRef, // Used if needed
    stageStatsRef // NEW: Mastery tracking
  } = game;

  const { spawnFloatingText, triggerShake, triggerShockwave, createParticles, triggerCLISequence } = fx;
  const { damageEnemy } = combat;

  // 1. Helpers for Damage/Death
  const handleDeath = useCallback((reason: string) => {
      // GOD MODE CHECK
      if (devModeFlagsRef.current.godMode) return;

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
      setStatus(GameStatus.GAME_OVER);
      // audio.play('GAME_OVER'); // Removed to maintain music continuity
      triggerShake(20, 20);
  }, [invulnerabilityTimeRef, statsRef, setUiShield, triggerShake, spawnFloatingText, failureMessageRef, setStatus, snakeRef, devModeFlagsRef]);

  const takeDamage = useCallback((amount: number, reason: string) => {
      // GOD MODE CHECK
      if (devModeFlagsRef.current.godMode) return;

      if (invulnerabilityTimeRef.current > 0) return;
      
      // Apply Damage Reduction (Intrinsic)
      const resist = traitsRef.current.damageResistBonus;
      const finalAmount = Math.max(0, amount * (1 - resist));
      
      // Track damage for Mastery (Original raw or final? Usually raw to encourage perfect play, but final reflects mitigation investment)
      // Let's track final damage taken for fair assessment of "Tank" builds.
      stageStatsRef.current.damageTaken += finalAmount;

      if (statsRef.current.shieldActive) {
          statsRef.current.shieldActive = false;
          setUiShield(false);
          invulnerabilityTimeRef.current = 1500;
          triggerShake(5, 5);
          audio.play('SHIELD_HIT');
          return;
      }
      handleDeath(reason);
  }, [invulnerabilityTimeRef, statsRef, setUiShield, triggerShake, handleDeath, devModeFlagsRef, stageStatsRef, traitsRef]);

  // 2. Static Collisions (Walls, Self)
  const checkMoveCollisions = useCallback((head: Point): boolean => {
    const isFreeRoam = devModeFlagsRef.current.freeMovement;
    const isSideScroll = cameraRef.current.mode === CameraMode.SIDE_SCROLL;
    const isGod = devModeFlagsRef.current.godMode;

    // Walls
    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
        if (isFreeRoam || isSideScroll || isGod) return false;
        handleDeath('GRID_BOUNDARY_EXCEEDED');
        return true;
    }

    if (wallsRef.current.some(w => w.x === head.x && w.y === head.y)) {
        if (isFreeRoam || isSideScroll || isGod) return false;
        handleDeath('STRUCTURAL_IMPACT');
        return true;
    }

    // Barrier Check (Solid Object)
    for (const enemy of enemiesRef.current) {
        if (enemy.type === EnemyType.BARRIER && enemy.state === 'ACTIVE') {
            if (Math.round(enemy.x) === head.x && Math.abs(head.y - enemy.y) < 10) { // Vertical wall approximation
                // Player dies if hitting the barrier
                if (!isGod) {
                    handleDeath('CONTAINMENT_FIELD_IMPACT');
                    return true;
                }
            }
        }
    }

    // Self (Body)
    if (isFreeRoam || isGod) return false;

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
  }, [wallsRef, snakeRef, handleDeath, devModeFlagsRef, cameraRef, enemiesRef]);

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

        if (item.type === FoodType.NORMAL) {
            grew = true;
            createParticles(head.x, head.y, COLORS.foodNormal, 6);
        } else {
            createParticles(head.x, head.y, COLORS.xpOrb, 4);
        }
    }
    return grew;
  }, [foodRef, progression, createParticles]);

  // 4. Dynamic Entities (Enemies, Projectiles)
  const checkDynamicCollisions = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    
    const head = snakeRef.current[0];
    if (!head) return;

    // A. Snake vs Enemies
    const snakeBody = snakeRef.current;
    
    enemiesRef.current.forEach(e => {
        // Skip Barrier collision here (handled in move)
        if (e.type === EnemyType.BARRIER) return;
        
        if (e.state !== 'ACTIVE') return;

        // Check against Head (Lethal)
        const distHead = Math.hypot(e.x - head.x, e.y - head.y);
        if (distHead < 0.8) {
            takeDamage(20, 'KINETIC_IMPACT');
            const ang = Math.atan2(e.y - head.y, e.x - head.x);
            e.x += Math.cos(ang) * 2;
            e.y += Math.sin(ang) * 2;
        }

        if (traitsRef.current.collisionDodgeChance > 0 && Math.random() < traitsRef.current.collisionDodgeChance) {
             return; 
        }

        // Check against Body
        for (let i = 1; i < snakeBody.length; i++) {
             const seg = snakeBody[i];
             const d = Math.hypot(e.x - seg.x, e.y - seg.y);
             if (d < 0.8) {
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
                 
                 // Apply Bulwark mitigation (50%) AND generic Damage Resist
                 const baseDmg = 5;
                 const resist = traitsRef.current.damageResistBonus;
                 const mitigated = baseDmg * traitsRef.current.tailIntegrityDamageMod * (1 - resist);

                 stageStatsRef.current.damageTaken += mitigated; // Track damage
                 
                 if (!devModeFlagsRef.current.godMode) {
                     tailIntegrityRef.current = Math.max(0, tailIntegrityRef.current - mitigated);
                 }
                 
                 const ang = Math.atan2(e.y - seg.y, e.x - seg.x);
                 e.x += Math.cos(ang) * 0.5;
                 e.y += Math.sin(ang) * 0.5;
                 
                 if (tailIntegrityRef.current <= 0 && !devModeFlagsRef.current.godMode) {
                     handleDeath('HULL_BREACH');
                 }
                 break; 
             }
        }
    });

    // B. Projectile Collisions
    projectilesRef.current.forEach(p => {
        if (p.shouldRemove) return;
        
        // 1. Enemy Projectiles vs Snake
        if (p.owner === 'ENEMY') {
            const pGridX = p.x / DEFAULT_SETTINGS.gridSize;
            const pGridY = p.y / DEFAULT_SETTINGS.gridSize;
            const hCenterX = head.x + 0.5;
            const hCenterY = head.y + 0.5;
            const dist = Math.hypot(pGridX - hCenterX, pGridY - hCenterY);
            
            if (dist < 0.8) { 
                takeDamage(p.damage, 'PROJECTILE_PENETRATION');
                p.shouldRemove = true;
                createParticles(head.x, head.y, '#ff0000', 5);
            }
        }
        
        // 2. Player Projectiles vs Barrier (Immunity Check)
        if (p.owner === 'PLAYER') {
            for (const e of enemiesRef.current) {
                 if (e.type === EnemyType.BARRIER) {
                     const ex = e.x * DEFAULT_SETTINGS.gridSize;
                     const ey = e.y * DEFAULT_SETTINGS.gridSize;
                     
                     // Simple Box check for Barrier
                     // Barrier is tall (30 tiles) and thin (1 tile)
                     if (Math.abs(p.x - ex) < 20 && Math.abs(p.y - ey) < 400) {
                         // Player projectiles do NOT damage barrier
                         p.shouldRemove = true;
                         createParticles(e.x, e.y, '#00ffff', 2);
                         spawnFloatingText(p.x, p.y, "IMMUNE", '#00ffff', 10);
                         return; // Stop processing this projectile
                     }
                 }
            }
        }
    });

    // C. Boss Hitboxes (e.g. Breach Beam) vs Barrier
    hitboxesRef.current.forEach(hb => {
        // Convert Grid Units to Pixel Box
        const hbX = hb.x * DEFAULT_SETTINGS.gridSize;
        const hbY = hb.y * DEFAULT_SETTINGS.gridSize;
        const hbW = hb.width * DEFAULT_SETTINGS.gridSize;
        const hbH = hb.height * DEFAULT_SETTINGS.gridSize;
        
        // Check vs Barrier
        for (const e of enemiesRef.current) {
            if (e.type === EnemyType.BARRIER && e.state === 'ACTIVE') {
                 const ex = e.x * DEFAULT_SETTINGS.gridSize;
                 const ey = e.y * DEFAULT_SETTINGS.gridSize;
                 // Barrier Box (Approx)
                 const bW = DEFAULT_SETTINGS.gridSize;
                 const bH = 30 * DEFAULT_SETTINGS.gridSize;
                 
                 // AABB
                 const overlap = 
                    hbX < ex + bW/2 &&
                    hbX + hbW > ex - bW/2 &&
                    hbY < ey + bH/2 &&
                    hbY + hbH > ey - bH/2;
                 
                 if (overlap) {
                     // Damage Barrier
                     damageEnemy(e, hb.damage, true);
                     if (e.hp <= 0) {
                         e.shouldRemove = true;
                         // The stage controller will detect this removal
                     }
                 }
            }
        }
    });

  }, [status, snakeRef, enemiesRef, projectilesRef, traitsRef, tailIntegrityRef, fx, damageEnemy, takeDamage, createParticles, devModeFlagsRef, hitboxesRef, stageStatsRef]);

  // 5. Terminals
  const updateCollisionLogic = useCallback((dt: number) => {
      const head = snakeRef.current[0];
      if (!head) return;

      terminalsRef.current.forEach(t => {
          if (t.isLocked) return;

          const dist = Math.hypot(t.x - head.x, t.y - head.y);
          const activeRadius = t.radius;

          if (dist < activeRadius) {
              t.isBeingHacked = true;
              
              const efficiency = traitsRef.current.terminalEfficiency;
              const rateMultiplier = 1 / (1 - efficiency); 
              
              t.progress += dt * rateMultiplier;
              
              if (t.progress >= t.totalTime && !t.justCompleted) {
                  t.justCompleted = true;
                  t.shouldRemove = true;
                  
                  progression.onTerminalHacked(t.type, t.associatedFileId);
                  
                  const tx = t.x * DEFAULT_SETTINGS.gridSize;
                  const ty = t.y * DEFAULT_SETTINGS.gridSize;
                  
                  // Trigger New CLI Animation with payload
                  let payload: any = {};
                  if (t.type === 'RESOURCE') {
                      const baseScore = 1000 * statsRef.current.scoreMultiplier;
                      payload = { value: `${Math.floor(baseScore)} CR` }; // Assuming Score = Credits for flavor
                  } else if (t.type === 'MEMORY') {
                      const file = ROOT_FILESYSTEM.contents.find(f => f.id === t.associatedFileId);
                      payload = { id: t.associatedFileId, title: file?.name || 'UNKNOWN' };
                  }
                  
                  triggerCLISequence(t.x, t.y, t.type, t.color, payload);
                  
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

  }, [snakeRef, terminalsRef, progression, triggerCLISequence, triggerShockwave, triggerShake, traitsRef, statsRef]);

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
          }
      }
  }, [snakeRef, foodRef, progression, createParticles]);

  return {
    checkMoveCollisions,
    handleEat,
    checkDynamicCollisions,
    updateCollisionLogic,
    checkXPCollection,
    handleDeath // Exported for Hazard System
  };
}
