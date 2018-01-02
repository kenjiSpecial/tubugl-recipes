/**
 * screenshot page with puppeteer
 */

const argv = require('minimist')(process.argv.slice(2));
const dir = argv.dir;
const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.setViewport({ width: 640, height: 360 });
	await page.goto(`http://localhost:8080/docs/${dir}/index.html?NoDebug/`);
	// http://localhost:8080/docs/app00/index.html
	// await delay(2000);
	await page.screenshot({ path: `docs/${dir}/thumbnail.png` });

	await browser.close();
})();

function delay(delay) {
	return new Promise(function(fulfill) {
		setTimeout(fulfill, delay);
	});
}
