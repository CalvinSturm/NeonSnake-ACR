/**
 * CRT Filter
 *
 * Combined barrel distortion, scanlines, and vignette effect.
 * Provides full retro CRT monitor appearance.
 */

import { Filter, GlProgram } from 'pixi.js';

import vertex from '../glsl/passthrough.vert?raw';
import fragment from '../glsl/crt.frag?raw';

export interface CRTFilterOptions {
    barrelDistortion?: number;    // Curvature amount (0-0.3, default: 0.1)
    scanlineIntensity?: number;   // Scanline darkness (0-0.3, default: 0.15)
    vignetteIntensity?: number;   // Vignette strength (0-1, default: 0.3)
    width?: number;               // Resolution width
    height?: number;              // Resolution height
}

export class CRTFilter extends Filter {
    private _time: number = 0;
    private _width: number;
    private _height: number;

    constructor(options: CRTFilterOptions = {}) {
        const width = options.width ?? 1920;
        const height = options.height ?? 1080;

        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'crt-filter',
        });

        super({
            glProgram,
            resources: {
                crtUniforms: {
                    uBarrelDistortion: { value: options.barrelDistortion ?? 0.1, type: 'f32' },
                    uScanlineIntensity: { value: options.scanlineIntensity ?? 0.15, type: 'f32' },
                    uVignetteIntensity: { value: options.vignetteIntensity ?? 0.3, type: 'f32' },
                    uTime: { value: 0, type: 'f32' },
                    uResolution: { value: [width, height], type: 'vec2<f32>' },
                },
            },
        });

        this._width = width;
        this._height = height;
    }

    get barrelDistortion(): number {
        return this.resources.crtUniforms.uniforms.uBarrelDistortion;
    }

    set barrelDistortion(value: number) {
        this.resources.crtUniforms.uniforms.uBarrelDistortion = Math.max(0, Math.min(0.3, value));
    }

    get scanlineIntensity(): number {
        return this.resources.crtUniforms.uniforms.uScanlineIntensity;
    }

    set scanlineIntensity(value: number) {
        this.resources.crtUniforms.uniforms.uScanlineIntensity = Math.max(0, Math.min(0.3, value));
    }

    get vignetteIntensity(): number {
        return this.resources.crtUniforms.uniforms.uVignetteIntensity;
    }

    set vignetteIntensity(value: number) {
        this.resources.crtUniforms.uniforms.uVignetteIntensity = Math.max(0, Math.min(1.0, value));
    }

    get time(): number {
        return this._time;
    }

    set time(value: number) {
        this._time = value;
        this.resources.crtUniforms.uniforms.uTime = value;
    }

    /**
     * Update resolution for barrel distortion calculation.
     */
    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this.resources.crtUniforms.uniforms.uResolution = [width, height];
    }

    /**
     * Update time uniform (call each frame).
     * @param dt Delta time in seconds
     */
    update(dt: number): void {
        this._time += dt;
        this.resources.crtUniforms.uniforms.uTime = this._time;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }
}
