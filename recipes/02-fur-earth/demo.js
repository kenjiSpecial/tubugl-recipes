'use strict';

import App from './app';

let app;

let urlParams, isDebug;
if (window.URLSearchParams) {
	urlParams = new URLSearchParams(window.location.search);
	isDebug = !(urlParams.has('NoDebug') || urlParams.has('NoDebug/'));
}

(() => {
	init();
	start();
})();

function init() {
	app = new App({
		isDebug: isDebug
	});

	document.body.appendChild(app.canvas);
}

function start() {
	app.animateIn();
}

window.addEventListener('resize', function() {
	app.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', function(ev) {
	app.onKeyDown(ev);
});
