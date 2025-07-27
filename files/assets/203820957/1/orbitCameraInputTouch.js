// OrbitCameraInputTouch.js
var OrbitCameraInputTouch = pc.createScript('orbitCameraInputTouch');

OrbitCameraInputTouch.attributes.add('orbitSensitivity', {
    type: 'number',
    default: 0.2,
    title: 'Orbit Sensitivity',
    description: 'How fast the camera moves around the orbit. Higher is faster.'
});

OrbitCameraInputTouch.attributes.add('distanceSensitivity', {
    type: 'number',
    default: 0.1,
    title: 'Distance Sensitivity',
    description: 'How fast the camera zooms in and out. Higher is faster.'
});

OrbitCameraInputTouch.attributes.add('panningSensitivity', {
    type: 'number',
    default: 0.1,
    title: 'Panning Sensitivity',
    description: 'How fast the camera pans. Higher is faster.'
});

OrbitCameraInputTouch.prototype.initialize = function () {
    this.orbitCamera = this.entity.script.orbitCamera;

    this.lastTouchPoint = new pc.Vec2();
    this.lastPinchMidPoint = new pc.Vec2();
    this.lastPinchDistance = 0;

    if (this.orbitCamera && this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);

        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);

        this.on('destroy', function () {
            this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
            this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
            this.app.touch.off(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);

            this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        });
    }
};

OrbitCameraInputTouch.prototype.getPinchDistance = function (pointA, pointB) {
    var dx = pointA.x - pointB.x;
    var dy = pointA.y - pointB.y;

    return Math.sqrt(dx * dx + dy * dy);
};

OrbitCameraInputTouch.prototype.calcMidPoint = function (pointA, pointB, result) {
    result.set((pointA.x + pointB.x) * 0.5, (pointA.y + pointB.y) * 0.5);
};

OrbitCameraInputTouch.prototype.onTouchStartEndCancel = function (event) {
    var touches = event.touches;
    if (touches.length === 1) {
        this.lastTouchPoint.set(touches[0].x, touches[0].y);
    } else if (touches.length === 2) {
        this.lastPinchDistance = this.getPinchDistance(touches[0], touches[1]);
        this.calcMidPoint(touches[0], touches[1], this.lastPinchMidPoint);
    }
};

OrbitCameraInputTouch.prototype.onTouchMove = function (event) {
    var touches = event.touches;
    this.orbitCamera.startMove();

    if (touches.length === 1) {
        // Single finger: rotate or adjust height
        var touch = touches[0];
        var dx = touch.x - this.lastTouchPoint.x;
        var dy = touch.y - this.lastTouchPoint.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement - rotate around target
            this.orbitCamera.yaw -= dx * this.orbitSensitivity;
        } else {
            // Vertical movement - adjust pitch
            this.orbitCamera.pitch -= dy * this.orbitSensitivity;
        }

        this.lastTouchPoint.set(touch.x, touch.y);
    } else if (touches.length === 2) {
        // Two fingers: pan and pinch to zoom
        var currentPinchDistance = this.getPinchDistance(touches[0], touches[1]);
        var diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
        this.lastPinchDistance = currentPinchDistance;

        // Pinch to zoom
        this.orbitCamera.distance -= diffInPinchDistance * this.distanceSensitivity * (this.orbitCamera.distance * 0.01);

        // Pan
        var midPoint = new pc.Vec2();
        this.calcMidPoint(touches[0], touches[1], midPoint);

        var dx = midPoint.x - this.lastPinchMidPoint.x;
        var dy = midPoint.y - this.lastPinchMidPoint.y;

        var camera = this.entity.camera;
        var distance = this.orbitCamera.distance;

        var factor = (distance / 700) * this.panningSensitivity;

        var panOffset = new pc.Vec3();
        var right = new pc.Vec3();
        var up = new pc.Vec3();

        camera.getWorldTransform().getXAxis(right);
        camera.getWorldTransform().getYAxis(up);

        panOffset.addScaledVector(right, -dx * factor);
        panOffset.addScaledVector(up, -dy * factor);

        this.orbitCamera.pivotPoint.add(panOffset);

        this.lastPinchMidPoint.copy(midPoint);
    }
};