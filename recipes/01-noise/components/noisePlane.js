import { UvPlane } from 'tubugl-2d-shape';
import { Program } from 'tubugl-core/src/program';

const vertexShaderSrc = require('./shaders/noise.vert');
const fragmentShaderSrc = require('./shaders/noise.frag');

export class NoisePlane extends UvPlane {
	constructor(gl, params = {}, width, height, widthSegments = 1, heightSegments = 1) {
		super(gl, width, height, widthSegments, heightSegments);
		this._time = 0;
		this._size = 100;

		this._text = params.text;
		this._fontData = params.fontData;
	}
	_makeProgram() {
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}
	render(camera) {
		super.render(camera);
	}
	update(camera) {
		this._time += 1 / 60;
		super.update(camera);
		this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);
		this._gl.uniform2f(this._program.getUniforms('uSize').location, this._size, this._size);
		return this;
	}
}
