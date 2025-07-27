// HelicopterCamera.js
var HelicopterCamera = pc.createScript('helicopterCamera');

HelicopterCamera.attributes.add('initialPitchAngle', {
    type: 'number',
    default: -30,
    title: 'Initial Pitch Angle',
    description: 'The fixed angle (in degrees) the camera looks down at.'
});

HelicopterCamera.attributes.add('enableFieldOfViewZoom', {
    type: 'boolean',
    default: false,
    title: 'Enable Field of View Zoom',
    description: 'If true, scroll wheel changes the camera\'s field of view instead of altitude.'
});

HelicopterCamera.attributes.add('moveSpeed', {
    type: 'number',
    default: 10,
    title: 'Base Move Speed',
    description: 'Base speed at which the camera moves when panning.'
});

HelicopterCamera.attributes.add('rotateSpeed', {
    type: 'number',
    default: 0.2,
    title: 'Base Rotate Speed',
    description: 'Base speed at which the camera rotates when dragging with the middle mouse button.'
});

HelicopterCamera.attributes.add('zoomSpeed', {
    type: 'number',
    default: 2,
    title: 'Zoom Speed',
    description: 'Speed at which the camera zooms in/out or changes altitude with the scroll wheel.'
});

HelicopterCamera.attributes.add('minAltitude', {
    type: 'number',
    default: 1,
    title: 'Min Altitude',
    description: 'Minimum altitude the camera can reach.'
});

HelicopterCamera.attributes.add('maxAltitude', {
    type: 'number',
    default: 100,
    title: 'Max Altitude',
    description: 'Maximum altitude the camera can reach.'
});

HelicopterCamera.attributes.add('minFieldOfView', {
    type: 'number',
    default: 20,
    title: 'Min Field of View',
    description: 'Minimum field of view angle, in degrees.'
});

HelicopterCamera.attributes.add('maxFieldOfView', {
    type: 'number',
    default: 100,
    title: 'Max Field of View',
    description: 'Maximum field of view angle, in degrees.'
});

// New attributes for smooth movement
HelicopterCamera.attributes.add('positionInertia', {
    type: 'number',
    default: 0.1,
    title: 'Position Inertia',
    description: 'Smoothness of camera position movement. Lower values are smoother.'
});

HelicopterCamera.attributes.add('rotationInertia', {
    type: 'number',
    default: 0.1,
    title: 'Rotation Inertia',
    description: 'Smoothness of camera rotation. Lower values are smoother.'
});

// New attribute to invert forward/backward panning
HelicopterCamera.attributes.add('invertPanY', {
    type: 'boolean',
    default: false,
    title: 'Invert Forward/Backward Pan',
    description: 'Invert the direction of forward/backward panning.'
});

// Initialize code called once per entity
HelicopterCamera.prototype.initialize = function () {
    // Set initial pitch angle
    this.targetPitch = this.initialPitchAngle;
    this.entity.setEulerAngles(this.initialPitchAngle, 0, 0);
    this.currentEulerY = this.entity.getEulerAngles().y;

    // Target positions and rotations for smooth movement
    this.targetPosition = this.entity.getPosition().clone();
    this.targetEulerY = this.currentEulerY;
    this.currentPosition = this.entity.getPosition().clone();

    // Internal variables
    this.isPanning = false;
    this.isRotating = false;
    this.lastMousePosition = new pc.Vec2();
    this.lastMouseEventTime = performance.now();

    // Listen for mouse events
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
    this.app.mouse.on(pc.EVENT_MOUSEOUT, this.onMouseOut, this);

    // Disable context menu so right-click works
    this.app.mouse.disableContextMenu();

    // Touch events for mobile (optional)
    if (this.app.touch) {
        // Add touch controls as needed
    }
};

// Called every frame
HelicopterCamera.prototype.update = function (dt) {
    // Smoothly interpolate position
    this.currentPosition.lerp(this.currentPosition, this.targetPosition, 1 - Math.pow(this.positionInertia, dt * 60));
    this.entity.setPosition(this.currentPosition);

    // Smoothly interpolate rotation
    this.currentEulerY = pc.math.lerpAngle(this.currentEulerY, this.targetEulerY, 1 - Math.pow(this.rotationInertia, dt * 60));
    this.entity.setEulerAngles(this.initialPitchAngle, this.currentEulerY, 0);
};

// Mouse event handlers
HelicopterCamera.prototype.onMouseDown = function (event) {
    if (event.button === pc.MOUSEBUTTON_RIGHT) {
        this.isPanning = true;
    } else if (event.button === pc.MOUSEBUTTON_MIDDLE) {
        this.isRotating = true;
    }
    this.lastMousePosition.set(event.x, event.y);
    this.lastMouseEventTime = performance.now();
};

HelicopterCamera.prototype.onMouseUp = function (event) {
    if (event.button === pc.MOUSEBUTTON_RIGHT) {
        this.isPanning = false;
       // pc.app.qm.switchToHighQuality();
    } else if (event.button === pc.MOUSEBUTTON_MIDDLE) {
        this.isRotating = false;
        //pc.app.qm.switchToHighQuality();
    }
};

HelicopterCamera.prototype.onMouseMove = function (event) {
    var currentTime = performance.now();
    var timeDifference = currentTime - this.lastMouseEventTime; // In milliseconds
    var dt = timeDifference / 1000; // Convert to seconds

    var dx = event.x - this.lastMousePosition.x;
    var dy = event.y - this.lastMousePosition.y;

    var speedFactor = Math.sqrt(dx * dx + dy * dy) / dt; // Pixels per second
    // Adjust the sensitivity curve as needed
    // For smoother response, you can use logarithmic scaling
    speedFactor = Math.log(speedFactor + 1);

    // Normalize the speed factor to a reasonable range
    var normalizedSpeed = pc.math.clamp(speedFactor / 5, 0.2, 3); // Adjust divisor and range as needed

    if (this.isPanning) {
        this.pan(dx, dy, normalizedSpeed);
        //pc.app.qm.switchToLowQuality();

    } else if (this.isRotating) {
        this.rotate(dx, normalizedSpeed);
        //pc.app.qm.switchToLowQuality();
    }

    this.lastMousePosition.set(event.x, event.y);
    this.lastMouseEventTime = currentTime;
};

HelicopterCamera.prototype.onMouseWheel = function (event) {
    if (this.enableFieldOfViewZoom) {
        this.zoomFieldOfView(event.wheel);
    } else {
        this.changeAltitude(event.wheel);
    }
};

HelicopterCamera.prototype.onMouseOut = function (event) {
    this.isPanning = false;
    this.isRotating = false;
    //pc.app.qm.switchToHighQuality();
};

// Implement pan movement
HelicopterCamera.prototype.pan = function (dx, dy, speedFactor) {
    var right = this.entity.right.clone();
    var forward = this.entity.forward.clone();
    forward.y = 0; // Keep movement in XZ plane
    forward.normalize();

    var factor = this.moveSpeed * 0.01 * speedFactor;
    var invertY = this.invertPanY ? -1 : 1;

    var movement = new pc.Vec3();
    movement.add(right.scale(-dx * factor));
    movement.add(forward.scale(-dy * factor * invertY));

    this.targetPosition.add(movement);
};

// Implement rotation
HelicopterCamera.prototype.rotate = function (dx, speedFactor) {
    this.targetEulerY -= dx * this.rotateSpeed * speedFactor;
};

// Add these to your attributes at the top of the script
HelicopterCamera.attributes.add('forwardRatio', {
    type: 'number',
    default: 0.7,
    title: 'Forward Movement Ratio',
    description: 'Ratio of forward movement when changing altitude (0-1)'
});

HelicopterCamera.attributes.add('verticalRatio', {
    type: 'number',
    default: 0.3,
    title: 'Vertical Movement Ratio',
    description: 'Ratio of vertical movement when changing altitude (0-1)'
});

// Then use this version of the function
HelicopterCamera.prototype.changeAltitude = function (wheel) {
    var delta = -wheel * this.zoomSpeed * 0.1;
    
    // Get the forward vector of the camera
    var forward = this.entity.forward.clone();
    
    // Create movement vector with configurable ratios
    var movement = new pc.Vec3(
        forward.x * delta * this.forwardRatio,
        forward.y * delta * this.verticalRatio,
        forward.z * delta * this.forwardRatio
    );
    
    // Calculate new position
    var newPosition = this.targetPosition.clone().add(movement);
    
    // Clamp the Y position to maintain altitude limits
    newPosition.y = pc.math.clamp(newPosition.y, this.minAltitude, this.maxAltitude);
    
    // Update target position
    this.targetPosition.copy(newPosition);
};

// Implement field of view zoom
HelicopterCamera.prototype.zoomFieldOfView = function (wheel) {
    var camera = this.entity.camera;
    var delta = -wheel * this.zoomSpeed * 0.1;
    var newFov = pc.math.clamp(camera.fov + delta, this.minFieldOfView, this.maxFieldOfView);
    camera.fov = newFov;
};