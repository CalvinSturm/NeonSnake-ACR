
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_UP = 'LEVEL_UP',
  STAGE_TRANSITION = 'STAGE_TRANSITION',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  RESUMING = 'RESUMING'
}

export type ModalState = 'NONE' | 'PAUSE' | 'SETTINGS';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  INSANE = 'INSANE'
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum EnemyType {
  HUNTER = 'HUNTER',
  INTERCEPTOR = 'INTERCEPTOR',
  SHOOTER = 'SHOOTER',
  DASHER = 'DASHER',
  BOSS = 'BOSS'
}

export enum FoodType {
  NORMAL = 'NORMAL',
  XP_ORB = 'XP_ORB'
}

export type EnemyState = 'SPAWNING' | 'ENTERING' | 'ACTIVE';

export interface Point {
  x: number;
  y: number;
}

export interface WeaponStats {
  cannonLevel: number;
  cannonDamage: number;
  cannonFireRate: number;
  cannonProjectileCount: number;
  cannonProjectileSpeed: number;
  auraLevel: number;
  auraRadius: number;
  auraDamage: number;
  nanoSwarmLevel: number;
  nanoSwarmCount: number;
  nanoSwarmDamage: number;
  mineLevel: number;
  mineDamage: number;
  mineRadius: number;
  mineDropRate: number;
  chainLightningLevel: number;
  chainLightningDamage: number;
  chainLightningRange: number;
  prismLanceLevel: number;
  prismLanceDamage: number;
  neonScatterLevel: number;
  neonScatterDamage: number;
  voltSerpentLevel: number;
  voltSerpentDamage: number;
  phaseRailLevel: number;
  phaseRailDamage: number;
  reflectorMeshLevel: number;
  ghostCoilLevel: number;
  neuralMagnetLevel: number;
  overclockLevel: number;
  echoCacheLevel: number;
}

export interface UpgradeStats {
  weapon: WeaponStats;
  magnetRangeMod: number;
  shieldActive: boolean;
  scoreMultiplier: number;
  foodQualityMod: number;
  critChance: number;
  critMultiplier: number;
  hackSpeedMod: number;
  moveSpeedMod: number;
  activeWeaponIds: string[];
  maxWeaponSlots: number;
  acquiredUpgradeIds: string[];
  // GLOBAL SCALARS
  globalDamageMod: number;
  globalFireRateMod: number;
  globalAreaMod: number;
  globalProjectileSpeedMod: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  traitName: string; 
  traitDescription: string;
  color: string;
  tag: 'STABLE' | 'ADAPTIVE' | 'VOLATILE';
  payoff: string;
  initialStats: Partial<UpgradeStats>;
}

export interface StageTheme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  wall: string;
  enemy: string;
}

export interface GameSettings {
  gridSize: number;
  initialSpeed: number;
  volume: number;
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
  stageGoal: number;
  color: string;
}

export interface Enemy extends Point {
  id: string;
  type: EnemyType;
  state: EnemyState;
  spawnSide?: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  spawnTime: number;
  hp: number;
  maxHp: number;
  flash: number;
  hitCooldowns?: Record<string, number>;
  stunTimer?: number;
  // Boss specific
  bossPhase?: number;
  attackTimer?: number;
  spawnTimer?: number;
  dashTimer?: number;
  dashState?: 'IDLE' | 'CHARGE' | 'DASH';
  targetPos?: Point;
  angle?: number;
  summons?: number;
  shouldRemove?: boolean;
}

export interface FoodItem extends Point {
  id: string;
  type: FoodType;
  value?: number; // for XP orbs
  createdAt: number;
  lifespan?: number;
  shouldRemove?: boolean;
}

export interface Projectile extends Point {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  owner: 'PLAYER' | 'ENEMY';
  size: number;
  type?: 'STANDARD' | 'LANCE' | 'SHARD' | 'SERPENT' | 'RAIL';
  piercing?: boolean;
  hitIds?: string[];
  homing?: boolean;
  targetId?: string;
  life?: number;
  shouldRemove?: boolean;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  damage: number;
  opacity: number;
  stunDuration?: number;
  shouldRemove?: boolean;
}

export interface LightningArc {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  color: string;
  shouldRemove?: boolean;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  color: string;
  shouldRemove?: boolean;
}

export interface FloatingText extends Point {
  id: string;
  text: string;
  color: string;
  life: number;
  vy: number;
  size: number;
  shouldRemove?: boolean;
}

export interface Mine extends Point {
  id: string;
  damage: number;
  radius: number;
  triggerRadius: number;
  createdAt: number;
  shouldRemove?: boolean;
}

export type TerminalType = 'RESOURCE' | 'CLEARANCE' | 'OVERRIDE';

export interface Terminal extends Point {
  id: string;
  type: TerminalType;
  radius: number;
  progress: number;
  totalTime: number;
  isLocked: boolean;
  color: string;
  particleTimer?: number;
  lastEffectTime?: number;
  justDisconnected?: boolean;
  justCompleted?: boolean;
  shouldRemove?: boolean;
}

export interface DigitalRainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string;
  size: number;
  opacity: number;
}

export type AudioEvent = 
  | 'MOVE' | 'EAT' | 'XP_COLLECT' | 'SHOOT' | 'EMP' | 'HIT' 
  | 'GAME_OVER' | 'LEVEL_UP' | 'BONUS' | 'POWER_UP' | 'SHIELD_HIT' 
  | 'ENEMY_DESTROY' | 'HACK_LOST' | 'HACK_COMPLETE' | 'ENEMY_SPAWN' | 'COMPRESS';

export type UpgradeCategory = 'WEAPON' | 'DEFENSE' | 'UTILITY' | 'SYSTEM' | 'HACKING' | 'MOBILITY' | 'THREAT' | 'ECONOMY' | 'REACTIVE' | 'SCALAR';
export type UpgradeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ULTRA_RARE' | 'LEGENDARY';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  color: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  icon: string;
  isNewWeapon?: boolean;
  stats: string[];
}

export interface AudioRequest {
  type: AudioEvent;
  data?: any;
}
