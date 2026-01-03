
import { COSMETIC_REGISTRY } from './CosmeticRegistry';
import { Difficulty } from '../../types';

export interface RunStats {
    score: number;
    stage: number;
    level: number;
    maxCombo: number;
    terminalsHacked: number;
    bossDefeated: boolean;
    integrity: number;
    xpOrbsCollected: number;
    difficulty: Difficulty;
}

export const evaluateUnlocks = (stats: RunStats, unlockedIds: Set<string>): string[] => {
    const newUnlocks: string[] = [];

    const check = (id: string, condition: boolean) => {
        if (condition && !unlockedIds.has(id) && COSMETIC_REGISTRY[id]) {
            newUnlocks.push(id);
        }
    };

    // Helper to check difficulty tier
    const isTier2Plus = stats.difficulty !== Difficulty.EASY;
    const isTier3Plus = stats.difficulty === Difficulty.HARD || stats.difficulty === Difficulty.INSANE;
    const isTier4 = stats.difficulty === Difficulty.INSANE;

    // ─── TIER 1: NEOPHYTE (Any Difficulty) ───
    if (stats.stage >= 2) { check('MECH', true); check('RETRO', true); }
    if (stats.stage >= 3) { check('FLUX', true); check('ZEN', true); }
    if (stats.stage >= 4) { check('NEON', true); check('INDUSTRIAL', true); }
    if (stats.stage >= 5) {
        check('PIXEL', true); 
        check('MINIMAL', true); 
        check('ORGANIC', true); 
    }

    // ─── TIER 2: OPERATOR (Medium+) ───
    if (isTier2Plus) {
        if (stats.stage >= 6) { check('GLITCH', true); check('RPG', true); }
        if (stats.stage >= 7) { check('PROTOCOL', true); check('HOLO', true); }
        if (stats.stage >= 8) { check('SYSTEM', true); check('ARCADE', true); }
        if (stats.stage >= 9) {
            check('MECH2', true);
            check('FLUX2', true);
            check('NEON2', true);
            check('PIXEL2', true);
            check('MINIMAL2', true);
        }
    }

    // ─── TIER 3: VETERAN (Hard+) ───
    if (isTier3Plus) {
        if (stats.stage >= 10) { check('ORGANIC2', true); check('CYBER2', true); }
        if (stats.stage >= 11) { check('GLITCH2', true); check('GLASS', true); }
        if (stats.stage >= 12) { check('PROTOCOL2', true); check('RETRO2', true); }
        if (stats.stage >= 13) {
            check('SYSTEM2', true);
            check('MECH3', true);
            check('FLUX3', true);
            check('NEON3', true);
            check('PIXEL3', true);
            check('MINIMAL3', true);
            check('ORGANIC3', true);
        }
    }

    // ─── TIER 4: CYBERPSYCHO (Insane Only) ───
    if (isTier4) {
        if (stats.stage >= 14) { check('GLITCH3', true); check('HOLO2', true); }
        if (stats.stage >= 15) { check('PROTOCOL3', true); check('RPG2', true); }
        if (stats.stage >= 16) { check('SYSTEM3', true); check('INDUSTRIAL2', true); }
        if (stats.stage >= 17) {
            check('MECH4', true); check('FLUX4', true); check('NEON4', true);
            check('PIXEL4', true); check('MINIMAL4', true);
            check('MECH5', true); check('FLUX5', true); check('NEON5', true); check('PIXEL5', true);
        }
    }

    return newUnlocks;
};
