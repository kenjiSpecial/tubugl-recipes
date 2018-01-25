// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

import { UvPlane } from 'tubugl-2d-shape';
import { Program } from 'tubugl-core/src/program';
import { Text } from 'tubugl-font/src/text';

export class NoisePlane extends UvPlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, width, height, widthSegments, heightSegments);
		this._time = 0;
		this._size = 100;

		this._text = params.text;
		this._fontData = params.fontData;

		this._makeText();
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/genericNoise.frag.glsl')
		);
	}
	_updateModelMatrix() {
		let obj = super._updateModelMatrix();
		if (obj) {
			this._textObject.position.y = this.position.y - this._size / 2 - 10;
			this._textObject.position.x = this.position.x;
		}
	}
	_makeText() {
		this._textObject = new Text(
			this._gl,
			{},
			this._text,
			this._fontData.json,
			this._fontData.texture,
			12
		);
		this._textObject.smoothing = 1 / 2;
		this._textObject.hintAmount = 0;
		this._textObject.subpixelAmount = 0;

		this._textObject.position.y = -this._size / 2 - 20;
		this._textObject.position.x = this.position.x;
	}
	render(camera) {
		super.render(camera);
		this._textObject.render(camera);

		return this;
	}
	update(camera) {
		this._time += 1 / 60;
		super.update(camera);
		if (this._program.getUniforms('uTime'))
			this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);
		if (this._program.getUniforms('uSize'))
			this._gl.uniform2f(this._program.getUniforms('uSize').location, this._size, this._size);
		return this;
	}
}

export class Noise3Plane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/genericNoise3.frag.glsl')
		);
	}
}

export class PerlinNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/perlin.frag.glsl')
		);
	}
}

export class ClassicPerlin2DNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/classic2DPerlin.frag.glsl')
		);
	}
}

export class ClassicPerlin3DNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/classic3DPerlin.frag.glsl')
		);
	}
}

export class Simplex2DNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/simplex2d.frag.glsl')
		);
	}
}

export class Simplex3DNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/simplex3d.frag.glsl')
		);
	}
}

export class Simplex3DNoiseVer2Plane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/simplex3dpart2.frag.glsl')
		);
	}
}

export class Simplex4DNoisePlane extends NoisePlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, params, width, height, widthSegments, heightSegments);
	}
	_makeProgram() {
		this._program = new Program(
			this._gl,
			require('./shaders/base.vert.glsl'),
			require('./shaders/simplex4d.frag.glsl')
		);
	}
}
