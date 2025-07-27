/**
 * Entity Classes - Proper class hierarchy for VTTL entities
 * Provides structured management for Lights, Cameras, and Models
 */

// Base Entity Class
class VTTLEntity {
    constructor(name, type, data = {}) {
        this.name = name;
        this.type = type;
        this.position = data.position || [0, 0, 0];
        this.rotation = data.rotation || [0, 0, 0];
        this.scale = data.scale || [1, 1, 1];
        this.properties = data.properties || {};
        this.playcanvasEntity = null;
        this.created = new Date().toISOString();
    }

    // Abstract methods to be implemented by subclasses
    createPlayCanvasEntity() {
        throw new Error('createPlayCanvasEntity must be implemented by subclass');
    }

    updateFromData(data) {
        if (data.position) this.position = data.position;
        if (data.rotation) this.rotation = data.rotation;
        if (data.scale) this.scale = data.scale;
        if (data.properties) this.properties = { ...this.properties, ...data.properties };
        
        this.updatePlayCanvasEntity();
    }

    updatePlayCanvasEntity() {
        if (this.playcanvasEntity) {
            this.playcanvasEntity.setPosition(this.position[0], this.position[1], this.position[2]);
            this.playcanvasEntity.setEulerAngles(this.rotation[0], this.rotation[1], this.rotation[2]);
            this.playcanvasEntity.setLocalScale(this.scale[0], this.scale[1], this.scale[2]);
        }
    }

    destroy() {
        if (this.playcanvasEntity) {
            this.playcanvasEntity.destroy();
            this.playcanvasEntity = null;
        }
    }

    getInfo() {
        return {
            name: this.name,
            type: this.type,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            properties: this.properties,
            created: this.created
        };
    }
}

// Light Entity Class
class VTTLLight extends VTTLEntity {
    constructor(name, data = {}) {
        super(name, 'light', data);
        
        // Light-specific properties
        this.lightType = data.lightType || data.type || 'directional';
        this.color = data.color || [1, 1, 1];
        this.intensity = data.intensity || 1.0;
        this.castShadows = data.castShadows !== undefined ? data.castShadows : true;
        this.shadowBias = data.shadowBias || 0.02;
        this.shadowDistance = data.shadowDistance || 50;
        this.shadowResolution = data.shadowResolution || 2048;
        
        // Type-specific properties
        this.range = data.range || 10; // point and spot lights
        this.innerConeAngle = data.innerConeAngle || 20; // spot lights
        this.outerConeAngle = data.outerConeAngle || 40; // spot lights
    }

    createPlayCanvasEntity() {
        if (!window.app) {
            console.warn('PlayCanvas app not ready');
            return null;
        }

        // Remove existing entity with same name
        const existing = window.app.root.findByName(this.name);
        if (existing) {
            existing.destroy();
        }

        // Create light entity
        this.playcanvasEntity = new pc.Entity(this.name);
        
        // Configure light component
        const lightConfig = {
            type: this.lightType,
            color: new pc.Color(this.color[0], this.color[1], this.color[2]),
            intensity: this.intensity,
            castShadows: this.castShadows,
            shadowBias: this.shadowBias
        };

        // Add type-specific properties
        if (this.lightType === 'directional') {
            lightConfig.shadowDistance = this.shadowDistance;
            lightConfig.shadowResolution = this.shadowResolution;
        } else if (this.lightType === 'point') {
            lightConfig.range = this.range;
        } else if (this.lightType === 'spot') {
            lightConfig.range = this.range;
            lightConfig.innerConeAngle = this.innerConeAngle;
            lightConfig.outerConeAngle = this.outerConeAngle;
        }

        this.playcanvasEntity.addComponent('light', lightConfig);
        this.updatePlayCanvasEntity();
        
        // Add to scene
        window.app.root.addChild(this.playcanvasEntity);

        console.log(`✅ Created Light: ${this.name} (${this.lightType})`);
        return this.playcanvasEntity;
    }

    updateLightProperties(data) {
        if (data.color) this.color = data.color;
        if (data.intensity !== undefined) this.intensity = data.intensity;
        if (data.castShadows !== undefined) this.castShadows = data.castShadows;
        if (data.range !== undefined) this.range = data.range;
        
        // Update PlayCanvas component
        if (this.playcanvasEntity && this.playcanvasEntity.light) {
            if (data.color) {
                this.playcanvasEntity.light.color = new pc.Color(this.color[0], this.color[1], this.color[2]);
            }
            if (data.intensity !== undefined) {
                this.playcanvasEntity.light.intensity = this.intensity;
            }
            if (data.castShadows !== undefined) {
                this.playcanvasEntity.light.castShadows = this.castShadows;
            }
            if (data.range !== undefined && (this.lightType === 'point' || this.lightType === 'spot')) {
                this.playcanvasEntity.light.range = this.range;
            }
        }
    }

    getInfo() {
        return {
            ...super.getInfo(),
            lightType: this.lightType,
            color: this.color,
            intensity: this.intensity,
            castShadows: this.castShadows,
            range: this.range
        };
    }
}

// Camera Entity Class
class VTTLCamera extends VTTLEntity {
    constructor(name, data = {}) {
        super(name, 'camera', data);
        
        // Camera-specific properties
        this.cameraType = data.cameraType || 'perspective';
        this.fov = data.fov || 45;
        this.nearClip = data.nearClip || 0.1;
        this.farClip = data.farClip || 1000;
        this.clearColor = data.clearColor || [0.1, 0.2, 0.3, 1];
        this.target = data.target || [0, 0, 0];
        this.distance = data.distance || 10;
        this.enabled = data.enabled !== undefined ? data.enabled : true;
        
        // Camera control properties
        this.controlType = data.controlType || 'orbit'; // orbit, fly, pan, fixed
        this.mouseControl = data.mouseControl !== undefined ? data.mouseControl : true;
        this.touchControl = data.touchControl !== undefined ? data.touchControl : true;
        this.panSpeed = data.panSpeed || 0.5;
        this.zoomSpeed = data.zoomSpeed || 0.3;
    }

    createPlayCanvasEntity() {
        if (!window.app) {
            console.warn('PlayCanvas app not ready');
            return null;
        }

        // Remove existing entity with same name
        const existing = window.app.root.findByName(this.name);
        if (existing) {
            existing.destroy();
        }

        // Create camera entity
        this.playcanvasEntity = new pc.Entity(this.name);
        
        // Configure camera component
        const cameraConfig = {
            type: this.cameraType,
            fov: this.fov,
            nearClip: this.nearClip,
            farClip: this.farClip,
            clearColor: new pc.Color(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3])
        };

        this.playcanvasEntity.addComponent('camera', cameraConfig);
        this.updatePlayCanvasEntity();
        
        // Add camera controls if specified
        if (this.controlType === 'orbit') {
            this.addOrbitControls();
        } else if (this.controlType === 'fly') {
            this.addFlyControls();
        } else if (this.controlType === 'pan') {
            this.addPanControls();
        }
        
        // Add to scene
        window.app.root.addChild(this.playcanvasEntity);

        console.log(`✅ Created Camera: ${this.name} (${this.cameraType})`);
        return this.playcanvasEntity;
    }

    addOrbitControls() {
        if (this.playcanvasEntity && window.OrbitCamera) {
            // Add orbit camera script if available
            this.playcanvasEntity.addComponent('script');
            this.playcanvasEntity.script.create('orbitCamera', {
                attributes: {
                    distanceMax: 100,
                    distanceMin: 1,
                    pitchAngleMax: 90,
                    pitchAngleMin: -90,
                    inertiaFactor: 0.1
                }
            });
        }
    }

    addFlyControls() {
        if (this.playcanvasEntity && window.FlyCamera) {
            // Add fly camera script if available  
            this.playcanvasEntity.addComponent('script');
            this.playcanvasEntity.script.create('flyCamera');
        }
    }

    addPanControls() {
        if (this.playcanvasEntity && window.app) {
            // Create custom pan controls
            const app = window.app;
            const entity = this.playcanvasEntity;
            
            let isDragging = false;
            let lastX = 0, lastY = 0;
            let currentX = entity.getPosition().x;
            let currentZ = entity.getPosition().z;
            
            const panSpeed = this.panSpeed || 0.5;
            const zoomSpeed = this.zoomSpeed || 0.3;
            
            // Mouse controls
            app.mouse.on(pc.EVENT_MOUSEDOWN, (event) => {
                if (event.button === pc.MOUSEBUTTON_LEFT) {
                    isDragging = true;
                    lastX = event.x;
                    lastY = event.y;
                }
            });
            
            app.mouse.on(pc.EVENT_MOUSEMOVE, (event) => {
                if (isDragging) {
                    const deltaX = (event.x - lastX) * panSpeed * 0.01;
                    const deltaY = (event.y - lastY) * panSpeed * 0.01;
                    
                    currentX -= deltaX;
                    currentZ -= deltaY;
                    
                    entity.setPosition(currentX, entity.getPosition().y, currentZ);
                    
                    lastX = event.x;
                    lastY = event.y;
                }
            });
            
            app.mouse.on(pc.EVENT_MOUSEUP, (event) => {
                if (event.button === pc.MOUSEBUTTON_LEFT) {
                    isDragging = false;
                }
            });
            
            // Mouse wheel zoom
            app.mouse.on(pc.EVENT_MOUSEWHEEL, (event) => {
                const currentY = entity.getPosition().y;
                const newY = Math.max(5, Math.min(30, currentY - event.wheel * zoomSpeed));
                entity.setPosition(entity.getPosition().x, newY, entity.getPosition().z);
            });
            
            console.log('📹 Pan camera controls added');
        }
    }

    lookAt(target) {
        this.target = target;
        if (this.playcanvasEntity) {
            this.playcanvasEntity.lookAt(target[0], target[1], target[2]);
        }
    }

    setActive() {
        if (this.playcanvasEntity && this.playcanvasEntity.camera) {
            // Disable other cameras
            const allCameras = window.app.root.find(entity => entity.camera);
            allCameras.forEach(cam => cam.camera.enabled = false);
            
            // Enable this camera
            this.playcanvasEntity.camera.enabled = true;
            this.enabled = true;
            
            console.log(`📷 Activated camera: ${this.name}`);
        }
    }

    // Camera Vision System Methods
    getCameraInfo() {
        if (!this.playcanvasEntity) return null;
        
        const pos = this.playcanvasEntity.getPosition();
        const forward = this.playcanvasEntity.forward.clone();
        const right = this.playcanvasEntity.right.clone();
        const up = this.playcanvasEntity.up.clone();
        
        return {
            position: [pos.x, pos.y, pos.z],
            forward: [forward.x, forward.y, forward.z],
            right: [right.x, right.y, right.z],
            up: [up.x, up.y, up.z],
            fov: this.fov,
            nearClip: this.nearClip,
            farClip: this.farClip
        };
    }

    isObjectInView(objectPosition, objectRadius = 0.5) {
        if (!this.playcanvasEntity) return false;
        
        const camPos = this.playcanvasEntity.getPosition();
        const forward = this.playcanvasEntity.forward.clone().normalize();
        
        // Vector from camera to object
        const toObject = new pc.Vec3(
            objectPosition[0] - camPos.x,
            objectPosition[1] - camPos.y, 
            objectPosition[2] - camPos.z
        );
        
        // Distance to object
        const distance = toObject.length();
        
        // Check if within camera range
        if (distance < this.nearClip || distance > this.farClip) {
            return false;
        }
        
        // Check if in front of camera
        const dot = toObject.dot(forward);
        if (dot < 0) return false;
        
        // Check if within FOV cone
        const angle = Math.acos(dot / distance);
        const fovRadians = this.fov * Math.PI / 180;
        
        return angle <= (fovRadians / 2) + (objectRadius / distance);
    }

    getDistanceToObject(objectPosition) {
        if (!this.playcanvasEntity) return null;
        
        const camPos = this.playcanvasEntity.getPosition();
        const dx = objectPosition[0] - camPos.x;
        const dy = objectPosition[1] - camPos.y;
        const dz = objectPosition[2] - camPos.z;
        
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    getAngleToObject(objectPosition) {
        if (!this.playcanvasEntity) return null;
        
        const camPos = this.playcanvasEntity.getPosition();
        const forward = this.playcanvasEntity.forward.clone().normalize();
        
        const toObject = new pc.Vec3(
            objectPosition[0] - camPos.x,
            objectPosition[1] - camPos.y,
            objectPosition[2] - camPos.z
        ).normalize();
        
        const dot = forward.dot(toObject);
        return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
    }

    getObjectsInView() {
        const results = [];
        
        // Check all entities with render components
        if (window.app && window.app.root) {
            const entities = window.app.root.find(entity => entity.render && entity.enabled);
            
            entities.forEach(entity => {
                const pos = entity.getPosition();
                const position = [pos.x, pos.y, pos.z];
                const distance = this.getDistanceToObject(position);
                const angle = this.getAngleToObject(position);
                const inView = this.isObjectInView(position);
                
                if (inView) {
                    results.push({
                        name: entity.name,
                        position: position,
                        distance: distance ? distance.toFixed(2) : 'N/A',
                        angle: angle ? angle.toFixed(1) : 'N/A',
                        inView: inView
                    });
                }
            });
        }
        
        return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    applyCameraEffect(effectType, params = {}) {
        if (!this.playcanvasEntity) return false;
        
        switch(effectType) {
            case 'focus_on_object':
                this.focusOnObject(params.position, params.distance || 10);
                break;
                
            case 'zoom_effect':
                this.zoomEffect(params.targetFov || 30, params.duration || 2000);
                break;
                
            case 'shake_effect':
                this.shakeEffect(params.intensity || 0.5, params.duration || 1000);
                break;
                
            case 'orbit_object':
                this.orbitObject(params.position, params.radius || 8, params.speed || 1);
                break;
                
            case 'dolly_zoom':
                this.dollyZoom(params.targetPosition, params.duration || 3000);
                break;
        }
        
        return true;
    }

    focusOnObject(targetPos, distance = 10) {
        if (!this.playcanvasEntity) return;
        
        // Calculate position behind target
        const offset = new pc.Vec3(distance * 0.7, distance * 0.5, distance * 0.7);
        const newPos = new pc.Vec3(targetPos[0], targetPos[1], targetPos[2]).add(offset);
        
        this.playcanvasEntity.setPosition(newPos);
        this.playcanvasEntity.lookAt(targetPos[0], targetPos[1], targetPos[2]);
        
        console.log(`📹 Camera focused on object at [${targetPos}]`);
    }

    zoomEffect(targetFov, duration) {
        if (!this.playcanvasEntity) return;
        
        const startFov = this.fov;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentFov = startFov + (targetFov - startFov) * progress;
            this.fov = currentFov;
            this.playcanvasEntity.camera.fov = currentFov;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        console.log(`🔍 Zoom effect: ${startFov}° → ${targetFov}°`);
    }

    shakeEffect(intensity, duration) {
        if (!this.playcanvasEntity) return;
        
        const originalPos = this.playcanvasEntity.getPosition().clone();
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const shakeX = (Math.random() - 0.5) * intensity * (1 - progress);
                const shakeY = (Math.random() - 0.5) * intensity * (1 - progress);
                const shakeZ = (Math.random() - 0.5) * intensity * (1 - progress);
                
                this.playcanvasEntity.setPosition(
                    originalPos.x + shakeX,
                    originalPos.y + shakeY,
                    originalPos.z + shakeZ
                );
                
                requestAnimationFrame(shake);
            } else {
                this.playcanvasEntity.setPosition(originalPos);
            }
        };
        
        shake();
        console.log(`📳 Camera shake effect applied`);
    }

    orbitObject(targetPos, radius = 8, speed = 1) {
        if (!this.playcanvasEntity) return;
        
        const startTime = Date.now();
        const duration = 5000; // 5 seconds for full orbit
        
        const orbit = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed / duration) * speed;
            
            if (progress < 1) {
                const angle = progress * 2 * Math.PI;
                const x = targetPos[0] + Math.cos(angle) * radius;
                const z = targetPos[2] + Math.sin(angle) * radius;
                const y = targetPos[1] + radius * 0.3; // Slight elevation
                
                this.playcanvasEntity.setPosition(x, y, z);
                this.playcanvasEntity.lookAt(targetPos[0], targetPos[1], targetPos[2]);
                
                requestAnimationFrame(orbit);
            }
        };
        
        orbit();
        console.log(`🌍 Orbiting object at [${targetPos}] with radius ${radius}`);
    }

    dollyZoom(targetPosition, duration) {
        if (!this.playcanvasEntity) return;
        
        const startPos = this.playcanvasEntity.getPosition().clone();
        const startFov = this.fov;
        const targetFov = startFov * 1.5; // Increase FOV while moving closer
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Move camera closer to target
            const currentPos = new pc.Vec3().lerp(startPos, 
                new pc.Vec3(targetPosition[0], targetPosition[1], targetPosition[2]), 
                progress * 0.3);
            
            // Adjust FOV to maintain object size
            const currentFov = startFov + (targetFov - startFov) * progress;
            
            this.playcanvasEntity.setPosition(currentPos);
            this.fov = currentFov;
            this.playcanvasEntity.camera.fov = currentFov;
            this.playcanvasEntity.lookAt(targetPosition[0], targetPosition[1], targetPosition[2]);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        console.log(`📽️ Dolly zoom effect to [${targetPosition}]`);
    }

    getInfo() {
        return {
            ...super.getInfo(),
            cameraType: this.cameraType,
            fov: this.fov,
            nearClip: this.nearClip,
            farClip: this.farClip,
            target: this.target,
            enabled: this.enabled,
            controlType: this.controlType
        };
    }
}

// Model Entity Class
class VTTLModel extends VTTLEntity {
    constructor(name, data = {}) {
        super(name, 'model', data);
        
        // Model-specific properties
        this.modelType = data.modelType || data.template || 'cube';
        this.material = data.material || null;
        this.texture = data.texture || null;
        this.color = data.color || [1, 1, 1];
        this.opacity = data.opacity !== undefined ? data.opacity : 1.0;
        this.castShadows = data.castShadows !== undefined ? data.castShadows : true;
        this.receiveShadows = data.receiveShadows !== undefined ? data.receiveShadows : true;
        
        // Animation properties
        this.animations = data.animations || [];
        this.currentAnimation = data.currentAnimation || null;
        this.animationSpeed = data.animationSpeed || 1.0;
        
        // Physics properties
        this.physics = data.physics || null; // 'static', 'dynamic', 'kinematic'
        this.collisionType = data.collisionType || 'box'; // 'box', 'sphere', 'mesh'
    }

    createPlayCanvasEntity() {
        if (!window.app) {
            console.warn('PlayCanvas app not ready');
            return null;
        }

        // Remove existing entity with same name
        const existing = window.app.root.findByName(this.name);
        if (existing) {
            existing.destroy();
        }

        // Create model entity
        this.playcanvasEntity = new pc.Entity(this.name);
        
        // Add render component based on model type
        this.createRenderComponent();
        
        // Add collision component if physics enabled
        if (this.physics) {
            this.createCollisionComponent();
        }
        
        this.updatePlayCanvasEntity();
        
        // Add to scene
        window.app.root.addChild(this.playcanvasEntity);

        console.log(`✅ Created Model: ${this.name} (${this.modelType})`);
        return this.playcanvasEntity;
    }

    createRenderComponent() {
        if (!window.app) {
            console.warn('PlayCanvas app not ready, cannot create render component');
            return;
        }

        // Check if this is a .glb model
        if (this.modelType.endsWith('.glb') || this.modelType.includes('/')) {
            this.loadGLBModel(this.modelType);
            return;
        }

        // Map model types to PlayCanvas primitive types
        let primitiveType;
        switch (this.modelType) {
            case 'cube':
            case 'box':
                primitiveType = 'box';
                break;
            case 'sphere':
                primitiveType = 'sphere';
                break;
            case 'plane':
                primitiveType = 'plane';
                break;
            case 'cylinder':
                primitiveType = 'cylinder';
                break;
            case 'cone':
                primitiveType = 'cone';
                break;
            default:
                primitiveType = 'box'; // fallback
        }

        // Add render component with primitive type (simpler and more reliable)
        this.playcanvasEntity.addComponent('render', {
            type: primitiveType,
            castShadows: this.castShadows,
            receiveShadows: this.receiveShadows
        });

        // Create and apply material after component is added
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(this.color[0], this.color[1], this.color[2]);
        material.opacity = this.opacity;
        material.metalness = 0.1;
        material.gloss = 0.6;
        
        if (this.opacity < 1.0) {
            material.blendType = pc.BLEND_NORMAL;
        }
        
        material.update();

        // Apply material to the render component
        this.playcanvasEntity.render.material = material;
    }

    loadGLBModel(modelPath) {
        console.log(`🔄 Loading GLB model: ${modelPath}`);
        
        // Construct the full URL for the GLB file - use same origin as the frontend
        const baseUrl = window.location.origin;
        const glbUrl = modelPath.startsWith('http') ? modelPath : `${baseUrl}/files/3dmodels/${modelPath}`;
        
        console.log(`🌐 GLB URL: ${glbUrl}`);
        
        // Test if the URL is accessible first
        fetch(glbUrl, { method: 'HEAD' })
            .then(response => {
                console.log(`📊 GLB file response: ${response.status} ${response.statusText}`);
                console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Now try to load the asset
                return this.loadGLBAsset(glbUrl, modelPath);
            })
            .catch(err => {
                console.error(`❌ Failed to access GLB file ${modelPath}:`, err);
                console.warn('⚠️ GLB model loading failed - no fallback primitive will be created');
            });
    }
    
    loadGLBAsset(glbUrl, modelPath) {
        console.log(`📦 Loading GLB asset from: ${glbUrl} (using proper container asset method)`);
        
        // Create proper container asset like the working model viewer
        const containerAsset = new pc.Asset(modelPath, 'container', {
            url: glbUrl
        });
        
        containerAsset.on('load', () => {
            console.log(`✅ GLB container asset loaded: ${modelPath}`);
            
            try {
                const resource = containerAsset.resource;
                console.log(`📊 Container resource:`, {
                    renders: resource.renders ? resource.renders.length : 0,
                    animations: resource.animations ? resource.animations.length : 0,
                    instantiateRenderEntity: !!resource.instantiateRenderEntity
                });
                
                // Use the proper method from working model viewer
                if (resource.instantiateRenderEntity) {
                    // Replace our primitive entity with the instantiated GLB entity
                    const glbEntity = resource.instantiateRenderEntity();
                    
                    if (glbEntity) {
                        // Remove our placeholder entity
                        if (this.playcanvasEntity.parent) {
                            this.playcanvasEntity.parent.removeChild(this.playcanvasEntity);
                        }
                        
                        // Use the GLB entity as our main entity
                        this.playcanvasEntity = glbEntity;
                        this.playcanvasEntity.name = this.name;
                        
                        // Set position, rotation, scale
                        this.playcanvasEntity.setPosition(this.position[0], this.position[1], this.position[2]);
                        this.playcanvasEntity.setEulerAngles(this.rotation[0], this.rotation[1], this.rotation[2]);
                        this.playcanvasEntity.setLocalScale(this.scale[0], this.scale[1], this.scale[2]);
                        
                        // Add to scene
                        window.app.root.addChild(this.playcanvasEntity);
                        
                        console.log(`✅ GLB entity instantiated and added to scene`);
                        
                        // Apply any color tinting if specified
                        if (this.color && (this.color[0] !== 1 || this.color[1] !== 1 || this.color[2] !== 1)) {
                            this.applyColorTint();
                        }
                        
                        // Force a render update
                        if (window.app) {
                            window.app.render();
                            console.log(`🖼️ Forced render update for GLB model`);
                        }
                        
                        return;
                    }
                }
                
                throw new Error('instantiateRenderEntity failed or not available');
                
            } catch (e) {
                console.error(`❌ GLB instantiation failed:`, e);
                console.warn('⚠️ GLB instantiation failed - no fallback primitive will be created');
            }
        });
        
        containerAsset.on('error', (err) => {
            console.error(`❌ GLB container asset loading failed:`, err);
            console.warn('⚠️ GLB container asset loading failed - no fallback primitive will be created');
        });
        
        // Add to asset registry and load (like working model viewer)
        window.app.assets.add(containerAsset);
        window.app.assets.load(containerAsset);
    }
    
    // Fallback primitive creation removed - GLB models should load properly or not at all
    
    applyColorTint() {
        // Apply color tinting to GLB model materials
        if (this.playcanvasEntity && this.playcanvasEntity.model) {
            const meshInstances = this.playcanvasEntity.model.meshInstances;
            const tintColor = new pc.Color(this.color[0], this.color[1], this.color[2]);
            
            meshInstances.forEach(meshInstance => {
                if (meshInstance.material) {
                    // Create a copy of the material to avoid modifying the original
                    const material = meshInstance.material.clone();
                    material.diffuse.mul(tintColor);
                    material.update();
                    meshInstance.material = material;
                }
            });
            
            console.log(`Applied color tint [${this.color}] to GLB model`);
        }
    }

    createCollisionComponent() {
        let collisionType;
        
        switch (this.collisionType) {
            case 'sphere':
                collisionType = 'sphere';
                break;
            case 'mesh':
                collisionType = 'mesh';
                break;
            default:
                collisionType = 'box';
        }

        this.playcanvasEntity.addComponent('collision', {
            type: collisionType
        });

        if (this.physics !== 'static') {
            this.playcanvasEntity.addComponent('rigidbody', {
                type: this.physics,
                mass: this.physics === 'dynamic' ? 1 : 0
            });
        }
    }

    updateMaterial(materialData) {
        if (materialData.color) this.color = materialData.color;
        if (materialData.opacity !== undefined) this.opacity = materialData.opacity;
        
        // Update PlayCanvas material
        if (this.playcanvasEntity && this.playcanvasEntity.render) {
            const meshInstance = this.playcanvasEntity.render.meshInstances[0];
            if (meshInstance && meshInstance.material) {
                if (materialData.color) {
                    meshInstance.material.diffuse = new pc.Color(this.color[0], this.color[1], this.color[2]);
                }
                if (materialData.opacity !== undefined) {
                    meshInstance.material.opacity = this.opacity;
                    if (this.opacity < 1.0) {
                        meshInstance.material.blendType = pc.BLEND_NORMAL;
                    } else {
                        meshInstance.material.blendType = pc.BLEND_NONE;
                    }
                }
                meshInstance.material.update();
            }
        }
    }

    playAnimation(animationName, speed = 1.0) {
        this.currentAnimation = animationName;
        this.animationSpeed = speed;
        
        // Implementation depends on animation system
        console.log(`Playing animation: ${animationName} at speed ${speed}`);
    }

    getInfo() {
        return {
            ...super.getInfo(),
            modelType: this.modelType,
            material: this.material,
            color: this.color,
            opacity: this.opacity,
            castShadows: this.castShadows,
            receiveShadows: this.receiveShadows,
            physics: this.physics,
            collisionType: this.collisionType
        };
    }
}

// Entity Manager Class
class VTTLEntityManager {
    constructor() {
        this.entities = new Map();
        this.lights = new Map();
        this.cameras = new Map();
        this.models = new Map();
        this.app = null;
    }

    setApp(app) {
        this.app = app;
        console.log('VTTLEntityManager: PlayCanvas app set');
    }

    createEntity(name, type, data) {
        let entity;
        
        switch (type) {
            case 'light':
                entity = new VTTLLight(name, data);
                this.lights.set(name, entity);
                break;
            case 'camera':
                entity = new VTTLCamera(name, data);
                this.cameras.set(name, entity);
                break;
            case 'model':
                entity = new VTTLModel(name, data);
                this.models.set(name, entity);
                break;
            default:
                console.warn(`Unknown entity type: ${type}`);
                return null;
        }
        
        this.entities.set(name, entity);
        entity.createPlayCanvasEntity();
        
        return entity;
    }

    getEntity(name) {
        return this.entities.get(name);
    }

    getLight(name) {
        return this.lights.get(name);
    }

    getCamera(name) {
        return this.cameras.get(name);
    }

    getModel(name) {
        return this.models.get(name);
    }

    updateEntity(name, data) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.updateFromData(data);
        }
    }

    deleteEntity(name) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.destroy();
            this.entities.delete(name);
            this.lights.delete(name);
            this.cameras.delete(name);
            this.models.delete(name);
        }
    }

    getAllEntities() {
        return Array.from(this.entities.values());
    }

    getAllLights() {
        return Array.from(this.lights.values());
    }

    getAllCameras() {
        return Array.from(this.cameras.values());
    }

    getAllModels() {
        return Array.from(this.models.values());
    }

    syncEntities(serverEntities) {
        console.log('VTTLEntityManager: Syncing entities from server', Object.keys(serverEntities).length, 'entities');
        
        // Store previous state for comparison
        if (!this.previousState) {
            this.previousState = {};
        }
        
        // Compare old vs new state and animate changes
        Object.values(serverEntities).forEach(serverEntity => {
            const name = serverEntity.name;
            const oldEntity = this.previousState[name];
            
            if (!this.entities.has(name)) {
                // Create new entity - check if it's a GLB model first
                if (serverEntity.template && (serverEntity.template.endsWith('.glb') || serverEntity.template.includes('/'))) {
                    console.log(`🎮 Creating GLB model entity: ${name}`);
                    this.createGLBModelEntity(serverEntity);
                } else if (serverEntity.template && !['light', 'camera', 'model'].includes(serverEntity.type)) {
                    console.log(`🔷 Creating primitive entity: ${name}`);
                    this.createBasicEntity(serverEntity);
                }
            } else if (oldEntity) {
                // Compare old vs new state for changes
                const hasPositionChanged = this.hasChanged(oldEntity.position, serverEntity.position);
                const hasRotationChanged = this.hasChanged(oldEntity.rotation, serverEntity.rotation);
                const hasScaleChanged = this.hasChanged(oldEntity.scale, serverEntity.scale);
                
                if (hasPositionChanged || hasRotationChanged || hasScaleChanged) {
                    console.log(`Detected changes in ${name}:`, {
                        position: hasPositionChanged,
                        rotation: hasRotationChanged, 
                        scale: hasScaleChanged
                    });
                    
                    // Animate the changes
                    const shouldAnimate = serverEntity.lastMove?.animate !== false || serverEntity.lastRotate?.animate !== false;
                    this.animateEntityChanges(name, oldEntity, serverEntity, shouldAnimate);
                }
            }
        });
        
        // Remove entities that no longer exist on server
        this.entities.forEach((_, name) => {
            if (!serverEntities[name]) {
                if (!this.lights.has(name) && !this.cameras.has(name) && !this.models.has(name)) {
                    console.log(`Removing entity: ${name}`);
                    this.deleteEntity(name);
                }
            }
        });
        
        // Update previous state for next comparison
        this.previousState = JSON.parse(JSON.stringify(serverEntities));
        
        // Force a render after all entity updates
        if (window.app) {
            window.app.render();
        }
    }

    createBasicEntity(entityData) {
        // Create a basic model entity for simple server entities
        // Extract color from entity properties if available
        const entityColor = entityData.properties?.color || [0.7, 0.7, 0.7];
        
        // Determine the model type - check if it's a GLB file first
        let modelType;
        
        if (entityData.template && (entityData.template.endsWith('.glb') || entityData.template.includes('/'))) {
            // This is a GLB model path
            modelType = entityData.template;
            console.log(`🎮 Detected GLB model: ${modelType}`);
        } else {
            // This is a primitive type
            modelType = entityData.template === 'cube' ? 'cube' : 
                       entityData.template === 'sphere' ? 'sphere' : 
                       entityData.template === 'plane' ? 'plane' : 
                       entityData.template === 'cylinder' ? 'cylinder' : 'cube';
            console.log(`🔷 Detected primitive type: ${modelType}`);
        }
        
        const modelEntity = new VTTLModel(entityData.name, {
            modelType: modelType,
            position: entityData.position || [0, 0, 0],
            rotation: entityData.rotation || [0, 0, 0],
            scale: entityData.scale || [1, 1, 1],
            color: entityColor,
            properties: entityData.properties || {}
        });
        
        this.entities.set(entityData.name, modelEntity);
        this.models.set(entityData.name, modelEntity);
        modelEntity.createPlayCanvasEntity();
        
        console.log(`✅ Created entity: ${entityData.name} (${modelType}) with color:`, entityColor);
    }
    
    createGLBModelEntity(entityData) {
        // Create a GLB model entity using the VTTLEntityManager's model system
        console.log(`🎮 Creating GLB model entity: ${entityData.name} from ${entityData.template}`);
        
        const entityColor = entityData.properties?.color || [1, 1, 1]; // Default white for GLB models
        
        // Create VTTLModel with GLB path as modelType
        const modelEntity = new VTTLModel(entityData.name, {
            modelType: entityData.template, // This is the GLB path
            position: entityData.position || [0, 0, 0],
            rotation: entityData.rotation || [0, 0, 0],
            scale: entityData.scale || [1, 1, 1],
            color: entityColor,
            properties: entityData.properties || {}
        });
        
        this.entities.set(entityData.name, modelEntity);
        this.models.set(entityData.name, modelEntity);
        
        // Create the PlayCanvas entity - this will trigger GLB loading
        modelEntity.createPlayCanvasEntity();
        
        console.log(`✅ GLB model entity created: ${entityData.name} -> ${entityData.template}`);
    }

    updateEntity(name, data) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.updateFromData(data);
            console.log(`Updated entity: ${name}`);
        } else {
            console.warn(`Entity not found for update: ${name}`);
        }
    }

    hasChanged(oldValue, newValue, threshold = 0.001) {
        if (!oldValue || !newValue) return true;
        if (oldValue.length !== newValue.length) return true;
        
        for (let i = 0; i < oldValue.length; i++) {
            if (Math.abs(oldValue[i] - newValue[i]) > threshold) {
                return true;
            }
        }
        return false;
    }

    animateEntityChanges(name, oldEntity, newEntity, animate = true) {
        const entity = this.entities.get(name);
        if (!entity || !entity.playcanvasEntity) {
            console.warn(`Entity not found for animation: ${name}`);
            return;
        }

        const pcEntity = entity.playcanvasEntity;
        
        if (animate) {
            // Animate all changes smoothly
            const duration = 500; // ms
            this.animateEntityTransform(pcEntity, oldEntity, newEntity, duration);
        } else {
            // Apply changes instantly
            if (newEntity.position) {
                pcEntity.setPosition(newEntity.position[0], newEntity.position[1], newEntity.position[2]);
            }
            if (newEntity.rotation) {
                pcEntity.setEulerAngles(newEntity.rotation[0], newEntity.rotation[1], newEntity.rotation[2]);
            }
            if (newEntity.scale) {
                pcEntity.setLocalScale(newEntity.scale[0], newEntity.scale[1], newEntity.scale[2]);
            }
            
            // Force render after instant changes
            if (window.app) {
                window.app.render();
            }
        }
        
        // Update entity data
        if (entity.data) {
            entity.data.position = newEntity.position;
            entity.data.rotation = newEntity.rotation;
            entity.data.scale = newEntity.scale;
        }
    }

    animateEntityTransform(pcEntity, fromState, toState, duration = 500) {
        const startTime = Date.now();
        
        // Get starting values
        const fromPos = fromState.position || [0, 0, 0];
        const fromRot = fromState.rotation || [0, 0, 0];
        const fromScale = fromState.scale || [1, 1, 1];
        
        const toPos = toState.position || fromPos;
        const toRot = toState.rotation || fromRot;
        const toScale = toState.scale || fromScale;
        
        console.log(`Animating entity transform over ${duration}ms:`, {
            position: `[${fromPos}] → [${toPos}]`,
            rotation: `[${fromRot}] → [${toRot}]`,
            scale: `[${fromScale}] → [${toScale}]`
        });
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function (ease-out cubic)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            const currentPos = [
                fromPos[0] + (toPos[0] - fromPos[0]) * easedProgress,
                fromPos[1] + (toPos[1] - fromPos[1]) * easedProgress,
                fromPos[2] + (toPos[2] - fromPos[2]) * easedProgress
            ];
            
            // Interpolate rotation
            const currentRot = [
                fromRot[0] + (toRot[0] - fromRot[0]) * easedProgress,
                fromRot[1] + (toRot[1] - fromRot[1]) * easedProgress,
                fromRot[2] + (toRot[2] - fromRot[2]) * easedProgress
            ];
            
            // Interpolate scale
            const currentScale = [
                fromScale[0] + (toScale[0] - fromScale[0]) * easedProgress,
                fromScale[1] + (toScale[1] - fromScale[1]) * easedProgress,
                fromScale[2] + (toScale[2] - fromScale[2]) * easedProgress
            ];
            
            // Apply to PlayCanvas entity
            pcEntity.setPosition(currentPos[0], currentPos[1], currentPos[2]);
            pcEntity.setEulerAngles(currentRot[0], currentRot[1], currentRot[2]);
            pcEntity.setLocalScale(currentScale[0], currentScale[1], currentScale[2]);
            
            // Force PlayCanvas to render the frame
            if (window.app) {
                window.app.renderNextFrame = true;
                // Alternative: force immediate render
                // window.app.render();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                console.log(`Animation complete for entity`);
                // Final render after animation completes
                if (window.app) {
                    window.app.render();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }


    deleteEntity(name) {
        const entity = this.entities.get(name);
        if (entity) {
            // Remove from PlayCanvas scene
            if (entity.playcanvasEntity && entity.playcanvasEntity.parent) {
                entity.playcanvasEntity.parent.removeChild(entity.playcanvasEntity);
            }
            
            // Remove from all collections
            this.entities.delete(name);
            this.lights.delete(name);
            this.cameras.delete(name);
            this.models.delete(name);
            
            console.log(`Deleted entity: ${name}`);
        } else {
            console.warn(`Entity not found for deletion: ${name}`);
        }
    }

    getEntityInfo() {
        return {
            total: this.entities.size,
            lights: this.lights.size,
            cameras: this.cameras.size,
            models: this.models.size,
            entities: Array.from(this.entities.values()).map(e => e.getInfo())
        };
    }
}

// Export for global access
window.VTTLEntity = VTTLEntity;
window.VTTLLight = VTTLLight;
window.VTTLCamera = VTTLCamera;
window.VTTLModel = VTTLModel;
window.VTTLEntityManager = VTTLEntityManager;