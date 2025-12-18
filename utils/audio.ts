// Added import for DEFAULT_SETTINGS
import { DEFAULT_SETTINGS } from '../constants';

// Simple synth to avoid loading external assets
class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.3;

  constructor(volume: number) {
    this.volume = volume;
    try {
      // Initialize on user interaction usually, but we setup class first
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }
  
  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.warn("Audio resume failed", e));
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, ramp: boolean = true) {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime + startTime);
    if (ramp) {
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    } else {
        gain.gain.setValueAtTime(0, this.ctx.currentTime + startTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public playMove() {
    // Very quiet tick
    this.playTone(100, 'triangle', 0.05);
  }

  public playEat() {
    this.playTone(600, 'sine', 0.1);
    this.playTone(900, 'square', 0.1, 0.05);
  }

  public playBonus() {
    this.playTone(400, 'sine', 0.1);
    this.playTone(600, 'sine', 0.1, 0.1);
    this.playTone(1200, 'square', 0.3, 0.2);
  }

  public playPowerUp() {
    // Sci-fi rising sound
    this.playTone(300, 'sine', 0.3);
    this.playTone(600, 'sine', 0.3, 0.1);
    this.playTone(900, 'sine', 0.4, 0.2);
  }

  public playCompress() {
      // Shrinking sound
      this.playTone(800, 'sawtooth', 0.1);
      this.playTone(400, 'sawtooth', 0.2, 0.1);
  }

  public playPoison() {
    this.playTone(150, 'sawtooth', 0.3);
    this.playTone(100, 'sawtooth', 0.3, 0.1);
  }

  public playGameOver() {
    this.playTone(300, 'sawtooth', 0.2);
    this.playTone(250, 'sawtooth', 0.2, 0.2);
    this.playTone(200, 'sawtooth', 0.2, 0.4);
    this.playTone(150, 'sawtooth', 0.6, 0.6);
  }

  public playEnemySpawn() {
    // Low drone warning
    this.playTone(100, 'sawtooth', 0.5);
    this.playTone(80, 'square', 0.5, 0.1);
  }

  public playEnemyDestroy() {
    // Crunch sound
    this.playTone(200, 'square', 0.1);
    this.playTone(100, 'sawtooth', 0.1, 0.05);
    this.playTone(50, 'square', 0.2, 0.1);
  }

  public playShoot() {
    // Laser pew
    this.playTone(800, 'square', 0.1, 0, true);
    this.playTone(200, 'sawtooth', 0.1, 0.05, true);
  }

  public playHit() {
    this.playTone(200, 'sawtooth', 0.05);
  }

  public playCombo(multiplier: number) {
    // Pitch rises with multiplier
    const base = 400 + (multiplier * 100);
    this.playTone(base, 'triangle', 0.1);
    this.playTone(base + 200, 'sine', 0.2, 0.05);
  }

  public playEMP() {
    // Heavy impact
    this.playTone(50, 'sawtooth', 1.0, 0, true);
    this.playTone(100, 'square', 0.5, 0, true);
    this.playTone(20, 'sine', 1.5, 0, true);
  }

  public playLevelUp() {
    // Uplifting sequence
    this.playTone(440, 'sine', 0.1, 0);
    this.playTone(554, 'sine', 0.1, 0.1);
    this.playTone(659, 'sine', 0.1, 0.2);
    this.playTone(880, 'sine', 0.4, 0.3);
  }
  
  public playShieldHit() {
    // Deflect sound
    this.playTone(800, 'square', 0.1);
    this.playTone(200, 'sawtooth', 0.3, 0.05);
  }

  public playHack() {
    // Data stream noise
    const now = 0;
    for(let i=0; i<12; i++) {
        this.playTone(800 + Math.random() * 2000, 'square', 0.03, i * 0.04, false);
    }
    this.playTone(100, 'sawtooth', 0.8, 0.2); // Bass drop
  }
}

export const audio = new AudioController(DEFAULT_SETTINGS.volume);