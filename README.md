# **Neon Snake: Cyber Protocol**

![Version](https://img.shields.io/badge/version-1.0.0-cyan)
![Tech](https://img.shields.io/badge/built%20with-React%20%7C%20TypeScript%20%7C%20Vite-blue)

**Neon Snake: Cyber Protocol** is a high-fidelity, cyberpunk-themed evolution of the classic Snake game. It blends arcade reflexes with RPG progression, bullet-hell combat elements, and a reactive synthwave aesthetic.

Players control a cybernetic protocol designed to contain digital anomalies, hacking terminals, destroying drones, and evolving through distinct character classes and weapon upgrades.

---

## **Table of Contents**

1. [Game Overview](#overview)
2. [Key Features](#features)
3. [Classes & Protocols](#classes--protocols)
4. [Controls](#controls)
5. [Installation & Setup](#installation--setup)
6. [Game Mechanics](#game-mechanics)
7. [System Terminology](#system-terminology)
8. [License](#license)

---

## **Overview**

In **Neon Snake**, you are not just growing a snake; you are upgrading a combat unit. As you consume data (food), you gain XP to level up and install augmentations—from auto-cannons and lightning arcs to nano-swarms and plasma mines.

The game features a dynamic difficulty system, unlocking harder tiers like **Veteran** and **Cyberpsycho** as you prove your stability. Every 5 stages, you must confront a **Firewall Sentinel (Boss)** to proceed.

---

## **Features**

*   **6 Distinct Classes**: Choose your playstyle—from the heavy-hitting **Striker** to the loot-focused **Spectre**.
*   **RPG Progression**: Earn XP, level up, and draft from 3 random upgrades each level. Build your snake into a war machine.
*   **Active Combat**: Use your tail to whip enemies, fire automated projectiles, or trigger a massive **EMP System Shock**.
*   **Dynamic Enemies**: Face Hunters, Interceptors, Shooters, and Dashers, each with unique AI behaviors.
*   **Boss Battles**: Multi-phase boss fights with bullet-hell mechanics every 5 stages.
*   **Hacking Minigame**: Locate and orbit proximity terminals to hack them for massive rewards before they despawn.
*   **Reactive Audio/Visuals**: CRT scanlines, chromatic aberration, and a synthesized audio engine that requires no external assets.

---

## **Classes & Protocols**

Before starting a run, select a specialized protocol:

| Class | Role | Specialization |
| :--- | :--- | :--- |
| **STRIKER** | Heavy Gunner | Starts with high-level Auto-Cannons. High fire rate. |
| **SPECTRE** | Looter | Semi-transparent (harder to see, cooler to look at). Increased Magnet range and XP gain. |
| **VOLT** | Crowd Control | Attacks chain lightning between enemies. High chaos. |
| **RIGGER** | Tactician | Deploys stationary Mines and orbiting Nano Drones. |
| **BULWARK** | Tank | Starts with a Shield. Recharges EMP (System Shock) faster. |
| **OVERDRIVE** | Berserker | High score multiplier and damaging Tail Aura. High risk, high reward. |

---

## **Controls**

The game supports both Keyboard and Touch controls.

*   **Movement**: `Arrow Keys` or `W / A / S / D`
*   **System Shock (EMP)**: `Shift` (Clears screen of small enemies and projectiles)
*   **Pause**: `Spacebar` or `P`
*   **Select Upgrade**: `1`, `2`, or `3` (during Level Up screen)
*   **Confirm/Restart**: `Enter`

> **Mobile Note**: Touch controls appear automatically on smaller screens with a D-Pad and EMP button.

---

## **Installation & Setup**

This project is built with **Vite** and **React**.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/neon-snake.git
    cd neon-snake
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

---

## **Game Mechanics**

### **Food Types**
*   **Normal (Green)**: Standard XP and Score.
*   **Bonus (Gold)**: High XP/Score. Disappears quickly.
*   **Slow (Blue)**: Temporarily slows down time (Enemies move slower, Snake moves normally).
*   **Magnet (White)**: Attracts food from a distance.
*   **Compressor (Cyan)**: **Shrinks** your snake by removing tail segments. Vital for late-game survival.
*   **Poison (Purple)**: Damages score, reduces EMP charge, and removes tail segments. Avoid.

### **Weapons & Upgrades**
*   **Auto Cannon**: Fires projectiles at nearest enemies.
*   **Tail Aura**: Damages enemies that touch your body.
*   **Nano Swarm**: Orbiting drones that deal contact damage.
*   **Plasma Mines**: Drops explosive mines from your tail.
*   **Voltaic Arc**: Chance to chain lightning on hit.
*   **System Shock**: Increases the radius and damage of your EMP blast.

### **The Combo System**
Eating food quickly builds a **Combo Multiplier** (up to 8x). Keep the rhythm going to maximize your **Runtime Score**.

---

## **System Terminology**

The UI uses immersive terminology consistent with the lore:

*   **Runtime Score**: Your current score.
*   **Longest Stable Runtime**: High Score.
*   **System Shock**: Your EMP charge meter. Must be 100% to use.
*   **Containment Failure**: Game Over.
*   **Initiate Rollback**: Retry/Restart.
*   **Sector Decryption**: Stage Transition.

---

## **License**

This project is open-source and available under the MIT License.
