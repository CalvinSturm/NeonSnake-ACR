
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
  BONUS = 'BONUS',
  POISON = 'POISON',
  SLOW = 'SLOW',
  MAGNET = 'MAGNET',
  COMPRESSOR = 'COMPRESSOR',
  XP_ORB = 'XP_ORB'
}

export enum MusicSection {
  AMBIENT = 'AMBIENT',
  COMBAT = 'COMBAT',
  INTENSE = 'INTENSE',
  HACKING = 'HACKING',
  BOSS = 'BOSS'
}

export interface Point {
  x: number;
  y: number;
}

export interface EngineFlags {
  shouldRemove?: boolean;
}

export interface Terminal extends Point, EngineFlags {
  id: string;
  radius: number;
  progress: number;
  totalTime: number;
  isLocked: boolean;
  color: string;
  lastEffectTime?: number;
  particleTimer?: number;
  justTicked?: boolean;
  justCompleted?: boolean;
  justDisconnected?: boolean;
}

export interface GameSettings {
  gridSize: number;
  initialSpeed: number;
  volume: number;
}

export interface StageTheme {
  name: string;
  primary: string;
  secondary: string;
  background: string;  
  wall: string;  
  enemy: string;
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

export interface WeaponStats {
  cannonLevel: number;
  cannonDamage: number;
  cannonFireRate: number;
  cannonProjectileCount: number;
  cannonProjectileSpeed: number;
  
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
  mineDropRate: number;
  
  chainLightningLevel: number;
  chainLightningDamage: number;
  chainLightningRange: number;

  // NEW WEAPONS
  prismLanceLevel: number;
  prismLanceDamage: number;
  
  neonScatterLevel: number;
  neonScatterDamage: number;
  
  voltSerpentLevel: number;
  voltSerpentDamage: number;
  
  phaseRailLevel: number;
  phaseRailDamage: number;
  
  // NEW DEFENSE
  reflectorMeshLevel: number; // Chance to reflect
  ghostCoilLevel: number;     // Chance/Cooldown to evade
  empBloomLevel: number;      // Stun on hit radius
  
  // NEW UTILITY
  neuralMagnetLevel: number;  // Pull radius on kill
  overclockLevel: number;     // Speed/FireRate buff intensity
  echoCacheLevel: number;     // Stored damage cap
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  color: string;
  tag: 'STABLE' | 'ADAPTIVE' | 'VOLATILE';
  payoff: string;
  initialStats: Partial<UpgradeStats>;
}

export interface UpgradeStats {
  weapon: WeaponStats;
  slowDurationMod: number;
  magnetRangeMod: number;
  empCooldownMod: number;
  shieldActive: boolean;
  scoreMultiplier: number;
  foodQualityMod: number;
  critChance: number;
  critMultiplier: number;
  
  // ── NEW STATS ──
  hackSpeedMod: number; // For Terminal Hacking
  moveSpeedMod: number; // Base movement speed multiplier
  activeWeaponIds: string[]; // Tracks locked weapon slots
}

export type UpgradeCategory = 'WEAPON' | 'DEFENSE' | 'UTILITY' | 'SYSTEM' | 'HACKING' | 'MOBILITY' | 'THREAT' | 'ECONOMY';
export type UpgradeRarity = 'COMMON' | 'RARE' | 'LEGENDARY';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  color: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  icon: string;
  isNewWeapon?: boolean; // Helper for UI to show "New Weapon" badge
}

export interface Enemy extends Point, EngineFlags {
  id: string;
  type: EnemyType;
  spawnTime: number;
  hp: number;
  maxHp: number;
  flash: number;
  hitCooldowns: Record<string, number>; // Logic debounce (key: weaponId, value: frames)
  attackTimer?: number;
  spawnTimer?: number;
  dashTimer?: number;
  dashState?: 'IDLE' | 'CHARGE' | 'DASH';
  targetPos?: Point;
  angle?: number;
  bossPhase?: number;
  stunTimer?: number;
  summons?: number;
}

export interface FoodItem extends Point, EngineFlags {
  id: string;
  type: FoodType;
  createdAt: number;
  lifespan?: number;
  value?: number; // For XP_ORB amount
}

export interface Projectile extends Point, EngineFlags {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size?: number;
  
  // New props
  type?: 'STANDARD' | 'LANCE' | 'SHARD' | 'SERPENT' | 'RAIL';
  owner: 'PLAYER' | 'ENEMY';
  piercing?: boolean;
  hitIds?: string[]; // IDs of enemies already hit (for piercing)
  homing?: boolean;
  targetId?: string; // For homing
  life?: number; // Time to live (frames or ms)
}

export interface Mine extends Point, EngineFlags {
  id: string;
  damage: number;
  radius: number;
  triggerRadius: number;
  createdAt: number;
}

export interface Shockwave extends EngineFlags {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  damage: number;
  opacity: number;
  stunDuration?: number;
}

export interface Particle extends EngineFlags {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatingText extends EngineFlags {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  size: number;
}

export interface LightningArc extends EngineFlags {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  color: string;
}

export interface DigitalRainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string;
  size: number;
  opacity: number;
}

export type AudioEvent = 'MOVE' | 'EAT' | 'SHOOT' | 'EMP' | 'HIT' | 'GAME_OVER' | 'LEVEL_UP' | 'BONUS' | 'POWER_UP' | 'SHIELD_HIT' | 'ENEMY_DESTROY' | 'HACK_LOST' | 'ENEMY_SPAWN' | 'COMPRESS' | 'HACK_COMPLETE' | 'XP_COLLECT';

export interface AudioRequest {
  type: AudioEvent;
  data?: any;
}
