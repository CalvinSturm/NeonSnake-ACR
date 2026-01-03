
import { CharacterProfile } from '../types';

export interface TraitModifiers {
    // Rigger: Increased mine effectiveness
    mineRadiusMod: number;
    mineBlastMod: number;
    
    // Bulwark: Damage reduction on tail
    tailIntegrityDamageMod: number;
    
    // Spectre: Evasion chance
    collisionDodgeChance: number;
    
    // Volt: Retaliation chance
    reactiveLightningChance: number;
    
    // Overdrive: Speed scaling per combo point
    speedComboScaler: number; 
    
    // Striker: Projectile ballistics
    projectileSpeedMod: number;
}

const DEFAULT_TRAITS: TraitModifiers = {
    mineRadiusMod: 1.0,
    mineBlastMod: 1.0,
    tailIntegrityDamageMod: 1.0,
    collisionDodgeChance: 0.0,
    reactiveLightningChance: 0.0,
    speedComboScaler: 0.0,
    projectileSpeedMod: 1.0
};

export const resolveTraits = (profile: CharacterProfile | null): TraitModifiers => {
    const traits = { ...DEFAULT_TRAITS };
    if (!profile) return traits;

    switch (profile.id) {
        case 'rigger':
            traits.mineRadiusMod = 1.5; // +50% Radius
            traits.mineBlastMod = 1.2;  // +20% Damage
            break;
        case 'bulwark':
            traits.tailIntegrityDamageMod = 0.5; // 50% damage reduction
            break;
        case 'spectre':
            traits.collisionDodgeChance = 0.15; // 15% dodge
            break;
        case 'volt':
            traits.reactiveLightningChance = 0.2; // 20% chance to zap back (Updated)
            break;
        case 'overdrive':
            traits.speedComboScaler = 0.05; // +5% speed per combo
            break;
        case 'striker':
            traits.projectileSpeedMod = 1.25; // +25% speed (Updated)
            break;
    }
    return traits;
};
