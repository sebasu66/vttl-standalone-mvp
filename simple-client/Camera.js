import * as pc from 'playcanvas';

/**
 * VTTL Camera Controller
 * Handles all camera operations including orbit controls, positioning, and API commands
 */
class VTTLCamera {
    constructor(app, canvas) {
        this.app = app;
        this.canvas = canvas;
        
        // Camera entity
        this.entity = null;
        
        // Orbit controls state
        this.orbitState = {
            distance: 18,
            pitch: 35,
            yaw: 45,
            target: new pc.Vec3(0, 0, 0),
            lastX: 0,
            lastY: 0,
            dragging: false,
            
            // Constraints
            distanceMin: 3,
            distanceMax: 50,
            pitchMin: -89,
            pitchMax: 89,
            
            // Smoothing
            smoothing: 0.1,
            targetDistance: 18,
            targetPitch: 35,
            targetYaw: 45
        };
        
        // Animation state
        this.animating = false;
        this.animationData = null;
        
        // Presets
        this.presets = {
            overhead: { distance: 25, pitch: 85, yaw: 0 },
            side: { distance: 20, pitch: 10, yaw: 90 },
            corner: { distance: 18, pitch: 35, yaw: 45 },
            close: { distance: 8, pitch: 25, yaw: 30 },
            bird: { distance: 35, pitch: 75, yaw: 0 }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createCameraEntity();
        this.setupControls();
        this.updatePosition();
        
        // Start update loop
        this.app.on('update', this.update.bind(this));
    }
    
    createCameraEntity() {
        this.entity = new pc.Entity('VTTLCamera');
        this.entity.addComponent('camera', {
            clearColor: new pc.Color(0.15, 0.15, 0.25),
            farClip: 100,
            fov: 60,
            nearClip: 0.1
        });
        
        this.app.root.addChild(this.entity);
        this.updatePosition();
    }
    
    setupControls() {
        // Mouse controls
        this.app.mouse.on('mousedown', this.onMouseDown.bind(this));
        this.app.mouse.on('mouseup', this.onMouseUp.bind(this));
        this.app.mouse.on('mousemove', this.onMouseMove.bind(this));
        this.app.mouse.on('wheel', this.onMouseWheel.bind(this));
        
        // Touch controls for mobile
        if (this.app.touch) {
            this.setupTouchControls();
        }
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupTouchControls() {
        let lastTouchDistance = 0;
        let lastTouchCenter = { x: 0, y: 0 };
        
        this.app.touch.on('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.orbitState.dragging = true;
                this.orbitState.lastX = event.touches[0].x;
                this.orbitState.lastY = event.touches[0].y;
            } else if (event.touches.length === 2) {
                // Pinch zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.x - touch1.x, 2) + 
                    Math.pow(touch2.y - touch1.y, 2)
                );
                lastTouchCenter = {
                    x: (touch1.x + touch2.x) / 2,
                    y: (touch1.y + touch2.y) / 2
                };
            }
        });
        
        this.app.touch.on('touchmove', (event) => {
            if (event.touches.length === 1 && this.orbitState.dragging) {
                const deltaX = event.touches[0].x - this.orbitState.lastX;
                const deltaY = event.touches[0].y - this.orbitState.lastY;
                
                this.orbitState.targetYaw += deltaX * 0.5;
                this.orbitState.targetPitch += deltaY * 0.5;
                this.constrainAngles();
                
                this.orbitState.lastX = event.touches[0].x;
                this.orbitState.lastY = event.touches[0].y;
            } else if (event.touches.length === 2) {
                // Pinch zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.x - touch1.x, 2) + 
                    Math.pow(touch2.y - touch1.y, 2)
                );
                
                const deltaDistance = distance - lastTouchDistance;
                this.orbitState.targetDistance -= deltaDistance * 0.01;
                this.constrainDistance();
                
                lastTouchDistance = distance;
            }
        });
        
        this.app.touch.on('touchend', () => {
            this.orbitState.dragging = false;
        });
    }
    
    setupKeyboardShortcuts() {
        if (!this.app.keyboard) return;
        
        this.app.keyboard.on('keydown', (event) => {
            switch (event.key) {
                case pc.KEY_1:
                    this.setPreset('overhead');
                    break;
                case pc.KEY_2:
                    this.setPreset('side');
                    break;
                case pc.KEY_3:
                    this.setPreset('corner');
                    break;
                case pc.KEY_4:
                    this.setPreset('close');
                    break;
                case pc.KEY_5:
                    this.setPreset('bird');
                    break;
                case pc.KEY_R:
                    this.reset();
                    break;
                case pc.KEY_F:
                    this.frameScene();
                    break;
            }
        });
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            this.orbitState.dragging = true;
            this.orbitState.lastX = event.x;
            this.orbitState.lastY = event.y;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.orbitState.dragging = false;
        }
    }
    
    onMouseMove(event) {
        if (this.orbitState.dragging) {
            const deltaX = event.x - this.orbitState.lastX;
            const deltaY = event.y - this.orbitState.lastY;
            
            this.orbitState.targetYaw += deltaX * 0.5;
            this.orbitState.targetPitch += deltaY * 0.5;
            
            this.constrainAngles();
            
            this.orbitState.lastX = event.x;
            this.orbitState.lastY = event.y;
        }
    }
    
    onMouseWheel(event) {
        this.orbitState.targetDistance += event.wheel * 0.5;
        this.constrainDistance();
    }
    
    constrainAngles() {
        this.orbitState.targetPitch = pc.math.clamp(
            this.orbitState.targetPitch, 
            this.orbitState.pitchMin, 
            this.orbitState.pitchMax
        );
        
        // Normalize yaw to 0-360
        while (this.orbitState.targetYaw >= 360) this.orbitState.targetYaw -= 360;
        while (this.orbitState.targetYaw < 0) this.orbitState.targetYaw += 360;
    }
    
    constrainDistance() {
        this.orbitState.targetDistance = pc.math.clamp(
            this.orbitState.targetDistance,
            this.orbitState.distanceMin,
            this.orbitState.distanceMax
        );
    }
    
    update(dt) {
        // Smooth interpolation to target values
        if (!this.animating) {
            this.orbitState.distance = pc.math.lerp(
                this.orbitState.distance, 
                this.orbitState.targetDistance, 
                this.orbitState.smoothing
            );
            this.orbitState.pitch = pc.math.lerp(
                this.orbitState.pitch, 
                this.orbitState.targetPitch, 
                this.orbitState.smoothing
            );
            this.orbitState.yaw = pc.math.lerp(
                this.orbitState.yaw, 
                this.orbitState.targetYaw, 
                this.orbitState.smoothing
            );
        }
        
        // Handle animations
        if (this.animating && this.animationData) {
            this.updateAnimation(dt);
        }
        
        this.updatePosition();
    }
    
    updatePosition() {
        const yawRad = this.orbitState.yaw * pc.math.DEG_TO_RAD;
        const pitchRad = this.orbitState.pitch * pc.math.DEG_TO_RAD;
        
        const x = this.orbitState.distance * Math.cos(pitchRad) * Math.sin(yawRad);
        const y = this.orbitState.distance * Math.sin(pitchRad);
        const z = this.orbitState.distance * Math.cos(pitchRad) * Math.cos(yawRad);
        
        this.entity.setPosition(
            this.orbitState.target.x + x,
            this.orbitState.target.y + y,
            this.orbitState.target.z + z
        );
        
        this.entity.lookAt(this.orbitState.target);
    }
    
    // API Methods
    
    setPosition(x, y, z) {
        this.entity.setPosition(x, y, z);
        this.calculateOrbitFromPosition();
    }
    
    setTarget(x, y, z) {
        this.orbitState.target.set(x, y, z);
        this.orbitState.targetDistance = this.orbitState.distance;
        this.updatePosition();
    }
    
    lookAt(x, y, z) {
        this.entity.lookAt(x, y, z);
        this.calculateOrbitFromPosition();
    }
    
    setFOV(fov) {
        this.entity.camera.fov = pc.math.clamp(fov, 10, 120);
    }
    
    setDistance(distance) {
        this.orbitState.targetDistance = pc.math.clamp(
            distance, 
            this.orbitState.distanceMin, 
            this.orbitState.distanceMax
        );
    }
    
    setAngles(pitch, yaw) {
        this.orbitState.targetPitch = pc.math.clamp(pitch, this.orbitState.pitchMin, this.orbitState.pitchMax);
        this.orbitState.targetYaw = yaw;
        this.constrainAngles();
    }
    
    setConstraints(minDistance, maxDistance, minPitch, maxPitch) {
        this.orbitState.distanceMin = minDistance || this.orbitState.distanceMin;
        this.orbitState.distanceMax = maxDistance || this.orbitState.distanceMax;
        this.orbitState.pitchMin = minPitch !== undefined ? minPitch : this.orbitState.pitchMin;
        this.orbitState.pitchMax = maxPitch !== undefined ? maxPitch : this.orbitState.pitchMax;
        
        this.constrainAngles();
        this.constrainDistance();
    }
    
    animateTo(targetConfig, duration = 1.0, easing = 'ease-out') {
        this.animating = true;
        this.animationData = {
            startTime: Date.now(),
            duration: duration * 1000, // Convert to milliseconds
            easing: easing,
            
            startDistance: this.orbitState.distance,
            startPitch: this.orbitState.pitch,
            startYaw: this.orbitState.yaw,
            startTarget: this.orbitState.target.clone(),
            
            targetDistance: targetConfig.distance !== undefined ? targetConfig.distance : this.orbitState.distance,
            targetPitch: targetConfig.pitch !== undefined ? targetConfig.pitch : this.orbitState.pitch,
            targetYaw: targetConfig.yaw !== undefined ? targetConfig.yaw : this.orbitState.yaw,
            targetTarget: targetConfig.target ? new pc.Vec3(targetConfig.target[0], targetConfig.target[1], targetConfig.target[2]) : this.orbitState.target.clone()
        };
    }
    
    updateAnimation(dt) {
        const elapsed = Date.now() - this.animationData.startTime;
        const progress = Math.min(elapsed / this.animationData.duration, 1.0);
        
        // Apply easing
        let easedProgress = progress;
        switch (this.animationData.easing) {
            case 'ease-in':
                easedProgress = progress * progress;
                break;
            case 'ease-out':
                easedProgress = 1 - Math.pow(1 - progress, 2);
                break;
            case 'ease-in-out':
                easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                break;
            default: // linear
                break;
        }
        
        // Interpolate values
        this.orbitState.distance = pc.math.lerp(this.animationData.startDistance, this.animationData.targetDistance, easedProgress);
        this.orbitState.pitch = pc.math.lerp(this.animationData.startPitch, this.animationData.targetPitch, easedProgress);
        this.orbitState.yaw = pc.math.lerp(this.animationData.startYaw, this.animationData.targetYaw, easedProgress);
        this.orbitState.target.lerp(this.animationData.startTarget, this.animationData.targetTarget, easedProgress);
        
        if (progress >= 1.0) {
            this.animating = false;
            this.animationData = null;
        }
    }
    
    setPreset(presetName) {
        if (this.presets[presetName]) {
            const preset = this.presets[presetName];
            this.animateTo(preset, 1.0, 'ease-out');
        }
    }
    
    addPreset(name, config) {
        this.presets[name] = { ...config };
    }
    
    reset() {
        this.animateTo({
            distance: 18,
            pitch: 35,
            yaw: 45,
            target: [0, 0, 0]
        }, 1.0, 'ease-out');
    }
    
    frameScene(entities = null) {
        // Calculate bounding box of all entities or provided entities
        if (!entities) {
            entities = window.entities || []; // Use global entities array
        }
        
        if (entities.length === 0) {
            this.reset();
            return;
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        entities.forEach(entity => {
            const pos = entity.getPosition();
            const scale = entity.getLocalScale();
            
            minX = Math.min(minX, pos.x - scale.x);
            maxX = Math.max(maxX, pos.x + scale.x);
            minY = Math.min(minY, pos.y - scale.y);
            maxY = Math.max(maxY, pos.y + scale.y);
            minZ = Math.min(minZ, pos.z - scale.z);
            maxZ = Math.max(maxZ, pos.z + scale.z);
        });
        
        // Calculate center and size
        const center = [
            (minX + maxX) / 2,
            (minY + maxY) / 2,
            (minZ + maxZ) / 2
        ];
        
        const size = Math.max(maxX - minX, maxZ - minZ, maxY - minY);
        const distance = Math.max(size * 1.5, this.orbitState.distanceMin);
        
        this.animateTo({
            target: center,
            distance: distance,
            pitch: 35,
            yaw: 45
        }, 1.5, 'ease-out');
    }
    
    calculateOrbitFromPosition() {
        const pos = this.entity.getPosition();
        const target = this.orbitState.target;
        
        const dx = pos.x - target.x;
        const dy = pos.y - target.y;
        const dz = pos.z - target.z;
        
        this.orbitState.distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        this.orbitState.targetDistance = this.orbitState.distance;
        
        this.orbitState.pitch = Math.asin(dy / this.orbitState.distance) * pc.math.RAD_TO_DEG;
        this.orbitState.targetPitch = this.orbitState.pitch;
        
        this.orbitState.yaw = Math.atan2(dx, dz) * pc.math.RAD_TO_DEG;
        this.orbitState.targetYaw = this.orbitState.yaw;
        
        this.constrainAngles();
    }
    
    // Screenshot specific positioning
    getScreenshotPosition() {
        return {
            distance: this.orbitState.distance,
            pitch: this.orbitState.pitch,
            yaw: this.orbitState.yaw,
            target: this.orbitState.target.clone(),
            fov: this.entity.camera.fov
        };
    }
    
    setScreenshotPosition(config) {
        if (config.distance !== undefined) this.setDistance(config.distance);
        if (config.pitch !== undefined && config.yaw !== undefined) {
            this.setAngles(config.pitch, config.yaw);
        }
        if (config.target) this.setTarget(config.target[0], config.target[1], config.target[2]);
        if (config.fov !== undefined) this.setFOV(config.fov);
    }
    
    // Utility methods
    getInfo() {
        return {
            position: this.entity.getPosition().data,
            target: this.orbitState.target.data,
            distance: this.orbitState.distance,
            pitch: this.orbitState.pitch,
            yaw: this.orbitState.yaw,
            fov: this.entity.camera.fov,
            constraints: {
                distanceMin: this.orbitState.distanceMin,
                distanceMax: this.orbitState.distanceMax,
                pitchMin: this.orbitState.pitchMin,
                pitchMax: this.orbitState.pitchMax
            }
        };
    }
    
    destroy() {
        if (this.entity && this.entity.parent) {
            this.entity.parent.removeChild(this.entity);
            this.entity.destroy();
        }
        
        // Remove event listeners
        this.app.off('update', this.update);
        
        // Clear references
        this.entity = null;
        this.app = null;
        this.canvas = null;
    }
}

// Export as ES6 module
export default VTTLCamera;