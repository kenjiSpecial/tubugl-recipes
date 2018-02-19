import { Shape3D, Sphere } from 'tubugl-3d-shape/build/tubu-3d-shape.js';

import { ArrayBuffer, IndexArrayBuffer, Program } from 'tubugl-core';

const vertexShaderSrc = require('./shaders/fire.vert.glsl');
const fragmentShaderSrc = require('./shaders/fire.frag.glsl');

import {
	TRIANGLES,
	UNSIGNED_SHORT,
	CULL_FACE,
	DEPTH_TEST,
	BLEND,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	BACK,
	FRONT
} from 'tubugl-constants';

import { vec3 } from 'gl-matrix';

export class Cylinder extends Shape3D {
	constructor(
		gl,
		params,
		_radiusTop,
		_radiusBottom,
		_height,
		_radialSegments = 3,
		_heightSegments = 2
	) {
		super(gl, params);

		// this._radiusTop = radiusTop;
		// this._radiusBottom = radiusBottom;
		// this._height = height;
		// this._radialSegments = radialSegments;
		// this._heightSegments = heightSegments;
		let radius = 50,
			widthSegments = 30,
			heightSegments = 20,
			phiStart = 0,
			phiLength = 2 * Math.PI,
			thetaStart = 0,
			thetaLength = Math.PI;
		this._radius = radius;
		this._widthSegments = widthSegments;
		this._heightSegments = heightSegments;
		this._phiStart = phiStart;
		this._phiLength = phiLength;
		this._thetaStart = thetaStart;
		this._thetaLength = thetaLength;

		this.scale.y = 2;
		this.position.y = radius * 2;
		if (this._radialSegments < 3) {
			console.warn('make sure radialsegment more than 3');
			return;
		}

		this._makeProgram(params);
		this._makeBuffers(params);
	}

	getVertice() {
		return this._positionBuffer.dataArray;
	}

	getNormals() {
		return this._normalBuffer.dataArray;
	}

	render(camera, frameBuffer) {
		this.update(camera, frameBuffer).draw();
		// if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera, frameBuffer) {
		super.update(camera);

		// console.log(frameBuffer);
		this._program.setUniformTexture(frameBuffer.texture, 'noiseTexture');
		frameBuffer.texture.activeTexture().bind();

		if (!this._time) this._time = 0;
		this._time += 1 / 60;
		// console.log(this._time);
		// console.log(this._program.uniform);
		// this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);

		return this;
	}

	addGui(gui) {
		let positionFolder = gui.addFolder('position');
		positionFolder.add(this.position, 'x', -200, 200);
		positionFolder.add(this.position, 'y', -200, 200);
		positionFolder.add(this.position, 'z', -200, 200);

		let scaleFolder = gui.addFolder('scale');
		scaleFolder.add(this.scale, 'x', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'y', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'z', 0.05, 2).step(0.01);

		let rotationFolder = gui.addFolder('rotation');
		rotationFolder.add(this.rotation, 'x', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'y', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'z', -Math.PI, Math.PI).step(0.01);
	}

	// ========================
	//        private
	// ========================
	_updateDrawStatus(side) {
		if (side === 'double') {
			this._gl.disable(CULL_FACE);
		} else if (side === 'front') {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(BACK);
		} else {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(FRONT);
		}

		this._gl.enable(DEPTH_TEST);
		// else this._gl.disable(DEPTH_TEST);

		// if (this._isTransparent) {
		this._gl.enable(BLEND);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		// } else {
		// this._gl.blendFunc(ONE, ZERO);
		// this._gl.disable(BLEND);
		// }
	}
	_makeProgram() {
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeBuffers() {
		// let vertices = [];
		// let indices = [];
		// let normals = [];
		// let uvs = [];
		let index = 0;

		let { vertice, uvs, normals, indices } = Sphere.getData(
			this._radius,
			this._widthSegments,
			this._heightSegments,
			this._phiStart,
			this._phiLength,
			this._thetaStart,
			this._thetaLength
		);
		// index = this._generateTorso(vertices, indices, normals, uvs, index);
		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(vertice));

		this._positionBuffer.setAttribs('position', 3);

		this._normalBuffer = new ArrayBuffer(this._gl, new Float32Array(normals));
		this._normalBuffer.setAttribs('normal', 3);

		this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(uvs));
		this._uvBuffer.setAttribs('uv', 2);

		this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));

		this._cnt = indices.length;
	}

	_generateTorso(vertices, indices, normals, uvs, index) {
		let slope = (this._radiusBottom - this._radiusBottom) / this._height;
		let indexArray = [];

		let normal = vec3.create();

		for (let yy = 0; yy <= this._heightSegments; yy++) {
			let indexRow = [];
			let vv = yy / this._heightSegments;

			let radius = vv * (this._radiusBottom - this._radiusTop) + this._radiusTop;

			for (let xx = 0; xx <= this._radialSegments; xx++) {
				let uu = xx / this._radialSegments;
				let theta = 2 * Math.PI * uu;

				let sinTheta = Math.sin(theta);
				let cosTheta = Math.cos(theta);

				vertices.push(radius * sinTheta, (-vv + 0.5) * this._height, radius * cosTheta);
				vec3.normalize(normal, [sinTheta, slope, cosTheta]);
				normals.push(normal[0], normal[1], normal[2]);
				uu = 2 * uu;
				if (uu > 1.0) uu = 2.0 - uu;
				uvs.push(uu, 1 - vv);

				indexRow.push(index++);
			}

			indexArray.push(indexRow);
		}

		for (let xx = 0; xx < this._radialSegments; xx++) {
			for (let yy = 0; yy < this._heightSegments; yy++) {
				var a = indexArray[yy][xx];
				var b = indexArray[yy + 1][xx];
				var c = indexArray[yy + 1][xx + 1];
				var d = indexArray[yy][xx + 1];

				// faces

				indices.push(a, b, d);
				indices.push(b, c, d);
			}
		}

		return index;
	}

	_generateCap(isTop = true, vertices, indices, normals, uvs, index) {
		let centerIndexStart, centerIndexEnd;

		let sign = isTop === true ? 1 : -1;
		let radius = isTop === true ? this._radiusTop : this._radiusBottom;

		centerIndexStart = index;

		for (let xx = 1; xx <= this._radialSegments; xx++) {
			vertices.push(0, this._height / 2 * sign, 0);
			normals.push(0, sign, 0);
			uvs.push(0.5, 0.5);
			index++;
		}

		centerIndexEnd = index;

		for (let xx = 0; xx <= this._radialSegments; xx++) {
			let u = xx / this._radialSegments;
			let theta = u * 2 * Math.PI;

			let cosTheta = Math.cos(theta);
			let sinTheta = Math.sin(theta);

			vertices.push(radius * sinTheta, sign * this._height / 2, radius * cosTheta);

			normals.push(0, sign, 0);

			uvs.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 * sign + 0.5);
			index++;
		}

		for (let xx = 0; xx < this._radialSegments; xx++) {
			let c = centerIndexStart + xx;
			let i = centerIndexEnd + xx;

			if (top === true) {
				// face top

				indices.push(i, i + 1, c);
			} else {
				// face bottom

				indices.push(i + 1, i, c);
			}
		}

		return index;
	}

	_updateUniforms(camera) {
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
	}

	_updateAttributes() {
		this._positionBuffer.bind().attribPointer(this._program);
		this._uvBuffer.bind().attribPointer(this._program);
		this._normalBuffer.bind().attribPointer(this._program);
		this._indexBuffer.bind();
	}

	draw() {
		this._updateDrawStatus('back');
		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		this._updateDrawStatus('front');
		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}
}
