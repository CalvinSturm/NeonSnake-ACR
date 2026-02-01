
import { CharacterProfile } from '../types';

export interface TraitModifiers {
    // ── MINOR TRAITS (Stats) ──
    projectileSpeedMod: number;       // Striker
    collisionDodgeChance: number;     // Spectre
    areaOfEffectMod: number;          // Volt
    mineDurationMod: number;          // Rigger
    damageReductionMod: number;       // Bulwark
    moveSpeedMod: number;             // Overdrive

    // ── MAJOR TRAITS (Scaling) ──
    // Added to Base stats dynamically
    fireRatePerLevel: number;         // Striker
    magnetRangePerLevel: number;      // Spectre
    critChancePerLevel: number;       // Volt
    constructDamagePerLevel: number;  // Rigger
    regenPerLevel: number;            // Bulwark
    damagePerCombo: number;           // Overdrive
    
    // Legacy / Derived
    mineRadiusMod: number;            
    
    // New Traits (Fixing Type Errors)
    reactiveLightningChance: number;
    tailIntegrityDamageMod: number;
    speedComboScaler: number;
}

const DEFAULT_TRAITS: TraitModifiers = {
    projectileSpeedMod: 1.0,
    collisionDodgeChance: 0.0,
    areaOfEffectMod: 1.0,
    mineDurationMod: 1.0,
    damageReductionMod: 0.0,
    moveSpeedMod: 1.0,
    
    fireRatePerLevel: 0.0,
    magnetRangePerLevel: 0.0,
    critChancePerLevel: 0.0,
    constructDamagePerLevel: 0.0,
    regenPerLevel: 0.0,
    damagePerCombo: 0.0,
    
    mineRadiusMod: 1.0,
    
    reactiveLightningChance: 0.0,
    tailIntegrityDamageMod: 1.0,
    speedComboScaler: 0.0
};

/**
 * Calculates current trait modifiers based on character profile and current level.
 * @param profile Selected Character
 * @param level Current System Level (starts at 1)
 */
export const resolveTraits = (profile: CharacterProfile | null, level: number = 1): TraitModifiers => {
    const traits = { ...DEFAULT_TRAITS };
    if (!profile) return traits;

    // Apply Base Traits
    switch (profile.id) {
        case 'striker':
            traits.projectileSpeedMod = 1.20; // Minor: +20% Speed
            traits.fireRatePerLevel = 0.01;   // Major: +1% Fire Rate / Level
            break;
            
        case 'spectre':
            traits.collisionDodgeChance = 0.15; // Minor: 15% Dodge
            traits.magnetRangePerLevel = 0.02;  // Major: +2% Magnet Range / Level
            break;
            
        case 'volt':
            traits.areaOfEffectMod = 1.20;    // Minor: +20% AOE
            traits.critChancePerLevel = 0.005; // Major: +0.5% Crit / Level
            break;
            
        case 'rigger':
            traits.mineDurationMod = 1.30;    // Minor: +30% Duration
            traits.constructDamagePerLevel = 0.015; // Major: +1.5% Construct Dmg / Level
            traits.mineRadiusMod = 1.2;       // Base buff for usability
            break;
            
        case 'bulwark':
            traits.damageReductionMod = 0.15; // Minor: -15% Damage Taken
            traits.regenPerLevel = 0.2;       // Major: +0.2 HP/sec / Level
            break;
            
        case 'overdrive':
            traits.moveSpeedMod = 1.10;       // Minor: +10% Speed
            traits.damagePerCombo = 0.01;     // Major: +1% Dmg / Combo Point
            break;
    }

    // Apply Derived Properties
    if (traits.damageReductionMod > 0) {
        traits.tailIntegrityDamageMod = 1.0 - traits.damageReductionMod;
    }

    return traits;
};
