
export interface CosmeticProfile {
  unlocked: string[]; // Unlocked for Purchase (Visibility)
  purchased: string[]; // Actually Owned (Equippable)
  seen: string[]; // For clearing "NEW" badges
  neonFragments: number; // Currency
  equippedSkin?: string;
  equippedHud?: string;
}

const STORAGE_KEY = 'neon_snake_cosmetics_v2'; // Bump version for migration

export const getDefaultProfile = (): CosmeticProfile => ({
    unlocked: ['AUTO', 'CYBER'], 
    purchased: ['AUTO', 'CYBER'],
    seen: ['AUTO', 'CYBER'], // Mark defaults as seen
    neonFragments: 0,
    equippedSkin: 'AUTO',
    equippedHud: 'CYBER'
});

export const loadCosmeticProfile = (): CosmeticProfile => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validation / Migration
            if (!parsed.purchased) parsed.purchased = [...parsed.unlocked]; // Legacy migration
            if (typeof parsed.neonFragments !== 'number') parsed.neonFragments = 0;
            
            // Ensure seen array exists
            if (!Array.isArray(parsed.seen)) parsed.seen = [];

            // Fix: Ensure default unlocked items are marked as seen to prevent persistent "NEW" badge
            const defaults = ['AUTO', 'CYBER'];
            defaults.forEach(id => {
                if (parsed.unlocked.includes(id) && !parsed.seen.includes(id)) {
                    parsed.seen.push(id);
                }
            });

            return { ...getDefaultProfile(), ...parsed };
        }
        
        // Check for v1
        const v1 = localStorage.getItem('neon_snake_cosmetics_v1');
        if (v1) {
             const parsedV1 = JSON.parse(v1);
             const unlocked = parsedV1.unlocked || ['AUTO', 'CYBER'];
             return {
                 ...getDefaultProfile(),
                 unlocked: unlocked,
                 purchased: unlocked, // Grant ownership of everything previously unlocked
                 seen: unlocked, // Mark all migrated items as seen
                 equippedSkin: parsedV1.equippedSkin,
                 equippedHud: parsedV1.equippedHud
             };
        }
    } catch (e) {
        console.error('Failed to load cosmetic profile', e);
    }
    return getDefaultProfile();
};

export const saveCosmeticProfile = (profile: CosmeticProfile) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error('Failed to save cosmetic profile', e);
    }
};
