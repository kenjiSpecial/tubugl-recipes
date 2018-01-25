import { UvPlane } from 'tubugl-2d-shape';
import { Program } from 'tubugl-core/src/program';

const vertexShaderSrc = require('./shaders/genericNoise.vert.glsl');
const fragmentShaderSrc = require('./shaders/genericNoise.frag.glsl');
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
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}
	_updateModelMatrix() {
		let obj = super._updateModelMatrix();
		if (obj) {
			this._textObject.position.y = -this._size / 2 - 20;
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
			14
		);
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
		this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);
		this._gl.uniform2f(this._program.getUniforms('uSize').location, this._size, this._size);
		return this;
	}
}
