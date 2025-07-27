// OrbitCameraInputMouse.js
var OrbitCameraInputMouse = pc.createScript('orbitCameraInputMouse');

OrbitCameraInputMouse.attributes.add('orbitSensitivity', {
    type: 'number',
    default: 0.3,
    title: 'Orbit Sensitivity',
    description: 'How fast the camera orbits around the target. Higher is faster.'
});

OrbitCameraInputMouse.attributes.add('distanceSensitivity', {
    type: 'number',
    default: 0.15,
    title: 'Distance Sensitivity',
    description: 'How fast the camera zooms in and out. Higher is faster.'
});

OrbitCameraInputMouse.attributes.add('panningSensitivity', {
    type: 'number',
    default: 0.1,
    title: 'Panning Sensitivity',
    description: 'How fast the camera pans. Higher is faster.'
});

OrbitCameraInputMouse.prototype.initialize = function () {
    this.orbitCamera = this.entity.script.orbitCamera;

    if (this.orbitCamera) {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        this.app.mouse.on(pc.EVENT_MOUSELEAVE, this.onMouseLeave, this);

        this.on('destroy', function () {
            this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
            this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
            this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
            this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
            this.app.mouse.off(pc.EVENT_MOUSELEAVE, this.onMouseLeave, this);
        });
    }

    this.app.mouse.disableContextMenu();

    this.lookButtonDown = false;
    this.panButtonDown = false;
    this.lastPoint = new pc.Vec2();
};

OrbitCameraInputMouse.prototype.onMouseDown = function (e) {
    if (e.button === pc.MOUSEBUTTON_LEFT) {
        this.lookButtonDown = true;
    } else if (e.button === pc.MOUSEBUTTON_RIGHT) {
        this.panButtonDown = true;
    }
};

OrbitCameraInputMouse.prototype.onMouseUp = function (e) {
    if (e.button === pc.MOUSEBUTTON_LEFT) {
        this.lookButtonDown = false;
    } else if (e.button === pc.MOUSEBUTTON_RIGHT) {
        this.panButtonDown = false;
    }
};

OrbitCameraInputMouse.prototype.onMouseLeave = function (e) {
    this.lookButtonDown = false;
    this.panButtonDown = false;
};

OrbitCameraInputMouse.prototype.onMouseMove = function (e) {
    if (this.lookButtonDown) {
        this.orbitCamera.startMove();
        this.orbitCamera.yaw -= e.dx * this.orbitSensitivity;
        this.orbitCamera.pitch -= e.dy * this.orbitSensitivity;
        this.orbitCamera.pitch = this.orbitCamera._clampPitchAngle(this.orbitCamera.pitch);
    } else if (this.panButtonDown) {
        this.orbitCamera.startMove();
        this.pan(e);
    }

    this.lastPoint.set(e.x, e.y);
};

OrbitCameraInputMouse.prototype.onMouseWheel = function (e) {
    this.orbitCamera.startMove();
    var delta = -e.wheel * this.distanceSensitivity * (this.orbitCamera.distance * 0.1);
    this.orbitCamera.distance += delta;
    e.event.preventDefault();
};

OrbitCameraInputMouse.prototype.pan = function (e) {
    var distance = this.orbitCamera.distance;

    var right = this.entity.right.clone();
    var up = this.entity.getPosition().x.clone();

    var factor = (distance / 700) * this.panningSensitivity;
    var dx = -e.dx * factor;
    var dy = -e.dy * factor;

    var panOffset = new pc.Vec3();
    panOffset.add(right.scale(dx));
    panOffset.add(up.scale(dy));

    this.orbitCamera.pivotPoint.add(panOffset);
};