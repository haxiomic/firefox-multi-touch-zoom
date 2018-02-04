/**

Multi-touch zoom extension for Firefox
Enables smooth pinch to zoom on desktop

Requires Firefox 55 or greater

@Author: George Corney / haxiomic
@Website: http://github.com/haxiomic
@Email: haxiomic@gmail.com

Please report issues to the github repository
	https://github.com/haxiomic/firefox-multi-touch-zoom

Feel free to get in touch via email if you have any questions

**/

// view scaling parameters and other options
const isMac = navigator.platform.toLowerCase().indexOf('mac') >= 0;
const pinchZoomSpeed = isMac ? 0.015 : 0.03;
const scaleMode = 1; // 0 = always high quality, 1 = low-quality while zooming
const shiftKeyZoom = true;// enable zoom with shift + scroll
const shiftKeyZoomSpeed = pinchZoomSpeed;
const minScale = 1.0;
const maxScale = 10;
const maxTapDistance = 10;
const maxTapDuration = 250;
const maxTapInterval = 300;
// state
let pageScale = 1;
let translationX = 0;
let translationY = 0;
let overflowTranslationX = 0;
let overflowTranslationY = 0;

// elements
let pageElement = document.documentElement;
let scrollBoxElement = document.documentElement; // this is the scroll-box
let wheelEventElement = document.documentElement;
let scrollEventElement = window;

const quirksMode = document.compatMode === 'BackCompat';

// if the pageElement is missing a doctype or the doctype is set to < HTML 4.01 then Firefox renders in quirks mode
// we cannot use the scroll fields on the <html> element, instead we must use the body
// "(quirks mode bug 211030) The scrollLeft, scrollTop, scrollWidth, and scrollHeight properties are relative to BODY in quirks mode (instead of HTML)."
if (quirksMode) {
	scrollBoxElement = document.body;
}

// browser-hint optimization - I found this causes issues with some sites like maps.google.com
// pageElement.style.willChange = 'transform';

// we track the state of the ctrl key in order to distinguish mouse-wheel events from pinch gestures
let realCtrlDown = false;
let updateRealCtrl = (e) => realCtrlDown = e.ctrlKey;
window.addEventListener(`keydown`, updateRealCtrl);
window.addEventListener(`keyup`, updateRealCtrl);
window.addEventListener(`mousemove`, updateRealCtrl);

// cmd + 0 or ctrl + 0 to restore zoom
window.addEventListener('keydown', (e) => {
	if (e.key == '0' && (isMac ? e.metaKey : e.ctrlKey)) {
		resetScale();
	}
});

// because scroll top/left are handled as integers only, we only read the translation from scroll once scroll has changed
// if we didn't, our translation would have ugly precision issues => setTranslationX(4.5) -> translationX = 4
let ignoredScrollLeft = null;
let ignoredScrollTop = null;
function updateTranslationFromScroll(){
	if (scrollBoxElement.scrollLeft !== ignoredScrollLeft) {
		translationX = -scrollBoxElement.scrollLeft;
		ignoredScrollLeft = null;
	}
	if (scrollBoxElement.scrollTop !== ignoredScrollTop) {
		translationY = -scrollBoxElement.scrollTop;
		ignoredScrollTop = null;
	}
}
scrollEventElement.addEventListener(`scroll`, updateTranslationFromScroll);

wheelEventElement.addEventListener(`wheel`, (e) => {
	// when pinching, Firefox will set the 'ctrlKey' flag to true, even when ctrl is not pressed
	// we can use this fact to distinguish between scrolling and pinching
	// ! it turns out this is only the case on macOS - on Windows, a ctrl key down event seems to be fired right before the wheel event...
	let firefoxPseudoPinch = e.ctrlKey && (isMac ? !realCtrlDown : true);
	if (firefoxPseudoPinch || (e.shiftKey && shiftKeyZoom)) {
		let x = e.clientX - scrollBoxElement.offsetLeft;
		let y = e.clientY - scrollBoxElement.offsetTop;
		// x in non-scrolling, non-transformed coordinates relative to the scrollBoxElement
		// 0 is always the left side and <width> is always the right side

		let deltaMultiplier = e.shiftKey ? shiftKeyZoomSpeed : pinchZoomSpeed;

		let newScale = pageScale + e.deltaY * deltaMultiplier;
		let scaleBy = pageScale/newScale;

		applyScale(scaleBy, x, y);

		e.preventDefault();
		e.stopPropagation();
	} else {
		restoreControl();
	}
}, false);

scrollBoxElement.addEventListener(`mousemove`, restoreControl);
scrollBoxElement.addEventListener(`mousedown`, restoreControl);

// stores the most recent taps recorded from mouse click events
// this would be better if implemented using W3C Touch Events, as we could support double two-finger tap as in macOS,
// but Firefox desktop does not send them at all even if manually enabling dom.w3c_touch_events as of Firefox 59
let lastTouchTime = 0;
let lastTouchX = false;
let lastTouchY = false;
let tapCount = 0;

window.addEventListener(`mousedown`, (e) => {
	if (getTouchInterval() >= maxTapInterval ||
		getTouchDistance(e.pageX, e.pageY) >= maxTapDistance)
		tapCount = 0;
	updateTouchInfo();
});

window.addEventListener(`mouseup`, (e) => {
	if (getTouchInterval() >= maxTapDuration ||
		getTouchDistance(e.pageX, e.pageY) >= maxTapDistance)
		resetTouchInfo();
	else {
		tapCount++;
		updateTouchInfo();
		if (tapCount % 2 == 0) {
			resetScale();
			e.preventDefault();
			e.stopPropagation();
		}
	}
	console.log(tapCount);
});

function getTouchInterval() {
	let now = new Date().getTime();
	return now - lastTouchTime;
}
function getTouchDistance(currentX, currentY) {
	let x = lastTouchX - currentX;
	let y = lastTouchY - currentY;
	return Math.sqrt(x * x + y * y);
}

function updateTouchInfo(pageX, pageY) {
	lastTouchTime = new Date().getTime();
	lastTouchX = pageX;
	lastTouchY = pageY;
}

function resetTouchInfo() {
	lastTouchTime = 0;
	lastTouchX = false;
	lastTouchY = false;
	tapCount = 0;
}

let controlDisabled = false;
function disableControl() {
	if (controlDisabled) return;

	let verticalScrollBarWidth = window.innerWidth - pageElement.clientWidth;
	let horizontalScrollBarWidth = window.innerHeight - pageElement.clientHeight;

	// disable scrolling for performance
	pageElement.style.overflow = 'hidden';

	// since we're disabling a scrollbar we need to apply a margin to replicate the offset (if any) it introduced
	// this prevent the page from being shifted about as the scrollbar is hidden and shown
	pageElement.style.marginRight = verticalScrollBarWidth + 'px';
	pageElement.style.marginBottom = horizontalScrollBarWidth + 'px';

	// document.body.style.pointerEvents = 'none';
	controlDisabled = true;
}

function restoreControl() {
	if (!controlDisabled) return;
	// scrolling must be enable for panning
	pageElement.style.overflow = 'auto';
	pageElement.style.marginRight = '';
	pageElement.style.marginBottom = '';
	// document.body.style.pointerEvents = '';
	controlDisabled = false;
}

let qualityTimeoutHandle = null;
let overflowTimeoutHandle = null;

function updateTransform(scaleModeOverride, shouldDisableControl) {
	if (shouldDisableControl == null) {
		shouldDisableControl = true;
	}

	let sm = scaleModeOverride == null ? scaleMode : scaleModeOverride;

	if (sm === 0) {
		// scaleX/scaleY
		pageElement.style.transform = `scaleX(${pageScale}) scaleY(${pageScale})`;
	} else {
		// perspective (reduced quality but faster)
		let p = 1; // what's the best value here?
		let z = p - p/pageScale;
		pageElement.style.transform = `perspective(${p}px) translateZ(${z}px)`;

		// wait a short period before restoring the quality
		// we use a timeout because we can't detect when the user has finished the gesture on the hardware
		// we can only detect gesture update events ('wheel' + ctrl)
		const highQualityWait_ms = 40;
		window.clearTimeout(qualityTimeoutHandle);
		qualityTimeoutHandle = setTimeout(function(){
			pageElement.style.transform = `scaleX(${pageScale}) scaleY(${pageScale})`;
		}, highQualityWait_ms);
	}

	pageElement.style.transformOrigin = `0 0`;

	// hack to restore normal behavior that's upset after applying the transform
	pageElement.style.position = `relative`;
	pageElement.style.height = `100%`;

	// when translation is positive, the offset is applied via left/top positioning
	// negative translation is applied via scroll
	if (minScale < 1) {
		pageElement.style.left = `${Math.max(translationX, 0) - overflowTranslationX}px`;
		pageElement.style.top = `${Math.max(translationY, 0) - overflowTranslationY}px`;
	}

	// weird performance hack - is it batching the changes?
	pageElement.style.transitionProperty = `transform, left, top`;
	pageElement.style.transitionDuration = `0s`;

	if (shouldDisableControl) {
		disableControl();
		clearTimeout(overflowTimeoutHandle);
		overflowTimeoutHandle = setTimeout(function(){
			restoreControl();
		}, 400);
	}
}

function applyScale(scaleBy, x_scrollBoxElement, y_scrollBoxElement) {
	// x/y coordinates in untransformed coordinates relative to the scroll container
	// if the container is the window, then the coordinates are relative to the window
	// ignoring any scroll offset. The coordinates do not change as the page is transformed

	function getTranslationX(){ return translationX; }
	function getTranslationY(){ return translationY; }
	function setTranslationX(v) {
		// clamp v to scroll range
		// this limits minScale to 1
		v = Math.min(v, 0);
		v = Math.max(v, -scrollBoxElement.scrollLeftMax);

		translationX = v;

		scrollBoxElement.scrollLeft = Math.max(-v, 0);
		ignoredScrollLeft = scrollBoxElement.scrollLeft;

		// scroll-transform what we're unable to apply
		// either there is no scroll-bar or we want to scroll past the end
		overflowTranslationX = v < 0 ? Math.max((-v) - scrollBoxElement.scrollLeftMax, 0) : 0;
	}
	function setTranslationY(v) {
		// clamp v to scroll range
		// this limits minScale to 1
		v = Math.min(v, 0);
		v = Math.max(v, -scrollBoxElement.scrollTopMax);

		translationY = v;

		scrollBoxElement.scrollTop = Math.max(-v, 0);
		ignoredScrollTop = scrollBoxElement.scrollTop;

		overflowTranslationY = v < 0 ? Math.max((-v) - scrollBoxElement.scrollTopMax, 0) : 0;
	}

	// resize pageElement
	let pageScaleBefore = pageScale;
	pageScale *= scaleBy;
	pageScale = Math.min(Math.max(pageScale, minScale), maxScale);
	let effectiveScale = pageScale/pageScaleBefore;

	// when we hit min/max scale we can early exit
	if (effectiveScale === 1) return;

	updateTransform();

	let zx = x_scrollBoxElement;
	let zy = y_scrollBoxElement;

	// calculate new xy-translation
	let tx = getTranslationX();
	tx = (tx - zx) * (effectiveScale) + zx;

	let ty = getTranslationY();
	ty = (ty - zy) * (effectiveScale) + zy;

	// apply new xy-translation
	setTranslationX(tx);
	setTranslationY(ty);

	updateTransform();
}

function resetScale() {
	// reset state
	pageScale = 1;
	translationX = 0;
	translationY = 0;
	overflowTranslationX = 0;
	overflowTranslationY = 0;

	let scrollLeftBefore = scrollBoxElement.scrollLeft;
	let scrollLeftMaxBefore = scrollBoxElement.scrollMax;
	let scrollTopBefore = scrollBoxElement.scrollTop;
	let scrollTopMaxBefore = scrollBoxElement.scrollTopMax;
	updateTransform(0, false);

	// restore scroll
	scrollBoxElement.scrollLeft = (scrollLeftBefore/scrollLeftMaxBefore) * scrollBoxElement.scrollLeftMax;
	scrollBoxElement.scrollTop = (scrollTopBefore/scrollTopMaxBefore) * scrollBoxElement.scrollTopMax;

	updateTranslationFromScroll();

	// undo other css changes
	pageElement.style.overflow = '';
	// document.body.style.pointerEvents = '';
}
