/* ─────────────────────────────
   Upgrade Factories (PURE)
   ───────────────────────────── */
const getRarity = (level) => {
    if (level === 0)
        return 'COMMON'; // Unlocking is common
    if (level < 3)
        return 'COMMON';
    if (level < 6)
        return 'RARE';
    return 'LEGENDARY';
};
export const UPGRADE_FACTORIES = {
    // ── WEAPONS ──
    CANNON: ({ weapon }) => ({
        id: 'CANNON',
        title: weapon.cannonLevel === 0 ? 'UNLOCK AUTO CANNON' : `AUTO CANNON MK ${weapon.cannonLevel + 1}`,
        description: weapon.cannonLevel >= 3 ? 'Adds extra projectile and increases speed.' : 'Increases fire rate and projectile damage.',
        color: 'text-yellow-400',
        category: 'WEAPON',
        rarity: getRarity(weapon.cannonLevel),
        icon: '🔫',
        isNewWeapon: weapon.cannonLevel === 0
    }),
    AURA: ({ weapon }) => ({
        id: 'AURA',
        title: weapon.auraLevel === 0 ? 'UNLOCK TAIL AURA' : `TAIL AURA MK ${weapon.auraLevel + 1}`,
        description: 'Expands the damaging field radius and intensity.',
        color: 'text-red-400',
        category: 'WEAPON',
        rarity: getRarity(weapon.auraLevel),
        icon: '⭕',
        isNewWeapon: weapon.auraLevel === 0
    }),
    NANO_SWARM: ({ weapon }) => ({
        id: 'NANO_SWARM',
        title: weapon.nanoSwarmLevel === 0 ? 'UNLOCK NANO SWARM' : `NANO SWARM MK ${weapon.nanoSwarmLevel + 1}`,
        description: weapon.nanoSwarmLevel === 0 ? 'Deploy 2 drones to orbit and protect you.' : 'Adds more drones and increases orbit speed.',
        color: 'text-pink-400',
        category: 'WEAPON',
        rarity: getRarity(weapon.nanoSwarmLevel),
        icon: '🛰️',
        isNewWeapon: weapon.nanoSwarmLevel === 0
    }),
    MINES: ({ weapon }) => ({
        id: 'MINES',
        title: weapon.mineLevel === 0 ? 'UNLOCK PLASMA MINES' : `PLASMA MINES MK ${weapon.mineLevel + 1}`,
        description: weapon.mineLevel === 0 ? 'Periodically deploy explosive mines from tail.' : 'Mines trigger larger explosions.',
        color: 'text-orange-400',
        category: 'WEAPON',
        rarity: getRarity(weapon.mineLevel),
        icon: '💣',
        isNewWeapon: weapon.mineLevel === 0
    }),
    LIGHTNING: ({ weapon }) => ({
        id: 'LIGHTNING',
        title: weapon.chainLightningLevel === 0 ? 'UNLOCK VOLTAIC ARC' : `VOLTAIC ARC MK ${weapon.chainLightningLevel + 1}`,
        description: 'Attacks chain lightning to more distant enemies.',
        color: 'text-cyan-400',
        category: 'WEAPON',
        rarity: getRarity(weapon.chainLightningLevel),
        icon: '⚡',
        isNewWeapon: weapon.chainLightningLevel === 0
    }),
    PRISM_LANCE: ({ weapon }) => ({
        id: 'PRISM_LANCE',
        title: weapon.prismLanceLevel === 0 ? 'UNLOCK PRISM LANCE' : `PRISM LANCE MK ${weapon.prismLanceLevel + 1}`,
        description: 'Fires a piercing energy beam. Refracts on impact.',
        color: 'text-teal-300',
        category: 'WEAPON',
        rarity: getRarity(weapon.prismLanceLevel),
        icon: '💎',
        isNewWeapon: weapon.prismLanceLevel === 0
    }),
    NEON_SCATTER: ({ weapon }) => ({
        id: 'NEON_SCATTER',
        title: weapon.neonScatterLevel === 0 ? 'UNLOCK NEON SCATTER' : `NEON SCATTER MK ${weapon.neonScatterLevel + 1}`,
        description: 'Short-range burst of shotgun shards. High close-up damage.',
        color: 'text-pink-500',
        category: 'WEAPON',
        rarity: getRarity(weapon.neonScatterLevel),
        icon: '🎆',
        isNewWeapon: weapon.neonScatterLevel === 0
    }),
    VOLT_SERPENT: ({ weapon }) => ({
        id: 'VOLT_SERPENT',
        title: weapon.voltSerpentLevel === 0 ? 'UNLOCK VOLT SERPENT' : `VOLT SERPENT MK ${weapon.voltSerpentLevel + 1}`,
        description: 'Summons a homing lightning snake that hunts targets.',
        color: 'text-blue-500',
        category: 'WEAPON',
        rarity: getRarity(weapon.voltSerpentLevel),
        icon: '🐉',
        isNewWeapon: weapon.voltSerpentLevel === 0
    }),
    PHASE_RAIL: ({ weapon }) => ({
        id: 'PHASE_RAIL',
        title: weapon.phaseRailLevel === 0 ? 'UNLOCK PHASE RAIL' : `PHASE RAIL MK ${weapon.phaseRailLevel + 1}`,
        description: 'Charges up to fire a massive, piercing railgun shot.',
        color: 'text-purple-500',
        category: 'WEAPON',
        rarity: getRarity(weapon.phaseRailLevel),
        icon: '🔦',
        isNewWeapon: weapon.phaseRailLevel === 0
    }),
    // ── DEFENSE ──
    SHIELD: ({ shieldActive }) => ({
        id: 'SHIELD',
        title: shieldActive ? 'SHIELD REINFORCEMENT' : 'ACTIVATE SHIELD',
        description: shieldActive ? 'Adds a temporary defense layer.' : 'Protects against one segment collision.',
        color: 'text-cyan-400',
        category: 'DEFENSE',
        rarity: shieldActive ? 'RARE' : 'COMMON',
        icon: '🛡️'
    }),
    REFLECTOR_MESH: ({ weapon }) => ({
        id: 'REFLECTOR_MESH',
        title: weapon.reflectorMeshLevel === 0 ? 'INSTALL REFLECTOR MESH' : `REFLECTOR MESH MK ${weapon.reflectorMeshLevel + 1}`,
        description: 'Chance to reflect enemy projectiles back at them.',
        color: 'text-cyan-200',
        category: 'DEFENSE',
        rarity: 'RARE',
        icon: '📡'
    }),
    GHOST_COIL: ({ weapon }) => ({
        id: 'GHOST_COIL',
        title: weapon.ghostCoilLevel === 0 ? 'INSTALL GHOST COIL' : `GHOST COIL MK ${weapon.ghostCoilLevel + 1}`,
        description: 'Briefly phase through enemies to avoid damage on impact.',
        color: 'text-gray-300',
        category: 'DEFENSE',
        rarity: 'LEGENDARY',
        icon: '👻'
    }),
    EMP_BLOOM: ({ weapon }) => ({
        id: 'EMP_BLOOM',
        title: weapon.empBloomLevel === 0 ? 'INSTALL EMP BLOOM' : `EMP BLOOM MK ${weapon.empBloomLevel + 1}`,
        description: 'Taking damage triggers a local EMP stun burst.',
        color: 'text-blue-300',
        category: 'DEFENSE',
        rarity: 'RARE',
        icon: '🎇'
    }),
    // ── UTILITY / ECONOMY / SYSTEM ──
    SHOCKWAVE: ({ weapon }) => ({
        id: 'SHOCKWAVE',
        title: `SYSTEM SHOCK MK ${weapon.shockwaveLevel + 1}`,
        description: 'Increases EMP blast radius and reduces cooldown.',
        color: 'text-blue-400',
        category: 'SYSTEM',
        rarity: 'COMMON',
        icon: '💥'
    }),
    CRITICAL: ({ critChance }) => ({
        id: 'CRITICAL',
        title: 'CRIT ALGORITHM',
        description: `Increase Crit Chance to ${Math.floor((critChance + 0.06) * 100)}% and damage.`,
        color: 'text-purple-400',
        category: 'SYSTEM',
        rarity: 'COMMON',
        icon: '🎯'
    }),
    FOOD: () => ({
        id: 'FOOD',
        title: 'GENETIC SYNERGY',
        description: 'Increases XP, Score multiplier, and Magnet range.',
        color: 'text-green-400',
        category: 'ECONOMY',
        rarity: 'COMMON',
        icon: '🧬'
    }),
    NEURAL_MAGNET: ({ weapon }) => ({
        id: 'NEURAL_MAGNET',
        title: weapon.neuralMagnetLevel === 0 ? 'ACTIVATE NEURAL MAGNET' : `NEURAL MAGNET MK ${weapon.neuralMagnetLevel + 1}`,
        description: 'Killed enemies pull nearby XP and pickups towards you.',
        color: 'text-indigo-400',
        category: 'ECONOMY',
        rarity: 'RARE',
        icon: '🧲'
    }),
    OVERCLOCK: ({ weapon }) => ({
        id: 'OVERCLOCK',
        title: weapon.overclockLevel === 0 ? 'INSTALL OVERCLOCK INJECTOR' : `OVERCLOCK MK ${weapon.overclockLevel + 1}`,
        description: 'Periodically boosts fire rate and movement speed.',
        color: 'text-red-500',
        category: 'UTILITY',
        rarity: 'LEGENDARY',
        icon: '🚀'
    }),
    ECHO_CACHE: ({ weapon }) => ({
        id: 'ECHO_CACHE',
        title: weapon.echoCacheLevel === 0 ? 'INSTALL ECHO CACHE' : `ECHO CACHE MK ${weapon.echoCacheLevel + 1}`,
        description: 'Stores damage dealt and releases it as a shockwave.',
        color: 'text-orange-300',
        category: 'UTILITY',
        rarity: 'RARE',
        icon: '💾'
    }),
    TERMINAL_PROTOCOL: ({ hackSpeedMod }) => ({
        id: 'TERMINAL_PROTOCOL',
        title: 'TERMINAL OPTIMIZER',
        description: 'Hacking terminals is faster and yields more rewards.',
        color: 'text-fuchsia-400',
        category: 'HACKING',
        rarity: 'COMMON',
        icon: '📶'
    })
};
