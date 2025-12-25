// game/audio.ts
import type { Difficulty } from '../types';

type Mode = 'MENU' | 'GAME';

type AudioController = {
  // ── TRANSPORT / MUSIC ──
  resume: () => void;
  startMusic: () => void;
  stopMusic: () => void;
  stopContinuous: () => void;
  setMode: (mode: Mode) => void;

  // ── DIFFICULTY / STATE ──
  setDifficulty: (difficulty: Difficulty) => void;
  setStage: (stage: number) => void;
  setThreat: (threat: number) => void;
  setHackProgress: (progress: number) => void;

  // ── EVENTS ──
  play: (event: string, data?: any) => void;

  // ── BEAT SYNC ──
  onBeat: (cb: () => void) => void;
  onBar: (cb: () => void) => void;
  clearCallbacks: () => void;

  // ── MISC ──
  toggleMute: () => boolean;
  getBpm: () => number;
};

let muted = false;
let bpm = 120;

let beatCallbacks: Array<() => void> = [];
let barCallbacks: Array<() => void> = [];

export const audio: AudioController = {
  // ── TRANSPORT / MUSIC ──
  resume() {
    /* no-op for now */
  },

  startMusic() {
    /* no-op */
  },

  stopMusic() {
    /* no-op */
  },

  stopContinuous() {
    /* no-op */
  },

  setMode(_mode: Mode) {
    /* no-op */
  },

  // ── DIFFICULTY / STATE ──
  setDifficulty(_difficulty: Difficulty) {
    /* no-op */
  },

  setStage(_stage: number) {
    /* no-op */
  },

  setThreat(_threat: number) {
    /* no-op */
  },

  setHackProgress(_progress: number) {
    /* no-op */
  },

  // ── EVENTS ──
  play(_event: string, _data?: any) {
    /* no-op */
  },

  // ── BEAT SYNC ──
  onBeat(cb: () => void) {
    beatCallbacks.push(cb);
  },

  onBar(cb: () => void) {
    barCallbacks.push(cb);
  },

  clearCallbacks() {
    beatCallbacks = [];
    barCallbacks = [];
  },

  // ── MISC ──
  toggleMute() {
    muted = !muted;
    return muted;
  },

  getBpm() {
    return bpm;
  },
};
