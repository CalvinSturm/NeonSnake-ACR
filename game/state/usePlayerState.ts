/**
 * usePlayerState - Player Snake State
 * Handles: snake, direction, stamina, physics, upgrades, power-ups
 */

import { useRef } from 'react';
import { Direction, UpgradeStats, CharacterProfile, Point, WeaponStats } from '../../types';
import { STAMINA_CONFIG } from '../../constants';
import { resolveTraits, TraitModifiers } from '../traitResolver';
import { PhysicsState } from '../physics/types';

export function usePlayerState() {
    // Snake body
    const snakeRef = useRef<Point[]>([]);
    const prevTailRef = useRef<Point | null>(null);
    const tailIntegrityRef = useRef(100);

    // Direction
    const directionRef = useRef<Direction>(Direction.RIGHT);
    const directionQueueRef = useRef<Direction[]>([]);

    // Traits (character modifiers)
    const traitsRef = useRef<TraitModifiers>(resolveTraits(null, 1));

    // Upgrade stats (defaults overwritten by resetPlayer)
    const statsRef = useRef<UpgradeStats>({
        weapon: {
            cannonLevel: 0, cannonFireRate: 500, cannonProjectileCount: 1, cannonProjectileSpeed: 15, cannonDamage: 20,
            auraLevel: 0, auraRadius: 0, auraDamage: 0,
            mineLevel: 0, mineDropRate: 0, mineDamage: 0, mineRadius: 0,
            chainLightningLevel: 0, chainLightningDamage: 0, chainLightningRange: 0,
            nanoSwarmLevel: 0, nanoSwarmCount: 0, nanoSwarmDamage: 0,
            prismLanceLevel: 0, prismLanceDamage: 0,
            neonScatterLevel: 0, neonScatterDamage: 0,
            voltSerpentLevel: 0, voltSerpentDamage: 0,
            phaseRailLevel: 0, phaseRailDamage: 0,
            reflectorMeshLevel: 0, ghostCoilLevel: 0, neuralMagnetLevel: 0,
            overclockLevel: 0, echoCacheLevel: 0, luckLevel: 0
        },
        slowDurationMod: 1,
        magnetRangeMod: 0,
        shieldActive: false,
        scoreMultiplier: 1,
        foodQualityMod: 1,
        critChance: 0.05,
        critMultiplier: 1.5,
        hackSpeedMod: 1,
        moveSpeedMod: 1,
        luck: 0,
        activeWeaponIds: [],
        maxWeaponSlots: 3,
        acquiredUpgradeIds: [],
        globalDamageMod: 1,
        globalFireRateMod: 1,
        globalAreaMod: 1,
        globalProjectileSpeedMod: 1
    });

    // Power-ups
    const powerUpsRef = useRef({ slowUntil: 0, magnetUntil: 0 });
    // Track last state to avoid redundant React updates
    const lastPowerUpStateRef = useRef({ slow: false, magnet: false });
    const ghostCoilCooldownRef = useRef(0);

    // Stamina / Time Stop
    const staminaRef = useRef(STAMINA_CONFIG.MAX);
    const stopIntentRef = useRef(false);
    const isStoppedRef = useRef(false);
    const stopCooldownRef = useRef(false);

    // Physics (jumping)
    const physicsRef = useRef<PhysicsState>({
        vy: 0,
        isGrounded: true
    });
    const jumpIntentRef = useRef(false);

    // Invulnerability
    const invulnerabilityTimeRef = useRef(0);

    // Level/XP
    const levelRef = useRef(1);
    const xpRef = useRef(0);
    const nextLevelXpRef = useRef(100);

    /** Reset player state for new game */
    const resetPlayer = (charProfile: CharacterProfile, startX: number, startY: number) => {
        // Traits at Level 1
        traitsRef.current = resolveTraits(charProfile, 1);

        // Snake start position
        snakeRef.current = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        prevTailRef.current = { x: startX - 3, y: startY };
        tailIntegrityRef.current = 100;

        directionRef.current = Direction.RIGHT;
        directionQueueRef.current = [];

        // Reset stats with EMPTY weapon base (character-specific weapons applied via Object.assign below)
        const baseStats: UpgradeStats = {
            weapon: {
                cannonLevel: 0, cannonFireRate: 500, cannonProjectileCount: 1, cannonProjectileSpeed: 15, cannonDamage: 20,
                auraLevel: 0, auraRadius: 0, auraDamage: 0,
                mineLevel: 0, mineDropRate: 0, mineDamage: 0, mineRadius: 0,
                chainLightningLevel: 0, chainLightningDamage: 0, chainLightningRange: 0,
                nanoSwarmLevel: 0, nanoSwarmCount: 0, nanoSwarmDamage: 0,
                prismLanceLevel: 0, prismLanceDamage: 0,
                neonScatterLevel: 0, neonScatterDamage: 0,
                voltSerpentLevel: 0, voltSerpentDamage: 0,
                phaseRailLevel: 0, phaseRailDamage: 0,
                reflectorMeshLevel: 0, ghostCoilLevel: 0, neuralMagnetLevel: 0,
                overclockLevel: 0, echoCacheLevel: 0, luckLevel: 0
            },
            slowDurationMod: 1,
            magnetRangeMod: 0,
            shieldActive: false,
            scoreMultiplier: 1,
            foodQualityMod: 1,
            critChance: 0.05,
            critMultiplier: 1.5,
            hackSpeedMod: 1,
            moveSpeedMod: 1,
            luck: 0,
            activeWeaponIds: [],
            maxWeaponSlots: 3,
            acquiredUpgradeIds: [],
            globalDamageMod: 1,
            globalFireRateMod: 1,
            globalAreaMod: 1,
            globalProjectileSpeedMod: 1
        };

        statsRef.current = baseStats;

        if (charProfile.initialStats) {
            Object.assign(statsRef.current, JSON.parse(JSON.stringify(charProfile.initialStats)));
        }

        // Collect initial weapons
        const w = statsRef.current.weapon;
        const initialWeapons: string[] = [];

        if (w.cannonLevel > 0) initialWeapons.push('CANNON');
        if (w.auraLevel > 0) initialWeapons.push('AURA');
        if (w.nanoSwarmLevel > 0) initialWeapons.push('NANO_SWARM');
        if (w.mineLevel > 0) initialWeapons.push('MINES');
        if (w.chainLightningLevel > 0) initialWeapons.push('LIGHTNING');
        if (w.prismLanceLevel > 0) initialWeapons.push('PRISM_LANCE');
        if (w.neonScatterLevel > 0) initialWeapons.push('NEON_SCATTER');
        if (w.voltSerpentLevel > 0) initialWeapons.push('VOLT_SERPENT');
        if (w.phaseRailLevel > 0) initialWeapons.push('PHASE_RAIL');

        statsRef.current.activeWeaponIds = initialWeapons.slice(0, statsRef.current.maxWeaponSlots);

        const uniqueAcquired = new Set<string>([...initialWeapons]);
        if (statsRef.current.shieldActive) uniqueAcquired.add('SHIELD');
        statsRef.current.acquiredUpgradeIds = [...uniqueAcquired];

        // Power-ups
        powerUpsRef.current = { slowUntil: 0, magnetUntil: 0 };
        ghostCoilCooldownRef.current = 0;

        // Stamina
        staminaRef.current = STAMINA_CONFIG.MAX;
        stopIntentRef.current = false;
        isStoppedRef.current = false;
        stopCooldownRef.current = false;

        // Physics
        physicsRef.current = { vy: 0, isGrounded: true };
        jumpIntentRef.current = false;

        // Invulnerability
        invulnerabilityTimeRef.current = 0;

        // Level
        levelRef.current = 1;
        xpRef.current = 0;
        nextLevelXpRef.current = 500;
    };

    /** Called on level-up to recalculate traits */
    const updateTraits = (charProfile: CharacterProfile, level: number) => {
        traitsRef.current = resolveTraits(charProfile, level);
    };

    return {
        // Snake
        snakeRef,
        prevTailRef,
        tailIntegrityRef,

        // Direction
        directionRef,
        directionQueueRef,

        // Traits
        traitsRef,

        // Stats
        statsRef,

        // Power-ups
        powerUpsRef,
        lastPowerUpStateRef,
        ghostCoilCooldownRef,

        // Stamina
        staminaRef,
        stopIntentRef,
        isStoppedRef,
        stopCooldownRef,

        // Physics
        physicsRef,
        jumpIntentRef,

        // Invulnerability
        invulnerabilityTimeRef,

        // Level
        levelRef,
        xpRef,
        nextLevelXpRef,

        // Methods
        resetPlayer,
        updateTraits
    };
}

export type PlayerState = ReturnType<typeof usePlayerState>;
