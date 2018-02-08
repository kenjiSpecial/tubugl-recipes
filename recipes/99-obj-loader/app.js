const dat = require('dat.gui/build/dat.gui');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');
const baseVert = require('./shaders/base.vert.glsl');
const baseFrag = require('./shaders/base.frag.glsl');
import bunnyObjUrl from '../assets/bunny.obj';

import { Program, ArrayBuffer, IndexArrayBuffer, Texture } from 'tubugl-core';
import { CameraController } from 'tubugl-camera';

import { PerspectiveCamera } from 'tubugl-camera/src/perspectiveCamera';
import { mat4 } from 'gl-matrix/src/gl-matrix';
import {
	TRIANGLES,
	UNSIGNED_INT,
	UNSIGNED_BYTE,
	UNSIGNED_SHORT,
	DEPTH_TEST,
	BACK,
	CULL_FACE,
	BLEND
} from 'tubugl-constants';

var ObjMtlLoader = require('obj-mtl-loader');

export default class App {
	constructor(params = {}) {
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;
		this.isLoop = false;
		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');
		// let ext = this.gl.getExtension('OES_element_index_uint');
		// console.log(ext);

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		} else {
			let descId = document.getElementById('tubugl-desc');
			descId.style.display = 'none';
		}

		this._makeCamera();
		this._makeCameraController();

		this.resize(this._width, this._height);
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
	}

	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 0.1, 100);

		this._camera.position.z = 10;
		this._camera.lookAt([0, 0, 0]);
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
	}

	_makeBunny(data) {
		let program = new Program(this.gl, baseVert, baseFrag);

		// make buffer
		// let positions = new Float32Array(data.vertices.length * 3);
		// for (let ii = 0; ii < data.vertices.length; ii++) {
		//
		// 	positions[3 * ii + 1] = data.vertices[ii][1];
		// 	positions[3 * ii + 2] = data.vertices[ii][2];
		// }

		// let normals = new Float32Array(data.normals.length * 3);
		// for (let ii = 0; ii < data.normals.length; ii++) {
		// 	normals[3 * ii] = data.normals[ii][0];
		// 	normals[3 * ii + 1] = data.normals[ii][1];
		// 	normals[3 * ii + 2] = data.normals[ii][2];
		// }

		console.log(data);
		let indices = new Uint16Array(data.faces.length * 3);
		let positions = new Float32Array(data.faces.length * 3 * 3);
		let normals = new Float32Array(data.faces.length * 3 * 3);
		for (let ii = 0; ii < data.faces.length; ii++) {
			// indices[3 * ii] = ii * 3;
			let index0 = parseInt(data.faces[ii].indices[0] - 1);
			let index1 = parseInt(data.faces[ii].indices[1] - 1);
			let index2 = parseInt(data.faces[ii].indices[2] - 1);
			[index0, index1, index2].forEach((index, jj) => {
				positions[9 * ii + 3 * jj + 0] = data.vertices[index][0];
				positions[9 * ii + 3 * jj + 1] = data.vertices[index][1];
				positions[9 * ii + 3 * jj + 2] = data.vertices[index][2];
			});

			if (data.faces[ii].normal.length > 2) {
				let nIndex0 = parseInt(data.faces[ii].normal[0] - 1);
				let nIndex1 = parseInt(data.faces[ii].normal[1] - 1);
				let nIndex2 = parseInt(data.faces[ii].normal[2] - 1);

				[nIndex0, nIndex1, nIndex2].forEach((index, jj) => {
					normals[9 * ii + 3 * jj + 0] = data.normals[index][0];
					normals[9 * ii + 3 * jj + 1] = data.normals[index][1];
					normals[9 * ii + 3 * jj + 2] = data.normals[index][2];
				});
			}
			// indices[3 * ii + 1] = ii * 3 + 1;
			// indices[3 * ii + 2] = ii * 3 + 2;
			// parseInt(data.faces[ii].indices[2] - 1);
		}

		console.log(positions);

		let positionBuffer = new ArrayBuffer(this.gl, positions);

		positionBuffer.setAttribs('position', 3);

		let normalBuffer = new ArrayBuffer(this.gl, normals);
		normalBuffer.setAttribs('normal', 3);

		let indexBuffer = new IndexArrayBuffer(this.gl, indices);
		let cnt = data.faces.length * 3;

		let modelMatrix = mat4.create();
		let normalMatrix = mat4.create();

		let scale = 1;
		mat4.scale(modelMatrix, modelMatrix, [scale, scale, scale]);

		this._bunny = {
			program: program,
			positionBuffer: positionBuffer,
			normalBuffer: normalBuffer,
			indexBuffer: indexBuffer,
			cnt: cnt,
			matrix: {
				modelMatrix: modelMatrix,
				normalMatrix: normalMatrix
			}
		};
	}

	_makeTexture() {
		this._fontTexture = new Texture(this.gl, this.gl.RGBA, this.gl.RGBA);
		this._fontTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._fontImg, this._fontImg.width, this._fontImg.height);
	}

	animateIn() {
		this._objMtlLoader = new ObjMtlLoader();
		this._objMtlLoader.load(bunnyObjUrl, (err, result) => {
			this._makeBunny(result);
			this._playAndStop();
		});
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._camera.update();

		this._bunny.program.use();

		this._bunny.positionBuffer.bind().attribPointer(this._bunny.program);
		this._bunny.normalBuffer.bind().attribPointer(this._bunny.program);
		// this._bunny.indexBuffer.bind();

		this.gl.uniformMatrix4fv(
			this._bunny.program.getUniforms('modelMatrix').location,
			false,
			this._bunny.matrix.modelMatrix
		);
		// this.gl.uniformMatrix4fv(
		// 	this._bunny.program.getUniforms('normalMatrix').location,
		// 	false,
		// 	this._bunny.matrix.normalMatrix
		// );
		this.gl.uniformMatrix4fv(
			this._bunny.program.getUniforms('viewMatrix').location,
			false,
			this._camera.viewMatrix
		);
		this.gl.uniformMatrix4fv(
			this._bunny.program.getUniforms('projectionMatrix').location,
			false,
			this._camera.projectionMatrix
		);

		// this.gl.drawElements(TRIANGLES, this._bunny.cnt, UNSIGNED_BYTE, 0);
		// this.gl.enable(CULL_FACE);
		// this.gl.cullFace(BACK);
		this.gl.enable(DEPTH_TEST);
		this.gl.disable(BLEND);

		this.gl.drawArrays(TRIANGLES, 0, this._bunny.cnt);
		// this.gl.drawElements(TRIANGLES, this._bunny.cnt, UNSIGNED_SHORT, 0);
		// this.gl.drawElements(TRIANGLES, 3 * 3, UNSIGNED_BYTE, 0);
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	onMouseMove(mouse) {}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_onload() {
		this._texture = new Texture(this.gl);
		this._texture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._image, this._image.width, this._image.height);

		this._obj.program.bind();
		this.gl.uniform1f(
			this._program.getUniforms('uImageRate').location,
			this._image.height / this._image.width
		);

		this._playAndStop();
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenLite.ticker.addEventListener('tick', this.loop, this);
			if (this.playAndStopGui) this.playAndStopGui.name('pause');
		} else {
			TweenLite.ticker.removeEventListener('tick', this.loop, this);
			if (this.playAndStopGui) this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		this.canvas.width = this._width;
		this.canvas.height = this._height;
		this.gl.viewport(0, 0, this._width, this._height);

		if (this._camera) this._camera.updateSize(this._width, this._height);
	}

	destroy() {}
}
