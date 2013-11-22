/*!
 * jQuery PointerEvents v0.3.6
 * https://github.com/deepsweet/jquery-pointerevents/
 * copyright 2013 Kir Belevich <kir@soulshine.in>
 */
(function(win, $) {
    "use strict";
    var doc = win.document, binds = {
        mouse: {
            enter: "mouseenter",
            over: "mouseover",
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            out: "mouseout",
            leave: "mouseleave"
        },
        touch: {
            enter: "touchstart",
            over: "touchstart",
            down: "touchstart",
            move: "touchmove",
            up: "touchend",
            out: "touchend",
            leave: "touchend",
            cancel: "touchcancel"
        },
        mspointer: {
            over: "MSPointerOver",
            down: "MSPointerDown",
            move: "MSPointerMove",
            up: "MSPointerUp",
            out: "MSPointerOut",
            cancel: "MSPointerCancel"
        }
    };
    function normalizeTouchEvent(e) {
        if (e.pointerType === "touch") {
            e.originalEvent = e.originalEvent || e;
            if (e.originalEvent.touches.length > 1) {
                e.multitouch = true;
                return;
            }
            var touchPoint = e.originalEvent.changedTouches[0];
            e.clientX = touchPoint.clientX;
            e.clientY = touchPoint.clientY;
            e.pageX = touchPoint.pageX;
            e.pageY = touchPoint.pageY;
            e.screenX = touchPoint.screenX;
            e.screenY = touchPoint.screenY;
            e.layerX = e.originalEvent.layerX;
            e.layerY = e.originalEvent.layerY;
            e.offsetX = e.layerX - e.currentTarget.offsetLeft;
            e.offsetY = e.layerY - e.currentTarget.offsetTop;
            e.target = touchPoint.target;
            e.identifier = touchPoint.identifier;
        }
    }
    function extendToPointerEvent(e) {
        e.width = e.width || e.webkitRadiusX || e.radiusX || 0;
        e.height = e.width || e.webkitRadiusY || e.radiusY || 0;
        e.pressure = e.pressure || e.mozPressure || e.webkitForce || e.force || e.which && .5 || 0;
        e.tiltX = e.tiltX || 0;
        e.tiltY = e.tiltY || 0;
        switch (e.pointerType) {
          case 2:
            e.pointerType = "touch";
            break;

          case 3:
            e.pointerType = "pen";
            break;

          case 4:
            e.pointerType = "mouse";
            break;

          default:
            e.pointerType = e.pointerType;
        }
        e.isPrimary = true;
        e.pointerId = e.identifier ? e.identifier + 2 : 1;
    }
    function PointerEvent(e, type) {
        extendToPointerEvent(e);
        normalizeTouchEvent(e);
        e.type = type;
        $.extend(this, e);
    }
    PointerEvent.prototype.dispatch = function(target) {
        if (!this.multitouch) {
            ($.event.handle || $.event.dispatch).call(target, this);
        }
        return this;
    };
    $.PointerEvent = PointerEvent;
    if (win.navigator.pointerEnabled) {
        return;
    }
    function addPointerEvent(type, toExtend) {
        var eventName = "pointer" + type, pointerevent, eventSpecial = $.event.special[eventName] = {
            _processed: false,
            setup: function() {
                $(this).on(binds.mouse[type], eventSpecial.mouseHandler).on(binds.touch[type], eventSpecial.touchHandler).on(binds.mspointer[type], eventSpecial.msPointerHandler);
            },
            teardown: function() {
                $(this).off(binds.mouse[type], eventSpecial.mouseHandler).off(binds.touch[type], eventSpecial.touchHandler).off(binds.mspointer[type], eventSpecial.msPointerHandler);
            },
            mouseHandler: function(e) {
                if (eventSpecial._processed === false) {
                    e.pointerType = 4;
                    pointerevent = new PointerEvent(e, eventName);
                    pointerevent.dispatch(pointerevent.currentTarget);
                }
                setTimeout(function() {
                    eventSpecial._processed = false;
                }, 0);
            },
            touchHandler: function(e) {
                eventSpecial._processed = true;
                e.pointerType = 2;
                pointerevent = new PointerEvent(e, eventName);
                pointerevent.dispatch(pointerevent.currentTarget);
            },
            msPointerHandler: function(e) {
                pointerevent = new PointerEvent(e, eventName);
                pointerevent.dispatch(pointerevent.currentTarget);
            }
        };
        if (toExtend) {
            $.extend(eventSpecial, toExtend(eventSpecial, eventName, type));
        }
    }
    function extendTouchHandlerWithTarget(eventSpecial, eventName) {
        return {
            touchHandler: function(e) {
                eventSpecial._processed = true;
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, eventName), target = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY);
                if (e.currentTarget.contains(target)) {
                    target = e.currentTarget;
                }
                pointerevent.dispatch(target);
            }
        };
    }
    function extendTouchMove(eventSpecial, eventName, type) {
        return {
            setup: function() {
                $(this).on(binds.mouse[type], eventSpecial.mouseHandler).on(binds.touch[type], eventSpecial.touchHandler).on(binds.touch.down, eventSpecial.touchDownHandler).on(binds.mspointer[type], eventSpecial.msPointerHandler);
            },
            teardown: function() {
                $(this).off(binds.mouse[type], eventSpecial.mouseHandler).off(binds.touch[type], eventSpecial.touchHandler).off(binds.touch.down, eventSpecial.touchDownHandler).off(binds.mspointer[type], eventSpecial.msPointerHandler);
            },
            touchDownHandler: function(e) {
                eventSpecial._processed = true;
                eventSpecial._target = e.originalEvent.changedTouches[0].target;
            },
            touchHandler: function(e) {
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, eventName), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY), currentTarget = eventSpecial._target;
                if (e.currentTarget.contains(targetFromPoint)) {
                    pointerevent.dispatch(e.currentTarget);
                }
                if (currentTarget !== targetFromPoint) {
                    pointerevent = new PointerEvent(e, "pointerout");
                    pointerevent.dispatch(currentTarget);
                    if (!currentTarget.contains(targetFromPoint)) {
                        pointerevent = new PointerEvent(e, "pointerleave");
                        pointerevent.dispatch(currentTarget);
                    }
                    if (!targetFromPoint.contains(currentTarget)) {
                        pointerevent = new PointerEvent(e, "pointerenter");
                        pointerevent.dispatch(targetFromPoint);
                    }
                    pointerevent = new PointerEvent(e, "pointerover");
                    pointerevent.dispatch(targetFromPoint);
                    eventSpecial._target = targetFromPoint;
                }
            }
        };
    }
    addPointerEvent("enter");
    addPointerEvent("over");
    addPointerEvent("down");
    addPointerEvent("move", extendTouchMove);
    addPointerEvent("up", extendTouchHandlerWithTarget);
    addPointerEvent("out", extendTouchHandlerWithTarget);
    addPointerEvent("leave", extendTouchHandlerWithTarget);
    addPointerEvent("cancel");
})(window, jQuery);