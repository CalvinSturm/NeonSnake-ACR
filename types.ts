
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

// Physics Configuration
export interface PhysicsProfile {
  usesVerticalPhysics: boolean;
  mass?: number;
  friction?: number;
}

// Boss State
export type BossState = 'ENTERING' | 'IDLE' | 'ATTACK' | 'STUNNED' | 'DYING';

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  DYING = 'DYING',
  GAME_OVER = 'GAME_OVER',
  STAGE_TRANSITION = 'STAGE_TRANSITION',
  LEVEL_UP = 'LEVEL_UP',
  ARCHIVE = 'ARCHIVE',
  COSMETICS = 'COSMETICS',
  CONFIGURATION = 'CONFIGURATION',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT',
  RESUMING = 'RESUMING',
  READY = 'READY',
  CAMERA_EDIT = 'CAMERA_EDIT',
  VICTORY = 'VICTORY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  INSANE = 'INSANE'
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

export enum CameraMode {
  TOP_DOWN = 'TOP_DOWN',
  SIDE_SCROLL = 'SIDE_SCROLL'
}

export interface Point {
  x: number;
  y: number;
}

export interface WeaponStats {
  cannonLevel: number;
  cannonFireRate: number;
  cannonProjectileCount: number;
  cannonProjectileSpeed: number;
  cannonDamage: number;

  auraLevel: number;
  auraRadius: number;
  auraDamage: number;

  mineLevel: number;
  mineDropRate: number;
  mineDamage: number;
  mineRadius: number;

  chainLightningLevel: number;
  chainLightningDamage: number;
  chainLightningRange: number;

  nanoSwarmLevel: number;
  nanoSwarmCount: number;
  nanoSwarmDamage: number;

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

export interface Trait {
  name: string;
  type: string;
  description: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  tag: string;
  description: string;
  color: string;
  initialStats: {
    weapon: WeaponStats;
    shieldActive?: boolean;
  };
  traits: Trait[];
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

export type EnemyIntent =
  | 'IDLE'
  | 'ATTACKING'
  | 'REPOSITIONING'
  | 'VULNERABLE';

export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: EnemyType;
  state: 'SPAWNING' | 'ACTIVE' | 'ENTERING';
  spawnSide?: string;
  spawnTime: number;
  spawnTimer: number; // Added
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  speed: number;
  angle?: number;
  hitCooldowns?: Record<string, number>;
  stunTimer?: number;
  isGrounded: boolean;
  physicsProfile: PhysicsProfile;
  jumpCooldownTimer: number;
  jumpIntent: boolean;
  shouldRemove?: boolean;

  // AI
  aiState?: string;
  intent?: EnemyIntent; // Updated
  stateTimer?: number;
  attackTimer?: number;
  dashTimer?: number;
  dashAngle?: number;
  strafeDir?: number;
  targetPos?: { x: number; y: number };

  // Boss
  bossPhase?: number;
  dashState?: string;
  bossConfigId?: string;
  bossState?: BossState;
  facing?: number;
  summons?: number;
}

export interface BossEnemy extends Enemy {
  // Specific boss fields if needed
}

export interface FoodItem extends Point {
  id: string;
  type: FoodType;
  value?: number;
  createdAt: number;
  lifespan?: number;
  shouldRemove?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size: number;
  type: string;
  owner: 'PLAYER' | 'ENEMY';
  shouldRemove?: boolean;

  // Specifics
  piercing?: boolean;
  hitIds?: string[];
  age?: number;
  life?: number;
  homing?: boolean;
  targetId?: string;
  usesGravity?: boolean;
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
  color: string;
  life: number;
  shouldRemove?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  shouldRemove?: boolean;
  active: boolean; // Added for ObjectPool
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  vy: number;
  life: number;
  shouldRemove?: boolean;
}

export interface Mine {
  id: string;
  x: number;
  y: number;
  damage: number;
  radius: number;
  triggerRadius: number;
  createdAt: number;
  shouldRemove?: boolean;
}

export type TerminalType = 'RESOURCE' | 'MEMORY' | 'OVERRIDE' | 'CLEARANCE';

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

export interface DigitalRainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string;
  size: number;
  opacity: number;
}

export type AudioEvent = 'MOVE' | 'EAT' | 'XP_COLLECT' | 'SHOOT' | 'EMP' | 'HIT' | 'GAME_OVER' | 'LEVEL_UP' | 'BONUS' | 'POWER_UP' | 'SHIELD_HIT' | 'ENEMY_DESTROY' | 'COSMETIC_UNLOCK' | 'HACK_LOST' | 'HACK_COMPLETE' | 'ENEMY_SPAWN' | 'COMPRESS' | 'ARCHIVE_LOCK' | 'CLI_POWER' | 'CLI_BURST' | 'GLITCH_TEAR' | 'SYS_RECOVER' | 'UI_HARD_CLICK';

export interface AudioPlayData {
  level?: number;
  multiplier?: number;
  terminalType?: string;
  difficulty?: Difficulty; // Added
  combo?: number; // Added
}

export interface AudioRequest {
  type: AudioEvent;
  data?: AudioPlayData;
}

export type UpgradeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ULTRA_RARE' | 'MEGA_RARE' | 'LEGENDARY' | 'OVERCLOCKED';
export type UpgradeCategory = 'WEAPON' | 'DEFENSE' | 'UTILITY' | 'ECONOMY' | 'SYSTEM' | 'SCALAR' | 'HACKING';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  icon: string;
  color: string;
  stats?: string[];
}

export type ModalState = 'NONE' | 'PAUSE' | 'SETTINGS';
export type MobileControlScheme = 'JOYSTICK' | 'ARROWS' | 'SWIPE';

export interface Hitbox {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  color: string;
  shouldRemove?: boolean; // Added
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
  xpMultiplier: number;
  lootSpawnRate: number;
  lootMagnetMod: number;
  aiAggressionMod: number;
}

export interface StageTheme {
  background: string;
  grid: string;
  wall: string;
  obstacle?: string;
}

export type EnemyVisualMap = Map<string, {
  flash: number;
  x: number;
  y: number;
}>;
