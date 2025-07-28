/**
 * SceneManager.js
 * 
 * Handles all PlayCanvas scene management for VTTL v2.0
 * Manages scene loading, entity creation/updates, and scene state
 */

class SceneManager {
    constructor(app, client) {
        this.app = app; // PlayCanvas application
        this.client = client; // VTTL client reference
        this.scene = null; // Current scene data
        this.entities = new Map(); // Entity registry
        this.animationSystem = null; // Will be set externally
        
        console.log('🎬 SceneManager initialized');
    }
    
    /**
     * Set the animation system reference
     * @param {EntityAnimationSystem} animationSystem - Animation system instance
     */
    setAnimationSystem(animationSystem) {
        this.animationSystem = animationSystem;
    }
    
    /**
     * Load complete scene from server data
     * @param {Object} sceneData - Complete scene JSON
     */
    loadScene(sceneData) {
        if (!sceneData) {
            console.error('❌ No scene data provided');
            return;
        }
        
        console.log('🎬 Loading scene:', sceneData.meta?.name || 'Unknown');
        this.scene = sceneData;
        
        // Clear existing scene (preserve camera)
        this.clearScene();
        
        // Load scene components in order
        this.loadCameras(sceneData.cameras || {});
        this.loadLights(sceneData.lights || {});
        this.loadModels(sceneData.models || {});
        this.loadEntities(sceneData.entities || {});
        this.applySettings(sceneData.settings || {});
        
        this.client.updateSceneInfo();
        console.log('✅ Scene loaded successfully');
    }
    
    /**
     * Clear existing scene while preserving camera
     */
    clearScene() {
        if (this.app.root) {
            // Clear all children from the root node (full scene reset)
            this.app.root.children.slice().forEach(child => {
                child.destroy();
            });
        }
        this.entities.clear();
        console.log('🧹 Scene cleared completely');
    }
    
    /**
     * Load cameras from scene data
     * @param {Object} cameras - Camera definitions
     */
    loadCameras(cameras) {
        Object.entries(cameras).forEach(([name, camera]) => {
            // Load all cameras, not just active ones
            const cameraEntity = new pc.Entity(name);
            
            cameraEntity.addComponent('camera', {
                type: camera.type || 'perspective',
                fov: camera.fov || 60,
                nearClip: camera.nearClip || 0.1,
                farClip: camera.farClip || 1000,
                clearColor: new pc.Color(...(camera.clearColor || [0.95, 0.95, 0.95, 1.0])),
                enabled: name === 'mainCamera' // Only enable mainCamera by default
            });
            
            cameraEntity.setPosition(...camera.position);
            if (camera.rotation) {
                cameraEntity.setEulerAngles(...camera.rotation);
            } else if (camera.target) {
                // If target is specified, look at it
                const target = new pc.Vec3(...camera.target);
                cameraEntity.lookAt(target);
            }
            
            this.app.root.addChild(cameraEntity);
            this.entities.set(name, cameraEntity);
            
            if (name === 'mainCamera') {
                console.log(`📹 Camera created: ${name} (ACTIVE)`);
            } else {
                console.log(`📹 Camera created: ${name} (inactive)`);
            }
        });
    }
    
    /**
     * Load lights from scene data
     * @param {Object} lights - Light definitions
     */
    loadLights(lights) {
        Object.entries(lights).forEach(([name, light]) => {
            const lightEntity = new pc.Entity(name);
            
            lightEntity.addComponent('light', {
                type: light.type,
                color: new pc.Color(...light.color),
                intensity: light.intensity,
                castShadows: light.castShadows || false,
                range: light.range || 10
            });
            
            // Set position for point/spot lights, direction for directional lights
            if (light.position) {
                lightEntity.setPosition(...light.position);
            }
            if (light.direction) {
                // For directional lights, set rotation to point in the direction
                const direction = new pc.Vec3(...light.direction);
                lightEntity.lookAt(lightEntity.getPosition().add(direction));
            }
            if (light.rotation) {
                lightEntity.setEulerAngles(...light.rotation);
            }
            
            this.app.root.addChild(lightEntity);
            this.entities.set(name, lightEntity);
            console.log(`💡 Light created: ${name} (${light.type})`);
        });
    }
    
    /**
     * Load models from scene data
     * @param {Object} models - Model definitions
     */
    loadModels(models) {
        Object.entries(models).forEach(([name, model]) => {
            this.createModelEntity(name, model);
        });
    }
    
    /**
     * Load entities from scene data
     * @param {Object} entities - Entity definitions
     */
    loadEntities(entities) {
        Object.entries(entities).forEach(([name, entity]) => {
            this.createModelEntity(name, entity);
        });
    }
    
    /**
     * Create a model/entity in the scene
     * @param {string} name - Entity name
     * @param {Object} data - Entity data
     */
    createModelEntity(name, data) {
        const entity = new pc.Entity(name);
        
        // Handle different entity types
        if (data.type === 'model' && data.properties?.model) {
            // GLB Model entity
            this.loadGLBModel(entity, data);
        } else {
            // Primitive entity (box, sphere, cylinder, etc.)
            entity.addComponent('render', {
                type: data.type || 'box'
            });
            
            // Create and configure material for primitives
            const material = new pc.StandardMaterial();
            
            // Basic color
            if (data.color) {
                material.diffuse = new pc.Color(...data.color);
            }
            
            // Enhanced material properties for photographic quality
            if (data.material) {
                material.metalness = data.material.metalness !== undefined ? data.material.metalness : 0.0;
                material.roughness = data.material.roughness !== undefined ? data.material.roughness : 0.5;
                
                // Enable shadow receiving/casting if specified
                if (data.material.receiveShadows !== undefined) {
                    material.receiveShadows = data.material.receiveShadows;
                }
                if (data.material.castShadows !== undefined) {
                    material.castShadows = data.material.castShadows;
                }
            }
            
            material.update();
            entity.render.material = material;
        }
        
        // Set transform properties
        entity.setPosition(...(data.position || [0, 0, 0]));
        entity.setEulerAngles(...(data.rotation || [0, 0, 0]));
        entity.setLocalScale(...(data.scale || [1, 1, 1]));
        
        // Configure shadow properties for render component
        if (entity.render) {
            // Shadow casting/receiving for primitives
            entity.render.castShadows = data.castShadows !== false; // Default to true
            entity.render.receiveShadows = data.receiveShadows !== false; // Default to true
            
            // Override with material-specific settings if available
            if (data.material) {
                if (data.material.castShadows !== undefined) {
                    entity.render.castShadows = data.material.castShadows;
                }
                if (data.material.receiveShadows !== undefined) {
                    entity.render.receiveShadows = data.material.receiveShadows;
                }
            }
        }
        
        // Add physics if enabled
        if (data.physics?.enabled) {
            entity.addComponent('collision', { type: 'box' });
            if (data.physics.type !== 'static') {
                entity.addComponent('rigidbody', {
                    type: data.physics.type,
                    mass: data.physics.mass || 1
                });
            }
        }
        
        // Add to scene
        this.app.root.addChild(entity);
        this.entities.set(name, entity);
        
        console.log(`🎯 Entity created: ${name} (${data.type || 'box'})`);
    }
    
    /**
     * Load a GLB model for an entity
     * @param {pc.Entity} entity - The entity to attach the model to
     * @param {Object} data - Entity data containing model path
     */
    loadGLBModel(entity, data) {
        const modelPath = `/3dmodels/${data.properties.model}`;
        
        // Load the GLB asset
        this.app.assets.loadFromUrl(modelPath, 'container', (err, asset) => {
            if (err) {
                console.error(`❌ Failed to load model ${modelPath}:`, err);
                // Create fallback primitive
                entity.addComponent('render', { type: 'box' });
                const material = new pc.StandardMaterial();
                material.diffuse = new pc.Color(1, 0, 0); // Red to indicate error
                material.update();
                entity.render.material = material;
                return;
            }
            
            console.log(`✅ Model loaded: ${modelPath}`);
            
            // For GLB/container assets, we need to access the model resource
            if (asset.resource && asset.resource.model) {
                // Add model component with the model resource
                entity.addComponent('model', {
                    type: 'asset',
                    asset: asset.resource.model
                });
            } else {
                console.error(`❌ No model resource found in asset: ${modelPath}`);
                // Create fallback primitive
                entity.addComponent('render', { type: 'box' });
                const material = new pc.StandardMaterial();
                material.diffuse = new pc.Color(1, 0, 0); // Red to indicate error
                material.update();
                entity.render.material = material;
                return;
            }
            
            // Apply shadow settings if specified
            if (data.properties.castShadow !== undefined) {
                entity.model.castShadows = data.properties.castShadow;
            }
            if (data.properties.receiveShadow !== undefined) {
                entity.model.receiveShadows = data.properties.receiveShadow;
            }
            
            // Force render update
            this.app.render();
        });
    }
    
    /**
     * Apply scene settings (lighting, shadows, etc.)
     * @param {Object} settings - Scene settings
     */
    applySettings(settings) {
        // Apply ambient lighting
        if (settings.lighting?.ambient) {
            const ambient = settings.lighting.ambient;
            this.app.scene.ambientLight = new pc.Color(
                ambient.color[0] * ambient.intensity,
                ambient.color[1] * ambient.intensity,
                ambient.color[2] * ambient.intensity
            );
        }
        
        // Apply shadow settings
        if (settings.lighting?.shadows?.enabled) {
            this.app.scene.shadowsEnabled = true;
            const shadows = settings.lighting.shadows;
            
            // Configure shadow properties for photographic quality
            if (shadows.type === 'pcf') {
                // Use highest quality PCF for soft, realistic shadows
                this.app.scene.shadowType = pc.SHADOW_PCF5;
            }
            
            // High resolution shadow maps
            if (shadows.resolution) {
                this.app.scene.shadowMapSize = shadows.resolution;
            }
            
            // Advanced shadow properties for photographic quality
            if (shadows.bias !== undefined) {
                this.app.scene.shadowBias = shadows.bias;
            }
            if (shadows.normalBias !== undefined) {
                this.app.scene.shadowNormalBias = shadows.normalBias;
            }
            
            // Shadow distance and fading for realistic falloff
            if (shadows.distance !== undefined) {
                this.app.scene.shadowDistance = shadows.distance;
            }
            
            console.log(`🌑 High-quality shadows configured: ${shadows.resolution}px, PCF5, bias=${shadows.bias}`);
        }
        
        // Apply rendering settings
        if (settings.rendering) {
            const rendering = settings.rendering;
            
            // HDR settings
            if (rendering.hdr?.enabled) {
                this.app.scene.toneMapping = pc.TONEMAP_ACES;
                if (rendering.hdr.exposure) {
                    this.app.scene.exposure = rendering.hdr.exposure;
                }
                if (rendering.hdr.gamma) {
                    this.app.scene.gamma = rendering.hdr.gamma;
                }
            }
            
            // Note: WebGPU backend is set at PlayCanvas initialization level
            // MSAA and other rendering features are handled by the engine
        }
        
        console.log(`⚙️ Scene settings applied: WebGPU=${settings.rendering?.backend === 'webgpu'}, Shadows=${settings.lighting?.shadows?.enabled}`);
    }
    
    /**
     * Apply scene diff updates with animations
     * @param {Object} diffData - Scene diff data
     * @param {Object} animationHints - Animation hints from server
     */
    applySceneDiff(diffData, animationHints) {
        console.log('🔄 Applying scene diff:', diffData);
        
        // Update entities with animations
        if (diffData.entities) {
            this.applyEntityDiff(diffData.entities, animationHints);
        }
        
        // Update models
        if (diffData.models) {
            this.applyModelDiff(diffData.models, animationHints);
        }
        
        // Update lights
        if (diffData.lights) {
            this.applyLightDiff(diffData.lights);
        }
        
        // Update cameras
        if (diffData.cameras) {
            this.applyCameraDiff(diffData.cameras);
        }
        
        // Update settings
        if (diffData.settings) {
            this.applySettings(diffData.settings);
        }
        
        this.client.updateSceneInfo();
    }
    
    /**
     * Apply entity diff updates
     * @param {Object} entities - Entity updates
     * @param {Object} animationHints - Animation hints
     */
    applyEntityDiff(entities, animationHints) {
        for (const [entityName, entityData] of Object.entries(entities)) {
            const changeType = entityData._change_type;
            const animationHint = animationHints[`entities.${entityName}`];
            
            switch (changeType) {
                case 'create':
                    console.log(`➕ Creating entity: ${entityName}`);
                    this.createModelEntity(entityName, entityData);
                    break;
                    
                case 'update':
                    console.log(`🔄 Updating entity: ${entityName}`);
                    this.updateExistingEntity(entityName, entityData, animationHint);
                    break;
                    
                case 'delete':
                    console.log(`❌ Deleting entity: ${entityName}`);
                    this.deleteEntity(entityName);
                    break;
            }
        }
    }
    
    /**
     * Apply model diff updates
     * @param {Object} models - Model updates
     * @param {Object} animationHints - Animation hints
     */
    applyModelDiff(models, animationHints) {
        for (const [modelName, modelData] of Object.entries(models)) {
            const changeType = modelData._change_type;
            const animationHint = animationHints[`models.${modelName}`];
            
            switch (changeType) {
                case 'create':
                    console.log(`➕ Creating model: ${modelName}`);
                    this.createModelEntity(modelName, modelData);
                    break;
                    
                case 'update':
                    console.log(`🔄 Updating model: ${modelName}`);
                    this.updateExistingEntity(modelName, modelData, animationHint);
                    break;
                    
                case 'delete':
                    console.log(`❌ Deleting model: ${modelName}`);
                    this.deleteEntity(modelName);
                    break;
            }
        }
    }
    
    /**
     * Apply light diff updates
     * @param {Object} lights - Light updates
     */
    applyLightDiff(lights) {
        for (const [lightName, lightData] of Object.entries(lights)) {
            const changeType = lightData._change_type;
            
            switch (changeType) {
                case 'create':
                    console.log(`➕ Creating light: ${lightName}`);
                    this.loadLights({ [lightName]: lightData });
                    break;
                    
                case 'update':
                    console.log(`💡 Updating light: ${lightName}`);
                    this.updateExistingLight(lightName, lightData);
                    break;
                    
                case 'delete':
                    console.log(`❌ Deleting light: ${lightName}`);
                    this.deleteEntity(lightName);
                    break;
            }
        }
    }
    
    /**
     * Apply camera diff updates
     * @param {Object} cameras - Camera updates
     */
    applyCameraDiff(cameras) {
        for (const [cameraName, cameraData] of Object.entries(cameras)) {
            const changeType = cameraData._change_type;
            
            switch (changeType) {
                case 'create':
                    console.log(`➕ Creating camera: ${cameraName}`);
                    this.loadCameras({ [cameraName]: cameraData });
                    break;
                    
                case 'update':
                    console.log(`📹 Updating camera: ${cameraName}`);
                    this.updateExistingCamera(cameraName, cameraData);
                    break;
                    
                case 'delete':
                    console.log(`❌ Deleting camera: ${cameraName}`);
                    this.deleteEntity(cameraName);
                    break;
            }
        }
    }
    
    /**
     * Update an existing entity with animation support
     * @param {string} entityName - Entity name
     * @param {Object} entityData - New entity data
     * @param {Object} animationHint - Animation hints
     */
    updateExistingEntity(entityName, entityData, animationHint) {
        const entity = this.entities.get(entityName);
        if (!entity) {
            console.warn(`⚠️ Entity not found for update: ${entityName}`);
            return;
        }
        
        console.log(`🔧 Updating entity: ${entityName}`);
        console.log(`📦 Update data:`, entityData);
        
        // Process each property update
        for (const [propertyName, newValue] of Object.entries(entityData)) {
            // Skip internal change type marker
            if (propertyName === '_change_type') continue;
            
            // Use animation system if available
            if (this.animationSystem) {
                this.animationSystem.animateEntityProperty(entity, entityName, propertyName, newValue);
            } else {
                // Fallback to instant update
                this.applyEntityPropertyUpdate(entity, entityName, propertyName, newValue);
            }
        }
        
        console.log(`✅ Entity updated: ${entityName}`);
    }
    
    /**
     * Apply instant property update to entity
     * @param {pc.Entity} entity - PlayCanvas entity
     * @param {string} entityName - Entity name
     * @param {string} propertyName - Property name
     * @param {*} value - New value
     */
    applyEntityPropertyUpdate(entity, entityName, propertyName, value) {
        switch (propertyName) {
            case 'position':
                if (Array.isArray(value) && value.length >= 3) {
                    entity.setPosition(value[0], value[1], value[2]);
                }
                break;
                
            case 'rotation':
                if (Array.isArray(value) && value.length >= 3) {
                    entity.setEulerAngles(value[0], value[1], value[2]);
                }
                break;
                
            case 'scale':
                if (Array.isArray(value) && value.length >= 3) {
                    entity.setLocalScale(value[0], value[1], value[2]);
                }
                break;
                
            case 'color':
                if (Array.isArray(value) && value.length >= 3) {
                    const renderComponent = entity.render;
                    if (renderComponent && renderComponent.material) {
                        renderComponent.material.diffuse.set(value[0], value[1], value[2]);
                        renderComponent.material.update();
                    }
                }
                break;
                
            default:
                console.log(`📝 Applied property update: ${entityName}.${propertyName} = ${value}`);
                break;
        }
    }
    
    /**
     * Update existing light entity
     * @param {string} lightName - Light name
     * @param {Object} lightData - Light data
     */
    updateExistingLight(lightName, lightData) {
        const light = this.entities.get(lightName);
        if (!light || !light.light) return;
        
        const lightComponent = light.light;
        
        if (lightData.color) {
            lightComponent.color = new pc.Color(...lightData.color);
        }
        if (lightData.intensity !== undefined) {
            lightComponent.intensity = lightData.intensity;
        }
        if (lightData.position) {
            light.setPosition(...lightData.position);
        }
        if (lightData.rotation) {
            light.setEulerAngles(...lightData.rotation);
        }
        
        console.log(`💡 Light updated: ${lightName}`);
    }
    
    /**
     * Update existing camera entity
     * @param {string} cameraName - Camera name
     * @param {Object} cameraData - Camera data
     */
    updateExistingCamera(cameraName, cameraData) {
        const camera = this.entities.get(cameraName);
        if (!camera || !camera.camera) return;
        
        const cameraComponent = camera.camera;
        
        if (cameraData.fov !== undefined) {
            cameraComponent.fov = cameraData.fov;
        }
        if (cameraData.position) {
            camera.setPosition(...cameraData.position);
        }
        if (cameraData.rotation) {
            camera.setEulerAngles(...cameraData.rotation);
        }
        if (cameraData.target) {
            camera.lookAt(new pc.Vec3(...cameraData.target));
        }
        
        // Handle clearColor changes for immediate sky color updates
        if (cameraData.clearColor) {
            cameraComponent.clearColor = new pc.Color(...cameraData.clearColor);
            console.log(`🎨 Camera clear color updated to:`, cameraData.clearColor);
            
            // Force immediate render to show sky color change
            this.app.renderNextFrame = true;
            this.app.render();
        }
        
        // If this is mainCamera, make it the active camera
        if (cameraName === 'mainCamera') {
            // Disable all other cameras
            for (const [entityName, entity] of this.entities) {
                if (entity.camera && entityName !== 'mainCamera') {
                    entity.camera.enabled = false;
                }
            }
            
            // Enable mainCamera and make it active
            cameraComponent.enabled = true;
            console.log(`📹 Active camera switched to: ${cameraName}`);
            
            // Force immediate render with new camera
            this.app.renderNextFrame = true;
            this.app.render();
        }
        
        console.log(`📹 Camera updated: ${cameraName}`);
    }
    
    /**
     * Delete entity from scene
     * @param {string} entityName - Entity name
     */
    deleteEntity(entityName) {
        const entity = this.entities.get(entityName);
        if (entity) {
            entity.destroy();
            this.entities.delete(entityName);
            console.log(`🗑️ Entity deleted: ${entityName}`);
        } else {
            console.warn(`⚠️ Entity not found for deletion: ${entityName}`);
        }
    }
    
    /**
     * Get entity by name
     * @param {string} name - Entity name
     * @return {pc.Entity|null} Entity or null if not found
     */
    getEntity(name) {
        return this.entities.get(name) || null;
    }
    
    /**
     * Get all entity names
     * @return {Array<string>} Array of entity names
     */
    getEntityNames() {
        return Array.from(this.entities.keys());
    }
    
    /**
     * Get scene statistics
     * @return {Object} Scene stats
     */
    getStats() {
        return {
            entities: this.entities.size,
            totalChildren: this.app.root ? this.app.root.children.length : 0,
            sceneLoaded: !!this.scene,
            version: this.scene?.version || 'Unknown'
        };
    }
    
    /**
     * Take screenshot of current scene
     * @return {string} Base64 screenshot data
     */
    takeScreenshot() {
        if (!this.app || !this.app.graphicsDevice) {
            console.error('❌ Cannot take screenshot: PlayCanvas not ready');
            return null;
        }
        
        try {
            // Force render before screenshot
            this.app.render();
            
            // Capture screenshot
            const canvas = this.app.graphicsDevice.canvas;
            const dataUrl = canvas.toDataURL('image/png');
            
            console.log('📸 Screenshot captured');
            return dataUrl;
        } catch (error) {
            console.error('❌ Screenshot failed:', error);
            return null;
        }
    }
    
    /**
     * Get current scene state for synchronization verification
     * @returns {Object} Current scene state
     */
    getSceneState() {
        const entities = {};
        const lights = {};
        const cameras = {};
        
        // Extract current state from entities
        for (const [name, entity] of this.entities) {
            if (entity.camera) {
                cameras[name] = {
                    position: entity.getPosition().data,
                    rotation: entity.getEulerAngles().data,
                    fov: entity.camera.fov
                };
            } else if (entity.light) {
                lights[name] = {
                    type: entity.light.type,
                    color: entity.light.color.data,
                    intensity: entity.light.intensity,
                    position: entity.getPosition().data
                };
            } else {
                // Regular entity
                entities[name] = {
                    type: entity.model ? 'model' : 'primitive',
                    position: entity.getPosition().data,
                    rotation: entity.getEulerAngles().data,
                    scale: entity.getLocalScale().data
                };
            }
        }
        
        return {
            entities,
            lights,
            cameras,
            last_modified: this.scene?.last_modified || new Date().toISOString()
        };
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneManager;
}