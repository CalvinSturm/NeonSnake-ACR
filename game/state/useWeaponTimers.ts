/**
 * useWeaponTimers - Combat Timer State
 * Handles: All weapon cooldown/charge timers
 */

import { useRef } from 'react';

export function useWeaponTimers() {
    // Core weapon timing
    const weaponFireTimerRef = useRef(0);
    const auraTickTimerRef = useRef(0);
    const mineDropTimerRef = useRef(0);

    // Advanced weapons
    const prismLanceTimerRef = useRef(0);
    const neonScatterTimerRef = useRef(0);
    const voltSerpentTimerRef = useRef(0);

    // Charge weapons
    const phaseRailChargeRef = useRef(0);
    const echoDamageStoredRef = useRef(0);

    // Overclock
    const overclockActiveRef = useRef(false);
    const overclockTimerRef = useRef(0);

    // Nano Swarm
    const nanoSwarmAngleRef = useRef(0);

    /** Reset all weapon timers for new game */
    const resetWeaponTimers = (mineDropRate: number = 0) => {
        weaponFireTimerRef.current = 0;
        auraTickTimerRef.current = 0;
        mineDropTimerRef.current = mineDropRate;
        prismLanceTimerRef.current = 0;
        neonScatterTimerRef.current = 0;
        voltSerpentTimerRef.current = 0;
        phaseRailChargeRef.current = 0;
        echoDamageStoredRef.current = 0;
        overclockActiveRef.current = false;
        overclockTimerRef.current = 0;
        nanoSwarmAngleRef.current = 0;
    };

    return {
        // Core
        weaponFireTimerRef,
        auraTickTimerRef,
        mineDropTimerRef,

        // Advanced
        prismLanceTimerRef,
        neonScatterTimerRef,
        voltSerpentTimerRef,

        // Charge
        phaseRailChargeRef,
        echoDamageStoredRef,

        // Overclock
        overclockActiveRef,
        overclockTimerRef,

        // Nano
        nanoSwarmAngleRef,

        // Methods
        resetWeaponTimers
    };
}

export type WeaponTimersState = ReturnType<typeof useWeaponTimers>;
