
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameState } from '../game/useGameState';
import { useGameLoop } from '../game/useGameLoop';
import { useRendering } from '../game/useRendering';
import { useInput } from '../game/useInput';
import { useMovement } from '../game/useMovement';
import { useCollisions } from '../game/useCollisions';
import { useCombat } from '../game/useCombat';
import { useSpawner } from '../game/useSpawner';
import { useStageController } from '../game/useStageController';
import { useProgression } from '../game/useProgression';
import { useFX } from '../game/useFX';
import { useMusic } from '../game/useMusic';
import { useAnalytics } from '../game/useAnalytics';
import { GameStatus, Difficulty, CharacterProfile, DevBootstrapConfig, UpgradeOption, UpgradeStats } from '../types';
import { DIFFICULTY_CONFIGS, CHARACTERS, CANVAS_WIDTH, CANVAS_HEIGHT, IS_DEV, MUSIC_STAGE_MAP, MUSIC_INTRO_DURATION, MUSIC_LAYERS } from '../constants';
import { audio } from '../utils/audio';
import { ArrowControls } from './ArrowControls';
import { VirtualJoystick } from './VirtualJoystick';
import { SwipeControls } from './SwipeControls';
import { ArchiveTerminal } from './ArchiveTerminal';
import { SettingsMenu } from './SettingsMenu';
import { UpgradeId } from '../upgrades/types';
import { UIStyleProvider } from '../ui/UIStyleContext'; 
import { useUIStyle } from '../ui/useUIStyle'; 
import { VisionProtocolProvider } from '../ui/vision/VisionProtocolProvider';
import { useVisionProtocol } from '../ui/vision/useVisionProtocol';
import { GameHUD } from '../ui/hud/GameHUD';
import { evaluateUnlocks } from '../game/cosmetics/CosmeticUnlockSystem';
import { UnlockToast } from '../ui/cosmetics/UnlockToast';
import { ModelConfigurationPass } from '../ui/transitions/ModelConfigurationPass';
import { useVoidHazard } from '../game/hazards/useVoidHazard';
import { useEnemyGapAwareness } from '../game/ai/useEnemyGapAwareness';
import { useProjectilePhysics } from '../game/physics/useProjectilePhysics';
import { useBossController } from '../game/boss/useBossController';
import { DevBootstrap } from '../game/dev/DevBootstrap';
import { CameraBehavior } from '../game/camera/types';
import { consumeDevIntents } from '../game/orchestration/consumeDevIntents';
import { DevTools } from '../ui/devtools/DevTools';
import { DESCRIPTOR_REGISTRY } from '../game/descriptors';
import { HUDTooltip } from '../ui/hud/HUDPrimitives';
import { DEV_START_CONFIG } from '../game/dev/DevStartConfig';

// UI Constants & Styles
const RARITY_STYLES: Record<string, string> = {
  COMMON: 'border-gray-500 bg-gray-900/90',
  UNCOMMON: 'border-green-500 bg-green-900/90',
  RARE: 'border-blue-500 bg-blue-900/90',
  ULTRA_RARE: 'border-purple-500 bg-purple-900/90',
  MEGA_RARE: 'border-yellow-500 bg-yellow-900/90',
  LEGENDARY: 'border-red-500 bg-red-900/90',
  OVERCLOCKED: 'border-red-600 bg-red-950 animate-pulse'
};

const RARITY_TEXT_COLORS: Record<string, string> = {
  COMMON: 'text-gray-400',
  UNCOMMON: 'text-green-400',
  RARE: 'text-blue-400',
  ULTRA_RARE: 'text-purple-400',
  MEGA_RARE: 'text-yellow-400',
  LEGENDARY: 'text-red-500',
  OVERCLOCKED: 'text-red-600'
};

const RARITY_LABELS: Record<string, string> = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  ULTRA_RARE: 'ULTRA RARE',
  MEGA_RARE: 'MEGA RARE',
  LEGENDARY: 'LEGENDARY',
  OVERCLOCKED: 'OVERCLOCKED'
};

const CompactStatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
    <div className="flex items-center gap-3 w-full text-[10px] font-mono">
        <span className="w-14 text-gray-500 font-bold tracking-wider text-right">{label}</span>
        <div className="flex-1 h-2 bg-gray-800/50 rounded-sm overflow-hidden border border-gray-700/30 relative">
            <div 
                className="h-full relative transition-all duration-500 ease-out" 
                style={{ 
                    width: `${(value / max) * 100}%`, 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}40`
                }} 
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(0,0,0,0.5)_20%,rgba(0,0,0,0.5)_25%,transparent_25%)] bg-[length:4px_100%] opacity-30"></div>
        </div>
        <span className="w-4 text-right text-gray-600 font-bold">{value}</span>
    </div>
);

const CHAR_STATS: Record<string, { off: number, def: number, spd: number, util: number }> = {
    striker: { off: 9, def: 4, spd: 6, util: 3 },
    spectre: { off: 5, def: 3, spd: 8, util: 9 },
    volt: { off: 7, def: 5, spd: 6, util: 7 },
    rigger: { off: 8, def: 6, spd: 4, util: 8 },
    bulwark: { off: 4, def: 10, spd: 3, util: 5 },
    overdrive: { off: 10, def: 1, spd: 10, util: 2 }
};

const getStartingLoadout = (stats: Partial<UpgradeStats> | undefined): string[] => {
    if (!stats) return [];
    const ids: string[] = [];
    
    if (stats.shieldActive) ids.push('SHIELD');
    
    const w = stats.weapon;
    if (w) {
        if ((w.cannonLevel || 0) > 0) ids.push('CANNON');
        if ((w.auraLevel || 0) > 0) ids.push('AURA');
        if ((w.mineLevel || 0) > 0) ids.push('MINES');
        if ((w.chainLightningLevel || 0) > 0) ids.push('LIGHTNING');
        if ((w.nanoSwarmLevel || 0) > 0) ids.push('NANO_SWARM');
        if ((w.prismLanceLevel || 0) > 0) ids.push('PRISM_LANCE');
        if ((w.neonScatterLevel || 0) > 0) ids.push('NEON_SCATTER');
        if ((w.voltSerpentLevel || 0) > 0) ids.push('VOLT_SERPENT');
        if ((w.phaseRailLevel || 0) > 0) ids.push('PHASE_RAIL');
    }
    
    return ids;
};

const GameInner: React.FC<{ game: ReturnType<typeof useGameState> }> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [damageOpacity, setDamageOpacity] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false); 
  
  const [initPhase, setInitPhase] = useState<'NONE' | 'GLITCH' | 'STALL' | 'RECOVER'>('NONE');
  const [recoveryText, setRecoveryText] = useState('RECONVERGING INPUT CONTEXT');

  const [bindingState, setBindingState] = useState<{ charId: string; phase: 'LOCK' | 'SYNC' } | null>(null);
  const [bindText, setBindText] = useState('BINDING OPERATOR PROFILE');
  const [hudBooted, setHudBooted] = useState(true);
  
  const [isIntroPlaying, setIsIntroPlaying] = useState(false); // Music Intro State
  const [armingProgress, setArmingProgress] = useState(0);
  const [armingTextStep, setArmingTextStep] = useState(0);
  const inputActiveRef = useRef(false);

  const uiStyle = useUIStyle();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vision = useVisionProtocol();

  // Generate a static hex dump for the crash screen once
  const hexDump = useMemo(() => {
    return Array.from({length: 400}).map(() => Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')).join(' ').toUpperCase();
  }, []);

  useEffect(() => {
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      setIsTouch(isCoarse);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);
  
  useEffect(() => {
      if (!IS_DEV) return;
      const handler = (e: KeyboardEvent) => {
          if (e.key === 'D' && e.shiftKey) {
              setShowDevMenu(prev => !prev);
          }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── DEV BOOT CHECK ───
  useEffect(() => {
      if (IS_DEV && DEV_START_CONFIG.enabled && game.status === GameStatus.IDLE) {
          console.log('[DEV] Auto-Booting with Config...');
          game.devHelper.queueDevIntent({ type: 'RESET_GAME' });
          game.setStatus(GameStatus.PLAYING); // Force loop start
      }
  }, []);

  const {
    status, setStatus, modalState, setModalState,
    difficulty, setDifficulty, unlockedDifficulties,
    scoreRef, failureMessageRef,
    settings, setSettings, openSettings, togglePause, closeSettings,
    selectedChar, setSelectedChar,
    upgradeOptions,
    resumeCountdown,
    uiCombo,
    enemiesKilledRef, terminalsHackedRef, gameTimeRef,
    isMuted, toggleMute,
    lastDamageTimeRef,
    invulnerabilityTimeRef,
    stageArmedRef,
    unlockedCosmetics, toastQueue, 
    unlockCosmetic, clearToast, maxComboRef, tailIntegrityRef, bossDefeatedRef,
    hasUnreadArchiveData, markArchiveRead,
    devHelper,
    devModeFlagsRef,
    cameraRef,
    cameraControlsEnabled, setCameraControlsEnabled
  } = game;

  const fx = useFX(game);
  const progression = useProgression(game);
  const spawner = useSpawner(game, fx.triggerShake);
  const combat = useCombat(game, spawner, fx, progression);
  const movement = useMovement(game, spawner);
  const collisions = useCollisions(game, combat, spawner, fx, progression);
  const stageController = useStageController(game, spawner, fx, progression);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const analytics = useAnalytics(game);
  const music = useMusic(game);
  const voidHazard = useVoidHazard(game, collisions.handleDeath);
  const gapAwareness = useEnemyGapAwareness(game);
  const projectilePhysics = useProjectilePhysics(game);
  const bossController = useBossController(game);
  
  const handleBootstrap = useCallback((config: DevBootstrapConfig) => {
      devHelper.applyBootstrap(config);
      
      if (!selectedChar) {
          setSelectedChar(CHARACTERS[0]);
      }
      
      spawner.spawnFood(); 
      if (config.forceBoss || config.stageId % 5 === 0) {
          spawner.devSpawnBoss(config.stageId, config.bossPhase || 0);
      }
      
      // Force music layer update on bootstrap
      const stage = config.stageId;
      const isBoss = stage % 5 === 0;
      const mapKey = isBoss ? 0 : ((stage - 1) % 4) + 1;
      const layers = MUSIC_STAGE_MAP[mapKey];
      audio.setLayers(layers);
      
      setShowDevMenu(false);
  }, [devHelper, selectedChar, setSelectedChar, spawner]);

  const handleToggleFreeRoam = useCallback(() => {
      const isFree = !devModeFlagsRef.current.freeMovement;
      devModeFlagsRef.current.freeMovement = isFree;
      
      if (isFree) {
          cameraRef.current.behavior = CameraBehavior.MANUAL;
          audio.play('POWER_UP');
      } else {
          cameraRef.current.behavior = CameraBehavior.FOLLOW_PLAYER;
          audio.play('UI_HARD_CLICK');
      }
  }, [devModeFlagsRef, cameraRef]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      stageArmedRef.current = true;
    }
  }, [status, stageArmedRef]);

  // ─── AUDIO LIFECYCLE ───
  // Ensure sustained SFX (like hacking hum) are killed when not playing
  useEffect(() => {
      if (status !== GameStatus.PLAYING && status !== GameStatus.READY) {
          // READY state manages its own sustain for the intro build-up
          audio.stopSustained();
      }
      // Also stop if modal is open (even if playing in background/paused)
      if (modalState !== 'NONE') {
          audio.stopSustained();
      }
  }, [status, modalState]);

  const handleStartClick = useCallback(() => {
    if (status === GameStatus.GAME_OVER && selectedChar) {
      game.resetGame(selectedChar);
      spawner.spawnFood(); 
      setStatus(GameStatus.READY);
      audio.play('MOVE');
      return;
    } 
    
    const hasInit = localStorage.getItem('acr_first_init_v1');
    if (!hasInit && status === GameStatus.IDLE) {
        audio.play('UI_HARD_CLICK');
        setInitPhase('GLITCH');
        audio.play('GLITCH_TEAR');

        setTimeout(() => {
            setInitPhase('STALL');
        }, 150);

        setTimeout(() => {
            if (Math.random() < 0.02) {
                setRecoveryText('INPUT CONTEXT ACCEPTED (NONSTANDARD)');
            } else {
                setRecoveryText('RECONVERGING INPUT CONTEXT');
            }
            setInitPhase('RECOVER');
            audio.play('SYS_RECOVER');
        }, 250);

        setTimeout(() => {
            localStorage.setItem('acr_first_init_v1', 'true');
            setInitPhase('NONE');
            setStatus(GameStatus.DIFFICULTY_SELECT);
            audio.play('MOVE'); 
            
            // Start Menu Music (First Time)
            audio.setMode('MENU');
            audio.startMusic();
        }, 850);
        
        return;
    }

    setStatus(GameStatus.DIFFICULTY_SELECT);
    audio.play('MOVE');
    
    // Start Menu Music (Normal)
    audio.setMode('MENU');
    audio.startMusic();
  }, [status, selectedChar, game, setStatus, spawner]);

  // ─────────────────────────────
  // SEQUENCE START (ARMING)
  // ─────────────────────────────
  
  // Reset Arming State
  useEffect(() => {
    if (status === GameStatus.READY) {
        setArmingProgress(0);
        setArmingTextStep(0);
        
        // Sequence text appearance
        const t1 = setTimeout(() => setArmingTextStep(1), 200);
        const t2 = setTimeout(() => setArmingTextStep(2), 500);
        const t3 = setTimeout(() => setArmingTextStep(3), 800);
        
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }
  }, [status]);

  const handleReadyStart = useCallback(() => {
      // 1. Enter Intro State (Visual Flash)
      setIsIntroPlaying(true);
      
      // 2. Play Launch Sound (Single hit)
      audio.play('UI_HARD_CLICK'); 
      
      // 3. Immediate Transition (Fast)
      setTimeout(() => {
          setIsIntroPlaying(false);
          setStatus(GameStatus.PLAYING);
          
          // 4. Start Stage 1 Music
          audio.setMode('GAME');
          audio.setLayers(MUSIC_STAGE_MAP[1]);
          audio.startMusic();
          
      }, 200); // 200ms flash
  }, [setStatus]);

  // Arming Input Loop
  useEffect(() => {
    if (status !== GameStatus.READY || isIntroPlaying) return;
    
    let raf: number;
    const loop = () => {
        if (inputActiveRef.current) {
            setArmingProgress(p => Math.min(1, p + 0.04)); // ~400ms to fill
        } else {
            // Very slow decay
            setArmingProgress(p => Math.max(0, p - 0.01));
        }
        
        // Audio Ramp using Hack SFX (Oscillator)
        audio.setHackProgress(inputActiveRef.current ? Math.max(0.1, armingProgress) : 0);

        if (armingProgress >= 1) {
            handleReadyStart();
            audio.setHackProgress(0); // Stop hum
            inputActiveRef.current = false;
            return; // Stop loop
        }
        
        raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    
    const startInput = () => { inputActiveRef.current = true; };
    const endInput = () => { inputActiveRef.current = false; };
    
    // Bind all inputs
    window.addEventListener('keydown', startInput);
    window.addEventListener('keyup', endInput);
    window.addEventListener('mousedown', startInput);
    window.addEventListener('mouseup', endInput);
    window.addEventListener('touchstart', startInput);
    window.addEventListener('touchend', endInput);
    
    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', startInput);
        window.removeEventListener('keyup', endInput);
        window.removeEventListener('mousedown', startInput);
        window.removeEventListener('mouseup', endInput);
        window.removeEventListener('touchstart', startInput);
        window.removeEventListener('touchend', endInput);
        audio.setHackProgress(0);
    };
  }, [status, isIntroPlaying, armingProgress, handleReadyStart]);

  const { handleInput } = useInput(
    game,
    progression.applyUpgrade,
    handleStartClick
  );

  const { draw } = useRendering(
    canvasRef,
    game,
    movement.getMoveProgress,
    uiStyle
  );

  const update = useCallback((dt: number) => {
    gameTimeRef.current += dt;

    if (invulnerabilityTimeRef.current > 0) {
      invulnerabilityTimeRef.current = Math.max(0, invulnerabilityTimeRef.current - dt);
    }

    const timeSinceHit = gameTimeRef.current - lastDamageTimeRef.current;
    setDamageOpacity(timeSinceHit < 500 ? (500 - timeSinceHit) / 500 : 0);

    // ─────────────────────────────
    // CORE LOOP PHASES
    // ─────────────────────────────

    // 1. STAGE TRANSITION (Blocking)
    if (status === GameStatus.STAGE_TRANSITION) {
      // Advance time for transition animation
      stageController.checkTransition(); // Updates timer and requests advance if done
      
      // Check if controller requested advance
      if (stageController.stageAdvanceRequestedRef.current) {
          // ORCHESTRATOR COMMIT: Update State
          game.stageRef.current += 1;
          
          // ORCHESTRATOR COMMIT: Update Music
          const newStage = game.stageRef.current;
          const isBoss = newStage % 5 === 0;
          const mapKey = isBoss ? 0 : ((newStage - 1) % 4) + 1;
          const targetLayers = MUSIC_STAGE_MAP[mapKey] || MUSIC_STAGE_MAP[1];
          audio.setLayers(targetLayers);
          
          // Reset Simulation for new stage
          stageController.resetForNewStage(newStage);
          
          // Audio Cue
          if (isBoss) {
             // audio.play('BOSS_WARNING'); // Optional
          }
      }

      fx.updateFX();
      fx.tickTranslation(dt);
      // Consume Dev Intents even during transition (e.g. force skip)
      consumeDevIntents(game, spawner, progression, stageController);
      return;
    }

    // 2. SIMULATION
    if (status === GameStatus.PLAYING) {
      stageController.checkStageCompletion();

      const head = movement.getNextHead(dt);
      if (head) {
        const moveAllowed = !collisions.checkMoveCollisions(head);
        if (moveAllowed) {
          const grew = collisions.handleEat(head);
          movement.commitMove(head, grew);
          collisions.updateCollisionLogic(dt);
          movement.updateEnemies(dt, head);
        }
      } else if (game.snakeRef.current[0]) {
        movement.updateEnemies(dt, game.snakeRef.current[0]);
        collisions.updateCollisionLogic(dt);
      }
      
      gapAwareness.update(dt);
      bossController.update(dt);
      collisions.checkDynamicCollisions();
      collisions.checkXPCollection();
      voidHazard.update();
      projectilePhysics.update(dt);
      combat.update(dt);
      spawner.update(dt);
      progression.applyPassiveScore(dt);
    }

    // 3. DEV INTENT CONSUMPTION (Authoritative Phase)
    consumeDevIntents(game, spawner, progression, stageController);

    // 4. AUDIO & PROGRESSION CHECKS
    music.updateMusic(); // Only updates dynamic SFX parameters now

    if (uiCombo > maxComboRef.current) {
        maxComboRef.current = uiCombo;
    }

    if (status === GameStatus.PLAYING) {
        const unlocks = evaluateUnlocks({
            score: scoreRef.current,
            stage: game.stageRef.current,
            level: game.levelRef.current,
            maxCombo: maxComboRef.current,
            terminalsHacked: terminalsHackedRef.current,
            bossDefeated: bossDefeatedRef.current,
            integrity: tailIntegrityRef.current,
            xpOrbsCollected: 0 
        }, unlockedCosmetics);
        
        if (unlocks.length > 0) {
            unlocks.forEach(id => unlockCosmetic(id));
        }
    }

    // 5. FX UPDATE
    fx.updateFX();
    fx.tickTranslation(dt);

    game.audioEventsRef.current.forEach(event => {
      audio.play(event.type, event.data);
    });
    game.audioEventsRef.current = [];

    // 6. DEFERRED CLEANUP
    const cleanup = <T extends { shouldRemove?: boolean }>(list: T[]) => list.filter(e => !e.shouldRemove);
    game.enemiesRef.current = cleanup(game.enemiesRef.current);
    game.projectilesRef.current = cleanup(game.projectilesRef.current);
    game.particlesRef.current = cleanup(game.particlesRef.current);
    game.floatingTextsRef.current = cleanup(game.floatingTextsRef.current);
    game.shockwavesRef.current = cleanup(game.shockwavesRef.current);
    game.lightningArcsRef.current = cleanup(game.lightningArcsRef.current);
    game.minesRef.current = cleanup(game.minesRef.current);
    game.foodRef.current = cleanup(game.foodRef.current);
    game.terminalsRef.current = cleanup(game.terminalsRef.current);
    game.hitboxesRef.current = cleanup(game.hitboxesRef.current);
    game.cliAnimationsRef.current = cleanup(game.cliAnimationsRef.current);

  }, [
    status, stageController, movement, collisions, combat, spawner, progression, music, fx,
    unlockedCosmetics, uiCombo, scoreRef, game.stageRef, game.levelRef, maxComboRef,
    terminalsHackedRef, bossDefeatedRef, tailIntegrityRef, unlockCosmetic, voidHazard, 
    gapAwareness, projectilePhysics, bossController, game.enemiesRef, game.projectilesRef,
    game.particlesRef, game.floatingTextsRef, game.shockwavesRef, game.lightningArcsRef,
    game.minesRef, game.foodRef, game.terminalsRef, game.hitboxesRef, game.snakeRef,
    game.audioEventsRef, gameTimeRef, invulnerabilityTimeRef, lastDamageTimeRef, game
  ]);

  useGameLoop(game, update, draw);

  useEffect(() => {
    if (status === GameStatus.RESUMING) {
      if (resumeCountdown <= 0) {
        setStatus(GameStatus.PLAYING);
        return;
      }
      const timer = window.setInterval(() => {
        game.setResumeCountdown(c => {
          if (c <= 1) {
            setStatus(GameStatus.PLAYING);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [status, resumeCountdown, setStatus, game]);

  const showHUD = hudBooted && (
    status === GameStatus.PLAYING ||
    status === GameStatus.READY || 
    status === GameStatus.PAUSED ||
    status === GameStatus.RESUMING ||
    status === GameStatus.STAGE_TRANSITION ||
    status === GameStatus.GAME_OVER ||
    status === GameStatus.LEVEL_UP
  );

  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setStatus(GameStatus.CONFIGURATION);
    audio.play('MOVE');
  }, [setDifficulty, setStatus]);

  const handleConfigurationComplete = useCallback(() => {
    setStatus(GameStatus.CHARACTER_SELECT);
  }, [setStatus]);

  const selectCharacter = (char: CharacterProfile) => {
    if (bindingState) return;

    setBindingState({ charId: char.id, phase: 'LOCK' });
    audio.play('UI_HARD_CLICK'); 

    // Deterministic flow
    setBindText('PILOT LOCKED');

    setTimeout(() => {
        setBindingState(prev => prev ? { ...prev, phase: 'SYNC' } : null);
        // audio.play('SYS_RECOVER'); // Sound effect transition
    }, 500);

    setTimeout(() => {
        setSelectedChar(char);
        game.resetGame(char);
        spawner.spawnFood();
        setStatus(GameStatus.READY);
        setBindingState(null);
        setHudBooted(false);
        setTimeout(() => {
            setHudBooted(true);
        }, 150);
    }, 1100);
  };

  const handleMouseEnter = useCallback(
    (_e: React.MouseEvent, _id?: string) => {
        if (!bindingState) audio.play('MOVE');
    },
    [bindingState]
  );

  const handleMouseLeave = useCallback(() => {
  }, []);

  const handleArchiveOpen = useCallback(() => {
      markArchiveRead();
      setStatus(GameStatus.ARCHIVE);
  }, [markArchiveRead, setStatus]);

  if (status === GameStatus.ARCHIVE) {
    return <ArchiveTerminal onClose={() => setStatus(GameStatus.IDLE)} />;
  }

  if (status === GameStatus.CONFIGURATION) {
      return <ModelConfigurationPass difficultyId={difficulty} onComplete={handleConfigurationComplete} />;
  }

  return (
      <div 
        className="w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
        style={{ fontFamily: uiStyle.typography.fontFamily }}
      >
          <UnlockToast queue={toastQueue} onClear={clearToast} />

          {/* ENGINE TOOLS (DEV ONLY) */}
          {IS_DEV && <DevTools game={game} />}

          <GameHUD game={game} showUI={showHUD}>
              <div className="relative w-full h-full">
                  <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      className="w-full h-full block object-contain z-0"
                      style={{
                          filter: `contrast(${settings.highContrast ? 1.2 : 1.0}) brightness(${settings.highContrast ? 1.1 : 1.0})`
                      }}
                  />
                  
                  {/* DAMAGE OVERLAY */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-75"
                    style={{ 
                        opacity: damageOpacity * 0.4,
                        backgroundColor: uiStyle.colors.danger,
                        mixBlendMode: 'overlay'
                    }}
                  />
                  <div 
                    className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-75"
                    style={{ 
                        opacity: damageOpacity,
                        boxShadow: `inset 0 0 100px ${uiStyle.colors.danger}80` 
                    }}
                  />

                  {status === GameStatus.STAGE_TRANSITION && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                          <div className="text-4xl md:text-6xl font-display text-cyan-400 tracking-[0.2em] animate-[pulse_0.5s_ease-in-out_infinite] drop-shadow-[0_0_30px_#0ff] text-center">
                              SECTOR DECRYPTION
                          </div>
                      </div>
                  )}

                  {/* ─── SEQUENCE ARMED (REPLACES PASSIVE READY) ─── */}
                  {status === GameStatus.READY && (
                      <div 
                          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[2px] pointer-events-auto cursor-pointer animate-in fade-in duration-300" 
                          // Click handler logic moved to global listeners to support hold
                      >
                          {isIntroPlaying ? (
                              <div className="flex flex-col items-center gap-4">
                                  <div className="text-6xl text-cyan-400 font-bold animate-ping">///</div>
                                  <div className="text-white font-mono text-sm tracking-widest animate-pulse">SEQUENCE START</div>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center w-full max-w-md">
                                  {/* Background Elements */}
                                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
                                  
                                  {/* CLI Text */}
                                  <div className="font-mono text-xs text-cyan-600 mb-8 space-y-1 w-64">
                                      {armingTextStep >= 1 && <div className="animate-in fade-in slide-in-from-left-2 duration-300">{`> PILOT LOCKED`}</div>}
                                      {armingTextStep >= 2 && <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-75">{`> NEURAL LINK STABLE`}</div>}
                                      {armingTextStep >= 3 && <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-150 text-cyan-400 font-bold">{`> SEQUENCE ARMED`}</div>}
                                  </div>

                                  {/* Arming Gauge */}
                                  <div className="relative w-64 h-12 border-2 border-cyan-800 flex items-center justify-center overflow-hidden bg-black/50">
                                      <div 
                                          className="absolute inset-0 bg-cyan-500/20 transition-all duration-75 ease-linear"
                                          style={{ width: `${armingProgress * 100}%` }}
                                      ></div>
                                      <div 
                                          className="absolute bottom-0 left-0 h-1 bg-cyan-400 transition-all duration-75 ease-linear shadow-[0_0_10px_cyan]"
                                          style={{ width: `${armingProgress * 100}%` }}
                                      ></div>
                                      
                                      <div className="relative z-10 text-cyan-200 font-bold tracking-[0.2em] text-sm animate-pulse">
                                          HOLD INPUT TO ENGAGE
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {status === GameStatus.RESUMING && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                          <div className="text-center">
                              <div 
                                  className="text-6xl md:text-8xl font-display font-bold tracking-widest drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] animate-pulse"
                                  style={{ color: uiStyle.colors.primary }}
                              >
                                  {resumeCountdown > 0 ? resumeCountdown : 'GO!'}
                              </div>
                              <div className="text-lg text-cyan-200 font-mono mt-4 tracking-[0.3em]">
                                  SYSTEM RESUMING...
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </GameHUD>
          
          {/* ... Rest of UI components (Controls, DevMenu, etc) ... */}
          {isTouch && (
              <div className="absolute inset-0 pointer-events-none z-50">
                 {settings.mobileControlScheme === 'JOYSTICK' && (
                     <div className="absolute bottom-10 left-10 pointer-events-auto">
                         <VirtualJoystick onDirection={handleInput} />
                     </div>
                 )}
                 {settings.mobileControlScheme === 'ARROWS' && (
                     <div className="absolute bottom-10 right-10 pointer-events-auto">
                         <ArrowControls onDirection={handleInput} />
                     </div>
                 )}
                 {settings.mobileControlScheme === 'SWIPE' && (
                     <SwipeControls onDirection={handleInput} />
                 )}
              </div>
          )}

          {showHUD && (
              <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                  <button 
                      onClick={toggleMute}
                      className="bg-black/60 border hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      style={{ borderColor: uiStyle.colors.grid, color: uiStyle.colors.text }}
                      title="Toggle Mute"
                  >
                      {isMuted ? '🔇' : '🔊'}
                  </button>
              </div>
          )}
          
          {IS_DEV && showDevMenu && (
              <DevBootstrap 
                  onBoot={handleBootstrap} 
                  onCancel={() => setShowDevMenu(false)}
                  onToggleFreeRoam={handleToggleFreeRoam}
              />
          )}

          {/* VISUAL INDICATORS */}
          {status === GameStatus.PLAYING && cameraControlsEnabled && (
              <div className="absolute bottom-4 right-4 z-40 bg-black/60 border border-cyan-500/50 p-2 rounded text-[10px] font-mono text-cyan-400 pointer-events-none">
                  <div className="font-bold mb-1">CAMERA CONTROL ACTIVE</div>
                  <div>SCROLL: ZOOM</div>
                  <div>C: ANGLE</div>
                  <div>Q/E: ROTATE</div>
              </div>
          )}
          
          {cameraRef.current.isLocked && status === GameStatus.PLAYING && (
              <div className="absolute bottom-4 right-4 z-40 bg-black/60 border border-red-500/50 p-2 rounded text-[10px] font-mono text-red-400 pointer-events-none">
                  <div className="font-bold">CAMERA LOCKED</div>
              </div>
          )}
          
          {devModeFlagsRef.current.godMode && (
              <div className="absolute bottom-16 right-4 z-40 bg-red-900/80 border border-red-500 p-2 rounded text-[10px] font-mono text-white pointer-events-none animate-pulse">
                  GOD MODE ACTIVE
              </div>
          )}

          {status === GameStatus.IDLE && !showDevMenu && (
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50 animate-in fade-in duration-500 pointer-events-auto transition-all duration-75 ${
                    initPhase === 'GLITCH' ? 'translate-x-1 skew-x-2' : ''
                }`}
                style={
                    initPhase === 'GLITCH' 
                        ? { textShadow: '2px 0 rgba(255,0,0,0.5), -2px 0 rgba(0,255,255,0.5)', filter: 'contrast(1.2)' } 
                        : initPhase === 'STALL' 
                            ? { filter: 'grayscale(1) brightness(0.5)' } 
                            : {}
                }
              >
                  {initPhase === 'RECOVER' && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center z-[60]">
                          <div className="font-mono text-cyan-500 text-sm tracking-widest animate-pulse">
                              {recoveryText}
                          </div>
                      </div>
                  )}

                  <div className="text-center mb-12">
                      <h1 className="text-6xl md:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-700 drop-shadow-[0_0_20px_rgba(0,255,255,0.6)] tracking-tighter mb-4">
                          NEON SNAKE
                      </h1>
                      <div className={`text-xl md:text-2xl font-mono text-cyan-500 tracking-[0.5em] ${initPhase === 'NONE' ? 'animate-pulse' : ''}`}>
                          CYBER PROTOCOL
                      </div>
                  </div>
                  
                  <div className={`transition-opacity duration-0 ${initPhase === 'STALL' || initPhase === 'RECOVER' ? 'opacity-0' : 'opacity-100'}`}>
                      <button 
                          onClick={handleStartClick}
                          className="group relative px-12 py-4 bg-cyan-900/20 border-2 border-cyan-500 hover:bg-cyan-500/20 transition-all duration-200 overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <span className="relative text-xl font-bold tracking-widest text-cyan-100 group-hover:text-white">
                              INITIALIZE SYSTEM
                          </span>
                      </button>
                  </div>

                  <div className="mt-8 text-xs text-gray-500 font-mono">
                      v1.0.0 // SECURE CONNECTION ESTABLISHED
                  </div>
                  
                  {IS_DEV && (
                      <div className="absolute bottom-6 left-6 text-xs font-mono text-red-500">
                          DEV BUILD :: SHIFT+D TO BOOTSTRAP :: [ ` ] FOR TOOLS
                      </div>
                  )}
                  
                  <div 
                      className={`absolute bottom-6 right-6 text-xs font-mono tracking-widest cursor-pointer transition-all duration-500 group ${
                          hasUnreadArchiveData 
                          ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] animate-pulse' 
                          : 'text-gray-700 hover:text-gray-500'
                      }`} 
                      onClick={handleArchiveOpen}
                  >
                      {hasUnreadArchiveData ? (
                          <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                              [ ARCHIVE_UPDATED ]
                          </span>
                      ) : (
                          '[ ARCHIVE ACCESS ]'
                      )}
                  </div>
              </div>
          )}

          {status === GameStatus.DIFFICULTY_SELECT && (
              <div className="absolute inset-0 z-40 bg-black/95 flex flex-col pointer-events-auto animate-in fade-in duration-300">
                  <div className="flex-none p-6 bg-black/95 border-b border-cyan-900/50 backdrop-blur-md z-50 flex flex-col items-center shadow-lg">
                      <h2 className="text-4xl text-white font-display tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)] mb-2">
                          THREAT LEVEL
                      </h2>
                      <div className="h-1 w-32 bg-cyan-500/50 rounded-full"></div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 flex items-center justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
                          {Object.values(DIFFICULTY_CONFIGS).map((conf) => {
                              const isUnlocked = unlockedDifficulties.includes(conf.id);
                              return (
                                  <button
                                    key={conf.id}
                                    disabled={!isUnlocked}
                                    onClick={() => handleDifficultySelect(conf.id)}
                                    className={`
                                        relative group border rounded-xl p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden text-left h-full min-h-[340px]
                                        ${isUnlocked 
                                            ? 'border-gray-700 bg-[#0a0a0a] hover:border-cyan-500/50 hover:bg-gray-900/80 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)] cursor-pointer' 
                                            : 'border-gray-800 bg-black/60 opacity-60 cursor-not-allowed grayscale'}
                                    `}
                                  >
                                      {isUnlocked && (
                                          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] transition-opacity duration-500 pointer-events-none" />
                                      )}
                                      <div className="z-10 mb-4">
                                          <div className={`text-2xl font-display font-bold tracking-widest mb-2 ${isUnlocked ? conf.color : 'text-gray-600'}`}>
                                              {conf.label}
                                          </div>
                                          <p className="text-xs text-gray-400 font-mono leading-relaxed h-12">
                                              {conf.description}
                                          </p>
                                      </div>
                                      <div className="mt-auto pt-4 border-t border-gray-800/50 flex justify-between items-center">
                                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                                              MULTIPLIER: x{conf.spawnRateMod}
                                          </div>
                                          <div className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                              {isUnlocked ? '[ SELECT ]' : '[ LOCKED ]'}
                                          </div>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  <div className="flex-none p-6 text-center text-xs text-gray-600 font-mono border-t border-cyan-900/30 bg-black/95 backdrop-blur-md z-50">
                      WARNING: HIGH VELOCITY KINETIC INTERACTION AUTHORIZED
                  </div>
              </div>
          )}

          {status === GameStatus.CHARACTER_SELECT && (
              <div className="absolute inset-0 z-40 bg-black/95 flex flex-col pointer-events-auto animate-in fade-in duration-300">
                  <div className="flex-none p-6 bg-black/95 border-b border-cyan-900/50 backdrop-blur-md z-50 flex flex-col items-center shadow-lg">
                      <h2 className="text-4xl text-white font-display tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)] mb-2">
                          SELECT OPERATOR
                      </h2>
                      <div className="h-1 w-32 bg-cyan-500/50 rounded-full"></div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex items-center justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
                          {CHARACTERS.map((char) => {
                              const stats = CHAR_STATS[char.id] || { off: 5, def: 5, spd: 5, util: 5 };
                              const isSelected = bindingState?.charId === char.id;
                              const isDimmed = bindingState && !isSelected;

                              return (
                                  <button
                                      key={char.id}
                                      onClick={() => selectCharacter(char)}
                                      onMouseEnter={(e) => handleMouseEnter(e, char.id)}
                                      onMouseLeave={handleMouseLeave}
                                      disabled={!!bindingState}
                                      className={`
                                          relative group border rounded-xl p-1 transition-all duration-300 flex flex-col overflow-hidden text-left h-full min-h-[500px]
                                          ${isSelected 
                                              ? 'border-cyan-400 bg-cyan-950/30 scale-105 z-10 shadow-[0_0_50px_rgba(0,255,255,0.2)]' 
                                              : isDimmed 
                                                  ? 'border-gray-800 bg-black/80 opacity-30 grayscale blur-sm scale-95'
                                                  : 'border-gray-800 bg-black/60 hover:border-cyan-500/50 hover:bg-gray-900/80 hover:-translate-y-1'
                                          }
                                      `}
                                  >
                                      <div className="flex-1 flex flex-col bg-black/40 rounded-lg p-5 relative z-10 h-full">
                                          <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-2">
                                              <div>
                                                  <div className="text-xs font-mono text-cyan-600 mb-1 tracking-widest">{char.tag} CLASS</div>
                                                  <div className="text-2xl font-display font-bold text-white tracking-wider group-hover:text-cyan-200 transition-colors">{char.name}</div>
                                              </div>
                                              <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
                                                  <div className="w-10 h-10 border border-white/20 rounded flex items-center justify-center bg-white/5">
                                                      <div className="w-6 h-6" style={{ backgroundColor: char.color, borderRadius: '2px' }} />
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="text-sm text-gray-400 leading-relaxed mb-6 h-12">
                                              {char.description}
                                          </div>
                                          <div className="space-y-2 mb-6 bg-black/20 p-3 rounded border border-white/5">
                                              <CompactStatBar label="OFFENSE" value={stats.off} max={10} color="#ef4444" />
                                              <CompactStatBar label="DEFENSE" value={stats.def} max={10} color="#3b82f6" />
                                              <CompactStatBar label="SPEED" value={stats.spd} max={10} color="#eab308" />
                                              <CompactStatBar label="UTILITY" value={stats.util} max={10} color="#a855f7" />
                                          </div>

                                          {/* STARTING LOADOUT */}
                                          <div className="mb-4">
                                              <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-1">
                                                  <div className="w-1 h-3 bg-cyan-500"></div>
                                                  <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">STARTING LOADOUT</span>
                                              </div>
                                              <div className="flex gap-2 flex-wrap">
                                                  {getStartingLoadout(char.initialStats).map(id => {
                                                      const desc = DESCRIPTOR_REGISTRY[id];
                                                      if (!desc) return null;
                                                      return (
                                                          <div key={id} className="relative group w-10 h-10 bg-black border border-gray-700 rounded flex items-center justify-center hover:border-cyan-400 transition-colors">
                                                              <span className="text-lg">{desc.icon}</span>
                                                              <HUDTooltip title={desc.name} description={desc.description} />
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                          
                                          {/* KERNEL ARCHITECTURE DISPLAY */}
                                          <div className="mt-auto">
                                              <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-1">
                                                  <div className="w-1 h-3 bg-cyan-500"></div>
                                                  <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">KERNEL ARCHITECTURE</span>
                                              </div>
                                              <div className="space-y-2">
                                                  {char.traits.map((t, i) => (
                                                      <div key={i} className="bg-gray-900/40 border border-gray-700/50 p-2 rounded relative group hover:bg-gray-800/60 transition-colors">
                                                          <div className="flex justify-between items-center mb-0.5">
                                                              <div className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">{t.name}</div>
                                                              <div className={`text-[8px] px-1 rounded ${t.type === 'SCALABLE' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-800 text-gray-500'}`}>{t.type === 'SCALABLE' ? 'GROWTH' : 'STATIC'}</div>
                                                          </div>
                                                          <div className="text-gray-400 text-[10px] leading-tight font-mono">{t.description}</div>
                                                          <div className="absolute top-2 right-2 w-1 h-1 bg-cyan-900 rounded-full group-hover:bg-cyan-400 transition-colors opacity-0 group-hover:opacity-100"></div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                      {isSelected && (
                                          <div className="absolute inset-0 bg-cyan-500/10 z-20 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-200">
                                              <div className="bg-black/90 border border-cyan-400 p-4 shadow-2xl text-center transform scale-110">
                                                  <div className="text-cyan-400 font-bold tracking-[0.2em] animate-pulse mb-1">
                                                      {bindingState?.phase === 'SYNC' ? 'SYNCING...' : 'CONFIRMING'}
                                                  </div>
                                                  <div className="text-[10px] text-cyan-600 font-mono">
                                                      {bindText}
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              </div>
          )}

          {modalState === 'PAUSE' && (
              <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                  <div className="bg-gray-900 border border-gray-700 p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
                      <h2 className="text-3xl font-display font-bold text-white mb-8 tracking-widest">SYSTEM PAUSED</h2>
                      <div className="space-y-3">
                          <button 
                              onClick={togglePause}
                              className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded tracking-widest transition-colors"
                          >
                              RESUME
                          </button>
                          <button 
                              onClick={openSettings}
                              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded tracking-widest transition-colors border border-gray-700"
                          >
                              SETTINGS
                          </button>
                          <button 
                              onClick={() => {
                                  setStatus(GameStatus.IDLE);
                                  setModalState('NONE');
                                  audio.stopMusic();
                              }}
                              className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold rounded tracking-widest transition-colors border border-red-900/50"
                          >
                              ABORT RUN
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {modalState === 'SETTINGS' && (
              <SettingsMenu 
                  settings={settings} 
                  setSettings={setSettings} 
                  onClose={closeSettings}
                  unlockedCosmetics={unlockedCosmetics}
                  cameraControlsEnabled={cameraControlsEnabled}
                  setCameraControlsEnabled={setCameraControlsEnabled}
              />
          )}

          {status === GameStatus.LEVEL_UP && (
              <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-full max-w-4xl">
                      <div className="text-center mb-8">
                          <div className="text-cyan-500 font-mono text-sm tracking-[0.5em] mb-2 animate-pulse">SYSTEM UPGRADE</div>
                          <h2 className="text-5xl font-display font-bold text-white tracking-wider drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                              CHOOSE PROTOCOL
                          </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {upgradeOptions.map((option, index) => (
                              <button
                                  key={index}
                                  onClick={() => progression.applyUpgrade(option)}
                                  className={`
                                      group relative p-1 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]
                                      ${RARITY_STYLES[option.rarity] || 'border-gray-700 bg-gray-900'}
                                      border-2 rounded-xl overflow-hidden text-left h-full
                                  `}
                              >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                  
                                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold tracking-widest bg-black/50 border-b border-l border-white/10 rounded-bl-xl ${RARITY_TEXT_COLORS[option.rarity]}`}>
                                      {RARITY_LABELS[option.rarity]}
                                  </div>

                                  <div className="p-6 h-full flex flex-col">
                                      <div className="mb-4 text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300 origin-left">
                                          {option.icon}
                                      </div>

                                      <div className="mb-2">
                                          <div className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-cyan-200 transition-colors">
                                              {option.title}
                                          </div>
                                          <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                                              {option.category}
                                          </div>
                                      </div>

                                      <div className="text-xs text-gray-300 leading-relaxed mb-4 flex-1">
                                          {option.description}
                                      </div>

                                      {option.stats && option.stats.length > 0 && (
                                          <div className="space-y-1 mt-auto pt-4 border-t border-white/10">
                                              {option.stats.map((stat, i) => (
                                                  <div key={i} className="text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                                                      <span className="w-1 h-1 bg-cyan-500 rounded-full"></span>
                                                      {stat}
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      <div className="mt-4 text-[10px] text-gray-500 font-mono text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                          [PRESS {index + 1}]
                                      </div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 z-[60] bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 pointer-events-auto animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                  
                  {/* Background Noise / Hex Dump */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none font-mono text-[10px] text-red-500 overflow-hidden leading-none whitespace-pre-wrap break-all p-4 select-none z-0">
                      {hexDump}
                  </div>

                  <div className="relative z-10 w-full max-w-2xl bg-black/90 border-2 border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.4)] flex flex-col">
                      
                      {/* Header Bar */}
                      <div className="bg-red-600 text-black font-bold px-4 py-1 flex justify-between items-center mb-1 text-xs tracking-widest font-mono">
                          <span>SYSTEM_HALT // CRITICAL_FAILURE</span>
                          <span>ERR: 0xDEADBEEF</span>
                      </div>

                      <div className="p-8 md:p-12 flex flex-col items-center">
                          <div className="mb-6 relative">
                              <h2 className="text-6xl md:text-8xl font-black text-red-500 tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-pulse glitch-intense">
                                  FATAL ERROR
                              </h2>
                          </div>
                          
                          <div className="w-full text-center border-l-4 border-red-500 bg-red-900/20 py-3 mb-8">
                              <div className="text-red-400 font-mono text-xs tracking-widest mb-1">EXCEPTION_MSG</div>
                              <div className="text-xl md:text-2xl font-mono text-red-100 tracking-wider">
                                  {failureMessageRef.current || 'UNKNOWN_SYSTEM_FAILURE'}
                              </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10 border-t border-b border-red-900/50 py-6">
                              <div className="flex flex-col items-center">
                                  <div className="text-[10px] text-red-500 font-bold tracking-widest mb-1">SCORE_LOG</div>
                                  <div className="text-2xl font-mono text-white">{Math.floor(scoreRef.current).toLocaleString()}</div>
                              </div>
                              <div className="flex flex-col items-center border-l border-red-900/30">
                                  <div className="text-[10px] text-red-500 font-bold tracking-widest mb-1">SECTOR</div>
                                  <div className="text-2xl font-mono text-white">{game.stageRef.current}</div>
                              </div>
                              <div className="flex flex-col items-center border-l border-red-900/30">
                                  <div className="text-[10px] text-red-500 font-bold tracking-widest mb-1">KILLS</div>
                                  <div className="text-2xl font-mono text-white">{enemiesKilledRef.current}</div>
                              </div>
                              <div className="flex flex-col items-center border-l border-red-900/30">
                                  <div className="text-[10px] text-red-500 font-bold tracking-widest mb-1">LEVEL</div>
                                  <div className="text-2xl font-mono text-white">{game.levelRef.current}</div>
                              </div>
                          </div>

                          <button 
                              onClick={handleStartClick}
                              className="group relative w-full max-w-md px-8 py-4 bg-transparent border border-red-500 text-red-500 font-bold tracking-[0.3em] hover:bg-red-600 hover:text-black transition-all duration-200 overflow-hidden uppercase text-sm"
                          >
                              <div className="absolute inset-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] opacity-50"></div>
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                  <span>[ INITIATE_REBOOT_SEQUENCE ]</span>
                              </span>
                          </button>
                      </div>
                      
                      {/* Footer Decoration */}
                      <div className="bg-[#0a0000] border-t border-red-900/50 p-2 flex justify-between text-[8px] font-mono text-red-700">
                          <span>CORE_DUMP_SAVED</span>
                          <span>MEMORY_ADDRESS: 0xFF0042A1</span>
                      </div>
                  </div>
              </div>
          )}

      </div>
  );
};

export const SnakeGame: React.FC = () => {
  const game = useGameState();
  const styleId = game.settings.hudConfig.theme === 'AMBER' ? 'amber' : 
                  game.settings.highContrast ? 'high_contrast' : 'neon';

  return (
    <UIStyleProvider styleId={styleId}>
      <VisionProtocolProvider protocolId={game.settings.visionProtocolId}>
        <GameInner game={game} />
      </VisionProtocolProvider>
    </UIStyleProvider>
  );
};
