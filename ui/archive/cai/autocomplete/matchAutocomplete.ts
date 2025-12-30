
import { CAICommand } from './commandRegistry';

export interface AutocompleteContext {
  unlockedFlags: Set<string>;
  inCombat: boolean;
}

export interface AutocompleteResult {
  command: string;
  matchType: 'PREFIX' | 'ALIAS' | 'PARTIAL';
  original: CAICommand;
}

export const matchAutocomplete = (
  input: string,
  registry: readonly CAICommand[],
  context: AutocompleteContext
): AutocompleteResult[] => {
  // 1. Safety Checks
  if (!input || input.trim().length === 0) return [];
  
  const normalizedInput = input.trim().toUpperCase();
  const results: AutocompleteResult[] = [];

  // 2. Filter & Match
  for (const cmd of registry) {
    // A. Context Filter
    if (cmd.unlockFlag && !context.unlockedFlags.has(cmd.unlockFlag)) {
        continue;
    }
    if (cmd.blockedDuringCombat && context.inCombat) {
        continue;
    }

    // B. Matching Logic
    // Priority 1: Exact Prefix of Command
    if (cmd.command.startsWith(normalizedInput)) {
      results.push({ command: cmd.command, matchType: 'PREFIX', original: cmd });
      continue;
    }

    // Priority 2: Alias Match
    if (cmd.aliases) {
      const aliasMatch = cmd.aliases.find(a => a.startsWith(normalizedInput));
      if (aliasMatch) {
        results.push({ command: cmd.command, matchType: 'ALIAS', original: cmd });
        continue;
      }
    }
    
    // Priority 3: Word Boundary (e.g. "STATUS" matches "SYSTEM STATUS")
    if (cmd.command.includes(' ' + normalizedInput)) {
        results.push({ command: cmd.command, matchType: 'PARTIAL', original: cmd });
    }
  }

  // 3. Sort (Deterministic)
  // Sort order: PREFIX matches first, then ALIAS, then PARTIAL. Then Alphabetical.
  results.sort((a, b) => {
    const scoreA = getMatchScore(a.matchType);
    const scoreB = getMatchScore(b.matchType);
    
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.command.localeCompare(b.command);
  });

  // 4. Limit
  return results.slice(0, 5);
};

const getMatchScore = (type: 'PREFIX' | 'ALIAS' | 'PARTIAL'): number => {
  switch (type) {
    case 'PREFIX': return 1;
    case 'ALIAS': return 2;
    case 'PARTIAL': return 3;
    default: return 99;
  }
};
