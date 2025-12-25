
import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import { useSpawner } from './useSpawner';
import { useFX } from './useFX';
import { ProgressionAPI } from './useProgression';
import { Enemy, EnemyType, Projectile, Difficulty } from '../types';
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

  function findNearestEnemy(
  enemies: readonly Enemy[],
  from: { x: number; y: number }
            ): Enemy | null {
              let nearest: Enemy | null = null;
              let minDistSq = Infinity;

              for (const e of enemies) {
                const dx = e.x - from.x;
                const dy = e.y - from.y;
                const d2 = dx * dx + dy * dy;

                if (d2 < minDistSq) {
                  minDistSq = d2;
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
    traitsRef 
  } = game;

  const {
    spawnFloatingText,
    createParticles,
    triggerShake,
    triggerShockwave,
    triggerLightning
  } = fx;

  const shootAudioThrottleRef = useRef(0);

  /* ─────────────────────────────
     Internal Combat Logic
     ───────────────────────────── */

  const applyDamage = useCallback((enemy: Enemy, amount: number) => {
      enemy.hp -= amount;
      enemy.flash = 5; 
  }, []);



  const processDeath = useCallback((enemy: Enemy) => {
      enemiesKilledRef.current += 1;
      
      spawner.spawnXpOrbs(enemy.x, enemy.y, 40); 
      
      progression.onEnemyDefeated({ xp: 0 });
      
      if (statsRef.current.weapon.neuralMagnetLevel > 0) {
          const pullRadius = 10 + (statsRef.current.weapon.neuralMagnetLevel * 5);
          const snakeHead = snakeRef.current[0];
          
          foodRef.current.forEach(f => {
              const dist = Math.hypot(f.x - enemy.x, f.y - enemy.y);
              if (dist < pullRadius) {
                  if (snakeHead) {
                      const angle = Math.random() * Math.PI * 2;
                      const r = 2; 
                      f.x = snakeHead.x + Math.cos(angle) * r;
                      f.y = snakeHead.y + Math.sin(angle) * r;
                  }
              }
          });
      }

      if (enemy.type === EnemyType.BOSS) {
        bossDefeatedRef.current = true; 
        triggerShake(20, 20);
        audioEventsRef.current.push({ type: 'EMP' }); 
      } else {
        audioEventsRef.current.push({ type: 'ENEMY_DESTROY' });
      }
  }, [enemiesKilledRef, spawner, progression, statsRef, snakeRef, foodRef, bossDefeatedRef, triggerShake, audioEventsRef]);

  /* ─────────────────────────────
     Orchestrator: Damage Enemy
     ───────────────────────────── */

  const damageEnemy = useCallback(
    (
      enemy: Enemy,
      baseDamage: number,
      forceCrit = false,
      allowChain = true
    ) => {
      const stats = statsRef.current;
      let damage = baseDamage * stats.globalDamageMod;
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
                      x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      currentRadius: 0,
                      maxRadius: (150 + (stats.weapon.echoCacheLevel * 25)) * stats.globalAreaMod,
                      damage: cap * 0.5 * stats.globalDamageMod,
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

      // 3. Visuals (Text)
      const ex = enemy.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
      const ey = enemy.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

      spawnFloatingText(
        ex,
        ey,
        Math.floor(damage).toString(),
        isCrit ? COLORS.critText : COLORS.damageText,
        isCrit ? 24 : 12
      );

      // 4. Chain Lightning (Effect)
      if (allowChain && stats.weapon.chainLightningLevel > 0) {
        let nearest: Enemy | null = null;
        let minDistSq = Infinity;
        const rangeSq = (stats.weapon.chainLightningRange * stats.globalAreaMod) ** 2;
        for (const other of enemiesRef.current) {
          if (other === enemy) continue;
          const d2 = (other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2;
          if (d2 < rangeSq && d2 < minDistSq) {
            minDistSq = d2;
            nearest = other;
          }
        }

        if (nearest) {
          damageEnemy(
            nearest,
            damage * stats.weapon.chainLightningDamage,
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

      // 5. Audio (Throttled Hit)
      if (enemy.hp > 0) {
          audioEventsRef.current.push({ type: 'HIT' });
      }

      // 6. Death Check
      if (enemy.hp <= 0) {
        processDeath(enemy);
      }
    },
    [
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
    ]
  );

  /* ─────────────────────────────
     Main Combat Loop
     ───────────────────────────── */
  const update = useCallback((dt: number) => {
      const head = snakeRef.current[0];
      if (!head) return;

      const frame = dt / 16.667;
      const now = gameTimeRef.current;
      const stats = statsRef.current;
      const wStats = stats.weapon;
      const traits = traitsRef.current; 

      // ── OVERCLOCK UPDATE ──
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

      // 1. AUTO CANNON
      if (wStats.cannonLevel > 0) {
          weaponFireTimerRef.current += dt;
          let fireRate = wStats.cannonFireRate / stats.globalFireRateMod;
          if (overclockActiveRef.current) fireRate *= 0.5;

          if (weaponFireTimerRef.current >= fireRate) {
              if (enemiesRef.current.length > 0) {
                  const nearest = findNearestEnemy(enemiesRef.current, head);
                  if (!nearest) return;


                  if (nearest) {
                    const dx = nearest.x - head.x;
                    const dy = nearest.y - head.y;

                      const angle = Math.atan2(dy, dx);
                      const count = wStats.cannonProjectileCount;
                      const spread = 0.15;
                      
                      for(let i=0; i<count; i++) {
                          const offset = (i - (count-1)/2) * spread;
                          const finalAngle = angle + offset;
                          const speedMod = stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
                          const vx = Math.cos(finalAngle) * wStats.cannonProjectileSpeed * speedMod;
                          const vy = Math.sin(finalAngle) * wStats.cannonProjectileSpeed * speedMod;

                          projectilesRef.current.push({
                              id: Math.random().toString(36),
                              x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                              vx: vx * (DEFAULT_SETTINGS.gridSize / 20),
                              vy: vy * (DEFAULT_SETTINGS.gridSize / 20),
                              damage: wStats.cannonDamage * stats.globalDamageMod,
                              color: COLORS.projectile,
                              size: (3 + Math.min(wStats.cannonLevel, 4)) * stats.globalAreaMod,
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
          }
      }

      // 2. PRISM LANCE
      if (wStats.prismLanceLevel > 0) {
          prismLanceTimerRef.current += dt;
          let fireRate = 2000 / stats.globalFireRateMod;
          if (overclockActiveRef.current) fireRate *= 0.5;

          if (prismLanceTimerRef.current >= fireRate) {
              const nearest = findNearestEnemy(enemiesRef.current, head);
              if (!nearest) return;


              if (nearest) {
                  const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
                  const projectileSpeed = 30 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
                  const vx = Math.cos(angle) * projectileSpeed;
                  const vy = Math.sin(angle) * projectileSpeed;
                  
                  projectilesRef.current.push({
                      id: Math.random().toString(36),
                      x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      vx: vx * (DEFAULT_SETTINGS.gridSize / 20),
                      vy: vy * (DEFAULT_SETTINGS.gridSize / 20),
                      damage: wStats.prismLanceDamage * stats.globalDamageMod,
                      color: COLORS.prismLance,
                      size: 4 * stats.globalAreaMod,
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
          let fireRate = 1200 / stats.globalFireRateMod;
          if (overclockActiveRef.current) fireRate *= 0.5;

          if (neonScatterTimerRef.current >= fireRate) {
              const target =
              findNearestEnemy(enemiesRef.current, head) ??
              enemiesRef.current[0];
              if (!target) return;

                  const baseAngle = Math.atan2(target.y - head.y, target.x - head.x);
                  const shards = 3 + wStats.neonScatterLevel;
                  const spread = 0.5;

                  for(let i=0; i<shards; i++) {
                      const a = baseAngle - (spread/2) + (Math.random() * spread);
                      const speed = (15 + Math.random() * 5) * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
                      
                      projectilesRef.current.push({
                          id: Math.random().toString(36),
                          x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                          vx: Math.cos(a) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                          vy: Math.sin(a) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                          damage: wStats.neonScatterDamage * stats.globalDamageMod,
                          color: COLORS.neonScatter,
                          size: 3 * stats.globalAreaMod,
                          type: 'SHARD',
                          life: 25,
                          owner: 'PLAYER'
                      });
                  }
                  audioEventsRef.current.push({ type: 'SHOOT' });
                  neonScatterTimerRef.current = 0;
              }
          }
      

      // 4. VOLT SERPENT
      if (wStats.voltSerpentLevel > 0) {
          voltSerpentTimerRef.current += dt;
          const fireRate = 3000 / stats.globalFireRateMod;

          if (voltSerpentTimerRef.current >= fireRate) {
              projectilesRef.current.push({
                  id: Math.random().toString(36),
                  x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                  y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                  vx: (Math.random() - 0.5) * 10 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod,
                  vy: (Math.random() - 0.5) * 10 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod,
                  damage: wStats.voltSerpentDamage * stats.globalDamageMod,
                  color: COLORS.voltSerpent,
                  size: 5 * stats.globalAreaMod,
                  type: 'SERPENT',
                  homing: true,
                  owner: 'PLAYER'
              });
              voltSerpentTimerRef.current = 0;
          }
      }

      // 5. PHASE RAIL
      if (wStats.phaseRailLevel > 0) {
          phaseRailChargeRef.current += dt;
          const chargeTime = 4000 / stats.globalFireRateMod;

          if (phaseRailChargeRef.current >= chargeTime) {
              const nearest = findNearestEnemy(enemiesRef.current, head);
              if (!nearest) return;

              if (nearest) {
                  const angle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
                  const speed = 60 * stats.globalProjectileSpeedMod * traits.projectileSpeedMod;
                  projectilesRef.current.push({
                      id: Math.random().toString(36),
                      x: head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      y: head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      vx: Math.cos(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                      vy: Math.sin(angle) * speed * (DEFAULT_SETTINGS.gridSize / 20),
                      damage: wStats.phaseRailDamage * stats.globalDamageMod,
                      color: COLORS.phaseRail,
                      size: 6 * stats.globalAreaMod,
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

      // 6. NANO SWARM
      if (wStats.nanoSwarmLevel > 0) {
          const count = wStats.nanoSwarmCount;
          const radius = 3.8 * DEFAULT_SETTINGS.gridSize;
          
          const speed = 1 / (350 - wStats.nanoSwarmLevel * 10); 
          nanoSwarmAngleRef.current += speed * dt;
          
          const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
          const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;

          for(let i=0; i<count; i++) {
              const angle = nanoSwarmAngleRef.current + (i * (Math.PI * 2 / count));
              const sx = cx + Math.cos(angle) * radius;
              const sy = cy + Math.sin(angle) * radius;

              enemiesRef.current.forEach(e => {
                  if (e.hitCooldowns && e.hitCooldowns['NANO'] > 0) return;
                  
                  const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const d = Math.hypot(ex - sx, ey - sy);
                  
                  if (d < DEFAULT_SETTINGS.gridSize * stats.globalAreaMod) {
                      damageEnemy(e, wStats.nanoSwarmDamage * stats.globalDamageMod);
                      createParticles(e.x, e.y, COLORS.nanoSwarm, 3);
                      if (!e.hitCooldowns) e.hitCooldowns = {};
                      e.hitCooldowns['NANO'] = 15; 
                  }
              });
          }
      }

      // 7. PLASMA MINES (UPDATED FOR RIGGER TRAIT)
      if (wStats.mineLevel > 0) {
          mineDropTimerRef.current += dt;
          if (mineDropTimerRef.current >= (wStats.mineDropRate / stats.globalFireRateMod)) {
              const tail = snakeRef.current[snakeRef.current.length - 1];
              if (tail) {
                  const radMult = traits.mineRadiusMod;
                  const blastMult = traits.mineBlastMod;

                  minesRef.current.push({
                      id: Math.random().toString(36),
                      x: tail.x,
                      y: tail.y,
                      damage: wStats.mineDamage * stats.globalDamageMod,
                      radius: wStats.mineRadius * stats.globalAreaMod * blastMult,
                      triggerRadius: 1.5 * stats.globalAreaMod * radMult,
                      createdAt: now
                  });
              }
              mineDropTimerRef.current = 0;
          }

          for (let i = minesRef.current.length - 1; i >= 0; i--) {
              const mine = minesRef.current[i];
              if (mine.shouldRemove) continue;

              let triggered = false;
              for (const e of enemiesRef.current) {
                  const dist = Math.hypot(e.x - mine.x, e.y - mine.y);
                  if (dist <= mine.triggerRadius) {
                      triggered = true;
                      break;
                  }
              }

              if (triggered) {
                  triggerShockwave({
                      id: Math.random().toString(),
                      x: mine.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                      y: mine.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
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

      // 8. AURA (AND VOLT TRAIT)
      if (wStats.auraLevel > 0) {
          auraTickTimerRef.current += dt;
          if (auraTickTimerRef.current >= (250 / stats.globalFireRateMod)) {
              const r2 = (wStats.auraRadius * stats.globalAreaMod) ** 2;
              enemiesRef.current.forEach(e => {
                  const hit = snakeRef.current.some(seg => {
                      const d2 = Math.pow(e.x - seg.x, 2) + Math.pow(e.y - seg.y, 2);
                      return d2 <= r2;
                  });
                  if (hit) {
                      damageEnemy(e, wStats.auraDamage * stats.globalDamageMod);
                      createParticles(e.x, e.y, COLORS.aura, 1);
                  }
              });
              auraTickTimerRef.current = 0;
          }
      }

      // 9. PROJECTILES UPDATE
      const margin = 100;
      
      for (const p of projectilesRef.current) {
          if (p.shouldRemove) continue;

          // Homing Logic (Stable Steering — No Velocity Decay)
          if (p.homing && p.owner === 'PLAYER') {
          if (!p.targetId) {
            const nearest = findNearestEnemy(
              enemiesRef.current,
              {
                x: p.x / DEFAULT_SETTINGS.gridSize,
                y: p.y / DEFAULT_SETTINGS.gridSize
              }
            );

            if (nearest) {
              p.targetId = nearest.id;
            }
          }


              const target: Enemy | undefined = enemiesRef.current.find(e => e.id === p.targetId);
              if (target) {
                  const tx = target.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
                  const ty = target.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;

                  const dx = tx - p.x;
                  const dy = ty - p.y;
                  const angle = Math.atan2(dy, dx);

                  const speed = Math.max(Math.hypot(p.vx, p.vy), 0.001);

                  const desiredVx = Math.cos(angle) * speed;
                  const desiredVy = Math.sin(angle) * speed;

                  const turnRate = 0.08; // steering strength

                  p.vx += (desiredVx - p.vx) * turnRate;
                  p.vy += (desiredVy - p.vy) * turnRate;
              }
          }


          p.x += p.vx * frame;
          p.y += p.vy * frame;
          
          if (p.life !== undefined) {
              p.life -= frame;
              if (p.life <= 0) p.shouldRemove = true;
          }

          if (p.type === 'SERPENT' && Math.random() < 0.4) {
              createParticles(p.x / DEFAULT_SETTINGS.gridSize, p.y / DEFAULT_SETTINGS.gridSize, p.color, 1);
          }

          if (
              p.x < -margin || p.x > CANVAS_WIDTH + margin ||
              p.y < -margin || p.y > CANVAS_HEIGHT + margin
          ) {
              p.shouldRemove = true;
              continue;
          }

          // PLAYER PROJECTILE vs ENEMY
          if (p.owner === 'PLAYER') {
              for (const e of enemiesRef.current) {
                  if (p.piercing && p.hitIds?.includes(e.id)) continue;

                  const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  
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
      }

      // 10. SHOCKWAVES
      shockwavesRef.current.forEach(s => {
          if (s.shouldRemove) return;

          s.currentRadius += SHOCKWAVE_SPEED * frame * 10;
          s.opacity -= 0.02 * frame;

          if (s.damage > 0 || s.stunDuration) {
              const rSq = s.currentRadius ** 2;
              enemiesRef.current.forEach(e => {
                  if (e.hitCooldowns && e.hitCooldowns['SHOCKWAVE'] > 0) return;

                  const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const dSq = Math.pow(ex - s.x, 2) + Math.pow(ey - s.y, 2);
                  
                  if (dSq <= rSq && dSq >= (s.currentRadius - 20)**2) {
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
      traitsRef 
  ]);

  return {
    damageEnemy,
    update
  };
}
