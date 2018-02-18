const dat = require('dat.gui/build/dat.gui');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');

import { Program, ArrayBuffer, IndexArrayBuffer, Texture } from 'tubugl-core';
import { SkyBox } from './components/skybox';
import { OrthographicCamera, CameraController, PerspectiveCamera } from 'tubugl-camera';
import { CubeMapTexture } from './components/cubeMapTexture';

import posXImageURL from '../assets/envmap/posx.jpg';
import negXImageURL from '../assets/envmap/negx.jpg';
import posYImageURL from '../assets/envmap/posy.jpg';
import negYImageURL from '../assets/envmap/negy.jpg';
import posZImageURL from '../assets/envmap/posz.jpg';
import negZImageURL from '../assets/envmap/negz.jpg';
import { RGBA, UNSIGNED_BYTE } from 'tubugl-constants';

const cubemapImageURLArray = [
	posXImageURL,
	negXImageURL,
	posYImageURL,
	negYImageURL,
	posZImageURL,
	negZImageURL
];

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
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 45, 1, 10000);
		this._camera.position.z = 10;
		this._camera.lookAt([0, 0, 0]);
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
		this._cameraController.maxDistance = 1200;
	}

	_makePlane() {}

	_makeTexture() {
		this._fontTexture = new Texture(this.gl, this.gl.RGBA, this.gl.RGBA);
		this._fontTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._fontImg, this._fontImg.width, this._fontImg.height);
	}

	_makeMesh() {
		this._skybox = new SkyBox(this.gl);
	}
	_onLoadAssetsDone() {
		this._updateCubeTexture();
		this._skybox.updateTexture(this._cubemapTexture);

		// this.loop();
		this._playAndStop();
	}

	_updateCubeTexture() {
		let size = 1024;
		this._cubemapTexture = new CubeMapTexture(this.gl);
		this._cubemapTexture
			.bind()

			.fromImages(this._cubeImages, size, size)
			.setFilter();
	}

	animateIn() {
		this._cubeImages = [];
		this._loadedCnt = 0;
		this._makeMesh();
		cubemapImageURLArray.forEach((cubemapImageUrl, index) => {
			let image = new Image();
			image.onload = () => {
				this._loadedCnt++;
				if (this._loadedCnt == cubemapImageURLArray.length) this._onLoadAssetsDone();
			};
			image.src = cubemapImageUrl;
			this._cubeImages.push(image);
		});
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._skybox.render(this._camera);
		this._camera.update();
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
