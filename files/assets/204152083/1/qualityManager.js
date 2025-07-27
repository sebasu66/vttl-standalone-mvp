var QualityManager = pc.createScript('qualityManager');


// ===== ATTRIBUTES BLOCK =====
QualityManager.attributes.add('highCamera', {
    type: 'entity',
    title: 'High Quality Camera'
});

QualityManager.attributes.add('lowCamera', {
    type: 'entity',
    title: 'Low Quality Camera'
});

QualityManager.attributes.add('highLight', {
    type: 'entity',
    title: 'High Quality Light'
});

QualityManager.attributes.add('lowLight', {
    type: 'entity',
    title: 'Low Quality Light'
});

QualityManager.attributes.add('movementThreshold', {
    type: 'number',
    default: 0.01,
    title: 'Movement Threshold'
});

QualityManager.attributes.add('lowQualityStyle', {
    type: 'string',
    enum: [
        { 'Ghost': 'ghost' },
        { 'Wireframe': 'wireframe' },
        { 'Pixelated': 'pixelated' }
    ],
    default: 'ghost',
    title: 'Low Quality Style'
});

// ===== INITIALIZATION BLOCK =====
QualityManager.prototype.initialize = function() {
    console.log('[QualityManager] Initializing...');
    
    // Validate required components
    if (!this.highCamera || !this.lowCamera) {
        console.error('[QualityManager] High or Low camera not assigned!');
        return;
    }

    // Setup basic properties
    this.isHighQuality = true;
    this.isTransitioning = false;
    //this.lastCameraPosition = new pc.Vec3();
    //this.lastCameraRotation = new pc.Quat();
    this.timer = 0;
    //this.movementDetected = false;
    //this.originalMaterials = new Map();
    
    // Store initial camera state
    //this.lastCameraPosition.copy(this.highCamera.getPosition());
    //this.lastCameraRotation.copy(this.highCamera.getRotation());

    // Initial setup
    this.setupCameras();
//    this.setupMaterials();
    
    // Start in high quality with manual rendering
//    this.app.autoRender = false;
    this.switchToHighQuality();
    
    // Begin movement detection
    //this.app.on('update', this.checkMovement, this);
    pc.app.qm = this;
};

// ===== CAMERA SETUP BLOCK =====
QualityManager.prototype.setupCameras = function() {
    console.log('[QualityManager] Setting up cameras...');
    
    if (this.highCamera && this.highCamera.camera) {
        //this.highCamera.camera.clearColor = new pc.Color(0.1, 0.1, 0.1, 1);
        this.highCamera.camera.enabled = true;
    }
    
    if (this.lowCamera && this.lowCamera.camera) {
        //this.lowCamera.camera.clearColor = new pc.Color(0.1, 0.1, 0.1, 1);
        this.lowCamera.camera.enabled = false;
    }
    
    if (this.highLight) this.highLight.enabled = true;
    if (this.lowLight) this.lowLight.enabled = false;
};
/*
// ===== MATERIALS BLOCK =====
QualityManager.prototype.createGhostMaterial = function() {
    var material = new pc.StandardMaterial();
    material.blendType = pc.BLEND_NORMAL;
    material.opacity = 0.5;
    material.depthWrite = false;
    material.cull = pc.CULLFACE_NONE;
    material.useMetalness = false;
    material.useGlossiness = false;
    material.diffuse = new pc.Color(1, 1, 1, 0.5);
    material.ambient = new pc.Color(0.5, 0.5, 0.5);
    material.update();
    return material;
};

QualityManager.prototype.createWireframeMaterial = function() {
    var material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.5, 0.5);
    material.ambient = new pc.Color(0.5, 0.5, 0.5);
    material.useMetalness = false;
    material.useGlossiness = false;
    
    if (this.app.graphicsDevice.supportsWireframe) {
        material.wireframe = true;
    }
    
    material.update();
    return material;
};

QualityManager.prototype.createPixelatedMaterial = function() {
    var material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.5, 0.5);
    material.ambient = new pc.Color(0.5, 0.5, 0.5);
    material.useMetalness = false;
    material.useGlossiness = false;
    material.update();
    return material;
};

// ===== MATERIAL MANAGEMENT BLOCK =====
QualityManager.prototype.setupMaterials = function() {
    console.log('[QualityManager] Setting up materials...');
    try {
        this.materials = {
            ghost: this.createGhostMaterial(),
            wireframe: this.createWireframeMaterial(),
            pixelated: this.createPixelatedMaterial()
        };

        // Store original materials
        var renders = this.app.root.findComponents('render');
        renders.forEach(render => {
            if (render.meshInstances) {
                render.meshInstances.forEach(meshInstance => {
                    if (meshInstance && meshInstance.material) {
                        this.originalMaterials.set(meshInstance, meshInstance.material);
                    }
                });
            }
        });
    } catch (e) {
        console.error('[QualityManager] Error setting up materials:', e);
    }
};

QualityManager.prototype.applyMaterial = function(material) {
    if (!material) return;
    
    try {
        var renders = this.app.root.findComponents('render');
        renders.forEach(render => {
            if (render.meshInstances) {
                render.meshInstances.forEach(meshInstance => {
                    if (meshInstance) {
                        meshInstance.material = material;
                    }
                });
            }
        });
    } catch (e) {
        console.error('[QualityManager] Error applying material:', e);
    }
};

QualityManager.prototype.restoreOriginalMaterials = function() {
    try {
        this.originalMaterials.forEach((material, meshInstance) => {
            if (meshInstance) {
                meshInstance.material = material;
            }
        });
    } catch (e) {
        console.error('[QualityManager] Error restoring materials:', e);
    }
};
*/


QualityManager.prototype.switchToDotStyle = function(dot) {
    console.log('[QualityManager] Switching all meshes to dot style: ' + dot);
    var renders = this.app.root.findComponents('render');
    renders.forEach(render => {
        if (render.meshInstances) {
            render.meshInstances.forEach(meshInstance => {
  //              meshInstance.renderStyle = dot ? pc.RENDERSTYLE_POINTS : pc.RENDERSTYLE_SOLID;
            });
        }
    });
};

// ===== QUALITY SWITCHING BLOCK =====
QualityManager.prototype.switchToHighQuality = function() {
    //if (this.isTransitioning) return;
    console.log('[QualityManager] Switching to high quality - Manual Render Mode');
    
    this.isTransitioning = true;
    this.isHighQuality = true;
    
    // Turn off auto-render
    //this.app.autoRender = false;
    
    // Setup high quality scene
    if (this.highCamera) this.highCamera.camera.enabled = true;
    if (this.highLight) this.highLight.enabled = true;
    if (this.lowCamera) this.lowCamera.camera.enabled = false;
    if (this.lowLight) this.lowLight.enabled = false;
    
    this.switchToDotStyle(false);
    // Restore materials
    //this.restoreOriginalMaterials();
    
    // Render one high quality frame after a short delay
    /*setTimeout(() => {
        this.app.renderNextFrame = true;
        this.isTransitioning = false;
        console.log('[QualityManager] High quality render complete');
    }, 32);*/
};

QualityManager.prototype.switchToLowQuality = function() {
    //if (this.isTransitioning) return;
    console.log('[QualityManager] Switching to low quality - Auto Render Mode');
    
    this.isTransitioning = true;
    this.isHighQuality = false;
    
    // Setup low quality scene
    if (this.lowCamera) this.lowCamera.camera.enabled = true;
    if (this.lowLight) this.lowLight.enabled = true;
    if (this.highCamera) this.highCamera.camera.enabled = false;
    if (this.highLight) this.highLight.enabled = false;
    
    // Apply low quality materials
    //this.applyMaterial(this.materials[this.lowQualityStyle]);
    this.switchToDotStyle(true);
    // Enable auto-render for continuous updates
    //this.app.autoRender = true;
    
    this.isTransitioning = false;
};
/*
// ===== MOVEMENT DETECTION BLOCK =====
QualityManager.prototype.checkMovement = function(dt) {
    if (this.highCamera.enabled) return;
    
    var currentPos = this.highCamera.getPosition();
    var currentRot = this.highCamera.getRotation();
    
    // Calculate movement deltas
    var positionDelta = currentPos.clone().sub(this.lastCameraPosition).length();
    var rotDot = currentRot.w * this.lastCameraRotation.w + 
                 currentRot.x * this.lastCameraRotation.x + 
                 currentRot.y * this.lastCameraRotation.y + 
                 currentRot.z * this.lastCameraRotation.z;
    rotDot = Math.min(Math.max(rotDot, -1), 1);
    var rotationDelta = Math.acos(Math.abs(rotDot)) * 2;
    
    // Check for movement
    if (positionDelta > this.movementThreshold || rotationDelta > this.movementThreshold) {
        if (!this.movementDetected) {
            this.movementDetected = true;
            this.timer = 0;
            
            if (this.isHighQuality) {
                this.switchToLowQuality();
            }
        }
    } else if (this.movementDetected) {
        this.timer += dt;
        
        if (this.timer > 0.5) { // Wait for 500ms of no movement
            this.movementDetected = false;
            if (!this.isHighQuality) {
                this.switchToHighQuality();
            }
        }
    }
    
    // Store current state for next frame
    this.lastCameraPosition.copy(currentPos);
    this.lastCameraRotation.copy(currentRot);
};
*/
// ===== CLEANUP BLOCK =====
QualityManager.prototype.destroy = function() {
  //  this.app.off('update', this.checkMovement, this);
    // Ensure auto-render is restored on script destruction
    //this.app.autoRender = true;
};

QualityManager.prototype.debugCameraStatus = function() {
    // Helper function to get camera direction to center
    const isCameraPointingToCenter = (camera) => {
        if (!camera || !camera.camera) return 'Camera not found';
        
        // Get camera's forward vector
        const forward = camera.forward;
        
        // Calculate vector from camera to world center (0,0,0)
        const toCenter = new pc.Vec3(0, 0, 0).sub(camera.getPosition()).normalize();
        
        // Dot product: 1 = pointing exactly at center, -1 = pointing opposite
        const dot = forward.dot(toCenter);
        
        return {
            dot: dot.toFixed(3),
            isPointingToCenter: dot > 0.7 ? 'Yes' : 'No' // 0.7 is roughly 45 degrees
        };
    };

    // Get detailed camera info
    const getCameraInfo = (camera, name) => {
        if (!camera) return `${name}: Not assigned`;
        
        const pos = camera.getPosition();
        const rot = camera.getRotation();
        const centerInfo = isCameraPointingToCenter(camera);
        
        return {
            name: name,
            enabled: camera.enabled ? 'Yes' : 'No',
            position: `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`,
            rotation: `(${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)}, ${rot.w.toFixed(2)})`,
            hasCamera: camera.camera ? 'Yes' : 'No',
            fov: camera.camera ? camera.camera.fov : 'N/A',
            pointingToCenter: centerInfo,
            renderTarget: camera.camera ? (camera.camera.renderTarget ? 'Yes' : 'No') : 'N/A',
            clearColor: camera.camera ? 
                `(${camera.camera.clearColor.r}, ${camera.camera.clearColor.g}, ${camera.camera.clearColor.b}, ${camera.camera.clearColor.a})` 
                : 'N/A'
        };
    };

    // Get current render state
    const renderState = {
        autoRender: this.app.autoRender ? 'On' : 'Off',
        graphicsDevice: this.app.graphicsDevice ? 'Active' : 'Not Found',
        currentQualityMode: this.isHighQuality ? 'High' : 'Low',
        isTransitioning: this.isTransitioning ? 'Yes' : 'No'
    };

    // Log everything
    console.group('🎥 Camera Debug Status');
    console.log('📊 Render State:', renderState);
    console.log('🎥 High Camera:', getCameraInfo(this.highCamera, 'High Quality Camera'));
    console.log('🎥 Low Camera:', getCameraInfo(this.lowCamera, 'Low Quality Camera'));
    console.groupEnd();
};