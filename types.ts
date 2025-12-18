
export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}

export enum Difficulty {
  EASY = 'NEOPHYTE',
  MEDIUM = 'OPERATOR',
  HARD = 'VETERAN',
  INSANE = 'CYBERPSYCHO'
}

export enum FoodType {
  NORMAL = 'NORMAL',
  BONUS = 'BONUS',
  POISON = 'POISON',
  SLOW = 'SLOW',
  MAGNET = 'MAGNET',
  COMPRESSOR = 'COMPRESSOR'
}

export enum EnemyType {
  HUNTER = 'HUNTER',
  INTERCEPTOR = 'INTERCEPTOR',
  DASHER = 'DASHER',
  SHOOTER = 'SHOOTER',
  BOSS = 'BOSS'
}

export interface Point {
  x: number;
  y: number;
}

export interface FoodItem extends Point {
  type: FoodType;
  id: string;
  createdAt: number;
  lifespan?: number;
}

export interface Enemy extends Point {
  id: string;
  type: EnemyType;
  spawnTime: number;
  hp: number;
  maxHp: number;
  flash?: number;
  bossPhase?: number; // For Boss AI
  attackTimer?: number; // For Boss & Shooter AI
  spawnTimer?: number; // For Boss summoning
  dashTimer?: number; // For Dasher AI
  dashState?: 'IDLE' | 'CHARGING' | 'DASHING';
}

export interface Terminal extends Point {
  id: string;
  radius: number; // In grid cells
  progress: number; // 0 to 100
  totalTime: number; // ms required to hack
  isLocked: boolean;
  color: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
}

export interface Mine extends Point {
  id: string;
  damage: number;
  radius: number;
  createdAt: number;
  triggerRadius: number;
}

export interface LightningArc {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number; // 0 to 1
  color: string;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  damage: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 0 to 1
  vy: number;
  size: number;
}

export enum GameStatus {
  IDLE,
  DIFFICULTY_SELECT,
  CHARACTER_SELECT,
  PLAYING,
  PAUSED,
  LEVEL_UP,
  GAME_OVER,
  STAGE_TRANSITION,
  RESUMING,
  VICTORY
}

export interface WeaponStats {
  cannonLevel: number;
  cannonDamage: number;
  cannonFireRate: number;
  
  auraLevel: number;
  auraRadius: number;
  auraDamage: number;
  
  shockwaveLevel: number;
  shockwaveRadius: number;
  shockwaveDamage: number;
  
  nanoSwarmLevel: number;
  nanoSwarmCount: number;
  nanoSwarmDamage: number;

  mineLevel: number;
  mineDamage: number;
  mineRadius: number;
  mineDropRate: number; // ms

  chainLightningLevel: number;
  chainLightningDamage: number;
  chainLightningRange: number;
}

export interface UpgradeStats {
  weapon: WeaponStats;
  slowDurationMod: number;
  magnetRangeMod: number;
  empChargeMod: number;
  shieldActive: boolean;
  scoreMultiplier: number;
  foodQualityMod: number;
  critChance: number;
  critMultiplier: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  color: string;
  initialStats: Partial<UpgradeStats>;
  tag: 'STABLE' | 'ADAPTIVE' | 'VOLATILE';
  payoff: string;
}

export interface GameSettings {
  gridSize: number;
  initialSpeed: number;
  volume: number;
}

export interface StageTheme {
  name: string;
  primary: string; // Grid/UI
  secondary: string; // Snake/Glow
  background: string; // Deep bg tint
  wall: string;
  enemy: string;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  color: string;
  type: 'WEAPON' | 'DEFENSE' | 'UTILITY';
}

export interface DifficultyConfig {
    id: Difficulty;
    label: string;
    description: string;
    spawnRateMod: number;
    hpMod: number;
    speedMod: number;
    allowedEnemies: EnemyType[];
    bossHpMod: number;
    unlockCondition: string;
    stageGoal: number; // Stage required to unlock next
    color: string;
}
