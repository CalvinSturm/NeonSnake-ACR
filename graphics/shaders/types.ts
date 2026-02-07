/**
 * Shader Types
 *
 * TypeScript interfaces for the shader filter system.
 */

export type ShaderQuality = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';

export interface ShaderSettings {
    quality: ShaderQuality;
    bloomEnabled: boolean;
    chromaticEnabled: boolean;
    crtEnabled: boolean;
    scanlinesEnabled: boolean;
}

export interface LODRule {
    quality: ShaderQuality;
    fpsThreshold: number;
    bloomSamples: 0 | 5 | 9;
    chromaticEnabled: boolean;
    crtEnabled: boolean;
    scanlinesEnabled: boolean;
    scanlinesIntensity: number;
}

export const LOD_RULES: Record<Exclude<ShaderQuality, 'AUTO'>, LODRule> = {
    HIGH: {
        quality: 'HIGH',
        fpsThreshold: 55,
        bloomSamples: 9,
        chromaticEnabled: true,
        crtEnabled: true,
        scanlinesEnabled: true,
        scanlinesIntensity: 0.15,
    },
    MEDIUM: {
        quality: 'MEDIUM',
        fpsThreshold: 45,
        bloomSamples: 5,
        chromaticEnabled: true,
        crtEnabled: true,
        scanlinesEnabled: true,
        scanlinesIntensity: 0.12,
    },
    LOW: {
        quality: 'LOW',
        fpsThreshold: 30,
        bloomSamples: 0,
        chromaticEnabled: false,
        crtEnabled: false,
        scanlinesEnabled: true,
        scanlinesIntensity: 0.08,
    },
    OFF: {
        quality: 'OFF',
        fpsThreshold: 0,
        bloomSamples: 0,
        chromaticEnabled: false,
        crtEnabled: false,
        scanlinesEnabled: false,
        scanlinesIntensity: 0,
    },
};

export interface FilterUpdateOptions {
    dt: number;
    fps: number;
    chromaticIntensity?: number;
}
