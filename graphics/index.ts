/**
 * Graphics Module Index
 * 
 * Public API for the WebGL rendering system.
 */

export { GameRenderer, gameRenderer } from './renderer';
export type { SpriteHandle, SpriteProps, RendererMetrics, GameRendererConfig } from './renderer';

export { SpritePool, SpritePoolManager } from './spritePool';
export type { PooledSprite } from './spritePool';

export { TextureCache, textureCache } from './textures';
export type { TextureCacheKey, CachedTexture, ProceduralDrawFn } from './textures';

// WebGL entity/FX renderers
export * from './renderers';

// Render manager (dual-mode orchestration)
export {
    initWebGLRenderManager,
    isWebGLReady,
    getRenderMode,
    setRenderMode,
    beginFrame,
    endFrame,
    renderParticles,
    applyCameraTransform,
    getFrameMetrics,
    formatMetricsDebug,
    destroyWebGLRenderManager,
    resizeWebGLRenderer,
    // Shader settings
    applyShaderSettings,
    setShaderQuality,
    setChromaticAberration,
    getShaderQuality,
    areShadersActive,
    // Telemetry & quality
    getTelemetry,
    setAutoQualityScaling,
    setQualityCeiling,
    getCurrentQualityLevel,
} from './renderManager';
export type { RenderMode, FrameMetrics } from './renderManager';

// Shader effects module
export * from './shaders';
