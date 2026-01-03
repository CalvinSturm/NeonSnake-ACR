
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  GameStatus, Difficulty, CharacterProfile, Direction, UpgradeStats, 
  Enemy, FoodItem, Projectile, Shockwave, LightningArc, Particle, 
  FloatingText, Mine, Terminal, DigitalRainDrop, AudioRequest, Point, UpgradeOption, ModalState,
  MobileControlScheme, CameraMode, Hitbox, WeaponStats
} from '../types';
import { HUDConfig, HUDLayoutMode } from '../ui/hud/types';
import { CHARACTERS, CANVAS_WIDTH, DEFAULT_SETTINGS, PHYSICS, STAMINA_CONFIG } from '../constants';
import { resolveTraits, TraitModifiers } from './traitResolver';
import { audio } from '../utils/audio';
import { VisionProtocolId } from '../ui/vision/VisionProtocolRegistry';
import { CosmeticProfile, loadCosmeticProfile, saveCosmeticProfile } from './cosmetics/CosmeticProfile';
import { hasUnreadMemories, markMemoriesAsRead } from './memory/MemorySystem';
import { CameraState, CameraBehavior } from './camera/types';
import { PhysicsState } from './physics/types';
import { useFloorVolumes } from './floor/useFloorVolumes';
import { COSMETIC_REGISTRY } from './cosmetics/CosmeticRegistry';

export interface UserSettings {
  skipCountdown: boolean;
  uiScale: number;
  gameScale: number;
  fxIntensity: number;
  screenShake: boolean;
  highContrast: boolean;
  crtEffect: boolean; // New
  reduceFlashing: boolean; // New
  invertRotation: boolean; // New
  musicVolume: number;
  sfxVolume: number;
  mobileControlScheme: MobileControlScheme;
  controlOpacity: number;
  controlPos: Point | null;
  isControlEditMode: boolean;
  visionProtocolId: VisionProtocolId;
  hudConfig: HUDConfig;
  snakeStyle: string; 
}


export const DEFAULT_USER_SETTINGS: UserSettings = {
  skipCountdown: false,
  uiScale: 1.0,
  gameScale: 1.0,
  fxIntensity: 1.0,
  screenShake: true,
  highContrast: false,
  crtEffect: true,
  reduceFlashing: false,
  invertRotation: false,
  musicVolume: 0.3,
  sfxVolume: 0.4,
  mobileControlScheme: 'JOYSTICK',
  controlOpacity: 0.8,
  controlPos: null,
  isControlEditMode: false,
  visionProtocolId: 'combat',
  hudConfig: {
    layout: 'CYBER',
    numberStyle: 'DIGITAL',
    theme: 'NEON',
    showAnimations: true,
    opacity: 1.0
  },
  snakeStyle: 'AUTO'
};

export interface UiStats {
    globalDamage: number;
    globalFireRate: number;
    globalArea: number;
    critChance: number;
    critMultiplier: number;
    projectileSpeed: number;
    moveSpeed: number;
    activeWeapons: string[];
    maxWeaponSlots: number;
    weaponLevels: Record<string, number>;
    tailIntegrity: number;
}

export function useGameState() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [modalState, setModalState] = useState<ModalState>('NONE');
  
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>([Difficulty.EASY]);
  
  const [uiScore, setUiScore] = useState(0);
  const [uiXp, setUiXp] = useState(0); 
  const [uiXpValues, setUiXpValues] = useState({ current: 0, max: 100 }); 
  
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
  
  const [uiStageStatus, setUiStageStatus] = useState<string>('');
  
  const [uiStats, setUiStats] = useState<UiStats>({
      globalDamage: 1,
      globalFireRate: 1,
      globalArea: 1,
      critChance: 0.05,
      critMultiplier: 1.5,
      projectileSpeed: 1,
      moveSpeed: 1,
      activeWeapons: [],
      maxWeaponSlots: 3,
      weaponLevels: {},
      tailIntegrity: 100
  });
  
  // Lazy init settings from persistent profile
  const [settings, setSettings] = useState<UserSettings>(() => {
      const profile = loadCosmeticProfile();
      return {
          ...DEFAULT_USER_SETTINGS,
          snakeStyle: profile.equippedSkin || 'AUTO',
          hudConfig: {
              ...DEFAULT_USER_SETTINGS.hudConfig,
              layout: (profile.equippedHud as HUDLayoutMode) || 'CYBER'
          }
      };
  });

  // Camera Control Switch
  const [cameraControlsEnabled, setCameraControlsEnabled] = useState(false);

  // Cosmetic State
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<Set<string>>(new Set());
  const [purchasedCosmetics, setPurchasedCosmetics] = useState<Set<string>>(new Set());
  const [seenCosmetics, setSeenCosmetics] = useState<Set<string>>(new Set());
  const [neonFragments, setNeonFragments] = useState(0);
  const [sessionNewUnlocks, setSessionNewUnlocks] = useState<string[]>([]);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  
  // Lore State
  const [hasUnreadArchiveData, setHasUnreadArchiveData] = useState(false);
  
  // Load profile on mount
  useEffect(() => {
      const profile = loadCosmeticProfile();
      setUnlockedCosmetics(new Set(profile.unlocked));
      setPurchasedCosmetics(new Set(profile.purchased));
      setSeenCosmetics(new Set(profile.seen || []));
      setNeonFragments(profile.neonFragments);
      
      // Load Lore State
      setHasUnreadArchiveData(hasUnreadMemories());
  }, []);

  // Derived Cosmetic State
  const hasNewCosmetics = useMemo(() => {
      for (const id of unlockedCosmetics) {
          // Only flag as new if it exists in the current registry and hasn't been seen
          if (COSMETIC_REGISTRY[id] && !seenCosmetics.has(id)) return true;
      }
      return false;
  }, [unlockedCosmetics, seenCosmetics]);

  // Persist equipped cosmetics when settings change
  useEffect(() => {
      const current = loadCosmeticProfile();
      if (current.equippedSkin !== settings.snakeStyle || current.equippedHud !== settings.hudConfig.layout) {
          saveCosmeticProfile({
              ...current,
              equippedSkin: settings.snakeStyle,
              equippedHud: settings.hudConfig.layout
          });
      }
  }, [settings.snakeStyle, settings.hudConfig.layout]);

  // REFS
  const runIdRef = useRef(0);
  const settingsReturnRef = useRef<ModalState>('NONE');

  const snakeRef = useRef<Point[]>([]);
  const prevTailRef = useRef<Point | null>(null);
  const tailIntegrityRef = useRef(100);
  
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
  const hitboxesRef = useRef<Hitbox[]>([]); 
  
  const scoreRef = useRef(0);
  const enemiesKilledRef = useRef(0);
  const terminalsHackedRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const gameTimeRef = useRef(0);
  const failureMessageRef = useRef('');
  const maxComboRef = useRef(0);
  
  const invulnerabilityTimeRef = useRef(0);
  const audioEventsRef = useRef<AudioRequest[]>([]);
  const lastDamageTimeRef = useRef(-10000);
  
  const transitionStartTimeRef = useRef(0);
  const pendingStatusRef = useRef<GameStatus | null>(null);
  const stageArmedRef = useRef(false);
  const stageReadyRef = useRef(false);
  
  const bossEnemyRef = useRef<Enemy | null>(null);
  const bossActiveRef = useRef(false);
  const bossDefeatedRef = useRef(false);
  const bossOverrideTimerRef = useRef(0);
  
  const transitionStateRef = useRef<{ phase: 'NONE' | 'intro' | 'outro' }>({ phase: 'NONE' });

  // ─── STAMINA / TIME STOP ───
  const staminaRef = useRef(STAMINA_CONFIG.MAX);
  const stopIntentRef = useRef(false);
  const isStoppedRef = useRef(false);
  const stopCooldownRef = useRef(false); // Prevents rapid toggle when depleted

  // ─── FLOOR & CAMERA ───
  const floor = useFloorVolumes(); 
  const cameraRef = useRef<CameraState>({
      mode: CameraMode.TOP_DOWN,
      behavior: CameraBehavior.FOLLOW_PLAYER,
      x: 0,
      y: 0,
      zoom: 1.0,
      rotation: 0,
      isLocked: false,
      scrollSpeed: 0,
      targetMode: null,
      transitionT: 0,
      transitionDuration: 1000
  });

  const requestCameraSwitch = useCallback((mode: CameraMode, durationMs: number = 1500) => {
      const cam = cameraRef.current;
      if (cam.mode === mode && !cam.targetMode) return;
      if (cam.targetMode === mode) return;

      cam.targetMode = mode;
      cam.transitionT = 0;
      cam.transitionDuration = durationMs;
      
      audioEventsRef.current.push({ type: 'UI_HARD_CLICK' });
  }, []);

  const updateCamera = useCallback((dt: number) => {
  }, []);

  // ─── PHYSICS SYSTEM ───
  const physicsRef = useRef<PhysicsState>({
      vy: 0,
      isGrounded: true
  });
  
  const jumpIntentRef = useRef(false);

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
    luck: 0,
    activeWeaponIds: [] as string[],
    maxWeaponSlots: 3, 
    acquiredUpgradeIds: [] as string[],
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

  // Modal Logic
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
    setSettings(s => ({ ...s, isControlEditMode: false }));
    setModalState(settingsReturnRef.current);
    if (settingsReturnRef.current === 'NONE' && status === GameStatus.PAUSED) {
        if (settings.skipCountdown) {
            setStatus(GameStatus.PLAYING);
        } else {
            setResumeCountdown(3);
            setStatus(GameStatus.RESUMING);
        }
    }
  }, [modalState, status, settings.skipCountdown]);

  const togglePause = useCallback(() => {
    if (modalState === 'SETTINGS') return;
    if (status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
        setModalState('PAUSE');
    } else if (status === GameStatus.PAUSED && modalState === 'PAUSE') {
        setModalState('NONE');
        if (settings.skipCountdown) {
            setStatus(GameStatus.PLAYING);
        } else {
            setResumeCountdown(3);
            setStatus(GameStatus.RESUMING);
        }
    }
  }, [status, modalState, settings.skipCountdown]);

  const toggleMute = useCallback(() => {
      setIsMuted(prev => {
          const next = !prev;
          if (next) {
              audio.setVolume(0, 0);
          } else {
              audio.setVolume(settings.musicVolume, settings.sfxVolume);
          }
          return next;
      });
  }, [settings]);

  const syncUiStats = useCallback(() => {
      const s = statsRef.current;
      const w = s.weapon;
      
      setUiStats({
          globalDamage: s.globalDamageMod,
          globalFireRate: s.globalFireRateMod,
          globalArea: s.globalAreaMod,
          critChance: s.critChance,
          critMultiplier: s.critMultiplier,
          projectileSpeed: s.globalProjectileSpeedMod,
          moveSpeed: s.moveSpeedMod,
          activeWeapons: [...s.activeWeaponIds],
          maxWeaponSlots: s.maxWeaponSlots,
          weaponLevels: {
              'CANNON': w.cannonLevel,
              'AURA': w.auraLevel,
              'MINES': w.mineLevel,
              'LIGHTNING': w.chainLightningLevel,
              'NANO_SWARM': w.nanoSwarmLevel,
              'PRISM_LANCE': w.prismLanceLevel,
              'NEON_SCATTER': w.neonScatterLevel,
              'VOLT_SERPENT': w.voltSerpentLevel,
              'PHASE_RAIL': w.phaseRailLevel,
              'REFLECTOR_MESH': w.reflectorMeshLevel,
              'GHOST_COIL': w.ghostCoilLevel,
              'NEURAL_MAGNET': w.neuralMagnetLevel,
              'OVERCLOCK': w.overclockLevel,
              'ECHO_CACHE': w.echoCacheLevel,
              'LUCK': w.luckLevel
          },
          tailIntegrity: tailIntegrityRef.current
      });
  }, []);

  const resetGame = useCallback((charProfile: CharacterProfile) => {
    runIdRef.current += 1;
    traitsRef.current = resolveTraits(charProfile);
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    prevTailRef.current = { x: 7, y: 10 };
    tailIntegrityRef.current = 100;

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
    hitboxesRef.current = []; 
    
    floor.clearFloors();
    floor.addFloorVolume({
        id: 'default_floor',
        startX: -1000,
        endX: 100000,
        topY: PHYSICS.GROUND_Y_GRID
    });
    
    scoreRef.current = 0;
    enemiesKilledRef.current = 0;
    terminalsHackedRef.current = 0;
    stageRef.current = 1;
    stageScoreRef.current = 0;
    levelRef.current = 1;
    xpRef.current = 0;
    nextLevelXpRef.current = 500;
    maxComboRef.current = 0;
    
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

    // Reset Stamina
    staminaRef.current = STAMINA_CONFIG.MAX;
    stopIntentRef.current = false;
    isStoppedRef.current = false;
    stopCooldownRef.current = false;
    
    setSessionNewUnlocks([]);
    
    cameraRef.current = {
        mode: CameraMode.TOP_DOWN,
        behavior: CameraBehavior.FOLLOW_PLAYER,
        x: 0,
        y: 0,
        zoom: 1.0,
        rotation: 0,
        isLocked: false,
        scrollSpeed: 0,
        targetMode: null,
        transitionT: 0,
        transitionDuration: 1000
    };
    
    physicsRef.current = {
        vy: 0,
        isGrounded: true
    };
    jumpIntentRef.current = false;
    
    const baseStats: UpgradeStats = {
        weapon: (JSON.parse(JSON.stringify(CHARACTERS[0].initialStats.weapon)) || {}) as WeaponStats,
        slowDurationMod: 1,
        magnetRangeMod: 0,
        shieldActive: false,
        scoreMultiplier: 1,
        foodQualityMod: 1,
        critChance: 0.05,
        critMultiplier: 1.5,
        hackSpeedMod: 1,
        moveSpeedMod: 1,
        luck: 0,
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
    
    const uniqueAcquired = new Set<string>([...initialWeapons]);
    if (statsRef.current.shieldActive) uniqueAcquired.add('SHIELD');
    statsRef.current.acquiredUpgradeIds = [...uniqueAcquired];

    setUiScore(0);
    setUiXp(0);
    setUiXpValues({ current: 0, max: 500 });
    setUiLevel(1);
    setUiStage(1);
    setUiCombo(0);
    setUiShield(!!statsRef.current.shieldActive);
    setBossActive(false);
    setUiStageStatus('');
    lastDamageTimeRef.current = -10000;
    
    syncUiStats();
    setModalState('NONE');

    powerUpsRef.current = { slowUntil: 0, magnetUntil: 0 };
    nanoSwarmAngleRef.current = 0;
    
    weaponFireTimerRef.current = 0;
    auraTickTimerRef.current = 0;
    mineDropTimerRef.current = statsRef.current.weapon.mineDropRate || 0;
    
    prismLanceTimerRef.current = 0;
    neonScatterTimerRef.current = 0;
    voltSerpentTimerRef.current = 0;
    phaseRailChargeRef.current = 0;
    echoDamageStoredRef.current = 0;
    overclockActiveRef.current = false;
    overclockTimerRef.current = 0;

  }, [syncUiStats, floor.clearFloors, floor.addFloorVolume]);

  const unlockCosmetic = useCallback((id: string) => {
      setUnlockedCosmetics((prev: Set<string>) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          const currentProfile = loadCosmeticProfile();
          saveCosmeticProfile({ ...currentProfile, unlocked: Array.from(next) });
          return next;
      });
      setSessionNewUnlocks((prev: string[]) => [...prev, id]);
      setToastQueue((prev: string[]) => [...prev, id]);
  }, []);
  
  const addNeonFragments = useCallback((amount: number) => {
      setNeonFragments(prev => {
          const next = prev + amount;
          const currentProfile = loadCosmeticProfile();
          saveCosmeticProfile({ ...currentProfile, neonFragments: next });
          return next;
      });
  }, []);
  
  const purchaseCosmetic = useCallback((id: string) => {
      const def = COSMETIC_REGISTRY[id];
      if (!def) return false;
      
      // Load current to be safe
      const currentProfile = loadCosmeticProfile();
      if (currentProfile.neonFragments < def.cost) return false;
      
      const newFragments = currentProfile.neonFragments - def.cost;
      const newPurchased = [...currentProfile.purchased, id];
      // Implicitly mark as seen when purchasing if not already
      const newSeen = new Set(currentProfile.seen || []);
      newSeen.add(id);

      saveCosmeticProfile({
          ...currentProfile,
          neonFragments: newFragments,
          purchased: newPurchased,
          seen: Array.from(newSeen)
      });
      
      setNeonFragments(newFragments);
      setPurchasedCosmetics(new Set(newPurchased));
      setSeenCosmetics(newSeen);
      return true;
  }, []);
  
  const markCosmeticSeen = useCallback((id: string) => {
      setSeenCosmetics((prev: Set<string>) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          const currentProfile = loadCosmeticProfile();
          saveCosmeticProfile({ ...currentProfile, seen: Array.from(next) });
          return next;
      });
  }, []);

  const clearToast = useCallback(() => {
      setToastQueue((prev: string[]) => prev.slice(1));
  }, []);

  const markArchiveRead = useCallback(() => {
      markMemoriesAsRead();
      setHasUnreadArchiveData(false);
  }, []);

  return {
    status, setStatus,
    modalState, setModalState,
    difficulty, setDifficulty,
    unlockedDifficulties, setUnlockedDifficulties,
    uiScore, setUiScore,
    uiXp, setUiXp,
    uiXpValues, setUiXpValues,
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
    toggleMute,
    uiStats, syncUiStats,
    uiStageStatus, setUiStageStatus,
    settings, setSettings,
    cameraControlsEnabled, setCameraControlsEnabled,
    runIdRef,
    snakeRef, prevTailRef, tailIntegrityRef, traitsRef,
    enemiesRef, foodRef, wallsRef, terminalsRef, projectilesRef, minesRef,
    shockwavesRef, lightningArcsRef, particlesRef, floatingTextsRef, digitalRainRef,
    hitboxesRef, 
    scoreRef, enemiesKilledRef, terminalsHackedRef, startTimeRef, gameTimeRef, failureMessageRef,
    invulnerabilityTimeRef, audioEventsRef, lastDamageTimeRef,
    transitionStartTimeRef, pendingStatusRef, stageArmedRef, stageReadyRef,
    bossEnemyRef, bossActiveRef, bossDefeatedRef, bossOverrideTimerRef, maxComboRef,
    statsRef, powerUpsRef, ghostCoilCooldownRef,
    directionRef, directionQueueRef, levelRef, xpRef, nextLevelXpRef,
    enemySpawnTimerRef, terminalSpawnTimerRef,
    stageRef, stageScoreRef,
    shakeRef, chromaticAberrationRef, lastEatTimeRef,
    weaponFireTimerRef, auraTickTimerRef, mineDropTimerRef, prismLanceTimerRef, neonScatterTimerRef,
    voltSerpentTimerRef, phaseRailChargeRef, echoDamageStoredRef, overclockActiveRef, overclockTimerRef, nanoSwarmAngleRef,
    lastPowerUpStateRef,
    transitionStateRef,
    cameraRef, updateCamera, requestCameraSwitch,
    physicsRef, jumpIntentRef, 
    floor, 
    resetGame, openSettings, closeSettings, togglePause,
    unlockedCosmetics, purchasedCosmetics, neonFragments, sessionNewUnlocks, toastQueue, seenCosmetics, hasNewCosmetics,
    unlockCosmetic, purchaseCosmetic, addNeonFragments, clearToast, markCosmeticSeen,
    hasUnreadArchiveData, setHasUnreadArchiveData, markArchiveRead,
    staminaRef, stopIntentRef, isStoppedRef, stopCooldownRef
  };
}
