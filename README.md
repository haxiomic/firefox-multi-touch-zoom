# Smooth Multi-Touch Zoom Add-on for Firefox

<p align="center">
  <img src="zoom-compressed.gif?raw=true">
</p>

<p align="center">
  <h1 align="center"><a href="https://addons.mozilla.org/en-GB/firefox/addon/multi-touch-zoom/">Add to Firefox</a></h1>
</p>

This extension adds support for smooth zooming with the pinch gesture on a trackpad or touch screen. It's been designed to match the behavior of Chrome and Safari.

Non-multi-touch users can still smooth zoom by scrolling and holding down the *SHIFT* key

Zoom can be reset by pressing ⌘ and 0 on macOS or CTRL and 0 on Windows

Requires Firefox 55 or greater

## Motivation

Firefox is still missing smooth multi-touch zoom support, an issue has been sitting in [Bugzilla for the last 5 years](https://bugzilla.mozilla.org/show_bug.cgi?id=789906&GoAheadAndLogIn=1) gathering comments

Given we live in a time with Macbook trackpads as big as a tablet, I've become so used to the pinch-to-zoom feature while browsing in Safari and Chrome that its absence was a deal breaker for me when trying to switch to the new Firefox Quantum. I put this together to try and bring the feature to Firefox, especially since it's recently [started to develop issues in Chrome](https://productforums.google.com/forum/#!topic/chrome/r_6hPdd8W5M)

**I've only tested it on Macbooks but I expect it will work for Surface Books and other Windows tablets – if you've tried it out please let me know your experience!**

It turned out to be tricker to implement than I thought! There are a number of little hacks required to get it to work and to achieve a smooth user experience. I've explained the implementation below and hopefully this could help someone else trying to achieve high-performance scalling with CSS

## Implementation Details and Hacks
#### No 'real' multi-touch gesture events in Firefox for Desktop
In-spite of having PointerEvents, TouchEvents and even a 'MozMagnifyGesture' event, none of these will fire when the user performs multi-touch gestures on a desktop trackpad. However, there's a trick to capturing a pinch action: Since Firefox 55.0 the pinch gesture maps to the 'wheel' event with the `ctrlKey` flag artificially set to true. It's an ugly hack, but it lets us distinguish between *mouse-wheel* + *ctrl* and *pinch* by keeping track of the real `ctrlKey` state and comparing.

We'd really want to capture pinch-start and pinch-end events to enable the best user experience but unfortunately I'm not aware of any technique to enable this.

#### Just setting `scaleX()` and `scaleY()` isn't enough for acceptable performance
The page can be magnified by setting a CSS scale transform on the root element, this works for magnification but experience is anything but smooth - even with the new WebRender enabled the experience is essentially the same: janky. To work around the performance problems I found a few  tricks:
- We can abuse `transform: perspective()` for faster zooming. Surprisingly scaling via scale functions and scaling via perspective produces different results. Scaling via scale functions triggers the browser to re-rasterize after scaling. The result is your fonts and SVGs stay sharp when scaled up but it comes with a significant frame-time cost. Scaling via perspective on the other hand, just scales up the already rasterized content - your fonts and sharp lines become fussy as you zoom in but it's much cheaper to perform. To produce the same scale using a perspective transform, we can set the z-coordinate to `p - p/scale` where *p* is the CSS perspective value (or distance to the z = 0 plane).

  To achieve the best of both world we can use the perspective trick during the pinch gesture and swap to regular scale functions once the gesture has finished.

- Setting `overflow: hidden` on the root element helps to reduce re-painting: scaling causes the content to overflow and the scroll region to change. Rapidly changing the scroll region seems to trigger a whole bunch of expensive work. Setting overflow to hidden seems to prevent this and fortunately we can still use `scrollLeft` and `scrollTop` to apply an offset to the page, but the scroll bar is hidden and panning is disabled. In this add-on overflow is set to `scroll` as soon as the pinch gesture completes but there's a noticeable delay between zooming and being able to pan whilst the browser does a whole bunch of repainting work. I'm not convinced this work is necessary but I've not yet been able to hint to the browser that it doesn't need to be done.

- Enabling CSS transitions on the transform property and setting the duration to 0 seconds seems to help. This one is a bit of voodoo, I'm not convinced it should work but it does seem to. It could potentially be acting as a hint to enable certain rendering optimizations but I'm not sure. Would love to learn more if anyone has ideas.

#### Quirks mode breaks scroll positions
When a site doesn't specify a modern docType, Firefox falls back into 'quirks mode' rendering. In this mode Firefox enables a [long list of historic bugs](https://developer.mozilla.org/en-US/docs/Mozilla/Mozilla_quirks_mode_behavior). Foruntately we can detect quirks mode rendering and work around this.

## Known Issues	

- Elements with `position: sticky` are not correctly scaled up with the rest of the page

*Please report any webpages that have issues and I'll see if it's possible to fix them!*

## Other Notes

#### Meta tags

Pages may have meta tags to configure the behavior of 'magnifying-glass' zoom on tablets. These tags let a page disable zoom and set the mininum and maximum zoom. So far, all desktop browser seem to ignore these, citing that a page shouldn't have a say on whether or not the user is allowed to zoom. I've decided to match the behavior of other browser and ignore them too but I'd love to hear from users if this should change
