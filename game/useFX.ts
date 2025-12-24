
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
import { Shockwave, LightningArc } from '../types';

export function useFX(game: ReturnType<typeof useGameState>) {
  const { 
    particlesRef,
    floatingTextsRef,
    shockwavesRef,
    lightningArcsRef,
    shakeRef,
    digitalRainRef,
    chromaticAberrationRef
  } = game;

  // ─────────────────────────────────────────────
  // CAMERA SHAKE (SPRING-BASED)
  // ─────────────────────────────────────────────
  const translationRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });

  const triggerShake = useCallback((x: number, y: number) => {
    // Camera shake disabled by request
  }, []);

  const tickTranslation = useCallback((dt: number) => {
    // Ensure shake remains zeroed
    shakeRef.current = { x: 0, y: 0 };
  }, [shakeRef]);

  // ─────────────────────────────────────────────
  // AUDIO VISUAL SYNC
  // ─────────────────────────────────────────────
  const pulseBeat = useCallback(() => {
      // Small chromatic bump on every beat
      chromaticAberrationRef.current = 0.4; 
  }, [chromaticAberrationRef]);

  const pulseBar = useCallback(() => {
      // Large chromatic slam on bar start
      chromaticAberrationRef.current = 1.2;
  }, [chromaticAberrationRef]);

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
      const available = FX_LIMITS.particles - particlesRef.current.length;
      if (available <= 0) return;
      
      const spawnCount = Math.min(count, available);
      
      for (let i = 0; i < spawnCount; i++) {
        particlesRef.current.push({
          x: x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
          y: y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          life: 1.0,
          color
          });
          
      }
    },
    [particlesRef]
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
      digitalRainRef.current = [];
      const fontSize = 16;
      const columns = Math.ceil(CANVAS_WIDTH / fontSize);
      
      const katakana = '0123456789ABCDEF';
      
      for(let i=0; i<columns; i++) {
          digitalRainRef.current.push({
              x: i * fontSize,
              y: Math.random() * -1000,
              speed: 5 + Math.random() * 15,
              chars: katakana.charAt(Math.floor(Math.random() * katakana.length)),
              size: fontSize,
              opacity: 0.1 + Math.random() * 0.5
          });
      }
  }, [digitalRainRef]);

  const updateDigitalRain = useCallback(() => {
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
    particlesRef.current.forEach(p => {
      if (p.shouldRemove) return;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.06;
      if (p.life <= 0) p.shouldRemove = true;
    });

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
    // Note: We intentionally do NOT clear digitalRainRef here, 
    // it fades out via opacity or is cleared by stage controller on new stage
  }, [lightningArcsRef, shockwavesRef, floatingTextsRef, chromaticAberrationRef]);

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
