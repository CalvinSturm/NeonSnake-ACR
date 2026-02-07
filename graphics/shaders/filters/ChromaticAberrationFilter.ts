/**
 * Chromatic Aberration Filter
 *
 * RGB channel offset effect for glitch/death visuals.
 * Intensity increases outward from center.
 */

import { Filter, GlProgram } from 'pixi.js';

import vertex from '../glsl/passthrough.vert?raw';
import fragment from '../glsl/chromatic.frag?raw';

export interface ChromaticAberrationFilterOptions {
    intensity?: number;   // Aberration strength in pixels (0-10, default: 0)
    centerX?: number;     // Effect center X (0-1, default: 0.5)
    centerY?: number;     // Effect center Y (0-1, default: 0.5)
    width?: number;       // Resolution width
    height?: number;      // Resolution height
}

export class ChromaticAberrationFilter extends Filter {
    private _width: number;
    private _height: number;

    constructor(options: ChromaticAberrationFilterOptions = {}) {
        const width = options.width ?? 1920;
        const height = options.height ?? 1080;

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'chromatic-aberration-filter',
        });

        super({
            glProgram,
            resources: {
                chromaticUniforms: {
                    uIntensity: { value: options.intensity ?? 0, type: 'f32' },
                    uResolution: { value: [width, height], type: 'vec2<f32>' },
                    uCenter: { value: [options.centerX ?? 0.5, options.centerY ?? 0.5], type: 'vec2<f32>' },
                },
            },
        });

        this._width = width;
        this._height = height;
    }

    get intensity(): number {
        return this.resources.chromaticUniforms.uniforms.uIntensity;
    }

    set intensity(value: number) {
        this.resources.chromaticUniforms.uniforms.uIntensity = Math.max(0, Math.min(10, value));
    }

    get centerX(): number {
        return this.resources.chromaticUniforms.uniforms.uCenter[0];
    }

    set centerX(value: number) {
        const center = this.resources.chromaticUniforms.uniforms.uCenter;
        this.resources.chromaticUniforms.uniforms.uCenter = [value, center[1]];
    }

    get centerY(): number {
        return this.resources.chromaticUniforms.uniforms.uCenter[1];
    }

    set centerY(value: number) {
        const center = this.resources.chromaticUniforms.uniforms.uCenter;
        this.resources.chromaticUniforms.uniforms.uCenter = [center[0], value];
    }

    /**
     * Update resolution for proper pixel sizing.
     */
    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this.resources.chromaticUniforms.uniforms.uResolution = [width, height];
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }
}
