/**
 * useCosmeticState - Cosmetics/Unlocks State
 * Handles: Cosmetic unlocks, purchases, fragments, toasts, archive
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { loadCosmeticProfile, saveCosmeticProfile } from '../cosmetics/CosmeticProfile';
import { COSMETIC_REGISTRY } from '../cosmetics/CosmeticRegistry';
import { hasUnreadMemories, markMemoriesAsRead } from '../memory/MemorySystem';

export function useCosmeticState() {
    // Cosmetic tracking
    const [unlockedCosmetics, setUnlockedCosmetics] = useState<Set<string>>(new Set());
    const [purchasedCosmetics, setPurchasedCosmetics] = useState<Set<string>>(new Set());
    const [seenCosmetics, setSeenCosmetics] = useState<Set<string>>(new Set());
    const [neonFragments, setNeonFragments] = useState(0);
    const [sessionNewUnlocks, setSessionNewUnlocks] = useState<string[]>([]);
    const [toastQueue, setToastQueue] = useState<string[]>([]);

    // Lore state
    const [hasUnreadArchiveData, setHasUnreadArchiveData] = useState(false);

    // Load profile on mount
    useEffect(() => {
        const profile = loadCosmeticProfile();
        setUnlockedCosmetics(new Set(profile.unlocked));
        setPurchasedCosmetics(new Set(profile.purchased));
        setSeenCosmetics(new Set(profile.seen || []));
        setNeonFragments(profile.neonFragments);

        // Load lore state
        setHasUnreadArchiveData(hasUnreadMemories());
    }, []);

    // Derived: has new cosmetics
    const hasNewCosmetics = useMemo(() => {
        for (const id of unlockedCosmetics) {
            if (COSMETIC_REGISTRY[id] && !seenCosmetics.has(id)) return true;
        }
        return false;
    }, [unlockedCosmetics, seenCosmetics]);

    /** Unlock a cosmetic */
    const unlockCosmetic = useCallback((id: string) => {
        setUnlockedCosmetics((prev: Set<string>) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            const currentProfile = loadCosmeticProfile();
            saveCosmeticProfile({ ...currentProfile, unlocked: Array.from(next) });
            return next;
        });
        setSessionNewUnlocks((prev: string[]) => [...prev, id]);
        setToastQueue((prev: string[]) => [...prev, id]);
    }, []);

    /** Add neon fragments */
    const addNeonFragments = useCallback((amount: number) => {
        setNeonFragments(prev => {
            const next = prev + amount;
            const currentProfile = loadCosmeticProfile();
            saveCosmeticProfile({ ...currentProfile, neonFragments: next });
            return next;
        });
    }, []);

    /** Purchase a cosmetic */
    const purchaseCosmetic = useCallback((id: string) => {
        const def = COSMETIC_REGISTRY[id];
        if (!def) return false;

        const currentProfile = loadCosmeticProfile();
        if (currentProfile.neonFragments < def.cost) return false;

        const newFragments = currentProfile.neonFragments - def.cost;
        const newPurchased = [...currentProfile.purchased, id];
        const newSeen = new Set(currentProfile.seen || []);
        newSeen.add(id);

        saveCosmeticProfile({
            ...currentProfile,
            neonFragments: newFragments,
            purchased: newPurchased,
            seen: Array.from(newSeen)
        });

        setNeonFragments(newFragments);
        setPurchasedCosmetics(new Set(newPurchased));
        setSeenCosmetics(newSeen);
        return true;
    }, []);

    /** Mark cosmetic as seen */
    const markCosmeticSeen = useCallback((id: string) => {
        setSeenCosmetics((prev: Set<string>) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            const currentProfile = loadCosmeticProfile();
            saveCosmeticProfile({ ...currentProfile, seen: Array.from(next) });
            return next;
        });
    }, []);

    /** Clear the first toast from queue */
    const clearToast = useCallback(() => {
        setToastQueue((prev: string[]) => prev.slice(1));
    }, []);

    /** Mark archive as read */
    const markArchiveRead = useCallback(() => {
        markMemoriesAsRead();
        setHasUnreadArchiveData(false);
    }, []);

    /** Reset session unlocks for new game */
    const resetSessionUnlocks = useCallback(() => {
        setSessionNewUnlocks([]);
    }, []);

    return {
        // Cosmetics
        unlockedCosmetics,
        purchasedCosmetics,
        seenCosmetics,
        hasNewCosmetics,

        // Fragments
        neonFragments,

        // Session
        sessionNewUnlocks, setSessionNewUnlocks,

        // Toasts
        toastQueue,

        // Archive
        hasUnreadArchiveData, setHasUnreadArchiveData,

        // Methods
        unlockCosmetic,
        purchaseCosmetic,
        addNeonFragments,
        markCosmeticSeen,
        clearToast,
        markArchiveRead,
        resetSessionUnlocks
    };
}

export type CosmeticState = ReturnType<typeof useCosmeticState>;
