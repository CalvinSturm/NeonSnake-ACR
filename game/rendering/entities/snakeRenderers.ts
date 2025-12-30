
import { SnakeRenderer } from '../types';

// ─────────────────────────────────────────────
// V1
// ─────────────────────────────────────────────
import { renderSnakeMech } from './renderSnakeMech';
import { renderSnakeFlux } from './renderSnakeFlux';
import { renderSnakeNeon } from './renderSnakeNeon';
import { renderSnakePixel } from './renderSnakePixel';
import { renderSnakeMinimal } from './renderSnakeMinimal';
import { renderSnakeGlitch } from './renderSnakeGlitch';
import { renderSnakeOrganic } from './renderSnakeOrganic';
import { renderSnakeProtocol } from './renderSnakeProtocol';
import { renderSnakeSystem } from './renderSnakeSystem';

// ─────────────────────────────────────────────
// V2
// ─────────────────────────────────────────────
import { renderSnakeMech2 } from './renderSnakeMech2';
import { renderSnakeFlux2 } from './renderSnakeFlux2';
import { renderSnakeNeon2 } from './renderSnakeNeon2';
import { renderSnakePixel2 } from './renderSnakePixel2';
import { renderSnakeMinimal2 } from './renderSnakeMinimal2';
import { renderSnakeGlitch2 } from './renderSnakeGlitch2';
import { renderSnakeOrganic2 } from './renderSnakeOrganic2';
import { renderSnakeProtocol2 } from './renderSnakeProtocol2';
import { renderSnakeSystem2 } from './renderSnakeSystem2';

// ─────────────────────────────────────────────
// V3
// ─────────────────────────────────────────────
import { renderSnakeMech3 } from './renderSnakeMech3';
import { renderSnakeFlux3 } from './renderSnakeFlux3';
import { renderSnakeNeon3 } from './renderSnakeNeon3';
import { renderSnakePixel3 } from './renderSnakePixel3';
import { renderSnakeMinimal3 } from './renderSnakeMinimal3';
import { renderSnakeGlitch3 } from './renderSnakeGlitch3';
import { renderSnakeOrganic3 } from './renderSnakeOrganic3';
import { renderSnakeProtocol3 } from './renderSnakeProtocol3';
import { renderSnakeSystem3 } from './renderSnakeSystem3';

// ─────────────────────────────────────────────
// V4
// ─────────────────────────────────────────────
import { renderSnakeMech4 } from './renderSnakeMech4';
import { renderSnakeFlux4 } from './renderSnakeFlux4';
import { renderSnakeNeon4 } from './renderSnakeNeon4';
import { renderSnakePixel4 } from './renderSnakePixel4';
import { renderSnakeMinimal4 } from './renderSnakeMinimal4';
import { renderSnakeGlitch4 } from './renderSnakeGlitch4';
import { renderSnakeOrganic4 } from './renderSnakeOrganic4';
import { renderSnakeProtocol4 } from './renderSnakeProtocol4';
import { renderSnakeSystem4 } from './renderSnakeSystem4';

// ─────────────────────────────────────────────
// V5
// ─────────────────────────────────────────────
import { renderSnakeMech5 } from './renderSnakeMech5';
import { renderSnakeFlux5 } from './renderSnakeFlux5';
import { renderSnakeNeon5 } from './renderSnakeNeon5';
import { renderSnakePixel5 } from './renderSnakePixel5';
import { renderSnakeMinimal5 } from './renderSnakeMinimal5';
import { renderSnakeGlitch5 } from './renderSnakeGlitch5';
import { renderSnakeOrganic5 } from './renderSnakeOrganic5';
import { renderSnakeProtocol5 } from './renderSnakeProtocol5';
import { renderSnakeSystem5 } from './renderSnakeSystem5';

// ─────────────────────────────────────────────
// REGISTRY — ONLY REAL COSMETICS
// ─────────────────────────────────────────────
export const SNAKE_RENDERERS: Record<string, SnakeRenderer> = {
    MECH: renderSnakeMech,
    MECH2: renderSnakeMech2,
    MECH3: renderSnakeMech3,
    MECH4: renderSnakeMech4,
    MECH5: renderSnakeMech5,

    FLUX: renderSnakeFlux,
    FLUX2: renderSnakeFlux2,
    FLUX3: renderSnakeFlux3,
    FLUX4: renderSnakeFlux4,
    FLUX5: renderSnakeFlux5,

    NEON: renderSnakeNeon,
    NEON2: renderSnakeNeon2,
    NEON3: renderSnakeNeon3,
    NEON4: renderSnakeNeon4,
    NEON5: renderSnakeNeon5,

    PIXEL: renderSnakePixel,
    PIXEL2: renderSnakePixel2,
    PIXEL3: renderSnakePixel3,
    PIXEL4: renderSnakePixel4,
    PIXEL5: renderSnakePixel5,

    MINIMAL: renderSnakeMinimal,
    MINIMAL2: renderSnakeMinimal2,
    MINIMAL3: renderSnakeMinimal3,
    MINIMAL4: renderSnakeMinimal4,
    MINIMAL5: renderSnakeMinimal5,

    GLITCH: renderSnakeGlitch,
    GLITCH2: renderSnakeGlitch2,
    GLITCH3: renderSnakeGlitch3,
    GLITCH4: renderSnakeGlitch4,
    GLITCH5: renderSnakeGlitch5,

    ORGANIC: renderSnakeOrganic,
    ORGANIC2: renderSnakeOrganic2,
    ORGANIC3: renderSnakeOrganic3,
    ORGANIC4: renderSnakeOrganic4,
    ORGANIC5: renderSnakeOrganic5,

    PROTOCOL: renderSnakeProtocol,
    PROTOCOL2: renderSnakeProtocol2,
    PROTOCOL3: renderSnakeProtocol3,
    PROTOCOL4: renderSnakeProtocol4,
    PROTOCOL5: renderSnakeProtocol5,

    SYSTEM: renderSnakeSystem,
    SYSTEM2: renderSnakeSystem2,
    SYSTEM3: renderSnakeSystem3,
    SYSTEM4: renderSnakeSystem4,
    SYSTEM5: renderSnakeSystem5,
};
