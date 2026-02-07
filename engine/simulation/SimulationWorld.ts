/**
 * SimulationWorld
 * 
 * Single source of truth for all simulation state.
 * Deterministic given (state, input, dt).
 * Worker-ready: No React, no DOM, no function closures.
 * 
 * Lifecycle: init() -> reset() -> step()* -> dispose()
 */

import {
    WorldState,
    SimulationSnapshot,
    SimulationConfig,
    SimulationEvent,
    InputSnapshot,
    PlayerState,
    EntityState,
    SessionState,
    CameraState,
    createEmptyInput,
    createDefaultPhysics,
    createEmptyEntities,
    createDefaultSession,
    createDefaultCamera,
    createDefaultConfig,
    GameOverStats
} from './types';

import { stepPhysics, applyPlayerJump } from './physics';
import { FloorVolume, getSupportingFloor } from './floor';

import {
    Direction,
    GameStatus,
    CharacterProfile,
    CameraMode,
    WeaponStats,
    UpgradeStats
} from '../../types';

import {
    DEFAULT_SETTINGS,
    STAMINA_CONFIG,
    XP_TO_LEVEL_UP,
    CHARACTERS
} from '../../constants';

// ═══════════════════════════════════════════════════════════════
// SIMULATION WORLD CLASS
// ═══════════════════════════════════════════════════════════════

export class SimulationWorld {
    private state: WorldState | null = null;
    private config: SimulationConfig = createDefaultConfig();
    private floors: FloorVolume[] = [];
    private eventQueue: SimulationEvent[] = [];
    private initialized = false;

    // ─────────────────────────────────────────────────────────────
    // LIFECYCLE METHODS
    // ─────────────────────────────────────────────────────────────

    /**
     * Initialize the simulation with configuration.
     * Must be called before reset().
     */
    init(config: SimulationConfig): void {
        this.config = { ...config };
        this.floors = [];
        this.eventQueue = [];
        this.initialized = true;
    }

    /**
     * Reset the simulation for a new game.
     * @param profile - Character profile to use
     */
    reset(profile: CharacterProfile): void {
        if (!this.initialized) {
            throw new Error('SimulationWorld.init() must be called before reset()');
        }

        const startX = 10;
        const startY = 10;

        // Create initial player state
        const player = this.createPlayerState(profile, startX, startY);

        // Create initial world state
        this.state = {
            gameTime: 0,
            status: GameStatus.PLAYING,
            modalState: 'NONE',

            player,
            entities: createEmptyEntities(),
            session: {
                ...createDefaultSession(),
                difficulty: this.config.difficulty,
                runId: Date.now() // Using timestamp as unique run ID
            },
            camera: {
                ...createDefaultCamera(),
                x: startX,
                y: startY,
                targetX: startX,
                targetY: startY,
                mode: this.config.cameraMode
            },

            pendingStatus: null,
            deathTimer: 0,
            transitionStartTime: 0,
            stageArmed: false,
            stageReady: false,
            stageReadyTime: 0,

            // Weapon cooldowns
            cannonCooldown: 0,
            mineCooldown: 0,
            auraCooldown: 0,
            chainLightningCooldown: 0
        };

        this.floors = [];
        this.eventQueue = [];
    }

    /**
     * Step the simulation forward by dt milliseconds.
     * This is the main simulation tick.
     */
    step(dt: number, input: InputSnapshot | null): void {
        if (!this.state) {
            throw new Error('SimulationWorld.reset() must be called before step()');
        }

        // Clear event queue for this frame
        this.eventQueue = [];

        // Apply input
        const currentInput = input ?? createEmptyInput();
        this.processInput(currentInput);

        // Simulation gate: only update when playing
        if (this.state.status === GameStatus.PLAYING && this.state.modalState === 'NONE') {
            this.state.gameTime += dt;

            // Physics step
            stepPhysics(
                this.state,
                dt,
                (x, y) => getSupportingFloor(this.floors, x, y)
            );

            // Movement step (TODO: extract from useMovement)
            this.stepMovement(dt, currentInput);

            // Combat step (TODO: extract from useCombat)
            this.stepCombat(dt);

            // Spawner step (TODO: extract from useSpawner)
            this.stepSpawner(dt);

            // Collision step (TODO: extract from useCollisions)
            this.stepCollisions();

            // Progression check (TODO: extract from useProgression)
            this.checkProgression();

            // Weapon cooldowns
            this.updateCooldowns(dt);

        } else if (this.state.status === GameStatus.STAGE_TRANSITION) {
            this.state.gameTime += dt;
            // Handle transition logic
            this.stepTransition(dt);

        } else if (this.state.status === GameStatus.DYING) {
            this.state.gameTime += dt;
            this.state.deathTimer += dt;
            // Death animation timeout
            if (this.state.deathTimer > 2000) {
                this.state.status = GameStatus.GAME_OVER;
                this.emitEvent('PLAYER_DIED');
            }

        } else if (this.state.status === GameStatus.CAMERA_EDIT) {
            // Camera edit mode - no simulation updates
        }

        // Camera update (always runs)
        this.updateCamera(dt);
    }

    /**
     * Get a read-only snapshot of the current state.
     * Safe for structured clone (Worker postMessage).
     */
    getSnapshot(): SimulationSnapshot {
        if (!this.state) {
            throw new Error('SimulationWorld.reset() must be called before getSnapshot()');
        }

        // Return a frozen snapshot
        return {
            gameTime: this.state.gameTime,
            status: this.state.status,
            modalState: this.state.modalState,
            player: { ...this.state.player },
            entities: { ...this.state.entities },
            session: { ...this.state.session },
            camera: { ...this.state.camera },
            events: [...this.eventQueue]
        };
    }

    /**
     * Get game over stats for the end screen.
     */
    getGameOverStats(): GameOverStats {
        if (!this.state) {
            throw new Error('No state available');
        }

        return {
            finalScore: this.state.session.score,
            stage: this.state.session.stage,
            maxCombo: this.state.session.maxCombo,
            enemiesKilled: this.state.session.enemiesKilled,
            terminalsHacked: this.state.session.terminalsHacked,
            survivalTime: this.state.gameTime,
            level: this.state.player.level,
            cause: 'COLLISION' // TODO: track actual cause
        };
    }

    /**
     * Dispose of the simulation and release resources.
     */
    dispose(): void {
        this.state = null;
        this.floors = [];
        this.eventQueue = [];
        this.initialized = false;
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC COMMANDS (called from main thread)
    // ─────────────────────────────────────────────────────────────

    pause(): void {
        if (this.state && this.state.status === GameStatus.PLAYING) {
            this.state.status = GameStatus.PAUSED;
        }
    }

    resume(): void {
        if (this.state && this.state.status === GameStatus.PAUSED) {
            this.state.status = GameStatus.RESUMING;
        }
    }

    setModalState(modal: 'NONE' | 'PAUSE' | 'SETTINGS'): void {
        if (this.state) {
            this.state.modalState = modal;
        }
    }

    addFloor(floor: FloorVolume): void {
        this.floors.push(floor);
    }

    clearFloors(): void {
        this.floors = [];
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private createPlayerState(
        profile: CharacterProfile,
        startX: number,
        startY: number
    ): PlayerState {
        const weapon = { ...profile.initialStats.weapon };

        const stats: UpgradeStats = {
            weapon,
            slowDurationMod: 0,
            magnetRangeMod: 0,
            shieldActive: profile.initialStats.shieldActive ?? false,
            scoreMultiplier: 1,
            foodQualityMod: 0,
            critChance: 0.05,
            critMultiplier: 1.5,
            hackSpeedMod: 0,
            moveSpeedMod: 0,
            luck: 0,
            activeWeaponIds: this.getActiveWeaponIds(weapon),
            maxWeaponSlots: 8,
            acquiredUpgradeIds: [],
            globalDamageMod: 0,
            globalFireRateMod: 0,
            globalAreaMod: 0,
            globalProjectileSpeedMod: 0
        };

        return {
            segments: [{ x: startX, y: startY }],
            direction: Direction.RIGHT,
            pendingDirection: null,
            speed: DEFAULT_SETTINGS.initialSpeed,
            moveTimer: 0,
            physics: createDefaultPhysics(),
            stats,
            stamina: STAMINA_CONFIG.MAX,
            maxStamina: STAMINA_CONFIG.MAX,
            tailIntegrity: 100,
            invincibleTimer: 0,
            level: 1,
            xp: 0,
            xpToNext: XP_TO_LEVEL_UP
        };
    }

    private getActiveWeaponIds(weapon: WeaponStats): string[] {
        const ids: string[] = [];
        if (weapon.cannonLevel > 0) ids.push('cannon');
        if (weapon.auraLevel > 0) ids.push('aura');
        if (weapon.mineLevel > 0) ids.push('mines');
        if (weapon.chainLightningLevel > 0) ids.push('chainLightning');
        if (weapon.nanoSwarmLevel > 0) ids.push('nanoSwarm');
        if (weapon.prismLanceLevel > 0) ids.push('prismLance');
        if (weapon.neonScatterLevel > 0) ids.push('neonScatter');
        if (weapon.voltSerpentLevel > 0) ids.push('voltSerpent');
        if (weapon.phaseRailLevel > 0) ids.push('phaseRail');
        return ids;
    }

    private processInput(input: InputSnapshot): void {
        if (!this.state) return;

        // Direction change
        if (input.direction !== null) {
            this.state.player.pendingDirection = input.direction;
        }

        // Jump intent
        if (input.jumpIntent) {
            applyPlayerJump(this.state);
        }

        // Brake/slow
        this.state.player.physics.isBraking = input.brakeIntent;
    }

    private emitEvent(type: SimulationEvent['type'], data?: Record<string, unknown>): void {
        this.eventQueue.push({ type, data });
    }

    // ─────────────────────────────────────────────────────────────
    // STUB METHODS (to be extracted from hooks)
    // ─────────────────────────────────────────────────────────────

    private stepMovement(dt: number, input: InputSnapshot): void {
        // TODO: Extract from useMovement
        // For now, basic movement timer
        if (!this.state) return;

        const player = this.state.player;
        player.moveTimer += dt;

        // Apply pending direction
        if (player.pendingDirection !== null) {
            // Validate direction change (no 180s)
            const opposite: Record<Direction, Direction> = {
                [Direction.UP]: Direction.DOWN,
                [Direction.DOWN]: Direction.UP,
                [Direction.LEFT]: Direction.RIGHT,
                [Direction.RIGHT]: Direction.LEFT
            };

            if (player.pendingDirection !== opposite[player.direction]) {
                player.direction = player.pendingDirection;
            }
            player.pendingDirection = null;
        }

        // Move if timer elapsed
        const speedMod = player.physics.isBraking ? 2.0 : 1.0; // Slower when braking
        if (player.moveTimer >= player.speed * speedMod) {
            player.moveTimer = 0;

            const head = player.segments[0];
            if (head) {
                let newX = head.x;
                let newY = head.y;

                switch (player.direction) {
                    case Direction.UP: newY -= 1; break;
                    case Direction.DOWN: newY += 1; break;
                    case Direction.LEFT: newX -= 1; break;
                    case Direction.RIGHT: newX += 1; break;
                }

                // Add new head, remove tail (no growth for now)
                player.segments.unshift({ x: newX, y: newY });
                player.segments.pop();
            }
        }
    }

    private stepCombat(dt: number): void {
        // TODO: Extract from useCombat
        // Placeholder: update weapon cooldowns handled in updateCooldowns
    }

    private stepSpawner(dt: number): void {
        // TODO: Extract from useSpawner
        // Placeholder: spawn timers
        if (!this.state) return;

        this.state.entities.enemySpawnTimer += dt;
        this.state.entities.terminalSpawnTimer += dt;
    }

    private stepCollisions(): void {
        // TODO: Extract from useCollisions
        // Placeholder: basic collision detection
    }

    private checkProgression(): void {
        // TODO: Extract from useProgression
        // Placeholder: stage/level checks
    }

    private updateCooldowns(dt: number): void {
        if (!this.state) return;

        this.state.cannonCooldown = Math.max(0, this.state.cannonCooldown - dt);
        this.state.mineCooldown = Math.max(0, this.state.mineCooldown - dt);
        this.state.auraCooldown = Math.max(0, this.state.auraCooldown - dt);
        this.state.chainLightningCooldown = Math.max(0, this.state.chainLightningCooldown - dt);
    }

    private stepTransition(dt: number): void {
        // TODO: Handle stage transition animation
        if (!this.state) return;

        this.state.transitionStartTime += dt;
        // After transition duration, go back to PLAYING
        if (this.state.transitionStartTime > 2000) {
            this.state.status = GameStatus.PLAYING;
            this.state.transitionStartTime = 0;
        }
    }

    private updateCamera(dt: number): void {
        // TODO: Extract from useCameraController
        // Placeholder: follow player head
        if (!this.state) return;

        const head = this.state.player.segments[0];
        if (head) {
            this.state.camera.targetX = head.x;
            this.state.camera.targetY = head.y;

            // Smooth follow
            const lerp = 0.1;
            this.state.camera.x += (this.state.camera.targetX - this.state.camera.x) * lerp;
            this.state.camera.y += (this.state.camera.targetY - this.state.camera.y) * lerp;
        }

        // Decay shake
        this.state.camera.shake = Math.max(0, this.state.camera.shake - dt * 0.05);
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON FACTORY (for main thread usage)
// ═══════════════════════════════════════════════════════════════

let worldInstance: SimulationWorld | null = null;

export function getSimulationWorld(): SimulationWorld {
    if (!worldInstance) {
        worldInstance = new SimulationWorld();
    }
    return worldInstance;
}

export function disposeSimulationWorld(): void {
    if (worldInstance) {
        worldInstance.dispose();
        worldInstance = null;
    }
}
