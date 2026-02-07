# Neon Snake: Cyber Protocol

A high-performance cyberpunk snake game built with **React**, **TypeScript**, **PixiJS**, and **Tauri**. Features a multi-threaded architecture with SharedArrayBuffer for zero-copy state transfer at 144Hz+.

![Cyberpunk Snake Game](https://img.shields.io/badge/status-active-00ff00?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![PixiJS](https://img.shields.io/badge/PixiJS-8-e72264?style=flat-square)

## ✨ Features

- **Multi-Threaded Simulation** — Game logic runs in a Web Worker at 60Hz, decoupled from rendering
- **Zero-Copy State Transfer** — SharedArrayBuffer + Atomics for lock-free communication between threads
- **144Hz Rendering** — Zero-allocation PixiJS renderer reads directly from TypedArrays
- **Tauri Desktop** — Native desktop builds with Rust backend
- **Cyberpunk Aesthetics** — Neon glow effects, procedural textures, and shader-based post-processing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                            │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │  React   │───▶│ SimulationBridge │───▶│ PixiJS       │   │
│  │  UI      │    │ (zero-copy read) │    │ Renderer     │   │
│  └──────────┘    └────────┬─────────┘    └──────────────┘   │
│                           │                                  │
│                  SharedArrayBuffer                           │
│              ┌────────────┴────────────┐                     │
│              │ • Snapshot Buffers (x2) │                     │
│              │ • Input Ring Buffer     │                     │
│              │ • Control Flags         │                     │
│              └────────────┬────────────┘                     │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      Worker Thread                          │
│              ┌────────────┴────────────┐                    │
│              │   SimulationWorld       │                    │
│              │   (60Hz fixed timestep) │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Web (Development)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — COOP/COEP headers are configured for SharedArrayBuffer.

### Tauri Desktop

```bash
# Install Rust first: https://rustup.rs
npm install @tauri-apps/cli
npx tauri dev
```

## 📁 Project Structure

```
├── engine/
│   ├── shared/           # SharedArrayBuffer infrastructure
│   │   ├── BinarySnapshot.ts   # ~56KB binary memory layout
│   │   └── InputRing.ts        # Lock-free SPSC ring buffer
│   ├── workers/
│   │   └── sim.worker.ts       # 144Hz simulation worker
│   ├── simulation/
│   │   └── SimulationWorld.ts  # Deterministic game logic
│   └── SimulationBridge.ts     # Main-thread adapter
├── graphics/
│   ├── BinarySnapshotRenderer.ts  # Zero-allocation PixiJS
│   ├── renderers/            # Entity-specific renderers
│   └── shaders/              # WebGL post-processing
├── game/
│   ├── useSimulationBridge.ts    # React hook
│   └── rendering/            # Render pass orchestration
├── ui/
│   └── hud/                  # HUD components & layouts
├── src-tauri/                # Tauri desktop configuration
└── types.ts                  # Shared type definitions
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move Up |
| `S` / `↓` | Move Down |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `Space` | Jump |
| `Shift` | Brake |
| `Esc` | Pause |

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npx tauri dev` | Run Tauri desktop in dev mode |
| `npx tauri build` | Build native desktop executable |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript 5.4
- **Rendering**: PixiJS 8 (WebGL), Canvas 2D fallback
- **Threading**: Web Workers, SharedArrayBuffer, Atomics
- **Desktop**: Tauri 1.6 (Rust backend)
- **Build**: Vite 5.2
- **Styling**: TailwindCSS 3.4

## 📊 Performance

| Metric | Target | Method |
|--------|--------|--------|
| Simulation | 60 Hz | Fixed timestep in Worker |
| Rendering | 144+ Hz | RAF with zero-allocation reads |
| State Transfer | ~0ms | SharedArrayBuffer (no postMessage) |
| GC Pressure | Minimal | Object pooling + TypedArrays |

---

*Built for high-performance gaming on the modern web.*
