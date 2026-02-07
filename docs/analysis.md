# Phase 0: Codebase Discovery & Analysis

## 1. Inventory

### Rendering
- **API**: Canvas 2D (`CanvasRenderingContext2D` with `alpha: false`).
- **Location**: `game/useRendering.ts` -> `game/rendering/renderFrame.ts`.
- **Structure**: Immediate mode rendering. Clears screen and draws all entities every frame.

### Game Loop
- **Location**: `game/useGameLoop.ts`.
- **Method**: `requestAnimationFrame` with a fixed timestep accumulator (`FIXED_DT = 16.66ms`).
- **Scheduling**: The loop drives `update()` (simulation) and `draw()` (interpolation).
- **Coupling**: loop logic is inside a custom React Hook (`useGameLoop`), making it tightly coupled to the component lifecycle.

### Entity Representation
- **Storage**: Arrays of objects using `useRef` hooks (e.g., `useRef<Enemy[]>`).
- **Management**: A centralized facade `useEntityState.ts` holds references to all entity arrays (Enemies, Projectiles, Particles, etc.).
- **Allocation**:
  - Entities appear to be dynamically allocated (`new Enemy()`, object literals) and pushed to arrays.
  - Arrays are likely mutated (splice/filter) for removal, which is $O(N)$ and generates GC garbage.

### Threading
- **Current Model**: 100% Main Thread (Single Threaded).
- **Contention**: Input, Game Logic (Physics/Collision), Rendering, and React UI updates all compete for the same 16ms frame budget.

## 2. Risk Identification

### 🔴 Critical Risks (Must Fix)
1.  **Main Thread Blocking**: As entity counts rise (Scaling scaling), `useCollisions` and `useMovement` will choke the main thread, causing UI freezes and input lag.
2.  **Draw Call Overhead**: Canvas 2D acts as a bottleneck. Drawing thousands of particles or enemies individually is CPU-bound.
3.  **Garbage Collection (GC)**: Frequent creation/destruction of short-lived objects (Projectiles, Particles) causes "Stop-the-World" GC pauses.

### 🟡 Architecture Risks (Should Fix)
1.  **React Coupling**: Game logic is inside React Hooks. This makes it hard to run the game in a Web Worker (which cannot use React hooks).
2.  **Object Arrays**: Iterating over scattered objects in memory causes CPU cache misses compared to Typed Arrays (SoA).

## 3. Migration Plan (Executive Summary)

We will proceed with the proposed 6-Phase approach.

- **Phase 1 (Boundaries)**: Decouple the Game Loop from React Hooks so it can eventually run independently.
- **Phase 2 (Worker)**: Move the heavy simulation (Physics/Collision) to a Web Worker to free up the UI thread.
- **Phase 3 (Data)**: Switch to Object Pooling and potentially Typed Arrays for hot-path entities to fix GC stutters.
- **Phase 4 (WebGL)**: Replace Canvas 2D with a batched WebGL renderer to handle 10k+ sprites.

---

**Next Step**: Proceed to **Phase 1: Architectural Boundaries**.
We will extract the "Game Loop" into a standalone Class/Module that interacts with React only via message passing, preparing it for the Worker migration.
