/**
 * Basic polyfill for Pointer Events W3C Specification.
 *
 * @author Kir Belevich <kir@soulshine.in>
 * @copyright Kir Belevich 2013
 * @license MIT
 * @version 0.3.2
 */
(function(win, $) {

    /*global jQuery:true*/
    'use strict';

    /*
       http://www.w3.org/TR/pointerevents/
       https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html
       https://dvcs.w3.org/hg/webevents/raw-file/default/touchevents.html
       http://msdn.microsoft.com/en-US/library/ie/hh673557.aspx
       http://www.benalman.com/news/2010/03/jquery-special-events/
       http://api.jquery.com/category/events/event-object/
    */

    var doc = win.document,
        binds = {
            mouse: {
                enter: 'mouseenter',
                over: 'mouseover',
                down: 'mousedown',
                move: 'mousemove',
                up: 'mouseup',
                out: 'mouseout',
                leave: 'mouseleave'
            },

            touch: {
                enter: 'touchstart',
                over: 'touchstart',
                down: 'touchstart',
                move: 'touchmove',
                up: 'touchend',
                out: 'touchend',
                leave: 'touchend',
                cancel: 'touchcancel'
            },

            mspointer: {
                over: 'MSPointerOver',
                down: 'MSPointerDown',
                move: 'MSPointerMove',
                up: 'MSPointerUp',
                out: 'MSPointerOut',
                cancel: 'MSPointerCancel'
            }
        };

    /**
     * Normalize touch-event by keeping all the
     * possible properties normalized by jQuery.
     *
     * @see http://api.jquery.com/category/events/event-object/
     *
     * @param {Object} e event
     */
    function normalizeTouchEvent(e) {

        if(e.originalEvent.changedTouches) {
            // multitouch
            if(e.originalEvent.targetTouches.length > 1) {
                e.multitouch = true;
                return;
            }

            var touchPoint = e.originalEvent.changedTouches[0];

            // keep all the properties normalized by jQuery
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

    /**
     * Extend event to match PointerEvent Interface.
     *
     * @see https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#pointer-events-and-interfaces
     * @see https://dvcs.w3.org/hg/webevents/raw-file/default/touchevents.html
     *
     * @param {object} e event
     */
    function extendToPointerEvent(e) {

        /*eslint complexity:0*/
        e.width = e.width ||
                  e.webkitRadiusX ||
                  e.radiusX ||
                  0;

        e.height = e.width ||
                   e.webkitRadiusY ||
                   e.radiusY ||
                   0;

        // TODO: stupid Android somehow could send "force" > 1 ;(
        e.pressure = e.pressure ||
                     e.mozPressure ||
                     e.webkitForce ||
                     e.force ||
                     e.which && 0.5 ||
                     0;

        e.tiltX = e.tiltX || 0;
        e.tiltY = e.tiltY || 0;

        switch(e.pointerType) {
            case 2: e.pointerType = 'touch'; break;
            case 3: e.pointerType = 'pen'; break;
            case 4: e.pointerType = 'mouse'; break;
            default: e.pointerType = 'unknown';
        }

        e.isPrimary = true;

        // "1" is always for mouse, need to +2 for touch which can start from "0"
        e.pointerId = e.identifier ? e.identifier + 2 : 1;

    }

    /**
     * Mutate an event to PointerEvent.
     *
     * @param {object} e current event object
     * @param {string} type future pointerevent type
     */
    function PointerEvent(e, type) {

        extendToPointerEvent(e);
        normalizeTouchEvent(e);
        e.type = type;

        $.extend(this, e);

    }

    /**
     * Dispatch current event.
     *
     * @param {element} target target element
     */
    PointerEvent.prototype.dispatch = function(target) {

        // do not fire event if it is a multitouch
        if(!this.multitouch) {
            ($.event.handle || $.event.dispatch).call(target, this);
        }

        return this;

    };

    // export PointerEvent class
    $.PointerEvent = PointerEvent;

    // nothing to do in IE11 for today
    if(win.navigator.pointerEnabled) {
        return;
    }

    /**
     * Create new $.event.special wrapper with some default behavior.
     *
     * @param {string} type event type
     * @param {object} toExtend object to extend default wrapper
     */
    function addPointerEvent(type, toExtend) {

        var eventName = 'pointer' + type,
            pointerevent,

            eventSpecial = $.event.special[eventName] = {
                // touch/mspointer event is already in the process
                _processed: false,

                // bind
                setup: function() {
                    $(this)
                        .on(binds.mouse[type], eventSpecial.mouseHandler)
                        .on(binds.touch[type], eventSpecial.touchHandler)
                        .on(binds.mspointer[type], eventSpecial.msPointerHandler);
                },

                // unbind
                teardown: function() {
                    $(this)
                        .off(binds.mouse[type], eventSpecial.mouseHandler)
                        .off(binds.touch[type], eventSpecial.touchHandler)
                        .off(binds.mspointer[type], eventSpecial.msPointerHandler);
                },

                // mouse
                mouseHandler: function(e) {
                    // do not duplicate PointerEvent if
                    // touch/mspointer is already processed
                    if(eventSpecial._processed === false) {
                        e.pointerType = 4;
                        pointerevent = new PointerEvent(e, eventName);
                        pointerevent.dispatch(pointerevent.currentTarget);
                    }

                    // clear the "processed" key right after
                    // current event and all the bubblings
                    setTimeout(function() {
                        eventSpecial._processed = false;
                    }, 0);
                },

                // touch
                touchHandler: function(e) {
                    eventSpecial._processed = true;

                    e.pointerType = 2;
                    pointerevent = new PointerEvent(e, eventName);
                    pointerevent.dispatch(pointerevent.currentTarget);
                },

                // mspointer
                msPointerHandler: function(e) {
                    pointerevent = new PointerEvent(e, eventName);
                    pointerevent.dispatch(pointerevent.currentTarget);
                }
            };

        // extend this $.event.special wrapper
        if(toExtend) {
            $.extend(eventSpecial, toExtend(eventSpecial, eventName, type));
        }

    }

    /**
     * Object to extend $.event.special touchHandler
     * with "elementFromPoint" target.
     *
     * @param {object} eventSpecial current $.event.special
     * @param {sring} eventName event name
     * @return {object}
     */
    function extendTouchHandlerWithTarget(eventSpecial, eventName) {

        return {
            touchHandler: function(e) {
                eventSpecial._processed = true;

                e.pointerType = 2;

                var pointerevent = new PointerEvent(e, eventName),
                    target = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY);

                // if bubbling – switch target to parent
                if(e.currentTarget.contains(target)) {
                    target = e.currentTarget;
                }

                pointerevent.dispatch(target);
            }
        }

    }

    /**
     * Object to extend $.event.special to handle
     * pointermove with touch events.
     *
     * @param {object} eventSpecial current $.event.special
     * @param {sring} eventName event name
     * @return {object}
     */
    function extendTouchMove(eventSpecial, eventName, type) {

        return {
            setup: function() {
                $(this)
                    .on(binds.mouse[type], eventSpecial.mouseHandler)
                    .on(binds.touch[type], eventSpecial.touchHandler)
                    .on(binds.touch.down, eventSpecial.touchDownHandler)
                    .on(binds.mspointer[type], eventSpecial.msPointerHandler);
            },

            teardown: function() {
                $(this)
                    .off(binds.mouse[type], eventSpecial.mouseHandler)
                    .off(binds.touch[type], eventSpecial.touchHandler)
                    .off(binds.touch.down, eventSpecial.touchDownHandler)
                    .off(binds.mspointer[type], eventSpecial.msPointerHandler);
            },

            touchDownHandler: function(e) {
                eventSpecial._processed = true;
                eventSpecial._target = e.originalEvent.changedTouches[0].target;
            },

            touchHandler: function(e) {
                e.pointerType = 2;

                var pointerevent = new PointerEvent(e, eventName),
                    newTarget = doc.elementFromPoint(pointerevent.clientX, pointerevent.clientY),
                    currentTarget = eventSpecial._target;

                pointerevent.dispatch(currentTarget);

                if(currentTarget !== newTarget) {
                    // out current target
                    pointerevent = new PointerEvent(e, 'pointerout');
                    pointerevent.dispatch(currentTarget);

                    // new target is not a child of the current -> leave current target
                    if(!currentTarget.contains(newTarget)) {
                        pointerevent = new PointerEvent(e, 'pointerleave');
                        pointerevent.dispatch(currentTarget);
                    }

                    // new target is not the parent of the current -> leave new target
                    if(!newTarget.contains(currentTarget)) {
                        pointerevent = new PointerEvent(e, 'pointerenter');
                        pointerevent.dispatch(newTarget);
                    }

                    // over new target
                    pointerevent = new PointerEvent(e, 'pointerover');
                    pointerevent.dispatch(newTarget);

                    // new target -> current target
                    eventSpecial._target = newTarget;
                }
            }
        }

    }

    // init pointer events
    addPointerEvent('enter');
    addPointerEvent('over');
    addPointerEvent('down');
    addPointerEvent('move', extendTouchMove);
    addPointerEvent('up', extendTouchHandlerWithTarget);
    addPointerEvent('out', extendTouchHandlerWithTarget);
    addPointerEvent('leave', extendTouchHandlerWithTarget);
    addPointerEvent('cancel');

})(window, jQuery);
