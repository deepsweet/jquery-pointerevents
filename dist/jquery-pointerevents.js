/*!
 * jQuery PointerEvents v0.5.2
 * https://github.com/deepsweet/jquery-pointerevents/
 * copyright 2013 Kir Belevich <kir@soulshine.in>
 */
(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else {
        factory(jQuery);
    }
})(function($) {
    "use strict";
    var win = window, doc = win.document, binds = {
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
            e.offsetX = e.layerX - e.target.offsetLeft;
            e.offsetY = e.layerY - e.target.offsetTop;
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
    $.PointerEvent = PointerEvent;
    if (win.navigator.pointerEnabled) {
        return;
    }
    function nextTick(callback) {
        var msgName = "nextTick-polyfill", timeouts = [];
        if (win.nextTick) {
            return win.nextTick(callback);
        }
        if (!win.postMessage || win.ActiveXObject) {
            return setTimeout(callback, 0);
        }
        win.addEventListener("message", function(e) {
            if (e.source === win && e.data === msgName) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                if (timeouts.length) {
                    timeouts.shift()();
                }
            }
        }, false);
        timeouts.push(callback);
        win.postMessage(msgName, "*");
    }
    function addPointerEvent(type, toExtend) {
        var eventName = "pointer" + type, pointerevent, eventSpecial = $.event.special[eventName] = {
            setup: function() {
                $(this).on(binds.mouse[type], eventSpecial.mouseHandler).on(binds.touch[type], eventSpecial.touchHandler).on(binds.mspointer[type], eventSpecial.msHandler);
            },
            teardown: function() {
                $(this).off(binds.mouse[type], eventSpecial.mouseHandler).off(binds.touch[type], eventSpecial.touchHandler).off(binds.mspointer[type], eventSpecial.msHandler);
            },
            mouseHandler: function(e) {
                if (!eventSpecial._noMouse) {
                    e.pointerType = 4;
                    pointerevent = new PointerEvent(e, eventName);
                    $(e.currentTarget).triggerHandler(pointerevent);
                }
                nextTick(function() {
                    eventSpecial._noMouse = false;
                });
            },
            touchHandler: function(e) {
                eventSpecial._noMouse = true;
                e.pointerType = 2;
                pointerevent = new PointerEvent(e, eventName);
                $(e.currentTarget).triggerHandler(pointerevent);
            },
            msHandler: function(e) {
                eventSpecial._noMouse = true;
                pointerevent = new PointerEvent(e, eventName);
                $(e.target).trigger(pointerevent);
            }
        };
        if (toExtend) {
            $.extend(eventSpecial, toExtend({
                event: eventSpecial,
                name: eventName,
                type: type
            }));
        }
    }
    function touchmoveBased(params) {
        var event = params.event, type = params.type;
        return {
            setup: function() {
                $(this).on(binds.mouse[type], event.mouseHandler).on(binds.touch[type], event.touchHandler).on(binds.touch.down, event.touchDownHandler).on(binds.mspointer[type], event.msHandler);
                if (type !== "move") {
                    $(this).on(binds.touch.move, event.touchMoveHandler);
                }
            },
            teardown: function() {
                $(this).off(binds.mouse[type], event.mouseHandler).off(binds.touch[type], event.touchHandler).off(binds.touch.down, event.touchDownHandler).off(binds.mspointer[type], event.msHandler);
                if (type !== "move") {
                    $(this).off(binds.touch.move, event.touchMoveHandler);
                }
            },
            touchDownHandler: function(e) {
                event._noMouse = true;
                event._target = e.target;
            }
        };
    }
    function extendToEnter(params) {
        return $.extend(touchmoveBased(params), {
            touchMoveHandler: function(e) {
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, params.name), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY), target = params.event._target;
                if (target !== targetFromPoint) {
                    pointerevent.relatedTarget = pointerevent.target;
                    pointerevent.target = pointerevent.targetFromPoint;
                    if (target.contains(targetFromPoint)) {
                        $(targetFromPoint).triggerHandler(pointerevent);
                    } else if (!targetFromPoint.contains(target)) {
                        $(targetFromPoint).trigger(pointerevent);
                    }
                    params.event._target = targetFromPoint;
                }
            }
        });
    }
    function extendToOver(params) {
        return $.extend(touchmoveBased(params), {
            touchMoveHandler: function(e) {
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, params.name), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY), target = params.event._target;
                if (target !== targetFromPoint) {
                    pointerevent.relatedTarget = pointerevent.target;
                    pointerevent.target = pointerevent.targetFromPoint;
                    $(targetFromPoint).trigger(pointerevent);
                    params.event._target = targetFromPoint;
                }
            }
        });
    }
    function extendWithTargetFromPoint(params) {
        return {
            touchHandler: function(e) {
                params.event._noMouse = true;
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, params.name), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY);
                pointerevent.relatedTarget = pointerevent.target;
                pointerevent.target = pointerevent.targetFromPoint;
                if (!params.event._noDuplicates) {
                    params.event._noDuplicates = true;
                    $(targetFromPoint).trigger(pointerevent);
                }
                nextTick(function() {
                    params.event._noDuplicates = false;
                });
            }
        };
    }
    function extendToOut(params) {
        return $.extend(touchmoveBased(params), extendWithTargetFromPoint(params), {
            touchMoveHandler: function(e) {
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, params.name), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY), target = params.event._target;
                if (target !== targetFromPoint) {
                    $(target).trigger(pointerevent);
                    params.event._target = targetFromPoint;
                }
            }
        });
    }
    function extendToLeave(params) {
        return $.extend(touchmoveBased(params), extendWithTargetFromPoint(params), {
            touchMoveHandler: function(e) {
                e.pointerType = 2;
                var pointerevent = new PointerEvent(e, params.name), targetFromPoint = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY), target = params.event._target;
                if (target !== targetFromPoint) {
                    if (targetFromPoint.contains(target)) {
                        $(target).triggerHandler(pointerevent);
                    } else {
                        $(e.currentTarget).triggerHandler(pointerevent);
                    }
                    params.event._target = targetFromPoint;
                }
            }
        });
    }
    function extendToMove(params) {
        return $.extend(touchmoveBased(params), extendWithTargetFromPoint(params));
    }
    addPointerEvent("enter", extendToEnter);
    addPointerEvent("over", extendToOver);
    addPointerEvent("down");
    addPointerEvent("move", extendToMove);
    addPointerEvent("up", extendWithTargetFromPoint);
    addPointerEvent("out", extendToOut);
    addPointerEvent("leave", extendToLeave);
    addPointerEvent("cancel");
});