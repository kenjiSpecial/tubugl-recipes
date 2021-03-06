attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
varying vec2 vUv;

void main(){
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vUv = uv;
}