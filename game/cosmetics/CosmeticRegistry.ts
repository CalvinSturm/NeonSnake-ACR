
export type CosmeticType = "HUD" | "SKIN";

export interface CosmeticDef {
  id: string;
  type: CosmeticType;
  displayName: string;
  description: string;
  unlockHint: string;
}

export const COSMETIC_REGISTRY: Record<string, CosmeticDef> = {
  // ── DEFAULTS ──
  'AUTO': { id: 'AUTO', type: 'SKIN', displayName: 'Adaptive Camo', description: 'Changes based on class.', unlockHint: 'Default' },
  'CYBER': { id: 'CYBER', type: 'HUD', displayName: 'Cyber One', description: 'Standard issue interface.', unlockHint: 'Default' },
  
  // ── HUD LAYOUTS ──
  'CYBER2': { id: 'CYBER2', type: 'HUD', displayName: 'Cyber II', description: 'Advanced telemetry.', unlockHint: 'Reach Sector 2' },
  'RETRO': { id: 'RETRO', type: 'HUD', displayName: 'Retro Term', description: 'Green phosphor display.', unlockHint: 'Score 5,000 points' },
  'ZEN': { id: 'ZEN', type: 'HUD', displayName: 'Zen Mode', description: 'Reduced clutter.', unlockHint: 'Survive for 2 minutes' },
  'RPG': { id: 'RPG', type: 'HUD', displayName: 'Hero Frame', description: 'MMO style interface.', unlockHint: 'Reach Level 5' },
  'HOLO': { id: 'HOLO', type: 'HUD', displayName: 'Holo Deck', description: '3D projection.', unlockHint: 'Defeat a Boss' },
  'INDUSTRIAL': { id: 'INDUSTRIAL', type: 'HUD', displayName: 'Cockpit', description: 'Heavy industrial overlay.', unlockHint: 'Max out Hull Integrity' },
  
  // ── SNAKE SKINS ──
  'MECH': { id: 'MECH', type: 'SKIN', displayName: 'Mech Standard', description: 'Industrial plating.', unlockHint: 'Score 2,000 points' },
  'FLUX': { id: 'FLUX', type: 'SKIN', displayName: 'Flux Stream', description: 'Pure energy.', unlockHint: 'Maintain 4x Combo' },
  'NEON': { id: 'NEON', type: 'SKIN', displayName: 'Neon Glow', description: 'High contrast lights.', unlockHint: 'Collect 50 XP Orbs' },
  'PIXEL': { id: 'PIXEL', type: 'SKIN', displayName: '8-Bit', description: 'Retro blocks.', unlockHint: 'Unlock Retro HUD' },
  'GLITCH': { id: 'GLITCH', type: 'SKIN', displayName: 'Corrupted', description: 'Signal noise.', unlockHint: 'Survive with < 20% Integrity' },
  'ORGANIC': { id: 'ORGANIC', type: 'SKIN', displayName: 'Biomass', description: 'Living tissue.', unlockHint: 'Reach Sector 4' },
  'PROTOCOL': { id: 'PROTOCOL', type: 'SKIN', displayName: 'Construct', description: 'Virtual geometry.', unlockHint: 'Hack 3 Terminals in one run' },
  'SYSTEM': { id: 'SYSTEM', type: 'SKIN', displayName: 'Mainframe', description: 'Circuit pathways.', unlockHint: 'Reach Level 10' }
};

// Procedural generation for variants to ensure all IDs exist
['CYBER', 'RETRO', 'ZEN', 'RPG', 'HOLO', 'INDUSTRIAL', 'ARCADE', 'GLASS'].forEach(base => {
    for (let i = 2; i <= 7; i++) {
        const id = `${base}${i}`;
        if (!COSMETIC_REGISTRY[id]) {
            COSMETIC_REGISTRY[id] = {
                id,
                type: 'HUD',
                displayName: `${base} MK.${i}`,
                description: `Advanced configuration of ${base}.`,
                unlockHint: `Complete Sector ${i * 2}`
            };
        }
    }
});

['MECH', 'FLUX', 'NEON', 'PIXEL', 'MINIMAL', 'GLITCH', 'ORGANIC', 'PROTOCOL', 'SYSTEM'].forEach(base => {
    for (let i = 2; i <= 6; i++) {
        const id = `${base}${i}`;
        if (!COSMETIC_REGISTRY[id]) {
            COSMETIC_REGISTRY[id] = {
                id,
                type: 'SKIN',
                displayName: `${base} v${i}.0`,
                description: `Evolved ${base} form.`,
                unlockHint: `Score ${(i * 5000).toLocaleString()}`
            };
        }
    }
});
