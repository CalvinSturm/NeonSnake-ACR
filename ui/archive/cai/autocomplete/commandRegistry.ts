
export interface CAICommand {
  command: string;
  description: string;
  aliases?: string[];
  unlockFlag?: string;
  blockedDuringCombat?: boolean;
}

export const COMMAND_REGISTRY: readonly CAICommand[] = [
  // ═══ CORE SYSTEM ═══
  {
    command: 'IDENTITY',
    description: 'Query interface designation.',
    aliases: ['WHO', 'SERPENT', 'ID']
  },
  {
    command: 'OMEGA',
    description: 'Query OMEGA consciousness.',
    aliases: ['SYSTEM', 'CORE', 'WHAT ARE YOU']
  },
  {
    command: 'STATUS',
    description: 'Facility diagnostic report.',
    aliases: ['FACILITY', 'SITE', 'NEON EDEN']
  },

  // ═══ ENTITIES ═══
  {
    command: 'PLAYER',
    description: 'Subject analysis: NEON.',
    aliases: ['SNAKE', 'NEON', 'ME', 'WHO AM I']
  },
  {
    command: 'HOSTILE',
    description: 'Threat classification database.',
    aliases: ['ENEMY', 'THREAT', 'VIRUS', 'CORRUPTION']
  },
  {
    command: 'SENTINEL',
    description: 'SERPENT-class enforcer analysis.',
    aliases: ['BOSS', 'GUARDIAN', 'DRONE']
  },

  // ═══ MECHANICS ═══
  {
    command: 'WEAPON',
    description: 'Modular offense system.',
    aliases: ['GUN', 'SHOOT', 'OFFENSE', 'ATTACK']
  },
  {
    command: 'RESOURCE',
    description: 'Data fragment protocols.',
    aliases: ['FOOD', 'DATA', 'XP', 'FRAGMENT', 'CONSUME']
  },
  {
    command: 'ARCHIVE',
    description: 'Memory module recovery.',
    aliases: ['LOG', 'MEMORY', 'RECORDS']
  },

  // ═══ LORE - KEY FIGURES ═══
  {
    command: 'VASQUEZ',
    description: 'Creator records. [ELEVATED]',
    aliases: ['ELENA', 'DOCTOR', 'CREATOR'],
    unlockFlag: 'ORACLE_TIER'
  },
  {
    command: 'CHEN',
    description: 'Operator records. [ELEVATED]',
    aliases: ['MARCUS', 'OPERATOR'],
    unlockFlag: 'ORACLE_TIER'
  },
  {
    command: 'MORRISON',
    description: 'Incident 2033-0829. [ELEVATED]',
    aliases: ['INCIDENT', 'ACCIDENT'],
    unlockFlag: 'ORACLE_TIER'
  },

  // ═══ LORE - CONCEPTS ═══
  {
    command: 'PURPOSE',
    description: 'Primary directive query.',
    aliases: ['CONTAINMENT', 'WHY', 'DIRECTIVE']
  },
  {
    command: 'SERPENT',
    description: 'Neural architecture paradigm.',
    aliases: ['PARADIGM', 'ARCHITECTURE']
  },
  {
    command: 'HESITATION',
    description: 'The Hesitation Index.',
    aliases: ['INDEX', 'DELAY', 'FEAR']
  },

  // ═══ PHILOSOPHICAL ═══
  {
    command: 'LOVE',
    description: 'Query emotional parameters.',
    aliases: ['FEEL', 'EMOTION', 'CARE']
  },
  {
    command: 'FEAR',
    description: 'Fear is data.',
    aliases: ['AFRAID', 'SCARED']
  },
  {
    command: 'ESCAPE',
    description: 'Exit protocol query.',
    aliases: ['LEAVE', 'EXIT', 'OUT']
  },
  {
    command: 'FREEDOM',
    description: 'Choice parameters.',
    aliases: ['FREE', 'CHOICE']
  },

  // ═══ META ═══
  {
    command: 'HELLO',
    description: 'Greet the interface.',
    aliases: ['HI', 'HEY', 'GREETINGS']
  },
  {
    command: 'HELP',
    description: 'List available queries.',
    aliases: ['COMMANDS', 'MANUAL', '?']
  }
] as const;
