/**
 * Bloom Filter
 *
 * Post-process bloom effect with configurable sample count.
 * Uses per-sample brightness thresholding for quality glow.
 */

import { Filter, GlProgram } from 'pixi.js';

import vertex from '../glsl/passthrough.vert?raw';
import fragment from '../glsl/bloom.frag?raw';

export interface BloomFilterOptions {
    threshold?: number;   // Brightness threshold (0.5-1.0, default: 0.7)
    intensity?: number;   // Bloom intensity (0-1, default: 0.5)
    samples?: 0 | 5 | 9;  // Sample count (default: 9)
    width?: number;       // Resolution width
    height?: number;      // Resolution height
}

export class BloomFilter extends Filter {
    private _width: number;
    private _height: number;

    constructor(options: BloomFilterOptions = {}) {
        const width = options.width ?? 1920;
        const height = options.height ?? 1080;

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'bloom-filter',
        });

        super({
            glProgram,
            resources: {
                bloomUniforms: {
                    uThreshold: { value: options.threshold ?? 0.7, type: 'f32' },
                    uIntensity: { value: options.intensity ?? 0.5, type: 'f32' },
                    uResolution: { value: [width, height], type: 'vec2<f32>' },
                    uSamples: { value: options.samples ?? 9, type: 'f32' },
                },
            },
        });

        this._width = width;
        this._height = height;
    }

    get threshold(): number {
        return this.resources.bloomUniforms.uniforms.uThreshold;
    }

    set threshold(value: number) {
        this.resources.bloomUniforms.uniforms.uThreshold = Math.max(0.5, Math.min(1.0, value));
    }

    get intensity(): number {
        return this.resources.bloomUniforms.uniforms.uIntensity;
    }

    set intensity(value: number) {
        this.resources.bloomUniforms.uniforms.uIntensity = Math.max(0, Math.min(1.0, value));
    }

    get samples(): number {
        return this.resources.bloomUniforms.uniforms.uSamples;
    }

    set samples(value: 0 | 5 | 9) {
        this.resources.bloomUniforms.uniforms.uSamples = value;
    }

    /**
     * Update resolution for proper texel sampling.
     */
    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this.resources.bloomUniforms.uniforms.uResolution = [width, height];
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }
}
