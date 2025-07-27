// OrbitCamera.js
var OrbitCamera = pc.createScript('orbitCamera');

OrbitCamera.attributes.add('distanceMax', { type: 'number', default: 0, title: 'Distance Max', description: 'Setting this to 0 gives an infinite distance limit' });
OrbitCamera.attributes.add('distanceMin', { type: 'number', default: 0, title: 'Distance Min' });
OrbitCamera.attributes.add('pitchAngleMax', { type: 'number', default: 90, title: 'Pitch Angle Max (degrees)' });
OrbitCamera.attributes.add('pitchAngleMin', { type: 'number', default: -90, title: 'Pitch Angle Min (degrees)' });

OrbitCamera.attributes.add('inertiaFactor', {
    type: 'number',
    default: 0,
    title: 'Inertia Factor',
    description: 'Higher value results in more inertia. 0 means no inertia.'
});

OrbitCamera.attributes.add('targetEntity', {
    type: 'entity',
    title: 'Target Entity',
    description: 'Entity to use as the orbit center'
});

OrbitCamera.attributes.add('moveStartEvent', {
    type: 'string',
    default: '',
    title: 'Move Start Event',
    description: 'Event to fire when camera starts moving'
});

OrbitCamera.attributes.add('moveEndEvent', {
    type: 'string',
    default: '',
    title: 'Move End Event',
    description: 'Event to fire when camera stops moving'
});

// Initialize function called once per entity
OrbitCamera.prototype.initialize = function () {
    // Assign initial values
    this._distance = 0;
    this._targetDistance = 0;
    this._yaw = 0;
    this._pitch = 0;
    this._targetYaw = 0;
    this._targetPitch = 0;
    this._pivotPoint = new pc.Vec3();
    this._isMoving = false;
    this._moveTime = 0;

    if (!this.targetEntity) {
        console.error('OrbitCamera script requires a targetEntity to function properly.');
        return;
    }

    // Set initial pivot point to target entity's position
    this.pivotPoint.copy(this.targetEntity.getPosition());

    // Set initial pitch and yaw
    this._pitch = 0;
    this._yaw = 0;
    this._targetPitch = this._pitch;
    this._targetYaw = this._yaw;

    // Set initial distance
    this._distance = this._clampDistance(10); // Adjust as needed
    this._targetDistance = this._distance;

    // Update camera position
    this._updatePosition();
};

// Update function called every frame
OrbitCamera.prototype.update = function (dt) {
    var t = this.inertiaFactor === 0 ? 1 : Math.min(dt / this.inertiaFactor, 1);
    this._distance = pc.math.lerp(this._distance, this._targetDistance, t);
    this._yaw = pc.math.lerp(this._yaw, this._targetYaw, t);
    this._pitch = pc.math.lerp(this._pitch, this._targetPitch, t);

    this._updatePosition();

    // Check for movement start/end events
    if (this._isMoving) {
        this._moveTime += dt;
        if (this._moveTime > 0.1) {
            this._isMoving = false;
            if (this.moveEndEvent) {
                this.app.fire(this.moveEndEvent);
            }
        }
    }
};

// Internal function to update camera position
OrbitCamera.prototype._updatePosition = function () {
    // Update camera position and rotation
    var quat = new pc.Quat();
    quat.setFromEulerAngles(this._pitch, this._yaw, 0);

    var offset = new pc.Vec3(0, 0, -this._distance);
    quat.transformVector(offset, offset);

    var position = new pc.Vec3();
    position.add2(this.pivotPoint, offset);

    this.entity.setPosition(position);
    this.entity.lookAt(this.pivotPoint);
};

// Function to start camera movement
OrbitCamera.prototype.startMove = function () {
    if (!this._isMoving) {
        this._isMoving = true;
        this._moveTime = 0;
        if (this.moveStartEvent) {
            this.app.fire(this.moveStartEvent);
        }
    }
    // Reset move timer
    this._moveTime = 0;
};

// Function to clamp distance
OrbitCamera.prototype._clampDistance = function (distance) {
    if (this.distanceMax > 0) {
        return pc.math.clamp(distance, this.distanceMin, this.distanceMax);
    } else {
        return Math.max(distance, this.distanceMin);
    }
};

// Function to clamp pitch angle
OrbitCamera.prototype._clampPitchAngle = function (pitch) {
    return pc.math.clamp(pitch, this.pitchAngleMin, this.pitchAngleMax);
};

// Calculations for yaw and pitch (if needed)
OrbitCamera.prototype._calcYaw = function (quat) {
    var forward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, forward);

    return Math.atan2(-forward.x, -forward.z) * pc.math.RAD_TO_DEG;
};

OrbitCamera.prototype._calcPitch = function (quat, yaw) {
    var quatWithoutYaw = new pc.Quat();
    var yawOffset = new pc.Quat();

    yawOffset.setFromEulerAngles(0, -yaw, 0);
    quatWithoutYaw.mul2(yawOffset, quat);

    var forward = new pc.Vec3();
    quatWithoutYaw.transformVector(pc.Vec3.FORWARD, forward);

    return Math.atan2(forward.y, -forward.z) * pc.math.RAD_TO_DEG;
};

// Accessors
Object.defineProperty(OrbitCamera.prototype, 'pivotPoint', {
    get: function () {
        return this._pivotPoint;
    },
    set: function (value) {
        this._pivotPoint.copy(value);
    }
});

Object.defineProperty(OrbitCamera.prototype, "distance", {
    get: function () {
        return this._targetDistance;
    },

    set: function (value) {
        this._targetDistance = this._clampDistance(value);
    }
});

Object.defineProperty(OrbitCamera.prototype, "pitch", {
    get: function () {
        return this._targetPitch;
    },

    set: function (value) {
        this._targetPitch = this._clampPitchAngle(value);
    }
});

Object.defineProperty(OrbitCamera.prototype, "yaw", {
    get: function () {
        return this._targetYaw;
    },

    set: function (value) {
        this._targetYaw = value;
    }
});