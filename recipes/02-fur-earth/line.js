import { Program, ArrayBuffer } from 'tubugl-core';
import { VAO } from 'tubugl-core/src/vao';
import { LINES, UNSIGNED_SHORT } from 'tubugl-constants';
import { IndexArrayBuffer } from 'tubugl-core/src/indexArrayBuffer';

const wireFrameFragSrc = `
precision mediump float;

void main(){
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

export const baseShaderVertSrc = `
attribute float position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform vec3 uStartPos;
uniform vec3 uEndPos;



void main(){
	vec3 middlePos = (uStartPos + 3.0 * uEndPos)/2.;
    vec3 curPos = position * position *  uStartPos +  2.0 * position * (1.0 - position) * middlePos + (1.0 - position)  * (1.0 - position) * uEndPos;
    gl_Position = projectionMatrix * viewMatrix * vec4(curPos, 1.0);
}
`;

export class Line {
	constructor(gl, params = {}) {
		this._gl = gl;

		this._segments = 20;
		this._startPos = params.startPos;
		this._endPos = params.endPos;

		console.log(this._endPos);

		this._makeProgram();
		this._makeBuffers();
	}

	_makeProgram() {
		this._wireframeProgram = new Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
	}

	_makeBuffers() {
		let vertices = this.getVertices(this._segments);
		let indices = this.getIndices(this._segments);

		this._positionBuffer = new ArrayBuffer(this._gl, vertices);
		this._positionBuffer.setAttribs('position', 1);
		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = indices.length;
	}

	render(camera) {
		this.update(camera).draw();

		return this;
	}

	update(camera) {
		let prg = this._wireframeProgram;

		prg.bind();

		this._positionBuffer.bind().attribPointer(prg);
		this._indexBuffer.bind();

		this._gl.uniformMatrix4fv(prg.getUniforms('viewMatrix').location, false, camera.viewMatrix);
		this._gl.uniformMatrix4fv(
			prg.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		this._gl.uniform3f(
			prg.getUniforms('uStartPos').location,
			this._startPos[0],
			this._startPos[1],
			this._startPos[2]
		);
		this._gl.uniform3f(
			prg.getUniforms('uEndPos').location,
			this._endPos[0],
			this._endPos[1],
			this._endPos[2]
		);

		return this;
	}

	draw() {
		this._gl.drawElements(LINES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}

	getVertices(segments) {
		let vertices = [];
		let xRate = 1 / segments;

		for (let ii = 0; ii <= segments; ii++) {
			vertices.push(xRate * ii);
		}

		vertices = new Float32Array(vertices);

		return vertices;
	}
	getIndices(segments) {
		let indices = [];

		for (let xx = 0; xx < segments; xx++) {
			indices.push(xx);
			indices.push(xx + 1);
		}

		indices = new Uint16Array(indices);

		return indices;
	}
}
