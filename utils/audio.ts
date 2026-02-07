import { AudioEvent, AudioPlayData } from '../types';

const NOTE_FREQS: Record<string, number> = {
    // Sub bass octave
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'Eb1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'Bb1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
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
    private _mode: 'MENU' | 'GAME' | 'DEATH' = 'MENU';

    // Music State
    private nextNoteTime = 0;
    private beatNumber = 0;
    private measure = 0;
    private tempo = 120; // Default: 120 BPM (Game Mode)
    private isMusicPlaying = false;
    private _schedulerTimer: number | null = null;

    // Dynamic Parameters
    private threatLevel = 0;
    private _currentStage = 1;
    private _hackProgress = 0;
    private _isStopEffectActive = false;

    // OMEGA atmosphere state
    private _omegaBreathPhase = 0;
    private _lastWhisperTime = 0;

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

    public setMode(mode: 'MENU' | 'GAME' | 'DEATH') {
        this._mode = mode;
        // Adjust tempo based on mode
        if (mode === 'MENU') {
            this.tempo = 50; // Very slow, ominous - OMEGA watches
        } else if (mode === 'DEATH') {
            this.tempo = 40; // Glacial pace - containment complete
        } else {
            this.tempo = 120; // Normal game speed
        }
    }

    public setThreat(level: number) {
        this.threatLevel = level;
    }

    public setStage(stage: number) {
        this._currentStage = stage;
    }

    public setHackProgress(progress: number) {
        this._hackProgress = progress;
    }

    public setStopEffect(active: boolean) {
        this._isStopEffectActive = active;
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
                if (this.measure >= 8) this.measure = 0; // Extended to 8 measures for variety
            }
        }

        this._schedulerTimer = window.setTimeout(() => this.scheduler(), 25);
    }

    private scheduleNote(beatNumber: number, time: number) {
        if (this._mode === 'MENU') {
            // ═══════════════════════════════════════════════════════════════
            // MENU MODE: "OMEGA WATCHES" — Eerie, unsettling atmosphere
            // The serpent is patient. The serpent waits.
            // ═══════════════════════════════════════════════════════════════

            // 1. Deep OMEGA drone - the heartbeat of the system
            if (beatNumber === 0) {
                this.playOmegaDrone(this.measure, time);
            }

            // 2. Dissonant pad chords - tension and unease
            if (beatNumber === 0 && this.measure % 2 === 0) {
                this.playOmegaPad(this.measure, time);
            }

            // 3. "Breathing" sub bass - OMEGA is alive
            this.playOmegaBreath(beatNumber, time);

            // 4. Whisper textures - fragments of memories
            if (Math.random() < 0.15) {
                this.playMemoryWhisper(time);
            }

            // 5. Serpent arpeggios - slow, hunting patterns
            if (beatNumber % 4 === 0) {
                this.playSerpentArp(this.measure, beatNumber, time);
            }

            // 6. Occasional glitch/static - corrupted data
            if (Math.random() < 0.08) {
                this.playDataCorruption(time);
            }

        } else if (this._mode === 'DEATH') {
            // ═══════════════════════════════════════════════════════════════
            // DEATH MODE: "CONTAINMENT COMPLETE" — Mournful, final
            // You have been protected. Forever.
            // ═══════════════════════════════════════════════════════════════

            // 1. Slow descending drone - falling into the abyss
            if (beatNumber === 0) {
                this.playDeathDrone(this.measure, time);
            }

            // 2. Funeral bells - OMEGA's lullaby
            if (beatNumber === 0 && this.measure % 2 === 0) {
                this.playFuneralBell(this.measure, time);
            }

            // 3. Reversed whispers - memories fading
            if (Math.random() < 0.1) {
                this.playFadingMemory(time);
            }

            // 4. Heartbeat slowing - containment complete
            if (beatNumber === 0 || beatNumber === 8) {
                this.playDyingHeartbeat(beatNumber, time);
            }

            // 5. OMEGA's embrace - warm but suffocating pad
            if (beatNumber === 0 && this.measure % 4 === 0) {
                this.playOmegaEmbrace(time);
            }

        } else {
            // GAME MODE: Full Rhythmic Drive
            if (beatNumber % 4 === 0) {
                this.playKick(time);
            }
            if (beatNumber % 2 === 0) {
                this.playHiHat(time, beatNumber % 4 === 2);
            }
            this.playCyberArp(this.measure, beatNumber, time, this.threatLevel);
            if (this.threatLevel >= 1) {
                this.playLeadMelody(this.measure, beatNumber, time);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OMEGA MENU MUSIC — The Serpent Watches
    // ═══════════════════════════════════════════════════════════════════════

    private playOmegaDrone(measure: number, time: number) {
        if (!this.ctx) return;

        // Deep, ominous drone that shifts between dissonant intervals
        // Tritone and minor 2nd intervals create unease
        const droneRoots = ['E1', 'Bb1', 'E1', 'F1', 'E1', 'Bb1', 'D1', 'Eb1'];
        const root = droneRoots[measure % droneRoots.length];
        const freq = NOTE_FREQS[root] || 41.20;

        // Main drone oscillator
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);

        // Detuned for thickness + slight beating
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.003, time);

        // Very dark filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(80, time);
        filter.frequency.linearRampToValueAtTime(200, time + 3);
        filter.frequency.linearRampToValueAtTime(60, time + 6);
        filter.Q.value = 2;

        const duration = 6.0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25 * this.musicVolume, time + 2);
        gain.gain.linearRampToValueAtTime(0.15 * this.musicVolume, time + 4);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain).connect(this.masterGain!);

        osc1.start(time);
        osc1.stop(time + duration);
        osc2.start(time);
        osc2.stop(time + duration);
    }

    private playOmegaPad(measure: number, time: number) {
        if (!this.ctx) return;

        // Dissonant, unsettling chord voicings
        // Using clusters and tritones for maximum unease
        const chordProgression = [
            // E minor with added b9 and #11 — cold, clinical
            ['E2', 'B2', 'F3', 'G3', 'Bb3'],
            // Bb diminished cluster — something is wrong
            ['Bb1', 'E2', 'Gb2', 'A2', 'Db3'],
            // F Phrygian voicing — ancient dread
            ['F2', 'Gb2', 'C3', 'Eb3', 'Ab3'],
            // E minor b6 — the serpent stirs
            ['E2', 'B2', 'C3', 'G3', 'B3'],
        ];

        const notes = chordProgression[Math.floor(measure / 2) % chordProgression.length];

        notes.forEach((note, i) => {
            if (!this.ctx) return;
            const freq = NOTE_FREQS[note];
            if (!freq) return;

            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            // Hollow, ghostly sound
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(freq, time);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2.01, time); // Slightly detuned octave

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq * 2, time);
            filter.Q.value = 1;

            const duration = 8.0;
            const attackTime = 3.0 + i * 0.5; // Staggered attack for movement

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.04 * this.musicVolume, time + attackTime);
            gain.gain.linearRampToValueAtTime(0.02 * this.musicVolume, time + duration - 2);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            osc1.connect(filter);
            osc2.connect(gain);
            filter.connect(gain).connect(this.masterGain!);

            osc1.start(time);
            osc1.stop(time + duration);
            osc2.start(time);
            osc2.stop(time + duration);
        });
    }

    private playOmegaBreath(beatNumber: number, time: number) {
        if (!this.ctx) return;

        // Rhythmic sub-bass "breathing" — OMEGA is alive
        this._omegaBreathPhase += 0.05;
        const breathIntensity = (Math.sin(this._omegaBreathPhase) + 1) / 2;

        if (beatNumber % 8 !== 0) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(30 + breathIntensity * 10, time);

        const duration = 2.0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2 * this.musicVolume * breathIntensity, time + 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc.connect(gain).connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + duration);
    }

    private playMemoryWhisper(time: number) {
        if (!this.ctx) return;

        // High frequency "whisper" textures — fragments of lost memories
        const now = this.ctx.currentTime;
        if (now - this._lastWhisperTime < 0.5) return;
        this._lastWhisperTime = now;

        // White noise burst filtered to sound like whispering
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000 + Math.random() * 3000;
        filter.Q.value = 5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03 * this.musicVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        source.connect(filter).connect(gain).connect(this.masterGain!);
        source.start(time);
    }

    private playSerpentArp(measure: number, beatNumber: number, time: number) {
        if (!this.ctx) return;

        // Slow, stalking arpeggio pattern — the serpent positions
        const patterns = [
            ['E3', 'G3', 'B3', 'E4'],      // E minor — watching
            ['F3', 'Ab3', 'C4', 'F4'],     // F minor — moving
            ['E3', 'Bb3', 'D4', 'E4'],     // E diminished — hunting
            ['Eb3', 'G3', 'Bb3', 'D4'],    // Eb major 7 — false comfort
        ];

        const pattern = patterns[measure % patterns.length];
        const noteIndex = Math.floor(beatNumber / 4) % pattern.length;
        const note = pattern[noteIndex];
        const freq = NOTE_FREQS[note];

        if (!freq) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.8);

        gain.gain.setValueAtTime(0.06 * this.musicVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);

        osc.connect(filter).connect(gain).connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + 1.2);
    }

    private playDataCorruption(time: number) {
        if (!this.ctx) return;

        // Digital glitch/static — corrupted memory fragments
        const duration = 0.05 + Math.random() * 0.1;

        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(100 + Math.random() * 2000, time + i * 0.02);

            gain.gain.setValueAtTime(0.02 * this.sfxVolume, time + i * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.02 + duration);

            osc.connect(gain).connect(this.sfxGain!);
            osc.start(time + i * 0.02);
            osc.stop(time + i * 0.02 + duration);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEATH SCREEN MUSIC — Containment Complete
    // ═══════════════════════════════════════════════════════════════════════

    private playDeathDrone(measure: number, time: number) {
        if (!this.ctx) return;

        // Descending drone — falling into OMEGA's embrace
        const startFreq = 60 - (measure % 4) * 5;
        const endFreq = startFreq - 10;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(startFreq, time);
        osc1.frequency.linearRampToValueAtTime(endFreq, time + 8);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(startFreq * 2, time);
        osc2.frequency.linearRampToValueAtTime(endFreq * 2, time + 8);

        filter.type = 'lowpass';
        filter.frequency.value = 150;

        const duration = 8.0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3 * this.musicVolume, time + 2);
        gain.gain.linearRampToValueAtTime(0.2 * this.musicVolume, time + 6);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain).connect(this.masterGain!);

        osc1.start(time);
        osc1.stop(time + duration);
        osc2.start(time);
        osc2.stop(time + duration);
    }

    private playFuneralBell(measure: number, time: number) {
        if (!this.ctx) return;

        // Tolling bell — OMEGA's lullaby for the contained
        const bellNotes = ['E3', 'B2', 'E3', 'C3'];
        const note = bellNotes[Math.floor(measure / 2) % bellNotes.length];
        const freq = NOTE_FREQS[note] || 164.81;

        // Bell is made of multiple harmonics
        const harmonics = [1, 2.4, 3, 4.2, 5.4];

        harmonics.forEach((h, i) => {
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * h, time);

            const amplitude = 0.08 / (i + 1);
            const decay = 4 - i * 0.5;

            gain.gain.setValueAtTime(amplitude * this.musicVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

            osc.connect(gain).connect(this.masterGain!);
            osc.start(time);
            osc.stop(time + decay);
        });
    }

    private playFadingMemory(time: number) {
        if (!this.ctx) return;

        // Reversed-sounding pad — memories dissolving
        const notes = ['G4', 'D4', 'B3', 'E3'];
        const note = notes[Math.floor(Math.random() * notes.length)];
        const freq = NOTE_FREQS[note] || 392;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.linearRampToValueAtTime(freq * 0.9, time + 2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 2);

        // Reverse envelope — quiet start, louder end, then cut
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.05 * this.musicVolume, time + 1.8);
        gain.gain.linearRampToValueAtTime(0, time + 2);

        osc.connect(filter).connect(gain).connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + 2);
    }

    private playDyingHeartbeat(beatNumber: number, time: number) {
        if (!this.ctx) return;

        // Slowing heartbeat — life fading
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + 0.3);

        const intensity = beatNumber === 0 ? 0.4 : 0.2; // First beat stronger
        gain.gain.setValueAtTime(intensity * this.musicVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        osc.connect(gain).connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    private playOmegaEmbrace(time: number) {
        if (!this.ctx) return;

        // Warm but suffocating pad — OMEGA's love
        const notes = ['E2', 'B2', 'E3', 'G3', 'B3'];

        notes.forEach((note, i) => {
            if (!this.ctx) return;
            const freq = NOTE_FREQS[note];
            if (!freq) return;

            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(freq, time);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 1.002, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, time);
            filter.frequency.linearRampToValueAtTime(600, time + 6);
            filter.frequency.linearRampToValueAtTime(200, time + 12);

            const duration = 14.0;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05 * this.musicVolume, time + 4);
            gain.gain.linearRampToValueAtTime(0.03 * this.musicVolume, time + 10);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain).connect(this.masterGain!);

            osc1.start(time + i * 0.3);
            osc1.stop(time + duration);
            osc2.start(time + i * 0.3);
            osc2.stop(time + duration);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGACY MENU MUSIC (kept for compatibility, now unused)
    // ═══════════════════════════════════════════════════════════════════════

    private playEeriePad(measure: number, time: number) {
        // Redirected to new OMEGA pad
        this.playOmegaPad(measure, time);
    }

    private playSubDrone(measure: number, time: number) {
        // Redirected to new OMEGA drone
        this.playOmegaDrone(measure, time);
    }

    private playCyberSparkle(time: number) {
        // Replaced with memory whispers
        this.playMemoryWhisper(time);
    }

    private playCyberArp(measure: number, beatNumber: number, time: number, intensity: number) {
        // Faster, pluckier arps for higher stages
        // Sequences scale up in pitch with intensity
        let octOffset = intensity >= 3 ? 1 : 0; // Higher octave for boss stages

        // Lower pitch for eerie menu music
        if (this._mode === 'MENU') {
            octOffset -= 1;
        }

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

    private _playBossStab(_root: string, time: number) {
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

    public play(type: AudioEvent, _data?: AudioPlayData) {
        if (!this.isInitialized) this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        switch (type) {
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
                for (let i = 0; i < 3; i++) {
                    const bOsc = this.ctx.createOscillator();
                    const bGain = this.ctx.createGain();
                    bOsc.type = 'sawtooth';
                    bOsc.frequency.setValueAtTime(800 + i * 200, now + i * 0.05);
                    bGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i * 0.05);
                    bGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.05);
                    bOsc.connect(bGain).connect(this.sfxGain!);
                    bOsc.start(now + i * 0.05);
                    bOsc.stop(now + i * 0.05 + 0.05);
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
                // ═══ CONTAINMENT COMPLETE ═══
                // Multi-layered death sound: descending tones + static + final bell

                // 1. Descending "soul leaving" sweep
                const sweepOsc = this.ctx.createOscillator();
                const sweepGain = this.ctx.createGain();
                const sweepFilter = this.ctx.createBiquadFilter();

                sweepOsc.type = 'sawtooth';
                sweepOsc.frequency.setValueAtTime(800, now);
                sweepOsc.frequency.exponentialRampToValueAtTime(30, now + 2.5);

                sweepFilter.type = 'lowpass';
                sweepFilter.frequency.setValueAtTime(2000, now);
                sweepFilter.frequency.exponentialRampToValueAtTime(100, now + 2.0);

                sweepGain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
                sweepGain.gain.linearRampToValueAtTime(0.1 * this.sfxVolume, now + 1.5);
                sweepGain.gain.linearRampToValueAtTime(0, now + 2.5);

                sweepOsc.connect(sweepFilter).connect(sweepGain).connect(this.sfxGain!);
                sweepOsc.start(now);
                sweepOsc.stop(now + 2.5);

                // 2. Glitching static burst — system capturing you
                for (let i = 0; i < 5; i++) {
                    const glitchOsc = this.ctx.createOscillator();
                    const glitchGain = this.ctx.createGain();

                    glitchOsc.type = 'square';
                    glitchOsc.frequency.setValueAtTime(50 + Math.random() * 300, now + i * 0.15);

                    glitchGain.gain.setValueAtTime(0.08 * this.sfxVolume, now + i * 0.15);
                    glitchGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1);

                    glitchOsc.connect(glitchGain).connect(this.sfxGain!);
                    glitchOsc.start(now + i * 0.15);
                    glitchOsc.stop(now + i * 0.15 + 0.1);
                }

                // 3. Deep "containment" thud
                const thudOsc = this.ctx.createOscillator();
                const thudGain = this.ctx.createGain();

                thudOsc.type = 'sine';
                thudOsc.frequency.setValueAtTime(60, now + 0.8);
                thudOsc.frequency.exponentialRampToValueAtTime(20, now + 2.0);

                thudGain.gain.setValueAtTime(0.4 * this.sfxVolume, now + 0.8);
                thudGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

                thudOsc.connect(thudGain).connect(this.sfxGain!);
                thudOsc.start(now + 0.8);
                thudOsc.stop(now + 2.0);

                // 4. Final mournful tone — OMEGA's "goodbye"
                const bellFreq = NOTE_FREQS['E3'] || 164.81;
                [1, 2, 3, 4].forEach((harmonic, i) => {
                    if (!this.ctx) return;
                    const bellOsc = this.ctx.createOscillator();
                    const bellGain = this.ctx.createGain();

                    bellOsc.type = 'sine';
                    bellOsc.frequency.setValueAtTime(bellFreq * harmonic, now + 1.5);

                    bellGain.gain.setValueAtTime((0.1 / harmonic) * this.sfxVolume, now + 1.5);
                    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + 3 - i * 0.5);

                    bellOsc.connect(bellGain).connect(this.sfxGain!);
                    bellOsc.start(now + 1.5);
                    bellOsc.stop(now + 4.5);
                });

                // Switch to death music mode
                this.setMode('DEATH');
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
                    lOsc.frequency.setValueAtTime(f, now + i * 0.1);
                    lGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i * 0.1);
                    lGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
                    lOsc.connect(lGain).connect(this.sfxGain!);
                    lOsc.start(now + i * 0.1);
                    lOsc.stop(now + i * 0.1 + 0.3);
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
                    bOsc.frequency.setValueAtTime(f, now + i * 0.08);
                    bGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i * 0.08);
                    bGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                    bOsc.connect(bGain).connect(this.sfxGain!);
                    bOsc.start(now + i * 0.08);
                    bOsc.stop(now + i * 0.08 + 0.2);
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
                    hOsc.frequency.setValueAtTime(f, now + i * 0.1);
                    hGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i * 0.1);
                    hGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                    hOsc.connect(hGain).connect(this.sfxGain!);
                    hOsc.start(now + i * 0.1);
                    hOsc.stop(now + i * 0.1 + 0.2);
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
                    cuOsc.frequency.setValueAtTime(f, now + i * 0.1);
                    cuGain.gain.setValueAtTime(0.1 * this.sfxVolume, now + i * 0.1);
                    cuGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
                    cuOsc.connect(cuGain).connect(this.sfxGain!);
                    cuOsc.start(now + i * 0.1);
                    cuOsc.stop(now + i * 0.1 + 0.4);
                });
                break;
            }
        }
    }
}

export const audio = new AudioController();