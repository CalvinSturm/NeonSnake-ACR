# NeonSnake-ACR

**NeonSnake-ACR** is a high-performance, browser-based arcade game built with **React**, **TypeScript**, and **Vite**. It features a retro aesthetic with modern rendering techniques, currently undergoing a significant architectural evolution to support high entity counts and smooth framerates.

## 🚀 Key Features

* **Fast-Paced Gameplay**: Arcade-style action with responsive controls.
* **Retro Aesthetics**: Immersive visuals powered by custom layouts and rendering.
* **Modern Tech Stack**: Built on the latest web technologies for performance and maintainability.
* **Active Performance Engineering**: Currently migrating from Canvas 2D to a **WebGL** based renderer and **Web Worker** driven simulation to ensure 60FPS+ performance under heavy load.

## 🛠️ Technology Stack

* **Core**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [TailwindCSS](https://tailwindcss.com/)
* **Rendering**: Custom Canvas 2D / WebGL (Migration in progress)
* **State Management**: React Hooks & Custom Game Loop Architecture

## 📦 Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or yarn

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/CalvinSturm/NeonSnake-ACR.git
    cd NeonSnake-ACR
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📂 Project Structure

* **`game/`**: Core game logic including state management, custom hooks, and entity definitions (Enemies, Projectiles).
* **`engine/`**: Low-level engine components, including the main game loop and update schedulers.
* **`graphics/`**: Rendering systems. Contains the logic for drawing frames, managing sprites, and the transition to WebGL.
* **`ui/`**: React components for the HUD, menus, and overlay layouts (e.g., `Retro6Layout`).
* **`docs/`**: Architecture documentation and analysis reports.

## 🚧 Development Status & Roadmap

The project is currently in an active refactoring phase to address performance bottlenecks:

* **Phase 1**: Decoupling Game Loop from React (In Progress)
* **Phase 2**: Offloading Simulation to Web Workers
* **Phase 3**: Memory Optimization (Object Pooling)
* **Phase 4**: WebGL Rendering Integration

See `docs/analysis.md` for a detailed technical breakdown.

## 📜 Scripts

* `npm run dev`: Starts the local development server.
* `npm run build`: Type-checks and builds the project for production.
* `npm run preview`: Locally preview the production build.

---
*Built with passion for retro gaming and modern engineering.*
