// Passthrough Vertex Shader (GLSL ES 1.0)
// Shared vertex shader for all post-process effects

attribute vec2 aPosition;
attribute vec2 aTextureCoord;

varying vec2 vTextureCoord;

void main() {
    vTextureCoord = aTextureCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
