precision highp float;

attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec3 vNorm;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vNorm = position.rgb;
}