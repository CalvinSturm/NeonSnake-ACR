
import { UpgradeOption, UpgradeRarity, StatModifier, WeaponStats } from '../types';
import { UpgradeContext, UpgradeId } from './types';
import { DESCRIPTOR_REGISTRY } from '../game/descriptors';

// ─── TYPES ───
type StatPath = keyof WeaponStats | 'globalDamageMod' | 'globalFireRateMod' | 'globalAreaMod' | 'critChance' | 'critMultiplier' | 'hackSpeedMod' | 'scoreMultiplier' | 'foodQualityMod' | 'luck' | 'shieldActive';

interface Aspect {
    path: string;
    label: string;
    base: number; // Used for calculating percentage increases
    isInverse?: boolean; // true for cooldowns/fireRate where lower is better
    isInteger?: boolean; // Round result
    highLeverage?: boolean; // Consumes full slot
}

// ─── ASPECT DEFINITIONS ───
// These map internal stats to upgradable aspects
const ASPECTS: Record<string, Aspect> = {
    // CANNON
    'CANNON_DMG': { path: 'weapon.cannonDamage', label: 'Damage', base: 18 },
    'CANNON_SPD': { path: 'weapon.cannonFireRate', label: 'Cooldown', base: 900, isInverse: true, isInteger: true },
    'CANNON_PROJ': { path: 'weapon.cannonProjectileCount', label: 'Projectiles', base: 1, highLeverage: true, isInteger: true },
    
    // AURA
    'AURA_DMG': { path: 'weapon.auraDamage', label: 'Dmg/Tick', base: 3 },
    'AURA_RAD': { path: 'weapon.auraRadius', label: 'Radius', base: 2.5 },
    
    // MINES
    'MINE_DMG': { path: 'weapon.mineDamage', label: 'Blast Dmg', base: 150 },
    'MINE_CD': { path: 'weapon.mineDropRate', label: 'Drop Rate', base: 2000, isInverse: true, isInteger: true },
    'MINE_RAD': { path: 'weapon.mineRadius', label: 'Blast Radius', base: 3.5 },
    
    // LIGHTNING
    'LIGHT_DMG': { path: 'weapon.chainLightningDamage', label: 'Chain Dmg', base: 0.65 }, // multiplier?
    'LIGHT_RNG': { path: 'weapon.chainLightningRange', label: 'Arc Range', base: 8 },
    
    // NANO SWARM
    'NANO_DMG': { path: 'weapon.nanoSwarmDamage', label: 'Contact Dmg', base: 15 },
    'NANO_CNT': { path: 'weapon.nanoSwarmCount', label: 'Drone Count', base: 1, highLeverage: true, isInteger: true },
    
    // PRISM
    'PRISM_DMG': { path: 'weapon.prismLanceDamage', label: 'Beam Dmg', base: 12 },
    
    // SCATTER
    'SCAT_DMG': { path: 'weapon.neonScatterDamage', label: 'Shard Dmg', base: 5 },
    
    // SERPENT
    'SERP_DMG': { path: 'weapon.voltSerpentDamage', label: 'Spirit Dmg', base: 10 },
    
    // RAIL
    'RAIL_DMG': { path: 'weapon.phaseRailDamage', label: 'Slug Dmg', base: 60 },
    
    // GLOBAL
    'GLOB_DMG': { path: 'globalDamageMod', label: 'Global Dmg', base: 1.0 },
    'GLOB_SPD': { path: 'globalFireRateMod', label: 'Global Speed', base: 1.0 },
    'GLOB_AREA': { path: 'globalAreaMod', label: 'Global Area', base: 1.0 },
    'CRIT_CHC': { path: 'critChance', label: 'Crit Chance', base: 0.05 },
    'CRIT_MUL': { path: 'critMultiplier', label: 'Crit Dmg', base: 1.5 },
    'LUCK': { path: 'luck', label: 'Luck', base: 0.0 }
};

// ─── POOLS ───
// Maps UpgradeID to possible Aspects
const POOLS: Record<string, string[]> = {
    'CANNON': ['CANNON_DMG', 'CANNON_SPD', 'CANNON_PROJ'],
    'AURA': ['AURA_DMG', 'AURA_RAD'],
    'MINES': ['MINE_DMG', 'MINE_CD', 'MINE_RAD'],
    'LIGHTNING': ['LIGHT_DMG', 'LIGHT_RNG'],
    'NANO_SWARM': ['NANO_DMG', 'NANO_CNT'],
    'PRISM_LANCE': ['PRISM_DMG'],
    'NEON_SCATTER': ['SCAT_DMG'],
    'VOLT_SERPENT': ['SERP_DMG'],
    'PHASE_RAIL': ['RAIL_DMG'],
    'SCALAR_DAMAGE': ['GLOB_DMG'],
    'SCALAR_FIRE_RATE': ['GLOB_SPD'],
    'SCALAR_AREA': ['GLOB_AREA'],
    'CRIT': ['CRIT_CHC', 'CRIT_MUL'],
    'LUCK': ['LUCK']
};

// ─── UNLOCK BASE STATS ───
// When a weapon is first acquired, we must initialize its stats from 0 to a usable base value.
const UNLOCK_STATS: Record<string, StatModifier[]> = {
    'AURA': [
        { path: 'weapon.auraRadius', value: 2.5, op: 'ADD', label: 'Base Radius' },
        { path: 'weapon.auraDamage', value: 5, op: 'ADD', label: 'Base Damage' }
    ],
    'MINES': [
        { path: 'weapon.mineRadius', value: 3.5, op: 'ADD', label: 'Base Radius' },
        { path: 'weapon.mineDamage', value: 150, op: 'ADD', label: 'Base Damage' },
        { path: 'weapon.mineDropRate', value: 2000, op: 'SET', label: 'Base Rate' }
    ],
    'NANO_SWARM': [
        { path: 'weapon.nanoSwarmCount', value: 2, op: 'ADD', label: 'Drone Count' },
        { path: 'weapon.nanoSwarmDamage', value: 15, op: 'ADD', label: 'Base Damage' }
    ],
    'LIGHTNING': [
        { path: 'weapon.chainLightningRange', value: 8, op: 'ADD', label: 'Base Range' },
        { path: 'weapon.chainLightningDamage', value: 0.65, op: 'ADD', label: 'Base Chain %' }
    ],
    'PRISM_LANCE': [
         { path: 'weapon.prismLanceDamage', value: 15, op: 'ADD', label: 'Base Damage' }
    ],
    'NEON_SCATTER': [
        { path: 'weapon.neonScatterDamage', value: 8, op: 'ADD', label: 'Base Damage' }
    ],
    'VOLT_SERPENT': [
        { path: 'weapon.voltSerpentDamage', value: 12, op: 'ADD', label: 'Base Damage' }
    ],
    'PHASE_RAIL': [
        { path: 'weapon.phaseRailDamage', value: 60, op: 'ADD', label: 'Base Damage' }
    ],
    'CANNON': [
        { path: 'weapon.cannonDamage', value: 18, op: 'ADD', label: 'Base Damage' },
        { path: 'weapon.cannonFireRate', value: 900, op: 'SET', label: 'Base Rate' },
        { path: 'weapon.cannonProjectileCount', value: 1, op: 'ADD', label: 'Base Count' },
        { path: 'weapon.cannonProjectileSpeed', value: 20, op: 'ADD', label: 'Base Speed' }
    ]
};

// ─── GENERATOR ───

const getRandomAspect = (id: string, exclude: string[] = []): Aspect | null => {
    const poolKeys = POOLS[id] || [];
    const valid = poolKeys.filter(k => !exclude.includes(k));
    if (valid.length === 0) return null;
    const key = valid[Math.floor(Math.random() * valid.length)];
    return ASPECTS[key];
};

const getModifierBounds = (slots: number) => {
    // 1 Slot: 5-10%
    if (slots === 1) return { min: 0.05, max: 0.10 };
    // 2 Slots: 6-12% each
    if (slots === 2) return { min: 0.06, max: 0.12 };
    // 3 Slots: 8-15% each
    if (slots === 3) return { min: 0.08, max: 0.15 };
    return { min: 0.05, max: 0.10 };
};

const formatValue = (val: number, isPct: boolean) => {
    if (isPct) return `${val > 0 ? '+' : ''}${Math.round(val * 100)}%`;
    return `${val > 0 ? '+' : ''}${Math.round(val * 10) / 10}`;
};

export const UPGRADE_DEFINITIONS: Record<string, (context: UpgradeContext, rarity: UpgradeRarity) => UpgradeOption> = {
    // DYNAMIC GENERATOR WRAPPER
    // We proxy all specific calls to a central generator function
    CANNON: (c, r) => generateUpgrade('CANNON', c, r),
    AURA: (c, r) => generateUpgrade('AURA', c, r),
    MINES: (c, r) => generateUpgrade('MINES', c, r),
    LIGHTNING: (c, r) => generateUpgrade('LIGHTNING', c, r),
    NANO_SWARM: (c, r) => generateUpgrade('NANO_SWARM', c, r),
    SHIELD: (c, r) => generateUtility('SHIELD', r, 'Ion Shield', 'Absorbs one lethal hit.'),
    CRITICAL: (c, r) => generateUpgrade('CRIT', c, r),
    FOOD: (c, r) => generateUtility('FOOD', r, 'Enzymes', 'Increases healing/XP from food.'),
    PRISM_LANCE: (c, r) => generateUpgrade('PRISM_LANCE', c, r),
    NEON_SCATTER: (c, r) => generateUpgrade('NEON_SCATTER', c, r),
    VOLT_SERPENT: (c, r) => generateUpgrade('VOLT_SERPENT', c, r),
    PHASE_RAIL: (c, r) => generateUpgrade('PHASE_RAIL', c, r),
    REFLECTOR_MESH: (c, r) => generateUtility('REFLECTOR_MESH', r, 'Reflector', 'Chance to reflect projectiles.'),
    GHOST_COIL: (c, r) => generateUtility('GHOST_COIL', r, 'Ghost Coil', 'Phasing after damage.'),
    NEURAL_MAGNET: (c, r) => generateUtility('NEURAL_MAGNET', r, 'Magnet', 'Pull range increased.'),
    OVERCLOCK: (c, r) => generateUtility('OVERCLOCK', r, 'Overclock', 'Burst speed/fire rate.'),
    ECHO_CACHE: (c, r) => generateUtility('ECHO_CACHE', r, 'Echo Cache', 'Stores damage, releases burst.'),
    TERMINAL_PROTOCOL: (c, r) => generateUtility('TERMINAL_PROTOCOL', r, 'Hacking', 'Faster terminal overrides.'),
    OVERRIDE_PROTOCOL: (c, r) => generateUtility('OVERRIDE_PROTOCOL', r, 'Override', 'Force unlock weapon slot.'),
    SCALAR_DAMAGE: (c, r) => generateUpgrade('SCALAR_DAMAGE', c, r),
    SCALAR_FIRE_RATE: (c, r) => generateUpgrade('SCALAR_FIRE_RATE', c, r),
    SCALAR_AREA: (c, r) => generateUpgrade('SCALAR_AREA', c, r),
    LUCK: (c, r) => generateUpgrade('LUCK', c, r)
};

function generateUpgrade(id: UpgradeId | string, context: UpgradeContext, rarity: UpgradeRarity): UpgradeOption {
    const desc = DESCRIPTOR_REGISTRY[id as string] || DESCRIPTOR_REGISTRY['CANNON']; // Fallback
    const modifiers: StatModifier[] = [];
    const statLabels: string[] = [];

    // 1. DETERMINE UNLOCK VS UPGRADE
    // Logic: If it's a weapon ID and current level is 0, it's an UNLOCK card (1 slot fixed)
    let isUnlock = false;
    let weaponLevel = 0;
    
    // Robustly check current level using map
    const levelKey = getWeaponLevelKey(id as string);
    if (levelKey) {
        // Dynamic lookup to ensure we don't miss mapping
        const keyPart = levelKey.split('.')[1];
        // @ts-ignore
        const ctxLevel = context.weapon[keyPart];
        if (ctxLevel !== undefined) weaponLevel = ctxLevel;
    } else {
        // Fallback for non-weapon scalars (crit, etc) - level 0 implies new? No, scalars are always upgrades
        if (desc.category !== 'WEAPON') weaponLevel = 1; 
    }

    if (desc.category === 'WEAPON' && weaponLevel === 0) {
        isUnlock = true;
    }

    // 2. DETERMINE SLOT COUNT
    let slots = 1;
    if (!isUnlock) {
        if (rarity === 'RARE' || rarity === 'ULTRA_RARE') slots = 2;
        if (rarity === 'LEGENDARY' || rarity === 'MEGA_RARE') slots = 3;
        // Overclocked acts as Legendary
        if (rarity === 'OVERCLOCKED') slots = 3;
    }

    // 3. GENERATE MODIFIERS
    if (isUnlock) {
        // Unlock Card: Just enable the weapon
        const statKey = getWeaponLevelKey(id);
        if (statKey) {
            // A. Increment Level
            modifiers.push({
                path: statKey,
                value: 1,
                op: 'ADD', 
                label: 'System Online'
            });
            statLabels.push('INSTALL NEW PROTOCOL');

            // B. Apply Base Stats (Critical for initial functionality)
            const baseStats = UNLOCK_STATS[id];
            if (baseStats) {
                modifiers.push(...baseStats);
            }
        }
    } else {
        // Upgrade Card
        const usedKeys: string[] = [];
        const bounds = getModifierBounds(slots);

        for (let i = 0; i < slots; i++) {
            const aspect = getRandomAspect(id, []); 
            let distinctAspect = getRandomAspect(id, usedKeys);
            if (!distinctAspect) distinctAspect = aspect; 
            
            if (distinctAspect) {
                if (distinctAspect !== aspect) usedKeys.push(distinctAspect.path); 

                // Calculate Value
                const pct = bounds.min + Math.random() * (bounds.max - bounds.min);
                
                // High Leverage check
                if (distinctAspect.highLeverage) {
                    modifiers.push({
                        path: distinctAspect.path,
                        value: 1,
                        op: 'ADD',
                        label: `+1 ${distinctAspect.label}`
                    });
                    statLabels.push(`▲ ${distinctAspect.label} +1`);
                } else {
                    // Standard Percentage Scaling
                    let val = distinctAspect.base * pct;
                    if (distinctAspect.isInteger) val = Math.round(val) || 1;
                    
                    // Inverse logic (Cooldown)
                    if (distinctAspect.isInverse) val = -val;

                    modifiers.push({
                        path: distinctAspect.path,
                        value: val,
                        op: 'ADD',
                        label: `+${Math.round(pct*100)}% ${distinctAspect.label}`
                    });
                    
                    const sign = val > 0 ? '+' : '';
                    const displayPct = Math.round(pct * 100);
                    // UX Requirement: Delta only
                    statLabels.push(`▲ ${distinctAspect.label} ${sign}${displayPct}%`);
                }
            }
        }
    }

    return {
        id: desc.id,
        title: desc.name,
        description: desc.description,
        color: desc.color,
        category: desc.category,
        rarity: rarity,
        icon: desc.icon,
        isNewWeapon: isUnlock,
        stats: statLabels,
        modifiers: modifiers
    };
}

// Helper for Utilities which are simple toggles or single stats not in the pool
function generateUtility(id: string, rarity: UpgradeRarity, name: string, descText: string): UpgradeOption {
    const desc = DESCRIPTOR_REGISTRY[id] || { id, name, description: descText, color: 'text-white', category: 'UTILITY', rarity: 'COMMON', icon: '?' };
    
    // Utilities usually just add level or toggle boolean
    // We can scale effect by rarity if applicable (e.g. Luck)
    
    const modifiers: StatModifier[] = [];
    const statLabels: string[] = [];
    
    let multiplier = 1;
    if (rarity === 'RARE') multiplier = 1.5;
    if (rarity === 'LEGENDARY') multiplier = 2.0;

    if (id === 'SHIELD') {
        modifiers.push({ path: 'shieldActive', value: 1, op: 'SET', label: 'Shield Active' });
        statLabels.push('▲ ION SHIELD ONLINE');
    } else if (id === 'LUCK') {
        const val = 0.05 * multiplier;
        modifiers.push({ path: 'luck', value: val, op: 'ADD', label: 'Luck' });
        modifiers.push({ path: 'weapon.luckLevel', value: 1, op: 'ADD', label: 'Level' });
        statLabels.push(`▲ Luck +${Math.round(val*100)}%`);
    } else if (id === 'FOOD') {
        const val = 0.2 * multiplier;
        modifiers.push({ path: 'foodQualityMod', value: val, op: 'ADD', label: 'Food Quality' });
        statLabels.push(`▲ Food Quality +${Math.round(val*100)}%`);
    } else if (id === 'TERMINAL_PROTOCOL') {
        const speed = 0.25 * multiplier;
        modifiers.push({ path: 'hackSpeedMod', value: speed, op: 'ADD', label: 'Hack Speed' });
        statLabels.push(`▲ Hack Speed +${Math.round(speed*100)}%`);
    } else {
         // Generic Level Up for util
         const key = getWeaponLevelKey(id);
         if (key) {
             modifiers.push({ path: key, value: 1, op: 'ADD', label: 'Level' });
             statLabels.push('▲ EFFECTIVENESS +1');
         }
    }

    return {
        id: desc.id,
        title: desc.name,
        description: desc.description,
        color: desc.color,
        category: desc.category,
        rarity: rarity,
        icon: desc.icon,
        stats: statLabels,
        modifiers: modifiers
    };
}

function getWeaponLevelKey(id: string): string | null {
    const map: Record<string, string> = {
        'CANNON': 'weapon.cannonLevel',
        'AURA': 'weapon.auraLevel',
        'MINES': 'weapon.mineLevel',
        'LIGHTNING': 'weapon.chainLightningLevel',
        'NANO_SWARM': 'weapon.nanoSwarmLevel',
        'PRISM_LANCE': 'weapon.prismLanceLevel',
        'NEON_SCATTER': 'weapon.neonScatterLevel',
        'VOLT_SERPENT': 'weapon.voltSerpentLevel',
        'PHASE_RAIL': 'weapon.phaseRailLevel',
        'REFLECTOR_MESH': 'weapon.reflectorMeshLevel',
        'GHOST_COIL': 'weapon.ghostCoilLevel',
        'NEURAL_MAGNET': 'weapon.neuralMagnetLevel',
        'OVERCLOCK': 'weapon.overclockLevel',
        'ECHO_CACHE': 'weapon.echoCacheLevel',
        'LUCK': 'weapon.luckLevel'
    };
    return map[id] || null;
}
