
import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useFX } from './useFX';
import { ProgressionAPI } from './useProgression';
import { Enemy, EnemyType, Projectile, Difficulty, Direction, CameraMode } from '../types';
import {
  DEFAULT_SETTINGS,
  COLORS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SHOCKWAVE_SPEED,
  GRID_COLS,
  GRID_ROWS,
  PROJECTILE_SPEED
} from '../constants';

function findNearestEnemy(enemies: readonly Enemy[], from: { x: number; y: number }, maxRange: number): Enemy | null {
  let nearest: Enemy | null = null;
  let minDistSq = maxRange * maxRange;

  for (const e of enemies) {
    if (e.shouldRemove) continue; // Skip dead enemies

    const dSq = Math.pow(e.x - from.x, 2) + Math.pow(e.y - from.y, 2);
    if (dSq <= minDistSq) {
      minDistSq = dSq;
      nearest = e;
    }
  }

  return nearest;
}

export function useCombat(
  game: ReturnType<typeof useGameState>,
  spawner: ReturnType<typeof useSpawner>,
  fx: ReturnType<typeof useFX>,
  progression: ProgressionAPI
) {
  const {
    enemiesRef,
    statsRef,
    snakeRef,
    foodRef,
    gameTimeRef,
    powerUpsRef,
    projectilesRef,
    shockwavesRef,
    minesRef,
    lightningArcsRef,
    weaponFireTimerRef,
    auraTickTimerRef,
    mineDropTimerRef,
    audioEventsRef,
    bossDefeatedRef,
    enemiesKilledRef,
    prismLanceTimerRef,
    neonScatterTimerRef,
    voltSerpentTimerRef,
    phaseRailChargeRef,
    echoDamageStoredRef,
    overclockActiveRef,
    overclockTimerRef,
    nanoSwarmAngleRef,
    difficulty,
    terminalsRef,
    traitsRef,
    directionRef,
    setBossActive,
    bossActiveRef,
    levelRef, // Needed for scaling calculations
    uiCombo,  // Needed for Overdrive scaling
    cameraRef
  } = game;

  const { spawnFloatingText, createParticles, triggerShake, triggerShockwave, triggerLightning } = fx;
  const shootAudioThrottleRef = useRef(0);
  const gameTime = gameTimeRef.current;

  /* ─────────────────────────────
     Internal Combat Logic
     ───────────────────────────── */

  const applyDamage = useCallback((enemy: Enemy, amount: number) => {
    enemy.hp -= amount;

    // VISUAL SEPARATION: Update visual map instead of entity directly
    let vis = game.enemyVisualsRef.current.get(enemy.id);
    if (!vis) {
      vis = { flash: 0, x: enemy.x, y: enemy.y };
      game.enemyVisualsRef.current.set(enemy.id, vis);
    }
    vis.flash = 5;
  }, [game.enemyVisualsRef]);

  const processDeath = useCallback((enemy: Enemy) => {
    enemy.shouldRemove = true; // MARK FOR REMOVAL
    enemiesKilledRef.current += 1;

    // Spawn XP Orbs (Reward)
    spawner.spawnXpOrbs(enemy.x, enemy.y, 40);

    // Grant Score (Event), but XP is handled by orbs
    progression.onEnemyDefeated({ xp: 0 });

    // Neural Magnet Logic
    if (statsRef.current.weapon.neuralMagnetLevel > 0) {
      const pullRadius = 10 + (statsRef.current.weapon.neuralMagnetLevel * 5);
      const snakeHead = snakeRef.current[0];

      foodRef.current.forEach(f => {
        const dist = Math.hypot(f.x - enemy.x, f.y - enemy.y);
        if (dist < pullRadius && snakeHead) {
          // Teleport food close to player for pickup
          const angle = Math.random() * Math.PI * 2;
          const r = 2; // Close range
          f.x = snakeHead.x + Math.cos(angle) * r;
          f.y = snakeHead.y + Math.sin(angle) * r;
        }
      });
    }

    if (enemy.type === EnemyType.BOSS) {
      bossDefeatedRef.current = true;
      setBossActive(false);
      bossActiveRef.current = false;
      triggerShake(20, 20);
      audioEventsRef.current.push({ type: 'EMP' });
    } else {
      audioEventsRef.current.push({ type: 'ENEMY_DESTROY' });
    }
  }, [enemiesKilledRef, spawner, progression, statsRef, snakeRef, foodRef, bossDefeatedRef, triggerShake, audioEventsRef, setBossActive, bossActiveRef]);

  /* ─────────────────────────────
     Orchestrator: Damage Enemy
     ───────────────────────────── */

  const damageEnemy = useCallback((enemy: Enemy, baseDamage: number, forceCrit = false, allowChain = true) => {
    if (enemy.shouldRemove) return; // Don't damage dead enemies

    const stats = statsRef.current;
    const traits = traitsRef.current;
    const level = levelRef.current;

    // MAJOR TRAIT: OVERDRIVE (Damage per Combo)
    const comboMod = traits.damagePerCombo > 0 ? (1 + (uiCombo * traits.damagePerCombo)) : 1.0;

    let damage = baseDamage * stats.globalDamageMod * comboMod;
    let isCrit = forceCrit;

    // MAJOR TRAIT: VOLT (Crit Chance per Level)
    const scalingCrit = (traits.critChancePerLevel || 0) * (level - 1);
    const totalCritChance = stats.critChance + scalingCrit;

    // Check for critical hit
    if (!forceCrit && Math.random() < totalCritChance) {
      damage *= stats.critMultiplier;
      isCrit = true;
    }

    // Apply Damage
    applyDamage(enemy, damage);

    // Echo Cache Logic
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
            maxRadius: (150 + (stats.weapon.echoCacheLevel * 25)) * stats.globalAreaMod,
            damage: cap * 0.5, // Base damage for shockwave, will be scaled by damageEnemy recursion
            opacity: 0.8
          });
          audioEventsRef.current.push({ type: 'EMP' });
          spawnFloatingText(
            head.x * DEFAULT_SETTINGS.gridSize,
            head.y * DEFAULT_SETTINGS.gridSize,
            "ECHO BURST",
            '#ffaa00',
            16
          );
        }
      }
    }

    // Floating Text for damage
    const ex = enemy.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
    const ey = enemy.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

    spawnFloatingText(
      ex,
      ey,
      Math.floor(damage).toString(),
      isCrit ? COLORS.critText : COLORS.damageText,
      isCrit ? 24 : 12
    );

    // Chain Lightning Effect
    if (allowChain && stats.weapon.chainLightningLevel > 0) {
      let nearest: Enemy | null = null;
      let minDistSq = Infinity;
      const rangeSq = (stats.weapon.chainLightningRange * stats.globalAreaMod) ** 2;

      for (const other of enemiesRef.current) {
        if (other === enemy || other.shouldRemove) continue;
        const d2 = (other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2;
        if (d2 < rangeSq && d2 < minDistSq) {
          minDistSq = d2;
          nearest = other;
        }
      }

      if (nearest) {
        const rawChained = (damage * stats.weapon.chainLightningDamage) / (stats.globalDamageMod * comboMod);

        damageEnemy(
          nearest,
          rawChained,
          false,
          false
        );

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

    // Hit Sound (Only if enemy is still alive)
    if (enemy.hp > 0) {
      audioEventsRef.current.push({ type: 'HIT' });
    }

    // Death Check
    if (enemy.hp <= 0) {
      processDeath(enemy);
    }
  }, [statsRef, traitsRef, levelRef, uiCombo, enemiesRef, snakeRef, spawnFloatingText, triggerLightning, triggerShockwave, audioEventsRef, echoDamageStoredRef, applyDamage, processDeath]);

  /* ─────────────────────────────
     Main Combat Loop
     ───────────────────────────── */
  const update = useCallback((dt: number) => {
    const head = snakeRef.current[0];
    if (!head) return;

    // Time normalization (Standardizing to 60fps frame units)
    const frame = dt / 16.667;

    // Overclock Logic
    const stats = statsRef.current;
    const wStats = stats.weapon;
    const traits = traitsRef.current;
    const level = levelRef.current;

    // Physics Mode Check
    const isSideScroll = cameraRef.current.mode === CameraMode.SIDE_SCROLL;

    // MAJOR TRAIT SCALING
    const scalingFireRateMod = 1 + ((traits.fireRatePerLevel || 0) * (level - 1));
    // Striker: fireRatePerLevel is +1% -> 0.01
    // Total FR Mod = Global * Scaling
    const totalFireRateMod = stats.globalFireRateMod * scalingFireRateMod;

    const scalingAreaMod = traits.areaOfEffectMod; // Static Minor for Volt
    const totalAreaMod = stats.globalAreaMod * scalingAreaMod;

    // Update Overclock
    if (wStats.overclockLevel > 0) {
      overclockTimerRef.current += dt;

      if (overclockActiveRef.current) {
        const duration = 3000 + (wStats.overclockLevel * 500);
        if (overclockTimerRef.current > duration) {
          overclockActiveRef.current = false;
          overclockTimerRef.current = 0;
        }
      } else {
        const cooldown = Math.max(5000, 15000 - (wStats.overclockLevel * 1000));
        if (overclockTimerRef.current > cooldown) {
          overclockActiveRef.current = true;
          overclockTimerRef.current = 0;
          audioEventsRef.current.push({ type: 'POWER_UP' });
          spawnFloatingText(
            head.x * DEFAULT_SETTINGS.gridSize,
            head.y * DEFAULT_SETTINGS.gridSize - 20,
            "OVERCLOCK ENGAGED",
            '#ff0044',
            16
          );
        }
      }
    }

    // ─────────────────────────────────────────────
    // WEAPON SYSTEMS (Firing Logic)
    // ─────────────────────────────────────────────

    // 1. AUTO CANNON
    if (wStats.cannonLevel > 0) {
      weaponFireTimerRef.current += dt;
      let fireRate = wStats.cannonFireRate / totalFireRateMod;
      if (overclockActiveRef.current) fireRate *= 0.5;

      if (weaponFireTimerRef.current >= fireRate) {
        if (enemiesRef.current.length > 0) {
          // Range check: 14 grid units (approx half screen width)
          const range = 14 * totalAreaMod;
          const nearest = findNearestEnemy(enemiesRef.current, head, range);

          if (nearest) {
            const dx = nearest.x - head.x;
            const dy = nearest.y - head.y;
            const angle = Math.atan2(dy, dx);
            const count = wStats.cannonProjectileCount;
            const spread = 0.15;

            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * spread;
              const finalAngle = angle + offset;
              // Striker Trait: projectileSpeedMod (Minor)
              const speedMod = stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
              const vx = Math.cos(finalAngle) * wStats.cannonProjectileSpeed * speedMod;
              const vy = Math.sin(finalAngle) * wStats.cannonProjectileSpeed * speedMod;

              projectilesRef.current.push({
                id: Math.random().toString(36),
                x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
                vx: vx * (DEFAULT_SETTINGS.gridSize / 20),
                vy: vy * (DEFAULT_SETTINGS.gridSize / 20),
                damage: wStats.cannonDamage, // Pass BASE damage
                color: COLORS.projectile,
                size: (3 + Math.min(wStats.cannonLevel, 4)) * totalAreaMod,
                type: 'STANDARD',
                owner: 'PLAYER',
                usesGravity: isSideScroll
              });
            }

            if (gameTime - shootAudioThrottleRef.current > 100) {
              audioEventsRef.current.push({ type: 'SHOOT' });
              shootAudioThrottleRef.current = gameTime;
            }

            weaponFireTimerRef.current = 0;
          } else {
            // Keep timer ready if no target in range
            weaponFireTimerRef.current = fireRate;
          }
        }
      }
    }

    // 2. PRISM LANCE (ENHANCED)
    if (wStats.prismLanceLevel > 0) {
      prismLanceTimerRef.current += dt;
      let fireRate = 2000 / totalFireRateMod;
      if (overclockActiveRef.current) fireRate *= 0.5;

      if (prismLanceTimerRef.current >= fireRate) {
        const range = 22 * totalAreaMod;
        let nearest: Enemy | null = findNearestEnemy(enemiesRef.current, head, range);

        if (nearest) {
          const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);

          // SPEED CAP: Prevent physics tunneling
          let rawSpeed = 30 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
          rawSpeed = Math.min(rawSpeed, 45); // Hard cap

          const vx = Math.cos(angle) * rawSpeed;
          const vy = Math.sin(angle) * rawSpeed;

          projectilesRef.current.push({
            id: Math.random().toString(36),
            x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            vx: vx * (DEFAULT_SETTINGS.gridSize / 20),
            vy: vy * (DEFAULT_SETTINGS.gridSize / 20),
            damage: wStats.prismLanceDamage,
            color: COLORS.prismLance,
            size: 4 * totalAreaMod,
            type: 'LANCE',
            piercing: true,
            hitIds: [],
            owner: 'PLAYER',
            age: 0,
            usesGravity: false // Lance is a beam
          });

          audioEventsRef.current.push({ type: 'SHOOT' });
          prismLanceTimerRef.current = 0;
        } else {
          prismLanceTimerRef.current = fireRate;
        }
      }
    }

    // 3. NEON SCATTER
    if (wStats.neonScatterLevel > 0) {
      neonScatterTimerRef.current += dt;
      let fireRate = 1200 / totalFireRateMod;
      if (overclockActiveRef.current) fireRate *= 0.5;

      if (neonScatterTimerRef.current >= fireRate) {
        const range = 9 * totalAreaMod;
        let nearest: Enemy | null = findNearestEnemy(enemiesRef.current, head, range);

        if (nearest) {
          const target = nearest;
          const baseAngle = Math.atan2(target.y - head.y, target.x - head.x);
          const shards = 3 + wStats.neonScatterLevel;
          const spread = 0.5;

          for (let i = 0; i < shards; i++) {
            const a = baseAngle - (spread / 2) + (Math.random() * spread);
            const speed = (15 + Math.random() * 5) * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;

            projectilesRef.current.push({
              id: Math.random().toString(36),
              x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
              y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
              vx: Math.cos(a) * speed * (DEFAULT_SETTINGS.gridSize / 20),
              vy: Math.sin(a) * speed * (DEFAULT_SETTINGS.gridSize / 20),
              damage: wStats.neonScatterDamage,
              color: COLORS.neonScatter,
              size: 3 * totalAreaMod,
              type: 'SHARD',
              life: 25,
              owner: 'PLAYER',
              usesGravity: isSideScroll
            });
          }
          audioEventsRef.current.push({ type: 'SHOOT' });
          neonScatterTimerRef.current = 0;
        } else {
          neonScatterTimerRef.current = fireRate;
        }
      }
    }

    // 4. VOLT SERPENT
    if (wStats.voltSerpentLevel > 0) {
      voltSerpentTimerRef.current += dt;
      const fireRate = 3000 / totalFireRateMod;

      if (voltSerpentTimerRef.current >= fireRate) {
        const range = 18 * totalAreaMod;
        let nearestEnemy: Enemy | null = findNearestEnemy(enemiesRef.current, head, range);

        if (nearestEnemy) {
          const dx = nearestEnemy.x * DEFAULT_SETTINGS.gridSize - (head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2);
          const dy = nearestEnemy.y * DEFAULT_SETTINGS.gridSize - (head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2);
          const angle = Math.atan2(dy, dx);

          const homingSpeed = 10 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
          const vx = Math.cos(angle) * homingSpeed;
          const vy = Math.sin(angle) * homingSpeed;

          projectilesRef.current.push({
            id: Math.random().toString(36),
            x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            vx: vx,
            vy: vy,
            damage: wStats.voltSerpentDamage,
            color: COLORS.voltSerpent,
            size: 5 * totalAreaMod,
            type: 'SERPENT',
            homing: true,
            owner: 'PLAYER',
            usesGravity: false // Serpent flies
          });
          voltSerpentTimerRef.current = 0;
        } else {
          voltSerpentTimerRef.current = fireRate;
        }
      }
    }

    // 5. PHASE RAIL
    if (wStats.phaseRailLevel > 0) {
      phaseRailChargeRef.current += dt;
      const chargeTime = 4000 / totalFireRateMod;

      if (phaseRailChargeRef.current >= chargeTime) {
        const range = 25 * totalAreaMod;
        const nearest: Enemy | null = findNearestEnemy(enemiesRef.current, head, range);

        if (nearest) {
          const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
          const speed = 60 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;

          projectilesRef.current.push({
            id: Math.random().toString(36),
            x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            vx: Math.cos(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
            vy: Math.sin(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
            damage: wStats.phaseRailDamage,
            color: COLORS.phaseRail,
            size: 6 * totalAreaMod,
            type: 'RAIL',
            piercing: true,
            hitIds: [],
            owner: 'PLAYER',
            usesGravity: false // Rail slug travels straight
          });

          audioEventsRef.current.push({ type: 'SHOOT' });
          triggerShake(10, 10);
          phaseRailChargeRef.current = 0;
        } else {
          phaseRailChargeRef.current = chargeTime;
        }
      }
    }

    // 6. NANO SWARM
    if (wStats.nanoSwarmLevel > 0) {
      const count = wStats.nanoSwarmCount;
      const radius = 3.8 * DEFAULT_SETTINGS.gridSize;

      const speed = 1 / (350 - wStats.nanoSwarmLevel * 10);
      nanoSwarmAngleRef.current += speed * dt;

      const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
      const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

      for (let i = 0; i < count; i++) {
        const angle = nanoSwarmAngleRef.current + (i * (Math.PI * 2 / count));
        const sx = cx + Math.cos(angle) * radius;
        const sy = cy + Math.sin(angle) * radius;

        enemiesRef.current.forEach(e => {
          if (e.shouldRemove) return;
          if (e.hitCooldowns && e.hitCooldowns['NANO'] > 0) return;

          const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const d = Math.hypot(ex - sx, ey - sy);

          if (d < DEFAULT_SETTINGS.gridSize * totalAreaMod) {
            damageEnemy(e, wStats.nanoSwarmDamage); // Global Damage mod applied inside damageEnemy
            createParticles(e.x, e.y, COLORS.nanoSwarm, 3);
            if (!e.hitCooldowns) e.hitCooldowns = {};
            e.hitCooldowns['NANO'] = 15;
          }
        });
      }
    }

    // 7. PLASMA MINES
    if (wStats.mineLevel > 0) {
      mineDropTimerRef.current += dt;
      if (mineDropTimerRef.current >= (wStats.mineDropRate / totalFireRateMod)) {
        const tail = snakeRef.current[snakeRef.current.length - 1];
        if (tail) {
          // MAJOR TRAIT: RIGGER (Construct Damage)
          const constructDmgScale = 1 + ((traits.constructDamagePerLevel || 0) * (level - 1));
          const radMult = traits.mineRadiusMod;

          minesRef.current.push({
            id: Math.random().toString(36),
            x: tail.x,
            y: tail.y,
            damage: wStats.mineDamage * constructDmgScale,
            radius: wStats.mineRadius * totalAreaMod * radMult,
            triggerRadius: 1.5 * totalAreaMod * radMult,
            createdAt: gameTime
          });
        }
        mineDropTimerRef.current = 0;
      }

      for (let i = minesRef.current.length - 1; i >= 0; i--) {
        const mine = minesRef.current[i];
        if (mine.shouldRemove) continue;

        let triggered = false;
        for (const e of enemiesRef.current) {
          if (e.shouldRemove) continue;
          const dist = Math.hypot(e.x - mine.x, e.y - mine.y);
          if (dist <= mine.triggerRadius) {
            triggered = true;
            break;
          }
        }

        if (triggered) {
          triggerShockwave({
            id: Math.random().toString(),
            x: mine.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            y: mine.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
            currentRadius: 0,
            maxRadius: mine.radius * DEFAULT_SETTINGS.gridSize,
            damage: mine.damage,
            opacity: 1.0
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
      if (auraTickTimerRef.current >= (250 / totalFireRateMod)) {
        const r2 = (wStats.auraRadius * totalAreaMod) ** 2;
        enemiesRef.current.forEach(e => {
          if (e.shouldRemove) return;
          const hit = snakeRef.current.some(seg => {
            const d2 = Math.pow(e.x - seg.x, 2) + Math.pow(e.y - seg.y, 2);
            return d2 <= r2;
          });
          if (hit) {
            damageEnemy(e, wStats.auraDamage);
            createParticles(e.x, e.y, COLORS.aura, 1);
          }
        });
        auraTickTimerRef.current = 0;
      }
    }

    // ─────────────────────────────────────────────
    // PROJECTILE UPDATE LOOP (Logic Only)
    // ─────────────────────────────────────────────

    projectilesRef.current.forEach(p => {
      if (p.shouldRemove) return;

      // Visual Age Update
      p.age = (p.age || 0) + frame;

      // Homing Logic
      if (p.homing && p.owner === 'PLAYER') {
        if (!p.targetId) {
          const range = 20 * totalAreaMod;
          const nearest = findNearestEnemy(enemiesRef.current, { x: p.x / DEFAULT_SETTINGS.gridSize, y: p.y / DEFAULT_SETTINGS.gridSize }, range);
          if (nearest) {
            p.targetId = nearest.id;
          }
        }

        const target = enemiesRef.current.find(e => e.id === p.targetId && !e.shouldRemove);

        if (target) {
          const tx = target.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const ty = target.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const dx = tx - p.x;
          const dy = ty - p.y;
          const angle = Math.atan2(dy, dx);
          const speed = Math.hypot(p.vx, p.vy);

          const homingFactor = 0.1;
          p.vx = p.vx * 0.9 + Math.cos(angle) * speed * homingFactor;
          p.vy = p.vy * 0.9 + Math.sin(angle) * speed * homingFactor;

          const distanceToTarget = Math.hypot(tx - p.x, ty - p.y);
          if (distanceToTarget < 5) {
            p.shouldRemove = true;
          }
        } else {
          p.targetId = undefined;
        }
      }

      // NOTE: Physics integration (p.x += ...) is handled by useProjectilePhysics now.
      // NOTE: Bounds checking (Void/Screen) is handled by useProjectilePhysics now.

      // Life Span
      if (p.life !== undefined) {
        p.life -= frame;
        if (p.life <= 0) p.shouldRemove = true;
      }

      // SERPENT Trail
      if (p.type === 'SERPENT' && Math.random() < 0.4) {
        createParticles(p.x / DEFAULT_SETTINGS.gridSize, p.y / DEFAULT_SETTINGS.gridSize, p.color, 1);
      }

      // PLAYER PROJECTILE vs ENEMY
      if (p.owner === 'PLAYER') {
        for (const e of enemiesRef.current) {
          if (e.shouldRemove) continue;
          if (p.piercing && p.hitIds?.includes(e.id)) continue;

          const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

          if (Math.abs(p.x - ex) < 25 && Math.abs(p.y - ey) < 25) {
            damageEnemy(e, p.damage);
            createParticles(e.x, e.y, p.color, 3);

            if (p.piercing) {
              p.hitIds?.push(e.id);
            } else {
              p.shouldRemove = true;
            }
            break;
          }
        }
      }
    });

    // 10. SHOCKWAVES
    shockwavesRef.current.forEach(s => {
      if (s.shouldRemove) return;

      // FIXED: Wave speed was multiplied by 10 unnecessarily, causing instant expansion
      s.currentRadius += SHOCKWAVE_SPEED * frame;
      s.opacity -= 0.02 * frame;

      if (s.damage > 0 || s.stunDuration) {
        const rSq = s.currentRadius ** 2;
        // FIXED: Widen the impact ring for better hit detection
        const innerRSq = Math.pow(Math.max(0, s.currentRadius - 50), 2);

        enemiesRef.current.forEach(e => {
          if (e.shouldRemove) return;
          if (e.hitCooldowns && e.hitCooldowns['SHOCKWAVE'] > 0) return;

          const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          const dSq = Math.pow(ex - s.x, 2) + Math.pow(ey - s.y, 2);

          if (dSq <= rSq && dSq >= innerRSq) {
            if (s.damage > 0) damageEnemy(e, s.damage, true);
            if (s.stunDuration) {
              e.stunTimer = s.stunDuration;
              createParticles(e.x, e.y, '#00ffff', 5);
            }

            const angle = Math.atan2(ey - s.y, ex - s.x);
            e.x += Math.cos(angle) * 1.5;
            e.y += Math.sin(angle) * 1.5;

            if (!e.hitCooldowns) e.hitCooldowns = {};
            e.hitCooldowns['SHOCKWAVE'] = 20;
          }
        });
      }

      if (s.opacity <= 0 || s.currentRadius >= s.maxRadius) {
        s.shouldRemove = true;
      }
    });

    // 11. LIGHTNING
    lightningArcsRef.current.forEach(arc => {
      if (arc.shouldRemove) return;
      arc.life -= frame * 0.08;
      if (arc.life <= 0) arc.shouldRemove = true;
    });

    // 12. CLEANUP PROJECTILES
    if (projectilesRef.current.length > 0) {
      projectilesRef.current = projectilesRef.current.filter(p => !p.shouldRemove);
    }

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
    processDeath,
    difficulty,
    spawner,
    terminalsRef,
    traitsRef,
    directionRef,
    setBossActive,
    bossActiveRef,
    cameraRef
  ]);

  return {
    damageEnemy,
    update
  };
}
