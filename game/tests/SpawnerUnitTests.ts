
import { getOffscreenSpawnPos, getChunkedXpValues } from '../useSpawner';
import { Direction, Difficulty } from '../../types';
import { XP_CHUNK_VALUES, DIFFICULTY_CONFIGS } from '../../constants';

export const runSpawnerUnitTests = () => {
    const results: string[] = [];
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, name: string) => {
        if (condition) {
            passed++;
            results.push(`[PASS] ${name}`);
        } else {
            failed++;
            results.push(`[FAIL] ${name}`);
        }
    };

    try {
        // --- getChunkedXpValues ---
        // Test 1: Sum Integrity
        const total1 = 5500;
        const chunks1 = getChunkedXpValues(total1, DIFFICULTY_CONFIGS[Difficulty.MEDIUM], 20);
        const sum1 = chunks1.reduce((a, b) => a + b, 0);
        assert(sum1 === total1, `XP Sum Check (${sum1} == ${total1})`);

        // Test 2: Max Orbs
        assert(chunks1.length <= 20, `XP Max Orbs Cap (${chunks1.length} <= 20)`);

        // Test 3: Large Value Presence
        // 5000 should trigger at least one HUGE chunk (500) if defined in constants
        // Note: Constants are 500 for HUGE
        assert(chunks1.includes(XP_CHUNK_VALUES.HUGE), `XP Huge Chunk Present`);

        // Test 4: Small Amount
        const total2 = 25;
        const chunks2 = getChunkedXpValues(total2, DIFFICULTY_CONFIGS[Difficulty.MEDIUM], 20);
        const sum2 = chunks2.reduce((a, b) => a + b, 0);
        assert(sum2 === total2, `Small XP Sum Check (${sum2} == ${total2})`);

    } catch (e: any) {
        failed++;
        results.push(`[ERROR] XP Tests Exception: ${e.message}`);
    }

    try {
        // --- getOffscreenSpawnPos ---
        const vpCols = 40;
        const vpRows = 30;
        const head = { x: 20, y: 15 };

        // Test 1: Safety Radius (Statistical)
        let safetyViolations = 0;
        for(let i=0; i<50; i++) {
            const { pos } = getOffscreenSpawnPos(vpCols, vpRows, head, Difficulty.MEDIUM, 1, Direction.RIGHT);
            const dist = Math.hypot(pos.x - head.x, pos.y - head.y);
            // Default SPAWN_SAFE_RADIUS is 8
            if (dist < 8) safetyViolations++;
        }
        assert(safetyViolations === 0, `Spawn Safety Radius (Violations: ${safetyViolations})`);

        // Test 2: Neophyte Bias (Directional Avoidance)
        // If moving RIGHT, avoid RIGHT spawn side.
        let rightSideSpawns = 0;
        const iterations = 200;
        for(let i=0; i<iterations; i++) {
            const { side } = getOffscreenSpawnPos(vpCols, vpRows, head, Difficulty.EASY, 1, Direction.RIGHT);
            if (side === 'RIGHT') rightSideSpawns++;
        }
        // Weight for Right is 0.1 out of 5.1 (~2%). 
        // 200 iterations * 0.02 = 4 expected. 
        // Allow generous buffer for RNG variance (e.g. < 20 spawns is still clearly biased compared to 25% expected uniform)
        assert(rightSideSpawns < 25, `Neophyte Spawn Bias (Right Spawns: ${rightSideSpawns}/${iterations})`);

        // Test 3: Fallback (Null Head)
        // Should not crash
        const { pos: fallbackPos } = getOffscreenSpawnPos(vpCols, vpRows, undefined, Difficulty.MEDIUM, 1, Direction.RIGHT);
        assert(!!fallbackPos, `Spawn Fallback (Undefined Head)`);

    } catch (e: any) {
        failed++;
        results.push(`[ERROR] Spawn Tests Exception: ${e.message}`);
    }

    results.push(`--- SUMMARY: ${passed} PASS, ${failed} FAIL ---`);
    return results;
};
