import { useCallback } from 'react';
import { PASSIVE_SCORE_PER_SEC, COMBO_WINDOW } from '../constants';
import { UPGRADE_DEFINITIONS } from '../upgrades/factories';
import { GameStatus, Difficulty } from '../types';
import { DESCRIPTOR_REGISTRY } from './descriptors';
// Helper to map upgrade IDs to their stat keys in WeaponStats
const WEAPON_STAT_MAP = {
    CANNON: 'cannonLevel',
    AURA: 'auraLevel',
    MINES: 'mineLevel',
    LIGHTNING: 'chainLightningLevel',
    SHOCKWAVE: 'shockwaveLevel',
    NANO_SWARM: 'nanoSwarmLevel',
    PRISM_LANCE: 'prismLanceLevel',
    NEON_SCATTER: 'neonScatterLevel',
    VOLT_SERPENT: 'voltSerpentLevel',
    PHASE_RAIL: 'phaseRailLevel',
    REFLECTOR_MESH: 'reflectorMeshLevel',
    GHOST_COIL: 'ghostCoilLevel',
    EMP_BLOOM: 'empBloomLevel',
    NEURAL_MAGNET: 'neuralMagnetLevel',
    OVERCLOCK: 'overclockLevel',
    ECHO_CACHE: 'echoCacheLevel'
};
export function useProgression(game) {
    const { statsRef, scoreRef, xpRef, nextLevelXpRef, levelRef, setUiScore, setUiXp, setUiLevel, setUiCombo, setUiShield, setStatus, setUpgradeOptions, audioEventsRef, uiCombo, gameTimeRef, lastEatTimeRef, stageScoreRef, unlockedDifficulties, setUnlockedDifficulties, difficulty, pendingStatusRef } = game;
    const unlockNextDifficulty = useCallback(() => {
        const order = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.INSANE];
        const idx = order.indexOf(difficulty);
        if (idx >= 0 && idx < order.length - 1) {
            const next = order[idx + 1];
            if (!unlockedDifficulties.includes(next)) {
                setUnlockedDifficulties(prev => [...prev, next]);
            }
        }
    }, [difficulty, unlockedDifficulties, setUnlockedDifficulties]);
    const levelUp = useCallback(() => {
        setStatus(GameStatus.LEVEL_UP);
        audioEventsRef.current.push({ type: 'LEVEL_UP', data: { level: levelRef.current, difficulty, combo: uiCombo } });
        const stats = statsRef.current;
        const allIds = Object.keys(UPGRADE_DEFINITIONS);
        // 1. Filter Valid Upgrades based on caps and uniqueness
        const validIds = allIds.filter(id => {
            const desc = DESCRIPTOR_REGISTRY[id];
            if (!desc)
                return false;
            // MAX LEVEL / UNIQUE CHECK
            // If maxLevel is 1, checking acquiredUpgradeIds ensures uniqueness per run
            const maxLevel = desc.maxLevel || 999;
            // Check current level
            let currentLevel = 0;
            const statKey = WEAPON_STAT_MAP[id];
            if (statKey) {
                currentLevel = stats.weapon[statKey];
            }
            else if (stats.acquiredUpgradeIds.includes(id)) {
                // For boolean upgrades like SHIELD that don't have a weapon stat key
                // If already acquired, we treat it as level 1 (or count occurrences)
                // For now, if it's in acquired and maxLevel is 1, reject.
                if (maxLevel === 1)
                    return false;
                // If stacking allowed, we assume level is counted elsewhere or ignored here
            }
            if (currentLevel >= maxLevel)
                return false;
            // SLOT CHECK (Only for new WEAPON acquisition)
            if (desc.category === 'WEAPON') {
                const isActive = stats.activeWeaponIds.includes(id);
                const slotsFull = stats.activeWeaponIds.length >= stats.maxWeaponSlots;
                // If not active and slots full, cannot select
                if (!isActive && slotsFull)
                    return false;
            }
            return true;
        });
        // 2. Generate Options with Weights
        const options = [];
        const context = {
            weapon: statsRef.current.weapon,
            critChance: statsRef.current.critChance,
            shieldActive: statsRef.current.shieldActive,
            hackSpeedMod: statsRef.current.hackSpeedMod
        };
        // Helper: Get Weight
        const getWeight = (id) => {
            const desc = DESCRIPTOR_REGISTRY[id];
            if (!desc)
                return 0;
            if (desc.category === 'SCALAR')
                return 10;
            if (desc.category === 'WEAPON')
                return 5;
            // Utilities/Defense/System are rare
            return 1;
        };
        // Weighted Roll Loop
        if (validIds.length > 0) {
            // Clone validIds to a local pool so we can remove picked ones within this roll
            let currentPool = [...validIds];
            for (let i = 0; i < 3; i++) {
                if (currentPool.length === 0)
                    break;
                const totalWeight = currentPool.reduce((acc, id) => acc + getWeight(id), 0);
                let r = Math.random() * totalWeight;
                let pickedId = currentPool[0];
                for (const id of currentPool) {
                    r -= getWeight(id);
                    if (r <= 0) {
                        pickedId = id;
                        break;
                    }
                }
                // Add to options
                options.push(UPGRADE_DEFINITIONS[pickedId](context));
                // Remove picked from pool to prevent duplicate in same roll
                currentPool = currentPool.filter(id => id !== pickedId);
            }
        }
        // Fallback if pool exhausted
        while (options.length < 3) {
            options.push(UPGRADE_DEFINITIONS['SCALAR_DAMAGE'](context));
        }
        setUpgradeOptions(options);
    }, [setStatus, audioEventsRef, levelRef, difficulty, uiCombo, statsRef, setUpgradeOptions]);
    const gainXp = useCallback((amount) => {
        xpRef.current += amount;
        if (xpRef.current >= nextLevelXpRef.current) {
            xpRef.current -= nextLevelXpRef.current;
            levelRef.current += 1;
            nextLevelXpRef.current = Math.floor(nextLevelXpRef.current * 1.2);
            setUiLevel(levelRef.current);
            levelUp();
        }
        setUiXp((xpRef.current / nextLevelXpRef.current) * 100);
    }, [xpRef, nextLevelXpRef, levelRef, setUiLevel, setUiXp, levelUp]);
    const onEnemyDefeated = useCallback(({ xp }) => {
        if (xp > 0)
            gainXp(xp);
        scoreRef.current += 100 * statsRef.current.scoreMultiplier;
        stageScoreRef.current += 100;
    }, [gainXp, scoreRef, statsRef, stageScoreRef]);
    const onFoodConsumed = useCallback(({ type, byMagnet, value }) => {
        lastEatTimeRef.current = gameTimeRef.current;
        if (uiCombo < 10)
            setUiCombo(c => c + 1);
        const baseScore = 50;
        const comboMult = 1 + (uiCombo * 0.1);
        const val = value || baseScore;
        const finalScore = val * comboMult * statsRef.current.scoreMultiplier;
        scoreRef.current += finalScore;
        stageScoreRef.current += finalScore;
        setUiScore(scoreRef.current);
        audioEventsRef.current.push({
            type: 'EAT',
            data: { multiplier: 1 + (uiCombo * 0.1) }
        });
        if (type === 'XP_ORB' && value) {
            gainXp(value);
        }
        else if (type === 'NORMAL') {
            gainXp(10 * statsRef.current.foodQualityMod);
        }
    }, [gameTimeRef, lastEatTimeRef, uiCombo, setUiCombo, statsRef, scoreRef, stageScoreRef, setUiScore, audioEventsRef, gainXp]);
    const onTerminalHacked = useCallback(() => {
        scoreRef.current += 1000 * statsRef.current.scoreMultiplier;
        stageScoreRef.current += 1000;
        setUiScore(scoreRef.current);
    }, [scoreRef, statsRef, stageScoreRef, setUiScore]);
    const applyPassiveScore = useCallback((dt) => {
        const inc = PASSIVE_SCORE_PER_SEC * (dt / 1000) * statsRef.current.scoreMultiplier;
        scoreRef.current += inc;
        stageScoreRef.current += inc;
        setUiScore(Math.floor(scoreRef.current));
        if (uiCombo > 0 && gameTimeRef.current - lastEatTimeRef.current > COMBO_WINDOW) {
            setUiCombo(0);
        }
    }, [statsRef, scoreRef, stageScoreRef, setUiScore, uiCombo, gameTimeRef, lastEatTimeRef, setUiCombo]);
    const applyUpgrade = useCallback((id) => {
        const stats = statsRef.current;
        // TRACK ACQUISITION (For Uniqueness check)
        stats.acquiredUpgradeIds.push(id);
        switch (id) {
            // ── SCALARS ──
            case 'SCALAR_DAMAGE':
                stats.globalDamageMod += 0.1; // +10%
                break;
            case 'SCALAR_FIRE_RATE':
                stats.globalFireRateMod += 0.1; // +10% Speed
                break;
            case 'SCALAR_AREA':
                stats.globalAreaMod += 0.15; // +15% Radius
                break;
            // ── WEAPONS ──
            case 'CANNON':
                stats.weapon.cannonLevel++;
                stats.weapon.cannonDamage += 5;
                // Fire rate handled by base reduction AND global modifier
                stats.weapon.cannonFireRate = Math.max(100, stats.weapon.cannonFireRate - 80);
                if (stats.weapon.cannonLevel >= 5 && stats.weapon.cannonLevel % 5 === 0)
                    stats.weapon.cannonProjectileCount++;
                if (!stats.activeWeaponIds.includes('CANNON'))
                    stats.activeWeaponIds.push('CANNON');
                break;
            case 'AURA':
                stats.weapon.auraLevel++;
                stats.weapon.auraRadius += 0.5;
                stats.weapon.auraDamage += 3;
                if (!stats.activeWeaponIds.includes('AURA'))
                    stats.activeWeaponIds.push('AURA');
                break;
            case 'MINES':
                stats.weapon.mineLevel++;
                stats.weapon.mineDamage += 15;
                stats.weapon.mineDropRate = Math.max(500, stats.weapon.mineDropRate - 150);
                if (!stats.activeWeaponIds.includes('MINES'))
                    stats.activeWeaponIds.push('MINES');
                break;
            case 'LIGHTNING':
                stats.weapon.chainLightningLevel++;
                stats.weapon.chainLightningDamage += 0.10;
                stats.weapon.chainLightningRange += 1.5;
                if (!stats.activeWeaponIds.includes('LIGHTNING'))
                    stats.activeWeaponIds.push('LIGHTNING');
                break;
            case 'SHOCKWAVE':
                stats.weapon.shockwaveLevel++;
                stats.weapon.shockwaveRadius += 1.5;
                stats.weapon.shockwaveDamage += 25;
                break;
            case 'NANO_SWARM':
                stats.weapon.nanoSwarmLevel++;
                stats.weapon.nanoSwarmCount += 1;
                stats.weapon.nanoSwarmDamage += 5;
                if (!stats.activeWeaponIds.includes('NANO_SWARM'))
                    stats.activeWeaponIds.push('NANO_SWARM');
                break;
            case 'PRISM_LANCE':
                stats.weapon.prismLanceLevel++;
                stats.weapon.prismLanceDamage += 12;
                if (!stats.activeWeaponIds.includes('PRISM_LANCE'))
                    stats.activeWeaponIds.push('PRISM_LANCE');
                break;
            case 'NEON_SCATTER':
                stats.weapon.neonScatterLevel++;
                stats.weapon.neonScatterDamage += 5;
                if (!stats.activeWeaponIds.includes('NEON_SCATTER'))
                    stats.activeWeaponIds.push('NEON_SCATTER');
                break;
            case 'VOLT_SERPENT':
                stats.weapon.voltSerpentLevel++;
                stats.weapon.voltSerpentDamage += 10;
                if (!stats.activeWeaponIds.includes('VOLT_SERPENT'))
                    stats.activeWeaponIds.push('VOLT_SERPENT');
                break;
            case 'PHASE_RAIL':
                stats.weapon.phaseRailLevel++;
                stats.weapon.phaseRailDamage += 60;
                if (!stats.activeWeaponIds.includes('PHASE_RAIL'))
                    stats.activeWeaponIds.push('PHASE_RAIL');
                break;
            // ── UTILITY / PASSIVE ──
            case 'SHIELD':
                stats.shieldActive = true;
                setUiShield(true);
                break;
            case 'CRITICAL':
                stats.critChance += 0.05;
                stats.critMultiplier += 0.25;
                break;
            case 'FOOD':
                stats.foodQualityMod += 0.2;
                break;
            case 'REFLECTOR_MESH':
                stats.weapon.reflectorMeshLevel++;
                break;
            case 'GHOST_COIL':
                stats.weapon.ghostCoilLevel++;
                break;
            case 'EMP_BLOOM':
                stats.weapon.empBloomLevel++;
                break;
            case 'NEURAL_MAGNET':
                stats.weapon.neuralMagnetLevel++;
                break;
            case 'OVERCLOCK':
                stats.weapon.overclockLevel++;
                break;
            case 'ECHO_CACHE':
                stats.weapon.echoCacheLevel++;
                break;
            case 'TERMINAL_PROTOCOL':
                stats.hackSpeedMod *= 1.25;
                stats.scoreMultiplier += 0.1;
                break;
            case 'OVERRIDE_PROTOCOL':
                stats.maxWeaponSlots = Math.min(4, stats.maxWeaponSlots + 1);
                break;
        }
        if (pendingStatusRef.current) {
            setStatus(pendingStatusRef.current);
            pendingStatusRef.current = null;
        }
        else {
            setStatus(GameStatus.RESUMING);
        }
        // Play confirm sound
        audioEventsRef.current.push({ type: 'POWER_UP' });
    }, [statsRef, pendingStatusRef, setStatus, setUiShield, audioEventsRef]);
    return {
        applyUpgrade,
        onEnemyDefeated,
        onFoodConsumed,
        onTerminalHacked,
        applyPassiveScore,
        unlockNextDifficulty
    };
}
