/**
 * Worker Module Index
 * Re-exports Worker-related components
 */

export { WorkerEngine, getWorkerEngine, disposeWorkerEngine } from './WorkerEngine';

// Note: simulation.worker.ts is not exported directly
// It's loaded via the Worker constructor with import.meta.url
