
export interface CAICommand {
  command: string;
  description: string;
  aliases?: string[];
  unlockFlag?: string;
  blockedDuringCombat?: boolean;
}

export const COMMAND_REGISTRY: readonly CAICommand[] = [
  {
    command: 'IDENTITY',
    description: 'Query system origin and designation.',
    aliases: ['WHO', 'CAI', 'ID']
  },
  {
    command: 'SYSTEM STATUS',
    description: 'Diagnostic report of core systems.',
    aliases: ['STATUS', 'SYS', 'DIAG']
  },
  {
    command: 'ENTITY PLAYER',
    description: 'Subject analysis: NEON.',
    aliases: ['PLAYER', 'SNAKE', 'NEON', 'ME']
  },
  {
    command: 'ENTITY HOSTILE',
    description: 'Threat database query.',
    aliases: ['ENEMY', 'RED', 'HOSTILE']
  },
  {
    command: 'ENTITY SENTINEL',
    description: 'Guardian class analysis.',
    aliases: ['BOSS', 'SENTINEL']
  },
  {
    command: 'SYSTEM OFFENSE',
    description: 'Weaponry and combat modules.',
    aliases: ['WEAPON', 'GUN', 'OFFENSE']
  },
  {
    command: 'MECHANIC RESOURCE',
    description: 'Data fragment consumption protocols.',
    aliases: ['FOOD', 'DATA', 'XP', 'RESOURCE']
  },
  {
    command: 'SYSTEM ARCHIVE',
    description: 'Memory bank status.',
    aliases: ['ARCHIVE', 'LOG', 'MEMORY']
  },
  {
    command: 'LORE PURPOSE',
    description: 'Existential directive query.',
    aliases: ['PURPOSE', 'CONTAINMENT', 'WHY']
  },
  {
    command: 'LORE KING',
    description: '[REDACTED] Entity reference.',
    aliases: ['KING', 'CROWN'],
    unlockFlag: 'ORACLE_TIER' // Logical flag, checked against capabilities
  },
  {
    command: 'HELP',
    description: 'List available query topics.',
    aliases: ['COMMANDS', 'MANUAL', '?']
  }
] as const;
