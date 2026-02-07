/**
 * WebGL Renderers Index
 * 
 * Individual entity/FX renderers for WebGL batching.
 */

export {
    initParticleRenderer,
    renderParticlesWebGL,
    getParticleStats,
    destroyParticleRenderer,
} from './particles';

export {
    initProjectileRenderer,
    renderProjectilesWebGL,
    getProjectileStats,
    destroyProjectileRenderer,
    invalidateProjectileTextures,
} from './projectiles';

export {
    initEntityRenderer,
    renderEntitiesWebGL,
    getEntityStats,
    destroyEntityRenderer,
    invalidateEntityTextures,
    setEntityGridSize,
} from './entities';
export type { EntityRenderResult } from './entities';
