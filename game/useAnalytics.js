import { useCallback } from 'react';
export function useAnalytics(game) {
    const { enemiesKilledRef, terminalsHackedRef, startTimeRef } = game;
    const recordKill = useCallback(() => {
        enemiesKilledRef.current += 1;
    }, [enemiesKilledRef]);
    const recordTerminalHack = useCallback(() => {
        terminalsHackedRef.current += 1;
    }, [terminalsHackedRef]);
    return { recordKill, recordTerminalHack };
}
