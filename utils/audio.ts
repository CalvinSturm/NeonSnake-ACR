
import { AudioEvent, AudioPlayData } from '../types';

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
  private stage: number = 1;
  private threatLevel: number = 0; // 0=Normal, 3=Boss
  private mode: 'MENU' | 'GAME' = 'MENU';
  
  // Fatigue Mitigation State
  private lastHackTime: number = 0;
  private hackRepetitionCount: number = 0;
  private hackVariantIndex: number = 0; 
  
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
      if (this.hackGain) {
          this.hackGain.gain.cancelScheduledValues(t);
          this.hackGain.gain.setTargetAtTime(0, t, 0.05); 
      }
      this.setStopEffect(false);
  }

  public setMode(mode: 'GAME' | 'MENU') {
      if (this.mode === mode) return;
      this.mode = mode;
      this.updateBpm();
  } 

  public setThreat(level: number) {
      if (this.threatLevel === level) return;
      this.threatLevel = level;
      this.updateBpm();
  }

  public setStage(stage: number) {
      if (this.stage === stage) return;
      this.stage = stage;
      this.updateBpm();
  }
  
  private updateBpm() {
      if (this.mode === 'MENU') {
          this.bpm = 90;
      } else {
          // Increase BPM slightly with every stage to keep tension
          // Caps at 135 BPM for late game
          const baseBpm = 100 + Math.min(35, (this.stage - 1) * 2.5); 
          
          // Boss Threat adds urgency (up to +10 BPM)
          // Normal threat is now always 0, so this only spikes on Boss
          this.bpm = baseBpm + (this.threatLevel * 3);
      }
  }
  
  public getBpm() { return this.bpm; }

  public setVolume(music: number, sfx: number) {
      this.musicVol = music;
      this.sfxVol = sfx;
      if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, this.ctx?.currentTime || 0, 0.1);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx?.currentTime || 0, 0.1);
  }

  // ─────────────────────────────────────────────
  // SCHEDULER
  // ─────────────────────────────────────────────

  private nextNote() {
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += 0.25 * secondsPerBeat; // 16th note
      this.current16thNote++;
      if (this.current16thNote === 16) {
          this.current16thNote = 0;
          this.currentMeasure = (this.currentMeasure + 1) % 4; 
      }
  }

  private scheduler() {
      if (!this.ctx) return;
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

      // Harmony: Dm -> Bb -> Gm -> A (Loop)
      const roots = ['D2', 'Bb1', 'G1', 'A1'];
      const currentRoot = roots[this.currentMeasure];
      const rootFreq = NOTE_FREQS[currentRoot] || 55;

      // MENU MODE: Chill
      if (this.mode === 'MENU') {
          if (beatNumber === 0) {
              if(rootFreq) this.playSubBass(rootFreq, time, 1.5);
              this.playMenuPad(this.currentMeasure, time);
          }
          if (isEighth) {
              this.playMenuArp(this.currentMeasure, beatNumber, time);
          }
          if (isQuarter) {
              this.playHiHat(time, 0.05);
          }
          return;
      }

      // GAME MODE: STAGE-BASED PROGRESSION
      // Determine cycle position (0-4) for Boss buildup
      // 0: Start, 4: Boss
      const cyclePos = (this.stage - 1) % 5; 
      
      // Determine "Tier" to floor the intensity so we don't drop to silence in later levels
      // Tier 0: Stages 1-5 (Floor 0)
      // Tier 1: Stages 6-10 (Floor 1 - adds basic rhythm)
      // Tier 2: Stages 11-15 (Floor 2 - adds full drums)
      const tier = Math.floor((this.stage - 1) / 5);
      
      // Calculate Effective Intensity (0 to 4)
      let intensity = cyclePos;
      
      // If NOT a boss stage (4), maintain a minimum intensity based on Tier
      if (intensity < 4) {
          const floor = Math.min(2, tier); 
          intensity = Math.max(intensity, floor);
      }
      
      // Boss State is now exclusively controlled by the 4th stage index OR the explicit threat flag
      const isBoss = intensity === 4 || this.threatLevel >= 3;

      // 1. DRUMS
      if (isBoss) {
          // Boss: Driving 4-on-floor with extra kicks
          if (isQuarter) this.playKick(time, 1.0);
          else if (beatNumber === 14) this.playKick(time, 0.7); // End of bar fill
          
          if (beatNumber === 4 || beatNumber === 12) this.playSnare(time, 0.9);
      } else if (intensity >= 2) {
          // High Intensity (Stages 3-4, or Tier 2+)
          if (isQuarter) this.playKick(time, 0.9);
          if (beatNumber === 4 || beatNumber === 12) this.playSnare(time, 0.7);
      } else if (intensity === 1) {
          // Medium Intensity (Stage 2, or Tier 1)
          if (beatNumber === 0 || beatNumber === 8) this.playKick(time, 0.8); // 1 and 3
          if (beatNumber === 4 || beatNumber === 12) this.playSnare(time, 0.6);
      } else {
          // Low Intensity (Stage 1 only)
          if (beatNumber === 0) this.playKick(time, 0.8);
          if (beatNumber === 10) this.playKick(time, 0.6); // Syncopated
      }

      // Hats
      if (intensity >= 1) {
          if (isEighth) this.playHiHat(time, isOffBeat ? 0.3 : 0.1);
      }
      if (intensity >= 3 || isBoss) {
          // 16th note shimmer for high tension
          if (!isEighth) this.playHiHat(time, 0.05);
      }

      // 2. BASS
      if (isBoss || intensity >= 3) {
          // Rolling Saw Bass - 8th notes
          if (isEighth) {
              const oct = (isOffBeat) ? 2 : 1; 
              this.playSawBass(rootFreq * (oct===2?2:1), time, 0.15, 0.5);
          }
      } else if (intensity >= 1) {
          // Offbeat Pulse
          if (isOffBeat) this.playSawBass(rootFreq, time, 0.2, 0.4);
      } else {
          // Long Drone
          if (beatNumber === 0) this.playSubBass(rootFreq, time, 0.8);
      }

      // 3. ARPS / SYNTHS
      // Play arps if stage intensity is high enough
      if (intensity >= 2) {
          if (isEighth) this.playCyberArp(this.currentMeasure, beatNumber, time, intensity);
      }
      
      // Boss Alarm / Stab
      if (isBoss && beatNumber === 0) {
          this.playBossStab(currentRoot, time);
      }
  }

  // ─────────────────────────────────────────────
  // INSTRUMENTS
  // ─────────────────────────────────────────────

  private playKick(time: number, vol = 1.0) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playSnare(time: number, vol = 1.0) {
      // Noise Burst
      const bufferSize = this.ctx!.sampleRate * 0.1;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = this.ctx!.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      
      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      noise.connect(noiseFilter).connect(noiseGain).connect(this.musicGain!);
      noise.start(time);

      // Body Tone
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      
      const oscGain = this.ctx!.createGain();
      oscGain.gain.setValueAtTime(vol * 0.5, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      osc.connect(oscGain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.2);
  }

  private playHiHat(time: number, vol = 1.0) {
      const bufferSize = this.ctx!.sampleRate * 0.05;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(vol * 0.3, time); // Lower mix
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      noise.connect(filter).connect(gain).connect(this.musicGain!);
      noise.start(time);
  }

  private playSawBass(freq: number, time: number, duration: number, vol: number) {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      // Filter Envelope
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);
      filter.Q.value = 2;

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(vol * 0.6, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playSubBass(freq: number, time: number, vol: number) {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(vol * 0.5, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.4);

      osc.connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.4);
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
          osc.type = i > 1 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.03, time + 0.5);
          gain.gain.linearRampToValueAtTime(0, time + 2.5);
          
          osc.connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 2.6);
      });
  }

  private playMenuArp(measure: number, beatNumber: number, time: number) {
      const sequences = [
          ['D4', 'F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'F4'],
          ['D4', 'F4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'F4'],
          ['D4', 'G4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'G4'],
          ['C#4', 'E4', 'G4', 'A4', 'C#5', 'A4', 'G4', 'E4']
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
          gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          osc.connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 0.35);
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
      const seq = sequences[measure];
      const idx = (beatNumber / 2) % 4;
      const note = seq[idx];
      const freq = NOTE_FREQS[note];
      
      if (freq) {
          const finalFreq = freq * (octOffset === 1 ? 2 : 1);
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(finalFreq, time);
          
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2000, time);
          filter.frequency.exponentialRampToValueAtTime(500, time + 0.1);
          
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
          
          osc.connect(filter).connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + 0.2);
      }
  }

  private playBossStab(root: string, time: number) {
      const freq = NOTE_FREQS[root] || 110;
      // Brass-like stab
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.01; // Detune
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, time);
      filter.frequency.linearRampToValueAtTime(3000, time + 0.1); // Swell
      filter.frequency.exponentialRampToValueAtTime(500, time + 0.5);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain).connect(this.musicGain!);
      
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 1.0);
      osc2.stop(time + 1.0);
  }

  // ─────────────────────────────────────────────
  // SFX ONE-SHOTS & FX
  // ─────────────────────────────────────────────

  public setHackProgress(progress: number) {
      if (!this.ctx || this.isMuted) return;
      this.init(); 

      if (!this.hackOsc) {
          this.hackOsc = this.ctx!.createOscillator();
          this.hackOsc.type = 'sawtooth';
          
          this.hackFilter = this.ctx!.createBiquadFilter();
          this.hackFilter.type = 'lowpass';
          
          this.hackLfo = this.ctx!.createOscillator();
          this.hackLfo.type = 'square';
          
          this.hackLfoGain = this.ctx!.createGain();
          this.hackGain = this.ctx!.createGain();
          this.hackGain.gain.value = 0;
          
          this.hackLfo.connect(this.hackLfoGain).connect(this.hackOsc.frequency);
          this.hackOsc.connect(this.hackFilter).connect(this.hackGain).connect(this.sfxGain!);
          
          this.hackOsc.start();
          this.hackLfo.start();
      }

      const t = this.ctx!.currentTime;

      if (progress > 0 && isFinite(progress)) {
          const freq = 100 + (progress * 500);
          const lfoRate = 10 + (progress * 50);
          const filterFreq = 200 + (Math.pow(progress, 2) * 2800);

          this.hackOsc.frequency.setTargetAtTime(freq, t, 0.1);
          this.hackLfo!.frequency.setTargetAtTime(lfoRate, t, 0.1);
          this.hackLfoGain!.gain.setTargetAtTime(20, t, 0.1);
          this.hackFilter!.frequency.setTargetAtTime(filterFreq, t, 0.1);
          
          this.hackGain!.gain.setTargetAtTime(0.15, t, 0.05);
      } else {
          this.hackGain!.gain.setTargetAtTime(0, t, 0.1);
      }
  }

  public setStopEffect(active: boolean) {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;

      if (!this.stopOsc) {
          this.stopOsc = this.ctx.createOscillator();
          this.stopOsc.type = 'sawtooth';
          this.stopOsc.frequency.value = 50;
          this.stopGain = this.ctx.createGain();
          this.stopGain.gain.value = 0;
          this.stopFilter = this.ctx.createBiquadFilter();
          this.stopFilter.type = 'lowpass';
          this.stopFilter.frequency.value = 200;
          this.stopOsc.connect(this.stopFilter).connect(this.stopGain).connect(this.sfxGain!);
          this.stopOsc.start();
      }

      if (active) {
          this.stopGain!.gain.setTargetAtTime(0.15, t, 0.1);
          this.stopFilter!.frequency.setTargetAtTime(800, t, 0.2); 
      } else {
          this.stopGain!.gain.setTargetAtTime(0, t, 0.1);
          this.stopFilter!.frequency.setTargetAtTime(200, t, 0.1);
      }
  }
  
  private playTerminalHack(type: string = 'RESOURCE') {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      
      const timeSinceLast = t - this.lastHackTime;
      if (timeSinceLast < 1.0) {
          this.hackRepetitionCount = Math.min(4, this.hackRepetitionCount + 1);
      } else {
          this.hackRepetitionCount = 0;
      }
      this.lastHackTime = t;

      const attenuation = Math.pow(0.8, this.hackRepetitionCount);
      const baseVol = 0.3; 
      const finalVol = baseVol * attenuation;
      
      this.hackVariantIndex = (this.hackVariantIndex + 1) % 4;
      const detune = [0, 50, -30, 20][this.hackVariantIndex];

      const isMemory = type === 'MEMORY';
      const isOverride = type === 'OVERRIDE';
      
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

      const oscB = this.ctx.createOscillator();
      const gainB = this.ctx.createGain();
      oscB.type = 'square';
      oscB.frequency.value = isMemory ? 880 : (isOverride ? 440 : 1760);
      oscB.detune.value = detune;

      oscB.frequency.setValueAtTime(800, t);
      oscB.frequency.linearRampToValueAtTime(2000, t + 0.1);
      
      gainB.gain.setValueAtTime(0.1 * finalVol, t);
      gainB.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      oscB.connect(filter).connect(gainB).connect(this.sfxGain!);
      oscB.start(t);
      oscB.stop(t + 0.2);
  }

  public play(event: AudioEvent, data?: AudioPlayData) {
    this.resume();
    if (!this.ctx || this.isMuted) return;
    
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
    
    switch (event) {
        case 'MOVE': this.playTone(150, 'triangle', 0.05, 0, true, 0.05); break;
        case 'EAT': this.playEat(data?.multiplier ?? 1); break;
        case 'XP_COLLECT': this.playTone(660, 'sine', 0.05, 0, true, 0.1); break;
        case 'SHOOT': this.playTone(800, 'square', 0.05, 0, true, 0.1); break;
        case 'EMP': this.playTone(50, 'sawtooth', 1.0, 0, true, 0.5); break;
        case 'HIT': this.playTone(200, 'sawtooth', 0.1, 0, true, 0.2); break;
        case 'GAME_OVER': this.playTone(80, 'sawtooth', 1.5, 0, true, 0.6); break;
        case 'LEVEL_UP': this.playLevelUp(data?.level || 1); break; 
        case 'BONUS': this.playBonusSound(); break;
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
      this.playTone(440, 'triangle', 0.3, 0, true, 0.1);
      this.playTone(554, 'triangle', 0.3, 0.1, true, 0.1);
      this.playTone(659, 'triangle', 0.5, 0.2, true, 0.1);
  }

  private playBonusSound() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 523.25;
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc1.connect(gain1).connect(this.sfxGain!);
      osc1.start(t);
      osc1.stop(t + 0.6);

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
      this.playTone(523.25, 'sine', 0.5, 0, true, 0.1);
      this.playTone(659.25, 'sine', 0.5, 0.1, true, 0.1);
  }

  private playPowerClick() {
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
      filter.frequency.linearRampToValueAtTime(3000, t + duration);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0, t + duration);
      
      noise.connect(filter).connect(gain).connect(this.sfxGain!);
      noise.start(t);
  }

  private playSystemRecover() {
      this.playTone(660, 'sine', 0.4, 0, true, 0.2);
  }

  private playHardClick() {
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
