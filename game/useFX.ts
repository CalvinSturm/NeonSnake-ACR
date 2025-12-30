
/**
 * ARCHITECTURE LOCK:
 *
 * useFX is a PRESENTATION-ONLY system.
 *
 * - It may ONLY mutate visual refs:
 *   particlesRef, floatingTextsRef, shockwavesRef,
 *   lightningArcsRef, shakeRef, cliAnimationsRef.
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
import { Shockwave, LightningArc, TerminalType } from '../types';

export function useFX(game: ReturnType<typeof useGameState>) {
  const { 
    particlesRef,
    floatingTextsRef,
    shockwavesRef,
    lightningArcsRef,
    shakeRef,
    digitalRainRef,
    chromaticAberrationRef,
    cliAnimationsRef, // NEW
    audioEventsRef, // NEW
    settings // Access settings
  } = game;

  // ─────────────────────────────────────────────
  // CAMERA SHAKE (SPRING-BASED)
  // ─────────────────────────────────────────────
  const translationRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });

  const triggerShake = useCallback((x: number, y: number) => {
    // Only apply shake if enabled in settings
    if (settings.screenShake) {
        shakeRef.current.x += (Math.random() - 0.5) * x;
        shakeRef.current.y += (Math.random() - 0.5) * y;
    }
  }, [shakeRef, settings.screenShake]);

  const tickTranslation = useCallback((dt: number) => {
    // Simple decay
    shakeRef.current.x *= 0.9;
    shakeRef.current.y *= 0.9;
    
    if (Math.abs(shakeRef.current.x) < 0.5) shakeRef.current.x = 0;
    if (Math.abs(shakeRef.current.y) < 0.5) shakeRef.current.y = 0;
  }, [shakeRef]);

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
  // CLI ANIMATION SYSTEM
  // ─────────────────────────────────────────────
  const triggerCLISequence = useCallback((x: number, y: number, type: TerminalType, color: string, data?: any) => {
      cliAnimationsRef.current.push({
          id: Math.random().toString(36),
          x,
          y,
          type,
          phase: 1,
          timer: 0,
          lines: [],
          progress: 0,
          color,
          data
      });
      // Initial Audio Burst
      audioEventsRef.current.push({ type: 'CLI_BURST' });
  }, [cliAnimationsRef, audioEventsRef]);

  const updateCLISequences = useCallback((dt: number) => {
      const anims = cliAnimationsRef.current;
      if (anims.length === 0) return;

      anims.forEach(anim => {
          if (anim.shouldRemove) return;
          anim.timer += dt;

          const data = anim.data || {};
          const isMemory = anim.type === 'MEMORY';

          if (isMemory) {
              // ─── MEMORY TERMINAL FLOW ───
              if (anim.phase === 1) {
                  // Phase 1: Archive Handshake
                  if (anim.lines.length === 0) {
                      anim.lines.push('> accessing archive node...');
                      audioEventsRef.current.push({ type: 'MOVE' });
                  }
                  if (anim.timer > 200 && anim.lines.length === 1) {
                      anim.lines.push('> decrypting memory sector...');
                      audioEventsRef.current.push({ type: 'MOVE' });
                  }
                  if (anim.timer > 600) {
                      anim.phase = 2;
                      anim.timer = 0;
                  }
              }
              else if (anim.phase === 2) {
                  // Phase 2: Identification
                  if (anim.timer > 200 && anim.lines.length === 2) {
                       anim.lines.push('> MEMORY MODULE DETECTED');
                       audioEventsRef.current.push({ type: 'CLI_BURST' });
                  }
                  if (anim.timer > 600) {
                      anim.phase = 3;
                      anim.timer = 0;
                  }
              }
              else if (anim.phase === 3) {
                  // Phase 3: Reveal (Dopamine Hit)
                  if (anim.timer > 0 && anim.lines.length === 3) {
                      anim.lines.push('✔ MODULE RECOVERED');
                      anim.lines.push(`  └─ [${data.id || '???'}] ${data.title || 'ENCRYPTED'}`);
                      audioEventsRef.current.push({ type: 'HACK_COMPLETE' }); // Success tone
                  }
                  if (anim.timer > 1000) {
                      anim.phase = 4;
                      anim.timer = 0;
                  }
              }
              else if (anim.phase === 4) {
                  // Phase 4: Confirmation
                  if (anim.timer > 0 && anim.lines.length === 5) {
                      anim.lines.push('✔ archive updated');
                      audioEventsRef.current.push({ type: 'UI_HARD_CLICK' });
                  }
                  if (anim.timer > 1500) {
                      anim.shouldRemove = true;
                  }
              }
          } 
          else {
              // ─── RESOURCE / STANDARD FLOW ───
              if (anim.phase === 1) {
                  // Phase 1: Init
                  if (anim.lines.length === 0) {
                      const verb = anim.type === 'OVERRIDE' ? 'Override' : 'Miner';
                      anim.lines.push(`> ${verb} initiated`);
                  }
                  if (anim.timer > 0) {
                      // Immediate transition to progress
                      anim.phase = 2;
                      anim.timer = 0;
                  }
              }
              else if (anim.phase === 2) {
                  // Phase 2: Progress (Animated Dots)
                  // We simulate progress via text updates or just waiting
                  const dotCount = Math.floor(anim.timer / 150) % 4;
                  const dots = '.'.repeat(dotCount);
                  
                  // Ensure line exists
                  if (anim.lines.length < 2) anim.lines.push(`> processing${dots}`);
                  else anim.lines[1] = `> processing${dots}`;
                  
                  if (anim.timer > 500) {
                      anim.phase = 3;
                      anim.timer = 0;
                      audioEventsRef.current.push({ type: 'HACK_COMPLETE' }); 
                      
                      const val = data.value || 'DATA';
                      let finalLine = `✔ ${val} mined and exported`;
                      
                      if (anim.type === 'OVERRIDE') finalLine = `✔ OVERRIDE SIGNAL SENT`;
                      if (anim.type === 'CLEARANCE') finalLine = `✔ SECURITY LEVEL UPGRADED`;
                      
                      anim.lines.push(finalLine);
                  }
              }
              else if (anim.phase === 3) {
                  // Phase 3: Hold & Fade
                  if (anim.timer > 1000) {
                      anim.shouldRemove = true;
                  }
              }
          }
      });
      
      // Cleanup
      cliAnimationsRef.current = anims.filter(a => !a.shouldRemove);
  }, [cliAnimationsRef, audioEventsRef]);

  // ─────────────────────────────────────────────
  // DIGITAL RAIN (FULLSCREEN FX)
  // ─────────────────────────────────────────────
  const initDigitalRain = useCallback(() => {
      if (settings.fxIntensity < 0.2) return; // Optimization for low FX

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
    
    // Process CLI Animations using approximate frame time (assuming 60fps for smoothing if dt not passed)
    updateCLISequences(16);

    // Decay Chromatic Aberration
    if (chromaticAberrationRef.current > 0) {
        chromaticAberrationRef.current *= 0.9;
        if (chromaticAberrationRef.current < 0.01) chromaticAberrationRef.current = 0;
    }
  }, [particlesRef, floatingTextsRef, updateDigitalRain, chromaticAberrationRef, updateCLISequences]);

  const clearTransientFX = useCallback(() => {
    lightningArcsRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];
    cliAnimationsRef.current = [];
    chromaticAberrationRef.current = 0;
  }, [lightningArcsRef, shockwavesRef, floatingTextsRef, chromaticAberrationRef, cliAnimationsRef]);

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
    triggerCLISequence, // NEW
    initDigitalRain,
    pulseBeat,
    pulseBar,

    // lifecycle
    tickTranslation,
    updateFX,
    clearTransientFX
  });
}
