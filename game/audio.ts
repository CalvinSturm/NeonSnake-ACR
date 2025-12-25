
import { AudioEvent, Difficulty } from './types';

// 🎹 D Dorian Harmonic Foundation
const ROOT_FREQ = 146.83; // D3
const SCALE = [0, 2, 3, 5, 7, 9, 10, 12]; // D Dorian Intervals

// 🎛️ THREAT & STAGE CONSTANTS
const THREAT_LEVELS = {
  LOW: 0,
  MEDIUM: 1,
  HARD: 2,
  EXPERT: 3
};

const STAGES = {
  INTRO: 0,
  DEVELOPMENT: 1,
  VARIATION: 2,
  PEAK: 3
};

class HackVoice {
    private ctx: AudioContext;
    private dest: AudioNode;
    private osc: OscillatorNode | null = null;
    private filter: BiquadFilterNode | null = null;
    private gain: GainNode | null = null;
    private lfo: OscillatorNode | null = null;
    private lfoGain: GainNode | null = null;
    public isPlaying: boolean = false;

    constructor(ctx: AudioContext, dest: AudioNode) {
        this.ctx = ctx;
        this.dest = dest;
    }

    public start() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        const t = this.ctx.currentTime;

        // Chain: OSC -> FILTER -> GAIN -> DEST
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'square'; 
        this.osc.frequency.value = 220; // Boosted base freq

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'bandpass';
        this.filter.Q.value = 5; // Sharper resonance
        this.filter.frequency.value = 800;

        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0; 

        // LFO for instability
        this.lfo = this.ctx.createOscillator();
        this.lfo.frequency.value = 15; 
        this.lfoGain = this.ctx.createGain();
        this.lfoGain.gain.value = 500; 

        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.filter.frequency);

        this.osc.connect(this.filter);
        this.filter.connect(this.gain);
        this.gain.connect(this.dest);

        this.osc.start(t);
        this.lfo.start(t);

        // Louder attack (Boosted from 0.6 to 0.75 for better presence)
        this.gain.gain.setTargetAtTime(0.75, t, 0.05);
    }

    public update(progress: number) {
        if (!this.isPlaying || !this.filter || !this.lfo || !this.lfoGain || !this.gain || !this.osc) return;

        const t = this.ctx.currentTime;
        
        // Progress 0.0 -> 1.0
        const targetFreq = 800 + (progress * 3000);
        const targetLfoRate = 15 + (progress * 30);
        // Boosted gain scaling
        const targetGain = 0.75 + (progress * 0.2); 
        const targetQ = 5 + (progress * 10); 

        this.filter.frequency.setTargetAtTime(targetFreq, t, 0.1);
        this.filter.Q.setTargetAtTime(targetQ, t, 0.1);
        this.lfo.frequency.setTargetAtTime(targetLfoRate, t, 0.1);
        this.gain.gain.setTargetAtTime(targetGain, t, 0.1);
        this.osc.frequency.setTargetAtTime(220 + (progress * 100), t, 0.1);
    }

    public stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;

        const t = this.ctx.currentTime;
        if (this.gain) {
            this.gain.gain.cancelScheduledValues(t);
            this.gain.gain.setTargetAtTime(0, t, 0.1);
        }

        const oscToStop = this.osc;
        const lfoToStop = this.lfo;

        setTimeout(() => {
            try { oscToStop?.stop(); } catch(e) {}
            try { lfoToStop?.stop(); } catch(e) {}
        }, 150);

        this.osc = null;
        this.lfo = null;
        this.filter = null;
        this.gain = null;
        this.lfoGain = null;
    }

    public implode() {
        if (!this.ctx) return;
        
        if (this.osc) {
            try { this.osc.stop(); } catch(e) {}
            this.osc = null;
        }
        if (this.lfo) {
            try { this.lfo.stop(); } catch(e) {}
            this.lfo = null;
        }

        this.filter = null;
        this.gain = null;
        this.lfoGain = null;
        this.isPlaying = false;

        const t = this.ctx.currentTime;

        // 1. Silence Snap (10ms)
        // 2. EMP Crack (White Noise Burst)
        const noise = this.ctx.createBufferSource();
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = (Math.random() * 2 - 1);
        noise.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(8000, t + 0.01);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(noiseFilter).connect(noiseGain).connect(this.dest);
        noise.start(t + 0.01);

        // 3. Sub Hit
        const sub = this.ctx.createOscillator();
        sub.frequency.setValueAtTime(150, t + 0.01);
        sub.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(1.0, t + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        sub.connect(subGain).connect(this.dest);
        sub.start(t + 0.01);
        sub.stop(t + 0.5);
    }
}

interface TrackedSource {
    source: AudioScheduledSourceNode;
    type: 'MUSIC' | 'SFX';
}

class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // 🎛️ Mixer
  private layers: Record<string, GainNode> = {};
  public isMuted: boolean = false;
  private baseVolume: number = 0.3;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.4;
  
  // 🧠 State
  private bpm: number = 132;
  private beatTime: number = 60 / 132;
  private mode: 'MENU' | 'GAME' = 'MENU';
  private currentThreat: number = 0;
  private maxThreatCap: number = 3; 
  private currentStage: number = 0;
  
  // Hacking State
  private hackProgress: number = 0;
  private hackVoice: HackVoice | null = null;
  
  // 🕒 Scheduler
  private nextNoteTime: number = 0;
  private current16th: number = 0;
  private barCount: number = 0;
  private isPlaying: boolean = false;
  private schedulerTimer: number | null = null;
  
  // 🎹 Resources
  private snareBuffer: AudioBuffer | null = null;
  private hatBuffer: AudioBuffer | null = null;
  private activeSources: TrackedSource[] = [];
  
  // 📡 Callbacks
  private beatCallbacks: (() => void)[] = [];
  private barCallbacks: (() => void)[] = [];

  constructor(volume: number) {
    this.baseVolume = volume;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = volume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      ['bass', 'drums', 'lead', 'pad', 'arp'].forEach(layer => {
          const g = this.ctx!.createGain();
          g.gain.value = 0;
          g.connect(this.musicGain!);
          this.layers[layer] = g;
      });

      this.hackVoice = new HackVoice(this.ctx, this.sfxGain);
      this.createNoiseBuffers();

    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  private createNoiseBuffers() {
      if (!this.ctx) return;
      const sr = this.ctx.sampleRate;
      
      const snareSize = sr * 0.15;
      this.snareBuffer = this.ctx.createBuffer(1, snareSize, sr);
      const snareData = this.snareBuffer.getChannelData(0);
      for (let i = 0; i < snareSize; i++) snareData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.03));

      const hatSize = sr * 0.04;
      this.hatBuffer = this.ctx.createBuffer(1, hatSize, sr);
      const hatData = this.hatBuffer.getChannelData(0);
      for (let i = 0; i < hatSize; i++) hatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.005));
  }

  public setVolume(vol: number) {
    this.baseVolume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.1);
    }
  }

  public setMusicVolume(vol: number) {
      this.musicVolume = Math.max(0, Math.min(1, vol));
      if (this.musicGain && this.ctx) {
          this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
      }
  }

  public setSfxVolume(vol: number) {
      this.sfxVolume = Math.max(0, Math.min(1, vol));
      if (this.sfxGain && this.ctx) {
          this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.1);
      }
  }

  public toggleMute() {
      if (!this.ctx || !this.masterGain) return;
      this.isMuted = !this.isMuted;
      
      if (this.isMuted) {
          this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      } else {
          if (this.ctx.state === 'suspended') this.ctx.resume();
          this.masterGain.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.1);
      }
      return this.isMuted;
  }

  public getBpm() {
      return this.bpm;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
  }

  // ─────────────────────────────────────────────
  // 🎛️ STATE CONTROL
  // ─────────────────────────────────────────────

  public setMode(mode: 'MENU' | 'GAME') {
      const changed = this.mode !== mode;
      this.mode = mode;
      
      // Force update if entering GAME to ensure layers are unmuted/rebalanced
      // even if the mode variable itself didn't change (e.g. recovery).
      if (changed || mode === 'GAME') {
          this.updateMix();
      }
  }

  public setThreat(level: number) {
    const capped = Math.max(0, Math.min(3, level));
    if (this.currentThreat === capped) return;
    
    this.currentThreat = capped;
    this.updateMix();
  }

  public setStage(stageIndex: number) {
    const s = stageIndex % 4;
    if (this.currentStage === s) return;
    this.currentStage = s;
    this.updateMix();
  }

  public setHackProgress(progress: number) {
      const p = Math.max(0, Math.min(1, progress));
      if (Math.abs(this.hackProgress - p) < 0.01 && p !== 0 && p !== 1) return;

      if (p > 0) {
          if (!this.hackVoice?.isPlaying) {
              this.hackVoice?.start();
              this.updateMix(); 
          }
          this.hackVoice?.update(p);
      } 
      else if (this.hackVoice?.isPlaying) {
          this.hackVoice?.stop();
          this.updateMix(); 
      }
      
      this.hackProgress = p;
  }

  public stopContinuous() {
      // Cleanly stop any ongoing gameplay loops that shouldn't persist in pause/menus
      if (this.hackVoice?.isPlaying) {
          this.hackVoice.stop();
      }
      this.hackProgress = 0;
  }

  public setDifficulty(difficulty: Difficulty) {
    switch (difficulty) {
        case 'EASY': 
            this.maxThreatCap = THREAT_LEVELS.MEDIUM;
            this.bpm = 124;
            break;
        case 'MEDIUM': 
            this.maxThreatCap = THREAT_LEVELS.HARD;
            this.bpm = 132;
            break;
        case 'HARD': 
            this.maxThreatCap = THREAT_LEVELS.EXPERT;
            this.bpm = 138;
            break;
        case 'INSANE': 
            this.maxThreatCap = THREAT_LEVELS.EXPERT;
            this.bpm = 144;
            break;
    }
    this.beatTime = 60 / this.bpm;
  }

  // ─────────────────────────────────────────────
  // 🕹️ PLAYBACK CONTROLS
  // ─────────────────────────────────────────────

  public startMusic() {
    if (this.isPlaying || !this.ctx) return;
    this.resume();
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.current16th = 0;
    this.barCount = 0;
    this.updateMix(0);
    this.scheduler();
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.schedulerTimer) clearTimeout(this.schedulerTimer);
    
    const t = this.ctx?.currentTime || 0;
    // Fade out music layers only
    Object.values(this.layers).forEach(g => {
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.5);
    });
    
    // Clean up MUSIC sources only (Leave SFX playing)
    this.stopMusicOscillators();
    this.hackVoice?.stop();
  }

  private trackSource(source: AudioScheduledSourceNode, type: 'MUSIC' | 'SFX') {
      const entry = { source, type };
      this.activeSources.push(entry);
      
      source.onended = () => {
          const idx = this.activeSources.indexOf(entry);
          if (idx > -1) this.activeSources.splice(idx, 1);
      };
  }

  private stopMusicOscillators() {
      // Create a copy to iterate safely while modifying original
      [...this.activeSources].forEach(entry => {
          if (entry.type === 'MUSIC') {
              try { entry.source.stop(); } catch(e) {}
              // Remove from active array manually if onended doesn't fire immediately
              const idx = this.activeSources.indexOf(entry);
              if (idx > -1) this.activeSources.splice(idx, 1);
          }
      });
  }

  // ─────────────────────────────────────────────
  // 🧠 SCHEDULER & COMPOSITION
  // ─────────────────────────────────────────────

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNote(this.current16th, this.nextNoteTime);
      this.advanceNote();
    }
    
    this.schedulerTimer = window.setTimeout(
        () => this.scheduler(),
        25
    );
  }

  private advanceNote() {
    this.nextNoteTime += 0.25 * this.beatTime; 
    this.current16th++;
    
    if (this.current16th === 16) {
        this.current16th = 0;
        this.barCount++;
    }
  }

  private updateMix(rampTime = 0.5) {
      const t = this.ctx?.currentTime || 0;
      const isHacking = this.hackVoice?.isPlaying || false;

      // Hacking Ducking
      if (isHacking) {
          this.layers['pad'].gain.setTargetAtTime(0.05, t, rampTime); 
          this.layers['bass'].gain.setTargetAtTime(0, t, rampTime);
          this.layers['drums'].gain.setTargetAtTime(0.4, t, rampTime);
          this.layers['lead'].gain.setTargetAtTime(0.2, t, rampTime);
          this.layers['arp'].gain.setTargetAtTime(0.3, t, rampTime);
          return;
      }

      // MENU MODE MIX
      if (this.mode === 'MENU') {
          this.layers['pad'].gain.setTargetAtTime(0.3, t, rampTime);
          this.layers['arp'].gain.setTargetAtTime(0.2, t, rampTime);
          this.layers['bass'].gain.setTargetAtTime(0, t, rampTime);
          this.layers['drums'].gain.setTargetAtTime(0, t, rampTime);
          this.layers['lead'].gain.setTargetAtTime(0, t, rampTime);
          return;
      }

      // GAME MODE MIX
      const effectiveThreat = Math.min(this.currentThreat, this.maxThreatCap);
      const isIntro = this.currentStage === STAGES.INTRO;
      const bassVol = 0.4 + (effectiveThreat * 0.15);
      const drumsVol = 0.4 + (effectiveThreat * 0.15);
      const padVol = Math.max(0.1, 0.5 - (effectiveThreat * 0.1));

      this.layers['pad'].gain.setTargetAtTime(padVol, t, rampTime);
      this.layers['bass'].gain.setTargetAtTime(bassVol, t, rampTime);
      this.layers['lead'].gain.setTargetAtTime(0.5, t, rampTime);
      this.layers['drums'].gain.setTargetAtTime(drumsVol, t, rampTime);
      this.layers['arp'].gain.setTargetAtTime(isIntro ? 0.2 : 0.5, t, rampTime);
  }

  private scheduleNote(beat: number, time: number) {
    if (!this.ctx) return;

    if (beat === 0) {
        this.barCallbacks.forEach(cb => cb());
        if (!this.hackVoice?.isPlaying) this.playPad(time); 
    }
    if (beat % 4 === 0) this.beatCallbacks.forEach(cb => cb());

    // In MENU mode, we only play Pad (handled above) and simple Arp
    if (this.mode === 'MENU') {
        const noteIndex = [0, 2, 4, 7, 9, 7, 4, 2, 0, -1, 0, -1, 7, 4, 2, 0][beat];
        if (noteIndex !== -1 && noteIndex !== undefined) {
            const semitones = SCALE[noteIndex % SCALE.length];
            const freq = ROOT_FREQ * Math.pow(2, semitones / 12);
            this.playArpNote(time, freq, false);
        }
        return;
    }

    const effectiveThreat = Math.min(this.currentThreat, this.maxThreatCap);
    const stage = this.currentStage;
    
    this.scheduleDrums(beat, time, effectiveThreat, stage);

    if (!this.hackVoice?.isPlaying) {
        this.scheduleBass(beat, time, effectiveThreat, stage);
        this.scheduleMelody(beat, time, effectiveThreat, stage);
    }
  }

  // ─────────────────────────────
  // 🥁 DRUMS
  // ─────────────────────────────
  private scheduleDrums(beat: number, time: number, threat: number, stage: number) {
      const isDownbeat = beat % 4 === 0;
      const isBackbeat = beat === 4 || beat === 12;

      if (threat === THREAT_LEVELS.LOW) {
          if (beat === 0) this.playKick(time);
      } else if (threat === THREAT_LEVELS.MEDIUM) {
          if (beat === 0 || beat === 8) this.playKick(time);
      } else {
          if (isDownbeat) this.playKick(time);
      }

      if (threat >= THREAT_LEVELS.MEDIUM && isBackbeat) {
          const tight = threat >= THREAT_LEVELS.HARD;
          this.playSnare(time, tight);
      }

      if (threat === THREAT_LEVELS.LOW) {
          if (beat % 4 === 2) this.playHat(time, 0.1);
      } else if (threat === THREAT_LEVELS.MEDIUM) {
          if (beat % 2 === 0) this.playHat(time, 0.15);
      } else {
          const vol = beat % 4 === 0 ? 0.3 : (beat % 2 === 0 ? 0.15 : 0.05);
          this.playHat(time, vol);
      }
  }

  // ─────────────────────────────
  // 🎸 BASS
  // ─────────────────────────────
  private scheduleBass(beat: number, time: number, threat: number, stage: number) {
      const isDownbeat = beat % 4 === 0;
      const isOffbeat = beat % 4 === 2;
      const root = ROOT_FREQ / 4; 

      if (stage === STAGES.INTRO) {
          if (beat === 0) this.playBassNote(time, root, 2.0 * this.beatTime, 300);
      } 
      else if (threat === THREAT_LEVELS.LOW) {
          if (isDownbeat) this.playBassNote(time, root, 0.5 * this.beatTime, 300);
      }
      else if (threat >= THREAT_LEVELS.HARD || stage === STAGES.PEAK) {
          const octave = (beat % 8 === 6) ? 2 : 1; 
          const filter = isDownbeat ? 800 : 400;
          this.playBassNote(time, root * octave, 0.2 * this.beatTime, filter);
      }
      else {
          if (isOffbeat) this.playBassNote(time, root, 0.4 * this.beatTime, 500);
      }
  }

  // ─────────────────────────────
  // 🎹 MELODY / ARP
  // ─────────────────────────────
  private scheduleMelody(beat: number, time: number, threat: number, stage: number) {
      const arpActive = threat >= THREAT_LEVELS.MEDIUM || stage >= STAGES.DEVELOPMENT;
      
      if (arpActive) {
          const noteIndex = stage === STAGES.VARIATION 
              ? [0, 2, 4, 7, 9, 7, 4, 2, 0, -1, 0, -1, 7, 4, 2, 0][beat] 
              : [0, 2, 4, 0, 2, 4, 7, 4, 0, 2, 4, 0, 7, 4, 2, 0][beat];

          if (noteIndex !== -1 && noteIndex !== undefined) {
              const semitones = SCALE[noteIndex % SCALE.length];
              const freq = ROOT_FREQ * Math.pow(2, semitones / 12) * (beat % 8 === 0 ? 2 : 1);
              const accent = beat % 4 === 0;
              this.playArpNote(time, freq, accent);
          }
      }
  }

  // ─────────────────────────────────────────────
  // 🔊 SYNTHESIS
  // ─────────────────────────────────────────────

  private playKick(time: number) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain).connect(this.layers['drums']);
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc.start(time);
      osc.stop(time + 0.2);
      this.trackSource(osc, 'MUSIC');
  }

  private playSnare(time: number, tight: boolean) {
      if (!this.snareBuffer) return;
      const source = this.ctx!.createBufferSource();
      source.buffer = this.snareBuffer;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = tight ? 1200 : 800;
      const gain = this.ctx!.createGain();
      source.connect(filter).connect(gain).connect(this.layers['drums']);
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + (tight ? 0.15 : 0.25));
      source.start(time);
      this.trackSource(source, 'MUSIC');
  }

  private playHat(time: number, vol: number) {
      if (!this.hatBuffer) return;
      const source = this.ctx!.createBufferSource();
      source.buffer = this.hatBuffer;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6000;
      const gain = this.ctx!.createGain();
      source.connect(filter).connect(gain).connect(this.layers['drums']);
      const v = vol + (Math.random() * 0.05); 
      gain.gain.setValueAtTime(v, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      source.start(time);
      this.trackSource(source, 'MUSIC');
  }

  private playBassNote(time: number, freq: number, dur: number, cutoff: number) {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 5;
      
      const gain = this.ctx!.createGain();
      osc.connect(filter).connect(gain).connect(this.layers['bass']);
      
      osc.frequency.setValueAtTime(freq, time);
      
      filter.frequency.setValueAtTime(cutoff, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + dur);
      
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
      
      osc.start(time);
      osc.stop(time + dur);
      this.trackSource(osc, 'MUSIC');
  }

  private playArpNote(time: number, freq: number, accent: boolean) {
      const osc = this.ctx!.createOscillator();
      osc.type = 'square';
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 2;
      
      const gain = this.ctx!.createGain();
      const pan = this.ctx!.createStereoPanner();
      pan.pan.setValueAtTime(Math.sin(time * 2) * 0.3, time);

      osc.connect(filter).connect(gain).connect(pan).connect(this.layers['lead']);
      
      osc.frequency.setValueAtTime(freq, time);
      
      filter.frequency.setValueAtTime(accent ? 3000 : 1200, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.1);
      
      gain.gain.setValueAtTime(accent ? 0.15 : 0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      
      osc.start(time);
      osc.stop(time + 0.2);
      this.trackSource(osc, 'MUSIC');
  }

  private playPad(time: number) {
      const notes = [ROOT_FREQ, ROOT_FREQ * 1.189, ROOT_FREQ * 1.498, ROOT_FREQ * 1.781];
      notes.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          osc.type = i % 2 === 0 ? 'triangle' : 'sine';
          const gain = this.ctx!.createGain();
          osc.connect(gain).connect(this.layers['pad']);
          osc.frequency.setValueAtTime(f, time);
          const duration = 4 * this.beatTime;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.05, time + 1.0);
          gain.gain.setValueAtTime(0.05, time + duration - 1.0);
          gain.gain.linearRampToValueAtTime(0, time + duration);
          
          osc.start(time);
          osc.stop(time + duration);
          
          this.trackSource(osc, 'MUSIC');
      });
  }

  // ─────────────────────────────────────────────
  // 🔌 PUBLIC HOOKS
  // ─────────────────────────────────────────────
  public onBeat(cb: () => void) { this.beatCallbacks.push(cb); }
  public onBar(cb: () => void) { this.barCallbacks.push(cb); }
  public clearCallbacks() { this.beatCallbacks = []; this.barCallbacks = []; }

  public play(event: AudioEvent, data?: { multiplier?: number, level?: number, difficulty?: Difficulty, combo?: number }) {
    if (!this.ctx || this.ctx.state === 'suspended') this.resume();
    
    switch (event) {
        case 'MOVE': this.playTone(150, 'triangle', 0.05, 0, true, 0.05); break;
        case 'EAT': this.playEat(data?.multiplier ?? 1); break;
        case 'XP_COLLECT': this.playTone(1200, 'sine', 0.05, 0, true, 0.1); break;
        case 'SHOOT': this.playTone(800, 'square', 0.05, 0, true, 0.1); break;
        case 'EMP': this.playTone(50, 'sawtooth', 1.0, 0, true, 0.5); break;
        case 'HIT': this.playTone(200, 'sawtooth', 0.1, 0, true, 0.2); break;
        case 'GAME_OVER': this.playTone(80, 'sawtooth', 1.5, 0, true, 0.6); break;
        case 'LEVEL_UP': this.playLevelUp(data?.level || 1, data?.difficulty || 'EASY', data?.combo || 1); break; 
        case 'BONUS': this.playTone(880, 'square', 0.3, 0, false, 0.2); break;
        case 'POWER_UP': this.playTone(400, 'sine', 0.5, 0, true, 0.3); break;
        case 'SHIELD_HIT': this.playTone(1200, 'square', 0.1, 0, true, 0.2); break;
        case 'ENEMY_DESTROY': this.playEnemyDeath(); break;
        case 'HACK_LOST': this.hackVoice?.stop(); break; 
        case 'HACK_COMPLETE': this.hackVoice?.implode(); break; 
        case 'ENEMY_SPAWN': this.playTone(80, 'sawtooth', 0.5, 0, true, 0.2); break;
        case 'COMPRESS': this.playTone(600, 'sawtooth', 0.1, 0, true, 0.2); break;
    }
  }

  private playLevelUp(level: number, difficulty: Difficulty | string, combo: number) {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Pitch Scaling (Difficulty)
      let root = 293.66; // D4 (EASY)
      if (difficulty === 'MEDIUM') root = 349.23; // F4
      if (difficulty === 'HARD') root = 392.00;   // G4
      if (difficulty === 'INSANE') root = 466.16; // A#4

      // 2. Variant Logic
      const isLegendary = level % 5 === 0 && level > 1; // 5, 10, 15...
      const isStandard = level > 4 && !isLegendary;
      const isSubtle = level <= 4;

      // 3. Synthesis
      if (isSubtle) {
          // SUBTLE: Clean Chime (Triangle + Sine)
          const osc1 = this.ctx.createOscillator();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(root, t);
          
          const osc2 = this.ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(root * 2, t); // Octave

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.sfxGain);

          osc1.start(t); osc1.stop(t + 0.6);
          osc2.start(t); osc2.stop(t + 0.6);
          
          this.trackSource(osc1, 'SFX');
          this.trackSource(osc2, 'SFX');
      } 
      else if (isStandard) {
          // STANDARD: Power Slide (Square + Saw)
          const osc1 = this.ctx.createOscillator();
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(root, t);
          osc1.frequency.linearRampToValueAtTime(root * 1.5, t + 0.1); // Slide up

          const osc2 = this.ctx.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(root * 1.5, t); // 5th approx
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.exponentialRampToValueAtTime(4000, t + 0.2);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);

          osc1.start(t); osc1.stop(t + 0.8);
          osc2.start(t); osc2.stop(t + 0.8);
          
          this.trackSource(osc1, 'SFX');
          this.trackSource(osc2, 'SFX');
      } 
      else {
          // LEGENDARY: Massive Chord Stack (Major 7th)
          const freqs = [root, root * 1.25, root * 1.5, root * 1.875]; // Root, 3rd, 5th, 7th
          
          const masterGain = this.ctx.createGain();
          masterGain.gain.setValueAtTime(0.5, t);
          masterGain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
          masterGain.connect(this.sfxGain);

          freqs.forEach((f, i) => {
              const osc = this.ctx!.createOscillator();
              osc.type = i === 0 ? 'sawtooth' : 'square';
              osc.detune.value = (Math.random() - 0.5) * 15; // Detune for thickness
              osc.frequency.setValueAtTime(f, t);
              osc.connect(masterGain);
              osc.start(t);
              osc.stop(t + 2.5);
              this.trackSource(osc, 'SFX');
          });

          // Sub Bass Impact
          const sub = this.ctx.createOscillator();
          sub.frequency.setValueAtTime(100, t);
          sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);
          const subGain = this.ctx.createGain();
          subGain.gain.setValueAtTime(0.8, t);
          subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
          sub.connect(subGain).connect(this.sfxGain);
          sub.start(t); sub.stop(t + 0.8);
          this.trackSource(sub, 'SFX');
      }

      // 4. Combo Sparkle (High freq glitter)
      if (combo > 1) {
          const sparkleCount = Math.min(combo, 8);
          for(let i=0; i<sparkleCount; i++) {
              const start = t + (i * 0.05);
              const osc = this.ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(root * 4 + (i * 100), start);
              
              const gain = this.ctx.createGain();
              gain.gain.setValueAtTime(0.1, start);
              gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);
              
              osc.connect(gain).connect(this.sfxGain);
              osc.start(start);
              osc.stop(start + 0.15);
              this.trackSource(osc, 'SFX');
          }
      }
  }

  private playEnemyDeath() {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      
      // 1. Sub Drop (Punchier)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
      
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
      
      // 2. White Noise Burst (Crunch)
      const noise = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<data.length; i++) data[i] = (Math.random() * 2 - 1);
      noise.buffer = buffer;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 1000;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      noise.connect(noiseFilter).connect(noiseGain).connect(this.sfxGain);
      noise.start(t);
      
      this.trackSource(osc, 'SFX');
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, ramp: boolean = true, vol: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(vol * 0.5, this.ctx.currentTime + startTime + 0.01);
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
    this.trackSource(osc, 'SFX');
  }

  private playEat(multiplier: number) {
      const freq = 440 + (multiplier * 60);
      this.playTone(freq, 'sine', 0.08, 0, true, 0.3);
  }
}

export const audio = new MusicEngine(0.3);