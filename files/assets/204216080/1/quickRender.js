var QuickRender = pc.createScript('quickRender');

// Add script attributes
QuickRender.attributes.add('lowQualityKey', {
    type: 'string',
    default: 'l',
    title: 'Low Quality Key'
});

QuickRender.attributes.add('highQualityKey', {
    type: 'string',
    default: 'h',
    title: 'High Quality Key'
});

// Store original states
QuickRender.prototype.originalStates = {
    postEffects: new Map(),
    shadowResolutions: new Map(),
    materials: new Map(),
    renderStates: new Map()
};

// initialize code called once per entity
QuickRender.prototype.initialize = function() {
    // Bind methods
    this.onKeyDown = this.onKeyDown.bind(this);
    
    // Initialize restoration system
    this.isRestoring = false;
    this.restorationSteps = [];
    this.currentStep = 0;
    this.startTime = 0;
    this.duration = 1000; // 1 second

    // Listen for keyboard events
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    pc.app.qr = this;
    console.log(`Press '${this.lowQualityKey}' for low quality, '${this.highQualityKey}' to restore high quality`);
};

QuickRender.prototype.onKeyDown = function(event) {
    if (event.key == pc.KEY_L ) {
        this.setLowQuality();
    } else if (event.key == pc.KEY_H) {
        this.startRestoration();
    }
};

QuickRender.prototype.disablePostEffects = function() {
    try {
        let cameras = pc.app.root.findComponents('camera');
        cameras.forEach(camera => {
            /*if (camera.postEffects) {
                // Store original state
                this.originalStates.postEffects.set(camera, {
                    enabled: camera.postEffects.enabled,
                    effects: camera.postEffects.effects.map(effect => ({
                        effect: effect,
                        enabled: effect.enabled
                    }))
                });

                // Disable effects
                camera.postEffects.effects.forEach(effect => {
                    if (effect) effect.enabled = false;
                });*/
                camera.postEffects.disable();
        //    }
        });
        console.log('✅ Post effects disabled');
    } catch (error) {
        console.error('❌ Error disabling post effects:', error);
    }
};

QuickRender.prototype.reduceShadowResolution = function() {
    try {
        const lights = pc.app.root.findComponents('light');
        lights.forEach(light => {
            if (light.enabled && light.castShadows) {
                this.originalStates.shadowResolutions.set(light, light.shadowResolution);
                light.shadowResolution = 256;
            }
        });
        console.log('✅ Shadow resolutions reduced');
    } catch (error) {
        console.error('❌ Error reducing shadow resolution:', error);
    }
};

QuickRender.prototype.setWireframeRendering = function() {
    try {
        let renderComps = pc.app.root.findComponents('render');
        renderComps.forEach(render => {
            if (!render.entity.tags.has('cheapRender')) {
                render.renderStyle = 1;//0 = solid
            }
        });
        console.log('✅ Wireframe rendering set');
    } catch (error) {
        console.error('❌ Error setting wireframe:', error);
    }
};

QuickRender.prototype.optimizeMaterials = function() {
    try {
        const renderComps = pc.app.root.findComponents('render');
        renderComps.forEach(render => {
            if (!render.entity.tags.has('cheapRender')) {
                render.meshInstances.forEach(meshInstance => {
                    this.originalStates.materials.set(meshInstance, meshInstance.material);

                    const cheapMaterial = new pc.BasicMaterial();
                    cheapMaterial.wireframe = true;
                    cheapMaterial.useLighting = true;
                    cheapMaterial.useGammaTonemap = false;
                    cheapMaterial.useFog = false;
                    cheapMaterial.useSkybox = false;
                    cheapMaterial.cull = pc.CULLFACE_BACK;
                    cheapMaterial.update();

                    meshInstance.material = cheapMaterial;
                });
            }
        });
        console.log('✅ Materials optimized');
    } catch (error) {
        console.error('❌ Error optimizing materials:', error);
    }
};

QuickRender.prototype.setLowQuality = function() {
    console.log('📉 Converting to low quality...');
    this.disablePostEffects();
    this.reduceShadowResolution();
    this.setWireframeRendering();
    this.optimizeMaterials();
    console.log('✅ Low quality conversion complete');
};

QuickRender.prototype.prepareRestoration = function() {
    this.restorationSteps = [
        {
            name: 'Restore Materials',
            action: () => {
                this.originalStates.materials.forEach((material, meshInstance) => {
                    meshInstance.material = material;
                });
                this.originalStates.materials.clear();
            }
        },
        {
            name: 'Restore Render States',
            action: () => {
                this.originalStates.renderStates.forEach((state, render) => {
                    render.meshInstances.forEach((mi, index) => {
                        mi.material.wireframe = state.wireframe[index];
                        mi.material.update();
                    });
                });
                this.originalStates.renderStates.clear();
            }
        },
        {
            name: 'Restore Shadow Resolution',
            action: () => {
                this.originalStates.shadowResolutions.forEach((resolution, light) => {
                    light.shadowResolution = resolution;
                });
                this.originalStates.shadowResolutions.clear();
            }
        },
        {
            name: 'Restore Post Effects',
            action: () => {
                this.originalStates.postEffects.forEach((state, camera) => {
                    camera.postEffects.enabled = state.enabled;
                    state.effects.forEach(effectState => {
                        effectState.effect.enabled = effectState.enabled;
                    });
                });
                this.originalStates.postEffects.clear();
            }
        }
    ];
};

QuickRender.prototype.startRestoration = function() {
    if (this.isRestoring) return;
    
    console.log('📈 Starting quality restoration...');
    this.isRestoring = true;
    this.currentStep = 0;
    this.startTime = Date.now();
    this.prepareRestoration();
};

// update code called every frame
QuickRender.prototype.update = function(dt) {
    if (!this.isRestoring) return;

    const progress = (Date.now() - this.startTime) / this.duration;
    const targetStep = Math.floor(progress * this.restorationSteps.length);

    while (this.currentStep < targetStep && this.currentStep < this.restorationSteps.length) {
        try {
            const step = this.restorationSteps[this.currentStep];
            console.log(`⚙️ Executing restoration step: ${step.name}`);
            step.action();
            this.currentStep++;
        } catch (error) {
            console.error(`❌ Error in restoration step ${this.currentStep}:`, error);
            this.currentStep++;
        }
    }

    if (progress >= 1) {
        this.isRestoring = false;
        console.log('✅ Quality restoration complete');
    }
};

// cleanup code called when script is removed or entity is destroyed
QuickRender.prototype.destroy = function() {
    this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};