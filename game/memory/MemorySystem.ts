
// Handles the persistence of unlocked memory files (Lore)

const STORAGE_KEY = 'neon_snake_memories_v1';
const UNREAD_KEY = 'neon_snake_memories_unread_v1';

export const getUnlockedMemoryIds = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load memories', e);
    }
    return [];
};

export const hasUnreadMemories = (): boolean => {
    return localStorage.getItem(UNREAD_KEY) === 'true';
};

export const markMemoriesAsRead = () => {
    localStorage.setItem(UNREAD_KEY, 'false');
};

export const unlockMemoryId = (id: string): boolean => {
    try {
        const current = getUnlockedMemoryIds();
        if (current.includes(id)) return false; // Already unlocked
        
        const next = [...current, id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(UNREAD_KEY, 'true'); // Flag as unread
        return true;
    } catch (e) {
        console.error('Failed to save memory', e);
        return false;
    }
};

export const resetMemories = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNREAD_KEY);
};
