import { AudioEvent, AudioPlayData } from '../types';

const NOTE_FREQS: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
};

class AudioController {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  private musicVolume = 0.3;
  private sfxVolume = 0.4;
  
  private isInitialized = false;
  private mode: 'MENU' | 'GAME' = 'MENU';
  
  // Music State
  private nextNoteTime = 0;
  private beatNumber = 0;
  private measure = 0;
  private tempo = 120;
  private isMusicPlaying = false;
  private schedulerTimer: number | null = null;
  
  // Dynamic Parameters
  private threatLevel = 0;
  private currentStage = 1;
  private hackProgress = 0;
  private isStopEffectActive = false;

  constructor() {
    // Lazy init
  }

  private init() {
    if (this.isInitialized) return;
    
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      
      this.masterGain = this.ctx!.createGain();
      this.masterGain.connect(this.ctx!.destination);
      
      this.musicGain = this.ctx!.createGain();
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx!.createGain();
      this.sfxGain.connect(this.masterGain);
      
      this.setVolume(this.musicVolume, this.sfxVolume);
      
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }

  public setVolume(music: number, sfx: number) {
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    
    if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
    }
    if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.1);
    }
  }

  public setMode(mode: 'MENU' | 'GAME') {
      this.mode = mode;
  }

  public setThreat(level: number) {
      this.threatLevel = level;
  }

  public setStage(stage: number) {
      this.currentStage = stage;
  }

  public setHackProgress(progress: number) {
      this.hackProgress = progress;
  }

  public setStopEffect(active: boolean) {
      this.isStopEffectActive = active;
  }

  public stopGameplayLoops() {
      // Logic to stop looping SFX if any
  }

  public startMusic() {
      this.init();
      if (!this.ctx || this.isMusicPlaying) return;
      
      if (this.ctx.state === 'suspended') {
          this.ctx.resume();
      }

      this.isMusicPlaying = true;
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.scheduler();
  }

  private scheduler() {
      if (!this.isMusicPlaying || !this.ctx) return;

      const secondsPerBeat = 60.0 / this.tempo;
      // Lookahead 100ms
      while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
          this.scheduleNote(this.beatNumber, this.nextNoteTime);
          this.nextNoteTime += secondsPerBeat / 4; // 16th notes
          this.beatNumber++;
          if (this.beatNumber >= 16) {
              this.beatNumber = 0;
              this.measure++;
              if (this.measure >= 4) this.measure = 0;
          }
      }
      
      this.schedulerTimer = window.setTimeout(() => this.scheduler(), 25);
  }

  private scheduleNote(beatNumber: number, time: number) {
      // 1. Bass (Kick/Sub) - Always on 1, 5, 9, 13 (Quarter notes)
      if (beatNumber % 4 === 0) {
          this.playKick(time);
      }
      
      // 2. HiHat - 8th notes
      if (beatNumber % 2 === 0) {
          this.playHiHat(time, beatNumber % 4 === 2); // Open hat on off-beat
      }

      // 3. Arpeggio / Seq
      this.playCyberArp(this.measure, beatNumber, time, this.threatLevel);

      // 4. Lead Melody (When threat is high or specific moments)
      if (this.threatLevel >= 1) {
          this.playLeadMelody(this.measure, beatNumber, time);
      }
  }

  private playCyberArp(measure: number, beatNumber: number, time: number, intensity: number) {
      // Faster, pluckier arps for higher stages
      // Sequences scale up in pitch with intensity
      const octOffset = intensity >= 3 ? 1 : 0; // Higher octave for boss stages
      
      const sequences = [
          ['A4', 'D5', 'F5', 'A5'], 
          ['F4', 'Bb4', 'D5', 'F5'], 
          ['G4', 'Bb4', 'D5', 'G5'], 
          ['A4', 'C#5', 'E5', 'G5'] 
      ];
      const seq = sequences[measure % sequences.length];
      const idx = (beatNumber / 2) % 4;
      
      if (beatNumber % 2 !== 0) return; // Only play on 8th notes

      const note = seq[Math.floor(idx)];
      const freq = NOTE_FREQS[note];
      
      if (freq && this.ctx) {
          const finalFreq = freq * (octOffset === 1 ? 2 : 1);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(finalFreq, time);
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2000, time);
          filter.frequency.exponentialRampToValueAtTime(500, time + 0.1);
          
          gain.gain.setValueAtTime(0.08 * this.musicVolume, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
          
          osc.connect(filter).connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 0.2);
      }
  }

  private playLeadMelody(measure: number, beatNumber: number, time: number) {
      // Stage 1 Lead
      const sequences = [
          // Meas 0: Dm
          [
              { b: 0, n: 'A4' }, { b: 3, n: 'D5' }, { b: 6, n: 'A4' }, 
              { b: 8, n: 'F4' }, { b: 10, n: 'E4' }, { b: 12, n: 'D4' }, { b: 14, n: 'E4' }
          ],
          // Meas 1: Bb
          [
              { b: 0, n: 'F4' }, { b: 3, n: 'Bb4' }, { b: 6, n: 'F4' }, 
              { b: 8, n: 'D4' }, { b: 10, n: 'C4' }, { b: 12, n: 'Bb3' }, { b: 14, n: 'C4' }
          ],
          // Meas 2: Gm
          [
              { b: 0, n: 'D4' }, { b: 3, n: 'G4' }, { b: 6, n: 'D4' }, 
              { b: 8, n: 'Bb3' }, { b: 10, n: 'A3' }, { b: 12, n: 'G3' }, { b: 14, n: 'A3' }
          ],
          // Meas 3: A
          [
              { b: 0, n: 'E4' }, { b: 3, n: 'A4' }, { b: 6, n: 'E4' }, 
              { b: 8, n: 'C#4' }, { b: 10, n: 'D4' }, { b: 12, n: 'E4' }, { b: 14, n: 'G4' }
          ]
      ];

      const events = sequences[measure % sequences.length];
      const event = events?.find(e => e.b === beatNumber);
      
      if (event && NOTE_FREQS[event.n] && this.ctx) {
          const freq = NOTE_FREQS[event.n];
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, time);
          
          filter.type = 'lowpass';
          filter.Q.value = 5;
          filter.frequency.setValueAtTime(800, time);
          filter.frequency.exponentialRampToValueAtTime(2500, time + 0.05); 
          filter.frequency.exponentialRampToValueAtTime(600, time + 0.3);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.12 * this.musicVolume, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
          
          osc.connect(filter).connect(gain).connect(this.musicGain!);
          
          osc.start(time);
          osc.stop(time + 0.5);
      }
  }

  private playBossStab(root: string, time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(10, time + 0.5);
      
      gain.gain.setValueAtTime(0.5 * this.sfxVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playKick(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(0.5 * this.musicVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      osc.connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playHiHat(time: number, open: boolean) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, time);
      
      const decay = open ? 0.1 : 0.05;
      
      gain.gain.setValueAtTime(0.1 * this.musicVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + decay);
  }

  public play(type: AudioEvent, data?: AudioPlayData) {
      if (!this.isInitialized) this.init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;

      switch(type) {
          case 'MOVE': {
              const mOsc = this.ctx.createOscillator();
              const mGain = this.ctx.createGain();
              mOsc.type = 'sine';
              mOsc.frequency.setValueAtTime(800, now);
              mOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
              mGain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
              mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
              mOsc.connect(mGain).connect(this.sfxGain!);
              mOsc.start(now);
              mOsc.stop(now + 0.05);
              break;
          }
          case 'UI_HARD_CLICK': {
              const uOsc = this.ctx.createOscillator();
              const uGain = this.ctx.createGain();
              uOsc.type = 'square';
              uOsc.frequency.setValueAtTime(1200, now);
              uGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              uGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
              uOsc.connect(uGain).connect(this.sfxGain!);
              uOsc.start(now);
              uOsc.stop(now + 0.05);
              break;
          }
          case 'CLI_BURST': {
              for(let i=0; i<3; i++) {
                  const bOsc = this.ctx.createOscillator();
                  const bGain = this.ctx.createGain();
                  bOsc.type = 'sawtooth';
                  bOsc.frequency.setValueAtTime(800 + i*200, now + i*0.05);
                  bGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i*0.05);
                  bGain.gain.exponentialRampToValueAtTime(0.001, now + i*0.05 + 0.05);
                  bOsc.connect(bGain).connect(this.sfxGain!);
                  bOsc.start(now + i*0.05);
                  bOsc.stop(now + i*0.05 + 0.05);
              }
              break;
          }
          case 'XP_COLLECT': {
              const xOsc = this.ctx.createOscillator();
              const xGain = this.ctx.createGain();
              xOsc.type = 'sine';
              xOsc.frequency.setValueAtTime(1200, now);
              xOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
              xGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              xGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
              xOsc.connect(xGain).connect(this.sfxGain!);
              xOsc.start(now);
              xOsc.stop(now + 0.1);
              break;
          }
          case 'SHOOT': {
              const sOsc = this.ctx.createOscillator();
              const sGain = this.ctx.createGain();
              sOsc.type = 'triangle';
              sOsc.frequency.setValueAtTime(800, now);
              sOsc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
              sGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
              sOsc.connect(sGain).connect(this.sfxGain!);
              sOsc.start(now);
              sOsc.stop(now + 0.15);
              break;
          }
          case 'HIT': {
              const hOsc = this.ctx.createOscillator();
              const hGain = this.ctx.createGain();
              hOsc.type = 'sawtooth';
              hOsc.frequency.setValueAtTime(100, now);
              hOsc.frequency.linearRampToValueAtTime(50, now + 0.1);
              hGain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
              hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
              hOsc.connect(hGain).connect(this.sfxGain!);
              hOsc.start(now);
              hOsc.stop(now + 0.1);
              break;
          }
          case 'ENEMY_DESTROY': {
              const dOsc = this.ctx.createOscillator();
              const dGain = this.ctx.createGain();
              dOsc.type = 'square';
              dOsc.frequency.setValueAtTime(200, now);
              dOsc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
              dGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
              dOsc.connect(dGain).connect(this.sfxGain!);
              dOsc.start(now);
              dOsc.stop(now + 0.2);
              break;
          }
          case 'GAME_OVER': {
              const gOsc = this.ctx.createOscillator();
              const gGain = this.ctx.createGain();
              gOsc.type = 'sawtooth';
              gOsc.frequency.setValueAtTime(440, now);
              gOsc.frequency.exponentialRampToValueAtTime(10, now + 1.0);
              gGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
              gGain.gain.linearRampToValueAtTime(0, now + 1.0);
              gOsc.connect(gGain).connect(this.sfxGain!);
              gOsc.start(now);
              gOsc.stop(now + 1.0);
              break;
          }
          case 'CLI_POWER': {
              const pOsc = this.ctx.createOscillator();
              const pGain = this.ctx.createGain();
              pOsc.type = 'sine';
              pOsc.frequency.setValueAtTime(50, now);
              pOsc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
              pGain.gain.setValueAtTime(0, now);
              pGain.gain.linearRampToValueAtTime(0.2 * this.sfxVolume, now + 0.1);
              pGain.gain.linearRampToValueAtTime(0, now + 0.5);
              pOsc.connect(pGain).connect(this.sfxGain!);
              pOsc.start(now);
              pOsc.stop(now + 0.5);
              break;
          }
          case 'ARCHIVE_LOCK': {
              const aOsc = this.ctx.createOscillator();
              const aGain = this.ctx.createGain();
              aOsc.type = 'sawtooth';
              aOsc.frequency.setValueAtTime(150, now);
              aGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              aGain.gain.linearRampToValueAtTime(0, now + 0.1);
              aOsc.connect(aGain).connect(this.sfxGain!);
              aOsc.start(now);
              aOsc.stop(now + 0.1);
              break;
          }
          case 'LEVEL_UP': {
              [440, 554.37, 659.25].forEach((f, i) => {
                  if (!this.ctx) return;
                  const lOsc = this.ctx.createOscillator();
                  const lGain = this.ctx.createGain();
                  lOsc.type = 'triangle';
                  lOsc.frequency.setValueAtTime(f, now + i*0.1);
                  lGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i*0.1);
                  lGain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.3);
                  lOsc.connect(lGain).connect(this.sfxGain!);
                  lOsc.start(now + i*0.1);
                  lOsc.stop(now + i*0.1 + 0.3);
              });
              break;
          }
          case 'SHIELD_HIT': {
              const shOsc = this.ctx.createOscillator();
              const shGain = this.ctx.createGain();
              shOsc.type = 'sine';
              shOsc.frequency.setValueAtTime(800, now);
              shOsc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
              shGain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
              shGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
              shOsc.connect(shGain).connect(this.sfxGain!);
              shOsc.start(now);
              shOsc.stop(now + 0.2);
              break;
          }
          case 'EMP': {
              // Quick bass drop
              const eOsc = this.ctx.createOscillator();
              const eGain = this.ctx.createGain();
              eOsc.frequency.setValueAtTime(200, now);
              eOsc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
              eGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
              eGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
              eOsc.connect(eGain).connect(this.sfxGain!);
              eOsc.start(now);
              eOsc.stop(now + 0.5);
              break;
          }
          case 'ENEMY_SPAWN': {
              const spOsc = this.ctx.createOscillator();
              const spGain = this.ctx.createGain();
              spOsc.type = 'square';
              spOsc.frequency.setValueAtTime(100, now);
              spOsc.frequency.linearRampToValueAtTime(50, now + 0.1);
              spGain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
              spGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
              spOsc.connect(spGain).connect(this.sfxGain!);
              spOsc.start(now);
              spOsc.stop(now + 0.1);
              break;
          }
          case 'POWER_UP': {
              const puOsc = this.ctx.createOscillator();
              const puGain = this.ctx.createGain();
              puOsc.type = 'triangle';
              puOsc.frequency.setValueAtTime(300, now);
              puOsc.frequency.linearRampToValueAtTime(600, now + 0.3);
              puGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              puGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
              puOsc.connect(puGain).connect(this.sfxGain!);
              puOsc.start(now);
              puOsc.stop(now + 0.3);
              break;
          }
          case 'BONUS': {
              [600, 800, 1000].forEach((f, i) => {
                  if (!this.ctx) return;
                  const bOsc = this.ctx.createOscillator();
                  const bGain = this.ctx.createGain();
                  bOsc.type = 'sine';
                  bOsc.frequency.setValueAtTime(f, now + i*0.08);
                  bGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i*0.08);
                  bGain.gain.exponentialRampToValueAtTime(0.001, now + i*0.08 + 0.2);
                  bOsc.connect(bGain).connect(this.sfxGain!);
                  bOsc.start(now + i*0.08);
                  bOsc.stop(now + i*0.08 + 0.2);
              });
              break;
          }
          case 'COMPRESS': {
              const cOsc = this.ctx.createOscillator();
              const cGain = this.ctx.createGain();
              cOsc.type = 'sawtooth';
              cOsc.frequency.setValueAtTime(100, now);
              cOsc.frequency.linearRampToValueAtTime(500, now + 0.2);
              cGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
              cOsc.connect(cGain).connect(this.sfxGain!);
              cOsc.start(now);
              cOsc.stop(now + 0.2);
              break;
          }
          case 'HACK_COMPLETE': {
              [800, 1200].forEach((f, i) => {
                  if (!this.ctx) return;
                  const hOsc = this.ctx.createOscillator();
                  const hGain = this.ctx.createGain();
                  hOsc.type = 'square';
                  hOsc.frequency.setValueAtTime(f, now + i*0.1);
                  hGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i*0.1);
                  hGain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.2);
                  hOsc.connect(hGain).connect(this.sfxGain!);
                  hOsc.start(now + i*0.1);
                  hOsc.stop(now + i*0.1 + 0.2);
              });
              break;
          }
          case 'HACK_LOST': {
              const hlOsc = this.ctx.createOscillator();
              const hlGain = this.ctx.createGain();
              hlOsc.type = 'sawtooth';
              hlOsc.frequency.setValueAtTime(200, now);
              hlOsc.frequency.linearRampToValueAtTime(100, now + 0.3);
              hlGain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
              hlGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
              hlOsc.connect(hlGain).connect(this.sfxGain!);
              hlOsc.start(now);
              hlOsc.stop(now + 0.3);
              break;
          }
          case 'COSMETIC_UNLOCK': {
              [500, 750, 1000, 1250].forEach((f, i) => {
                  if (!this.ctx) return;
                  const cuOsc = this.ctx.createOscillator();
                  const cuGain = this.ctx.createGain();
                  cuOsc.type = 'sine';
                  cuOsc.frequency.setValueAtTime(f, now + i*0.1);
                  cuGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i*0.1);
                  cuGain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.4);
                  cuOsc.connect(cuGain).connect(this.sfxGain!);
                  cuOsc.start(now + i*0.1);
                  cuOsc.stop(now + i*0.1 + 0.4);
              });
              break;
          }
      }
  }
}

export const audio = new AudioController();