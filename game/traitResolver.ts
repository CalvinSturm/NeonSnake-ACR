
import { CharacterProfile } from '../types';

export interface TraitModifiers {
    // Legacy / Specific (Defaults applied, but no longer set by ID)
    mineRadiusMod: number;
    mineBlastMod: number;
    tailIntegrityDamageMod: number; 
    collisionDodgeChance: number;
    reactiveLightningChance: number;
    speedComboScaler: number; 
    projectileSpeedMod: number;

    // NEW: Scalable Intrinsics
    luckBonus: number;            // Additive to Luck
    attackSpeedBonus: number;     // Additive to Fire Rate
    xpGainBonus: number;          // Multiplier for XP (0.05 = +5%)
    terminalEfficiency: number;   // Reduction in hack time (0.04 = -4%)
    damageResistBonus: number;    // Additive Damage Reduction (0.015 = 1.5%)
    critChanceBonus: number;      // Additive Crit Chance
}

const DEFAULT_TRAITS: TraitModifiers = {
    mineRadiusMod: 1.0,
    mineBlastMod: 1.0,
    tailIntegrityDamageMod: 1.0,
    collisionDodgeChance: 0.0,
    reactiveLightningChance: 0.0,
    speedComboScaler: 0.0,
    projectileSpeedMod: 1.0,
    
    luckBonus: 0,
    attackSpeedBonus: 0,
    xpGainBonus: 0,
    terminalEfficiency: 0,
    damageResistBonus: 0,
    critChanceBonus: 0
};

interface IntrinsicDef {
    type: keyof TraitModifiers;
    baseValue: number;
    perLevel: number;
}

// Map Character IDs to their Intrinsic Scaling Logic
export const CHARACTER_INTRINSICS: Record<string, IntrinsicDef> = {
    'spectre': { type: 'luckBonus', baseValue: 0, perLevel: 0.02 },            // LOOTER -> LUCK
    'striker': { type: 'attackSpeedBonus', baseValue: 0, perLevel: 0.015 },    // GUNNER -> ATTACK SPEED
    'volt':    { type: 'xpGainBonus', baseValue: 0, perLevel: 0.05 },          // VOLATILE -> XP GAIN
    'rigger':  { type: 'terminalEfficiency', baseValue: 0, perLevel: 0.04 },   // TACTICIAN -> HACKING
    'bulwark': { type: 'damageResistBonus', baseValue: 0, perLevel: 0.015 },   // TANK -> RESIST
    'overdrive': { type: 'critChanceBonus', baseValue: 0, perLevel: 0.01 }     // BERSERKER -> CRIT
};

export const resolveTraits = (profile: CharacterProfile | null, level: number = 1): TraitModifiers => {
    const traits = { ...DEFAULT_TRAITS };
    if (!profile) return traits;

    // 1. Apply Scalable Intrinsic
    const intrinsic = CHARACTER_INTRINSICS[profile.id];
    if (intrinsic) {
        const val = intrinsic.baseValue + (intrinsic.perLevel * level);
        
        // Safety Clamps & Rules
        if (intrinsic.type === 'damageResistBonus') {
            // Cap resist at 40% (0.4)
            traits[intrinsic.type] = Math.min(0.40, val);
        } else if (intrinsic.type === 'terminalEfficiency') {
            // Cap efficiency to prevent instant hacks (max 80% reduction)
            traits[intrinsic.type] = Math.min(0.80, val);
        } else {
            traits[intrinsic.type] = val;
        }
    }

    // 2. Apply Legacy Static Traits (Restored per request)
    if (profile.id === 'rigger') { 
        traits.mineRadiusMod = 1.5; 
        traits.mineBlastMod = 1.2; 
    }
    if (profile.id === 'spectre') { 
        traits.collisionDodgeChance = 0.15; 
    }
    if (profile.id === 'volt') { 
        traits.reactiveLightningChance = 0.2; 
    }
    if (profile.id === 'overdrive') { 
        traits.speedComboScaler = 0.05; 
    }
    if (profile.id === 'striker') { 
        traits.projectileSpeedMod = 1.25; 
    }
    if (profile.id === 'bulwark') { 
        traits.tailIntegrityDamageMod = 0.5; 
    }

    return traits;
};
