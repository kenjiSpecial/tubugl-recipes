precision highp float;

attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
varying vec2 vUv;

void main(){
    float size = 40.;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position);
    vUv = uv;
}