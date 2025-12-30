
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_UP = 'LEVEL_UP',
  STAGE_TRANSITION = 'STAGE_TRANSITION',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  RESUMING = 'RESUMING',
  ARCHIVE = 'ARCHIVE',
  CONFIGURATION = 'CONFIGURATION',
  READY = 'READY'
}

export type ModalState = 'NONE' | 'PAUSE' | 'SETTINGS';

export interface DevBootstrapConfig {
  stageId: number;
  bossPhase?: number; // 1, 2, 3
  cameraMode?: CameraMode;
  cameraBehavior?: 'FOLLOW_PLAYER' | 'FIXED' | 'MANUAL'; // Added
  forceBoss?: boolean; // If true, spawns boss even if stage ID doesn't match default
  freeMovement?: boolean; // If true, disables gravity/jump restrictions in side-scroll
  disableWalls?: boolean; // If true, clears stage walls
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
  BOSS = 'BOSS',
  BARRIER = 'BARRIER' // New Entity
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
  luckLevel: number; // NEW
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
  luck: number; // NEW
  activeWeaponIds: string[];
  maxWeaponSlots: number;
  acquiredUpgradeIds: string[];
  // GLOBAL SCALARS
  globalDamageMod: number;
  globalFireRateMod: number;
  globalAreaMod: number;
  globalProjectileSpeedMod: number;
}

export interface CharacterTrait {
  name: string;
  description: string;
  type: 'SCALABLE' | 'STATIC';
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  traits: CharacterTrait[];
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

export type MobileControlScheme = 'JOYSTICK' | 'ARROWS' | 'SWIPE';

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

export interface EnemyPhysicsProfile {
  usesVerticalPhysics: boolean;
  canJump?: boolean;
  jumpCooldown?: number; // ms
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
  // Physics Properties
  vy: number;
  isGrounded: boolean;
  physicsProfile: EnemyPhysicsProfile;
  // Jump AI
  jumpCooldownTimer: number;
  jumpIntent: boolean;
  // Boss specific
  bossPhase?: number;
  attackTimer?: number;
  spawnTimer?: number;
  dashTimer?: number;
  dashState?: 'IDLE' | 'CHARGE' | 'DASH';
  targetPos?: Point;
  angle?: number;
  summons?: number;
  // New Boss System
  bossConfigId?: string;
  bossState?: {
      stateId: string;
      timer: number;
      phaseIndex: number;
  };
  facing?: number; // 1 (Right) or -1 (Left)
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
  age?: number; // New: Tracks frame lifespan for animations (Lance charging)
  usesGravity?: boolean; // NEW: Side-scroll physics
  shouldRemove?: boolean;
}

export interface Hitbox extends Point {
    id: string; // Unique ID (e.g. BOSS_ID + TAG)
    ownerId: string;
    width: number;
    height: number;
    damage: number;
    color: string;
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

export type TerminalType = 'RESOURCE' | 'CLEARANCE' | 'OVERRIDE' | 'MEMORY';

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
  isBeingHacked?: boolean; // NEW: Tracks active hacking state
  shouldRemove?: boolean;
  associatedFileId?: string; // For MEMORY terminals
}

export interface DigitalRainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string;
  size: number;
  opacity: number;
}

export interface CLIAnimation {
  id: string;
  x: number;
  y: number;
  type: TerminalType;
  phase: 1 | 2 | 3 | 4 | 5; // Extended phases
  timer: number;
  lines: string[];
  progress: number; // Keep for compatibility, though maybe unused
  color: string;
  shouldRemove?: boolean;
  data?: any; // For reward values, file titles, etc.
}

export type AudioEvent = 
  | 'MOVE' | 'EAT' | 'XP_COLLECT' | 'SHOOT' | 'EMP' | 'HIT' 
  | 'GAME_OVER' | 'LEVEL_UP' | 'BONUS' | 'POWER_UP' | 'SHIELD_HIT' 
  | 'ENEMY_DESTROY' | 'HACK_LOST' | 'HACK_COMPLETE' | 'ENEMY_SPAWN' | 'COMPRESS'
  | 'ARCHIVE_LOCK' | 'PLAY_MUSIC_INTRO'
  // CLI / INIT EVENTS
  | 'CLI_POWER' | 'CLI_BURST' | 'GLITCH_TEAR' | 'SYS_RECOVER' | 'UI_HARD_CLICK';

export type UpgradeCategory = 'WEAPON' | 'DEFENSE' | 'UTILITY' | 'SYSTEM' | 'HACKING' | 'MOBILITY' | 'THREAT' | 'ECONOMY' | 'REACTIVE' | 'SCALAR';
export type UpgradeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ULTRA_RARE' | 'MEGA_RARE' | 'LEGENDARY' | 'OVERCLOCKED';

export interface StatModifier {
  path: string; // e.g. "weapon.cannonDamage" or "critChance"
  value: number; // Delta value
  op: 'ADD' | 'MULTIPLY' | 'SET' | 'UNLOCK'; // Operation
  label: string; // Text description
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  color: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  icon: string;
  isNewWeapon?: boolean;
  stats: string[]; // For UI visualization
  modifiers: StatModifier[]; // For Logic application
}

export interface AudioRequest {
  type: AudioEvent;
  data?: any;
}
