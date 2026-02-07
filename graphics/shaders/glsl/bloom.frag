// Bloom Fragment Shader (GLSL ES 1.0)
// 9-tap gaussian bloom with per-sample brightness thresholding

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;

uniform float uThreshold;    // Brightness threshold (0.5-1.0)
uniform float uIntensity;    // Bloom intensity multiplier (0.0-1.0)
uniform vec2 uResolution;    // Screen resolution for texel size
uniform float uSamples;      // Sample count: 0, 5, or 9

// Luminance calculation
float luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Extract bright pixels
vec3 extractBright(vec3 color) {
    float lum = luminance(color);
    float contribution = max(0.0, lum - uThreshold) / max(lum, 0.001);
    return color * contribution;
}

void main() {
    vec4 original = texture2D(uTexture, vTextureCoord);

    // Early exit if bloom disabled
    if (uSamples < 1.0 || uIntensity < 0.01) {
        gl_FragColor = original;
        return;
    }

    vec2 texelSize = 1.0 / uResolution;
    vec3 bloom = vec3(0.0);

    // 9-tap gaussian kernel (simplified)
    // Weights: center=0.2, adjacent=0.1, diagonal=0.05
    if (uSamples >= 9.0) {
        // Full 9-tap
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2(-1.0, -1.0) * texelSize * 2.0).rgb) * 0.05;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 0.0, -1.0) * texelSize * 2.0).rgb) * 0.1;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 1.0, -1.0) * texelSize * 2.0).rgb) * 0.05;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2(-1.0,  0.0) * texelSize * 2.0).rgb) * 0.1;
        bloom += extractBright(texture2D(uTexture, vTextureCoord).rgb) * 0.2;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 1.0,  0.0) * texelSize * 2.0).rgb) * 0.1;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2(-1.0,  1.0) * texelSize * 2.0).rgb) * 0.05;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 0.0,  1.0) * texelSize * 2.0).rgb) * 0.1;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 1.0,  1.0) * texelSize * 2.0).rgb) * 0.05;
    } else if (uSamples >= 5.0) {
        // 5-tap cross pattern
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 0.0, -1.0) * texelSize * 2.0).rgb) * 0.15;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2(-1.0,  0.0) * texelSize * 2.0).rgb) * 0.15;
        bloom += extractBright(texture2D(uTexture, vTextureCoord).rgb) * 0.4;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 1.0,  0.0) * texelSize * 2.0).rgb) * 0.15;
        bloom += extractBright(texture2D(uTexture, vTextureCoord + vec2( 0.0,  1.0) * texelSize * 2.0).rgb) * 0.15;
    }

    // Add bloom to original
    vec3 result = original.rgb + bloom * uIntensity;

    gl_FragColor = vec4(result, original.a);
}
