import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  DEFAULT_SETTINGS, 
  COLORS,
  STAGE_THEMES,
  CHARACTERS,
  GRID_COLS,
  GRID_ROWS,
  CHANCE_BONUS,
  CHANCE_POISON,
  CHANCE_SLOW,
  CHANCE_MAGNET,
  CHANCE_COMPRESSOR,
  DURATION_SLOW,
  DURATION_MAGNET,
  MAGNET_RADIUS,
  COMBO_WINDOW,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_MOVE_TICK,
  EMP_CHARGE_PER_FOOD,
  XP_TO_LEVEL_UP,
  PASSIVE_SCORE_PER_SEC,
  ENEMY_BASE_HP,
  BOSS_BASE_HP,
  PROJECTILE_SPEED,
  POINTS_PER_STAGE,
  SHOCKWAVE_SPEED,
  TERMINAL_SPAWN_CHANCE,
  TERMINAL_HACK_RADIUS,
  TERMINAL_HACK_TIME,
  DIFFICULTY_CONFIGS
} from '../constants';
import { 
  Direction, 
  FoodItem, 
  FoodType, 
  GameStatus, 
  Particle, 
  Point,
  Enemy,
  EnemyType,
  UpgradeStats,
  Projectile,
  Shockwave,
  CharacterProfile,
  Terminal,
  UpgradeOption,
  FloatingText,
  Mine,
  LightningArc,
  Difficulty
} from '../types';
import { audio } from '../utils/audio';

const FAILURE_MESSAGES = [
    "Rollback initiated.",
    "Protocol integrity lost.",
    "Containment edge breached."
];

// Helper to format time for report
const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// Helper to get random grid position
const getRandomPos = (snake: Point[], exclude: Point[] = [], walls: Point[] = []): Point => {
  let pos: Point;
  let collision;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_COLS),
      y: Math.floor(Math.random() * GRID_ROWS)
    };
    // eslint-disable-next-line no-loop-func
    collision = snake.some(s => s.x === pos.x && s.y === pos.y) || 
                exclude.some(e => e.x === pos.x && e.y === pos.y) ||
                walls.some(w => w.x === pos.x && w.y === pos.y);
    attempts++;
  } while (collision && attempts < 100); // Reduced attempts for performance
  
  if (collision) return { x: 0, y: 0 }; 
  return pos;
};

// Generate Walls for stages
const generateWalls = (stage: number): Point[] => {
    const walls: Point[] = [];
    // Boss Arena (every 4th stage) has no interior walls
    if (stage % 4 === 0) return walls;
    
    if (stage <= 1) return walls;

    const patternType = stage % 4; 
    
    // Pattern 2: Random Blocks 
    if (patternType === 2) {
        const numBlocks = 6 + stage;
        for(let i=0; i<numBlocks; i++) {
            const bx = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
            const by = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
            walls.push({x: bx, y: by}, {x: bx+1, y: by}, {x: bx, y: by+1}, {x: bx+1, y: by+1});
        }
    }
    // Pattern 3: Horizontal Bars with Gaps
    else if (patternType === 3) {
        for(let y = 6; y < GRID_ROWS - 6; y += 8) {
             const gapStart = Math.floor(GRID_COLS * 0.2) + Math.floor(Math.random() * (GRID_COLS * 0.4));
             const gapWidth = 8;
             
             for(let x = 4; x < GRID_COLS - 4; x++) {
                 if (x < gapStart || x > gapStart + gapWidth) {
                     walls.push({x, y});
                 }
             }
        }
    }
    // Pattern 0 (loop): Central Arena with Gates
    else if (patternType === 0) {
        const margin = 8; 
        
        // Horizontal Walls (Top/Bottom)
        for(let x = margin; x <= GRID_COLS - margin; x++) {
            if (Math.abs(x - GRID_COLS/2) > 5) { // Gate in middle
                walls.push({x, y: margin}, {x, y: GRID_ROWS - margin});
            }
        }
        
        // Vertical Walls (Left/Right)
        for(let y = margin; y <= GRID_ROWS - margin; y++) {
            if (Math.abs(y - GRID_ROWS/2) > 4) { // Gate in middle
                walls.push({x: margin, y}, {x: GRID_COLS - margin, y});
            }
        }
    }
    
    // Ensure walls don't spawn on center (player start) or too close
    return walls.filter(w => Math.abs(w.x - GRID_COLS/2) > 6 || Math.abs(w.y - GRID_ROWS/2) > 6);
};

const SnakeGame: React.FC = () => {
  // --- Refs for Game Loop State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  // Game State Refs
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const directionQueueRef = useRef<Direction[]>([]); 
  
  const foodRef = useRef<FoodItem[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const wallsRef = useRef<Point[]>([]); 
  const terminalsRef = useRef<Terminal[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const minesRef = useRef<Mine[]>([]);
  const lightningArcsRef = useRef<LightningArc[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  const scoreRef = useRef<number>(0);
  const stageScoreRef = useRef<number>(0); 
  const xpRef = useRef<number>(0);
  const xpToNextLevelRef = useRef<number>(XP_TO_LEVEL_UP);
  const levelRef = useRef<number>(1); 
  const stageRef = useRef<number>(1); 
  
  const baseSpeedRef = useRef<number>(DEFAULT_SETTINGS.initialSpeed);
  const shakeRef = useRef<number>(0);
  const empChargeRef = useRef<number>(0); 
  const invulnerabilityTimeRef = useRef<number>(0);
  
  // Optimization Refs
  const prevUiScore = useRef(0);
  const prevUiEmp = useRef(0);
  
  // Statistics Tracking for System Report
  const startTimeRef = useRef<number>(0);
  const peakEmpRef = useRef<number>(0);
  const enemiesKilledRef = useRef<number>(0);
  const terminalsHackedRef = useRef<number>(0);
  const failureMessageRef = useRef<string>(FAILURE_MESSAGES[0]);

  // Transition State
  const transitionStateRef = useRef<{
    phase: 'NONE' | 'SLOW_DOWN' | 'HACKING' | 'SPEED_UP';
    startTime: number;
  }>({ phase: 'NONE', startTime: 0 });

  // Mechanics State
  const lastEatTimeRef = useRef<number>(0);
  const comboMultiplierRef = useRef<number>(1);
  const enemySpawnTimerRef = useRef<number>(0);
  const enemyMoveTimerRef = useRef<number>(0);
  const passiveScoreTimerRef = useRef<number>(0);
  const weaponFireTimerRef = useRef<number>(0);
  const auraTickTimerRef = useRef<number>(0);
  const mineDropTimerRef = useRef<number>(0);

  // RPG Stats
  const statsRef = useRef<UpgradeStats>({
      weapon: {
          cannonLevel: 1,
          cannonDamage: 10,
          cannonFireRate: 1500,
          auraLevel: 0,
          auraRadius: 1.5,
          auraDamage: 5,
          shockwaveLevel: 1,
          shockwaveRadius: 8,
          shockwaveDamage: 50,
          nanoSwarmLevel: 0,
          nanoSwarmCount: 0,
          nanoSwarmDamage: 0,
          mineLevel: 0,
          mineDamage: 0,
          mineRadius: 0,
          mineDropRate: 0,
          chainLightningLevel: 0,
          chainLightningDamage: 0,
          chainLightningRange: 0
      },
      slowDurationMod: 1.0,
      magnetRangeMod: 0,
      empChargeMod: 1.0,
      shieldActive: false,
      scoreMultiplier: 1.0,
      foodQualityMod: 1.0,
      critChance: 0.05,
      critMultiplier: 1.5
  });

  const powerUpsRef = useRef({
    slowUntil: 0,
    magnetUntil: 0
  });
  
  const lastPowerUpStateRef = useRef({ slow: false, magnet: false });

  // --- React State for UI ---
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>([Difficulty.EASY]);
  
  const [uiScore, setUiScore] = useState(0);
  const [uiXp, setUiXp] = useState(0); 
  const [uiLevel, setUiLevel] = useState(1);
  const [uiStage, setUiStage] = useState(1);
  const [uiEmp, setUiEmp] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [uiCombo, setUiCombo] = useState(1);
  const [uiShield, setUiShield] = useState(false);
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [bossActive, setBossActive] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  
  const [activePowerUps, setActivePowerUps] = useState({ slow: false, magnet: false });

  // Initialize High Score & Progression
  useEffect(() => {
    const saved = localStorage.getItem('snake_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedDiff = localStorage.getItem('snake_difficulty_unlocks');
    if (savedDiff) {
        setUnlockedDifficulties(JSON.parse(savedDiff));
    }
  }, []);

  const getTheme = (stage: number) => {
      const idx = ((stage - 1) % 4) + 1;
      return STAGE_THEMES[idx];
  };

  const getThreatLevel = (stage: number) => {
      if (stage < 4) return "LOW";
      if (stage < 8) return "MODERATE";
      if (stage < 12) return "HIGH";
      return "EXTREME";
  };

  // --- Core Logic Helpers ---

  const spawnFloatingText = (x: number, y: number, text: string, color: string = COLORS.damageText, size: number = 12) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(36),
      x, y, text, color,
      life: 1.0,
      vy: -0.5 - Math.random() * 0.5,
      size
    });
  };

  const spawnFood = (forceType?: FoodType) => {
    const occupied = [...foodRef.current, ...enemiesRef.current]; 
    const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
    let type = FoodType.NORMAL;

    if (forceType) {
      type = forceType;
    } else {
      const roll = Math.random() * 100;
      let cumulative = 0;
      
      cumulative += CHANCE_BONUS;
      if (roll < cumulative) type = FoodType.BONUS;
      else {
        cumulative += CHANCE_POISON;
        if (roll < cumulative) type = FoodType.POISON;
        else {
          cumulative += CHANCE_SLOW;
          if (roll < cumulative) type = FoodType.SLOW;
          else {
            cumulative += CHANCE_MAGNET;
            if (roll < cumulative) type = FoodType.MAGNET;
            else {
                cumulative += CHANCE_COMPRESSOR;
                if (roll < cumulative) type = FoodType.COMPRESSOR;
            }
          }
        }
      }
    }

    const isTemporary = [FoodType.BONUS, FoodType.SLOW, FoodType.MAGNET, FoodType.COMPRESSOR].includes(type);

    const newItem: FoodItem = {
      ...pos,
      type,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      lifespan: isTemporary ? 6000 : undefined 
    };
    
    foodRef.current.push(newItem);
  };

  const spawnTerminal = () => {
    if (terminalsRef.current.length > 0) return; // Only one terminal at a time
    const occupied = [...foodRef.current, ...enemiesRef.current, ...snakeRef.current];
    const pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
    
    if (pos.x === 0 && pos.y === 0) return; // Failed spawn

    terminalsRef.current.push({
      ...pos,
      id: Math.random().toString(36),
      radius: TERMINAL_HACK_RADIUS,
      progress: 0,
      totalTime: TERMINAL_HACK_TIME,
      isLocked: false,
      color: COLORS.terminal
    });
  };

  const spawnEnemy = (forcedType?: EnemyType) => {
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    const isBossStage = stageRef.current % 4 === 0; // Every 4 levels
    
    // Check if Boss should spawn
    if (isBossStage && !bossActive && enemiesRef.current.filter(e => e.type === EnemyType.BOSS).length === 0) {
        // Spawn Boss at center
        const bossHp = BOSS_BASE_HP * diffConfig.bossHpMod * (1 + (stageRef.current * 0.2));
        enemiesRef.current.push({
            x: Math.floor(GRID_COLS/2),
            y: Math.floor(GRID_ROWS/4), // Top center
            id: 'BOSS',
            type: EnemyType.BOSS,
            spawnTime: Date.now(),
            hp: bossHp,
            maxHp: bossHp,
            flash: 0,
            bossPhase: 1,
            attackTimer: 0,
            spawnTimer: 0
        });
        setBossActive(true);
        audio.playEnemySpawn();
        shakeRef.current = 20;
        return;
    }

    // Normal spawns (limited during boss fight)
    if (bossActive && enemiesRef.current.length > 3) return;

    const occupied = [...foodRef.current, ...enemiesRef.current];
    const head = snakeRef.current[0];
    let pos: Point;
    let dist: number;
    let attempts = 0;
    
    do {
      pos = getRandomPos(snakeRef.current, occupied, wallsRef.current);
      dist = Math.abs(pos.x - head.x) + Math.abs(pos.y - head.y);
      attempts++;
    } while (dist < 12 && attempts < 10);

    // Pick Type based on Difficulty allowed list or forced type
    let type = EnemyType.HUNTER;
    if (forcedType) {
        type = forcedType;
    } else {
        const allowed = diffConfig.allowedEnemies;
        type = allowed[Math.floor(Math.random() * allowed.length)];
    }

    // HP Scaling
    const hpScale = (1 + (stageRef.current * 0.3) + (levelRef.current * 0.1)) * diffConfig.hpMod;
    
    enemiesRef.current.push({
      ...pos,
      id: Math.random().toString(36).substr(2, 9),
      type,
      spawnTime: Date.now(),
      hp: ENEMY_BASE_HP * hpScale,
      maxHp: ENEMY_BASE_HP * hpScale,
      flash: 0,
      attackTimer: 0,
      dashTimer: 0,
      dashState: 'IDLE'
    });
    if (!bossActive) audio.playEnemySpawn();
  };

  const triggerSystemShock = useCallback(() => {
      if (empChargeRef.current < 100) return;
      
      const head = snakeRef.current[0];
      const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
      const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;

      shockwavesRef.current.push({
          id: Math.random().toString(36),
          x: cx,
          y: cy,
          currentRadius: 0,
          maxRadius: statsRef.current.weapon.shockwaveRadius * DEFAULT_SETTINGS.gridSize,
          damage: statsRef.current.weapon.shockwaveDamage,
          opacity: 0.8
      });

      shakeRef.current = 20;
      audio.playEMP();
      
      empChargeRef.current = 0;
      setUiEmp(0);
      prevUiEmp.current = 0;
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number = 12) => {
    // Limit total particles to avoid performance cliff
    if (particlesRef.current.length > 100) return;
    
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
        y: y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize / 2,
        vx: (Math.random() - 0.5) * 12, 
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color
      });
    }
  };

  const resetGame = (character: CharacterProfile) => {
    snakeRef.current = [
      { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) },
      { x: Math.floor(GRID_COLS / 2) - 1, y: Math.floor(GRID_ROWS / 2) },
      { x: Math.floor(GRID_COLS / 2) - 2, y: Math.floor(GRID_ROWS / 2) }
    ];
    directionRef.current = Direction.RIGHT;
    directionQueueRef.current = []; 
    
    foodRef.current = [];
    enemiesRef.current = [];
    wallsRef.current = [];
    terminalsRef.current = [];
    particlesRef.current = [];
    projectilesRef.current = [];
    shockwavesRef.current = [];
    minesRef.current = [];
    lightningArcsRef.current = [];
    floatingTextsRef.current = [];
    
    scoreRef.current = 0;
    stageScoreRef.current = 0;
    xpRef.current = 0;
    xpToNextLevelRef.current = XP_TO_LEVEL_UP;
    levelRef.current = 1;
    stageRef.current = 1;
    baseSpeedRef.current = DEFAULT_SETTINGS.initialSpeed;
    shakeRef.current = 0;
    empChargeRef.current = 0;
    invulnerabilityTimeRef.current = 0;
    transitionStateRef.current = { phase: 'NONE', startTime: 0 };
    setBossActive(false);
    
    // Stats Reset
    startTimeRef.current = Date.now();
    peakEmpRef.current = 0;
    enemiesKilledRef.current = 0;
    terminalsHackedRef.current = 0;
    
    // Default Base Stats
    statsRef.current = {
        weapon: {
          cannonLevel: 1, 
          cannonDamage: 10,
          cannonFireRate: 1500,
          auraLevel: 0,
          auraRadius: 1.5,
          auraDamage: 5,
          shockwaveLevel: 1,
          shockwaveRadius: 8,
          shockwaveDamage: 50,
          nanoSwarmLevel: 0,
          nanoSwarmCount: 0,
          nanoSwarmDamage: 0,
          mineLevel: 0,
          mineDamage: 0,
          mineRadius: 0,
          mineDropRate: 0,
          chainLightningLevel: 0,
          chainLightningDamage: 0,
          chainLightningRange: 0
        },
        slowDurationMod: 1.0,
        magnetRangeMod: 0,
        empChargeMod: 1.0,
        shieldActive: false,
        scoreMultiplier: 1.0,
        foodQualityMod: 1.0,
        critChance: 0.05,
        critMultiplier: 1.5
    };

    // Apply Character Specifics - FULL OVERRIDE to ensure clean state
    if (character.initialStats) {
      if (character.initialStats.weapon) {
         statsRef.current.weapon = { ...statsRef.current.weapon, ...character.initialStats.weapon };
      }
      if (character.initialStats.magnetRangeMod !== undefined) statsRef.current.magnetRangeMod = character.initialStats.magnetRangeMod;
      if (character.initialStats.slowDurationMod !== undefined) statsRef.current.slowDurationMod = character.initialStats.slowDurationMod;
      if (character.initialStats.empChargeMod !== undefined) statsRef.current.empChargeMod = character.initialStats.empChargeMod;
      if (character.initialStats.shieldActive !== undefined) statsRef.current.shieldActive = character.initialStats.shieldActive;
      if (character.initialStats.scoreMultiplier !== undefined) statsRef.current.scoreMultiplier = character.initialStats.scoreMultiplier;
      if (character.initialStats.foodQualityMod !== undefined) statsRef.current.foodQualityMod = character.initialStats.foodQualityMod;
      if (character.initialStats.critChance !== undefined) statsRef.current.critChance = character.initialStats.critChance;
    }
    
    comboMultiplierRef.current = 1;
    lastEatTimeRef.current = 0;
    enemySpawnTimerRef.current = 0;
    enemyMoveTimerRef.current = 0;
    passiveScoreTimerRef.current = 0;
    weaponFireTimerRef.current = 0;
    auraTickTimerRef.current = 0;
    mineDropTimerRef.current = 0;

    powerUpsRef.current = { slowUntil: 0, magnetUntil: 0 };
    lastPowerUpStateRef.current = { slow: false, magnet: false };
    setActivePowerUps({ slow: false, magnet: false });
    
    setUiScore(0);
    setUiXp(0);
    setUiLevel(1);
    setUiStage(1);
    setUiEmp(0);
    setUiCombo(1);
    setUiShield(statsRef.current.shieldActive);
    prevUiScore.current = 0;
    prevUiEmp.current = 0;
    
    wallsRef.current = generateWalls(1);
    spawnFood(FoodType.NORMAL);
  };

  const unlockNextDifficulty = () => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    let next: Difficulty | null = null;
    if (difficulty === Difficulty.EASY) next = Difficulty.MEDIUM;
    else if (difficulty === Difficulty.MEDIUM) next = Difficulty.HARD;
    else if (difficulty === Difficulty.HARD) next = Difficulty.INSANE;

    if (next && !unlockedDifficulties.includes(next)) {
        const newUnlocks = [...unlockedDifficulties, next];
        setUnlockedDifficulties(newUnlocks);
        localStorage.setItem('snake_difficulty_unlocks', JSON.stringify(newUnlocks));
        // Notification logic could go here
    }
  };

  const gameOver = () => {
    shakeRef.current = 20;
    audio.playGameOver();
    failureMessageRef.current = FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)];
    setStatus(GameStatus.GAME_OVER);
    if (scoreRef.current > highScore) {
      setHighScore(Math.floor(scoreRef.current));
      localStorage.setItem('snake_highscore', Math.floor(scoreRef.current).toString());
    }
  };

  const generateUpgradeOptions = () => {
      const options: UpgradeOption[] = [];
      const pool: (() => UpgradeOption)[] = [
          // WEAPONS
          () => ({
              id: 'CANNON',
              title: `AUTO CANNON MK ${statsRef.current.weapon.cannonLevel + 1}`,
              description: statsRef.current.weapon.cannonLevel >= 4 ? 'Max fire rate + Burst fire unlocked.' : 'Increases fire rate and projectile damage.',
              color: 'text-yellow-400',
              type: 'WEAPON'
          }),
          () => ({
              id: 'AURA',
              title: `TAIL AURA MK ${statsRef.current.weapon.auraLevel + 1}`,
              description: 'Expands the damaging field around your snake body.',
              color: 'text-red-400',
              type: 'WEAPON'
          }),
          () => ({
              id: 'NANO_SWARM',
              title: statsRef.current.weapon.nanoSwarmLevel === 0 ? 'UNLOCK NANO SWARM' : `NANO SWARM MK ${statsRef.current.weapon.nanoSwarmLevel + 1}`,
              description: statsRef.current.weapon.nanoSwarmLevel === 0 ? 'Deploy 2 drones to orbit and protect you.' : 'Adds 2 more drones and increases damage.',
              color: 'text-pink-400',
              type: 'WEAPON'
          }),
          () => ({
              id: 'MINES',
              title: statsRef.current.weapon.mineLevel === 0 ? 'UNLOCK PLASMA MINES' : `PLASMA MINES MK ${statsRef.current.weapon.mineLevel + 1}`,
              description: statsRef.current.weapon.mineLevel === 0 ? 'Periodically deploy explosive mines from tail.' : 'Mines drop faster and deal more damage.',
              color: 'text-orange-400',
              type: 'WEAPON'
          }),
          () => ({
              id: 'LIGHTNING',
              title: statsRef.current.weapon.chainLightningLevel === 0 ? 'UNLOCK VOLTAIC ARC' : `VOLTAIC ARC MK ${statsRef.current.weapon.chainLightningLevel + 1}`,
              description: statsRef.current.weapon.chainLightningLevel === 0 ? 'Attacks have a chance to chain lightning to nearby enemies.' : 'Increases chain range and damage.',
              color: 'text-cyan-400',
              type: 'WEAPON'
          }),
          () => ({
              id: 'SHOCKWAVE',
              title: `SYSTEM SHOCK MK ${statsRef.current.weapon.shockwaveLevel + 1}`,
              description: 'Increases EMP blast radius and damage. Charges faster.',
              color: 'text-blue-400',
              type: 'WEAPON'
          }),
          // DEFENSE / UTILITY
          () => ({
              id: 'SHIELD',
              title: statsRef.current.shieldActive ? 'SHIELD RECHARGE' : 'ACTIVATE SHIELD',
              description: statsRef.current.shieldActive ? 'Repair shield integrity to 100%.' : 'One-hit protection from collision.',
              color: 'text-cyan-400',
              type: 'DEFENSE'
          }),
          () => ({
              id: 'CRITICAL',
              title: 'COMBAT ALGORITHM',
              description: `Increase Crit Chance to ${Math.floor((statsRef.current.critChance + 0.05)*100)}% and Multiplier.`,
              color: 'text-purple-400',
              type: 'UTILITY'
          }),
          () => ({
              id: 'FOOD',
              title: 'GENETIC MODIFICATION',
              description: 'Increases XP gain, Score multiplier, and Pickup Range.',
              color: 'text-green-400',
              type: 'UTILITY'
          })
      ];

      // Shuffle and pick 3 unique options (by ID logic)
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < 3) {
          selectedIndices.add(Math.floor(Math.random() * pool.length));
      }
      
      selectedIndices.forEach(idx => {
          options.push(pool[idx]());
      });
      
      return options;
  };

  const checkLevelUp = () => {
      if (xpRef.current >= xpToNextLevelRef.current) {
          audio.playLevelUp();
          setUpgradeOptions(generateUpgradeOptions());
          setStatus(GameStatus.LEVEL_UP);
          xpRef.current -= xpToNextLevelRef.current;
          xpToNextLevelRef.current = Math.floor(xpToNextLevelRef.current * 1.25); 
          levelRef.current += 1;
          setUiLevel(levelRef.current);
          setUiXp((xpRef.current / xpToNextLevelRef.current) * 100);
      } else {
          setUiXp((xpRef.current / xpToNextLevelRef.current) * 100);
      }
  };

  const triggerStageTransition = () => {
      transitionStateRef.current = {
          phase: 'SLOW_DOWN',
          startTime: Date.now()
      };
      
      // Check Unlock Condition
      const config = DIFFICULTY_CONFIGS[difficulty];
      if (stageRef.current === config.stageGoal) {
          unlockNextDifficulty();
      }
  };

  const executeStageMigration = () => {
      stageRef.current += 1;
      setUiStage(stageRef.current);
      wallsRef.current = generateWalls(stageRef.current);
      stageScoreRef.current = 0;
      setBossActive(false);
      
      // Soft Reset position
      snakeRef.current = [
          { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) },
          { x: Math.floor(GRID_COLS / 2) - 1, y: Math.floor(GRID_ROWS / 2) },
          { x: Math.floor(GRID_COLS / 2) - 2, y: Math.floor(GRID_ROWS / 2) }
      ];
      directionRef.current = Direction.RIGHT;
      directionQueueRef.current = [];
      
      foodRef.current = [];
      enemiesRef.current = [];
      projectilesRef.current = [];
      terminalsRef.current = [];
      minesRef.current = [];
      lightningArcsRef.current = [];
      spawnFood(FoodType.NORMAL);
      
      shakeRef.current = 0; 
  };

  const startResumeCountdown = () => {
      setStatus(GameStatus.RESUMING);
      setResumeCountdown(3);
      lastTimeRef.current = Date.now(); // Reset delta tracking
  };

  const applyUpgrade = (type: string) => {
      switch(type) {
          case 'CANNON':
              statsRef.current.weapon.cannonLevel++;
              statsRef.current.weapon.cannonDamage += 5;
              statsRef.current.weapon.cannonFireRate = Math.max(200, statsRef.current.weapon.cannonFireRate - 200);
              break;
          case 'AURA':
              statsRef.current.weapon.auraLevel++;
              statsRef.current.weapon.auraRadius += 0.5;
              statsRef.current.weapon.auraDamage += 3;
              break;
          case 'SHOCKWAVE':
              statsRef.current.weapon.shockwaveLevel++;
              statsRef.current.weapon.shockwaveRadius += 2;
              statsRef.current.weapon.shockwaveDamage += 25;
              statsRef.current.empChargeMod += 0.2; // Charge faster
              break;
          case 'NANO_SWARM':
              statsRef.current.weapon.nanoSwarmLevel++;
              statsRef.current.weapon.nanoSwarmCount += 2;
              statsRef.current.weapon.nanoSwarmDamage += 10;
              break;
          case 'MINES':
              statsRef.current.weapon.mineLevel++;
              statsRef.current.weapon.mineDamage += 20;
              statsRef.current.weapon.mineRadius = 3;
              statsRef.current.weapon.mineDropRate = Math.max(1000, 4000 - (statsRef.current.weapon.mineLevel * 500));
              break;
          case 'LIGHTNING':
              statsRef.current.weapon.chainLightningLevel++;
              statsRef.current.weapon.chainLightningDamage = 0.5 + (statsRef.current.weapon.chainLightningLevel * 0.1); // % of triggering damage
              statsRef.current.weapon.chainLightningRange = 6 + (statsRef.current.weapon.chainLightningLevel);
              break;
          case 'FOOD':
              statsRef.current.foodQualityMod += 0.3;
              statsRef.current.scoreMultiplier += 0.2;
              statsRef.current.magnetRangeMod += 1.0; 
              break;
          case 'CRITICAL':
              statsRef.current.critChance += 0.05;
              statsRef.current.critMultiplier += 0.2;
              break;
          case 'SHIELD':
              statsRef.current.shieldActive = true;
              setUiShield(true);
              break;
      }
      startResumeCountdown();
  };

  const damageEnemy = (e: Enemy, damage: number, isCrit: boolean = false, canChain: boolean = true) => {
      // Apply Critical Hit Chance (if not already crit)
      let finalDamage = damage;
      let critical = isCrit;
      
      if (!isCrit && Math.random() < statsRef.current.critChance) {
          finalDamage *= statsRef.current.critMultiplier;
          critical = true;
      }

      e.hp -= finalDamage;
      e.flash = 5;
      
      const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
      const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
      
      spawnFloatingText(
        ex, ey, 
        Math.floor(finalDamage).toString(), 
        critical ? COLORS.critText : COLORS.damageText,
        critical ? 20 : 12
      );

      // Chain Lightning Logic
      if (canChain && statsRef.current.weapon.chainLightningLevel > 0) {
          const range = statsRef.current.weapon.chainLightningRange;
          
          // Find nearest valid target that isn't this enemy
          let nearest: Enemy | null = null;
          let minDistSq = Infinity;
          const rSq = range * range;
          
          for(const other of enemiesRef.current) {
              if (other === e) continue;
              const d2 = Math.pow(other.x - e.x, 2) + Math.pow(other.y - e.y, 2);
              if (d2 <= rSq && d2 < minDistSq) {
                  minDistSq = d2;
                  nearest = other;
              }
          }

          if (nearest) {
              const chainDmg = finalDamage * statsRef.current.weapon.chainLightningDamage;
              damageEnemy(nearest, chainDmg, false, false); // Don't infinite chain for now
              
              // Add Arc Visual
              lightningArcsRef.current.push({
                  id: Math.random().toString(36),
                  x1: ex,
                  y1: ey,
                  x2: nearest.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                  y2: nearest.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                  life: 1.0,
                  color: COLORS.lightning
              });
              audio.playHit(); // Zap sound reuse for now
          }
      }

      if (e.hp <= 0 && e.type === EnemyType.BOSS) {
          // Boss defeated
          shakeRef.current = 50;
          audio.playLevelUp();
          audio.playEMP();
          
          scoreRef.current += 10000;
          xpRef.current += 5000;
          checkLevelUp();
          triggerStageTransition();
      }
  };

  // --- Game Loop ---

  const update = (dt: number) => {
    // Shake decay
    if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 0.05);
    }
    
    // Invulnerability decay
    if (invulnerabilityTimeRef.current > 0) {
        invulnerabilityTimeRef.current -= dt;
    }
    
    const now = Date.now();
    const theme = getTheme(stageRef.current);
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];

    // Stats Tracking
    if (status === GameStatus.PLAYING) {
        peakEmpRef.current = Math.max(peakEmpRef.current, empChargeRef.current);
    }

    // 1. Food Expiration
    foodRef.current = foodRef.current.filter(f => {
      if (f.lifespan && now - f.createdAt > f.lifespan) return false;
      return true;
    });
    if (foodRef.current.length === 0) spawnFood(FoodType.NORMAL);

    // 2. Passive Score & Stage Progress
    passiveScoreTimerRef.current += dt;
    if (passiveScoreTimerRef.current > 1000) {
        const bonus = PASSIVE_SCORE_PER_SEC * statsRef.current.scoreMultiplier;
        scoreRef.current += bonus;
        stageScoreRef.current += bonus;
        // setUiScore is handled at end of frame
        passiveScoreTimerRef.current = 0;
    }
    
    // Check Stage Advancement - only if we are not already transitioning AND not in a boss fight
    if (stageScoreRef.current >= POINTS_PER_STAGE && transitionStateRef.current.phase === 'NONE' && !bossActive) {
        triggerStageTransition();
    }

    // 3. Enemy Spawning
    const spawnRate = Math.max(1500, (ENEMY_SPAWN_INTERVAL - (stageRef.current * 800) - (levelRef.current * 100)) / diffConfig.spawnRateMod);
    enemySpawnTimerRef.current += dt;
    if (enemySpawnTimerRef.current > spawnRate) {
        const maxEnemies = bossActive ? 6 : (3 + Math.floor(levelRef.current / 2) + stageRef.current);
        if (enemiesRef.current.length < maxEnemies) { 
             spawnEnemy();
        }
        enemySpawnTimerRef.current = 0;
    }
    
    // Terminal Spawning
    if (!bossActive && Math.random() < TERMINAL_SPAWN_CHANCE * (dt/16)) { 
        spawnTerminal();
    }
    
    // Terminal Hacking
    const snakeHead = snakeRef.current[0];
    terminalsRef.current.forEach((t, idx) => {
        const dist = Math.sqrt(Math.pow(snakeHead.x - t.x, 2) + Math.pow(snakeHead.y - t.y, 2));
        
        if (dist <= t.radius) {
            // Hacking
            t.progress += dt;
            if (t.progress >= t.totalTime) {
                // Hack Complete
                terminalsRef.current.splice(idx, 1);
                terminalsHackedRef.current += 1;
                
                audio.playPowerUp();
                audio.playLevelUp();
                
                const bonusScore = 1000 * statsRef.current.scoreMultiplier;
                const bonusXP = 300 * statsRef.current.foodQualityMod;
                scoreRef.current += bonusScore;
                stageScoreRef.current += bonusScore;
                xpRef.current += bonusXP;
                
                // Full System Shock Charge
                empChargeRef.current = 100;
                setUiEmp(100);
                prevUiEmp.current = 100;
                
                createParticles(t.x, t.y, t.color, 20);
                checkLevelUp();
            }
        } else {
            // Decay
            t.progress = Math.max(0, t.progress - dt * 2);
        }
    });

    // 4. Weapons Logic
    
    // Cannon (Burst Fire at lvl 5+)
    if (statsRef.current.weapon.cannonLevel > 0) {
        weaponFireTimerRef.current += dt;
        if (weaponFireTimerRef.current > statsRef.current.weapon.cannonFireRate && enemiesRef.current.length > 0) {
            
            let nearest: Enemy | null = null;
            let minDist = Infinity;
            
            enemiesRef.current.forEach(e => {
                const d = Math.pow(e.x - snakeHead.x, 2) + Math.pow(e.y - snakeHead.y, 2);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            });

            if (nearest) {
                const target = nearest as Enemy; 
                const dx = target.x - snakeHead.x;
                const dy = target.y - snakeHead.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                
                if (mag > 0) {
                    const fireShot = (offsetAngle: number = 0) => {
                         const angle = Math.atan2(dy, dx) + offsetAngle;
                         const vx = Math.cos(angle) * (PROJECTILE_SPEED / DEFAULT_SETTINGS.gridSize);
                         const vy = Math.sin(angle) * (PROJECTILE_SPEED / DEFAULT_SETTINGS.gridSize);
                         
                         projectilesRef.current.push({
                            id: Math.random().toString(36),
                            x: snakeHead.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            y: snakeHead.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            vx: vx * DEFAULT_SETTINGS.gridSize,
                            vy: vy * DEFAULT_SETTINGS.gridSize,
                            damage: statsRef.current.weapon.cannonDamage,
                            color: COLORS.projectile
                        });
                    };

                    fireShot(0);
                    // Burst fire
                    if (statsRef.current.weapon.cannonLevel >= 5) {
                         setTimeout(() => fireShot(0.2), 100);
                         setTimeout(() => fireShot(-0.2), 200);
                    }

                    audio.playShoot();
                    weaponFireTimerRef.current = 0;
                }
            }
        }
    }

    // Nano Swarm Logic
    if (statsRef.current.weapon.nanoSwarmLevel > 0) {
        const count = statsRef.current.weapon.nanoSwarmCount;
        const radius = 3.5 * DEFAULT_SETTINGS.gridSize; // Orbit radius
        const speed = now / 400; // Rotation speed
        
        const cx = snakeHead.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        const cy = snakeHead.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        
        for(let i=0; i<count; i++) {
             const angle = speed + (i * (Math.PI * 2 / count));
             const sx = cx + Math.cos(angle) * radius;
             const sy = cy + Math.sin(angle) * radius;
             
             // Check collisions
             enemiesRef.current.forEach(e => {
                  const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                  const d = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
                  
                  if (d < DEFAULT_SETTINGS.gridSize) {
                       // Hit
                       if (!e.flash) {
                           damageEnemy(e, statsRef.current.weapon.nanoSwarmDamage);
                           createParticles(e.x, e.y, COLORS.nanoSwarm, 2);
                       }
                  }
             });
        }
    }

    // Mines Logic
    if (statsRef.current.weapon.mineLevel > 0) {
        mineDropTimerRef.current += dt;
        if (mineDropTimerRef.current > statsRef.current.weapon.mineDropRate) {
            mineDropTimerRef.current = 0;
            const tail = snakeRef.current[snakeRef.current.length - 1];
            if (tail) {
                minesRef.current.push({
                    id: Math.random().toString(36),
                    x: tail.x,
                    y: tail.y,
                    damage: statsRef.current.weapon.mineDamage,
                    radius: statsRef.current.weapon.mineRadius,
                    triggerRadius: 1.5,
                    createdAt: now
                });
            }
        }
        
        // Mine Collisions
        for (let i = minesRef.current.length - 1; i >= 0; i--) {
            const mine = minesRef.current[i];
            let exploded = false;
            
            // Check enemies
            for (const enemy of enemiesRef.current) {
                const dist = Math.sqrt(Math.pow(enemy.x - mine.x, 2) + Math.pow(enemy.y - mine.y, 2));
                if (dist <= mine.triggerRadius) {
                    exploded = true;
                    // AoE Damage
                    shockwavesRef.current.push({
                        id: Math.random().toString(36),
                        x: mine.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y: mine.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        currentRadius: 0,
                        maxRadius: mine.radius * DEFAULT_SETTINGS.gridSize,
                        damage: mine.damage,
                        opacity: 1.0
                    });
                    createParticles(mine.x, mine.y, COLORS.mine, 20);
                    audio.playCompress(); // Reuse sound
                    break;
                }
            }
            if (exploded) minesRef.current.splice(i, 1);
        }
    }

    // Tail Aura (Damages enemies near ANY body part)
    if (statsRef.current.weapon.auraLevel > 0) {
        auraTickTimerRef.current += dt;
        if (auraTickTimerRef.current > 500) { 
            const r2 = Math.pow(statsRef.current.weapon.auraRadius, 2);
            
            enemiesRef.current.forEach(e => {
                // Check distance to any snake part
                const hit = snakeRef.current.some(seg => {
                     const d2 = Math.pow(e.x - seg.x, 2) + Math.pow(e.y - seg.y, 2);
                     return d2 <= r2;
                });

                if (hit) {
                    damageEnemy(e, statsRef.current.weapon.auraDamage);
                }
            });
            auraTickTimerRef.current = 0;
        }
    }

    // Projectiles
    projectilesRef.current.forEach(p => {
        p.x += p.vx * (dt / 50); 
        p.y += p.vy * (dt / 50);
    });
    
    // Lightning Cleanup
    lightningArcsRef.current.forEach(arc => {
        arc.life -= dt * 0.003; // Fade out
    });
    lightningArcsRef.current = lightningArcsRef.current.filter(arc => arc.life > 0);

    // Cleanup shockwaves
    shockwavesRef.current = shockwavesRef.current.filter(s => {
        s.currentRadius += SHOCKWAVE_SPEED * (dt / 16);
        s.opacity -= 0.01 * (dt / 16);
        
        // Check Collisions
        const rSq = Math.pow(s.currentRadius, 2);
        enemiesRef.current.forEach(e => {
            const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
            const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
            const dSq = Math.pow(ex - s.x, 2) + Math.pow(ey - s.y, 2);
            
            // Only damage if on the expanding edge
            if (dSq <= rSq && dSq >= Math.pow(s.currentRadius - 20, 2)) {
                 damageEnemy(e, s.damage * 0.1, true); // Tick damage as it passes
                 // Pushback
                 const angle = Math.atan2(ey - s.y, ex - s.x);
                 e.x += Math.cos(angle) * 0.5;
                 e.y += Math.sin(angle) * 0.5;
            }
        });
        return s.opacity > 0 && s.currentRadius < s.maxRadius;
    });

    // Projectile Collisions (Snake Shots)
    projectilesRef.current = projectilesRef.current.filter(p => {
        if (p.x < 0 || p.x > CANVAS_WIDTH || p.y < 0 || p.y > CANVAS_HEIGHT) return false;
        
        // Player projectiles (Yellow) hurt enemies
        if (p.color === COLORS.projectile) {
            let hit = false;
            for (const e of enemiesRef.current) {
                const ex = e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                const ey = e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                const dist = Math.abs(p.x - ex) + Math.abs(p.y - ey); 
                
                if (dist < DEFAULT_SETTINGS.gridSize) {
                    damageEnemy(e, p.damage);
                    hit = true;
                    audio.playHit();
                    break;
                }
            }
            return !hit;
        } 
        
        return true; // Keep enemy projectiles for now, filtered in collision check or boundary
    });
    
    // Filter enemy projectiles out of bounds
    projectilesRef.current = projectilesRef.current.filter(p => p.x > 0 && p.x < CANVAS_WIDTH && p.y > 0 && p.y < CANVAS_HEIGHT);

    // Cleanup Dead Enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        if (e.flash && e.flash > 0) e.flash--;
        
        if (e.hp <= 0) {
             enemiesRef.current.splice(i, 1);
             createParticles(e.x, e.y, theme.enemy, 15);
             audio.playEnemyDestroy();
             
             // Count kill for report
             enemiesKilledRef.current += 1;

             if (e.type !== EnemyType.BOSS) {
                const points = 100 * comboMultiplierRef.current * statsRef.current.scoreMultiplier;
                scoreRef.current += points;
                stageScoreRef.current += points;
                xpRef.current += 150 * statsRef.current.foodQualityMod;
                
                empChargeRef.current = Math.min(100, empChargeRef.current + (EMP_CHARGE_PER_FOOD * statsRef.current.empChargeMod));
                
                checkLevelUp();
             }
        }
    }
    
    // Optimized UI State Update
    const currentEmp = Math.floor(empChargeRef.current);
    if (currentEmp !== prevUiEmp.current) {
        setUiEmp(currentEmp);
        prevUiEmp.current = currentEmp;
    }
    const currentScore = Math.floor(scoreRef.current);
    if (currentScore !== prevUiScore.current) {
        setUiScore(currentScore);
        prevUiScore.current = currentScore;
    }

    // Boss & Special Enemy AI
    enemiesRef.current.forEach(e => {
        const distToPlayer = Math.sqrt(Math.pow(snakeHead.x - e.x, 2) + Math.pow(snakeHead.y - e.y, 2));

        if (e.type === EnemyType.BOSS) {
            // Boss Behavior Logic based on Difficulty
            
            // NEOPHYTE (EASY): Passive, Radial Attacks
            if (difficulty === Difficulty.EASY) {
                // Slow drift to center
                const targetX = Math.floor(GRID_COLS/2);
                const targetY = Math.floor(GRID_ROWS/2);
                const dx = targetX - e.x;
                const dy = targetY - e.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                if (mag > 0.1) {
                    e.x += (dx/mag) * 0.05;
                    e.y += (dy/mag) * 0.05;
                }

                // Simple Radial Attack
                e.attackTimer = (e.attackTimer || 0) + dt;
                if (e.attackTimer > 3000) {
                    e.attackTimer = 0;
                    for(let i=0; i<8; i++) {
                         const angle = (i/8) * Math.PI * 2;
                         projectilesRef.current.push({
                            id: Math.random().toString(36),
                            x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            vx: Math.cos(angle) * PROJECTILE_SPEED * 0.5 * DEFAULT_SETTINGS.gridSize,
                            vy: Math.sin(angle) * PROJECTILE_SPEED * 0.5 * DEFAULT_SETTINGS.gridSize,
                            damage: 15,
                            color: '#ff0000'
                         });
                    }
                }
            }

            // OPERATOR (MEDIUM): Drifting, Aimed Shots, Spawns Interceptors
            else if (difficulty === Difficulty.MEDIUM) {
                // Drifts towards player slowly
                const dx = snakeHead.x - e.x;
                const dy = snakeHead.y - e.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                if (mag > 5) { // Keep some distance
                    e.x += (dx/mag) * 0.04;
                    e.y += (dy/mag) * 0.04;
                }

                // Aimed Shot
                e.attackTimer = (e.attackTimer || 0) + dt;
                if (e.attackTimer > 1500) {
                    e.attackTimer = 0;
                    const angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                    projectilesRef.current.push({
                        id: Math.random().toString(36),
                        x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        vx: Math.cos(angle) * PROJECTILE_SPEED * 0.8 * DEFAULT_SETTINGS.gridSize,
                        vy: Math.sin(angle) * PROJECTILE_SPEED * 0.8 * DEFAULT_SETTINGS.gridSize,
                        damage: 20,
                        color: '#ff0000'
                    });
                }

                // Spawn Interceptor
                e.spawnTimer = (e.spawnTimer || 0) + dt;
                if (e.spawnTimer > 6000 && enemiesRef.current.length < 5) {
                    e.spawnTimer = 0;
                    spawnEnemy(EnemyType.INTERCEPTOR);
                }
            }

            // VETERAN (HARD): Aggressive Chase, Burst Fire, Spawns Shooters
            else if (difficulty === Difficulty.HARD) {
                // Phase 1: Rapid Fire
                if (e.hp > e.maxHp * 0.5) {
                     e.attackTimer = (e.attackTimer || 0) + dt;
                     if (e.attackTimer > 2000) {
                         e.attackTimer = 0;
                         // Burst
                         const angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                         [0, 0.2, -0.2].forEach(offset => {
                             projectilesRef.current.push({
                                id: Math.random().toString(36),
                                x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                                y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                                vx: Math.cos(angle + offset) * PROJECTILE_SPEED * 0.9 * DEFAULT_SETTINGS.gridSize,
                                vy: Math.sin(angle + offset) * PROJECTILE_SPEED * 0.9 * DEFAULT_SETTINGS.gridSize,
                                damage: 25,
                                color: '#ff0000'
                             });
                         });
                     }
                } 
                // Phase 2: Swarm
                else {
                    e.spawnTimer = (e.spawnTimer || 0) + dt;
                    if (e.spawnTimer > 4000 && enemiesRef.current.length < 6) {
                        e.spawnTimer = 0;
                        spawnEnemy(EnemyType.SHOOTER);
                    }
                }
                
                // Movement
                 const dx = snakeHead.x - e.x;
                 const dy = snakeHead.y - e.y;
                 const mag = Math.sqrt(dx*dx + dy*dy);
                 if (mag > 0.1) {
                    e.x += (dx/mag) * 0.06;
                    e.y += (dy/mag) * 0.06;
                 }
            }

            // CYBERPSYCHO (INSANE): Dash + Shockwave
            else {
                 e.attackTimer = (e.attackTimer || 0) + dt;
                 if (e.attackTimer > 4000) {
                     e.attackTimer = 0;
                     // Radial + Shockwave
                     shockwavesRef.current.push({
                        id: Math.random().toString(36),
                        x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                        currentRadius: 0,
                        maxRadius: 10 * DEFAULT_SETTINGS.gridSize,
                        damage: 40,
                        opacity: 1.0
                     });
                     
                     for(let i=0; i<16; i++) {
                         const angle = (i/16) * Math.PI * 2;
                         projectilesRef.current.push({
                            id: Math.random().toString(36),
                            x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                            vx: Math.cos(angle) * PROJECTILE_SPEED * 0.7 * DEFAULT_SETTINGS.gridSize,
                            vy: Math.sin(angle) * PROJECTILE_SPEED * 0.7 * DEFAULT_SETTINGS.gridSize,
                            damage: 20,
                            color: '#ff0000'
                         });
                    }
                 }

                 // Dasher spawns
                 e.spawnTimer = (e.spawnTimer || 0) + dt;
                 if (e.spawnTimer > 5000 && enemiesRef.current.length < 7) {
                    e.spawnTimer = 0;
                    spawnEnemy(EnemyType.DASHER);
                 }
                 
                 // Erratic Movement
                 const dx = snakeHead.x - e.x;
                 const dy = snakeHead.y - e.y;
                 const mag = Math.sqrt(dx*dx + dy*dy);
                 if (mag > 0.1) {
                    e.x += (dx/mag) * 0.08 + (Math.random()-0.5)*0.1;
                    e.y += (dy/mag) * 0.08 + (Math.random()-0.5)*0.1;
                 }
            }

        } 
        else if (e.type === EnemyType.SHOOTER) {
             // Shooter Logic: Stay at distance 8-12 units
             e.attackTimer = (e.attackTimer || 0) + dt;
             
             if (e.attackTimer > 3000) {
                 // Shoot
                 const angle = Math.atan2(snakeHead.y - e.y, snakeHead.x - e.x);
                 projectilesRef.current.push({
                    id: Math.random().toString(36),
                    x: e.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                    y: e.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                    vx: Math.cos(angle) * PROJECTILE_SPEED * 0.6 * DEFAULT_SETTINGS.gridSize,
                    vy: Math.sin(angle) * PROJECTILE_SPEED * 0.6 * DEFAULT_SETTINGS.gridSize,
                    damage: 20,
                    color: '#ff0000'
                 });
                 e.attackTimer = 0;
             }
        }
        else if (e.type === EnemyType.DASHER) {
            // Dasher Logic: Charge up and burst move
            e.dashTimer = (e.dashTimer || 0) + dt;
            
            if (e.dashState === 'IDLE') {
                if (e.dashTimer > 2000) {
                    e.dashState = 'CHARGING';
                    e.dashTimer = 0;
                }
            } else if (e.dashState === 'CHARGING') {
                if (e.dashTimer > 500) {
                    e.dashState = 'DASHING';
                    e.dashTimer = 0;
                }
            } else if (e.dashState === 'DASHING') {
                // Actual movement handled in Movement block, just state switch back
                if (e.dashTimer > 300) {
                    e.dashState = 'IDLE';
                    e.dashTimer = 0;
                }
            }
        }
    });

    // 5. Enemy Movement
    enemyMoveTimerRef.current += dt;
    const isSlowActive = now < powerUpsRef.current.slowUntil;
    const isMagnetActive = now < powerUpsRef.current.magnetUntil;
    
    // Sync UI State
    if (isSlowActive !== lastPowerUpStateRef.current.slow || isMagnetActive !== lastPowerUpStateRef.current.magnet) {
        lastPowerUpStateRef.current = { slow: isSlowActive, magnet: isMagnetActive };
        setActivePowerUps({ slow: isSlowActive, magnet: isMagnetActive });
    }

    const effectiveEnemyTick = (isSlowActive ? ENEMY_MOVE_TICK * 3 : ENEMY_MOVE_TICK) / diffConfig.speedMod;
    
    if (enemyMoveTimerRef.current > effectiveEnemyTick) {
        enemiesRef.current.forEach(enemy => {
            if (enemy.type === EnemyType.BOSS) return; // Boss moves smoothly

            // Shooter Movement: Try to maintain range
            if (enemy.type === EnemyType.SHOOTER) {
                const dist = Math.abs(snakeHead.x - enemy.x) + Math.abs(snakeHead.y - enemy.y);
                if (dist > 8 && dist < 12) return; // Hold position
            }
            
            // Dasher Movement override
            if (enemy.type === EnemyType.DASHER) {
                if (enemy.dashState !== 'DASHING') return; // Only move during dash
                // When dashing, moves 2x or 3x per frame? Simplified to just aggressive move here
                // We actually want Dashers to move multiple steps in one tick if dashing
            }

            let targetX = snakeHead.x;
            let targetY = snakeHead.y;
            
            if (enemy.type === EnemyType.INTERCEPTOR) {
                let dirX = 0, dirY = 0;
                if (directionRef.current === Direction.LEFT) dirX = -1;
                if (directionRef.current === Direction.RIGHT) dirX = 1;
                if (directionRef.current === Direction.UP) dirY = -1;
                if (directionRef.current === Direction.DOWN) dirY = 1;
                targetX = Math.min(Math.max(0, snakeHead.x + dirX * 4), GRID_COLS-1);
                targetY = Math.min(Math.max(0, snakeHead.y + dirY * 4), GRID_ROWS-1);
            }

            const moveEnemy = (e: Enemy, tx: number, ty: number) => {
                const dx = tx - e.x;
                const dy = ty - e.y;
                let moves = [];
                if (Math.abs(dx) > Math.abs(dy)) {
                    moves.push({x: dx > 0 ? 1 : -1, y: 0});
                    moves.push({x: 0, y: dy > 0 ? 1 : -1});
                } else {
                    moves.push({x: 0, y: dy > 0 ? 1 : -1});
                    moves.push({x: dx > 0 ? 1 : -1, y: 0});
                }
                
                for (let move of moves) {
                    const nextX = e.x + move.x;
                    const nextY = e.y + move.y;
                    const wallHit = wallsRef.current.some(w => w.x === nextX && w.y === nextY);
                    const boundHit = nextX < 0 || nextX >= GRID_COLS || nextY < 0 || nextY >= GRID_ROWS;
                    if (!wallHit && !boundHit) {
                        e.x = nextX;
                        e.y = nextY;
                        break;
                    }
                }
            };
            
            if (enemy.type === EnemyType.DASHER && enemy.dashState === 'DASHING') {
                // Move twice
                moveEnemy(enemy, targetX, targetY);
                moveEnemy(enemy, targetX, targetY);
            } else {
                moveEnemy(enemy, targetX, targetY);
            }
        });
        enemyMoveTimerRef.current = 0;
    }


    // 6. Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 6b. Floating Texts
    floatingTextsRef.current.forEach(t => {
      t.y += t.vy;
      t.life -= 0.02;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);

    // 7. Snake Movement
    accumulatorRef.current += dt;
    const currentSpeed = isSlowActive ? baseSpeedRef.current * 1.5 : baseSpeedRef.current;
    
    if (accumulatorRef.current < currentSpeed) return; 
    accumulatorRef.current -= currentSpeed;
    if (accumulatorRef.current > currentSpeed * 2) accumulatorRef.current = 0;

    if (directionQueueRef.current.length > 0) {
        directionRef.current = directionQueueRef.current.shift()!;
    }

    const head = { ...snakeRef.current[0] };

    switch (directionRef.current) {
      case Direction.UP: head.y -= 1; break;
      case Direction.DOWN: head.y += 1; break;
      case Direction.LEFT: head.x -= 1; break;
      case Direction.RIGHT: head.x += 1; break;
    }

    // --- COLLISION CHECKS ---
    let hitWall = false;
    let hitSelf = false;
    let hitDangerousEnemy = false;
    let hitProjectile = false;
    let collidedEnemy: Enemy | undefined;

    // 1. Boundaries & Walls
    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) hitWall = true;
    if (wallsRef.current.some(w => w.x === head.x && w.y === head.y)) hitWall = true;

    // 2. Self (Tail)
    if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) hitSelf = true;

    // 3. Enemies
    collidedEnemy = enemiesRef.current.find(e => Math.abs(e.x - head.x) < 1 && Math.abs(e.y - head.y) < 1);
    if (collidedEnemy) hitDangerousEnemy = true;
    
    // 4. Projectiles
    if (projectilesRef.current.some(p => p.color === '#ff0000' && Math.abs(p.x - head.x*DEFAULT_SETTINGS.gridSize) < 10 && Math.abs(p.y - head.y*DEFAULT_SETTINGS.gridSize) < 10)) {
        hitProjectile = true;
    }

    if (hitWall || hitSelf || hitDangerousEnemy || hitProjectile) {
        const isInvulnerable = invulnerabilityTimeRef.current > 0;
        const hasShield = statsRef.current.shieldActive;

        if (hasShield || isInvulnerable) {
            // Trigger Shield Break Effect if not already invulnerable
            if (hasShield && !isInvulnerable) {
                statsRef.current.shieldActive = false;
                setUiShield(false);
                shakeRef.current = 30;
                audio.playShieldHit();
                createParticles(head.x, head.y, COLORS.shield, 30);
                invulnerabilityTimeRef.current = 2000;
            }

            // Logic per collision type
            if (hitWall) {
                // Walls are solid hard stops. We cannot pass through them.
                // Stop movement for this frame to allow turning.
                return; 
            }

            if (hitDangerousEnemy && collidedEnemy) {
                // Contact damage logic while invulnerable (Instakill small enemies)
                if (collidedEnemy.type !== EnemyType.BOSS) {
                    damageEnemy(collidedEnemy, 100, true);
                }
                // Proceed (Ghost through enemy)
            }

            if (hitProjectile) {
                // Destroy projectile
                 projectilesRef.current = projectilesRef.current.filter(p => !(p.color === '#ff0000' && Math.abs(p.x - head.x*DEFAULT_SETTINGS.gridSize) < 10 && Math.abs(p.y - head.y*DEFAULT_SETTINGS.gridSize) < 10));
                 // Proceed
            }

            if (hitSelf) {
                // Ghost Mode: Pass through tail
                // Proceed, do NOT return
            }

        } else {
            gameOver();
            return;
        }
    }

    snakeRef.current.unshift(head); 

    // Body Check (Tail Whip)
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        if (enemy.type === EnemyType.BOSS) continue; // Cannot tail whip boss easily

        const hitBodyIndex = snakeRef.current.findIndex((part, idx) => idx > 0 && part.x === enemy.x && part.y === enemy.y);
        
        if (hitBodyIndex !== -1) {
            damageEnemy(enemy, 100, true);
            shakeRef.current = 2;
        }
    }

    // Food Collision
    let eatenIndex = -1;
    let eatenByMagnet = false;
    const magnetRadius = MAGNET_RADIUS + statsRef.current.magnetRangeMod + (isMagnetActive ? 6 : 0);

    eatenIndex = foodRef.current.findIndex(f => f.x === head.x && f.y === head.y);

    if (eatenIndex === -1) { // Check magnet only if not directly collected
      const magnetTargets = foodRef.current.map((f, i) => {
        const dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y); 
        return { index: i, dist, item: f };
      }).filter(item => item.dist <= magnetRadius);

      if (magnetTargets.length > 0) {
        magnetTargets.sort((a, b) => a.dist - b.dist);
        eatenIndex = magnetTargets[0].index;
        eatenByMagnet = true;
      }
    }
    
    if (eatenIndex !== -1) {
      const eaten = foodRef.current[eatenIndex];
      foodRef.current.splice(eatenIndex, 1);
      
      if (eatenByMagnet) {
        const steps = 5;
        for(let i=0; i<steps; i++) {
           particlesRef.current.push({
             x: eaten.x * DEFAULT_SETTINGS.gridSize + (head.x - eaten.x) * DEFAULT_SETTINGS.gridSize * (i/steps),
             y: eaten.y * DEFAULT_SETTINGS.gridSize + (head.y - eaten.y) * DEFAULT_SETTINGS.gridSize * (i/steps),
             vx: 0, vy: 0, life: 0.5, color: COLORS.foodMagnet
           });
        }
      }

      if (eaten.type === FoodType.POISON) {
        audio.playPoison();
        createParticles(head.x, head.y, COLORS.foodPoison);
        scoreRef.current = Math.max(0, scoreRef.current - 50);
        shakeRef.current = 10;
        comboMultiplierRef.current = 1; 
        setUiCombo(1);
        empChargeRef.current = Math.max(0, empChargeRef.current - 20);
        
        // Removed unconditional setters
        
        if (snakeRef.current.length > 2) {
            snakeRef.current.pop();
            snakeRef.current.pop();
        } else {
            gameOver();
            return;
        }
      } else {
        if (now - lastEatTimeRef.current < COMBO_WINDOW) {
            comboMultiplierRef.current = Math.min(8, comboMultiplierRef.current * 2);
        } else {
            comboMultiplierRef.current = 1;
        }
        lastEatTimeRef.current = now;
        setUiCombo(comboMultiplierRef.current);
        if (comboMultiplierRef.current > 1) audio.playCombo(comboMultiplierRef.current);

        empChargeRef.current = Math.min(100, empChargeRef.current + (EMP_CHARGE_PER_FOOD * statsRef.current.empChargeMod));
        // Removed unconditional setter here

        let points = 10;
        let xp = 10;
        let color = COLORS.foodNormal;

        switch (eaten.type) {
            case FoodType.BONUS: 
                points = 50; xp = 50;
                color = COLORS.foodBonus; 
                if (comboMultiplierRef.current === 1) audio.playBonus(); 
                break;
            case FoodType.SLOW: 
                points = 20; xp = 20;
                color = COLORS.foodSlow; 
                audio.playPowerUp();
                powerUpsRef.current.slowUntil = Date.now() + (DURATION_SLOW * statsRef.current.slowDurationMod);
                break;
            case FoodType.MAGNET: 
                points = 20; xp = 20;
                color = COLORS.foodMagnet; 
                audio.playPowerUp();
                powerUpsRef.current.magnetUntil = Date.now() + (DURATION_MAGNET * statsRef.current.slowDurationMod); 
                break;
            case FoodType.COMPRESSOR:
                points = 30; xp = 30;
                color = COLORS.foodCompressor;
                audio.playCompress();
                for(let i=0; i<3; i++) {
                    if (snakeRef.current.length > 3) snakeRef.current.pop();
                }
                break;
            default:
                if (comboMultiplierRef.current === 1) audio.playEat();
                break;
        }
        
        const finalXp = xp * statsRef.current.foodQualityMod;
        createParticles(eatenByMagnet ? eaten.x : head.x, eatenByMagnet ? eaten.y : head.y, color);
        // XP Popup
        spawnFloatingText(
             (eatenByMagnet ? eaten.x : head.x) * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2, 
             (eatenByMagnet ? eaten.y : head.y) * DEFAULT_SETTINGS.gridSize,
             `+${Math.floor(finalXp)} XP`,
             '#ffff00',
             10
        );

        const finalPoints = points * comboMultiplierRef.current * statsRef.current.scoreMultiplier;
        scoreRef.current += finalPoints;
        stageScoreRef.current += finalPoints;
        xpRef.current += finalXp;

        checkLevelUp();
      }
      
      // Removed unconditional setUiScore
    } else {
      snakeRef.current.pop(); 
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now();
    const isSlowActive = now < powerUpsRef.current.slowUntil;
    const isMagnetActive = now < powerUpsRef.current.magnetUntil;
    const isInvulnerable = invulnerabilityTimeRef.current > 0;
    const theme = getTheme(stageRef.current);

    // 1. Clear & Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Theme Tint
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    if (shakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * shakeRef.current;
      const dy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(dx, dy);
    }

    // 2. Grid
    ctx.strokeStyle = isSlowActive ? 'rgba(0, 191, 255, 0.2)' : theme.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += DEFAULT_SETTINGS.gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += DEFAULT_SETTINGS.gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();
    
    // 3. Terminals (Under walls)
    const head = snakeRef.current[0]; // Need head for distance check
    terminalsRef.current.forEach(t => {
        const cx = t.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        const cy = t.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        const r = t.radius * DEFAULT_SETTINGS.gridSize;

        // Radius Ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(208, 0, 255, ${0.05 + (t.progress/t.totalTime)*0.1})`;
        ctx.fill();
        ctx.strokeStyle = COLORS.terminalRing;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Hacking Beam
        if (head) {
            const dist = Math.sqrt(Math.pow(head.x - t.x, 2) + Math.pow(head.y - t.y, 2));
            if (dist <= t.radius) {
                const hx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                const hy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
                
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.lineTo(cx, cy);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.lineDashOffset = -now / 20;
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Data particles moving
                const particleT = (now % 1000) / 1000;
                const px = hx + (cx - hx) * particleT;
                const py = hy + (cy - hy) * particleT;
                ctx.fillStyle = '#0f0';
                ctx.fillRect(px-2, py-2, 4, 4);
            }
        }
        
        // Terminal Base
        ctx.shadowBlur = 15;
        ctx.shadowColor = t.color;
        ctx.fillStyle = t.color;
        ctx.fillRect(cx - 8, cy - 8, 16, 16);
        ctx.shadowBlur = 0;
        
        // Progress Arc
        if (t.progress > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, 20, -Math.PI/2, (-Math.PI/2) + (Math.PI*2 * (t.progress/t.totalTime)));
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    // 4. Walls
    ctx.shadowBlur = 5;
    ctx.shadowColor = theme.secondary;
    ctx.fillStyle = theme.wall;
    ctx.strokeStyle = theme.secondary;
    wallsRef.current.forEach(w => {
        const x = w.x * DEFAULT_SETTINGS.gridSize;
        const y = w.y * DEFAULT_SETTINGS.gridSize;
        ctx.fillRect(x, y, DEFAULT_SETTINGS.gridSize, DEFAULT_SETTINGS.gridSize);
        ctx.strokeRect(x, y, DEFAULT_SETTINGS.gridSize, DEFAULT_SETTINGS.gridSize);
    });
    ctx.shadowBlur = 0;
    
    // 4b. Mines
    minesRef.current.forEach(m => {
        const x = m.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        const y = m.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
        const pulse = Math.sin(now / 150) * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.mine;
        ctx.fill();
        
        // Ring
        ctx.beginPath();
        ctx.arc(x, y, m.triggerRadius * DEFAULT_SETTINGS.gridSize, 0, Math.PI*2);
        ctx.strokeStyle = COLORS.mineRing;
        ctx.stroke();
    });

    // 5. Effects (Magnet / Aura / Shield)
    // const head = snakeRef.current[0]; // Already defined above
    const cx = head.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;
    const cy = head.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2;

    // SPECTRE Passive Visual (Radar Ring) or Magnet Powerup
    const hasPassiveMagnet = selectedChar?.id === 'spectre';
    if (isMagnetActive || hasPassiveMagnet) {
        const r = (MAGNET_RADIUS + statsRef.current.magnetRangeMod + (isMagnetActive ? 6 : 0) + 0.5) * DEFAULT_SETTINGS.gridSize;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        
        // Style changes if it's the Spectre passive vs temporary powerup
        if (hasPassiveMagnet && !isMagnetActive) {
             ctx.strokeStyle = `rgba(0, 255, 200, ${0.05 + Math.sin(now/500)*0.05})`; // Subtle pulse
             ctx.lineWidth = 1;
        } else {
             ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(now/100)*0.05})`;
             ctx.lineWidth = 2;
        }
        ctx.stroke();
    }
    
    // Tail Aura (Draws around body segments)
    if (statsRef.current.weapon.auraLevel > 0) {
         // Overdrive class gets a fiercer red aura
         ctx.fillStyle = selectedChar?.id === 'overdrive' ? 'rgba(255, 0, 50, 0.4)' : COLORS.aura;
         
         snakeRef.current.forEach(seg => {
             ctx.beginPath();
             ctx.arc(
                 seg.x * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                 seg.y * DEFAULT_SETTINGS.gridSize + DEFAULT_SETTINGS.gridSize/2,
                 statsRef.current.weapon.auraRadius * DEFAULT_SETTINGS.gridSize,
                 0, Math.PI * 2
             );
             ctx.fill();
         });
    }

    if (statsRef.current.shieldActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, DEFAULT_SETTINGS.gridSize, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.shield;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Nano Swarm Rendering
    if (statsRef.current.weapon.nanoSwarmLevel > 0) {
        const count = statsRef.current.weapon.nanoSwarmCount;
        const radius = 3.5 * DEFAULT_SETTINGS.gridSize;
        const speed = now / 400;
        
        ctx.fillStyle = COLORS.nanoSwarm;
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.nanoSwarm;
        
        for(let i=0; i<count; i++) {
             const angle = speed + (i * (Math.PI * 2 / count));
             const sx = cx + Math.cos(angle) * radius;
             const sy = cy + Math.sin(angle) * radius;
             
             ctx.beginPath();
             ctx.arc(sx, sy, 4, 0, Math.PI*2);
             ctx.fill();
             
             // Trail
             ctx.beginPath();
             ctx.strokeStyle = COLORS.nanoSwarm;
             ctx.lineWidth = 1;
             ctx.moveTo(sx, sy);
             ctx.lineTo(
                 cx + Math.cos(angle - 0.2) * radius,
                 cy + Math.sin(angle - 0.2) * radius
             );
             ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    
    // Lightning Arcs
    lightningArcsRef.current.forEach(arc => {
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        // Jagged line
        const midX = (arc.x1 + arc.x2) / 2 + (Math.random()-0.5) * 20;
        const midY = (arc.y1 + arc.y2) / 2 + (Math.random()-0.5) * 20;
        ctx.lineTo(midX, midY);
        ctx.lineTo(arc.x2, arc.y2);
        
        ctx.strokeStyle = arc.color;
        ctx.globalAlpha = arc.life;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    });

    // Shockwaves
    shockwavesRef.current.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.currentRadius, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(0, 255, 255, ${s.opacity})`;
        ctx.stroke();
        ctx.fillStyle = `rgba(0, 255, 255, ${s.opacity * 0.2})`;
        ctx.fill();
    });
    
    // 6. Snake
    // Opacity pulse if invulnerable
    const snakeAlpha = isInvulnerable ? 0.5 + Math.sin(now/50)*0.5 : 1.0;
    
    snakeRef.current.forEach((seg, index) => {
      const isHead = index === 0;
      const x = seg.x * DEFAULT_SETTINGS.gridSize;
      const y = seg.y * DEFAULT_SETTINGS.gridSize;
      
      ctx.shadowBlur = isHead ? 15 : 5;
      ctx.shadowColor = isHead && isSlowActive ? COLORS.foodSlow : theme.secondary;
      
      // Class-specific Snake Appearance
      let headColor = COLORS.snakeHead;
      let bodyColor = theme.secondary;
      
      if (selectedChar?.id === 'striker') {
          headColor = '#ffff00'; // Yellow head
          bodyColor = index % 2 === 0 ? '#ccaa00' : theme.secondary;
      } else if (selectedChar?.id === 'volt') {
          headColor = '#d000ff';
          if (Math.random() > 0.8) bodyColor = '#fff'; // Spark effect
      } else if (selectedChar?.id === 'rigger') {
          bodyColor = '#ff8800';
      }
      
      ctx.fillStyle = isHead ? headColor : bodyColor;
      
      if (isSlowActive) {
        ctx.fillStyle = isHead ? '#e0ffff' : '#00bfff';
      }
      
      ctx.globalAlpha = snakeAlpha;
      // Spectre Translucency
      if (selectedChar?.id === 'spectre' && !isHead) {
          ctx.globalAlpha = 0.4;
      }
      
      ctx.fillRect(x + 1, y + 1, DEFAULT_SETTINGS.gridSize - 2, DEFAULT_SETTINGS.gridSize - 2);
      ctx.globalAlpha = 1.0;
    });
    ctx.shadowBlur = 0;

    // 7. Enemies & Projectiles
    
    // Projectiles
    projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        // Striker gets bigger projectiles
        const pSize = (selectedChar?.id === 'striker' && p.color === COLORS.projectile) ? 5 : 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pSize, 0, Math.PI*2);
        ctx.fill();
        
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx*2, p.y - p.vy*2);
        ctx.stroke();
    });

    // Enemies
    // Optimization: Batch shadow blur
    ctx.shadowBlur = 10;
    enemiesRef.current.forEach(e => {
        const x = e.x * DEFAULT_SETTINGS.gridSize;
        const y = e.y * DEFAULT_SETTINGS.gridSize;
        const size = DEFAULT_SETTINGS.gridSize;

        let color = theme.enemy;
        if (e.type === EnemyType.BOSS) color = COLORS.boss;
        if (e.type === EnemyType.HUNTER) color = COLORS.enemyHunter;
        if (e.type === EnemyType.INTERCEPTOR) color = COLORS.enemyInterceptor;
        if (e.type === EnemyType.DASHER) color = COLORS.enemyDasher;
        if (e.type === EnemyType.SHOOTER) color = COLORS.enemyShooter;
        if (e.flash && e.flash > 0) color = '#ffffff';

        ctx.shadowColor = color;
        ctx.fillStyle = color;

        ctx.beginPath();
        if (e.type === EnemyType.BOSS) {
            // Boss Shape (Hexagonish)
            const r = size * 1.5;
            const cx = x + size/2;
            const cy = y + size/2;
            for(let i=0; i<6; i++) {
                const ang = i * Math.PI/3;
                ctx.lineTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r);
            }
        } else if (e.type === EnemyType.INTERCEPTOR) {
             ctx.moveTo(x + size/2, y);
             ctx.lineTo(x + size, y + size/2);
             ctx.lineTo(x + size/2, y + size);
             ctx.lineTo(x, y + size/2);
        } else if (e.type === EnemyType.DASHER) {
             // Spiky Star
             const cx = x + size/2;
             const cy = y + size/2;
             const spikes = 5;
             const outer = size/1.2;
             const inner = size/3;
             for(let i=0; i<spikes*2; i++) {
                 const r = i%2===0 ? outer : inner;
                 const a = (i / (spikes*2)) * Math.PI * 2;
                 ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
             }
        } else if (e.type === EnemyType.SHOOTER) {
             // Square with cannon
             ctx.rect(x, y, size, size);
             // Cannon indicator
             const cx = x + size/2;
             const cy = y + size/2;
             // Calculate angle to player for visual
             const angle = Math.atan2(head.y*DEFAULT_SETTINGS.gridSize - y, head.x*DEFAULT_SETTINGS.gridSize - x);
             ctx.moveTo(cx, cy);
             ctx.lineTo(cx + Math.cos(angle)*size, cy + Math.sin(angle)*size);
        } else {
            // Standard Hunter (Triangle)
            ctx.moveTo(x + size/2, y);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x, y + size);
        }
        ctx.closePath();
        ctx.fill();
    });
    // Draw HP Bars separately to avoid shadow blur on them
    ctx.shadowBlur = 0;
    enemiesRef.current.forEach(e => {
        const x = e.x * DEFAULT_SETTINGS.gridSize;
        const y = e.y * DEFAULT_SETTINGS.gridSize;
        const size = DEFAULT_SETTINGS.gridSize;
        const hpPercent = e.hp / e.maxHp;
        
        ctx.fillStyle = COLORS.hpBarBg;
        ctx.fillRect(x, y - 10, size, 4);
        ctx.fillStyle = COLORS.hpBarFill;
        ctx.fillRect(x, y - 10, size * hpPercent, 4);
    });

    // 8. Food
    // Optimization: Batch shadow
    ctx.shadowBlur = 10;
    foodRef.current.forEach(f => {
      const x = f.x * DEFAULT_SETTINGS.gridSize;
      const y = f.y * DEFAULT_SETTINGS.gridSize;
      const size = DEFAULT_SETTINGS.gridSize;
      
      let color = COLORS.foodNormal;
      if (f.type === FoodType.BONUS) color = COLORS.foodBonus;
      else if (f.type === FoodType.POISON) color = COLORS.foodPoison;
      else if (f.type === FoodType.SLOW) color = COLORS.foodSlow;
      else if (f.type === FoodType.MAGNET) color = COLORS.foodMagnet;
      else if (f.type === FoodType.COMPRESSOR) color = COLORS.foodCompressor;

      ctx.shadowColor = color;
      ctx.fillStyle = color;

      const pulse = Math.sin(now / 200) * 2;
      
      if (f.type === FoodType.MAGNET) {
          ctx.beginPath();
          ctx.moveTo(x + size/2, y + 2 - pulse);
          ctx.lineTo(x + size - 2 + pulse, y + size/2);
          ctx.lineTo(x + size/2, y + size - 2 + pulse);
          ctx.lineTo(x + 2 - pulse, y + size/2);
          ctx.fill();
      } else if (f.type === FoodType.SLOW) {
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, size/2 - 2 + pulse/2, 0, Math.PI*2);
          ctx.fill();
      } else if (f.type === FoodType.COMPRESSOR) {
          ctx.fillRect(x+4, y+4, size-8, size-8);
          // strokeStyle change requires separate pass or inline change, inline is okay for few items
          // but we are batching shadow, so it's fine
      } else {
          ctx.fillRect(
            x + 2 - pulse/2, 
            y + 2 - pulse/2, 
            size - 4 + pulse, 
            size - 4 + pulse
          );
      }
      
       if (f.type === FoodType.COMPRESSOR) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x+2, y+2, size-4, size-4);
      }
    });
    ctx.shadowBlur = 0;

    // 9. Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;

    // 10. Floating Text
    ctx.font = 'bold 12px "Orbitron"';
    ctx.textAlign = 'center';
    floatingTextsRef.current.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life;
        ctx.font = `bold ${t.size}px "Orbitron"`;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();
  };

  const tick = (time: number) => {
    let dt = time - lastTimeRef.current;
    
    // Resume Count Logic
    if (status === GameStatus.RESUMING) {
        if (resumeCountdown > 0) {
            // Count down handled by effect, strictly waiting here
        } else {
            setStatus(GameStatus.PLAYING);
        }
    }
    
    // Time Dilation Logic
    let timeScale = 1.0;
    const tState = transitionStateRef.current;
    
    // Prevent transition logic from running if we are in a blocking state (Level Up, Paused, etc.)
    const isBlockingState = status === GameStatus.LEVEL_UP || 
                            status === GameStatus.GAME_OVER || 
                            status === GameStatus.PAUSED || 
                            status === GameStatus.CHARACTER_SELECT || 
                            status === GameStatus.DIFFICULTY_SELECT ||
                            status === GameStatus.RESUMING;

    if (!isBlockingState) {
        if (tState.phase === 'SLOW_DOWN') {
            const elapsed = Date.now() - tState.startTime;
            const duration = 1500; // 1.5s slow down
            const progress = Math.min(1, elapsed / duration);
            timeScale = 1 - progress; // 1 -> 0
            
            if (progress >= 1) {
                transitionStateRef.current.phase = 'HACKING';
                transitionStateRef.current.startTime = Date.now();
                setStatus(GameStatus.STAGE_TRANSITION);
                audio.playHack();
            }
        } else if (tState.phase === 'HACKING') {
            timeScale = 0; // Frozen
            const elapsed = Date.now() - tState.startTime;
            const duration = 3000; // 3s hack screen
            if (elapsed >= duration) {
                executeStageMigration();
                setStatus(GameStatus.PLAYING);
                transitionStateRef.current.phase = 'SPEED_UP';
                transitionStateRef.current.startTime = Date.now();
                lastTimeRef.current = time; // Reset time delta to avoid jump
                return; // Skip this frame update to align
            }
        } else if (tState.phase === 'SPEED_UP') {
            const elapsed = Date.now() - tState.startTime;
            const duration = 1000; // 1s speed up
            const progress = Math.min(1, elapsed / duration);
            timeScale = progress; // 0 -> 1
            
            if (progress >= 1) {
                transitionStateRef.current.phase = 'NONE';
            }
        }
    }

    // Only update game logic if not blocked, and if in valid phase
    const shouldUpdate = !isBlockingState && (status === GameStatus.PLAYING || (tState.phase === 'SLOW_DOWN') || (tState.phase === 'SPEED_UP'));

    if (shouldUpdate) {
      // Apply time scale to dt
      dt = Math.min(dt, 100) * timeScale;
      update(dt);
    }
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    // Resume countdown timer effect
    if (status === GameStatus.RESUMING && resumeCountdown > 0) {
        const timer = setTimeout(() => {
            setResumeCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (status === GameStatus.RESUMING && resumeCountdown === 0) {
        setStatus(GameStatus.PLAYING);
    }
  }, [status, resumeCountdown]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status]); 

  // --- Input Handling ---

  const handleInput = useCallback((newDir: Direction) => {
    const lastDir = directionQueueRef.current.length > 0
        ? directionQueueRef.current[directionQueueRef.current.length - 1]
        : directionRef.current;

    const isOpposite = 
        (newDir === Direction.UP && lastDir === Direction.DOWN) ||
        (newDir === Direction.DOWN && lastDir === Direction.UP) ||
        (newDir === Direction.LEFT && lastDir === Direction.RIGHT) ||
        (newDir === Direction.RIGHT && lastDir === Direction.LEFT);

    if (newDir !== lastDir && !isOpposite) {
        if (directionQueueRef.current.length < 3) {
            directionQueueRef.current.push(newDir);
        }
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status === GameStatus.GAME_OVER) {
        if (e.key === ' ' || e.key === 'Enter') {
            handleStartClick(); // Go back to char select
        }
        return;
    }

    if (status === GameStatus.LEVEL_UP) {
        if (e.key === '1' && upgradeOptions[0]) applyUpgrade(upgradeOptions[0].id);
        if (e.key === '2' && upgradeOptions[1]) applyUpgrade(upgradeOptions[1].id);
        if (e.key === '3' && upgradeOptions[2]) applyUpgrade(upgradeOptions[2].id);
        return;
    }

    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        setStatus(prev => prev === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING);
        return;
    }

    if (status !== GameStatus.PLAYING && status !== GameStatus.STAGE_TRANSITION && transitionStateRef.current.phase === 'NONE') return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        handleInput(Direction.UP);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        handleInput(Direction.DOWN);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        handleInput(Direction.LEFT);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        handleInput(Direction.RIGHT);
        break;
      case 'Shift':
        e.preventDefault();
        triggerSystemShock();
        break;
    }
  }, [status, handleInput, upgradeOptions, triggerSystemShock]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // --- UI Handlers ---
  const handleStartClick = () => {
      setStatus(GameStatus.DIFFICULTY_SELECT);
  };
  
  const handleDifficultySelect = (diff: Difficulty) => {
      setDifficulty(diff);
      setStatus(GameStatus.CHARACTER_SELECT);
  };

  const selectCharacter = (char: CharacterProfile) => {
    setSelectedChar(char);
    audio.resume();
    resetGame(char);
    setStatus(GameStatus.PLAYING);
  };

  const handleMobileControl = (dir: Direction) => {
    if (status !== GameStatus.PLAYING) return;
    handleInput(dir);
  };

  const handleMobileEMP = () => {
    if (status !== GameStatus.PLAYING) return;
    triggerSystemShock();
  }
  
  const currentTheme = STAGE_THEMES[((uiStage - 1) % 4) + 1] || STAGE_THEMES[1];

  // Modified glitch class logic: at 100%, show stable pulse instead of intense shake
  const glitchClass = uiEmp >= 100 ? 'border-2 border-white shadow-[inset_0_0_50px_rgba(255,255,255,0.1)]' : uiEmp > 80 ? 'glitch-intense' : uiEmp > 50 ? 'glitch-minor' : '';

  return (
    <div className={`relative w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-screen ${glitchClass}`}>
      
      {/* HUD */}
      <div className="w-full flex justify-between items-end mb-2 px-2 text-cyan-400 font-display uppercase tracking-widest relative z-20">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">RUNTIME SCORE</span>
          <span className="text-3xl animate-glow" style={{ color: currentTheme.secondary }}>{uiScore.toString().padStart(6, '0')}</span>
          {/* Combo Timer Bar */}
          {uiCombo > 1 && (
            <div className="w-full h-1 bg-gray-900 mt-1">
                <div 
                    className="h-full bg-purple-500 transition-all duration-100 ease-linear"
                    style={{ 
                        width: `${Math.max(0, 1 - (Date.now() - lastEatTimeRef.current) / COMBO_WINDOW) * 100}%` 
                    }}
                />
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center flex-1 mx-4">
             {/* Stage Indicator */}
             <div className="text-[10px] text-gray-500 mb-1" style={{ color: currentTheme.secondary }}>{currentTheme.name} // STAGE {uiStage} // {DIFFICULTY_CONFIGS[difficulty].label}</div>
             
             {/* Threat Level Indicator */}
             <div className={`text-[10px] font-bold tracking-widest ${
                 getThreatLevel(uiStage) === "EXTREME" ? "text-red-500 animate-pulse" : 
                 getThreatLevel(uiStage) === "HIGH" ? "text-orange-400" :
                 getThreatLevel(uiStage) === "MODERATE" ? "text-yellow-300" : "text-green-300"
             }`}>
                 THREAT: {getThreatLevel(uiStage)}
             </div>

             {/* Boss HP Bar */}
             {bossActive && (
                 <div className="w-full max-w-md h-4 bg-red-900/50 mb-2 border border-red-500 relative overflow-hidden mt-1">
                     <div 
                         className="h-full bg-red-600 transition-all duration-300" 
                         style={{ 
                             width: `${(enemiesRef.current.find(e => e.type === EnemyType.BOSS)?.hp || 0) / (enemiesRef.current.find(e => e.type === EnemyType.BOSS)?.maxHp || 1) * 100}%` 
                         }}
                     ></div>
                     <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold tracking-[0.2em] shadow-black drop-shadow-md">
                         ⚠️ FIREWALL SENTINEL DETECTED ⚠️
                     </div>
                 </div>
             )}
             
             {/* XP Bar */}
             <div className="w-full max-w-xs h-1 bg-gray-900 mb-1 mt-1">
                 <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${uiXp}%` }}></div>
             </div>

             {/* EMP Bar */}
             <div className="w-full max-w-xs flex flex-col gap-1 items-center">
                 <div className="w-full h-2 bg-gray-900 border border-gray-700 rounded overflow-hidden relative">
                    <div 
                        className={`h-full transition-all duration-300 ${uiEmp >= 100 ? 'bg-white animate-pulse shadow-[0_0_10px_#fff]' : ''}`}
                        style={{ width: `${uiEmp}%`, backgroundColor: uiEmp >= 100 ? 'white' : currentTheme.secondary }}
                    />
                 </div>
                 <div className={`text-[9px] ${uiEmp >= 100 ? 'text-white animate-pulse' : 'text-gray-600'}`}>
                     SYSTEM SHOCK {uiEmp >= 100 ? '[READY - PRESS SHIFT]' : `${uiEmp}%`}
                 </div>
             </div>

            {/* Active Effects Display */}
            <div className="flex space-x-2 h-4 mt-1 items-center">
               {activePowerUps.slow && (
                   <span className="text-[10px] text-blue-300 animate-pulse">SLOW</span>
               )}
               {activePowerUps.magnet && (
                   <span className="text-[10px] text-white animate-pulse">MAGNET</span>
               )}
               {uiCombo > 1 && (
                    <span className="text-[10px] text-purple-300 font-bold animate-bounce">x{uiCombo}</span>
               )}
               {uiShield && (
                   <span className="text-[10px] text-cyan-300 border border-cyan-500 px-1 rounded animate-pulse">SHIELD</span>
               )}
               {/* Hack Status */}
               {terminalsRef.current.some(t => {
                   const head = snakeRef.current[0];
                   if(!head) return false;
                   const dist = Math.sqrt(Math.pow(head.x - t.x, 2) + Math.pow(head.y - t.y, 2));
                   return dist <= t.radius;
               }) && (
                   <span className="text-[10px] text-fuchsia-400 font-bold animate-pulse">HACKING...</span>
               )}
            </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">LONGEST STABLE RUNTIME</span>
          <span className="text-xl">{highScore}</span>
        </div>
      </div>

      {/* Main Game Container */}
      <div 
        className="relative group border-2 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black transition-colors duration-1000"
        style={{ borderColor: currentTheme.wall }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-auto max-h-[70vh] aspect-[4/3] object-contain"
        />
        
        <div className="scanlines pointer-events-none"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr transition-colors duration-1000 from-transparent to-black/20"></div>

        {/* Start Screen */}
        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
            <h1 className="text-5xl md:text-7xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] text-center">
              NEON SNAKE
            </h1>
            <div className="text-center mb-6 text-gray-500 text-xs tracking-[0.3em] uppercase">
                SNK_PROTOCOL // ADAPTIVE CONTAINMENT ROUTINE
            </div>
            <button 
              onClick={handleStartClick}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-display rounded clip-path-polygon transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] group"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
            >
              INITIALIZE
              <div className="text-[10px] font-normal opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 left-0 w-full text-center text-cyan-400">
                  Begin containment cycle
              </div>
            </button>
          </div>
        )}

        {/* Difficulty Selection */}
        {status === GameStatus.DIFFICULTY_SELECT && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-md p-4">
                <h2 className="text-2xl md:text-4xl font-display text-white mb-6">SELECT THREAT LEVEL</h2>
                <div className="grid grid-cols-1 gap-4 w-full max-w-lg">
                    {Object.values(DIFFICULTY_CONFIGS).map(config => {
                        const isUnlocked = unlockedDifficulties.includes(config.id);
                        return (
                            <button 
                                key={config.id}
                                disabled={!isUnlocked}
                                onClick={() => handleDifficultySelect(config.id)}
                                className={`flex flex-col items-start p-4 border transition-all text-left relative overflow-hidden group
                                    ${isUnlocked 
                                        ? `border-gray-700 hover:border-white bg-gray-900/50 hover:bg-gray-800` 
                                        : `border-gray-900 bg-gray-950 opacity-50 cursor-not-allowed`
                                    }
                                `}
                            >
                                <div className="flex justify-between w-full items-center mb-1">
                                    <h3 className={`text-xl font-bold ${isUnlocked ? config.color : 'text-gray-600'}`}>
                                        {config.label}
                                    </h3>
                                    {!isUnlocked && <span className="text-xs text-red-500 uppercase">LOCKED</span>}
                                </div>
                                <p className="text-sm text-gray-400">{config.description}</p>
                                {!isUnlocked && (
                                    <div className="mt-2 text-xs text-gray-500 border-t border-gray-800 pt-1 w-full">
                                        UNLOCK: {config.unlockCondition}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Character Select */}
        {status === GameStatus.CHARACTER_SELECT && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 backdrop-blur-md p-4">
                <h2 className="text-2xl md:text-4xl font-display text-cyan-400 mb-6">SELECT PROTOCOL</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                    {CHARACTERS.map(char => (
                        <button 
                            key={char.id}
                            onClick={() => selectCharacter(char)}
                            className={`flex flex-col items-start p-6 border transition-all w-full text-left relative overflow-hidden group
                                hover:bg-gray-800 bg-gray-900/80
                            `}
                            style={{ borderColor: char.color }}
                        >
                             <div className="flex justify-between w-full items-start mb-2">
                                <h3 className="text-xl font-bold" style={{ color: char.color }}>{char.name}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 border border-white/20 rounded ${
                                    char.tag === 'STABLE' ? 'text-blue-300' : 
                                    char.tag === 'ADAPTIVE' ? 'text-green-300' : 
                                    'text-red-300'
                                }`}>
                                    {char.tag}
                                </span>
                             </div>
                             
                             <p className="text-sm text-gray-400 mb-4 flex-grow">{char.description}</p>
                             
                             <div className="mt-auto flex flex-col gap-1 w-full">
                                <div className="text-xs font-bold text-white mb-2">{char.payoff}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 pt-2 border-t border-gray-800">Specs:</div>
                                {char.initialStats.weapon && (
                                    <div className="text-xs text-gray-400">
                                        Weapon: {char.initialStats.weapon.cannonLevel > 1 ? `LVL ${char.initialStats.weapon.cannonLevel}` : 'Standard'}
                                    </div>
                                )}
                                {char.initialStats.shieldActive && <div className="text-xs text-cyan-400">Shield: ONLINE</div>}
                             </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Level Up */}
        {status === GameStatus.LEVEL_UP && (
             <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 backdrop-blur-md p-6">
                <h2 className="text-4xl font-display text-yellow-400 mb-2 animate-pulse">SYSTEM UPGRADE</h2>
                <p className="text-gray-400 mb-8">Select augmentation protocol</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    {upgradeOptions.map((opt, idx) => (
                        <button
                            key={opt.id}
                            onClick={() => applyUpgrade(opt.id)}
                            className="flex flex-col p-6 bg-gray-900 border border-gray-700 hover:border-white hover:bg-gray-800 transition-all text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 text-6xl font-black text-white">
                                {idx + 1}
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${opt.color}`}>{opt.title}</h3>
                            <p className="text-sm text-gray-300">{opt.description}</p>
                            <div className="mt-4 text-xs text-gray-500">PRESS {idx + 1}</div>
                        </button>
                    ))}
                </div>
             </div>
        )}

        {/* Paused */}
        {status === GameStatus.PAUSED && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="text-4xl font-display text-white tracking-widest animate-pulse border-2 border-white p-4">
                    PROTOCOL SUSPENDED
                </div>
            </div>
        )}

        {/* Game Over / Containment Failure */}
        {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center z-50 backdrop-blur-md p-8">
                <h2 className="text-5xl font-display text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">CONTAINMENT FAILURE</h2>
                <p className="text-red-300 font-mono text-sm mb-8 tracking-wider">{failureMessageRef.current}</p>
                
                <div className="w-full max-w-md bg-black/50 border border-red-900 p-4 mb-8 font-mono text-sm">
                    <div className="text-red-500 border-b border-red-900 pb-2 mb-2 font-bold">SYSTEM REPORT</div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Stable Runtime:</span>
                        <span className="text-white">{formatTime(Date.now() - startTimeRef.current)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Peak System Shock:</span>
                        <span className="text-white">{Math.floor(peakEmpRef.current)}%</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Drones Neutralized:</span>
                        <span className="text-white">{enemiesKilledRef.current}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Terminals Accessed:</span>
                        <span className="text-white">{terminalsHackedRef.current}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Anomalies Observed:</span>
                        <span className="text-red-400 font-bold">YES</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleStartClick} 
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-display rounded shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-transform transform hover:scale-105"
                    >
                        INITIATE ROLLBACK
                    </button>
                    <button 
                        onClick={() => setStatus(GameStatus.IDLE)} 
                        className="px-6 py-3 border border-red-800 hover:bg-red-900/50 text-red-400 font-display rounded transition-colors"
                    >
                        RETURN TO CONSOLE
                    </button>
                </div>
            </div>
        )}

        {/* Stage Transition */}
        {status === GameStatus.STAGE_TRANSITION && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 font-mono text-green-500">
                <div className="text-xl mb-4 tracking-widest">CONTAINMENT STABLE</div>
                <div className="w-64 h-2 bg-gray-900 border border-green-900 rounded overflow-hidden relative">
                    <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>
                    <div className="h-full bg-green-500 animate-[ping_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-4 text-xs text-green-400 animate-pulse flex flex-col items-center gap-1">
                     <span>{`> DECRYPTING SECTOR ${stageRef.current + 1} KEY...`}</span>
                     <span>{`> BYPASSING SECURITY PROTOCOLS...`}</span>
                </div>
            </div>
        )}

        {/* Resuming Count */}
        {status === GameStatus.RESUMING && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/20">
                <div className="text-9xl font-black text-white animate-ping opacity-75">
                    {resumeCountdown}
                </div>
            </div>
        )}

      </div>

      {/* Mobile Controls Overlay */}
      <div className="w-full max-w-lg mt-6 grid grid-cols-3 gap-3 md:hidden h-48 select-none touch-none">
          <div className="col-start-2 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-center active:bg-cyan-600/50 active:border-cyan-400 transition-colors" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.UP); }}>
            <span className="text-2xl text-gray-400">▲</span>
          </div>
          
          <div className="col-start-1 row-start-2 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-center active:bg-cyan-600/50 active:border-cyan-400 transition-colors" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.LEFT); }}>
             <span className="text-2xl text-gray-400">◀</span>
          </div>
          
          <div className="col-start-2 row-start-2 bg-red-900/30 rounded-xl border border-red-800 flex items-center justify-center active:bg-red-600/50 active:border-red-400 transition-colors" onPointerDown={(e) => { e.preventDefault(); handleMobileEMP(); }}>
              <span className="font-bold text-red-400">EMP</span>
          </div>
          
          <div className="col-start-3 row-start-2 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-center active:bg-cyan-600/50 active:border-cyan-400 transition-colors" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.RIGHT); }}>
              <span className="text-2xl text-gray-400">▶</span>
          </div>
          
          <div className="col-start-2 row-start-3 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-center active:bg-cyan-600/50 active:border-cyan-400 transition-colors" onPointerDown={(e) => { e.preventDefault(); handleMobileControl(Direction.DOWN); }}>
              <span className="text-2xl text-gray-400">▼</span>
          </div>
      </div>

      <div className="mt-6 text-xs text-gray-500 font-mono text-center hidden md:block">
          <span className="text-cyan-500">ARROWS</span> or <span className="text-cyan-500">WASD</span> to Move • <span className="text-cyan-500">SHIFT</span> for EMP • <span className="text-cyan-500">SPACE</span> to Pause
      </div>

    </div>
  );
};

export default SnakeGame;