
export interface CosmeticProfile {
  unlocked: string[];
  seen: string[]; // For clearing "NEW" badges
}

const STORAGE_KEY = 'neon_snake_cosmetics_v1';

export const getDefaultProfile = (): CosmeticProfile => ({
    unlocked: ['AUTO', 'CYBER', 'MECH', 'NEON', 'RETRO', 'MINIMAL'], // Basic set unlocked
    seen: []
});

export const loadCosmeticProfile = (): CosmeticProfile => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
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
