/**
 * useEntityState - World Entities State
 * Handles: enemies, food, terminals, projectiles, mines, hitboxes, VFX
 */

import { useRef } from 'react';
import {
    Enemy, FoodItem, Projectile, Shockwave, LightningArc,
    Particle, FloatingText, Mine, Terminal, DigitalRainDrop, Point, Hitbox,
    EnemyVisualMap
} from '../../types';

export function useEntityState() {
    // Core entities
    const enemiesRef = useRef<Enemy[]>([]);
    const enemyVisualsRef = useRef<EnemyVisualMap>(new Map()); // Visual state (presentation layer)
    const foodRef = useRef<FoodItem[]>([]);
    const wallsRef = useRef<Point[]>([]);
    const terminalsRef = useRef<Terminal[]>([]);

    // Combat entities
    const projectilesRef = useRef<Projectile[]>([]);
    const minesRef = useRef<Mine[]>([]);
    const hitboxesRef = useRef<Hitbox[]>([]);

    // VFX entities
    const shockwavesRef = useRef<Shockwave[]>([]);
    const lightningArcsRef = useRef<LightningArc[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const digitalRainRef = useRef<DigitalRainDrop[]>([]);
    const chromaticAberrationRef = useRef(0);

    // Boss tracking
    const bossEnemyRef = useRef<Enemy | null>(null);
    const bossActiveRef = useRef(false);
    const bossDefeatedRef = useRef(false);

    // Spawn timers
    const enemySpawnTimerRef = useRef(0);
    const terminalSpawnTimerRef = useRef(0);

    /** Clear all entities for new game */
    const resetEntities = () => {
        enemiesRef.current = [];
        enemyVisualsRef.current.clear();
        foodRef.current = [];
        wallsRef.current = [];
        terminalsRef.current = [];
        projectilesRef.current = [];
        minesRef.current = [];
        hitboxesRef.current = [];
        shockwavesRef.current = [];
        lightningArcsRef.current = [];
        particlesRef.current = [];
        floatingTextsRef.current = [];
        digitalRainRef.current = [];

        bossEnemyRef.current = null;
        bossActiveRef.current = false;
        bossDefeatedRef.current = false;

        enemySpawnTimerRef.current = 0;
        terminalSpawnTimerRef.current = 0;
    };

    return {
        // Core entities
        enemiesRef,
        enemyVisualsRef,
        foodRef,
        wallsRef,
        terminalsRef,

        // Combat
        projectilesRef,
        minesRef,
        hitboxesRef,

        // VFX
        shockwavesRef,
        lightningArcsRef,
        particlesRef,
        floatingTextsRef,
        digitalRainRef,
        chromaticAberrationRef,

        // Boss
        bossEnemyRef,
        bossActiveRef,
        bossDefeatedRef,

        // Spawn timers
        enemySpawnTimerRef,
        terminalSpawnTimerRef,

        // Methods
        resetEntities
    };
}

export type EntityState = ReturnType<typeof useEntityState>;
