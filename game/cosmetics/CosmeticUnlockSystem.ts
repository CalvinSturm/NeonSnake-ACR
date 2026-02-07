
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

    const s = stats.stage;
    const isTier2Plus = stats.difficulty !== Difficulty.EASY;
    const isTier3Plus = stats.difficulty === Difficulty.HARD || stats.difficulty === Difficulty.INSANE;
    const isTier4 = stats.difficulty === Difficulty.INSANE;

    // ─── TIER 1: NEOPHYTE (Any Difficulty) ───
    if (s >= 2) { check('MECH', true); check('RETRO', true); }
    if (s >= 3) { check('FLUX', true); check('ZEN', true); check('RETRO3', true); }
    if (s >= 4) { check('NEON', true); check('INDUSTRIAL', true); check('RETRO4', true); }
    if (s >= 5) {
        ['PIXEL', 'MINIMAL', 'ORGANIC', 'RETRO5', 'ARCADE'].forEach(id => check(id, true));
    }

    // ─── TIER 2: OPERATOR (Medium+) ───
    if (isTier2Plus) {
        if (s >= 6) { check('GLITCH', true); check('RPG', true); check('RPG3', true); }
        if (s >= 7) { check('PROTOCOL', true); check('HOLO', true); check('HOLO3', true); }
        if (s >= 8) { check('SYSTEM', true); check('ZEN2', true); check('RPG4', true); check('INDUSTRIAL2', true); }
        if (s >= 9) {
            ['MECH2', 'FLUX2', 'NEON2', 'PIXEL2', 'MINIMAL2', 'ARCADE2', 'GLASS'].forEach(id => check(id, true));
        }
    }

    // ─── TIER 3: VETERAN (Hard+) ───
    if (isTier3Plus) {
        if (s >= 10) { check('ORGANIC2', true); check('CYBER2', true); check('CYBER3', true); check('INDUSTRIAL3', true); check('ARCADE3', true); }
        if (s >= 11) { check('GLITCH2', true); check('GLASS2', true); check('CYBER4', true); check('ZEN3', true); }
        if (s >= 12) { check('PROTOCOL2', true); check('RETRO2', true); check('RETRO6', true); check('INDUSTRIAL4', true); check('ARCADE4', true); }
        if (s >= 13) {
            ['SYSTEM2', 'MECH3', 'FLUX3', 'NEON3', 'PIXEL3', 'MINIMAL3', 'ORGANIC3', 'RETRO7', 'ZEN4'].forEach(id => check(id, true));
        }
    }

    // ─── TIER 4: CYBERPSYCHO (Insane Only) ───
    if (isTier4) {
        if (s >= 14) {
            ['GLITCH3', 'HOLO2', 'CYBER5', 'INDUSTRIAL5', 'ARCADE5', 'GLASS3', 'RPG5', 'HOLO4', 'ZEN5'].forEach(id => check(id, true));
        }
        if (s >= 15) {
            ['PROTOCOL3', 'RPG2', 'GLASS4', 'HOLO5'].forEach(id => check(id, true));
        }
        if (s >= 16) {
            ['SYSTEM3', 'INDUSTRIAL2', 'CYBER6', 'INDUSTRIAL6', 'ARCADE6', 'GLASS5', 'RPG6', 'HOLO6', 'ZEN6'].forEach(id => check(id, true));
        }
        if (s >= 17) {
            ['MECH4', 'FLUX4', 'NEON4', 'PIXEL4', 'MINIMAL4', 'MECH5', 'FLUX5', 'NEON5', 'PIXEL5', 'GLASS6'].forEach(id => check(id, true));
        }
        if (s >= 18 || stats.bossDefeated) { // Victory Unlocks
            ['MECH6', 'FLUX6', 'NEON6', 'PIXEL6', 'MINIMAL6', 'GLITCH6', 'ORGANIC6', 'PROTOCOL6', 'SYSTEM6', 'CYBER7', 'INDUSTRIAL7', 'ARCADE7', 'GLASS7', 'RPG7', 'HOLO7', 'ZEN7'].forEach(id => check(id, true));
        }
    }

    return newUnlocks;
};
