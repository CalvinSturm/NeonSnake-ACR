
import { CosmeticDef, COSMETIC_REGISTRY } from './CosmeticRegistry';

export interface RunStats {
    score: number;
    stage: number;
    level: number;
    maxCombo: number;
    terminalsHacked: number;
    bossDefeated: boolean;
    integrity: number;
    xpOrbsCollected: number; // Need to track this roughly via score or level
}

export const evaluateUnlocks = (stats: RunStats, unlockedIds: Set<string>): string[] => {
    const newUnlocks: string[] = [];

    const check = (id: string, condition: boolean) => {
        if (condition && !unlockedIds.has(id) && COSMETIC_REGISTRY[id]) {
            newUnlocks.push(id);
        }
    };

    // ── SCORE THRESHOLDS ──
    check('RETRO', stats.score >= 5000);
    check('MECH2', stats.score >= 10000); // Skin
    check('FLUX2', stats.score >= 15000);
    check('NEON2', stats.score >= 20000);
    check('PIXEL2', stats.score >= 25000);
    check('GLITCH2', stats.score >= 30000);
    
    // Higher tier skins
    check('MECH3', stats.score >= 35000);
    check('FLUX3', stats.score >= 40000);
    check('NEON3', stats.score >= 45000);
    check('PROTOCOL2', stats.score >= 50000);

    // ── STAGE PROGRESSION ──
    check('CYBER2', stats.stage >= 2);
    check('ORGANIC', stats.stage >= 4);
    check('ZEN2', stats.stage >= 6);
    check('RPG2', stats.stage >= 8);
    check('HOLO2', stats.stage >= 10);
    
    // ── LEVEL PROGRESSION ──
    check('RPG', stats.level >= 5);
    check('SYSTEM', stats.level >= 10);
    check('SYSTEM2', stats.level >= 15);
    check('SYSTEM3', stats.level >= 20);

    // ── COMBO MASTERY ──
    check('FLUX', stats.maxCombo >= 4);
    check('FLUX4', stats.maxCombo >= 8);
    check('ARCADE', stats.maxCombo >= 6);
    check('ARCADE2', stats.maxCombo >= 10);

    // ── SPECIAL CONDITIONS ──
    check('ZEN', stats.score > 1000); // Placeholder for time
    check('HOLO', stats.bossDefeated);
    check('INDUSTRIAL', stats.integrity >= 100 && stats.stage > 1);
    check('GLITCH', stats.integrity < 20 && stats.stage > 1);
    check('PROTOCOL', stats.terminalsHacked >= 3);
    
    // ── GLASS TIER (High Performance) ──
    check('GLASS', stats.score >= 50000 && stats.bossDefeated);
    check('GLASS2', stats.stage >= 12);

    return newUnlocks;
};
