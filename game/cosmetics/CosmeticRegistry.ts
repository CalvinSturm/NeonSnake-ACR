
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
  // Base
  'AUTO': { id: 'AUTO', type: 'SKIN', displayName: 'Adaptive Camo', description: 'Changes based on class.', unlockHint: 'Default', tier: 1, cost: 0 },
  'CYBER': { id: 'CYBER', type: 'HUD', displayName: 'Cyber One', description: 'Standard issue.', unlockHint: 'Default', tier: 1, cost: 0 },

  // HUDs
  'RETRO': { id: 'RETRO', type: 'HUD', displayName: 'Retro Term', description: 'Green phosphor.', unlockHint: 'Reach Stage 2', tier: 1, cost: 100 },
  'ZEN': { id: 'ZEN', type: 'HUD', displayName: 'Zen Mode', description: 'Minimalist layout.', unlockHint: 'Reach Stage 3', tier: 1, cost: 150 },
  'INDUSTRIAL': { id: 'INDUSTRIAL', type: 'HUD', displayName: 'Heavy Industry', description: 'Analog gauges.', unlockHint: 'Reach Stage 4', tier: 1, cost: 200 },
  'ARCADE': { id: 'ARCADE', type: 'HUD', displayName: 'Cabinet', description: 'Coin-op overlay.', unlockHint: 'Clear NEOPHYTE', tier: 1, cost: 250 },

  'RETRO3': { id: 'RETRO3', type: 'HUD', displayName: 'Retro III', description: 'Legacy variant.', unlockHint: 'Stage 3 Milestone', tier: 1, cost: 150 },
  'RETRO4': { id: 'RETRO4', type: 'HUD', displayName: 'Retro IV', description: 'Legacy variant.', unlockHint: 'Stage 4 Milestone', tier: 1, cost: 180 },
  'RETRO5': { id: 'RETRO5', type: 'HUD', displayName: 'Retro V', description: 'Legacy variant.', unlockHint: 'Clear NEOPHYTE', tier: 1, cost: 250 },

  // Skins
  'MECH': { id: 'MECH', type: 'SKIN', displayName: 'Mech Frame', description: 'Reinforced plating.', unlockHint: 'Reach Stage 2', tier: 1, cost: 100 },
  'FLUX': { id: 'FLUX', type: 'SKIN', displayName: 'Flux Stream', description: 'Energy conduit.', unlockHint: 'Reach Stage 3', tier: 1, cost: 150 },
  'NEON': { id: 'NEON', type: 'SKIN', displayName: 'Neon Glow', description: 'High contrast.', unlockHint: 'Reach Stage 4', tier: 1, cost: 200 },
  'PIXEL': { id: 'PIXEL', type: 'SKIN', displayName: '8-Bit', description: 'Low resolution.', unlockHint: 'Clear NEOPHYTE', tier: 1, cost: 250 },
  'MINIMAL': { id: 'MINIMAL', type: 'SKIN', displayName: 'Vector', description: 'Wireframe construct.', unlockHint: 'Clear NEOPHYTE', tier: 1, cost: 250 },
  'ORGANIC': { id: 'ORGANIC', type: 'SKIN', displayName: 'Biomass', description: 'Living tissue.', unlockHint: 'Clear NEOPHYTE', tier: 1, cost: 250 },

  // ── TIER 2: OPERATOR (Stages 6-9) ──
  // HUDs
  'RPG': { id: 'RPG', type: 'HUD', displayName: 'Hero Frame', description: 'MMO interface.', unlockHint: 'Reach Stage 6 on OPERATOR+', tier: 2, cost: 400 },
  'HOLO': { id: 'HOLO', type: 'HUD', displayName: 'Holo Deck', description: '3D projection.', unlockHint: 'Reach Stage 7 on OPERATOR+', tier: 2, cost: 450 },
  'ZEN2': { id: 'ZEN2', type: 'HUD', displayName: 'Zen II', description: 'Ethereal.', unlockHint: 'Stage 8 Milestone', tier: 2, cost: 500 },
  'INDUSTRIAL2': { id: 'INDUSTRIAL2', type: 'HUD', displayName: 'Heavy Industry II', description: 'Advanced mechanical.', unlockHint: 'Reach Stage 8 on OPERATOR+', tier: 2, cost: 500 },
  'ARCADE2': { id: 'ARCADE2', type: 'HUD', displayName: 'Arcade II', description: 'Retro cabinet.', unlockHint: 'Stage 9 Milestone', tier: 2, cost: 600 },
  'GLASS': { id: 'GLASS', type: 'HUD', displayName: 'Aero Glass', description: 'Frosted blur.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 650 },

  'RPG3': { id: 'RPG3', type: 'HUD', displayName: 'RPG III', description: 'Stat focus.', unlockHint: 'Stage 6 Milestone', tier: 2, cost: 400 },
  'RPG4': { id: 'RPG4', type: 'HUD', displayName: 'RPG IV', description: 'Quest mode.', unlockHint: 'Stage 8 Milestone', tier: 2, cost: 550 },
  'HOLO3': { id: 'HOLO3', type: 'HUD', displayName: 'Holo III', description: 'Tactical.', unlockHint: 'Stage 7 Milestone', tier: 2, cost: 450 },

  // Skins
  'GLITCH': { id: 'GLITCH', type: 'SKIN', displayName: 'Corrupted', description: 'Signal noise.', unlockHint: 'Reach Stage 6 on OPERATOR+', tier: 2, cost: 400 },
  'PROTOCOL': { id: 'PROTOCOL', type: 'SKIN', displayName: 'Construct', description: 'Virtual geometry.', unlockHint: 'Reach Stage 7 on OPERATOR+', tier: 2, cost: 450 },
  'SYSTEM': { id: 'SYSTEM', type: 'SKIN', displayName: 'Mainframe', description: 'Circuit pathways.', unlockHint: 'Reach Stage 8 on OPERATOR+', tier: 2, cost: 500 },

  'MECH2': { id: 'MECH2', type: 'SKIN', displayName: 'Mech II', description: 'Tank treads.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 600 },
  'FLUX2': { id: 'FLUX2', type: 'SKIN', displayName: 'Flux II', description: 'Solar node.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 600 },
  'NEON2': { id: 'NEON2', type: 'SKIN', displayName: 'Neon II', description: 'Light cycle.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 600 },
  'PIXEL2': { id: 'PIXEL2', type: 'SKIN', displayName: 'Pixel II', description: 'Voxel cubes.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 600 },
  'MINIMAL2': { id: 'MINIMAL2', type: 'SKIN', displayName: 'Minimal II', description: 'Abstract shapes.', unlockHint: 'Clear OPERATOR', tier: 2, cost: 600 },

  // ── TIER 3: VETERAN (Stages 10-13) ──
  // HUDs
  'CYBER2': { id: 'CYBER2', type: 'HUD', displayName: 'Cyber II', description: 'Advanced telemetry.', unlockHint: 'Reach Stage 10 on VETERAN+', tier: 3, cost: 800 },
  'GLASS2': { id: 'GLASS2', type: 'HUD', displayName: 'Glass II', description: 'Dark glass.', unlockHint: 'Reach Stage 11 on VETERAN+', tier: 3, cost: 900 },
  'RETRO2': { id: 'RETRO2', type: 'HUD', displayName: 'Retro II', description: 'Oscilloscope.', unlockHint: 'Reach Stage 12 on VETERAN+', tier: 3, cost: 1000 },
  'CYBER3': { id: 'CYBER3', type: 'HUD', displayName: 'Cyber III', description: 'Focus layout.', unlockHint: 'Stage 10 Milestone', tier: 3, cost: 850 },
  'CYBER4': { id: 'CYBER4', type: 'HUD', displayName: 'Cyber IV', description: 'Data stream.', unlockHint: 'Stage 11 Milestone', tier: 3, cost: 950 },
  'RETRO6': { id: 'RETRO6', type: 'HUD', displayName: 'Retro VI', description: 'Chrome text.', unlockHint: 'Stage 12 Milestone', tier: 3, cost: 1100 },
  'RETRO7': { id: 'RETRO7', type: 'HUD', displayName: 'Retro VII', description: 'Legacy Max.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1300 },

  'INDUSTRIAL3': { id: 'INDUSTRIAL3', type: 'HUD', displayName: 'Industrial III', description: 'Steam gauges.', unlockHint: 'Stage 10 Milestone', tier: 3, cost: 850 },
  'INDUSTRIAL4': { id: 'INDUSTRIAL4', type: 'HUD', displayName: 'Industrial IV', description: 'Hydraulic HUD.', unlockHint: 'Stage 12 Milestone', tier: 3, cost: 1100 },
  'ARCADE3': { id: 'ARCADE3', type: 'HUD', displayName: 'Arcade III', description: '16-bit scanlines.', unlockHint: 'Stage 10 Milestone', tier: 3, cost: 850 },
  'ARCADE4': { id: 'ARCADE4', type: 'HUD', displayName: 'Arcade IV', description: 'Fighting Game HUD.', unlockHint: 'Stage 12 Milestone', tier: 3, cost: 1100 },
  'ZEN3': { id: 'ZEN3', type: 'HUD', displayName: 'Zen III', description: 'Flow state.', unlockHint: 'Stage 11 Milestone', tier: 3, cost: 950 },
  'ZEN4': { id: 'ZEN4', type: 'HUD', displayName: 'Zen IV', description: 'Symmetry.', unlockHint: 'Stage 13 Milestone', tier: 3, cost: 1250 },

  // Skins
  'ORGANIC2': { id: 'ORGANIC2', type: 'SKIN', displayName: 'Organic II', description: 'Chitin plating.', unlockHint: 'Reach Stage 10 on VETERAN+', tier: 3, cost: 800 },
  'GLITCH2': { id: 'GLITCH2', type: 'SKIN', displayName: 'Glitch II', description: 'MissingTex.', unlockHint: 'Reach Stage 11 on VETERAN+', tier: 3, cost: 900 },
  'PROTOCOL2': { id: 'PROTOCOL2', type: 'SKIN', displayName: 'Protocol II', description: 'Drone swarm.', unlockHint: 'Reach Stage 12 on VETERAN+', tier: 3, cost: 1000 },

  'MECH3': { id: 'MECH3', type: 'SKIN', displayName: 'Mech III', description: 'Exo spine.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'FLUX3': { id: 'FLUX3', type: 'SKIN', displayName: 'Flux III', description: 'Plasma core.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'NEON3': { id: 'NEON3', type: 'SKIN', displayName: 'Neon III', description: 'Synth sun.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'PIXEL3': { id: 'PIXEL3', type: 'SKIN', displayName: 'Pixel III', description: 'Dithered.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'MINIMAL3': { id: 'MINIMAL3', type: 'SKIN', displayName: 'Minimal III', description: 'Blueprint.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'ORGANIC3': { id: 'ORGANIC3', type: 'SKIN', displayName: 'Organic III', description: 'Tendrils.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1200 },
  'SYSTEM2': { id: 'SYSTEM2', type: 'SKIN', displayName: 'System II', description: 'Hex grid.', unlockHint: 'Clear VETERAN', tier: 3, cost: 1250 },

  // ── TIER 4: CYBERPSYCHO (Stages 14-17+) ──
  // HUDs
  'HOLO2': { id: 'HOLO2', type: 'HUD', displayName: 'Holo II', description: 'Projector.', unlockHint: 'Reach Stage 14 on INSANE', tier: 4, cost: 2000 },
  'RPG2': { id: 'RPG2', type: 'HUD', displayName: 'RPG II', description: 'Raid party.', unlockHint: 'Reach Stage 15 on INSANE', tier: 4, cost: 2500 },
  'CYBER5': { id: 'CYBER5', type: 'HUD', displayName: 'Cyber V', description: 'Neural link.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'CYBER6': { id: 'CYBER6', type: 'HUD', displayName: 'Cyber VI', description: 'Overclocked.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3000 },
  'CYBER7': { id: 'CYBER7', type: 'HUD', displayName: 'Cyber VII', description: 'Ultimate Interface.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  'INDUSTRIAL5': { id: 'INDUSTRIAL5', type: 'HUD', displayName: 'Industrial V', description: 'Reactor HUD.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'INDUSTRIAL6': { id: 'INDUSTRIAL6', type: 'HUD', displayName: 'Industrial VI', description: 'Titan Cockpit.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3000 },
  'INDUSTRIAL7': { id: 'INDUSTRIAL7', type: 'HUD', displayName: 'Industrial VII', description: 'Dreadnought.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  'ARCADE5': { id: 'ARCADE5', type: 'HUD', displayName: 'Arcade V', description: 'Bullet Hell.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'ARCADE6': { id: 'ARCADE6', type: 'HUD', displayName: 'Arcade VI', description: 'Boss Rush.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3500 },
  'ARCADE7': { id: 'ARCADE7', type: 'HUD', displayName: 'Arcade VII', description: 'Final Boss.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  'GLASS3': { id: 'GLASS3', type: 'HUD', displayName: 'Glass III', description: 'Refractive.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2000 },
  'GLASS4': { id: 'GLASS4', type: 'HUD', displayName: 'Glass IV', description: 'Mirror.', unlockHint: 'Stage 15 Milestone', tier: 4, cost: 2600 },
  'GLASS5': { id: 'GLASS5', type: 'HUD', displayName: 'Glass V', description: 'Prism.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3200 },
  'GLASS6': { id: 'GLASS6', type: 'HUD', displayName: 'Glass VI', description: 'Fractal.', unlockHint: 'Stage 17 Milestone', tier: 4, cost: 4500 },
  'GLASS7': { id: 'GLASS7', type: 'HUD', displayName: 'Glass VII', description: 'Void Glass.', unlockHint: 'Clear INSANE', tier: 4, cost: 6000 },

  'RPG5': { id: 'RPG5', type: 'HUD', displayName: 'RPG V', description: 'Legendary.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'RPG6': { id: 'RPG6', type: 'HUD', displayName: 'RPG VI', description: 'Mythic.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3500 },
  'RPG7': { id: 'RPG7', type: 'HUD', displayName: 'RPG VII', description: 'God Mode HUD.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  'HOLO4': { id: 'HOLO4', type: 'HUD', displayName: 'Holo IV', description: 'Neural Holo.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'HOLO5': { id: 'HOLO5', type: 'HUD', displayName: 'Holo V', description: 'Quantum Holo.', unlockHint: 'Stage 15 Milestone', tier: 4, cost: 2800 },
  'HOLO6': { id: 'HOLO6', type: 'HUD', displayName: 'Holo VI', description: 'Reality Glitch.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3800 },
  'HOLO7': { id: 'HOLO7', type: 'HUD', displayName: 'Holo VII', description: 'Singularity.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  'ZEN5': { id: 'ZEN5', type: 'HUD', displayName: 'Zen V', description: 'Silence.', unlockHint: 'Stage 14 Milestone', tier: 4, cost: 2200 },
  'ZEN6': { id: 'ZEN6', type: 'HUD', displayName: 'Zen VI', description: 'Empty space.', unlockHint: 'Stage 16 Milestone', tier: 4, cost: 3500 },
  'ZEN7': { id: 'ZEN7', type: 'HUD', displayName: 'Zen VII', description: 'Nirvana.', unlockHint: 'Clear INSANE', tier: 4, cost: 5000 },

  // Skins
  'GLITCH3': { id: 'GLITCH3', type: 'SKIN', displayName: 'Glitch III', description: 'Echo smear.', unlockHint: 'Reach Stage 14 on INSANE', tier: 4, cost: 2000 },
  'PROTOCOL3': { id: 'PROTOCOL3', type: 'SKIN', displayName: 'Protocol III', description: 'Aegis.', unlockHint: 'Reach Stage 15 on INSANE', tier: 4, cost: 2500 },
  'SYSTEM3': { id: 'SYSTEM3', type: 'SKIN', displayName: 'System III', description: 'PCB.', unlockHint: 'Reach Stage 16 on INSANE', tier: 4, cost: 3000 },

  'MECH4': { id: 'MECH4', type: 'SKIN', displayName: 'Mech IV', description: 'Railgun.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'FLUX4': { id: 'FLUX4', type: 'SKIN', displayName: 'Flux IV', description: 'Helix.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'NEON4': { id: 'NEON4', type: 'SKIN', displayName: 'Neon IV', description: 'Laser.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'PIXEL4': { id: 'PIXEL4', type: 'SKIN', displayName: 'Pixel IV', description: 'Iso-cube.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },
  'MINIMAL4': { id: 'MINIMAL4', type: 'SKIN', displayName: 'Minimal IV', description: 'ASCII.', unlockHint: 'Reach Stage 17 on INSANE', tier: 4, cost: 5000 },

  'MECH5': { id: 'MECH5', type: 'SKIN', displayName: 'Mech V', description: 'Titan.', unlockHint: 'Stage 17 Milestone', tier: 4, cost: 5000 },
  'FLUX5': { id: 'FLUX5', type: 'SKIN', displayName: 'Flux V', description: 'Quantum.', unlockHint: 'Stage 17 Milestone', tier: 4, cost: 5000 },
  'NEON5': { id: 'NEON5', type: 'SKIN', displayName: 'Neon V', description: 'Ultra.', unlockHint: 'Stage 17 Milestone', tier: 4, cost: 5000 },
  'PIXEL5': { id: 'PIXEL5', type: 'SKIN', displayName: 'Pixel V', description: 'Voxel Cloud.', unlockHint: 'Stage 17 Milestone', tier: 4, cost: 5000 },

  'MECH6': { id: 'MECH6', type: 'SKIN', displayName: 'Mech VI', description: 'God Frame.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'FLUX6': { id: 'FLUX6', type: 'SKIN', displayName: 'Flux VI', description: 'Event Horizon.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'NEON6': { id: 'NEON6', type: 'SKIN', displayName: 'Neon VI', description: 'Gamma Ray.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'PIXEL6': { id: 'PIXEL6', type: 'SKIN', displayName: 'Pixel VI', description: 'Data Storm.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'MINIMAL6': { id: 'MINIMAL6', type: 'SKIN', displayName: 'Minimal VI', description: 'Null Set.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'GLITCH6': { id: 'GLITCH6', type: 'SKIN', displayName: 'Glitch VI', description: 'Bit Rot.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'ORGANIC6': { id: 'ORGANIC6', type: 'SKIN', displayName: 'Organic VI', description: 'Apex Predator.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'PROTOCOL6': { id: 'PROTOCOL6', type: 'SKIN', displayName: 'Protocol VI', description: 'Overlord.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 },
  'SYSTEM6': { id: 'SYSTEM6', type: 'SKIN', displayName: 'System VI', description: 'Architect.', unlockHint: 'Clear INSANE', tier: 4, cost: 10000 }
};
