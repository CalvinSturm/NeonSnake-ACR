
export type CosmeticType = "HUD" | "SKIN";

export interface CosmeticDef {
  id: string;
  type: CosmeticType;
  displayName: string;
  description: string;
  unlockHint: string;
  tier: 1 | 2 | 3 | 4;
  cost: number;
}

export const COSMETIC_REGISTRY: Record<string, CosmeticDef> = {
  // ── TIER 1: NEOPHYTE (Stages 1-5) ──
  'AUTO': { id: 'AUTO', type: 'SKIN', displayName: 'Adaptive Camo', description: 'Changes based on class.', unlockHint: 'Default', tier: 1, cost: 0 },
  'CYBER': { id: 'CYBER', type: 'HUD', displayName: 'Cyber One', description: 'Standard issue.', unlockHint: 'Default', tier: 1, cost: 0 },
  
  'MECH': { id: 'MECH', type: 'SKIN', displayName: 'Mech Frame', description: 'Reinforced plating.', unlockHint: 'Reach Stage 2', tier: 1, cost: 100 },
  'RETRO': { id: 'RETRO', type: 'HUD', displayName: 'Retro Term', description: 'Green phosphor.', unlockHint: 'Reach Stage 2', tier: 1, cost: 100 },
  
  'FLUX': { id: 'FLUX', type: 'SKIN', displayName: 'Flux Stream', description: 'Energy conduit.', unlockHint: 'Reach Stage 3', tier: 1, cost: 150 },
  'ZEN': { id: 'ZEN', type: 'HUD', displayName: 'Zen Mode', description: 'Reduced clutter.', unlockHint: 'Reach Stage 3', tier: 1, cost: 150 },
  
  'NEON': { id: 'NEON', type: 'SKIN', displayName: 'Neon Glow', description: 'High contrast.', unlockHint: 'Reach Stage 4', tier: 1, cost: 200 },
  'INDUSTRIAL': { id: 'INDUSTRIAL', type: 'HUD', displayName: 'Heavy Industry', description: 'Analog gauges.', unlockHint: 'Reach Stage 4', tier: 1, cost: 200 },
  
  'PIXEL': { id: 'PIXEL', type: 'SKIN', displayName: '8-Bit', description: 'Low resolution.', unlockHint: 'Clear NEOPHYTE (Stage 5)', tier: 1, cost: 250 },
  'MINIMAL': { id: 'MINIMAL', type: 'SKIN', displayName: 'Vector', description: 'Wireframe construct.', unlockHint: 'Clear NEOPHYTE (Stage 5)', tier: 1, cost: 250 },
  'ORGANIC': { id: 'ORGANIC', type: 'SKIN', displayName: 'Biomass', description: 'Living tissue.', unlockHint: 'Clear NEOPHYTE (Stage 5)', tier: 1, cost: 250 },

  // ── TIER 2: OPERATOR (Stages 6-9) ──
  'GLITCH': { id: 'GLITCH', type: 'SKIN', displayName: 'Corrupted', description: 'Signal noise.', unlockHint: 'Reach Stage 6 on OPERATOR+', tier: 2, cost: 400 },
  'RPG': { id: 'RPG', type: 'HUD', displayName: 'Hero Frame', description: 'MMO interface.', unlockHint: 'Reach Stage 6 on OPERATOR+', tier: 2, cost: 400 },

  'PROTOCOL': { id: 'PROTOCOL', type: 'SKIN', displayName: 'Construct', description: 'Virtual geometry.', unlockHint: 'Reach Stage 7 on OPERATOR+', tier: 2, cost: 450 },
  'HOLO': { id: 'HOLO', type: 'HUD', displayName: 'Holo Deck', description: '3D projection.', unlockHint: 'Reach Stage 7 on OPERATOR+', tier: 2, cost: 450 },

  'SYSTEM': { id: 'SYSTEM', type: 'SKIN', displayName: 'Mainframe', description: 'Circuit pathways.', unlockHint: 'Reach Stage 8 on OPERATOR+', tier: 2, cost: 500 },
  'ARCADE': { id: 'ARCADE', type: 'HUD', displayName: 'Cabinet', description: 'Coin-op overlay.', unlockHint: 'Reach Stage 8 on OPERATOR+', tier: 2, cost: 500 },

  'MECH2': { id: 'MECH2', type: 'SKIN', displayName: 'Tank Treads', description: 'Heavy armor.', unlockHint: 'Clear OPERATOR (Stage 9)', tier: 2, cost: 600 },
  'FLUX2': { id: 'FLUX2', type: 'SKIN', displayName: 'Solar Node', description: 'Radiant energy.', unlockHint: 'Clear OPERATOR (Stage 9)', tier: 2, cost: 600 },
  'NEON2': { id: 'NEON2', type: 'SKIN', displayName: 'Light Cycle', description: 'Grid racer.', unlockHint: 'Clear OPERATOR (Stage 9)', tier: 2, cost: 600 },
  'PIXEL2': { id: 'PIXEL2', type: 'SKIN', displayName: 'Voxel', description: '3D Cubes.', unlockHint: 'Clear OPERATOR (Stage 9)', tier: 2, cost: 600 },
  'MINIMAL2': { id: 'MINIMAL2', type: 'SKIN', displayName: 'Geometry', description: 'Abstract shapes.', unlockHint: 'Clear OPERATOR (Stage 9)', tier: 2, cost: 600 },

  // ── TIER 3: VETERAN (Stages 10-13) ──
  'ORGANIC2': { id: 'ORGANIC2', type: 'SKIN', displayName: 'Chitin', description: 'Insectoid armor.', unlockHint: 'Reach Stage 10 on VETERAN+', tier: 3, cost: 800 },
  'CYBER2': { id: 'CYBER2', type: 'HUD', displayName: 'Cyber II', description: 'Advanced telemetry.', unlockHint: 'Reach Stage 10 on VETERAN+', tier: 3, cost: 800 },

  'GLITCH2': { id: 'GLITCH2', type: 'SKIN', displayName: 'MissingTex', description: 'Texture failure.', unlockHint: 'Reach Stage 11 on VETERAN+', tier: 3, cost: 900 },
  'GLASS': { id: 'GLASS', type: 'HUD', displayName: 'Aero Glass', description: 'Frosted blur.', unlockHint: 'Reach Stage 11 on VETERAN+', tier: 3, cost: 900 },

  'PROTOCOL2': { id: 'PROTOCOL2', type: 'SKIN', displayName: 'Drone', description: 'Spherical units.', unlockHint: 'Reach Stage 12 on VETERAN+', tier: 3, cost: 1000 },
  'RETRO2': { id: 'RETRO2', type: 'HUD', displayName: 'Vector', description: 'Oscilloscope.', unlockHint: 'Reach Stage 12 on VETERAN+', tier: 3, cost: 1000 },

  'SYSTEM2': { id: 'SYSTEM2', type: 'SKIN', displayName: 'Hex Grid', description: 'Honeycomb logic.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'MECH3': { id: 'MECH3', type: 'SKIN', displayName: 'Exo Spine', description: 'Vertebral column.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'FLUX3': { id: 'FLUX3', type: 'SKIN', displayName: 'Plasma', description: 'Unstable core.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'NEON3': { id: 'NEON3', type: 'SKIN', displayName: 'Synth Sun', description: 'Retrowave vibes.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'PIXEL3': { id: 'PIXEL3', type: 'SKIN', displayName: 'Dither', description: 'Noise pattern.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'MINIMAL3': { id: 'MINIMAL3', type: 'SKIN', displayName: 'Blueprint', description: 'Technical drawing.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },
  'ORGANIC3': { id: 'ORGANIC3', type: 'SKIN', displayName: 'Tendril', description: 'Deep creature.', unlockHint: 'Clear VETERAN (Stage 13)', tier: 3, cost: 1200 },

  // ── TIER 4: CYBERPSYCHO (Stages 14-17+) ──
  'GLITCH3': { id: 'GLITCH3', type: 'SKIN', displayName: 'Echo', description: 'Time smear.', unlockHint: 'Reach Stage 14 on INSANE', tier: 4, cost: 2000 },
  'HOLO2': { id: 'HOLO2', type: 'HUD', displayName: 'Projector', description: 'Floor projection.', unlockHint: 'Reach Stage 14 on INSANE', tier: 4, cost: 2000 },

  'PROTOCOL3': { id: 'PROTOCOL3', type: 'SKIN', displayName: 'Aegis', description: 'Rotating shields.', unlockHint: 'Reach Stage 15 on INSANE', tier: 4, cost: 2500 },
  'RPG2': { id: 'RPG2', type: 'HUD', displayName: 'MMO Raid', description: 'Full party stats.', unlockHint: 'Reach Stage 15 on INSANE', tier: 4, cost: 2500 },

  'SYSTEM3': { id: 'SYSTEM3', type: 'SKIN', displayName: 'PCB', description: 'Circuit board.', unlockHint: 'Reach Stage 16 on INSANE', tier: 4, cost: 3000 },
  'INDUSTRIAL2': { id: 'INDUSTRIAL2', type: 'HUD', displayName: 'Cockpit II', description: 'Flight simulator.', unlockHint: 'Reach Stage 16 on INSANE', tier: 4, cost: 3000 },

  'MECH4': { id: 'MECH4', type: 'SKIN', displayName: 'Railgun', description: 'Magnetic assembly.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'FLUX4': { id: 'FLUX4', type: 'SKIN', displayName: 'Helix', description: 'Double strand.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'NEON4': { id: 'NEON4', type: 'SKIN', displayName: 'Laser', description: 'Solid beam.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'PIXEL4': { id: 'PIXEL4', type: 'SKIN', displayName: 'Iso-Cube', description: 'Isometric projection.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'MINIMAL4': { id: 'MINIMAL4', type: 'SKIN', displayName: 'ASCII', description: 'Text mode.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'MECH5': { id: 'MECH5', type: 'SKIN', displayName: 'Titan', description: 'Heavy alloy.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'FLUX5': { id: 'FLUX5', type: 'SKIN', displayName: 'Quantum', description: 'Particle wave.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'NEON5': { id: 'NEON5', type: 'SKIN', displayName: 'Ultra', description: 'Violet spectrum.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'PIXEL5': { id: 'PIXEL5', type: 'SKIN', displayName: 'Voxel Cloud', description: 'Dispersed bits.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 }
};
