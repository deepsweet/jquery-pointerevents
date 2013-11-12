describe('common:', function() {

    it('$.PointerEvent must exists in window', function() {
        window.$.PointerEvent.must.exist();
    });

    it('$.PointerEvent must exists in window even if windown.navigator.pointerEnabled', function() {
        if(!window.navigator.pointerEnabled) {
            window.navigator.pointerEnabled = 'test';
        }

        window.$.PointerEvent.must.exist();

        if(window.navigator.pointerEnabled === 'test') {
            delete window.navigator.pointerEnabled;
        }
    });

    it('must successfully unbind from all aliased events', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem
            .on('pointerenter', spy).off('pointerenter').mouseenter()
            .on('pointerover', spy).off('pointerover').mouseover()
            .on('pointerdown', spy).off('pointerdown').mousedown()
            .on('pointermove', spy).off('pointermove').mousemove()
            .on('pointerup', spy).off('pointerup').mouseup()
            .on('pointerleave', spy).off('pointerleave').mouseleave()
            .on('pointerout', spy).off('pointerout').mouseout();

        spy.callCount.must.be.equal(0);
    });

});

describe('interface:', function() {

    it('must return valid PointerEvent', function() {
        var spy = sinon.spy(),
            elem = $('<div/>'),
            e = $.Event('mousedown', {
                which: 1
            }),
            args;

        elem.on('pointerdown', spy).trigger(e);

        spy.calledOnce.must.be.true();

        args = spy.args[0][0];
        args.isPrimary.must.be.true();
        args.pointerId.must.be.equal(1);
        args.pointerType.must.be.equal('mouse');
        args.pressure.must.be.equal(0.5);
        args.width.must.be.equal(0);
        args.height.must.be.equal(0);
        args.tiltX.must.be.equal(0);
        args.tiltY.must.be.equal(0);
    });

});

describe('mouse:', function() {

    it('must trigger "pointerenter" event on "mouseenter"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerenter', spy).mouseenter();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointerover" event on "mouseover"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerover', spy).mouseover();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointerdown" event on "mousedown"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerdown', spy).mousedown();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointermove" event on "mousemove"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointermove', spy).mousemove();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointerup" event on "mouseup"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerup', spy).mouseup();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointerleave" event on "mouseleave"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerleave', spy).mouseleave();

        spy.calledOnce.must.be.true();
    });

    it('must trigger "pointerout" event on "mouseout"', function() {
        var spy = sinon.spy(),
            elem = $('<div/>');

        elem.on('pointerout', spy).mouseout();

        spy.calledOnce.must.be.true();
    });

});

describe('touch:', function() {

    var fakeTouchObj = {
            clientX: 100,
            clientY: 200
        };

    it('must trigger "pointerenter" event on "touchstart"', function() {

        var spy = sinon.spy(),
            e = $.Event('touchstart', {
                targetTouches: [fakeTouchObj],
                changedTouches: [fakeTouchObj]
            }),
            elem = $('<div/>');

        elem.on('pointerenter', spy).trigger(e);

        spy.calledOnce.must.be.true();

    });

    it('must trigger "pointerover" event on "touchstart"', function() {

        var spy = sinon.spy(),
            e = $.Event('touchstart', {
                targetTouches: [fakeTouchObj],
                changedTouches: [fakeTouchObj]
            }),
            elem = $('<div/>');

        elem.on('pointerover', spy).trigger(e);

        spy.calledOnce.must.be.true();

    });

    it('must trigger "pointerdown" event on "touchstart"', function() {

        var spy = sinon.spy(),
            e = $.Event('touchstart', {
                targetTouches: [fakeTouchObj],
                changedTouches: [fakeTouchObj]
            }),
            elem = $('<div/>');

        elem.on('pointerdown', spy).trigger(e);

        spy.calledOnce.must.be.true();

    });

});

describe('mixed sources:', function() {

    it('must trigger only one touch-based event in case of touch + mouse', function() {

        var spy = sinon.spy(),
            fakeTouchObj = {
                clientX: 100,
                clientY: 200
            },
            e = $.Event('touchstart', {
                targetTouches: [fakeTouchObj],
                changedTouches: [fakeTouchObj]
            }),
            elem = $('<div/>'),
            args;

        elem.on('pointerdown', spy).trigger(e).mousedown();

        spy.calledOnce.must.be.true();

        args = spy.args[0][0];
        args.pointerType.must.be.equal('touch');
        args.clientX.must.be.equal(100);
        args.clientY.must.be.equal(200);

    });

    it('must trigger only one mouse-based event in case of touch + mouse + next-tick-mouse', function(done) {

        var spy = sinon.spy(),
            fakeTouchObj = {
                clientX: 100,
                clientY: 200
            },
            fakeMouseObj = {
                clientX: 300,
                clientY: 400
            },
            touchEvent = $.Event('touchstart', {
                targetTouches: [fakeTouchObj],
                changedTouches: [fakeTouchObj]
            }),
            mouseEvent = $.Event('mousedown', fakeMouseObj),
            elem = $('<div/>'),
            args;

        elem.on('pointerdown', spy).trigger(touchEvent).trigger(mouseEvent);

        setTimeout(function() {
            elem.trigger(mouseEvent);

            spy.calledOnce.must.be.false();
            args = spy.args[1][0];
            args.pointerType.must.be.equal('mouse');
            args.clientX.must.be.equal(300);
            args.clientY.must.be.equal(400);

            done();
        }, 0);

    });

});
