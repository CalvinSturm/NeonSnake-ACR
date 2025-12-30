
import { DEV_START_CONFIG } from '../dev/DevStartConfig';
import { useGameState } from '../useGameState';
import { CameraBehavior } from '../camera/types';
import { generateWalls } from '../gameUtils';

// Helper to map IDs to stat paths (duplicated from factories to avoid circular deps/exports)
function getWeaponLevelKey(id: string): string | null {
    const map: Record<string, string> = {
        'CANNON': 'weapon.cannonLevel',
        'AURA': 'weapon.auraLevel',
        'MINES': 'weapon.mineLevel',
        'LIGHTNING': 'weapon.chainLightningLevel',
        'NANO_SWARM': 'weapon.nanoSwarmLevel',
        'PRISM_LANCE': 'weapon.prismLanceLevel',
        'NEON_SCATTER': 'weapon.neonScatterLevel',
        'VOLT_SERPENT': 'weapon.voltSerpentLevel',
        'PHASE_RAIL': 'weapon.phaseRailLevel',
        'REFLECTOR_MESH': 'weapon.reflectorMeshLevel',
        'GHOST_COIL': 'weapon.ghostCoilLevel',
        'NEURAL_MAGNET': 'weapon.neuralMagnetLevel',
        'OVERCLOCK': 'weapon.overclockLevel',
        'ECHO_CACHE': 'weapon.echoCacheLevel',
        'LUCK': 'weapon.luckLevel'
    };
    return map[id] || null;
}

export function applyDevStartOverrides(game: ReturnType<typeof useGameState>) {
    if (!DEV_START_CONFIG.enabled) return;
    const cfg = DEV_START_CONFIG;

    console.log('[DEV] Applying Start Overrides:', cfg);

    // 1. STAGE & DIFFICULTY
    if (cfg.stageId !== undefined) {
        game.stageRef.current = cfg.stageId;
        game.setUiStage(cfg.stageId);
        // Regenerate walls for the forced stage
        game.wallsRef.current = generateWalls(cfg.stageId);
    }
    
    if (cfg.difficulty) {
        game.setDifficulty(cfg.difficulty);
    }

    // 2. WEAPONS
    if (cfg.weapons) {
        const stats = game.statsRef.current;
        const wStats = stats.weapon;

        Object.entries(cfg.weapons).forEach(([id, level]) => {
            const keyPath = getWeaponLevelKey(id);
            if (keyPath) {
                // Parse "weapon.cannonLevel" -> "cannonLevel"
                const prop = keyPath.split('.')[1];
                // @ts-ignore
                if (wStats[prop] !== undefined) {
                    // @ts-ignore
                    wStats[prop] = level;
                }

                // Ensure it's in the active list
                if (!stats.activeWeaponIds.includes(id)) {
                    // Replace an empty slot or push if space
                    if (stats.activeWeaponIds.length < stats.maxWeaponSlots) {
                        stats.activeWeaponIds.push(id);
                    }
                }
                
                // Add to acquired for UI consistency
                if (!stats.acquiredUpgradeIds.includes(id)) {
                    stats.acquiredUpgradeIds.push(id);
                }
            }
        });
    }

    // 3. TRAITS
    if (cfg.traitMods) {
        Object.assign(game.traitsRef.current, cfg.traitMods);
    }

    // 4. MODS
    if (cfg.mods) {
        if (cfg.mods.godMode) {
            game.devModeFlagsRef.current.godMode = true;
        }
        if (cfg.mods.freeMovement) {
            game.devModeFlagsRef.current.freeMovement = true;
            game.cameraRef.current.behavior = CameraBehavior.MANUAL;
        }
    }
    
    // Sync UI
    game.syncUiStats();
}
