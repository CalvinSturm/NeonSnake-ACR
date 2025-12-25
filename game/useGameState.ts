
import { useRef, useState, useCallback } from 'react';
import { 
  GameStatus, Difficulty, CharacterProfile, Direction, UpgradeStats, 
  Enemy, FoodItem, Projectile, Shockwave, LightningArc, Particle, 
  FloatingText, Mine, Terminal, DigitalRainDrop, AudioRequest, Point, UpgradeOption, ModalState
} from '../types';
import { CHARACTERS } from '../constants';
import { resolveTraits, TraitModifiers } from './traitResolver';

export interface UserSettings {
  skipCountdown: boolean;
  uiScale: number;
  fxIntensity: number; // 0.0 to 1.0
  screenShake: boolean;
  highContrast: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  skipCountdown: false,
  uiScale: 1.0,
  fxIntensity: 1.0,
  screenShake: true,
  highContrast: false,
  musicVolume: 0.3,
  sfxVolume: 0.4
};

export function useGameState() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [modalState, setModalState] = useState<ModalState>('NONE'); // MODAL AUTHORITY
  
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>([Difficulty.EASY]);
  
  const [uiScore, setUiScore] = useState(0);
  const [uiXp, setUiXp] = useState(0);
  const [uiLevel, setUiLevel] = useState(1);
  const [uiStage, setUiStage] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [uiCombo, setUiCombo] = useState(0);
  const [uiShield, setUiShield] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState({ slow: false, magnet: false });
  const [isMuted, setIsMuted] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // REFS
  const runIdRef = useRef(0); // RUN BOUNDARY
  const settingsReturnRef = useRef<ModalState>('NONE');

  const snakeRef = useRef<Point[]>([]);
  const prevTailRef = useRef<Point | null>(null); // NEW: For smooth tail interpolation
  const tailIntegrityRef = useRef(100); // NEW: Tail HP for physical blocking
  
  // TRAIT REF (Resolved on Reset)
  const traitsRef = useRef<TraitModifiers>(resolveTraits(null));
  
  const enemiesRef = useRef<Enemy[]>([]);
  const foodRef = useRef<FoodItem[]>([]);
  const wallsRef = useRef<Point[]>([]);
  const terminalsRef = useRef<Terminal[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const minesRef = useRef<Mine[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const lightningArcsRef = useRef<LightningArc[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const digitalRainRef = useRef<DigitalRainDrop[]>([]);
  
  const scoreRef = useRef(0);
  const enemiesKilledRef = useRef(0);
  const terminalsHackedRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const gameTimeRef = useRef(0);
  const failureMessageRef = useRef('');
  
  const invulnerabilityTimeRef = useRef(0);
  const audioEventsRef = useRef<AudioRequest[]>([]);
  
  const transitionStartTimeRef = useRef(0);
  const transitionStateRef = useRef({ phase: 'NONE' as const });
  const pendingStatusRef = useRef<GameStatus | null>(null);
  const stageArmedRef = useRef(false);
  const stageReadyRef = useRef(false); // NEW: Signals stage objectives complete (Arming transition)
  
  const bossEnemyRef = useRef<Enemy | null>(null);
  const bossActiveRef = useRef(false);
  const bossDefeatedRef = useRef(false);
  const bossOverrideTimerRef = useRef(0); // NEW: Track periodic switch spawn
  
  const statsRef = useRef<UpgradeStats>({
    weapon: CHARACTERS[0].initialStats.weapon as any,
    slowDurationMod: 1,
    magnetRangeMod: 0,
    shieldActive: false,
    scoreMultiplier: 1,
    foodQualityMod: 1,
    critChance: 0.05,
    critMultiplier: 1.5,
    hackSpeedMod: 1,
    moveSpeedMod: 1,
    activeWeaponIds: [],
    maxWeaponSlots: 3,
    acquiredUpgradeIds: [],
    globalDamageMod: 1,
    globalFireRateMod: 1,
    globalAreaMod: 1,
    globalProjectileSpeedMod: 1
  });

  const powerUpsRef = useRef({ slowUntil: 0, magnetUntil: 0 });
  const ghostCoilCooldownRef = useRef(0);
  
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const directionQueueRef = useRef<Direction[]>([]);
  const levelRef = useRef(1);
  const xpRef = useRef(0);
  const nextLevelXpRef = useRef(100);

  const enemySpawnTimerRef = useRef(0);
  const terminalSpawnTimerRef = useRef(0);
  
  const stageRef = useRef(1);
  const stageScoreRef = useRef(0);
  
  const shakeRef = useRef({ x: 0, y: 0 });
  const chromaticAberrationRef = useRef(0);
  const lastEatTimeRef = useRef(0);
  
  const weaponFireTimerRef = useRef(0);
  const auraTickTimerRef = useRef(0);
  const mineDropTimerRef = useRef(0);
  const prismLanceTimerRef = useRef(0);
  const neonScatterTimerRef = useRef(0);
  const voltSerpentTimerRef = useRef(0);
  const phaseRailChargeRef = useRef(0);
  const echoDamageStoredRef = useRef(0);
  const overclockActiveRef = useRef(false);
  const overclockTimerRef = useRef(0);
  const nanoSwarmAngleRef = useRef(0); 
  
  const lastPowerUpStateRef = useRef({ slow: false, magnet: false });

  // ─────────────────────────────
  // MODAL LOGIC
  // ─────────────────────────────
  const openSettings = useCallback(() => {
    if (modalState === 'SETTINGS') return;
    settingsReturnRef.current = modalState;
    setModalState('SETTINGS');
    if (status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
    }
  }, [modalState, status]);

  const closeSettings = useCallback(() => {
    if (modalState !== 'SETTINGS') return;
    setModalState(settingsReturnRef.current);
    if (settingsReturnRef.current === 'NONE' && status === GameStatus.PAUSED) {
        setStatus(GameStatus.PLAYING);
    }
  }, [modalState, status]);

  const togglePause = useCallback(() => {
    if (modalState === 'SETTINGS') return; // Settings owns input
    
    if (status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
        setModalState('PAUSE');
    } else if (status === GameStatus.PAUSED && modalState === 'PAUSE') {
        setStatus(GameStatus.PLAYING);
        setModalState('NONE');
    }
  }, [status, modalState]);

  // ─────────────────────────────
  // RUN RESET (AUTHORITATIVE)
  // ─────────────────────────────
  const resetGame = useCallback((charProfile: CharacterProfile) => {
    // 1. INCREMENT RUN ID (Invalidates previous run state)
    runIdRef.current += 1;

    // 2. RESOLVE TRAITS (Single Source of Truth)
    traitsRef.current = resolveTraits(charProfile);

    // 3. ATOMIC METRIC RESET
    // SAFE INITIALIZATION: Head(10), Neck(9), Tail(8) for Direction.RIGHT
    // Prevents spawn collision/overlap
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    prevTailRef.current = { x: 7, y: 10 }; // Phantom tail for interpolation on frame 0
    tailIntegrityRef.current = 100; // Reset Block Integrity

    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = [];
    
    enemiesRef.current = [];
    foodRef.current = [];
    wallsRef.current = [];
    terminalsRef.current = [];
    projectilesRef.current = [];
    minesRef.current = [];
    shockwavesRef.current = [];
    lightningArcsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    digitalRainRef.current = [];
    
    scoreRef.current = 0;
    enemiesKilledRef.current = 0;
    terminalsHackedRef.current = 0;
    stageRef.current = 1;
    stageScoreRef.current = 0;
    levelRef.current = 1;
    xpRef.current = 0;
    nextLevelXpRef.current = 500;
    
    gameTimeRef.current = 0;
    startTimeRef.current = Date.now();
    invulnerabilityTimeRef.current = 0;
    transitionStartTimeRef.current = 0;
    
    pendingStatusRef.current = null;
    stageArmedRef.current = false;
    stageReadyRef.current = false;
    
    bossActiveRef.current = false;
    bossDefeatedRef.current = false;
    bossEnemyRef.current = null;
    bossOverrideTimerRef.current = 0;
    
    // ATOMIC STATS RECONSTRUCTION
    const baseStats: UpgradeStats = {
        weapon: JSON.parse(JSON.stringify(CHARACTERS[0].initialStats.weapon)),
        slowDurationMod: 1,
        magnetRangeMod: 0,
        shieldActive: false,
        scoreMultiplier: 1,
        foodQualityMod: 1,
        critChance: 0.05,
        critMultiplier: 1.5,
        hackSpeedMod: 1,
        moveSpeedMod: 1,
        activeWeaponIds: [],
        maxWeaponSlots: 3, 
        acquiredUpgradeIds: [],
        globalDamageMod: 1,
        globalFireRateMod: 1,
        globalAreaMod: 1,
        globalProjectileSpeedMod: 1
    };

    statsRef.current = baseStats;

    if (charProfile.initialStats) {
       Object.assign(statsRef.current, JSON.parse(JSON.stringify(charProfile.initialStats)));
    }

    const w = statsRef.current.weapon;
    const initialWeapons: string[] = [];

    if (w.cannonLevel > 0) initialWeapons.push('CANNON');
    if (w.auraLevel > 0) initialWeapons.push('AURA');
    if (w.nanoSwarmLevel > 0) initialWeapons.push('NANO_SWARM');
    if (w.mineLevel > 0) initialWeapons.push('MINES');
    if (w.chainLightningLevel > 0) initialWeapons.push('LIGHTNING');
    if (w.prismLanceLevel > 0) initialWeapons.push('PRISM_LANCE');
    if (w.neonScatterLevel > 0) initialWeapons.push('NEON_SCATTER');
    if (w.voltSerpentLevel > 0) initialWeapons.push('VOLT_SERPENT');
    if (w.phaseRailLevel > 0) initialWeapons.push('PHASE_RAIL');

    statsRef.current.activeWeaponIds = initialWeapons.slice(0, statsRef.current.maxWeaponSlots);
    
    // Robust Initialization of Acquired IDs (Deduplicate)
    const uniqueAcquired = new Set([...initialWeapons]);
    if (statsRef.current.shieldActive) uniqueAcquired.add('SHIELD');
    statsRef.current.acquiredUpgradeIds = Array.from(uniqueAcquired);

    // UI Resets
    setUiScore(0);
    setUiXp(0);
    setUiLevel(1);
    setUiStage(1);
    setUiCombo(0);
    setUiShield(!!statsRef.current.shieldActive);
    setBossActive(false);
    
    // Clear Modal State (except if handled by caller, but generally reset means new run)
    setModalState('NONE');

    powerUpsRef.current = { slowUntil: 0, magnetUntil: 0 };
    nanoSwarmAngleRef.current = 0;
    
  }, []);

  return {
    status, setStatus,
    modalState, setModalState,
    difficulty, setDifficulty,
    unlockedDifficulties, setUnlockedDifficulties,
    uiScore, setUiScore,
    uiXp, setUiXp,
    uiLevel, setUiLevel,
    uiStage, setUiStage,
    highScore, setHighScore,
    uiCombo, setUiCombo,
    uiShield, setUiShield,
    bossActive, setBossActive,
    selectedChar, setSelectedChar,
    upgradeOptions, setUpgradeOptions,
    resumeCountdown, setResumeCountdown,
    activePowerUps, setActivePowerUps,
    isMuted, setIsMuted,
    
    settings, setSettings,
    
    runIdRef, // Expose Run ID
    
    snakeRef,
    prevTailRef, // Exposed for rendering interpolation
    tailIntegrityRef, // Exposed for logic
    traitsRef, // Exposed for logic systems
    
    enemiesRef,
    foodRef,
    wallsRef,
    terminalsRef,
    projectilesRef,
    minesRef,
    shockwavesRef,
    lightningArcsRef,
    particlesRef,
    floatingTextsRef,
    digitalRainRef,
    
    scoreRef,
    enemiesKilledRef,
    terminalsHackedRef,
    startTimeRef,
    gameTimeRef,
    failureMessageRef,
    
    invulnerabilityTimeRef,
    audioEventsRef,
    
    transitionStartTimeRef,
    transitionStateRef,
    pendingStatusRef,
    stageArmedRef,
    stageReadyRef,
    
    bossEnemyRef,
    bossActiveRef,
    bossDefeatedRef,
    bossOverrideTimerRef, // Added
    
    statsRef,
    powerUpsRef,
    ghostCoilCooldownRef,
    
    directionRef,
    directionQueueRef,
    levelRef,
    xpRef,
    nextLevelXpRef,
    
    enemySpawnTimerRef,
    terminalSpawnTimerRef,
    
    stageRef,
    stageScoreRef,
    
    shakeRef,
    chromaticAberrationRef,
    lastEatTimeRef,
    
    weaponFireTimerRef,
    auraTickTimerRef,
    mineDropTimerRef,
    prismLanceTimerRef,
    neonScatterTimerRef,
    voltSerpentTimerRef,
    phaseRailChargeRef,
    echoDamageStoredRef,
    overclockActiveRef,
    overclockTimerRef,
    nanoSwarmAngleRef,
    
    lastPowerUpStateRef,
    
    resetGame,
    openSettings,
    closeSettings,
    togglePause
  };
}
