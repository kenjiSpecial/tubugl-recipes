const dat = require('dat.gui/build/dat.gui');
require('gsap');
const Stats = require('stats.js');

import furImageURL from '../assets/earth.jpg';
import unevenAlphaImageURL from '../assets/noise.jpg';

import robotoJson from '../assets/roboto.json';
import fontImgUrl from '../assets/roboto.png';

import { Texture } from 'tubugl-core';
import { PerspectiveCamera } from 'tubugl-camera';
import { FurSphere } from './furSphere';
import { Text } from 'tubugl-font/src/text';
import { CameraController } from 'tubugl-camera/src/cameraController';

export default class App {
	constructor(params = {}) {
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;
		this._pixelRatio = window.devicePixelRatio;
		if (this._pixelRatio > 1.5) this._pixelRatio = 1.5;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl2', {
			transparent: false
		});
		if (this.gl) this.isWebgl2 = true;
		if (!this.gl) {
			let info = document.createElement('div');
			document.body.appendChild(info);
			info.innerHTML =
				'WebGL 2 is not available.  See <a style="color: blue;" href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>';
			info.style.position = 'absolute';
			info.style.top = '20px';
			info.style.left = '20px';
			info.style.color = '#000';

			let descId = document.getElementById('tubugl-desc');
			descId.style.display = 'none';
			return;
		}

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
		this._makeShape();
		this._makeText();

		this.resize(this._width, this._height);
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
	}

	_makeShape() {
		this._cube = new FurSphere(
			this.gl,
			{
				isGl2: this.isWebgl2
			},
			200,
			32,
			32
		);

		let theta = Math.PI / 180 * 4.8952;
		let phi = Math.PI / 180 * 52.3702;

		let rad = 300;
		this._amsPosition = [
			rad * Math.sin(theta + Math.PI / 2) * Math.cos(phi),
			rad * Math.sin(phi),
			rad * Math.cos(theta + Math.PI / 2) * Math.cos(phi)
		];

		// 36.2048° N, 138.2529° E
		theta = 138.2529 / 180 * Math.PI;
		phi = 36.2048 / 180 * Math.PI;
		this._japanPosition = [
			rad * Math.sin(theta + Math.PI / 2) * Math.cos(phi),
			rad * Math.sin(phi),
			rad * Math.cos(theta + Math.PI / 2) * Math.cos(phi)
		];
	}

	_makeText() {
		this._text = new Text(
			this.gl,
			{ side: 'front' },
			'I live in Amsterdam',
			robotoJson,
			null,
			10
		);
		this._text.rotation.y = Math.PI / 2;
		// this._text.rotation.x = Math.PI / 10;
		this._text.position.x = this._amsPosition[0];
		this._text.position.y = this._amsPosition[1];
		this._text.position.z = this._amsPosition[2];
		this._text.smoothing = 1 / 3;

		this._fromText = new Text(
			this.gl,
			{ side: 'front' },
			'I am from Japan',
			robotoJson,
			null,
			10
		);
		this._fromText.rotation.y = Math.PI * 40 / 180 - Math.PI;
		this._fromText.position.x = this._japanPosition[0];
		this._fromText.position.y = this._japanPosition[1];
		this._fromText.position.z = this._japanPosition[2];
		this._fromText.smoothing = 1 / 3;
	}

	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.position.x = 800 * Math.cos(Math.PI / 5);
		this._camera.position.y = 800 * Math.sin(Math.PI / 5);
		this._camera.lookAt([0, 0, 0]);
	}

	_makeCameraController() {
		this._controller = new CameraController(this._camera, this.gl.canvas);
	}

	animateIn() {
		this._startLoad();
	}

	loop() {
		if (this.stats) this.stats.update();
		let gl = this.gl;

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this._camera.update();
		this._cube.render(this._camera, this._furTexture, this._alphaTexture);

		gl.bindVertexArray(null);

		this._text.render(this._camera);
		this._fromText.render(this._camera);
	}

	animateOut() {
		TweenMax.ticker.removeEventListener('tick', this.loop, this);
	}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_onload() {
		this._imgCnt++;
		if (this._imgCnt < 3) return;

		this._furTexture = new Texture(this.gl);
		this._furTexture.name = 'diffuseMap';
		this._furTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._furImage, this._furImage.width, this._furImage.height);

		this._alphaTexture = new Texture(this.gl);
		this._alphaTexture.name = 'alphaMap';
		this._alphaTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._alphaImage, this._alphaImage.width, this._alphaImage.height);

		// // -- // --- // --- // --|- _ -|-- \\ --- \\ --- \\ -- \\ \\

		this._fontTexture = new Texture(this.gl, this.gl.RGBA, this.gl.RGBA);
		this._fontTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._fontImage, this._fontImage.width, this._fontImage.height);
		this._text.updateFontTexture(this._fontTexture);
		this._fromText.updateFontTexture(this._fontTexture);

		this._playAndStop();
	}

	_startLoad() {
		this._imgCnt = 0;

		this._furImage = new Image();
		this._furImage.onload = this._onload.bind(this);
		this._furImage.onerror = function() {
			console.error('image load error');
		};
		this._furImage.src = furImageURL;

		this._alphaImage = new Image();
		this._alphaImage.onload = this._onload.bind(this);
		this._alphaImage.onerror = function() {
			console.error('image load error');
		};
		this._alphaImage.src = unevenAlphaImageURL;

		this._fontImage = new Image();
		this._fontImage.onload = this._onload.bind(this);
		this._fontImage.onerror = function() {
			console.error('image load error');
		};
		this._fontImage.src = fontImgUrl;
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenMax.ticker.addEventListener('tick', this.loop, this);
			if (this.playAndStopGui) this.playAndStopGui.name('pause');
		} else {
			TweenMax.ticker.removeEventListener('tick', this.loop, this);
			if (this.playAndStopGui) this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		this.canvas.width = this._width * this._pixelRatio;
		this.canvas.height = this._height * this._pixelRatio;
		this.canvas.style.width = this._width + 'px';
		this.canvas.style.height = this._height + 'px';
		this.gl.viewport(0, 0, this._width, this._height);

		// this._obj.program.bind();
		// this.gl.uniform1f(
		// 	this._program.getUniforms('uWindowRate').location,
		// 	this._height / this._width
		// );
	}

	destroy() {}
}
