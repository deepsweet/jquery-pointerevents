## jQuery PointerEvents [![Build Status](https://secure.travis-ci.org/deepsweet/jquery-pointerevents.png)](https://travis-ci.org/deepsweet/jquery-pointerevents)

Basic polyfill for [Pointer Events W3C Specitication](https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html) using [jQuery special events API](http://www.benalman.com/news/2010/03/jquery-special-events/).

### what?

![PointerEvents](http://funkyimg.com/i/DWrJ.png)

Polyfill is trying to dynamically wrap all the possible `mouse*`, `touch*` and `MSPointer*` events to provide a single `PointerEvent` Interface. [Read more](https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#intro).

### why?

Because there are too many different events types on different platforms with different input mechanisms. [Read more](http://docs.webplatform.org/wiki/concepts/Pointer_Events#Why_Pointer_Events).

### how?

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="jquery-pointerevents.js"></script>
<script>
    $('body').on({
        pointerdown: function(e) { console.log(e); },
        pointerup: function(e) { console.log(e); },
        // …
    });
</script>
```

### implemented

* `pointerenter`
* `pointerover`
* `pointerdown`
* `pointermove`
* `pointerup`
* `pointerout`
* `pointerleave`
* `pointercancel`

### not implemented

* `gotpointercapture`
* `lostpointercapture`
* `element.setPointerCapture()`
* `element.releasePointerCapture()`
* `onpointer*` HTML attributes
* `touch-action` CSS property
* `window.navigator.pointerEnabled`
* `window.maxTouchPoints`

### cross-browser compatibility

Depends on your jQuery version – [jquery.com/browser-support](http://jquery.com/browser-support/).

Also, [caniuse.com/#feat=pointer](http://caniuse.com/#feat=pointer):

```javascript
// nothing to do in IE11 for today
if(win.navigator.pointerEnabled) {
    return;
}
```

### test

Open `test/index.html` in your browser(s) and look at console output.

### alternatives

* [Polymer / PointerEvents](https://github.com/Polymer/PointerEvents)
* [HandJS](https://handjs.codeplex.com/)


### license

[MIT](https://github.com/deepsweet/jquery-pointerevents/blob/master/LICENSE)
