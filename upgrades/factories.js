import { DESCRIPTOR_REGISTRY } from '../game/descriptors';
// Helper to hydrate options from registry
const createOption = (id) => {
    const desc = DESCRIPTOR_REGISTRY[id];
    if (!desc) {
        // Fallback for safety, though typescript should catch this with UpgradeId type
        return {
            id,
            title: 'UNKNOWN UPGRADE',
            description: 'Data corrupted.',
            color: 'text-gray-500',
            category: 'SYSTEM',
            rarity: 'COMMON',
            icon: '?'
        };
    }
    return {
        id: desc.id,
        title: desc.name,
        description: desc.description,
        color: desc.color,
        category: desc.category,
        rarity: desc.rarity,
        icon: desc.icon
    };
};
export const UPGRADE_DEFINITIONS = {
    CANNON: () => createOption('CANNON'),
    AURA: () => createOption('AURA'),
    MINES: () => createOption('MINES'),
    LIGHTNING: () => createOption('LIGHTNING'),
    SHOCKWAVE: () => createOption('SHOCKWAVE'),
    NANO_SWARM: () => createOption('NANO_SWARM'),
    SHIELD: () => createOption('SHIELD'),
    CRITICAL: () => createOption('CRITICAL'),
    FOOD: () => createOption('FOOD'),
    PRISM_LANCE: () => createOption('PRISM_LANCE'),
    NEON_SCATTER: () => createOption('NEON_SCATTER'),
    VOLT_SERPENT: () => createOption('VOLT_SERPENT'),
    PHASE_RAIL: () => createOption('PHASE_RAIL'),
    REFLECTOR_MESH: () => createOption('REFLECTOR_MESH'),
    GHOST_COIL: () => createOption('GHOST_COIL'),
    EMP_BLOOM: () => createOption('EMP_BLOOM'),
    NEURAL_MAGNET: () => createOption('NEURAL_MAGNET'),
    OVERCLOCK: () => createOption('OVERCLOCK'),
    ECHO_CACHE: () => createOption('ECHO_CACHE'),
    TERMINAL_PROTOCOL: () => createOption('TERMINAL_PROTOCOL'),
    OVERRIDE_PROTOCOL: () => createOption('OVERRIDE_PROTOCOL'),
    SCALAR_DAMAGE: () => createOption('SCALAR_DAMAGE'),
    SCALAR_FIRE_RATE: () => createOption('SCALAR_FIRE_RATE'),
    SCALAR_AREA: () => createOption('SCALAR_AREA')
};
