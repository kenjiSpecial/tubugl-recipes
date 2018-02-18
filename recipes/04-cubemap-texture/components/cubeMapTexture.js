import {
	RGBA,
	UNSIGNED_BYTE,
	TEXTURE0,
	TEXTURE_CUBE_MAP,
	TEXTURE_CUBE_MAP_POSITIVE_X,
	LINEAR,
	TEXTURE_MIN_FILTER,
	NEAREST,
	TEXTURE_MAG_FILTER,
	RGB
} from 'tubugl-constants';

export class CubeMapTexture {
	constructor(gl, format = RGB, internalFormat = RGB, type = UNSIGNED_BYTE, unit = 0) {
		this._gl = gl;
		if (!this._gl) {
			console.error('[Texture]gl is missed');
			return;
		}

		/**
		 * @member WebGLTexture */
		this._texture = this._gl.createTexture();
		/** @member GLenum */
		this.textureNum = unit;
		/** @member GLenum */
		this.unit = TEXTURE0 + unit;

		this.setFormat(format, internalFormat, type);
	}
	bind() {
		this._gl.bindTexture(TEXTURE_CUBE_MAP, this._texture);
		return this;
	}

	fromImages(images = images, width, height) {
		this._width = width;
		this._height = height;

		for (let ii = 0; ii < images.length; ii++) {
			this._gl.texImage2D(
				TEXTURE_CUBE_MAP_POSITIVE_X + ii,
				0,
				this._internalFormt,
				this._format,
				this._type,
				images[ii]
			);
		}

		return this;
	}

	unbind() {
		this._gl.bindTexture(TEXTURE_CUBE_MAP, null);
		return this;
	}

	/**
	 *
	 * @description update format for texture
	 *
	 * @param {GLenum} format
	 * @param {GLenum} internalFormat
	 * @param {Glenum} type
	 */
	setFormat(format, internalFormat, type) {
		if (format) this._format = format;
		if (internalFormat) this._internalFormt = internalFormat;
		if (type) this._type = type;

		return this;
	}

	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
	 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getTexParameter
	 * https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html
	 *
	 * @param {GLenum} filter
	 *
	 * @returns {Texture}
	 */
	setFilter(filter = LINEAR) {
		this.setMinFilter(filter);
		this.setMagFilter(filter);

		return this;
	}

	/**
	 * set mag filter to texture
	 *
	 * @param {GLenum} filter
	 *
	 * @returns {Texture}
	 */
	setMagFilter(filter = LINEAR) {
		this._gl.texParameteri(TEXTURE_CUBE_MAP, TEXTURE_MIN_FILTER, filter);

		return this;
	}

	/**
	 * set min filter to texture
	 *
	 * @param {GLenum} filter
	 *
	 * @returns {Texture}
	 */
	setMinFilter(filter = NEAREST) {
		this._gl.texParameteri(TEXTURE_CUBE_MAP, TEXTURE_MAG_FILTER, filter);

		return this;
	}

	/**
	 * @description active texture
	 * @returns {Texture}
	 */
	activeTexture() {
		this._gl.activeTexture(this.unit);
		return this;
	}
}
