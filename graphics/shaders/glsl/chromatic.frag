// Chromatic Aberration Fragment Shader (GLSL ES 1.0)
// RGB channel offset based on distance from center

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;

uniform float uIntensity;    // Aberration strength (0.0-10.0 pixels)
uniform vec2 uResolution;    // Screen resolution
uniform vec2 uCenter;        // Effect center (0.5, 0.5 = screen center)

void main() {
    // Early exit if disabled
    if (uIntensity < 0.001) {
        gl_FragColor = texture2D(uTexture, vTextureCoord);
        return;
    }

    // Calculate direction from center
    vec2 toCenter = vTextureCoord - uCenter;
    float dist = length(toCenter);
    vec2 dir = normalize(toCenter + 0.0001); // Avoid division by zero

    // Offset scales with distance from center (radial aberration)
    vec2 offset = dir * uIntensity * dist / uResolution;

    // Sample each channel with offset
    float r = texture2D(uTexture, vTextureCoord + offset).r;
    float g = texture2D(uTexture, vTextureCoord).g;
    float b = texture2D(uTexture, vTextureCoord - offset).b;
    float a = texture2D(uTexture, vTextureCoord).a;

    gl_FragColor = vec4(r, g, b, a);
}
