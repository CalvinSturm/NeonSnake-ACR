
/**
 * ARCHITECTURE LOCK:
 *
 * useFX is a PRESENTATION-ONLY system.
 *
 * - It may ONLY mutate visual refs:
 *   particlesRef, floatingTextsRef, shockwavesRef,
 *   lightningArcsRef, shakeRef.
 *
 * - It must NEVER:
 *   - change gameplay state
 *   - grant XP or score
 *   - deal damage
 *   - spawn or remove enemies
 *   - trigger stage or progression logic
 *
 * All gameplay systems may EMIT FX through this hook.
 * This hook must NEVER make gameplay decisions.
 */

import { useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import { DEFAULT_SETTINGS, COLORS, FX_LIMITS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { Shockwave, LightningArc, Particle } from '../types';
import { ObjectPool } from './utils/ObjectPool';

export function useFX(game: ReturnType<typeof useGameState>) {
  const {
    particlesRef,
    floatingTextsRef,
    shockwavesRef,
    lightningArcsRef,
    shakeRef,
    digitalRainRef,
    chromaticAberrationRef,
    settings // Access settings
  } = game;

  // ─────────────────────────────────────────────
  // CAMERA SHAKE (SPRING-BASED)
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // CAMERA SHAKE (SPRING-BASED)
  // ─────────────────────────────────────────────
  // Note: Spring physics moved to useCameraState or simplified here via direct shakeRef mutation

  const triggerShake = useCallback((x: number, y: number) => {
    // Only apply shake if enabled in settings
    if (settings.screenShake) {
      shakeRef.current.x += (Math.random() - 0.5) * x;
      shakeRef.current.y += (Math.random() - 0.5) * y;
    }
  }, [shakeRef, settings.screenShake]);

  const tickTranslation = useCallback(() => {
    // Simple decay
    shakeRef.current.x *= 0.9;
    shakeRef.current.y *= 0.9;

    if (Math.abs(shakeRef.current.x) < 0.5) shakeRef.current.x = 0;
    if (Math.abs(shakeRef.current.y) < 0.5) shakeRef.current.y = 0;
  }, [shakeRef]);

  // ─────────────────────────────────────────────
  // OBJECT POOL
  // ─────────────────────────────────────────────

  // Factory for new particles
  const createParticle = (): Particle => ({
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, color: '#fff',
    shouldRemove: false,
    active: false
  });

  // Reset function for recycling
  const resetParticle = (p: Particle) => {
    p.shouldRemove = false;
    p.active = false;
  };

  // We use a Ref to hold the pool so it persists
  const particlePoolRef = useRef(new ObjectPool<Particle>(createParticle, resetParticle, 200));

  // ─────────────────────────────────────────────
  // AUDIO VISUAL SYNC
  // ─────────────────────────────────────────────
  const pulseBeat = useCallback(() => {
    // Small chromatic bump on every beat
    if (settings.fxIntensity > 0.5) {
      chromaticAberrationRef.current = 0.4 * settings.fxIntensity;
    }
  }, [chromaticAberrationRef, settings.fxIntensity]);

  const pulseBar = useCallback(() => {
    // Large chromatic slam on bar start
    if (settings.fxIntensity > 0.5) {
      chromaticAberrationRef.current = 1.2 * settings.fxIntensity;
    }
  }, [chromaticAberrationRef, settings.fxIntensity]);

  // ─────────────────────────────────────────────
  // FX EMITTERS
  // ─────────────────────────────────────────────
  const spawnFloatingText = useCallback(
    (x: number, y: number, text: string, color = COLORS.damageText, size = 12) => {
      floatingTextsRef.current.push({
        id: Math.random().toString(36),
        x, y, text, color,
        life: 1.0,
        vy: -0.5 - Math.random() * 0.5,
        size
      });
    },
    [floatingTextsRef]
  );

  const createParticles = useCallback(
    (x: number, y: number, color: string, count = 12) => {
      // Scale count by FX intensity setting
      const adjustedCount = Math.floor(count * settings.fxIntensity);
      if (adjustedCount <= 0) return;

      const available = FX_LIMITS.particles - particlesRef.current.length;
      if (available <= 0) return;

      const spawnCount = Math.min(adjustedCount, available);

      for (let i = 0; i < spawnCount; i++) {
        const p = particlePoolRef.current.acquire();
        if (p) {
          p.x = x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          p.y = y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2;
          p.vx = (Math.random() - 0.5) * 14;
          p.vy = (Math.random() - 0.5) * 14;
          p.life = 1.0;
          p.color = color;
          p.active = true; // Ensure active
          p.shouldRemove = false;

          particlesRef.current.push(p);
        }
      }
    },
    [particlesRef, settings.fxIntensity]
  );

  const triggerShockwave = useCallback(
    (wave: Shockwave) => shockwavesRef.current.push(wave),
    [shockwavesRef]
  );

  const triggerLightning = useCallback(
    (arc: LightningArc) => lightningArcsRef.current.push(arc),
    [lightningArcsRef]
  );

  // ─────────────────────────────────────────────
  // DIGITAL RAIN (FULLSCREEN FX)
  // ─────────────────────────────────────────────
  const initDigitalRain = useCallback(() => {
    if (settings.fxIntensity < 0.2) return; // Optimization for low FX

    digitalRainRef.current = [];
    const fontSize = 16;
    const columns = Math.ceil(CANVAS_WIDTH / fontSize);

    const katakana = '0123456789ABCDEF';

    for (let i = 0; i < columns; i++) {
      digitalRainRef.current.push({
        x: i * fontSize,
        y: Math.random() * -1000,
        speed: 5 + Math.random() * 15,
        chars: katakana.charAt(Math.floor(Math.random() * katakana.length)),
        size: fontSize,
        opacity: (0.1 + Math.random() * 0.5) * settings.fxIntensity
      });
    }
  }, [digitalRainRef, settings.fxIntensity]);

  const updateDigitalRain = useCallback(() => {
    if (digitalRainRef.current.length === 0) return;

    digitalRainRef.current.forEach(drop => {
      drop.y += drop.speed;
      if (Math.random() < 0.05) {
        const katakana = '0123456789ABCDEF';
        drop.chars = katakana.charAt(Math.floor(Math.random() * katakana.length));
      }
      if (drop.y > CANVAS_HEIGHT) {
        drop.y = -20;
        drop.speed = 5 + Math.random() * 15;
      }
    });
  }, [digitalRainRef]);

  // ─────────────────────────────────────────────
  // FX UPDATE (NO GAME LOGIC)
  // ─────────────────────────────────────────────
  const updateFX = useCallback(() => {
    // Zero-allocation update loop for particles
    let activeCount = 0;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (!p.shouldRemove) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.06;
        if (p.life <= 0) p.shouldRemove = true;
      }

      if (p.shouldRemove) {
        particlePoolRef.current.release(p);
      } else {
        // Keep alive - swap/move to front (Compact array)
        if (i !== activeCount) {
          particles[activeCount] = p;
        }
        activeCount++;
      }
    }
    // Truncate array to remove dead particles at the end
    particles.length = activeCount;

    floatingTextsRef.current.forEach(t => {
      if (t.shouldRemove) return;
      t.y += t.vy;
      t.life -= 0.025;
      if (t.life <= 0) t.shouldRemove = true;
    });

    updateDigitalRain();

    // Decay Chromatic Aberration
    if (chromaticAberrationRef.current > 0) {
      chromaticAberrationRef.current *= 0.9;
      if (chromaticAberrationRef.current < 0.01) chromaticAberrationRef.current = 0;
    }
  }, [particlesRef, floatingTextsRef, updateDigitalRain, chromaticAberrationRef]);

  const clearTransientFX = useCallback(() => {
    lightningArcsRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];
    chromaticAberrationRef.current = 0;

    // Clear particles using pool
    particlesRef.current.forEach(p => particlePoolRef.current.release(p));
    particlesRef.current = [];

    // Note: We intentionally do NOT clear digitalRainRef here, 
    // it fades out via opacity or is cleared by stage controller on new stage
  }, [lightningArcsRef, shockwavesRef, floatingTextsRef, chromaticAberrationRef, particlesRef]);

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  return Object.freeze({
    // emitters
    spawnFloatingText,
    createParticles,
    triggerShockwave,
    triggerLightning,
    triggerShake,
    initDigitalRain,
    pulseBeat,
    pulseBar,

    // lifecycle
    tickTranslation,
    updateFX,
    clearTransientFX
  });
}
