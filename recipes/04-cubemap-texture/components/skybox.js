import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';
import { Cube } from 'tubugl-3d-shape';
import { mat4 } from 'gl-matrix';
import {
	CULL_FACE,
	BACK,
	FRONT,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	BLEND,
	ONE,
	ZERO,
	TRIANGLES,
	UNSIGNED_SHORT
} from 'tubugl-constants';

export class SkyBox {
	constructor(gl) {
		this._gl = gl;
		this._makeProgram();
		this._makeBuffer();
		this._makeModelMatrix();
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/base.frag.glsl')
		);
	}
	_makeBuffer() {
		let cubeObj = Cube.getVertice(1, 1, 1, 1, 1, 1);
		let indices = Cube.getIndices(1, 1, 1);
		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(cubeObj.vertices));
		this._positionBuffer.setAttribs('position', 3);

		this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));

		this._cnt = indices.length;
	}
	_makeModelMatrix() {
		this._modelMat = mat4.create();
		// mat4.identity(this._modelMat);
		let scale = 2000;
		mat4.fromScaling(this._modelMat, [scale, scale, scale]);
	}
	_updateDrawStatus() {
		// if (this._side === 'double') {
		// this._gl.disable(CULL_FACE);
		// } else if (this._side === 'front') {
		this._gl.enable(CULL_FACE);
		this._gl.cullFace(BACK);
		// } else {
		// this._gl.enable(CULL_FACE);
		// this._gl.cullFace(FRONT);
		// }

		this._gl.enable(DEPTH_TEST);
		// else this._gl.disable(DEPTH_TEST);

		// if (this._isTransparent) {
		// this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		// this._gl.enable(BLEND);
		// } else {
		this._gl.blendFunc(ONE, ZERO);
		this._gl.disable(BLEND);
		// }
	}
	updateTexture(cubemapTexture) {
		this._cubemapTexture = cubemapTexture;
		console.log(this._program.uniform);
	}
	render(camera) {
		this._program.use();
		// update attribute
		this._positionBuffer.bind().attribPointer(this._program);
		this._indexBuffer.bind();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this._modelMat
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

		/**
		this._program.setUniformTexture(this._texture.value, 'uTexture');
		 */
		this._cubemapTexture.activeTexture().bind();
		this._gl.uniform1i(this._program.getUniforms('uTexture').location, 0);

		this._updateDrawStatus();
		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);
	}
}
