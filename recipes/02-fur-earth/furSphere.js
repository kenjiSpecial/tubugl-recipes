import { Sphere } from 'tubugl-3d-shape';
import {
	TRIANGLES,
	UNSIGNED_SHORT,
	CULL_FACE,
	BACK,
	FRONT,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	BLEND,
	ONE,
	ZERO,
	UNSIGNED_BYTE
} from 'tubugl-constants';
import { Program, ArrayBuffer, IndexArrayBuffer, VAO } from 'tubugl-core';

const fragmentSrc = `#version 300 es

precision highp float;
uniform sampler2D diffuseMap;
uniform sampler2D alphaMap;
uniform vec4 colorStart;
uniform vec4 colorEnd;
uniform float uTime;

in vec2 vUv;
in vec4 vAO;
in float vLayerCoeff;
out vec4 fragColor;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}


void main(){
    vec4 diffuseColor = texture(diffuseMap, vUv);
    // float alphaColor = texture(alphaMap, vUv * 100. ).r ;
    float alphaColor = clamp((noise(vUv * 1024.) ) , 0.0, 1.0);
    fragColor = diffuseColor * vec4( vAO.rgba );
	fragColor.a *= alphaColor;
	if(fragColor.a < 0.05) discard;
}`;

const vertexSrc = `#version 300 es
precision highp float;

in vec4 position;
in vec2 uv;
in vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform sampler2D alphaMap;
uniform float layerThickness;
uniform float layersCount;
uniform vec4 colorStart;
uniform vec4 colorEnd;
uniform float uTime;
uniform float waveScale;
uniform float stiffness;

const float PI2 = 6.2831852;
const float RANDOM_COEFF_1 = 0.1376;
const float RANDOM_COEFF_2 = 0.3726;
const float RANDOM_COEFF_3 = 0.2546;

out vec4 vAO;
out vec2 vUv;
out float vLayerCoeff;

void main() {
    float f = float(gl_InstanceID + 1) * layerThickness;
    float layerCoeff = float(gl_InstanceID) / layersCount;

    vec4 vertex = position + vec4(normal, 0.0) * vec4(f, f, f, 0.0) ;

    float timePi2 = uTime ;
    float waveScaleFinal = waveScale * pow(layerCoeff, stiffness);
    
    vertex.x += cos( timePi2 + 10. * ( layerCoeff)) * 4. + sin(  timePi2 + ((position.x+position.y+position.z) * RANDOM_COEFF_1)) * waveScaleFinal * layerCoeff; 
    vertex.y += clamp(cos(timePi2 + ((position.x-position.y+position.z) * RANDOM_COEFF_2)) * waveScaleFinal * layerCoeff, 0.0, 1.0);
    vertex.z += sin( timePi2 + 10. * ( layerCoeff)) * 4. + sin(  timePi2 + ((position.x+position.y-position.z) * RANDOM_COEFF_3)) * waveScaleFinal * layerCoeff;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vertex;
    // gl_Position.y = gl_Position.y - layerCoeff * layerCoeff * 100.;

    vUv = vec2(uv.x, 1.0 - uv.y);
    vAO = mix(colorStart, colorEnd, layerCoeff);
    vLayerCoeff = layerCoeff;

}`;

const baseVertSrc = `#version 300 es
in vec4 position;
in vec3 barycentricPosition;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    
}`;

const baseFragmentSrc = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(0., 95./255./10., 153./255./10., 1.0);
}`;

export class FurSphere extends Sphere {
	constructor(
		gl,
		params = { isDepthTest: true },
		radius = 200,
		widthSegments = 20,
		heightSegments = 20
	) {
		super(gl, params, radius, widthSegments, heightSegments);
		this._time = 0;
		this._instanced = 50;
		this._layerThickness = 2;
		this._startColor = [0, 0, 0, 0.6];
		this._endColor = [1.0, 1.0, 1.0, 0.0];
	}

	render(camera, furTexture, alphaTexture) {
		this._updateModelMatrix();
		this.update(camera, furTexture, alphaTexture).draw();
	}

	_makeBuffers() {
		super._makeBuffers();

		this._mainVao = new VAO(this._gl);
		this._mainVao.bind();
	}

	_makeProgram(params) {
		this._baseProgram = new Program(this._gl, baseVertSrc, baseFragmentSrc);
		this._program = new Program(this._gl, vertexSrc, fragmentSrc);
	}

	draw() {
		let gl = this._gl;
		this._gl.enable(CULL_FACE);
		this._gl.enable(DEPTH_TEST);

		this._gl.enable(this._gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);

		this._gl.drawElementsInstanced(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0, this._instanced);

		this._gl.disable(this._gl.BLEND);
		return this;
	}

	updateBase(camera) {
		this._baseProgram.bind();

		this._vao.bind();

		this._gl.uniformMatrix4fv(
			this._baseProgram.getUniforms('modelMatrix').location,
			false,
			this.modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._baseProgram.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._baseProgram.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		return this;
	}

	drawBase() {
		let gl = this._gl;

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this._gl.disable(this._gl.BLEND);
		gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}

	update(camera, furTexture, alphaTexture) {
		this._time += 1 / 60;

		this._program.bind();

		this._updateAttributes(this._program);

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this.modelMatrix
		);

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		this._gl.uniform1f(
			this._program.getUniforms('layerThickness').location,
			this._layerThickness
		);

		this._gl.uniform1f(this._program.getUniforms('layersCount').location, this._instanced);
		this._gl.uniform1f(this._program.getUniforms('waveScale').location, 5);
		if (this._program.getUniforms('uTime'))
			this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);
		this._gl.uniform4f(
			this._program.getUniforms('colorStart').location,
			this._startColor[0],
			this._startColor[1],
			this._startColor[2],
			this._startColor[3]
		);
		this._gl.uniform4f(
			this._program.getUniforms('colorEnd').location,
			this._endColor[0],
			this._endColor[1],
			this._endColor[2],
			this._endColor[3]
		);

		this._program.setUniformTexture(furTexture, 'diffuseMap');
		furTexture.activeTexture().bind();

		// this._program.setUniformTexture(alphaTexture, 'alphaMap');
		// alphaTexture.activeTexture().bind();

		return this;
	}
}
