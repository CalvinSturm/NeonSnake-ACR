
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface Point {
  x: number;
  y: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_UP = 'LEVEL_UP',
  STAGE_TRANSITION = 'STAGE_TRANSITION',
  READY = 'READY',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  CONFIGURATION = 'CONFIGURATION',
  ARCHIVE = 'ARCHIVE',
  COSMETICS = 'COSMETICS',
  RESUMING = 'RESUMING'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  INSANE = 'INSANE'
}

export enum CameraMode {
  TOP_DOWN = 'TOP_DOWN',
  SIDE_SCROLL = 'SIDE_SCROLL'
}

export enum FoodType {
  NORMAL = 'NORMAL',
  XP_ORB = 'XP_ORB'
}

export enum EnemyType {
  HUNTER = 'HUNTER',
  INTERCEPTOR = 'INTERCEPTOR',
  SHOOTER = 'SHOOTER',
  DASHER = 'DASHER',
  BOSS = 'BOSS'
}

export type MobileControlScheme = 'JOYSTICK' | 'ARROWS' | 'SWIPE';
export type TerminalType = 'RESOURCE' | 'MEMORY' | 'OVERRIDE' | 'CLEARANCE';
export type ModalState = 'NONE' | 'SETTINGS' | 'PAUSE';

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
  luckLevel: number;
}

export interface UpgradeStats {
  weapon: WeaponStats;
  slowDurationMod: number;
  magnetRangeMod: number;
  shieldActive: boolean;
  scoreMultiplier: number;
  foodQualityMod: number;
  critChance: number;
  critMultiplier: number;
  hackSpeedMod: number;
  moveSpeedMod: number;
  luck: number;
  activeWeaponIds: string[];
  maxWeaponSlots: number;
  acquiredUpgradeIds: string[];
  globalDamageMod: number;
  globalFireRateMod: number;
  globalAreaMod: number;
  globalProjectileSpeedMod: number;
}

export interface Trait {
  name: string;
  description: string;
  type: 'GROWTH' | 'STATIC';
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  color: string;
  tag: string;
  payoff: string;
  traits: Trait[];
  initialStats: Partial<UpgradeStats>;
}

export interface EnemyPhysicsProfile {
  usesVerticalPhysics: boolean;
  canJump: boolean;
  jumpCooldown: number;
}

export interface Enemy extends Point {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  state: 'SPAWNING' | 'ACTIVE' | 'ENTERING';
  spawnTime: number;
  spawnSide?: string;
  flash: number;
  hitCooldowns?: Record<string, number>;
  stunTimer?: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  physicsProfile: EnemyPhysicsProfile;
  jumpCooldownTimer: number;
  jumpIntent: boolean;
  shouldRemove?: boolean;
  bossPhase?: number;
  attackTimer?: number;
  spawnTimer?: number;
  dashTimer?: number;
  dashState?: string;
  bossConfigId?: string;
  bossState?: any;
  facing?: number;
  summons?: number;
  targetPos?: Point;
  angle?: number;
}

export interface Projectile extends Point {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size: number;
  type: 'STANDARD' | 'LANCE' | 'SHARD' | 'SERPENT' | 'RAIL';
  owner: 'PLAYER' | 'ENEMY';
  shouldRemove?: boolean;
  piercing?: boolean;
  hitIds?: string[];
  age?: number;
  life?: number;
  homing?: boolean;
  targetId?: string;
  usesGravity: boolean;
}

export interface FoodItem extends Point {
  type: FoodType;
  id: string;
  createdAt: number;
  value?: number;
  lifespan?: number;
  shouldRemove?: boolean;
}

export interface Terminal extends Point {
  id: string;
  type: TerminalType;
  radius: number;
  progress: number;
  totalTime: number;
  isLocked: boolean;
  color: string;
  associatedFileId?: string;
  isBeingHacked?: boolean;
  justCompleted?: boolean;
  shouldRemove?: boolean;
  lastEffectTime?: number;
}

export interface Mine extends Point {
  id: string;
  damage: number;
  radius: number;
  triggerRadius: number;
  createdAt: number;
  shouldRemove?: boolean;
}

export interface Shockwave extends Point {
  id: string;
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

export interface DigitalRainDrop extends Point {
  speed: number;
  chars: string;
  size: number;
  opacity: number;
}

export interface Hitbox extends Point {
  id: string;
  ownerId: string;
  width: number;
  height: number;
  damage: number;
  color: string;
  shouldRemove?: boolean;
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

export type AudioEvent = 
  | 'MOVE' | 'EAT' | 'XP_COLLECT' | 'SHOOT' | 'EMP' | 'HIT' 
  | 'GAME_OVER' | 'LEVEL_UP' | 'BONUS' | 'POWER_UP' | 'SHIELD_HIT' 
  | 'ENEMY_DESTROY' | 'HACK_LOST' | 'HACK_COMPLETE' | 'ENEMY_SPAWN' | 'COMPRESS'
  | 'ARCHIVE_LOCK' | 'COSMETIC_UNLOCK'
  | 'CLI_POWER' | 'CLI_BURST' | 'GLITCH_TEAR' | 'SYS_RECOVER' | 'UI_HARD_CLICK';

export type UpgradeCategory = 'WEAPON' | 'DEFENSE' | 'UTILITY' | 'SYSTEM' | 'HACKING' | 'MOBILITY' | 'THREAT' | 'ECONOMY' | 'REACTIVE' | 'SCALAR';
export type UpgradeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ULTRA_RARE' | 'MEGA_RARE' | 'LEGENDARY' | 'OVERCLOCKED';

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

export interface AudioPlayData {
    multiplier?: number;
    level?: number;
    difficulty?: Difficulty;
    combo?: number;
    terminalType?: string;
}
