/**
 * Scanline Filter
 *
 * Post-process filter that adds sinusoidal scanline overlay.
 * Frequency is resolution-relative for consistent appearance.
 */

import { Filter, GlProgram } from 'pixi.js';

// Import shaders as raw text
import vertex from '../glsl/passthrough.vert?raw';
import fragment from '../glsl/scanline.frag?raw';

export interface ScanlineFilterOptions {
    frequency?: number;   // Scanline density (default: 800, relative to 1080p)
    intensity?: number;   // Darkness amount (0-0.5, default: 0.15)
}

export class ScanlineFilter extends Filter {
    private _time: number = 0;

    constructor(options: ScanlineFilterOptions = {}) {
        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'scanline-filter',
        });

        super({
            glProgram,
            resources: {
                scanlineUniforms: {
                    uFrequency: { value: options.frequency ?? 800.0, type: 'f32' },
                    uIntensity: { value: options.intensity ?? 0.15, type: 'f32' },
                    uTime: { value: 0, type: 'f32' },
                },
            },
        });
    }

    get frequency(): number {
        return this.resources.scanlineUniforms.uniforms.uFrequency;
    }

    set frequency(value: number) {
        this.resources.scanlineUniforms.uniforms.uFrequency = value;
    }

    get intensity(): number {
        return this.resources.scanlineUniforms.uniforms.uIntensity;
    }

    set intensity(value: number) {
        this.resources.scanlineUniforms.uniforms.uIntensity = Math.max(0, Math.min(0.5, value));
    }

    get time(): number {
        return this._time;
    }

    set time(value: number) {
        this._time = value;
        this.resources.scanlineUniforms.uniforms.uTime = value;
    }

    /**
     * Update time uniform (call each frame).
     * @param dt Delta time in seconds
     */
    update(dt: number): void {
        this._time += dt;
        this.resources.scanlineUniforms.uniforms.uTime = this._time;
    }
}
