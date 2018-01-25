const dat = require('dat.gui/build/dat.gui');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');
import imageURL from '../assets/image.jpg';
import uvImageURL from '../assets/uv_img.jpg';

import { Program, ArrayBuffer, IndexArrayBuffer, Texture } from 'tubugl-core';
import { OrthographicCamera, CameraController } from 'tubugl-camera';
import { NoisePlane } from './components/noisePlane';

import fontJson from '../assets/roboto.json';
import fontImgURL from '../assets/roboto.png';

export default class App {
	constructor(params = {}) {
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;
		this.isLoop = false;
		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');

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
		this._camera = new OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			1,
			2000
		);

		this._camera.position.z = 100;
		this._camera.lookAt([0, 0, 0]);
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
	}

	_makePlane() {
		this._plane = new NoisePlane(this.gl, {
			text: '2d generic noise',
			fontData: { texture: this._fontTexture, json: fontJson, x: -200 }
		});
		this._plane.position.x = -200;
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
		this._fontImg = new Image();
		this._fontImg.onload = () => {
			this._isLoaded = true;
			this._makeTexture();
			this._makePlane();
			this._playAndStop();
		};
		this._fontImg.src = fontImgURL;
		// this._playAndStop();
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._camera.update();
		this._plane.render(this._camera);
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

		if (this._camera)
			this._camera.updateSize(
				-this._width / 2,
				this._width / 2,
				this._height / 2,
				-this._height / 2
			);
	}

	destroy() {}
}
