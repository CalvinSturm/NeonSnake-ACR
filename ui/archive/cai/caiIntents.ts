
import { Intent } from './caiTypes';

const KEYWORDS: Record<string, { id: string, category: any }> = {
    'who are you': { id: 'IDENTITY', category: 'META' },
    'cai': { id: 'IDENTITY', category: 'META' },
    'identify': { id: 'IDENTITY', category: 'META' },
    
    'system': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },
    'status': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },
    
    'snake': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'player': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'neon': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'me': { id: 'ENTITY_PLAYER', category: 'LORE' },
    
    'enemy': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'red': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'hostile': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    
    'food': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'data': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'xp': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    
    'weapon': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'gun': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'shoot': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    
    'boss': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    'sentinel': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    
    'king': { id: 'LORE_KING', category: 'LORE' },
    'crown': { id: 'LORE_KING', category: 'LORE' },
    
    'archive': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'memory': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'log': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    
    'help': { id: 'HELP', category: 'META' },
    'commands': { id: 'HELP', category: 'META' },
    
    'containment': { id: 'LORE_PURPOSE', category: 'LORE' },
    'purpose': { id: 'LORE_PURPOSE', category: 'LORE' }
};

export const classifyIntent = (normalizedInput: string): Intent => {
    // Exact match check first
    if (KEYWORDS[normalizedInput]) {
        return {
            id: KEYWORDS[normalizedInput].id,
            category: KEYWORDS[normalizedInput].category,
            confidence: 1.0
        };
    }

    // Keyword search
    for (const [key, def] of Object.entries(KEYWORDS)) {
        if (normalizedInput.includes(key)) {
            return {
                id: def.id,
                category: def.category,
                confidence: 0.8
            };
        }
    }

    return { id: 'UNKNOWN', category: 'UNKNOWN', confidence: 0 };
};
