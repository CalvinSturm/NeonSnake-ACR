
import { MUSIC_BPM } from '../constants';

// Note Frequencies
const NOTE_FREQS: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D#5': 622.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

const SCALES = [
    ['C3', 'D3', 'D#3', 'F3', 'G3', 'G#3', 'A#3', 'C4'], // C Minor
    ['C3', 'C#3', 'E3', 'F3', 'G3', 'G#3', 'B3', 'C4'],  // Phrygian Dominant
    ['C3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C4']    // Lydian
];

const MUSIC_LAYERS = {
  BASE: 'BASE',
  PULSE: 'PULSE',
  RHYTHM: 'RHYTHM',
  LEAD: 'LEAD',
  HYPE: 'HYPE',
  BOSS: 'BOSS'
};

const BASS_PATTERNS = [
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Eighths
];

const HYPE_PATTERN = [0, null, 3, null, 5, null, 7, 8, null, 7, null, 5, 3, null, 0, null];

class AudioController {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  
  isMuted: boolean = false;
  musicVolume: number = 0.3;
  sfxVolume: number = 0.4;

  // Music Scheduler State
  nextNoteTime: number = 0;
  currentBeat: number = 0;
  timerID: number | null = null;
  
  mode: 'MENU' | 'GAME' | 'INTRO' = 'MENU';
  activeLayers: Set<string> = new Set([MUSIC_LAYERS.BASE]);
  introBeatCount: number = 0;
  
  currentScaleIndex: number = 0;
  
  // Hack SFX (Sustained)
  hackOsc: OscillatorNode | null = null;
  hackGain: GainNode | null = null;
  hackLfo: OscillatorNode | null = null;
  hackLfoGain: GainNode | null = null;

  menuInteractionCount: number = 0;
  menuBarCount: number = 0;

  // Rate Limiting
  private lastHitTime: number = 0;

  init() {
    if (this.ctx) return;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);
    
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);
  }

  setVolume(music: number, sfx: number) {
      this.musicVolume = music;
      this.sfxVolume = sfx;
      if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, this.ctx?.currentTime || 0, 0.1);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx?.currentTime || 0, 0.1);
  }

  setMode(mode: 'MENU' | 'GAME' | 'INTRO') {
      this.mode = mode;
      if (mode === 'INTRO') {
          this.introBeatCount = 0;
          this.currentBeat = 0;
      }
      // Reset progression counters when entering menu
      if (mode === 'MENU') {
          this.menuBarCount = 0;
      }
  }

  setLayers(layers: string[]) {
      this.activeLayers = new Set(layers);
  }

  startMusic() {
      this.init();
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      if (this.timerID) return;

      this.nextNoteTime = this.ctx!.currentTime + 0.1;
      this.scheduler();
  }

  stopMusic() {
      if (this.timerID) {
          window.clearTimeout(this.timerID);
          this.timerID = null;
      }
      this.stopSustained();
  }
  
  public stopSustained() {
    // Teardown all sustained SFX nodes immediately
    if (!this.ctx || !this.hackOsc || !this.hackGain) return;
    
    const t = this.ctx.currentTime;
    
    // 1. Release Envelope
    try {
        this.hackGain.gain.cancelScheduledValues(t);
        this.hackGain.gain.setValueAtTime(this.hackGain.gain.value, t);
        this.hackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    } catch (e) {
        // Ignore gain errors
    }
    
    // 2. Capture and Nullify
    const osc = this.hackOsc;
    const lfo = this.hackLfo;
    const gain = this.hackGain;
    const lfoGain = this.hackLfoGain;

    this.hackOsc = null;
    this.hackLfo = null;
    this.hackGain = null;
    this.hackLfoGain = null;

    // 3. Disconnect after release
    setTimeout(() => {
        try {
            osc.stop();
            lfo?.stop();
            osc.disconnect();
            lfo?.disconnect();
            gain.disconnect();
            lfoGain?.disconnect();
        } catch(e) {
            // Ignore context errors on stop
        }
    }, 60);
  }

  getBpm() {
      return MUSIC_BPM;
  }

  private scheduler() {
      const lookahead = 25.0; 
      const scheduleAheadTime = 0.1; 

      if (!this.ctx) return;

      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
          this.scheduleNote(this.currentBeat, this.nextNoteTime);
          this.nextNote();
      }
      
      this.timerID = window.setTimeout(() => this.scheduler(), lookahead);
  }

  private nextNote() {
      const secondsPerBeat = 60.0 / MUSIC_BPM;
      this.nextNoteTime += 0.25 * secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % 16;
  }

  // RECONSTRUCTED PRIVATE METHODS
  private scheduleNote(beatNumber: number, time: number) {
      if (!this.ctx) return;
      const isQuarter = beatNumber % 4 === 0;
      const isEighth = beatNumber % 2 === 0;

      // INTRO MODE: 3 Beats Only
      if (this.mode === 'INTRO') {
          if (isQuarter) {
             if (this.introBeatCount < 3) {
                 this.playKick(time, 1.2);
                 if (this.introBeatCount === 2) {
                     this.playSnare(time, 1.0); 
                     this.playHiHat(time, 0.8);
                 } else {
                     this.playHiHat(time, 0.5);
                 }
                 this.introBeatCount++;
             }
          }
          return;
      }

      // MENU MODE: Minimal Cyber / Dark Synth
      if (this.mode === 'MENU') {
          // 1. Sub-bass Pulse (The Heartbeat of the System)
          if (beatNumber === 0) {
             this.playSubBass(time, 1.5); 
          }
          
          // 2. Cold Analog Pad (Neon Atmosphere)
          // Progressive Chord Sequence at the start of the bar (every 16 steps)
          if (beatNumber === 0) {
             // Chord Progression: Dm9 -> Bbmaj7 -> Gm9 -> A7sus4
             // Adds harmonic movement to the menu loop
             const CHORD_PROGRESSION = [
                 [NOTE_FREQS['D3'], NOTE_FREQS['F3'], NOTE_FREQS['A3'], NOTE_FREQS['E4']], // Dm9
                 [NOTE_FREQS['A#3']/2, NOTE_FREQS['F3'], NOTE_FREQS['A3'], NOTE_FREQS['D4']], // Bbmaj7 (Bb2 base)
                 [NOTE_FREQS['G3']/2, NOTE_FREQS['F3'], NOTE_FREQS['A#3'], NOTE_FREQS['D4']], // Gm9 (G2 base)
                 [NOTE_FREQS['A3']/2, NOTE_FREQS['E3'], NOTE_FREQS['G3'], NOTE_FREQS['D4']]  // Asus4 (A2 base)
             ];

             const chordIndex = this.menuBarCount % CHORD_PROGRESSION.length;
             this.playColdPad(time, 3.5, CHORD_PROGRESSION[chordIndex]); 
             
             this.menuBarCount++;
          }
          
          // Removed random arp noises for cleaner menu ambiance
          return;
      }

      // GAME MODE: LAYERED LOGIC
      const scale = SCALES[this.currentScaleIndex];
      const layers = this.activeLayers;

      // 1. BASE LAYER (Kick)
      if (layers.has(MUSIC_LAYERS.BASE)) {
          if (beatNumber === 0) this.playKick(time);
          if (beatNumber === 8) this.playKick(time, 0.9); 
      }

      // 2. PULSE LAYER (Bass Roots + Hats)
      if (layers.has(MUSIC_LAYERS.PULSE)) {
          // Hats
          if (beatNumber % 4 === 2) this.playHiHat(time, 0.3); // Offbeats
          
          // Bass Pulse (Eighths)
          if (isEighth) {
              const bassPat = BASS_PATTERNS[1]; 
              if (bassPat[beatNumber] === 1) {
                  const note = scale[0];
                  const freq = NOTE_FREQS[note];
                  if (freq && isFinite(freq)) this.playBass(freq, time, 0.2);
              }
          }
      }

      // 3. RHYTHM LAYER (Snare + Syncopation)
      if (layers.has(MUSIC_LAYERS.RHYTHM)) {
          // Snare on 5 (Beat 2) and 13 (Beat 4)
          if (beatNumber === 4 || beatNumber === 12) {
              this.playSnare(time, 0.6);
          }
          // Extra Kick Syncopation
          if (beatNumber === 14) this.playKick(time, 0.7);
          
          // 16th Hats
          if (!isEighth) this.playHiHat(time, 0.15); 
      }

      // 4. LEAD LAYER (Melody / Arps)
      if (layers.has(MUSIC_LAYERS.LEAD)) {
          if (isEighth) {
              const noteIdx = Math.floor(Math.random() * 4); 
              const noteName = scale[noteIdx + 4]; // Shift up octave
              const freq = NOTE_FREQS[noteName];
              if (Math.random() > 0.4 && freq && isFinite(freq)) {
                  this.playLead(freq, time, 0.1);
              }
          }
      }

      // 5. HYPE LAYER (Deterministic Melody)
      if (layers.has(MUSIC_LAYERS.HYPE)) {
          const noteIndex = HYPE_PATTERN[beatNumber];
          if (noteIndex !== undefined && noteIndex !== null) {
              const noteName = scale[noteIndex]; 
              const freq = NOTE_FREQS[noteName];
              if (freq) {
                  // Play one octave higher for melody cut
                  this.playHypeSynth(freq * 2, time, 0.15);
              }
          }
      }
      
      // 6. BOSS LAYER (Override Intensity)
      if (layers.has(MUSIC_LAYERS.BOSS)) {
           // Driving Kick (Four on the floor + syncopation)
           if (isQuarter) this.playKick(time, 1.0);
           if (beatNumber === 14 || beatNumber === 6) this.playKick(time, 0.8);
           
           // Hard Snare
           if (beatNumber === 4 || beatNumber === 12) this.playSnare(time, 0.9);
           
           // Fast Hats
           this.playHiHat(time, beatNumber % 2 === 0 ? 0.4 : 0.2);
           
           // Octave Bass
           if (isEighth) {
               const note = scale[0];
               const freq = NOTE_FREQS[note];
               if (freq && isFinite(freq)) {
                   const oct = beatNumber % 4 === 0 ? 1 : 2;
                   this.playBass(freq * oct, time, 0.15);
               }
           }
           
           // Aggressive Lead
           if (beatNumber % 4 === 0 || Math.random() < 0.3) {
               const noteIdx = Math.floor(Math.random() * 5); 
               const noteName = scale[noteIdx + 4]; 
               const freq = NOTE_FREQS[noteName];
               if (freq) this.playLead(freq, time, 0.2);
           }
      }
  }

  // ─────────────────────────────────────────────
  // SYNTH INSTRUMENTS
  // ─────────────────────────────────────────────

  private playKick(time: number, vol = 1.0) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

      gain.gain.setValueAtTime(vol * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playSubBass(time: number, duration: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = 36.71; 
      
      filter.type = 'lowpass';
      filter.frequency.value = 120; 

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.4, time + 0.2); 
      gain.gain.linearRampToValueAtTime(0.3, time + duration * 0.5); 
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration); 

      osc.connect(filter).connect(gain).connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + duration + 0.1);
  }

  private playColdPad(time: number, duration: number, freqs: number[]) {
      if (!this.ctx) return;
      
      freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, time);
          
          osc.detune.value = (Math.random() - 0.5) * 10;
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, time);
          filter.frequency.linearRampToValueAtTime(600, time + duration/2);

          const vol = 0.04 - (i * 0.005); 
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(vol, time + 2.0); 
          gain.gain.linearRampToValueAtTime(0, time + duration); 

          osc.connect(filter).connect(gain).connect(this.musicGain!);
          osc.start(time);
          osc.stop(time + duration);
      });
  }

  private playGlitchArtifact(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(8000, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
      
      filter.type = 'highpass';
      filter.frequency.value = 2000;

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      // FIXED: Transient SFX must route to SFX bus, not Music bus
      osc.connect(filter).connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.1);
  }

  private playSnare(time: number, vol = 1.0) {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.5; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseGain = this.ctx.createGain();
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.musicGain!);

      noiseGain.gain.setValueAtTime(vol * 0.5, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      noise.start(time);
      noise.stop(time + 0.2);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, time);
      oscGain.gain.setValueAtTime(vol * 0.3, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      osc.connect(oscGain);
      oscGain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.1);
  }

  private playHiHat(time: number, vol = 1.0) {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = this.ctx.createGain();

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      gain.gain.setValueAtTime(vol * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      noise.start(time);
      noise.stop(time + 0.05);
  }

  private playBass(freq: number, time: number, duration: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      filter.type = 'lowpass';
      filter.Q.value = 5;
      filter.frequency.setValueAtTime(freq * 1.5, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration); 

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + duration);
  }

  private playLead(freq: number, time: number, duration: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playHypeSynth(freq: number, time: number, duration: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, time);
      filter.frequency.exponentialRampToValueAtTime(freq, time + duration);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + duration);
  }

  private playPad(chord: string, time: number, duration: number) {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const root = NOTE_FREQS['D3'];
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(root, time);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(root * 1.5, time); 

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.5); 
      gain.gain.linearRampToValueAtTime(0, time + duration); 

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.musicGain!);
      
      osc1.start(time);
      osc1.stop(time + duration);
      osc2.start(time);
      osc2.stop(time + duration);
  }

  public setHackProgress(progress: number) {
      if (!this.ctx || this.isMuted) return;
      this.init(); 

      if (!this.hackOsc) {
          this.hackOsc = this.ctx!.createOscillator();
          this.hackOsc.type = 'square'; 
          
          this.hackLfo = this.ctx!.createOscillator();
          this.hackLfo.type = 'square'; 
          
          this.hackLfoGain = this.ctx!.createGain();
          
          this.hackGain = this.ctx!.createGain();
          this.hackGain.gain.value = 0;
          
          this.hackLfo.connect(this.hackLfoGain).connect(this.hackOsc.frequency);
          this.hackOsc.connect(this.hackGain).connect(this.sfxGain!);
          
          this.hackOsc.start();
          this.hackLfo.start();
      }

      const t = this.ctx!.currentTime;

      if (progress > 0 && isFinite(progress)) {
          const freq = 440 + (progress * 880);
          
          const fmDepth = 300 + (progress * 200);
          const lfoRate = 50 + (progress * 100); 
          
          this.hackOsc.frequency.setTargetAtTime(freq, t, 0.1);
          this.hackLfo!.frequency.setTargetAtTime(lfoRate, t, 0.1);
          this.hackLfoGain!.gain.setTargetAtTime(fmDepth, t, 0.1);
          
          this.hackGain!.gain.setTargetAtTime(0.08, t, 0.05);
      } else {
          this.hackGain!.gain.setTargetAtTime(0, t, 0.1);
      }
  }

  private playMenuTone(type: 'HOVER' | 'CONFIRM') {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const CHORDS = [
        [NOTE_FREQS['C5'], NOTE_FREQS['G5']],
        [NOTE_FREQS['C5'], NOTE_FREQS['D#5']], 
        [NOTE_FREQS['C5'], NOTE_FREQS['A5']],
        [NOTE_FREQS['C5'], NOTE_FREQS['F5']]
    ];

    this.menuInteractionCount++;
    const harmonicIndex = this.menuInteractionCount % 4;
    const currentChord = CHORDS[harmonicIndex];

    const clickBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.005, this.ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) clickData[i] = (Math.random() * 2 - 1) * 0.5;
    
    const clickSrc = this.ctx.createBufferSource();
    clickSrc.buffer = clickBuffer;
    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 2500;
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.1, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    clickSrc.connect(clickFilter).connect(clickGain).connect(this.sfxGain!);
    clickSrc.start(t);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);

    const noteIndex = this.menuInteractionCount % 2;
    const freq = currentChord[noteIndex];

    osc.connect(filter).connect(gain).connect(this.sfxGain!);
    osc.start(t);

    if (type === 'CONFIRM') {
        osc.frequency.setValueAtTime(currentChord[0], t);
        osc.frequency.exponentialRampToValueAtTime(currentChord[0] * 1.02, t + 0.1); 

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(currentChord[1], t);
        osc2.frequency.exponentialRampToValueAtTime(currentChord[1] * 1.02, t + 0.1);
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.05, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc2.connect(filter).connect(gain2).connect(this.sfxGain!);
        osc2.start(t);
        osc2.stop(t + 0.3);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.stop(t + 0.3);
    } else {
        osc.frequency.setValueAtTime(freq, t);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.015); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); 
        osc.stop(t + 0.2);
    }
  }

  // MAIN PUBLIC PLAY
  public play(key: string, data?: any) {
      if (!this.ctx) this.init();
      if (this.isMuted) return;
      if (this.ctx?.state === 'suspended') this.ctx.resume();

      const t = this.ctx!.currentTime;

      switch(key) {
          case 'MOVE':
              this.playMenuTone('HOVER'); 
              break;
          case 'UI_HARD_CLICK':
              this.playMenuTone('CONFIRM');
              break;
          case 'EAT':
              this.playCoin(t, data?.multiplier || 1);
              break;
          case 'SHOOT':
              this.playLaser(t);
              break;
          case 'ENEMY_DESTROY':
              this.playExplosion(t);
              break;
          case 'GAME_OVER':
              this.playGameOver(t);
              break;
          case 'LEVEL_UP':
              this.playLevelUp(t);
              break;
          case 'XP_COLLECT':
              this.playXp(t);
              break;
          case 'SHIELD_HIT':
              this.playShieldHit(t);
              break;
          case 'HACK_COMPLETE':
              this.playPowerUp(t);
              break;
          case 'ARCHIVE_LOCK':
              this.playError(t);
              break;
          case 'CLI_BURST':
              this.playGlitchArtifact(t);
              break;
          case 'CLI_POWER':
              this.playPowerUp(t);
              break;
          case 'SYS_RECOVER':
              this.playPowerUp(t);
              break;
          case 'GLITCH_TEAR':
              this.playGlitchArtifact(t);
              break;
          case 'EMP':
              this.playExplosion(t);
              break;
          case 'HIT':
              // Rate limit to avoid spamming the audio engine (60ms)
              if (t - this.lastHitTime > 0.06) {
                  this.playShieldHit(t);
                  this.lastHitTime = t;
              }
              break;
          case 'BONUS':
              this.playPowerUp(t);
              break;
          case 'POWER_UP':
              this.playPowerUp(t);
              break;
          case 'ENEMY_SPAWN':
              // Silent spawn or low thud
              break;
          case 'COMPRESS':
              this.playExplosion(t);
              break;
          case 'HACK_LOST':
              this.playError(t);
              break;
          default:
              break;
      }
  }

  private playCoin(time: number, mult: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 + (mult * 100), time);
      osc.frequency.exponentialRampToValueAtTime(2000 + (mult * 200), time + 0.1);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.1);
  }

  private playLaser(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.15);
  }

  private playExplosion(time: number) {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      noise.connect(gain).connect(this.sfxGain!);
      noise.start(time);
  }

  private playGameOver(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.linearRampToValueAtTime(20, time + 1.0);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.linearRampToValueAtTime(0, time + 1.0);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 1.0);
  }

  private playLevelUp(time: number) {
      if (!this.ctx) return;
      const now = time;
      [440, 554, 659, 880].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.1, now + i*0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.1 + 0.3);
          osc.connect(gain).connect(this.sfxGain!);
          osc.start(now + i*0.1);
          osc.stop(now + i*0.1 + 0.3);
      });
  }

  private playXp(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, time);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.05);
  }

  private playShieldHit(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.linearRampToValueAtTime(100, time + 0.2);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.2);
  }

  private playPowerUp(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.linearRampToValueAtTime(600, time + 0.4);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.4);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.4);
  }

  private playError(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.15);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.15);
  }
}

export const audio = new AudioController();
