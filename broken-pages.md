- position:sticky element mis-positioned
https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
https://www.w3.org/TR/css-device-adapt-1/#zoom-desc

- position:fixed element is mis-positioned
https://stackoverflow.com/questions/3541863/css-100-width-but-avoid-scrollbar (the join StackOverflow banner at the bottom behaves strangely after zooming (tested on Windows))

- Mis-positioned background image on body (only occurs in certain circumstances)
https://www.watchcartoononline.io/

- Small scroll-x offset when scaleX(1) is added to the html tag (Firefox bug?)
https://github.com/haxiomic/firefox-multi-touch-zoom

# Fixed
[INCIDENTALLY FIXED] Zooming in and out of this page = weird clipping issues
https://www.netmarketshare.com/browser-market-share.aspx

[FIXED] Zoom coordinates are wrong
> Caused by missing HTML 4.01 or greater <!DOCTYPE html>
> If doctype is null or set to < 4.01, such as 3.2 <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN"> then firefox 
renders in quirks mode
"
The scrollLeft, scrollTop, scrollWidth, and scrollHeight properties are relative to BODY in quirks mode (instead of HTML)  (bug 211030).
"
https://news.ycombinator.com/
https://haxe.io/roundups/410/

[FIXED] After zooming panning causes the page to jump to origin
> Caused by setting overflow to '' from hidden, fixed by forcing scroll when page is zoomed
https://www.reddit.com/r/Whatcouldgowrong/comments/7h9aca/playing_bubble_soccer_with_a_bull_wcgw/
https://www.youtube.com/watch?v=2-xkLH5FjPw&feature=youtu.be