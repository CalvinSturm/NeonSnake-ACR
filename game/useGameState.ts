
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GameStatus,
  Difficulty,
  Direction,
  Point,
  Enemy,
  FoodItem,
  Projectile,
  Terminal,
  Mine,
  Shockwave,
  Particle,
  FloatingText,
  LightningArc,
  DigitalRainDrop,
  UpgradeOption,
  UpgradeStats,
  CharacterProfile,
  AudioRequest
} from '../types';
import {
  DEFAULT_SETTINGS,
  CHARACTERS,
  XP_TO_LEVEL_UP
} from '../constants';

export function useGameState() {
  // ── STATE (UI) ──
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>([Difficulty.EASY]);
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [resumeCountdown, setResumeCountdown] = useState<number>(0);
  const [activePowerUps, setActivePowerUps] = useState({ slow: false, magnet: false });
  
  const [uiScore, setUiScore] = useState(0);
  const [highScore, setHighScore] = useState(0); // Added HighScore state
  const [uiXp, setUiXp] = useState(0);
  const [uiLevel, setUiLevel] = useState(1);
  const [uiStage, setUiStage] = useState(1);
  const [uiCombo, setUiCombo] = useState(1);
  const [uiShield, setUiShield] = useState(false);
  const [bossActive, setBossActiveState] = useState(false); // Added BossActive state
  const [isMuted, setIsMuted] = useState(false); // Added Audio State

  // ── REFS (SIMULATION) ──
  const gameTimeRef = useRef<number>(0);
  const snakeRef = useRef<Point[]>([]);
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const directionQueueRef = useRef<Direction[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const foodRef = useRef<FoodItem[]>([]);
  const wallsRef = useRef<Point[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const terminalsRef = useRef<Terminal[]>([]);
  const minesRef = useRef<Mine[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const lightningArcsRef = useRef<LightningArc[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const digitalRainRef = useRef<DigitalRainDrop[]>([]);
  const audioEventsRef = useRef<AudioRequest[]>([]);
  
  const statsRef = useRef<UpgradeStats>({
    weapon: CHARACTERS[0].initialStats.weapon as any, // fallback
    slowDurationMod: 1,
    magnetRangeMod: 0,
    empCooldownMod: 1,
    shieldActive: false,
    scoreMultiplier: 1,
    foodQualityMod: 1,
    critChance: 0.05,
    critMultiplier: 1.5
  });

  const powerUpsRef = useRef({ slowUntil: 0, magnetUntil: 0 });
  const lastPowerUpStateRef = useRef({ slow: false, magnet: false });
  const abilityCooldownsRef = useRef({ chrono: 0, ping: 0, systemShock: 0 });

  // NEW MECHANIC REFS
  const echoDamageStoredRef = useRef(0);
  const overclockActiveRef = useRef(false);
  const overclockTimerRef = useRef(0); // tracks cycle (off -> on -> off)
  const ghostCoilCooldownRef = useRef(0);
  const empBloomCooldownRef = useRef(0);
  const phaseRailChargeRef = useRef(0);

  const xpRef = useRef(0);
  const xpToNextLevelRef = useRef(XP_TO_LEVEL_UP);
  const scoreRef = useRef(0);
  const stageScoreRef = useRef(0);
  const levelRef = useRef(1);
  const stageRef = useRef(1);
  const comboMultiplierRef = useRef(1);
  const lastEatTimeRef = useRef(0);

  const enemySpawnTimerRef = useRef(0);
  const enemyMoveTimerRef = useRef(0);
  const terminalSpawnTimerRef = useRef(0);
  const weaponFireTimerRef = useRef(0);
  const auraTickTimerRef = useRef(0);
  const mineDropTimerRef = useRef(0);
  const invulnerabilityTimeRef = useRef(0);
  const baseSpeedRef = useRef(DEFAULT_SETTINGS.initialSpeed);
  
  // NEW WEAPON TIMERS
  const prismLanceTimerRef = useRef(0);
  const neonScatterTimerRef = useRef(0);
  const voltSerpentTimerRef = useRef(0);
  
  const transitionStartTimeRef = useRef(0);
  const transitionStateRef = useRef({ phase: 'NONE', startTime: 0 });
  const shakeRef = useRef({ x: 0, y: 0 });
  const chromaticAberrationRef = useRef(0); // VISUAL SYNC
  const bossActiveRef = useRef(false);
  const bossEnemyRef = useRef<Enemy | null>(null);
  const bossDefeatedRef = useRef(false); // Track boss defeat

  const enemiesKilledRef = useRef(0);
  const terminalsHackedRef = useRef(0);
  const startTimeRef = useRef(0);
  const pendingStatusRef = useRef<GameStatus | null>(null);

  // Load HighScore on init
  useEffect(() => {
    const stored = localStorage.getItem('snake_highscore');
    if (stored) setHighScore(parseInt(stored, 10));
    
    const unlocked = localStorage.getItem('snake_unlocked_difficulties');
    if (unlocked) setUnlockedDifficulties(JSON.parse(unlocked));
  }, []);

  const setBossActive = useCallback((active: boolean) => {
    bossActiveRef.current = active;
    setBossActiveState(active); // Sync UI state
  }, []);

  const resetGame = useCallback((char?: CharacterProfile) => {
    gameTimeRef.current = 0;
    snakeRef.current = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = [];
    enemiesRef.current = [];
    foodRef.current = [];
    projectilesRef.current = [];
    terminalsRef.current = [];
    minesRef.current = [];
    shockwavesRef.current = [];
    lightningArcsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    audioEventsRef.current = [];
    
    xpRef.current = 0;
    xpToNextLevelRef.current = XP_TO_LEVEL_UP;
    scoreRef.current = 0;
    stageScoreRef.current = 0;
    levelRef.current = 1;
    stageRef.current = 1;
    comboMultiplierRef.current = 1;
    lastEatTimeRef.current = 0;
    
    enemySpawnTimerRef.current = 0;
    enemyMoveTimerRef.current = 0;
    terminalSpawnTimerRef.current = 0;
    weaponFireTimerRef.current = 0;
    auraTickTimerRef.current = 0;
    mineDropTimerRef.current = 0;
    invulnerabilityTimeRef.current = 0;
    
    // Reset new timers
    prismLanceTimerRef.current = 0;
    neonScatterTimerRef.current = 0;
    voltSerpentTimerRef.current = 0;
    phaseRailChargeRef.current = 0;
    echoDamageStoredRef.current = 0;
    overclockActiveRef.current = false;
    overclockTimerRef.current = 0;
    ghostCoilCooldownRef.current = 0;
    empBloomCooldownRef.current = 0;
    
    transitionStateRef.current = { phase: 'NONE', startTime: 0 };
    transitionStartTimeRef.current = 0;
    setBossActive(false);
    bossEnemyRef.current = null;
    bossDefeatedRef.current = false;
    pendingStatusRef.current = null;
    shakeRef.current = { x: 0, y: 0 };
    chromaticAberrationRef.current = 0;
    
    setUiScore(0);
    setUiXp(0);
    setUiLevel(1);
    setUiStage(1);
    setUiCombo(1);
    setUiShield(char?.initialStats.shieldActive || false);
    
    // Apply character stats
    if (char) {
        statsRef.current = {
            weapon: { ...CHARACTERS[0].initialStats.weapon, ...char.initialStats.weapon } as any,
            slowDurationMod: char.initialStats.slowDurationMod ?? 1,
            magnetRangeMod: char.initialStats.magnetRangeMod ?? 0,
            empCooldownMod: char.initialStats.empCooldownMod ?? 1,
            shieldActive: char.initialStats.shieldActive ?? false,
            scoreMultiplier: char.initialStats.scoreMultiplier ?? 1,
            foodQualityMod: char.initialStats.foodQualityMod ?? 1,
            critChance: char.initialStats.critChance ?? 0.05,
            critMultiplier: char.initialStats.critMultiplier ?? 1.5
        };
    }
    
    enemiesKilledRef.current = 0;
    terminalsHackedRef.current = 0;
    startTimeRef.current = Date.now();
  }, [setBossActive]);

  return {
    status, setStatus,
    difficulty, setDifficulty,
    unlockedDifficulties, setUnlockedDifficulties,
    selectedChar, setSelectedChar,
    upgradeOptions, setUpgradeOptions,
    resumeCountdown, setResumeCountdown,
    activePowerUps, setActivePowerUps,
    
    uiScore, setUiScore,
    highScore, setHighScore,
    uiXp, setUiXp,
    uiLevel, setUiLevel,
    uiStage, setUiStage,
    uiCombo, setUiCombo,
    uiShield, setUiShield,
    bossActive, setBossActive, // UI State & Setter
    isMuted, setIsMuted,

    gameTimeRef,
    snakeRef,
    directionRef,
    directionQueueRef,
    enemiesRef,
    foodRef,
    wallsRef,
    projectilesRef,
    terminalsRef,
    minesRef,
    shockwavesRef,
    lightningArcsRef,
    particlesRef,
    floatingTextsRef,
    digitalRainRef,
    audioEventsRef,
    
    statsRef,
    powerUpsRef,
    lastPowerUpStateRef,
    abilityCooldownsRef,
    
    xpRef,
    xpToNextLevelRef,
    scoreRef,
    stageScoreRef,
    levelRef,
    stageRef,
    comboMultiplierRef,
    lastEatTimeRef,
    
    enemySpawnTimerRef,
    enemyMoveTimerRef,
    terminalSpawnTimerRef,
    weaponFireTimerRef,
    auraTickTimerRef,
    mineDropTimerRef,
    invulnerabilityTimeRef,
    baseSpeedRef,
    
    // New Refs
    prismLanceTimerRef,
    neonScatterTimerRef,
    voltSerpentTimerRef,
    phaseRailChargeRef,
    echoDamageStoredRef,
    overclockActiveRef,
    overclockTimerRef,
    ghostCoilCooldownRef,
    empBloomCooldownRef,
    
    transitionStartTimeRef,
    transitionStateRef,
    shakeRef,
    chromaticAberrationRef,
    bossActiveRef, // Sim Ref
    bossEnemyRef,  // Sim Ref
    bossDefeatedRef,
    
    enemiesKilledRef,
    terminalsHackedRef,
    startTimeRef,
    pendingStatusRef,
    failureMessageRef: useRef('CONNECTION_LOST'),

    resetGame
  };
}
