// Scanline Fragment Shader (GLSL ES 1.0)
// Creates sinusoidal scanline pattern overlay

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;

uniform float uFrequency;   // Scanline frequency (resolution-relative, ~800 for 1080p)
uniform float uIntensity;   // Scanline darkness (0.0-0.5)
uniform float uTime;        // Animation time in seconds

void main() {
    vec4 color = texture2D(uTexture, vTextureCoord);

    // Sinusoidal scanline pattern
    // Using gl_FragCoord.y for screen-space lines (resolution-independent feel)
    float scanline = sin(gl_FragCoord.y * 3.14159 * 2.0 / (1080.0 / uFrequency)) * 0.5 + 0.5;

    // Apply subtle time-based flicker
    float flicker = 1.0 - uIntensity * 0.1 * sin(uTime * 60.0);

    // Darken based on scanline position
    float darkness = 1.0 - uIntensity * scanline;

    color.rgb *= darkness * flicker;

    gl_FragColor = color;
}
