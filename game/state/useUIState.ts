/**
 * useUIState - HUD/Display State
 * 
 * ARCHITECTURE: High-frequency data uses refs with throttled sync to React state.
 * This prevents React re-renders at 60fps during gameplay.
 * 
 * - Refs: Updated by simulation at frame rate
 * - State: Synced at 10Hz for HUD consumption
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { UpgradeOption, UpgradeStats } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLS, GRID_ROWS } from '../../constants';

// Throttle interval for syncing refs to React state (100ms = 10Hz)
const UI_SYNC_INTERVAL_MS = 100;

export interface UiStats {
    globalDamage: number;
    globalFireRate: number;
    globalArea: number;
    critChance: number;
    critMultiplier: number;
    projectileSpeed: number;
    moveSpeed: number;
    activeWeapons: string[];
    maxWeaponSlots: number;
    weaponLevels: Record<string, number>;
    tailIntegrity: number;
}

export interface ViewportState {
    width: number;
    height: number;
    cols: number;
    rows: number;
}

export interface XpValues {
    current: number;
    max: number;
}

export function useUIState() {
    // ═══════════════════════════════════════════════════════════
    // HIGH-FREQUENCY REFS (updated at frame rate by simulation)
    // ═══════════════════════════════════════════════════════════

    const uiScoreRef = useRef(0);
    const uiComboRef = useRef(0);
    const uiXpRef = useRef(0);
    const uiXpValuesRef = useRef<XpValues>({ current: 0, max: 100 });

    // ═══════════════════════════════════════════════════════════
    // REACT STATE (synced at 10Hz for HUD rendering)
    // ═══════════════════════════════════════════════════════════

    // Viewport (rarely changes)
    const [viewport, setViewport] = useState<ViewportState>({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        cols: GRID_COLS,
        rows: GRID_ROWS
    });

    // High-frequency display state (synced from refs)
    const [uiScore, setUiScore] = useState(0);
    const [uiCombo, setUiCombo] = useState(0);
    const [uiXp, setUiXp] = useState(0);
    const [uiXpValues, setUiXpValues] = useState<XpValues>({ current: 0, max: 100 });

    // Low-frequency state (direct useState is fine)
    const [uiLevel, setUiLevel] = useState(1);
    const [uiStage, setUiStage] = useState(1);
    const [highScore, setHighScore] = useState(0);
    const [uiShield, setUiShield] = useState(false);
    const [bossActive, setBossActive] = useState(false);
    const [uiStageStatus, setUiStageStatus] = useState<string>('');
    const [activePowerUps, setActivePowerUps] = useState({ slow: false, magnet: false });
    const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

    // Stats display (synced on demand, not every frame)
    const [uiStats, setUiStats] = useState<UiStats>({
        globalDamage: 1,
        globalFireRate: 1,
        globalArea: 1,
        critChance: 0.05,
        critMultiplier: 1.5,
        projectileSpeed: 1,
        moveSpeed: 1,
        activeWeapons: [],
        maxWeaponSlots: 3,
        weaponLevels: {},
        tailIntegrity: 100
    });

    // ═══════════════════════════════════════════════════════════
    // THROTTLED SYNC EFFECT (10Hz)
    // ═══════════════════════════════════════════════════════════

    useEffect(() => {
        const syncId = setInterval(() => {
            // Only update React state if values actually changed
            setUiScore(prev => {
                const next = uiScoreRef.current;
                return prev !== next ? next : prev;
            });
            setUiCombo(prev => {
                const next = uiComboRef.current;
                return prev !== next ? next : prev;
            });
            setUiXp(prev => {
                const next = uiXpRef.current;
                return prev !== next ? next : prev;
            });
            setUiXpValues(prev => {
                const next = uiXpValuesRef.current;
                if (prev.current !== next.current || prev.max !== next.max) {
                    return { ...next };
                }
                return prev;
            });
        }, UI_SYNC_INTERVAL_MS);

        return () => clearInterval(syncId);
    }, []);

    // ═══════════════════════════════════════════════════════════
    // REF MUTATION FUNCTIONS (for simulation to call)
    // ═══════════════════════════════════════════════════════════

    /** Update score ref (called at frame rate) */
    const updateScoreRef = useCallback((value: number) => {
        uiScoreRef.current = value;
    }, []);

    /** Update combo ref (called on eat/decay) */
    const updateComboRef = useCallback((value: number) => {
        uiComboRef.current = value;
    }, []);

    /** Increment combo ref */
    const incrementComboRef = useCallback(() => {
        uiComboRef.current += 1;
    }, []);

    /** Update XP refs (called on XP gain) */
    const updateXpRefs = useCallback((xpPercent: number, current: number, max: number) => {
        uiXpRef.current = xpPercent;
        uiXpValuesRef.current = { current, max };
    }, []);

    /** Sync UI stats from statsRef and tailIntegrityRef - caller provides values */
    const syncUiStats = useCallback((
        statsRefCurrent: UpgradeStats,
        tailIntegrity: number
    ) => {
        const s = statsRefCurrent;
        const w = s.weapon;

        setUiStats({
            globalDamage: s.globalDamageMod,
            globalFireRate: s.globalFireRateMod,
            globalArea: s.globalAreaMod,
            critChance: s.critChance,
            critMultiplier: s.critMultiplier,
            projectileSpeed: s.globalProjectileSpeedMod,
            moveSpeed: s.moveSpeedMod,
            activeWeapons: [...s.activeWeaponIds],
            maxWeaponSlots: s.maxWeaponSlots,
            weaponLevels: {
                'CANNON': w.cannonLevel,
                'AURA': w.auraLevel,
                'MINES': w.mineLevel,
                'LIGHTNING': w.chainLightningLevel,
                'NANO_SWARM': w.nanoSwarmLevel,
                'PRISM_LANCE': w.prismLanceLevel,
                'NEON_SCATTER': w.neonScatterLevel,
                'VOLT_SERPENT': w.voltSerpentLevel,
                'PHASE_RAIL': w.phaseRailLevel,
                'REFLECTOR_MESH': w.reflectorMeshLevel,
                'GHOST_COIL': w.ghostCoilLevel,
                'NEURAL_MAGNET': w.neuralMagnetLevel,
                'OVERCLOCK': w.overclockLevel,
                'ECHO_CACHE': w.echoCacheLevel,
                'LUCK': w.luckLevel
            },
            tailIntegrity
        });
    }, []);

    /** Reset UI state for new game */
    const resetUI = useCallback((shieldActive: boolean) => {
        // Reset refs
        uiScoreRef.current = 0;
        uiComboRef.current = 0;
        uiXpRef.current = 0;
        uiXpValuesRef.current = { current: 0, max: 500 };

        // Reset state
        setUiScore(0);
        setUiCombo(0);
        setUiXp(0);
        setUiXpValues({ current: 0, max: 500 });
        setUiLevel(1);
        setUiStage(1);
        setUiShield(shieldActive);
        setBossActive(false);
        setUiStageStatus('');
        setUpgradeOptions([]);
        setActivePowerUps({ slow: false, magnet: false });
    }, []);

    /** Force immediate sync (for critical moments like level-up) */
    const forceSync = useCallback(() => {
        setUiScore(uiScoreRef.current);
        setUiCombo(uiComboRef.current);
        setUiXp(uiXpRef.current);
        setUiXpValues({ ...uiXpValuesRef.current });
    }, []);

    return {
        // Viewport
        viewport, setViewport,

        // High-frequency refs (for simulation)
        uiScoreRef,
        uiComboRef,
        uiXpRef,
        uiXpValuesRef,

        // Ref mutation functions
        updateScoreRef,
        updateComboRef,
        incrementComboRef,
        updateXpRefs,
        forceSync,

        // React state (for HUD rendering)
        uiScore, setUiScore,
        uiXp, setUiXp,
        uiXpValues, setUiXpValues,
        uiLevel, setUiLevel,
        uiStage, setUiStage,
        highScore, setHighScore,

        // Combat display
        uiCombo, setUiCombo,
        uiShield, setUiShield,
        bossActive, setBossActive,

        // Stage
        uiStageStatus, setUiStageStatus,

        // Power-ups
        activePowerUps, setActivePowerUps,

        // Upgrades
        upgradeOptions, setUpgradeOptions,

        // Stats
        uiStats, syncUiStats,

        // Methods
        resetUI
    };
}

export type UIState = ReturnType<typeof useUIState>;
