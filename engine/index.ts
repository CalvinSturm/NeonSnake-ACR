/**
 * Engine Module Index
 * Re-exports all engine components for clean imports
 */

// Core Loop
export { GameLoop, LegacyGameLoop } from './loop';
export type { SnapshotCallback, UpdateCallback, DrawCallback } from './loop';

// Message Protocol
export type {
    EngineCommand,
    EngineEvent,
    EngineInterface,
    SimulationConfig
} from './messages';
export { createInputCommand } from './messages';

// Simulation
export { SimulationWorld, getSimulationWorld, disposeSimulationWorld } from './simulation/SimulationWorld';
export type {
    WorldState,
    SimulationSnapshot,
    InputSnapshot,
    PlayerState,
    EntityState,
    SessionState,
    CameraState,
    SimulationEvent,
    GameOverStats
} from './simulation/types';
export {
    createEmptyInput,
    createDefaultPhysics,
    createEmptyEntities,
    createDefaultSession,
    createDefaultCamera,
    createDefaultConfig
} from './simulation/types';

// Physics
export { stepPhysics, applyPlayerJump } from './simulation/physics';

// Floor
export type { FloorVolume } from './simulation/floor';
export { getSupportingFloor, addFloorVolume, clearFloors } from './simulation/floor';

// Worker Engine
export { WorkerEngine, getWorkerEngine, disposeWorkerEngine } from './worker';

// Spatial Partitioning
export { SpatialGrid, createSpatialGrid } from './spatial';
export type { SpatialEntity } from './spatial';

// Object Pooling
export { ObjectPool, POOL_CONFIGS, acquireVec, releaseVec, generateId } from './pools';
export type { Poolable } from './pools';
