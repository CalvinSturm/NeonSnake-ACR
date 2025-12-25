import { useRef, useState, useCallback } from 'react';
import { GameStatus, Difficulty, Direction } from '../types';
import { CHARACTERS } from '../constants';
export const DEFAULT_USER_SETTINGS = {
    skipCountdown: false,
    uiScale: 1.0,
    fxIntensity: 1.0,
    screenShake: true,
    highContrast: false,
    musicVolume: 0.3,
    sfxVolume: 0.4
};
export function useGameState() {
    const [status, setStatus] = useState(GameStatus.IDLE);
    const [modalState, setModalState] = useState('NONE'); // MODAL AUTHORITY
    const [difficulty, setDifficulty] = useState(Difficulty.EASY);
    const [unlockedDifficulties, setUnlockedDifficulties] = useState([Difficulty.EASY]);
    const [uiScore, setUiScore] = useState(0);
    const [uiXp, setUiXp] = useState(0);
    const [uiLevel, setUiLevel] = useState(1);
    const [uiStage, setUiStage] = useState(1);
    const [highScore, setHighScore] = useState(0);
    const [uiCombo, setUiCombo] = useState(0);
    const [uiShield, setUiShield] = useState(false);
    const [bossActive, setBossActive] = useState(false);
    const [selectedChar, setSelectedChar] = useState(null);
    const [upgradeOptions, setUpgradeOptions] = useState([]);
    const [resumeCountdown, setResumeCountdown] = useState(0);
    const [activePowerUps, setActivePowerUps] = useState({ slow: false, magnet: false });
    const [isMuted, setIsMuted] = useState(false);
    // Settings State
    const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS);
    // REFS
    const runIdRef = useRef(0); // RUN BOUNDARY
    const settingsReturnRef = useRef('NONE');
    const snakeRef = useRef([]);
    const enemiesRef = useRef([]);
    const foodRef = useRef([]);
    const wallsRef = useRef([]);
    const terminalsRef = useRef([]);
    const projectilesRef = useRef([]);
    const minesRef = useRef([]);
    const shockwavesRef = useRef([]);
    const lightningArcsRef = useRef([]);
    const particlesRef = useRef([]);
    const floatingTextsRef = useRef([]);
    const digitalRainRef = useRef([]);
    const scoreRef = useRef(0);
    const enemiesKilledRef = useRef(0);
    const terminalsHackedRef = useRef(0);
    const startTimeRef = useRef(Date.now());
    const gameTimeRef = useRef(0);
    const failureMessageRef = useRef('');
    const abilityCooldownsRef = useRef({ chrono: 0, ping: 0, systemShock: 0 });
    const invulnerabilityTimeRef = useRef(0);
    const audioEventsRef = useRef([]);
    const transitionStartTimeRef = useRef(0);
    const transitionStateRef = useRef({ phase: 'NONE' });
    const pendingStatusRef = useRef(null);
    const stageArmedRef = useRef(false);
    const bossEnemyRef = useRef(null);
    const bossActiveRef = useRef(false);
    const bossDefeatedRef = useRef(false);
    const statsRef = useRef({
        weapon: CHARACTERS[0].initialStats.weapon,
        slowDurationMod: 1,
        magnetRangeMod: 0,
        empCooldownMod: 1,
        shieldActive: false,
        scoreMultiplier: 1,
        foodQualityMod: 1,
        critChance: 0.05,
        critMultiplier: 1.5,
        hackSpeedMod: 1,
        moveSpeedMod: 1,
        activeWeaponIds: [],
        maxWeaponSlots: 3,
        acquiredUpgradeIds: [],
        globalDamageMod: 1,
        globalFireRateMod: 1,
        globalAreaMod: 1,
        globalProjectileSpeedMod: 1
    });
    const powerUpsRef = useRef({ slowUntil: 0, magnetUntil: 0 });
    const ghostCoilCooldownRef = useRef(0);
    const empBloomCooldownRef = useRef(0);
    const directionRef = useRef(Direction.RIGHT);
    const directionQueueRef = useRef([]);
    const levelRef = useRef(1);
    const xpRef = useRef(0);
    const nextLevelXpRef = useRef(100);
    const enemySpawnTimerRef = useRef(0);
    const terminalSpawnTimerRef = useRef(0);
    const stageRef = useRef(1);
    const stageScoreRef = useRef(0);
    const shakeRef = useRef({ x: 0, y: 0 });
    const chromaticAberrationRef = useRef(0);
    const lastEatTimeRef = useRef(0);
    const weaponFireTimerRef = useRef(0);
    const auraTickTimerRef = useRef(0);
    const mineDropTimerRef = useRef(0);
    const prismLanceTimerRef = useRef(0);
    const neonScatterTimerRef = useRef(0);
    const voltSerpentTimerRef = useRef(0);
    const phaseRailChargeRef = useRef(0);
    const echoDamageStoredRef = useRef(0);
    const overclockActiveRef = useRef(false);
    const overclockTimerRef = useRef(0);
    const nanoSwarmAngleRef = useRef(0); // NEW: Persistent angle for smoothness
    const lastPowerUpStateRef = useRef({ slow: false, magnet: false });
    // ─────────────────────────────
    // MODAL LOGIC
    // ─────────────────────────────
    const openSettings = useCallback(() => {
        if (modalState === 'SETTINGS')
            return;
        settingsReturnRef.current = modalState;
        setModalState('SETTINGS');
        if (status === GameStatus.PLAYING) {
            setStatus(GameStatus.PAUSED);
        }
    }, [modalState, status]);
    const closeSettings = useCallback(() => {
        if (modalState !== 'SETTINGS')
            return;
        setModalState(settingsReturnRef.current);
        if (settingsReturnRef.current === 'NONE' && status === GameStatus.PAUSED) {
            setStatus(GameStatus.PLAYING);
        }
    }, [modalState, status]);
    const togglePause = useCallback(() => {
        if (modalState === 'SETTINGS')
            return; // Settings owns input
        if (status === GameStatus.PLAYING) {
            setStatus(GameStatus.PAUSED);
            setModalState('PAUSE');
        }
        else if (status === GameStatus.PAUSED && modalState === 'PAUSE') {
            setStatus(GameStatus.PLAYING);
            setModalState('NONE');
        }
    }, [status, modalState]);
    // ─────────────────────────────
    // RUN RESET (AUTHORITATIVE)
    // ─────────────────────────────
    const resetGame = useCallback((charProfile) => {
        // 1. INCREMENT RUN ID (Invalidates previous run state)
        runIdRef.current += 1;
        // 2. ATOMIC METRIC RESET
        snakeRef.current = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        directionRef.current = Direction.RIGHT;
        directionQueueRef.current = [];
        enemiesRef.current = [];
        foodRef.current = [];
        wallsRef.current = [];
        terminalsRef.current = [];
        projectilesRef.current = [];
        minesRef.current = [];
        shockwavesRef.current = [];
        lightningArcsRef.current = [];
        particlesRef.current = [];
        floatingTextsRef.current = [];
        digitalRainRef.current = [];
        scoreRef.current = 0;
        enemiesKilledRef.current = 0;
        terminalsHackedRef.current = 0;
        stageRef.current = 1;
        stageScoreRef.current = 0;
        levelRef.current = 1;
        xpRef.current = 0;
        nextLevelXpRef.current = 500;
        gameTimeRef.current = 0;
        startTimeRef.current = Date.now();
        invulnerabilityTimeRef.current = 0;
        transitionStartTimeRef.current = 0;
        pendingStatusRef.current = null;
        stageArmedRef.current = false;
        bossActiveRef.current = false;
        bossDefeatedRef.current = false;
        bossEnemyRef.current = null;
        // ATOMIC STATS RECONSTRUCTION
        const baseStats = {
            weapon: JSON.parse(JSON.stringify(CHARACTERS[0].initialStats.weapon)),
            slowDurationMod: 1,
            magnetRangeMod: 0,
            empCooldownMod: 1,
            shieldActive: false,
            scoreMultiplier: 1,
            foodQualityMod: 1,
            critChance: 0.05,
            critMultiplier: 1.5,
            hackSpeedMod: 1,
            moveSpeedMod: 1,
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
        const w = statsRef.current.weapon;
        const initialWeapons = [];
        if (w.cannonLevel > 0)
            initialWeapons.push('CANNON');
        if (w.auraLevel > 0)
            initialWeapons.push('AURA');
        if (w.nanoSwarmLevel > 0)
            initialWeapons.push('NANO_SWARM');
        if (w.mineLevel > 0)
            initialWeapons.push('MINES');
        if (w.chainLightningLevel > 0)
            initialWeapons.push('LIGHTNING');
        if (w.prismLanceLevel > 0)
            initialWeapons.push('PRISM_LANCE');
        if (w.neonScatterLevel > 0)
            initialWeapons.push('NEON_SCATTER');
        if (w.voltSerpentLevel > 0)
            initialWeapons.push('VOLT_SERPENT');
        if (w.phaseRailLevel > 0)
            initialWeapons.push('PHASE_RAIL');
        statsRef.current.activeWeaponIds = initialWeapons.slice(0, statsRef.current.maxWeaponSlots);
        statsRef.current.acquiredUpgradeIds = [...initialWeapons]; // Initialize acquired with starters
        if (statsRef.current.shieldActive)
            statsRef.current.acquiredUpgradeIds.push('SHIELD');
        // UI Resets
        setUiScore(0);
        setUiXp(0);
        setUiLevel(1);
        setUiStage(1);
        setUiCombo(0);
        setUiShield(!!statsRef.current.shieldActive);
        setBossActive(false);
        // Clear Modal State (except if handled by caller, but generally reset means new run)
        setModalState('NONE');
        abilityCooldownsRef.current = { chrono: 0, ping: 0, systemShock: 0 };
        powerUpsRef.current = { slowUntil: 0, magnetUntil: 0 };
        nanoSwarmAngleRef.current = 0;
    }, []);
    return {
        status, setStatus,
        modalState, setModalState,
        difficulty, setDifficulty,
        unlockedDifficulties, setUnlockedDifficulties,
        uiScore, setUiScore,
        uiXp, setUiXp,
        uiLevel, setUiLevel,
        uiStage, setUiStage,
        highScore, setHighScore,
        uiCombo, setUiCombo,
        uiShield, setUiShield,
        bossActive, setBossActive,
        selectedChar, setSelectedChar,
        upgradeOptions, setUpgradeOptions,
        resumeCountdown, setResumeCountdown,
        activePowerUps, setActivePowerUps,
        isMuted, setIsMuted,
        settings, setSettings,
        runIdRef, // Expose Run ID
        snakeRef,
        enemiesRef,
        foodRef,
        wallsRef,
        terminalsRef,
        projectilesRef,
        minesRef,
        shockwavesRef,
        lightningArcsRef,
        particlesRef,
        floatingTextsRef,
        digitalRainRef,
        scoreRef,
        enemiesKilledRef,
        terminalsHackedRef,
        startTimeRef,
        gameTimeRef,
        failureMessageRef,
        abilityCooldownsRef,
        invulnerabilityTimeRef,
        audioEventsRef,
        transitionStartTimeRef,
        transitionStateRef,
        pendingStatusRef,
        stageArmedRef,
        bossEnemyRef,
        bossActiveRef,
        bossDefeatedRef,
        statsRef,
        powerUpsRef,
        ghostCoilCooldownRef,
        empBloomCooldownRef,
        directionRef,
        directionQueueRef,
        levelRef,
        xpRef,
        nextLevelXpRef,
        enemySpawnTimerRef,
        terminalSpawnTimerRef,
        stageRef,
        stageScoreRef,
        shakeRef,
        chromaticAberrationRef,
        lastEatTimeRef,
        weaponFireTimerRef,
        auraTickTimerRef,
        mineDropTimerRef,
        prismLanceTimerRef,
        neonScatterTimerRef,
        voltSerpentTimerRef,
        phaseRailChargeRef,
        echoDamageStoredRef,
        overclockActiveRef,
        overclockTimerRef,
        nanoSwarmAngleRef,
        lastPowerUpStateRef,
        resetGame,
        openSettings,
        closeSettings,
        togglePause
    };
}
