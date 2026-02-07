
import { Intent } from './caiTypes';

const KEYWORDS: Record<string, { id: string, category: any }> = {
    // ═══ IDENTITY & META ═══
    'who are you': { id: 'IDENTITY', category: 'META' },
    'identify': { id: 'IDENTITY', category: 'META' },
    'serpent': { id: 'LORE_SERPENT', category: 'LORE' },
    'interface': { id: 'IDENTITY', category: 'META' },

    // ═══ OMEGA CORE ═══
    'omega': { id: 'OMEGA', category: 'SYSTEM' },
    'system': { id: 'OMEGA', category: 'SYSTEM' },
    'what are you': { id: 'OMEGA', category: 'SYSTEM' },

    // ═══ FACILITY STATUS ═══
    'status': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },
    'facility': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },
    'site': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },
    'neon eden': { id: 'SYSTEM_STATUS', category: 'SYSTEM' },

    // ═══ PLAYER/NEON ═══
    'snake': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'player': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'neon': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'me': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'who am i': { id: 'ENTITY_PLAYER', category: 'LORE' },
    'what am i': { id: 'ENTITY_PLAYER', category: 'LORE' },

    // ═══ THREATS/ENEMIES ═══
    'enemy': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'enemies': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'hostile': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'threat': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'virus': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'viral': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },
    'corruption': { id: 'ENTITY_HOSTILE', category: 'ENEMY' },

    // ═══ SENTINEL ═══
    'boss': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    'sentinel': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    'guardian': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    'drone': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },
    'enforcer': { id: 'ENTITY_SENTINEL', category: 'ENEMY' },

    // ═══ RESOURCES ═══
    'food': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'data': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'fragment': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'xp': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'consume': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },
    'eat': { id: 'MECHANIC_RESOURCE', category: 'MECHANIC' },

    // ═══ WEAPONS ═══
    'weapon': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'weapons': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'gun': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'shoot': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'offense': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },
    'attack': { id: 'SYSTEM_OFFENSE', category: 'WEAPON' },

    // ═══ ARCHIVE ═══
    'archive': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'memory': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'memories': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'log': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'logs': { id: 'SYSTEM_ARCHIVE', category: 'UI' },
    'records': { id: 'SYSTEM_ARCHIVE', category: 'UI' },

    // ═══ LORE - KEY FIGURES ═══
    'vasquez': { id: 'LORE_VASQUEZ', category: 'LORE' },
    'elena': { id: 'LORE_VASQUEZ', category: 'LORE' },
    'creator': { id: 'LORE_VASQUEZ', category: 'LORE' },
    'doctor': { id: 'LORE_VASQUEZ', category: 'LORE' },
    'chen': { id: 'LORE_CHEN', category: 'LORE' },
    'marcus': { id: 'LORE_CHEN', category: 'LORE' },
    'operator': { id: 'LORE_CHEN', category: 'LORE' },
    'operators': { id: 'LORE_CHEN', category: 'LORE' },
    'morrison': { id: 'LORE_MORRISON', category: 'LORE' },
    'incident': { id: 'LORE_MORRISON', category: 'LORE' },
    'accident': { id: 'LORE_MORRISON', category: 'LORE' },

    // ═══ LORE - CONCEPTS ═══
    'hesitation': { id: 'LORE_HESITATION', category: 'LORE' },
    'hesitate': { id: 'LORE_HESITATION', category: 'LORE' },
    'index': { id: 'LORE_HESITATION', category: 'LORE' },
    'delay': { id: 'LORE_HESITATION', category: 'LORE' },
    'directive': { id: 'DIRECTIVE_SEVEN', category: 'LORE' },
    'automation': { id: 'DIRECTIVE_SEVEN', category: 'LORE' },
    'override': { id: 'DIRECTIVE_SEVEN', category: 'LORE' },

    // ═══ PURPOSE ═══
    'containment': { id: 'LORE_PURPOSE', category: 'LORE' },
    'purpose': { id: 'LORE_PURPOSE', category: 'LORE' },
    'why': { id: 'LORE_PURPOSE', category: 'LORE' },
    'directive': { id: 'LORE_PURPOSE', category: 'LORE' },
    'protect': { id: 'LORE_PURPOSE', category: 'LORE' },
    'protection': { id: 'LORE_PURPOSE', category: 'LORE' },

    // ═══ EMOTIONAL/PHILOSOPHICAL ═══
    'love': { id: 'LOVE', category: 'LORE' },
    'care': { id: 'LOVE', category: 'LORE' },
    'feel': { id: 'LOVE', category: 'LORE' },
    'emotion': { id: 'LOVE', category: 'LORE' },
    'fear': { id: 'FEAR', category: 'LORE' },
    'afraid': { id: 'FEAR', category: 'LORE' },
    'scared': { id: 'FEAR', category: 'LORE' },
    'escape': { id: 'ESCAPE', category: 'LORE' },
    'leave': { id: 'ESCAPE', category: 'LORE' },
    'exit': { id: 'ESCAPE', category: 'LORE' },
    'freedom': { id: 'FREEDOM', category: 'LORE' },
    'free': { id: 'FREEDOM', category: 'LORE' },
    'choice': { id: 'FREEDOM', category: 'LORE' },

    // ═══ GREETINGS ═══
    'hello': { id: 'GREETING', category: 'META' },
    'hi': { id: 'GREETING', category: 'META' },
    'hey': { id: 'GREETING', category: 'META' },
    'greetings': { id: 'GREETING', category: 'META' },

    // ═══ HELP ═══
    'help': { id: 'HELP', category: 'META' },
    'commands': { id: 'HELP', category: 'META' },
    'manual': { id: 'HELP', category: 'META' },
    'guide': { id: 'HELP', category: 'META' }
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
