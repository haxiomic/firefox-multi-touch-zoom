/**
 # Todo before release
 ! Fix bug with zooming in and out when scroll is at right-most
 ! Support meta max/min scale
 - Lazy setup, attach listeners and whatnot only when first used
 - Fix broken pages

 # Doneish
 - Handle out-of-scroll bounds

 **/

// elements
let page = document.documentElement;
let container = document.documentElement;
let scrollHandleElement = window;

// view scaling parameters
const minScale = 1.0;
const maxScale = 10;
const zoomSpeed = 0.015;
const scaleMode = 1; //0 = always high quality, 1 = low-quality while zooming
// state
let pageScale = 1;
let translationX = 0;
let translationY = 0;
let overflowTranslationX = 0;
let overflowTranslationY = 0;

page.style.willChange = 'transform';

// @! debug
// container.addEventListener(`click`, (e) => {
// 	scaleMode = scaleMode === 0?1:0;
// 	console.log('scale mode is', scaleMode);
// });

let realCtrlDown = false;
let updateRealCtrl = (e) => realCtrlDown = e.ctrlKey;
window.addEventListener(`keydown`, updateRealCtrl);
window.addEventListener(`keyup`, updateRealCtrl);
window.addEventListener(`mousemove`, updateRealCtrl);

// cmd + 0 to restore zoom
window.addEventListener('keydown', (e) => {
	if (e.key == '0' && e.metaKey) {
		// reset state
		pageScale = 1;
		translationX = 0;
		translationY = 0;
		overflowTranslationX = 0;
		overflowTranslationY = 0;

		let scrollLeftBefore = container.scrollLeft;
		let scrollLeftMaxBefore = container.scrollMax;
		let scrollTopBefore = container.scrollTop;
		let scrollTopMaxBefore = container.scrollTopMax;
		updateTransform(0, false);

		// restore scroll
		container.scrollLeft = (scrollLeftBefore/scrollLeftMaxBefore) * container.scrollLeftMax;
		container.scrollTop = (scrollTopBefore/scrollTopMaxBefore) * container.scrollTopMax;

		updateTranslationFromScroll();

		// undo other css changes
		page.style.overflow = '';
		document.body.style.pointerEvents = '';
	}
});

// because scroll top/left are handled as integers only, we only read the translation from scroll once scroll has changed
let ignoredScrollLeft = null;
let ignoredScrollTop = null;
function updateTranslationFromScroll(){
	if (container.scrollLeft !== ignoredScrollLeft) {
		translationX = -container.scrollLeft;
		ignoredScrollLeft = null;
	}
	if (container.scrollTop !== ignoredScrollTop) {
		translationY = -container.scrollTop;
		ignoredScrollTop = null;
	}
}
scrollHandleElement.addEventListener(`scroll`, updateTranslationFromScroll);

container.addEventListener(`wheel`, (e) => {
	// when pinching, Firefox will set the 'ctrlKey' flag to true, even when ctrl is not pressed
	// we can use this fact to distinguish between scrolling and pinching
	let firefoxPseudoPinch = e.ctrlKey && !realCtrlDown;
	if (firefoxPseudoPinch) {
		let x = e.clientX - container.offsetLeft;
		let y = e.clientY - container.offsetTop;
		// x in non-scrolling, non-transformed coordinates relative to the container
		// 0 is always the left side and <width> is always the right side

		let newScale = pageScale + e.deltaY * zoomSpeed;
		let scaleBy = pageScale/newScale;

		applyScale(scaleBy, x, y);

		e.preventDefault();
		e.stopPropagation();
	} else {
		restoreControl();
	}
}, false);

container.addEventListener(`mousemove`, restoreControl);
container.addEventListener(`mousedown`, restoreControl);

let qualityHandle = null;
let overflowHandle = null;

let _savedOverflow = null;
let _savedPointerEvents = null;
let controlDisabled = false;
function disableControl() {
	// disable scrolling for performance
	page.style.overflow = 'hidden';
	document.body.style.pointerEvents = 'none';
	controlDisabled = true;
}

function restoreControl() {
	if (!controlDisabled) return;
	// scrolling must be enable for panning
	page.style.overflow = 'scroll';
	document.body.style.pointerEvents = '';
	controlDisabled = false;
}

function updateTransform(scaleModeOverride, shouldDisableControl) {
	if (shouldDisableControl == null) {
		shouldDisableControl = true;
	}

	let sm = scaleModeOverride == null ? scaleMode : scaleModeOverride;

	if (sm === 0) {
		// scaleX/scaleY
		page.style.transform = `scaleX(${pageScale}) scaleY(${pageScale})`;
	} else {
		// perspective (reduced quality but faster)
		let p = 1; // what's the best value here?
		let z = p - p/pageScale;
		page.style.transform = `perspective(${p}px) translateZ(${z}px)`;

		// wait a short period before restoring the quality
		// we use a timeout because we can't detect when the user has finished the gesture on the hardware
		// we can only detect gesture update events ('wheel' + ctrl)
		const highQualityWait_ms = 40;
		window.clearTimeout(qualityHandle);
		qualityHandle = setTimeout(function(){
			page.style.transform = `scaleX(${pageScale}) scaleY(${pageScale})`;
		}, highQualityWait_ms);
	}

	page.style.transformOrigin = `0 0`;

	// hack to restore normal behavior that's upset after applying the transform
	page.style.position = `relative`;
	page.style.height = `100%`;

	// when translation is positive, the offset is applied via left/top positioning
	// negative translation is applied via scroll
	if (minScale < 1) {
		page.style.left = `${Math.max(translationX, 0) - overflowTranslationX}px`;
		page.style.top = `${Math.max(translationY, 0) - overflowTranslationY}px`;
	}

	// weird performance hack - is it batching the changes?
	page.style.transitionProperty = `transform, left, top`;
	page.style.transitionDuration = `0s`;

	if (shouldDisableControl) {
		disableControl();
		clearTimeout(overflowHandle);
		overflowHandle = setTimeout(function(){
			restoreControl();
		}, 400);
	}
}

function applyScale(scaleBy, x_container, y_container) {
	if (scaleBy == null) {
		console.warn(`Missing scaleBy parameter`);
		return;
	}

	function getTranslationX(){ return translationX; }
	function getTranslationY(){ return translationY; }
	function setTranslationX(v) {
		translationX = v;

		container.scrollLeft = -v;
		ignoredScrollLeft = container.scrollLeft;

		// scroll-transform what we're unable to apply
		// either there is no scroll-bar or we want to scroll past the end
		overflowTranslationX = v < 0 ? Math.max((-v) - container.scrollLeftMax, 0) : 0;
		// console.log(overflowTranslationX);
	}
	function setTranslationY(v) {
		translationY = v;

		container.scrollTop = -v;
		ignoredScrollTop = container.scrollTop;

		overflowTranslationY = v < 0 ? Math.max((-v) - container.scrollTopMax, 0) : 0;
	}

	// resize page
	let pageScaleBefore = pageScale;
	pageScale *= scaleBy;
	pageScale = Math.min(Math.max(pageScale, minScale), maxScale);
	let effectiveScale = pageScale/pageScaleBefore;

	// when we hit min/max scale we can early exit
	if (effectiveScale === 1) return;

	updateTransform();

	// what space is tx given in?
	let zx = x_container;
	let zy = y_container;

	// calculate new x-translation
	let tx = getTranslationX();
	tx = (tx - zx) * (effectiveScale) + zx;

	let ty = getTranslationY();
	ty = (ty - zy) * (effectiveScale) + zy;

	// apply new xy-translation
	setTranslationX(tx);
	setTranslationY(ty);

	updateTransform();
}