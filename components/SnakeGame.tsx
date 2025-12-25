
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameState, UserSettings } from '../game/useGameState';
import { useGameLoop } from '../game/useGameLoop';
import { useRendering } from '../game/useRendering';
import { useInput } from '../game/useInput';
import { useMovement } from '../game/useMovement';
import { useCollisions } from '../game/useCollisions';
import { useCombat } from '../game/useCombat';
import { useSpawner } from '../game/useSpawner';
import { useProgression } from '../game/useProgression';
import { useFX } from '../game/useFX';
import { useStageController } from '../game/useStageController';
import { useMusic } from '../game/useMusic'; 
import { GameStatus, Difficulty, CharacterProfile, Direction, WeaponStats, UpgradeRarity } from '../types';
import { UpgradeId } from '../upgrades/types';
import { 
  STAGE_THEMES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  DEFAULT_SETTINGS, 
  DIFFICULTY_CONFIGS, 
  CHARACTERS,
  TRANSITION_DURATION,
  COMBO_DECAY_DURATION
} from '../constants';
import { audio } from '../utils/audio';
import { formatTime, getThreatLevel } from '../game/gameUtils';
import { DESCRIPTOR_REGISTRY, Descriptor } from '../game/descriptors';

// Map legacy weapon keys to new Registry IDs for UI Lookup
const WEAPON_STAT_MAP: Record<string, keyof WeaponStats> = {
  CANNON: 'cannonLevel',
  AURA: 'auraLevel',
  NANO_SWARM: 'nanoSwarmLevel',
  MINES: 'mineLevel',
  LIGHTNING: 'chainLightningLevel',
  PRISM_LANCE: 'prismLanceLevel',
  NEON_SCATTER: 'neonScatterLevel',
  VOLT_SERPENT: 'voltSerpentLevel',
  PHASE_RAIL: 'phaseRailLevel',
};

const PASSIVE_CHECK_MAP: { id: string, check: (s: any) => boolean }[] = [
    { id: 'SHIELD', check: (s: any) => s.shieldActive },
    { id: 'ECHO_CACHE', check: (s: any) => s.weapon.echoCacheLevel > 0 },
    { id: 'REFLECTOR_MESH', check: (s: any) => s.weapon.reflectorMeshLevel > 0 },
    { id: 'GHOST_COIL', check: (s: any) => s.weapon.ghostCoilLevel > 0 },
    { id: 'NEURAL_MAGNET', check: (s: any) => s.weapon.neuralMagnetLevel > 0 },
    { id: 'OVERCLOCK', check: (s: any) => s.weapon.overclockLevel > 0 },
    { id: 'TERMINAL_PROTOCOL', check: (s: any) => s.hackSpeedMod > 1 },
    { id: 'CRIT', check: (s: any) => s.critChance > 0.05 },
];

const RARITY_STYLES: Record<UpgradeRarity, string> = {
    'COMMON': 'border-gray-600 bg-gray-900/95 hover:border-gray-400',
    'UNCOMMON': 'border-green-600 bg-green-950/40 hover:border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    'RARE': 'border-blue-600 bg-blue-950/40 hover:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    'ULTRA_RARE': 'border-purple-500 bg-purple-950/40 hover:border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.4)] animate-pulse',
    'MEGA_RARE': 'border-yellow-500 bg-yellow-950/40 hover:border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.5)]',
    'LEGENDARY': 'border-yellow-500 bg-yellow-950/40', // Legacy fallback
    'OVERCLOCKED': 'border-red-600 bg-red-950/60 hover:border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-pulse'
};

const RARITY_TEXT_COLORS: Record<UpgradeRarity, string> = {
    'COMMON': 'text-gray-300',
    'UNCOMMON': 'text-green-300',
    'RARE': 'text-blue-300',
    'ULTRA_RARE': 'text-purple-300',
    'MEGA_RARE': 'text-yellow-300',
    'LEGENDARY': 'text-yellow-300',
    'OVERCLOCKED': 'text-red-400'
};

const RARITY_LABELS: Record<UpgradeRarity, string> = {
    'COMMON': 'COMMON',
    'UNCOMMON': 'UNCOMMON',
    'RARE': 'RARE',
    'ULTRA_RARE': 'ULTRA RARE',
    'MEGA_RARE': 'MEGA RARE',
    'LEGENDARY': 'LEGENDARY',
    'OVERCLOCKED': '/// OVERCLOCKED ///'
};

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const scoreDisplayRef = useRef<HTMLDivElement>(null);
  const visualScoreRef = useRef<number>(0);
  
  // UI State
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* ─────────────────────────────
     GAME STATE
     ───────────────────────────── */
  const game = useGameState();
  const {
    status,
    setStatus,
    modalState,
    openSettings,
    closeSettings,
    difficulty,
    setDifficulty,
    unlockedDifficulties,
    uiScore,
    uiXp,
    uiLevel,
    uiStage,
    highScore,
    setHighScore,
    uiCombo,
    uiShield,
    bossActive,
    setSelectedChar,
    upgradeOptions,
    resumeCountdown,
    setResumeCountdown,
    activePowerUps,
    enemiesRef,
    stageRef,
    resetGame,
    startTimeRef,
    enemiesKilledRef,
    terminalsHackedRef,
    failureMessageRef,
    gameTimeRef,
    invulnerabilityTimeRef,
    terminalsRef,
    scoreRef,
    audioEventsRef,
    projectilesRef,
    minesRef,
    shockwavesRef,
    lightningArcsRef,
    particlesRef,
    floatingTextsRef,
    foodRef,
    transitionStartTimeRef,
    bossEnemyRef,
    bossActiveRef,
    isMuted,
    setIsMuted,
    settings,
    setSettings,
    runIdRef
  } = game;

  // ... (Systems init)
  const progression = useProgression(game);
  const fx = useFX(game);
  const spawner = useSpawner(game, fx.triggerShake);
  const combat = useCombat(game, spawner, fx, progression);
  const movement = useMovement(game, spawner);
  const collisions = useCollisions(game, combat, spawner, fx, progression);
  const stage = useStageController(game, spawner, fx, progression);
  
  // ── MUSIC SYSTEM ──
  const music = useMusic(game);
  
  const rendering = useRendering(canvasRef, game);

  // ── DRAW LOOP WRAPPER (Updates UI Timer & Score) ──
  const draw = useCallback((alpha: number) => {
      // Pass the smooth movement progress to the renderer
      const progress = movement.getMoveProgress();
      rendering.draw(alpha, progress);
      
      // Update Timer
      if (timerRef.current) {
          timerRef.current.innerText = formatTime(gameTimeRef.current, true);
      }

      // Update Score (Lerp)
      const rawScore = scoreRef.current;
      const targetScore = Number.isFinite(rawScore) ? rawScore : 0;
      
      const diff = targetScore - visualScoreRef.current;
      
      // Interpolate if difference is significant, else snap
      if (Math.abs(diff) > 0.5) {
          visualScoreRef.current += diff * 0.1; // 10% ease per frame
      } else {
          visualScoreRef.current = targetScore;
      }

      if (scoreDisplayRef.current) {
          scoreDisplayRef.current.innerText = Math.floor(visualScoreRef.current).toString().padStart(7, '0');
      }

  }, [rendering, gameTimeRef, scoreRef, movement]);

  // ── VISUAL SCORE RESET (ON RUN CHANGE) ──
  useEffect(() => {
      visualScoreRef.current = 0;
      if (scoreDisplayRef.current) {
          scoreDisplayRef.current.innerText = "0000000";
      }
  }, [runIdRef.current]); // React to runId increment

  // ── AUDIO LIFECYCLE (ORCHESTRATOR OWNED) ──
  useEffect(() => {
      audio.onBeat(() => fx.pulseBeat());
      audio.onBar(() => fx.pulseBar());
      return () => audio.clearCallbacks();
  }, [fx]);

  useEffect(() => {
      audio.setMusicVolume(settings.musicVolume);
      audio.setSfxVolume(settings.sfxVolume);
  }, [settings.musicVolume, settings.sfxVolume]);

  useEffect(() => {
      switch (status) {
          case GameStatus.DIFFICULTY_SELECT:
              audio.resume();
              audio.setMode('MENU');
              audio.startMusic();
              break;
          case GameStatus.PLAYING:
              audio.setMode('GAME'); 
              break;
          case GameStatus.IDLE:
          case GameStatus.GAME_OVER:
              audio.stopMusic();
              break;
          case GameStatus.STAGE_TRANSITION:
          case GameStatus.RESUMING:
          case GameStatus.LEVEL_UP:
          case GameStatus.PAUSED:
          case GameStatus.CHARACTER_SELECT:
              audio.stopContinuous();
              break;
      }
  }, [status]);

  /* ─────────────────────────────
     INPUT
     ───────────────────────────── */
  const handleStartClick = useCallback(() => {
    setStatus(GameStatus.DIFFICULTY_SELECT);
  }, [setStatus]);

  useInput(
    game,
    progression.applyUpgrade,
    handleStartClick
  );

  /* ─────────────────────────────
     DIFFICULTY / CHARACTER
     ───────────────────────────── */
  const handleDifficultySelect = useCallback((id: Difficulty) => {
    setDifficulty(id);
    audio.setDifficulty(id); 
    setStatus(GameStatus.CHARACTER_SELECT);
  }, [setDifficulty, setStatus]);

  const selectCharacter = useCallback((char: CharacterProfile) => {
    setSelectedChar(char);
    resetGame(char);
    
    if (settings.skipCountdown) {
        setStatus(GameStatus.PLAYING);
        game.stageArmedRef.current = true;
    } else {
        setResumeCountdown(3);
        setStatus(GameStatus.RESUMING);
    }
  }, [setSelectedChar, resetGame, setStatus, setResumeCountdown, settings.skipCountdown, game.stageArmedRef]);

  const toggleMute = useCallback(() => {
      const muted = audio.toggleMute();
      setIsMuted(!!muted);
  }, [setIsMuted]);

  /* ─────────────────────────────
     RESUME COUNTDOWN
     ───────────────────────────── */
  useEffect(() => {
    if (status === GameStatus.RESUMING) {
      if (resumeCountdown > 0) {
        const timer = setTimeout(() => {
          setResumeCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setStatus(GameStatus.PLAYING);
        game.stageArmedRef.current = true;
      }
    }
  }, [status, resumeCountdown, setResumeCountdown, setStatus, game.stageArmedRef]);

  /* ─────────────────────────────
     STAGE TRANSITION
     ───────────────────────────── */
  useEffect(() => {
    if (status !== GameStatus.STAGE_TRANSITION) return;
    audio.play('POWER_UP');
    const timer = setTimeout(stage.advanceStage, TRANSITION_DURATION);
    return () => clearTimeout(timer);
  }, [status, stage]);


  /* ─────────────────────────────
     HIGH SCORE PERSISTENCE
     ───────────────────────────── */
  useEffect(() => {
    if (status === GameStatus.GAME_OVER) {
      if (scoreRef.current > highScore) {
        const final = Math.floor(scoreRef.current);
        setHighScore(final);
        localStorage.setItem('snake_highscore', final.toString());
      }
    }
  }, [status, highScore, setHighScore, scoreRef]);

  /* ─────────────────────────────
     AUTHORITATIVE UPDATE
     ───────────────────────────── */
  const update = useCallback((dt: number) => {
    // 1. TIMERS
    if (invulnerabilityTimeRef.current > 0) {
      invulnerabilityTimeRef.current = Math.max(0, invulnerabilityTimeRef.current - dt);
    }

    // 2. SIMULATION
    collisions.updateCollisionLogic(dt); // Replaced updateTerminals
    spawner.update(dt);
    combat.update(dt); 
    progression.applyPassiveScore(dt);

    const head = game.snakeRef.current[0];
    if (head) {
        movement.updateEnemies(dt, head);
    }

    collisions.checkDynamicCollisions();

    // Snake Movement & Static Collisions
    const newHead = movement.getNextHead(dt);
    if (newHead) {
      const hit = collisions.checkMoveCollisions(newHead);
      if (!hit) {
        const grew = collisions.handleEat(newHead);
        movement.commitMove(newHead, grew);
      }
    }

    // 3. ORCHESTRATION
    stage.cacheBossRef();
    stage.checkStageCompletion();

    // ── REACTIVE AUDIO ──
    music.updateMusic();

    // Discrete Audio Events
    terminalsRef.current.forEach(t => {
        if (t.justDisconnected) {
            audioEventsRef.current.push({ type: 'HACK_LOST' });
            t.justDisconnected = false;
        }
        if (t.justCompleted) {
            audioEventsRef.current.push({ type: 'HACK_COMPLETE' });
            t.justCompleted = false;
        }
    });

    // Audio Event Queue
    if (audioEventsRef.current.length > 0) {
      const events = audioEventsRef.current;
      audioEventsRef.current = []; 
      events.forEach(evt => {
        audio.play(evt.type, evt.data);
      });
    }

    // 4. FX UPDATE
    fx.tickTranslation(dt);
    fx.updateFX();

    // 5. DEFERRED ENTITY CLEANUP
    spawner.cleanupFood();
    spawner.pruneEnemies();
    
    foodRef.current = foodRef.current.filter(f => !f.shouldRemove);
    enemiesRef.current = enemiesRef.current.filter(e => !e.shouldRemove);
    terminalsRef.current = terminalsRef.current.filter(t => !t.shouldRemove);
    projectilesRef.current = projectilesRef.current.filter(p => !p.shouldRemove);
    minesRef.current = minesRef.current.filter(m => !m.shouldRemove);
    shockwavesRef.current = shockwavesRef.current.filter(s => !s.shouldRemove);
    lightningArcsRef.current = lightningArcsRef.current.filter(l => !l.shouldRemove);
    particlesRef.current = particlesRef.current.filter(p => !p.shouldRemove);
    floatingTextsRef.current = floatingTextsRef.current.filter(t => !t.shouldRemove);

  }, [game, music, collisions, spawner, combat, progression, fx, movement, stage]); 

  /* ─────────────────────────────
     GAME LOOP
     ───────────────────────────── */
  useGameLoop(game, update, draw);

  /* ─────────────────────────────
     UI STATE / HELPERS
     ───────────────────────────── */
  const currentTheme = STAGE_THEMES[((uiStage - 1) % 4) + 1] || STAGE_THEMES[1];

  const getComboPct = (now: number, lastEat: number) =>
  Math.min(1, Math.max(0, 1 - (now - lastEat) / COMBO_DECAY_DURATION));

  const comboPct =
    uiCombo > 1
      ? getComboPct(game.gameTimeRef.current, game.lastEatTimeRef.current)
      : 0;

  const handleMobileControl = useCallback(
    (dir: Direction) => {
      if (status !== GameStatus.PLAYING) return;
      game.directionQueueRef.current.push(dir);
    },
    [status, game]
  );

  const activePassives = PASSIVE_CHECK_MAP.filter(p => p.check(game.statsRef.current));

  /* ─────────────────────────────
     RENDER
     ───────────────────────────── */
  return (
    <div className={`relative w-full h-full bg-[#050505] flex flex-col items-center justify-center p-2 overflow-hidden selection:bg-cyan-500/30 ${settings.highContrast ? 'contrast-125' : ''}`}>
      
      {/* ────────────────── TOOLTIP LAYER ────────────────── */}
      {hoveredId && DESCRIPTOR_REGISTRY[hoveredId] && (
          <div className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bottom-20 left-1/2 w-64">
              <div className={`bg-gray-900 border border-gray-600 p-3 rounded shadow-2xl relative ${settings.uiScale > 1.2 ? 'scale-125 origin-bottom' : ''}`}>
                  <div className={`text-sm font-bold ${DESCRIPTOR_REGISTRY[hoveredId].color} mb-1 flex items-center justify-between`}>
                      <span>{DESCRIPTOR_REGISTRY[hoveredId].icon} {DESCRIPTOR_REGISTRY[hoveredId].name}</span>
                      <span className="text-[9px] uppercase bg-black/50 px-1 rounded">{DESCRIPTOR_REGISTRY[hoveredId].rarity}</span>
                  </div>
                  <div className="text-xs text-gray-300 leading-tight">
                      {DESCRIPTOR_REGISTRY[hoveredId].description}
                  </div>
                  <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-900 transform -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b border-gray-600"></div>
              </div>
          </div>
      )}

      {/* ────────────────── SETTINGS MODAL ────────────────── */}
      {modalState === 'SETTINGS' && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-gray-900 border border-cyan-900 p-6 w-full max-w-md rounded shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                  <h2 className="text-2xl font-display text-cyan-400 mb-6 tracking-widest border-b border-cyan-900/50 pb-2">SYSTEM CONFIG</h2>
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <label className="text-sm font-mono text-gray-400">SKIP COUNTDOWN</label>
                          <button onClick={() => setSettings(s => ({...s, skipCountdown: !s.skipCountdown}))} className={`w-12 h-6 rounded-full transition-colors ${settings.skipCountdown ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ml-1 ${settings.skipCountdown ? 'translate-x-6' : ''}`}></div>
                          </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                          <label className="text-sm font-mono text-gray-400">SCREEN SHAKE</label>
                          <button onClick={() => setSettings(s => ({...s, screenShake: !s.screenShake}))} className={`w-12 h-6 rounded-full transition-colors ${settings.screenShake ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ml-1 ${settings.screenShake ? 'translate-x-6' : ''}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between">
                          <label className="text-sm font-mono text-gray-400">HIGH CONTRAST</label>
                          <button onClick={() => setSettings(s => ({...s, highContrast: !s.highContrast}))} className={`w-12 h-6 rounded-full transition-colors ${settings.highContrast ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ml-1 ${settings.highContrast ? 'translate-x-6' : ''}`}></div>
                          </button>
                      </div>

                      <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500 font-mono"><span>FX INTENSITY</span> <span>{Math.round(settings.fxIntensity * 100)}%</span></div>
                          <input type="range" min="0" max="1" step="0.1" value={settings.fxIntensity} onChange={(e) => setSettings(s => ({...s, fxIntensity: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      </div>

                      <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500 font-mono"><span>UI SCALE</span> <span>{settings.uiScale}x</span></div>
                          <input type="range" min="1" max="1.75" step="0.25" value={settings.uiScale} onChange={(e) => setSettings(s => ({...s, uiScale: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      </div>

                      <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500 font-mono"><span>MUSIC VOLUME</span> <span>{Math.round(settings.musicVolume * 100)}%</span></div>
                          <input type="range" min="0" max="1" step="0.1" value={settings.musicVolume} onChange={(e) => setSettings(s => ({...s, musicVolume: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      </div>

                      <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500 font-mono"><span>SFX VOLUME</span> <span>{Math.round(settings.sfxVolume * 100)}%</span></div>
                          <input type="range" min="0" max="1" step="0.1" value={settings.sfxVolume} onChange={(e) => setSettings(s => ({...s, sfxVolume: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      </div>
                  </div>

                  <button onClick={closeSettings} className="mt-6 w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-mono text-sm tracking-wider uppercase transition-colors">
                      CLOSE CONFIG
                  </button>
              </div>
          </div>
      )}

      {/* ────────────────── SCALABLE HUD CONTAINER ────────────────── */}
      <div 
        style={{ transform: `scale(${settings.uiScale})`, transformOrigin: 'top center' }} 
        className="w-full max-w-[800px] flex flex-col items-center transition-transform duration-200"
      >
          {/* HEADER HUD */}
          <div className="w-full grid grid-cols-12 gap-4 mb-4 items-end relative z-10">
            {/* LEFT: Score & Combo */}
            <div className="col-span-3 flex flex-col items-start">
              <div className="text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1">RUNTIME_METRICS</div>
              <div className="relative group">
                <div 
                  ref={scoreDisplayRef} 
                  className="text-4xl font-display text-white tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                >
                  0000000
                </div>
                <div className="h-1.5 w-full bg-gray-900 mt-1 relative overflow-hidden rounded-sm">
                   {uiCombo > 1 && (
                     <>
                       <div className="absolute inset-0 bg-purple-500/20 animate-pulse"></div>
                       <div 
                         className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(192,38,211,0.6)]" 
                         style={{ width: `${comboPct * 100}%` }}
                       />
                     </>
                   )}
                </div>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-[9px] text-gray-500 font-mono">MULTIPLIER</span>
                   <span className={`text-xs font-bold font-mono ${uiCombo > 1 ? 'text-purple-400 animate-pulse' : 'text-gray-700'}`}>
                     x{uiCombo}.0
                   </span>
                </div>
              </div>
            </div>

            {/* CENTER: Status & Objectives */}
            <div className="col-span-6 flex flex-col items-center justify-end pb-1">
               {/* Boss Health Overlay */}
               {bossActive && bossEnemyRef && bossEnemyRef.current ? (
                  <div className="w-full mb-2 animate-in fade-in zoom-in duration-300">
                     <div className="flex justify-between text-[9px] text-red-400 font-bold tracking-widest mb-1 px-1">
                        <span className="animate-pulse">⚠ THREAT DETECTED</span>
                        <span>{(bossEnemyRef.current.hp / bossEnemyRef.current.maxHp * 100).toFixed(0)}% INTEGRITY</span>
                     </div>
                     <div className="h-3 w-full bg-red-950/50 border border-red-600/50 relative overflow-hidden skew-x-[-10deg]">
                        <div 
                          className="h-full bg-red-600 transition-all duration-200" 
                          style={{ width: `${(bossEnemyRef.current.hp / bossEnemyRef.current.maxHp) * 100}%` }}
                        />
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-col items-center mb-2">
                     <div className="text-[10px] text-cyan-600 font-mono tracking-widest mb-0.5">
                        STAGE {uiStage.toString().padStart(2, '0')} // {DIFFICULTY_CONFIGS[difficulty].label}
                     </div>
                     <div className={`text-xs font-bold tracking-[0.2em] uppercase ${
                        getThreatLevel(uiStage) === "EXTREME" ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse" : 
                        getThreatLevel(uiStage) === "HIGH" ? "text-orange-400" : 
                        getThreatLevel(uiStage) === "MODERATE" ? "text-yellow-300" : "text-emerald-400"
                     }`}>
                        THREAT: {getThreatLevel(uiStage)}
                     </div>
                  </div>
               )}

               {/* XP Bar */}
               <div className="w-full max-w-[300px] group relative">
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mb-0.5 px-0.5 uppercase">
                     <span>Lv.{uiLevel}</span>
                     <span>Upgrade Imminent</span>
                     <span>Lv.{uiLevel + 1}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 border border-gray-700 relative overflow-hidden rounded-full">
                     <div 
                       className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all duration-500 ease-out" 
                       style={{ width: `${uiXp}%` }}
                     />
                  </div>
               </div>

               {/* Active Buffs Row */}
               <div className="flex gap-2 mt-2 h-5">
                  {uiShield && (
                     <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-950/40 border border-blue-500/30 rounded text-[9px] text-blue-300">
                        <span className="text-[10px]">🛡️</span> SHIELD
                     </div>
                  )}
                  {activePowerUps.slow && (
                     <div className="px-1.5 py-0.5 bg-indigo-950/40 border border-indigo-500/30 rounded text-[9px] text-indigo-300">
                        CHRONO
                     </div>
                  )}
                  {activePowerUps.magnet && (
                     <div className="px-1.5 py-0.5 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded text-[9px] text-fuchsia-300">
                        MAGNET
                     </div>
                  )}
               </div>
            </div>

            {/* RIGHT: High Score */}
            <div className="col-span-3 flex flex-col items-end">
               <div className="text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1">PEAK_PERFORMANCE</div>
               <div className="text-xl font-mono text-gray-400 mb-2">
                  {highScore.toString().padStart(7, '0')}
               </div>
               
               <div className="text-[10px] text-cyan-700 tracking-[0.2em] font-bold mb-1">CURRENT_RUNTIME</div>
               <div className="text-xl font-mono text-white mb-2" ref={timerRef}>
                  00:00.00
               </div>

               <div className="mt-auto text-[10px] text-right text-gray-600 font-mono leading-tight">
                  SESSION_ID: <span className="text-gray-500">{game.startTimeRef.current.toString(36).toUpperCase().slice(-6)}</span><br/>
                  PROTOCOL: <span className={game.selectedChar ? "text-cyan-400" : "text-gray-500"}>{game.selectedChar?.name || 'N/A'}</span>
               </div>
            </div>
          </div>
      </div>

      {/* ────────────────── MAIN CANVAS FRAME ────────────────── */}
      <div className="relative group p-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-gray-700 origin-center" style={{ borderColor: currentTheme.wall }}>
         {/* Decoration Bolts */}
         <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500 m-1"></div>
         <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500 m-1"></div>
         <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500 m-1"></div>
         <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500 m-1"></div>

         <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            className="block max-w-full max-h-[70vh] w-auto h-auto cursor-crosshair rounded bg-black shadow-inner" 
         />
         
         <div className="scanlines pointer-events-none rounded opacity-50"></div>
         
         {/* OVERLAYS */}
         {status === GameStatus.IDLE && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-sm p-6 text-center">
            <h1 className="text-5xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] text-center tracking-tighter">
              NEON SNAKE
            </h1>
            <div className="text-center mb-10 text-cyan-500/50 text-[10px] tracking-[0.4em] uppercase">
                CYBER_PROTOCOL // ENHANCED_CORE_V1.1
            </div>
            <div className="flex gap-4">
                <button onClick={handleStartClick} className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-display rounded transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] group relative overflow-hidden" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}>
                  INITIALIZE_SYSTEM
                </button>
                <button onClick={openSettings} className="px-4 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold font-display rounded transition-all border border-gray-600">
                   ⚙
                </button>
            </div>
          </div>
        )}

        {status === GameStatus.DIFFICULTY_SELECT && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center z-30 backdrop-blur-md p-4 overflow-y-auto">
                <div className="my-auto w-full flex flex-col items-center">
                    <h2 className="text-2xl md:text-4xl font-display text-white mb-6 tracking-wide text-center">THREAT_LEVEL_ASSESSMENT</h2>
                    <div className="grid grid-cols-1 gap-3 w-full max-w-xl">
                        {Object.values(DIFFICULTY_CONFIGS).map(config => {
                            const isUnlocked = unlockedDifficulties.includes(config.id);
                            return (
                                <button key={config.id} disabled={!isUnlocked} onClick={() => handleDifficultySelect(config.id)} className={`flex flex-col items-start p-5 border transition-all relative overflow-hidden group ${isUnlocked ? `border-gray-700 hover:border-white bg-gray-900/60 hover:bg-gray-800` : `border-gray-900 bg-black/80 opacity-60 cursor-not-allowed` }`}>
                                    <div className="flex justify-between w-full items-center mb-2">
                                        <h3 className={`text-xl md:text-2xl font-bold font-display ${isUnlocked ? config.color : 'text-gray-600'}`}> {config.label} </h3>
                                        {!isUnlocked && <span className="text-[10px] text-red-600 font-bold border border-red-900 px-2 py-0.5">LOCKED</span>}
                                    </div>
                                    <p className="text-sm text-gray-400 font-mono tracking-tight text-left">{config.description}</p>
                                    
                                    {!isUnlocked && (
                                        <div className="mt-3 w-full border-t border-red-900/30 pt-2 text-left">
                                            <p className="text-xs text-red-500/80 font-mono uppercase tracking-wider">
                                                <span className="text-red-700 mr-2">⚠ REQUIRED:</span> 
                                                {config.unlockCondition}
                                            </p>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {status === GameStatus.CHARACTER_SELECT && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-md p-4 overflow-y-auto">
                <h2 className="text-3xl md:text-5xl font-display text-cyan-400 mb-6 tracking-widest mt-8 md:mt-0">PROTOCOL_SELECTION</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
                    {CHARACTERS.map(char => (
                        <button key={char.id} onClick={() => selectCharacter(char)} className="flex flex-col items-start p-5 border-2 transition-all bg-gray-900/70 hover:bg-gray-800 hover:scale-[1.02] group relative overflow-hidden" style={{ borderColor: char.color }}>
                             <div className="flex justify-between w-full items-center mb-2">
                                <h3 className="text-2xl font-bold font-display" style={{ color: char.color }}>{char.name}</h3>
                                <span className={`text-[9px] font-bold px-2 py-0.5 border border-white/10 rounded uppercase ${char.tag === 'STABLE' ? 'text-blue-300' : char.tag === 'ADAPTIVE' ? 'text-green-300' : 'text-red-400' }`}> {char.tag} </span>
                             </div>
                             <p className="text-sm text-gray-400 mb-4 font-mono leading-snug text-left">{char.description}</p>
                             
                             {/* TRAIT BOX */}
                             <div className="w-full bg-black/40 border border-white/10 p-2 mb-4 rounded text-left">
                                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">INTRINSIC TRAIT</div>
                                 <div className="text-xs font-bold text-white mb-0.5">{char.traitName}</div>
                                 <div className="text-[10px] text-gray-400 leading-tight">{char.traitDescription}</div>
                             </div>

                             <div className="mt-auto w-full text-left">
                                <div className="text-xs font-bold text-white mb-2 uppercase tracking-tighter">{char.payoff}</div>
                                <div className="h-0.5 w-full bg-gray-800 mb-3" />
                                {char.initialStats.weapon && <div className="text-[10px] text-gray-500 uppercase">Loadout: Optimized</div>}
                                {char.initialStats.shieldActive && <div className="text-[10px] text-cyan-500 font-bold uppercase">Shield: Primed</div>}
                             </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {status === GameStatus.LEVEL_UP && (
             <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-40 backdrop-blur-lg p-10">
                <h2 className="text-5xl font-display text-yellow-400 mb-2 animate-pulse tracking-tighter">AUGMENTATION_READY</h2>
                <p className="text-gray-500 font-mono text-sm mb-12 tracking-widest uppercase">Decryption successful // Choose modification</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                    {upgradeOptions.map((opt, idx) => (
                        <button 
                            key={opt.id} 
                            onClick={() => progression.applyUpgrade(opt.id as UpgradeId, opt.rarity)} 
                            className={`flex flex-col h-full relative overflow-hidden p-0 border-2 transition-all text-left group ${RARITY_STYLES[opt.rarity] || 'border-gray-700 bg-gray-900/80 hover:border-white'}`}
                        >
                            {/* Rarity Header Bar */}
                            <div className="flex justify-between items-center bg-black/40 px-4 py-2 border-b border-inherit">
                                <div className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white/90">
                                    {RARITY_LABELS[opt.rarity]}
                                </div>
                                <div className="text-xs font-bold text-gray-500 font-mono group-hover:text-white transition-colors">{idx+1}</div>
                            </div>

                            {/* Content Body */}
                            <div className="flex flex-col p-6 h-full">
                                {/* Title & Icon */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{opt.icon}</div>
                                    <h3 className={`text-2xl font-bold font-display leading-none ${opt.color}`}>{opt.title}</h3>
                                </div>

                                {/* Dedicated Stat Zone */}
                                {opt.stats && opt.stats.length > 0 && (
                                    <div className="flex flex-col gap-1 mb-6">
                                        {opt.stats.map((stat, i) => (
                                            <div key={i} className={`text-lg font-bold font-mono tracking-wide ${RARITY_TEXT_COLORS[opt.rarity] || 'text-gray-200'}`}>
                                                {stat}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Description (Pushed to bottom) */}
                                <div className="mt-auto pt-4 border-t border-white/5">
                                    <p className="text-sm text-gray-400 font-mono leading-relaxed">{opt.description}</p>
                                </div>
                            </div>
                            
                            {/* Rarity Flare Overlay */}
                            {(opt.rarity === 'MEGA_RARE' || opt.rarity === 'OVERCLOCKED') && (
                                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none animate-pulse"></div>
                            )}
                        </button>
                    ))}
                </div>
             </div>
        )}

        {/* PAUSE MODAL - REPLACES SETTINGS */}
        {modalState === 'PAUSE' && status === GameStatus.PAUSED && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="text-5xl font-display text-white tracking-[0.5em] animate-pulse border-4 border-white p-8">SUSPENDED</div>
                <button onClick={openSettings} className="absolute bottom-10 px-6 py-2 bg-gray-800 border border-gray-600 text-white font-mono hover:bg-gray-700">
                    OPEN CONFIG
                </button>
            </div>
        )}

        {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 backdrop-blur-md p-10">
                <h2 className="text-6xl font-display text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(255,0,0,0.6)] tracking-tighter">CONTAINMENT_FAILURE</h2>
                <p className="text-red-400 font-mono text-sm mb-10 tracking-[0.3em] uppercase">{failureMessageRef.current}</p>
                <div className="w-full max-w-lg bg-black/60 border-2 border-red-900 p-6 mb-12 font-mono text-base shadow-2xl">
                    <div className="text-red-500 border-b-2 border-red-900 pb-3 mb-4 font-bold tracking-widest uppercase">POST_MORTEM_REPORT</div>
                    <div className="flex justify-between mb-2"> <span className="text-gray-500">RUNTIME:</span> <span className="text-white font-bold">{formatTime(game.gameTimeRef.current, true)}</span> </div>
                    <div className="flex justify-between mb-2"> <span className="text-gray-500">NEUTRALIZED_DRONES:</span> <span className="text-white font-bold">{enemiesKilledRef.current}</span> </div>
                    <div className="flex justify-between mb-2"> <span className="text-gray-500">ACCESSED_TERMINALS:</span> <span className="text-white font-bold">{terminalsHackedRef.current}</span> </div>
                    <div className="flex justify-between"> <span className="text-gray-500">ANOMALY_STATUS:</span> <span className="text-red-400 font-black animate-pulse uppercase">BREACHED</span> </div>
                </div>
                <div className="flex gap-6">
                    <button onClick={handleStartClick} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold font-display rounded shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-transform transform hover:scale-105"> ROLLBACK </button>
                    <button onClick={() => setStatus(GameStatus.IDLE)} className="px-10 py-4 border-2 border-red-800 hover:bg-red-900/50 text-red-400 font-display rounded transition-colors uppercase"> CONSOLE </button>
                </div>
            </div>
        )}

        {status === GameStatus.RESUMING && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/10">
                <div className="text-[200px] font-black text-white/20 animate-ping font-display"> {resumeCountdown} </div>
            </div>
        )}

        {status === GameStatus.STAGE_TRANSITION && (
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-50">
                <h2 className="text-6xl font-display text-cyan-400 mb-4 tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">SECTOR DECRYPTED</h2>
                <div className="text-cyan-400/80 font-mono text-sm tracking-[0.5em] uppercase bg-black/60 px-4 py-2 border-l-2 border-r-2 border-cyan-500/50">INITIATING DATA MIGRATION...</div>
            </div>
        )}
      </div>

      {/* ────────────────── HUD BOTTOM STRIP (SCALABLE) ────────────────── */}
      <div 
        style={{ transform: `scale(${settings.uiScale})`, transformOrigin: 'top center' }}
        className="w-full max-w-[800px] mt-2 flex flex-col gap-2 transition-transform duration-200"
      >
          {/* WEAPON LOADOUT */}
          <div className="w-full flex gap-2">
            {Array.from({ length: Math.max(1, game.statsRef.current.maxWeaponSlots || 3) }).map((_, i) => {
                const weaponId = game.statsRef.current.activeWeaponIds[i];
                const descriptor = weaponId ? DESCRIPTOR_REGISTRY[weaponId] : null;
                const statKey = weaponId ? WEAPON_STAT_MAP[weaponId] : null;
                const level = (statKey && descriptor) ? game.statsRef.current.weapon[statKey] : 0;
                
                if (!descriptor) {
                    return (
                        <div key={i} className="flex-1 h-14 bg-black/40 border border-dashed border-gray-800 rounded flex items-center justify-center">
                            <span className="text-[10px] text-gray-700 font-mono tracking-widest uppercase">SLOT_{i+1}</span>
                        </div>
                    );
                }

                return (
                    <div 
                        key={i} 
                        className={`flex-1 h-14 bg-gray-900/90 border-l-2 border-t border-b border-r border-gray-700 relative overflow-hidden group flex items-center px-3 gap-3 transition-all cursor-help ${descriptor.color}`} 
                        style={{ borderLeftColor: 'currentColor' }}
                        onMouseEnter={() => setHoveredId(weaponId)}
                        onMouseLeave={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(weaponId)}
                        onBlur={() => setHoveredId(null)}
                        tabIndex={0}
                    > 
                        <div className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{descriptor.icon}</div>
                        <div className="flex flex-col justify-center">
                            <div className={`text-[10px] font-bold tracking-wider ${descriptor.color} font-display leading-tight`}>{descriptor.name}</div>
                            <div className="text-xs font-mono text-white/80">LVL {level} <span className="text-gray-600">/ MAX</span></div>
                        </div>
                        <div className={`absolute inset-0 bg-gradient-to-l from-current to-transparent opacity-10 pointer-events-none ${descriptor.color}`}></div>
                    </div>
                );
            })}
          </div>

          {/* PASSIVE UPGRADE STRIP */}
          {activePassives.length > 0 && (
              <div className="w-full flex flex-wrap gap-2 items-center justify-center bg-gray-950/50 p-1.5 rounded border-t border-gray-800">
                  <div className="text-[9px] text-gray-600 font-mono tracking-widest mr-2">SYSTEM_MODS //</div>
                  {activePassives.map(p => {
                      const desc = DESCRIPTOR_REGISTRY[p.id];
                      if (!desc) return null;
                      return (
                          <div 
                            key={p.id} 
                            className={`flex items-center gap-1.5 px-2 py-1 bg-gray-900 border border-gray-800 rounded cursor-help ${desc.color} hover:bg-gray-800 transition-colors`}
                            onMouseEnter={() => setHoveredId(p.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onFocus={() => setHoveredId(p.id)}
                            onBlur={() => setHoveredId(null)}
                            tabIndex={0}
                          >
                              <span className="text-sm filter drop-shadow-[0_0_5px_currentColor]">{desc.icon}</span>
                              <span className="text-[9px] font-bold tracking-wider">{desc.name}</span>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* ────────────────── MOBILE CONTROLS (CONDITIONAL) ────────────────── */}
      <div className="w-full max-w-[400px] mt-6 grid grid-cols-3 gap-3 md:hidden h-40 select-none">
          {/* Enhanced Mobile Buttons */}
          <div className="col-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.UP); }}> 
            <span className="text-2xl text-cyan-400">▲</span> 
          </div>
          
          <div className="col-start-1 row-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.LEFT); }}> 
            <span className="text-2xl text-cyan-400">◀</span> 
          </div>
          
          <div className="col-start-3 row-start-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.RIGHT); }}> 
            <span className="text-2xl text-cyan-400">▶</span> 
          </div>
          
          <div className="col-start-2 row-start-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg active:bg-cyan-900/30" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.DOWN); }}> 
            <span className="text-2xl text-cyan-400">▼</span> 
          </div>
      </div>

      {/* ────────────────── DESKTOP CONTROLS FOOTER ────────────────── */}
      <div className="mt-6 hidden md:flex w-full max-w-[800px] justify-between items-center text-[10px] text-gray-500 font-mono border-t border-gray-800/50 pt-4">
          
          <div className="flex gap-6">
             <div className="flex flex-col gap-1">
                <span className="text-cyan-700 font-bold tracking-wider mb-1">NAVIGATION</span>
                <div className="flex gap-2 items-center">
                   <div className="flex gap-1">
                      <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">W</span>
                      <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">A</span>
                      <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">S</span>
                      <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">D</span>
                   </div>
                   <span>OR ARROWS</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
             <span className="text-cyan-700 font-bold tracking-wider mb-1">SYSTEM</span>
             <div className="flex gap-3">
                <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">SPACE</span>
                   <span>PAUSE</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={toggleMute}>
                   <span className={`px-2 py-0.5 rounded border transition-colors ${isMuted ? "bg-red-900/50 border-red-500 text-red-300" : "bg-gray-800 border-gray-700 text-gray-300 group-hover:border-white"}`}>
                      {isMuted ? 'UNMUTE' : 'MUTE'}
                   </span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={openSettings}>
                   <span className={`px-2 py-0.5 rounded border transition-colors ${modalState === 'SETTINGS' ? "bg-cyan-900/50 border-cyan-500 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-300 group-hover:border-white"}`}>
                      CONFIG
                   </span>
                </div>
             </div>
          </div>

      </div>
    </div>
  );
};

export default SnakeGame;
