const dat = require('../vendors/dat.gui.min');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');
import imageURL from '../assets/image.jpg';
import uvImageURL from '../assets/uv_img.jpg';

import { Program, ArrayBuffer, IndexArrayBuffer, Texture, FrameBuffer } from 'tubugl-core';
import { OrthographicCamera, CameraController, PerspectiveCamera } from 'tubugl-camera';
import { NoisePlane } from './components/noisePlane';

import fontJson from '../assets/roboto.json';
import fontImgURL from '../assets/roboto.png';
import { Cylinder } from './components/cylinder';

import { GridHelper2 } from 'tubugl-helper';

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
		this._makeHelper();

		this.resize(this._width, this._height);
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
	}

	_makeCamera() {
		this._planeCamera = new OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			1,
			2000
		);

		this._planeCamera.position.z = 100;
		this._planeCamera.lookAt([0, 0, 0]);

		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.position.z = 300;
		this._camera.position.y = 100;
		this._camera.position.x = 300;

		this._camera.lookAt([0, 0, 0]);
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
	}

	_makeHelper() {
		this._gridHelper = new GridHelper2(this.gl, {}, 300, 300, 5, 5);
	}

	_makeFrameBuffer() {
		let planeSize = this._noisePlane.size;
		this._framebuffer = new FrameBuffer(this.gl, {}, planeSize, planeSize);
		this._framebuffer.unbind();

		this._frameBufferCamera = new OrthographicCamera(
			-planeSize / 2,
			planeSize / 2,
			planeSize / 2,
			-planeSize / 2,
			1,
			2000
		);

		this._frameBufferCamera.position.z = 100;
		this._frameBufferCamera.lookAt([0, 0, 0]);
	}

	_makePlane() {
		this._planes = [];

		let noisePlane = new NoisePlane(this.gl, {
			text: 'Simplex noise',
			fontData: { texture: this._fontTexture, json: fontJson }
		});
		// noisePlane.position.x = (window.innerWidth - noisePlane.size) / 2 - 20;
		this._noisePlane = noisePlane;

		// let debugPlane = new debugPlane(this.gl)
		// this._planes.push(noisePlane);
	}

	_makeCylinder() {
		this._cylinder = new Cylinder(this.gl, { isTransparent: true }, 60, 80, 200, 80, 1);
		if (this.gui) this._cylinder.addGui(this.gui);
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
			this._makeFrameBuffer();
			this._makeCylinder();
			this._playAndStop();
		};
		this._fontImg.src = fontImgURL;
		// this._playAndStop();
	}

	loop() {
		if (this.stats) this.stats.update();

		this._planeCamera.update();
		this._frameBufferCamera.update();

		this._framebuffer.bind().updateViewport();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this._noisePlane.render(this._frameBufferCamera);

		this._framebuffer.unbind();

		this.gl.viewport(0, 0, this._width, this._height);
		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._gridHelper.render(this._camera);

		this._cylinder.render(this._camera, this._framebuffer);
		// debug draw

		// this._noisePlane.render(this._planeCamera);
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

		if (this._planeCamera)
			this._planeCamera.updateSize(
				-this._width / 2,
				this._width / 2,
				this._height / 2,
				-this._height / 2
			);
		if (this._camera) this._camera.updateSize(this._width, this._height);
	}

	destroy() {}
}
