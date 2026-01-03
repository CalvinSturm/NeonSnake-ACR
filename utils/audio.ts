
import { AudioEvent, Difficulty, AudioPlayData } from '../types';

// MUSICAL CONSTANTS
const NOTE_FREQS: Record<string, number> = {
  // Octave 1 (Bass Extensions)
  'C1': 32.70, 'D1': 36.71, 'E1': 41.20, 'F1': 43.65,
  'G1': 49.00, 'G#1': 51.91, 'Ab1': 51.91,
  'A1': 55.00, 'A#1': 58.27, 'Bb1': 58.27,
  'B1': 61.74,

  // Octave 2
  'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 
  'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78, 
  'E2': 82.41, 
  'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 
  'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83, 
  'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 
  'B2': 123.47,

  // Octave 3
  'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 
  'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56, 
  'E3': 164.81, 
  'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 
  'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65, 
  'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 
  'B3': 246.94,

  // Octave 4
  'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 
  'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13, 
  'E4': 329.63, 
  'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 
  'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 
  'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 
  'B4': 493.88,

  // Octave 5
  'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 
  'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25, 
  'E5': 659.25, 
  'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 
  'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61, 
  'A5': 880.00
};

// SCALES (Arrays of Note Names for the procedural generator)
const SCALES = [
  ['D2', 'F2', 'G2', 'A2', 'C3', 'D3', 'F3', 'G3'], // D Minor Pentatonic (Default)
  ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'F3'], // C Minor Pentatonic
  ['E2', 'G2', 'A2', 'B2', 'D3', 'E3', 'G3', 'A3'], // E Minor Pentatonic
  ['F2', 'Ab2', 'Bb2', 'C3', 'Eb3', 'F3', 'Ab3', 'Bb3'] // F Minor (Dark)
];

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Hack Synth Nodes
  private hackOsc: OscillatorNode | null = null;
  private hackFilter: BiquadFilterNode | null = null;
  private hackLfo: OscillatorNode | null = null;
  private hackLfoGain: GainNode | null = null;
  private hackGain: GainNode | null = null;

  // STOP MECHANIC NODES
  private stopOsc: OscillatorNode | null = null;
  private stopGain: GainNode | null = null;
  private stopFilter: BiquadFilterNode | null = null;

  // Scheduler State
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // s
  private nextNoteTime = 0.0;
  private current16thNote = 0;
  private currentMeasure = 0; // Tracks 0-3 for 4-bar loop
  private timerID: number | null = null;

  // Dynamic Music State
  private bpm: number = 110;
  private currentScaleIndex: number = 0;
  private threatLevel: number = 0; // 0=Low, 1=Med, 2=High, 3=Boss
  private mode: 'MENU' | 'GAME' = 'MENU';
  
  // Fatigue Mitigation State (Terminal Hacking)
  private lastHackTime: number = 0;
  private hackRepetitionCount: number = 0;
  private hackVariantIndex: number = 0; // For deterministic cycling
  
  // Settings
  private musicVol = 0.3;
  private sfxVol = 0.4;

  constructor() {}

  private init() {
    if (this.ctx) return;
    const CtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new CtxClass();
    this.masterGain = this.ctx!.createGain();
    this.masterGain.connect(this.ctx!.destination);
    
    this.sfxGain = this.ctx!.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx!.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.masterGain);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  public resume() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  public startMusic() {
    this.resume();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextNoteTime = this.ctx!.currentTime + 0.1;
    this.currentMeasure = 0;
    this.current16thNote = 0;
    this.scheduler();
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.timerID !== null) window.clearTimeout(this.timerID);
  }

  public stopGameplayLoops() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      // Kill Hack Synth Immediately
      if (this.hackGain) {
          this.hackGain.gain.cancelScheduledValues(t);
          this.hackGain.gain.setTargetAtTime(0, t, 0.05); // Fast fade out
      }

      // Kill Stop Effect
      this.setStopEffect(false);
  }

  public setMode(mode: 'GAME' | 'MENU') {
      if (this.mode === mode) return;
      this.mode = mode;
      
      if (mode === 'MENU') {
          this.bpm = 90;
          this.threatLevel = 0;
      } else {
          // Keep it chill for gameplay too, just slightly faster than menu
          this.bpm = 100; 
          this.threatLevel = 0;
      }
  } 

  public setThreat(level: number) {
      if (this.threatLevel === level) return;
      // Smoothly transition threat
      this.threatLevel = level;
      
      // Dynamic BPM based on threat (Subtle increase only)
      if (this.mode === 'GAME') {
          const targetBpm = 100 + (level * 2); 
          this.bpm = targetBpm;
      }
  }

  public setStage(stage: number) {
      this.currentScaleIndex = stage % SCALES.length;
  }
  
  public getBpm() { return this.bpm; }

  public setVolume(music: number, sfx: number) {
      this.musicVol = music;
      this.sfxVol = sfx;
      if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, this.ctx?.currentTime || 0, 0.1);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx?.currentTime || 0, 0.1);
  }

  // ─────────────────────────────────────────────
  // SCHEDULER (The Heartbeat)
  // ─────────────────────────────────────────────

  private nextNote() {
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += 0.25 * secondsPerBeat; // Advance 16th note
      this.current16thNote++;
      if (this.current16thNote === 16) {
          this.current16thNote = 0;
          this.currentMeasure = (this.currentMeasure + 1) % 4; // Loop 4 bars
      }
  }

  private scheduler() {
      if (!this.ctx) return;
      // While there are notes that will need to play before the next interval, schedule them
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
          this.scheduleNote(this.current16thNote, this.nextNoteTime);
          this.nextNote();
      }
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private scheduleNote(beatNumber: number, time: number) {
      // beatNumber is 0..15 (16th notes)
      const isQuarter = beatNumber % 4 === 0;
      const isEighth = beatNumber % 2 === 0;
      const isOffBeat = beatNumber % 4 === 2;

      // Determine Harmonic Context (Shared between Menu/Game for consistency)
      // 4-Bar Loop: Dm9 -> BbMaj7 -> Gm7 -> A7
      const roots = ['D2', 'Bb1', 'G1', 'A1'];
      const currentRoot = roots[this.currentMeasure];

      // MENU MODE: Simple Chill
      if (this.mode === 'MENU') {
          // 1. Bass Pulse
          if (beatNumber === 0) {
              const f = NOTE_FREQS[currentRoot];
              if(f) this.playBass(f, time, 1.5);
              this.playMenuPad(this.currentMeasure, time);
          }
          if (beatNumber === 10) { // Syncopated pump
              const f = NOTE_FREQS[currentRoot];
              if(f) this.playBass(f, time, 0.5);
          }

          // 2. Arpeggio Sequence
          if (isEighth) {
              this.playMenuArp(this.currentMeasure, beatNumber, time);
          }
          
          // 3. Rhythm
          if (isQuarter) {
              this.playHiHat(time, 0.05);
          }
          return;
      }

      // GAME MODE: Chill Vibe (Lo-Fi / Deep House)
      const threat = this.threatLevel;

      // 1. PADS (Always on to maintain atmosphere)
      // Play on beat 0 of measure
      if (beatNumber === 0) {
          this.playMenuPad(this.currentMeasure, time);
      }

      // 2. BASS (Deep Sub)
      // Threat 0+: Sparse
      // Threat 1+: Groovy
      if (threat >= 0) {
          const f = NOTE_FREQS[currentRoot];
          if (f) {
              // Pattern: 1 . . . . . . . 1 . 1 . . . (Deep groove)
              if (beatNumber === 0) this.playSubBass(f, time, 0.8);
              
              if (threat >= 1) {
                   if (beatNumber === 8) this.playSubBass(f, time, 0.4); // Downbeat 3
                   if (beatNumber === 10) this.playSubBass(f, time, 0.4); // Syncopation
                   if (beatNumber === 14) this.playSubBass(f * 1.5, time, 0.2); // Octave/5th flick
              }
          }
      }

      // 3. DRUMS (Soft Electronic)
      // Threat 1: Add Kick
      // Threat 2: Add Rim/Hat
      if (threat >= 1) {
          if (isQuarter) this.playLofiKick(time, 1.0);
      }

      if (threat >= 2) {
          // Rimshot on 2 and 4 (Beat 4 and 12)
          if (beatNumber === 4 || beatNumber === 12) {
              this.playLofiSnare(time, 0.7);
          }
          // Hats: 16ths with dynamics
          if (isEighth) {
              // Accent offbeats
              this.playHiHat(time, isOffBeat ? 0.3 : 0.15); 
          } else if (threat >= 3) {
              // Ghost notes
              this.playHiHat(time, 0.1); 
          }
      }

      // 4. LEAD / ARP (Glassy / Focus)
      // Threat 3 (High tension/Boss) or periodic low threat
      if (threat >= 3) {
          if (isEighth) {
              // Use Menu Arp logic but different envelope
              this.playGlassArp(this.currentMeasure, beatNumber, time);
          }
      }
  }

  // ─────────────────────────────────────────────
  // INSTRUMENTATION (CHILL SET)
  // ─────────────────────────────────────────────

  private playMenuArp(measure: number, beatNumber: number, time: number) {
      const sequences = [
          ['D4', 'F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'F4'], // Dm9
          ['D4', 'F4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'F4'], // BbMaj7
          ['D4', 'G4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'G4'], // Gm7
          ['C#4', 'E4', 'G4', 'A4', 'C#5', 'A4', 'G4', 'E4']   // A7
      ];
      const seq = sequences[measure];
      const idx = (beatNumber / 2) % 8;
      const note = seq[idx];
      const freq = NOTE_FREQS[note];
      
      if (freq) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
          osc.connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 0.4);
      }
  }
  
  private playGlassArp(measure: number, beatNumber: number, time: number) {
      // Similar notes, sharper tone
      const sequences = [
          ['A4', 'D5', 'E5', 'A5'], 
          ['F4', 'Bb4', 'D5', 'F5'], 
          ['D4', 'G4', 'Bb4', 'D5'], 
          ['E4', 'A4', 'C#5', 'E5']
      ];
      const seq = sequences[measure];
      const idx = (beatNumber / 2) % 4; // 8th notes, repeat pattern twice
      const note = seq[idx];
      const freq = NOTE_FREQS[note];
      
      if (freq) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine'; // Sine for glass/bell
          osc.frequency.setValueAtTime(freq * 2, time); // Octave up
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.05, time + 0.01); // Fast attack
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          
          osc.connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 0.35);
      }
  }

  private playMenuPad(measure: number, time: number) {
      const chords = [
          ['D3', 'F3', 'A3', 'C4'], ['Bb2', 'D3', 'F3', 'A3'],
          ['G2', 'Bb2', 'D3', 'F3'], ['A2', 'C#3', 'E3', 'G3']
      ];
      const chord = chords[measure];
      chord.forEach((note, i) => {
          const freq = NOTE_FREQS[note];
          if (!freq) return;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          // Slight detune for warmth
          osc.detune.value = (i % 2 === 0 ? 4 : -4); 
          osc.type = i > 1 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          
          // Long slow swell
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.04, time + 0.5);
          gain.gain.linearRampToValueAtTime(0, time + 2.5);
          
          osc.connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 2.6);
      });
  }

  private playSubBass(freq: number, time: number, vol: number) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine'; // Deep sub
      osc.frequency.setValueAtTime(freq, time);
      
      // Slight pitch drop for kick-like punch on attack
      osc.frequency.setValueAtTime(freq + 10, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.1);

      gain.gain.setValueAtTime(vol * 0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.4);
  }

  private playBass(freq: number, time: number, duration: number) {
      // Menu Bass (Slightly buzzier)
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      filter.type = 'lowpass';
      filter.Q.value = 2;
      filter.frequency.setValueAtTime(freq * 3, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playLofiKick(time: number, vol = 1.0) {
      // Soft Thump
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.value = 150; // Muffeled
      
      gain.gain.setValueAtTime(vol * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.3);
  }

  private playLofiSnare(time: number, vol = 1.0) {
      // Click / Rimshot
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      // Short high pitched tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, time);
      
      filter.type = 'highpass';
      filter.frequency.value = 800;

      gain.gain.setValueAtTime(vol * 0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.05);
  }

  private playHiHat(time: number, vol = 1.0) {
      const bufferSize = this.ctx!.sampleRate * 0.05; // Very short
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000; // Very crisp
      const gain = this.ctx!.createGain();

      noise.connect(filter).connect(gain).connect(this.musicGain!);
      gain.gain.setValueAtTime(vol * 0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      noise.start(time);
      noise.stop(time + 0.05);
  }

  // ─────────────────────────────────────────────
  // HACK SYNTH (Continuously Variable)
  // ─────────────────────────────────────────────
  
  public setHackProgress(progress: number) {
      if (!this.ctx || this.isMuted) return;
      this.init(); 

      // Lazy Init
      if (!this.hackOsc) {
          this.hackOsc = this.ctx!.createOscillator();
          this.hackOsc.type = 'sawtooth'; // Grittier texture
          
          this.hackFilter = this.ctx!.createBiquadFilter();
          this.hackFilter.type = 'lowpass';
          
          this.hackLfo = this.ctx!.createOscillator();
          this.hackLfo.type = 'square'; // Digital switching
          
          this.hackLfoGain = this.ctx!.createGain();
          
          this.hackGain = this.ctx!.createGain();
          this.hackGain.gain.value = 0;
          
          // Audio Graph: LFO -> Osc Freq -> Filter -> Gain -> Master
          this.hackLfo.connect(this.hackLfoGain).connect(this.hackOsc.frequency);
          this.hackOsc.connect(this.hackFilter).connect(this.hackGain).connect(this.sfxGain!);
          
          this.hackOsc.start();
          this.hackLfo.start();
      }

      const t = this.ctx!.currentTime;

      if (progress > 0 && isFinite(progress)) {
          // Pitch: 100Hz -> 600Hz
          const freq = 100 + (progress * 500);
          
          // LFO Rate: 10Hz (idle hum) -> 60Hz (data stream)
          const lfoRate = 10 + (progress * 50);
          
          // Filter opens up: 200Hz -> 3000Hz (Brightness increases)
          const filterFreq = 200 + (Math.pow(progress, 2) * 2800);

          this.hackOsc.frequency.setTargetAtTime(freq, t, 0.1);
          this.hackLfo!.frequency.setTargetAtTime(lfoRate, t, 0.1);
          this.hackLfoGain!.gain.setTargetAtTime(20, t, 0.1); // Constant modulation depth
          this.hackFilter!.frequency.setTargetAtTime(filterFreq, t, 0.1);
          
          // Fade In
          this.hackGain!.gain.setTargetAtTime(0.15, t, 0.05);
      } else {
          // Fade Out
          this.hackGain!.gain.setTargetAtTime(0, t, 0.1);
      }
  }

  // ─────────────────────────────────────────────
  // TIME STOP EFFECT
  // ─────────────────────────────────────────────
  public setStopEffect(active: boolean) {
      if (!this.ctx || this.isMuted) return;
      
      const t = this.ctx.currentTime;

      // Lazy Init
      if (!this.stopOsc) {
          this.stopOsc = this.ctx.createOscillator();
          this.stopOsc.type = 'sawtooth';
          this.stopOsc.frequency.value = 50; // Low drone

          this.stopGain = this.ctx.createGain();
          this.stopGain.gain.value = 0;

          this.stopFilter = this.ctx.createBiquadFilter();
          this.stopFilter.type = 'lowpass';
          this.stopFilter.frequency.value = 200;

          this.stopOsc.connect(this.stopFilter).connect(this.stopGain).connect(this.sfxGain!);
          this.stopOsc.start();
      }

      if (active) {
          // Fade In / Pitch Up
          // this.stopOsc.frequency.setTargetAtTime(100, t, 0.5); // Rise pitch slightly
          this.stopGain!.gain.setTargetAtTime(0.15, t, 0.1);
          this.stopFilter!.frequency.setTargetAtTime(800, t, 0.2); // Open filter
      } else {
          // Fade Out
          // this.stopOsc.frequency.setTargetAtTime(50, t, 0.1);
          this.stopGain!.gain.setTargetAtTime(0, t, 0.1);
          this.stopFilter!.frequency.setTargetAtTime(200, t, 0.1);
      }
  }

  // ─────────────────────────────────────────────
  // TERMINAL HACK (Anti-Fatigue)
  // ─────────────────────────────────────────────
  
  private playTerminalHack(type: string = 'RESOURCE') {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      
      // 1. Dynamic Attenuation
      // Check if last hack was recent (< 1s) to prevent stacking volume
      const timeSinceLast = t - this.lastHackTime;
      if (timeSinceLast < 1.0) {
          this.hackRepetitionCount = Math.min(4, this.hackRepetitionCount + 1);
      } else {
          this.hackRepetitionCount = 0;
      }
      this.lastHackTime = t;

      // Attenuate volume based on rapid repetition
      const attenuation = Math.pow(0.8, this.hackRepetitionCount);
      const baseVol = 0.3; 
      const finalVol = baseVol * attenuation;
      
      // 2. Deterministic Variance (Cycle through 4 variations)
      this.hackVariantIndex = (this.hackVariantIndex + 1) % 4;
      const detune = [0, 50, -30, 20][this.hackVariantIndex];

      // 3. Audio Graph Construction
      const isMemory = type === 'MEMORY';
      const isOverride = type === 'OVERRIDE';
      
      // A. Heavy Bass confirmation (Impact)
      const oscA = this.ctx.createOscillator();
      const gainA = this.ctx.createGain();
      oscA.type = isOverride ? 'sawtooth' : 'sine';
      oscA.frequency.value = isMemory ? 110 : (isOverride ? 55 : 220); 
      oscA.frequency.exponentialRampToValueAtTime(oscA.frequency.value * 0.5, t + 0.3);
      
      gainA.gain.setValueAtTime(0.5 * finalVol, t);
      gainA.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      oscA.connect(gainA).connect(this.sfxGain!);
      oscA.start(t);
      oscA.stop(t + 0.4);

      // B. High Pitch Data Burst (The "Chirp")
      const oscB = this.ctx.createOscillator();
      const gainB = this.ctx.createGain();
      oscB.type = 'square';
      oscB.frequency.value = isMemory ? 880 : (isOverride ? 440 : 1760);
      oscB.detune.value = detune;

      // Quick arpeggio feel by frequency ramp
      oscB.frequency.setValueAtTime(800, t);
      oscB.frequency.linearRampToValueAtTime(2000, t + 0.1);
      
      gainB.gain.setValueAtTime(0.1 * finalVol, t);
      gainB.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      // Lowpass to tame the square wave
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      oscB.connect(filter).connect(gainB).connect(this.sfxGain!);
      oscB.start(t);
      oscB.stop(t + 0.2);
  }

  // ─────────────────────────────────────────────
  // SFX ONE-SHOTS
  // ─────────────────────────────────────────────

  public play(event: AudioEvent, data?: AudioPlayData) {
    this.resume();
    if (!this.ctx || this.isMuted) return;
    
    // Safety check for suspended context
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
    
    switch (event) {
        case 'MOVE': this.playTone(150, 'triangle', 0.05, 0, true, 0.05); break;
        case 'EAT': this.playEat(data?.multiplier ?? 1); break;
        case 'XP_COLLECT': this.playTone(660, 'sine', 0.05, 0, true, 0.1); break; // Reduced from 880
        case 'SHOOT': this.playTone(800, 'square', 0.05, 0, true, 0.1); break;
        case 'EMP': this.playTone(50, 'sawtooth', 1.0, 0, true, 0.5); break;
        case 'HIT': this.playTone(200, 'sawtooth', 0.1, 0, true, 0.2); break;
        case 'GAME_OVER': this.playTone(80, 'sawtooth', 1.5, 0, true, 0.6); break;
        case 'LEVEL_UP': this.playLevelUp(data?.level || 1); break; 
        case 'BONUS': this.playBonusSound(); break; // Replaced beep with chime
        case 'POWER_UP': this.playTone(400, 'sine', 0.5, 0, true, 0.3); break;
        case 'SHIELD_HIT': this.playTone(400, 'square', 0.1, 0, true, 0.2); break; 
        case 'ENEMY_DESTROY': this.playEnemyDeath(); break;
        case 'COSMETIC_UNLOCK': this.playCosmeticUnlock(); break;
        
        case 'HACK_LOST': 
            if (this.hackGain && this.ctx) this.hackGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            break; 
        case 'HACK_COMPLETE': 
            this.playTerminalHack(data?.terminalType || 'RESOURCE');
            break; 
            
        case 'ENEMY_SPAWN': this.playTone(80, 'sawtooth', 0.5, 0, true, 0.2); break;
        case 'COMPRESS': this.playTone(600, 'sawtooth', 0.1, 0, true, 0.2); break;
        case 'ARCHIVE_LOCK': this.playArchiveLock(); break;

        // CLI / INIT EVENTS
        case 'CLI_POWER': this.playPowerClick(); break;
        case 'CLI_BURST': this.playDataBurst(); break;
        case 'GLITCH_TEAR': this.playGlitchTear(); break;
        case 'SYS_RECOVER': this.playSystemRecover(); break;
        case 'UI_HARD_CLICK': this.playHardClick(); break;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0, fade: boolean = true, vol: number = 0.1) {
    if (!this.ctx || this.isMuted) return;
    if (!isFinite(freq) || !isFinite(duration) || !isFinite(vol)) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
    if (fade) {
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    } else {
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay + duration);
    }
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration + 0.1);
  }

  private playEat(mult: number) {
      const safeMult = isFinite(mult) ? mult : 1;
      this.playTone(400 + (safeMult * 50), 'sine', 0.1, 0, true, 0.1);
  }
  
  private playLevelUp(level: number) {
      // Changed from square to triangle/sine for softer sound
      this.playTone(440, 'triangle', 0.3, 0, true, 0.1);
      this.playTone(554, 'triangle', 0.3, 0.1, true, 0.1);
      this.playTone(659, 'triangle', 0.5, 0.2, true, 0.1);
  }

  private playBonusSound() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      // Fundamental (C5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 523.25;
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc1.connect(gain1).connect(this.sfxGain!);
      osc1.start(t);
      osc1.stop(t + 0.6);

      // Harmonic (C6) for sparkle
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 1046.50;
      gain2.gain.setValueAtTime(0.05, t); 
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc2.connect(gain2).connect(this.sfxGain!);
      osc2.start(t);
      osc2.stop(t + 0.4);
  }

  private playEnemyDeath() {
      this.playTone(100, 'sawtooth', 0.1, 0, true, 0.2);
      this.playTone(50, 'square', 0.15, 0, true, 0.2);
  }

  private playArchiveLock() {
      this.playTone(150, 'sawtooth', 0.2, 0, true, 0.2);
      this.playTone(100, 'sawtooth', 0.2, 0.1, true, 0.2);
  }
  
  private playCosmeticUnlock() {
      // Gentle chord (C5 + E5)
      this.playTone(523.25, 'sine', 0.5, 0, true, 0.1);
      this.playTone(659.25, 'sine', 0.5, 0.1, true, 0.1);
  }

  // ─── INIT SEQUENCE SOUNDS ───

  private playPowerClick() {
      // Short dry relay click. High-pass noise burst.
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.01, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.01);
      
      noise.connect(filter).connect(gain).connect(this.sfxGain!);
      noise.start(t);
  }

  private playDataBurst() {
      // 3-4 short high beeps (chirps)
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const count = 3 + Math.floor(Math.random() * 2);
      
      for(let i=0; i<count; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const offset = i * 0.05 + (Math.random() * 0.02);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t + offset);
          
          gain.gain.setValueAtTime(0.05, t + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);
          
          osc.connect(gain).connect(this.sfxGain!);
          osc.start(t + offset);
          osc.stop(t + offset + 0.05);
      }
  }

  private playGlitchTear() {
      // Broadband noise tear
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const duration = 0.15;
      
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1;
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.linearRampToValueAtTime(3000, t + duration); // Sweep up
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0, t + duration);
      
      noise.connect(filter).connect(gain).connect(this.sfxGain!);
      noise.start(t);
  }

  private playSystemRecover() {
      // Single diagnostic tone
      this.playTone(660, 'sine', 0.4, 0, true, 0.2);
  }

  private playHardClick() {
      // Muted mechanical click (Lower pitch than normal UI move)
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.06);
  }
}

export const audio = new AudioController();
