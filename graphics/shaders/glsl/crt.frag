// CRT Composite Fragment Shader (GLSL ES 1.0)
// Combines barrel distortion, scanlines, and vignette

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;

uniform float uBarrelDistortion;  // Barrel curvature (0.0-0.3)
uniform float uScanlineIntensity; // Scanline darkness (0.0-0.3)
uniform float uVignetteIntensity; // Vignette darkness (0.0-1.0)
uniform float uTime;              // Animation time in seconds
uniform vec2 uResolution;         // Screen resolution

// Barrel distortion function
vec2 barrelDistort(vec2 uv, float amount) {
    vec2 centered = uv - 0.5;
    float r2 = dot(centered, centered);
    float distortion = 1.0 + r2 * amount;
    return centered * distortion + 0.5;
}

void main() {
    vec2 uv = vTextureCoord;

    // Apply barrel distortion
    if (uBarrelDistortion > 0.001) {
        uv = barrelDistort(uv, uBarrelDistortion);

        // Clip if outside texture bounds
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
    }

    vec4 color = texture2D(uTexture, uv);

    // Scanlines
    if (uScanlineIntensity > 0.001) {
        float scanline = sin(gl_FragCoord.y * 3.14159) * 0.5 + 0.5;
        float flicker = 1.0 - uScanlineIntensity * 0.05 * sin(uTime * 50.0);
        color.rgb *= (1.0 - uScanlineIntensity * scanline) * flicker;
    }

    // Vignette
    if (uVignetteIntensity > 0.001) {
        vec2 vignetteUV = uv - 0.5;
        float vignette = 1.0 - dot(vignetteUV, vignetteUV) * uVignetteIntensity * 2.0;
        vignette = clamp(vignette, 0.0, 1.0);
        color.rgb *= vignette;
    }

    // Subtle RGB phosphor pattern (CRT subpixel simulation)
    float phosphor = mod(gl_FragCoord.x, 3.0);
    if (phosphor < 1.0) {
        color.r *= 1.05;
    } else if (phosphor < 2.0) {
        color.g *= 1.05;
    } else {
        color.b *= 1.05;
    }

    gl_FragColor = color;
}
