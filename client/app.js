/**
 * PlayCanvas Application - Main 3D engine setup and entity management
 */

class EntityManager {
    constructor(app) {
        this.app = app;
        this.entities = new Map();
        this.templates = new Map();
        this.materials = new Map();
        
        this.setupTemplates();
        this.setupMaterials();
    }
    
    setupTemplates() {
        // Cube template
        this.templates.set('cube', {
            type: 'primitive',
            primitiveType: 'box',
            scale: [1, 1, 1],
            material: 'default'
        });
        
        // Sphere template (for game pieces)
        this.templates.set('sphere', {
            type: 'primitive',
            primitiveType: 'sphere',
            scale: [1, 1, 1],
            material: 'piece'
        });
        
        // Board tile template
        this.templates.set('board_tile', {
            type: 'primitive',
            primitiveType: 'plane',
            scale: [1, 1, 1],
            material: 'tile'
        });
        
        // Mini templates
        this.templates.set('warrior', {
            type: 'primitive',
            primitiveType: 'capsule',
            scale: [0.8, 1.5, 0.8],
            material: 'warrior'
        });
        
        this.templates.set('default_cube', {
            type: 'primitive',
            primitiveType: 'box',
            scale: [1, 1, 1],
            material: 'default'
        });
        
        // GLB Model template
        this.templates.set('model', {
            type: 'model',
            scale: [1, 1, 1],
            material: 'default'
        });
    }
    
    setupMaterials() {
        // Default material
        const defaultMat = new pc.StandardMaterial();
        defaultMat.diffuse = new pc.Color(0.7, 0.7, 0.7);
        defaultMat.update();
        this.materials.set('default', defaultMat);
        
        // Game piece material
        const pieceMat = new pc.StandardMaterial();
        pieceMat.diffuse = new pc.Color(0.2, 0.6, 0.9);
        pieceMat.metalness = 0.1;
        pieceMat.gloss = 0.8;
        pieceMat.update();
        this.materials.set('piece', pieceMat);
        
        // Board tile material
        const tileMat = new pc.StandardMaterial();
        tileMat.diffuse = new pc.Color(0.9, 0.9, 0.8);
        tileMat.metalness = 0.0;
        tileMat.gloss = 0.2;
        tileMat.update();
        this.materials.set('tile', tileMat);
        
        // Warrior material
        const warriorMat = new pc.StandardMaterial();
        warriorMat.diffuse = new pc.Color(0.8, 0.2, 0.2);
        warriorMat.metalness = 0.3;
        warriorMat.gloss = 0.7;
        warriorMat.update();
        this.materials.set('warrior', warriorMat);
    }
    
    syncEntities(serverEntities) {
        // Remove entities that no longer exist on server
        this.entities.forEach((entity, name) => {
            if (!serverEntities[name]) {
                this.removeEntity(name);
            }
        });
        
        // Add or update entities from server
        Object.values(serverEntities).forEach(serverEntity => {
            if (this.entities.has(serverEntity.name)) {
                this.updateEntity(serverEntity);
            } else {
                // Check if entity already exists in PlayCanvas scene (from scene loading)
                const existingEntity = this.app.root.findByName(serverEntity.name);
                if (existingEntity) {
                    // Just register the existing entity, don't create a new one
                    this.entities.set(serverEntity.name, existingEntity);
                    console.log(`Registered existing PlayCanvas entity: ${serverEntity.name}`);
                } else {
                    // Create new primitive entity only if it doesn't exist
                    this.createEntity(serverEntity);
                }
            }
        });
    }
    
    createEntity(entityData) {
        const { name, template, position, rotation, scale } = entityData;
        
        const templateData = this.templates.get(template) || this.templates.get('default_cube');
        
        // Create PlayCanvas entity
        const entity = new pc.Entity(name);
        
        // Add render component
        entity.addComponent('render', {
            type: templateData.primitiveType
        });
        
        // Set material
        const material = this.materials.get(templateData.material) || this.materials.get('default');
        entity.render.material = material;
        
        // Set transform
        entity.setPosition(position[0], position[1], position[2]);
        entity.setEulerAngles(rotation[0], rotation[1], rotation[2]);
        
        const finalScale = scale || templateData.scale;
        entity.setLocalScale(finalScale[0], finalScale[1], finalScale[2]);
        
        // Add to scene
        this.app.root.addChild(entity);
        this.entities.set(name, entity);
        
        console.log(`Created entity: ${name} at [${position}]`);
        
        // Add smooth movement capability
        if (entityData.lastMove && entityData.lastMove.animate) {
            this.animateMovement(entity, entityData.lastMove);
        }
    }
    
    updateEntity(entityData) {
        const entity = this.entities.get(entityData.name);
        if (!entity) return;
        
        const { position, rotation, scale } = entityData;
        
        // Animate movement if specified
        if (entityData.lastMove && entityData.lastMove.animate) {
            this.animateMovement(entity, entityData.lastMove);
        } else {
            // Instant update
            entity.setPosition(position[0], position[1], position[2]);
            entity.setEulerAngles(rotation[0], rotation[1], rotation[2]);
            
            if (scale) {
                entity.setLocalScale(scale[0], scale[1], scale[2]);
            }
        }
    }
    
    removeEntity(name) {
        const entity = this.entities.get(name);
        if (entity) {
            entity.destroy();
            this.entities.delete(name);
            console.log(`Removed entity: ${name}`);
        }
    }
    
    animateMovement(entity, moveData) {
        const { from, to, animate } = moveData;
        
        if (!animate) {
            entity.setPosition(to[0], to[1], to[2]);
            return;
        }
        
        // Simple tween animation
        const startPos = new pc.Vec3(from[0], from[1], from[2]);
        const endPos = new pc.Vec3(to[0], to[1], to[2]);
        const duration = 0.5; // seconds
        
        let elapsed = 0;
        const startTime = Date.now();
        
        const animateMovement = () => {
            const now = Date.now();
            elapsed = (now - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentPos = new pc.Vec3();
            currentPos.lerp(startPos, endPos, easedProgress);
            entity.setPosition(currentPos);
            
            if (progress < 1) {
                requestAnimationFrame(animateMovement);
            }
        };
        
        animateMovement();
    }
}

// Scene Configuration
const SCENE_CONFIG = {
    mode: 'playcanvas_project', // 'standalone' or 'playcanvas_project'
    projectId: null,    // PlayCanvas project ID (when using 'playcanvas_project')
    sceneId: null,      // PlayCanvas scene ID
    assetId: null,      // PlayCanvas asset ID for scene
    buildUrl: null      // URL to PlayCanvas build
};

// Load scene configuration from URL params or localStorage
function loadSceneConfig() {
    console.log('🔧 Loading scene configuration...');
    console.log('Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL parameters:', Object.fromEntries(urlParams));
    
    // Check URL parameters first
    const mode = urlParams.get('mode');
    const buildUrl = urlParams.get('buildUrl');
    const projectId = urlParams.get('projectId');
    
    console.log('Parsed params - mode:', mode, 'buildUrl:', buildUrl, 'projectId:', projectId);
    
    if (mode === 'playcanvas_project' || buildUrl || projectId) {
        SCENE_CONFIG.mode = 'playcanvas_project';
        SCENE_CONFIG.projectId = projectId;
        SCENE_CONFIG.sceneId = urlParams.get('sceneId');
        SCENE_CONFIG.assetId = urlParams.get('assetId');
        SCENE_CONFIG.buildUrl = buildUrl;
        console.log('✅ Set to PlayCanvas project mode');
    } else {
        console.log('🎮 No PlayCanvas parameters found, using default mode');
    }
    
    // Check localStorage for saved config
    const savedConfig = localStorage.getItem('vttl_scene_config');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        Object.assign(SCENE_CONFIG, config);
        console.log('📦 Applied saved config from localStorage');
    }
    
    console.log('✅ Final scene config:', SCENE_CONFIG);
}

// Initialize PlayCanvas Application
const canvas = document.getElementById('playcanvas-app');

function createPlayCanvasApp() {
    const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(document.body),
        touch: new pc.TouchDevice(document.body),
        keyboard: new pc.Keyboard(window),
        gamepads: new pc.GamePads()
    });

    // Set canvas to fill the window and automatically change resolution to be the same as the canvas size
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Enable WebGL extensions
    app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
    
    return app;
}

// Load scene configuration
loadSceneConfig();

// Create app
const app = createPlayCanvasApp();

// Make app globally available for entity classes
window.app = app;

// Scene loading functions
async function loadPlayCanvasScene() {
    if (SCENE_CONFIG.mode === 'playcanvas_project') {
        try {
            console.log('Loading PlayCanvas Editor scene...');
            
            // Method 1: Load from build URL (published builds)
            if (SCENE_CONFIG.buildUrl) {
                console.log('Loading from build URL:', SCENE_CONFIG.buildUrl);
                
                // For PlayCanvas builds, we need to load the scene hierarchy JSON, not the HTML
                let sceneUrl = SCENE_CONFIG.buildUrl;
                
                // If it's pointing to an HTML file, try to find the scene JSON
                if (sceneUrl.endsWith('.html') || sceneUrl.endsWith('/')) {
                    // Try common PlayCanvas build patterns
                    const baseUrl = sceneUrl.replace(/\/[^\/]*$/, ''); // Remove filename if any
                    sceneUrl = `${baseUrl}/2110491.json`; // This matches the extracted multicam scene
                    console.log('Attempting to load scene hierarchy from:', sceneUrl);
                }
                
                console.log('📁 Loading PlayCanvas scene from:', sceneUrl);
                
                // Use PlayCanvas built-in scene loading
                await new Promise((resolve, reject) => {
                    app.loadSceneHierarchy(sceneUrl, (err) => {
                        if (err) {
                            console.error('❌ Scene loading failed:', err);
                            reject(err);
                        } else {
                            console.log('✅ Scene loaded successfully');
                            resolve();
                        }
                    });
                });
            }
            // Method 2: Load scene assets directly (if project has scene assets)
            else if (SCENE_CONFIG.projectId && SCENE_CONFIG.sceneId) {
                console.log('Loading scene from project assets...');
                
                // Construct PlayCanvas Editor scene URL
                const sceneUrl = `https://playcanvas.com/api/assets/${SCENE_CONFIG.assetId}/file`;
                
                await new Promise((resolve, reject) => {
                    app.assets.loadFromUrl(sceneUrl, 'scene', (err, asset) => {
                        if (err) {
                            console.error('Failed to load scene asset:', err);
                            reject(err);
                        } else {
                            console.log('Scene asset loaded, applying to app...');
                            app.loadSceneHierarchy(asset.resource, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            }
            
            // Wait a moment for scene to fully initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Find and use existing camera and lights from the scene
            const existingCamera = app.root.findByName('CameraHi') || app.root.find(e => e.camera)[0];
            if (existingCamera) {
                console.log('Using existing camera from scene');
                window.sceneCamera = existingCamera;
            } else {
                console.log('No camera found, creating standalone camera');
                createStandaloneCamera();
            }
            
            // Register existing entities for API control
            detectExistingEntities();
            
            console.log('PlayCanvas Editor scene loaded successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to load PlayCanvas scene, falling back to standalone:', error);
            SCENE_CONFIG.mode = 'standalone';
            return false;
        }
    }
    return false;
}


function createStandaloneCamera() {
    console.log('Creating standalone camera');
    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
        clearColor: new pc.Color(0.1, 0.1, 0.1),
        fov: 60,
        nearClip: 0.1,
        farClip: 1000
    });
    camera.setPosition(0, 15, 10);
    camera.lookAt(0, 0, 0);
    app.root.addChild(camera);
    window.sceneCamera = camera;
}

function createStandaloneLighting() {
    console.log('Creating standalone lighting');
    const light = new pc.Entity('light');
    light.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 1, 1),
        intensity: 1,
        castShadows: true,
        shadowBias: 0.02,
        shadowDistance: 50,
        shadowResolution: 2048
    });
    light.setEulerAngles(45, -30, 0);
    app.root.addChild(light);
    
    // Add ambient light
    app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);
    app.scene.shadowsEnabled = true;
}

function detectExistingEntities() {
    console.log('Detecting existing entities in loaded scene...');
    
    // Categorize entities by VTTL standard
    const entityCategories = {
        miniatures: [],
        props: [],
        environment: [],
        board: [],
        special: [],
        legacy: []  // Non-standard entities from legacy scenes
    };
    
    // Find all entities in the scene that could be managed
    const allEntities = app.root.find((entity) => {
        // Skip camera, lights, and root
        if (entity === app.root || 
            entity.name.toLowerCase().includes('camera') ||
            entity.name.toLowerCase().includes('light') ||
            entity.tags.has('camera') ||
            entity.tags.has('light')) {
            return false;
        }
        
        // Look for entities with render components (visible objects)
        return entity.render && entity.render.enabled;
    });
    
    console.log(`Found ${allEntities.length} renderable entities in scene`);
    
    // Categorize entities based on VTTL naming convention
    allEntities.forEach(entity => {
        const name = entity.name.toLowerCase();
        
        if (name.startsWith('mini_') || entity.tags.has('vttl_mini')) {
            entityCategories.miniatures.push(entity);
        } else if (name.startsWith('prop_') || entity.tags.has('vttl_prop')) {
            entityCategories.props.push(entity);
        } else if (name.startsWith('env_') || entity.tags.has('vttl_environment')) {
            entityCategories.environment.push(entity);
        } else if (name.startsWith('board_') || name.startsWith('terrain_') || entity.tags.has('vttl_board')) {
            entityCategories.board.push(entity);
        } else if (name.startsWith('special_') || entity.tags.has('vttl_special')) {
            entityCategories.special.push(entity);
        } else {
            // Legacy entities from multicam scene - classify by content
            if (name.includes('paladin') || name.includes('enemy') || name.includes('skeleton')) {
                entityCategories.miniatures.push(entity);
            } else if (name.includes('tree') || name.includes('rock') || name.includes('building')) {
                entityCategories.environment.push(entity);
            } else if (name.includes('table') || name.includes('ground') || name.includes('board')) {
                entityCategories.board.push(entity);
            } else if (name.includes('cart') || name.includes('wagon') || name.includes('treasure')) {
                entityCategories.props.push(entity);
            } else {
                entityCategories.legacy.push(entity);
            }
        }
    });
    
    // Log categorized entities
    console.log('📊 Entity categorization:');
    console.log(`  🔴 Miniatures: ${entityCategories.miniatures.length}`);
    console.log(`  🎯 Props: ${entityCategories.props.length}`);
    console.log(`  🌳 Environment: ${entityCategories.environment.length}`);
    console.log(`  🏁 Board/Terrain: ${entityCategories.board.length}`);
    console.log(`  ⭐ Special: ${entityCategories.special.length}`);
    console.log(`  📦 Legacy: ${entityCategories.legacy.length}`);
    
    // Register entities with appropriate VTTL templates
    let registeredCount = 0;
    
    // Register each category with appropriate template mapping
    Object.entries(entityCategories).forEach(([category, entities]) => {
        entities.forEach(entity => {
            const pos = entity.getPosition();
            
            // Check if entity is already registered to avoid duplicates
            if (!entityManager.entities.has(entity.name)) {
                // Just track the existing PlayCanvas entity (don't create new ones)
                entityManager.entities.set(entity.name, entity);
                
                // Create a simple data record for the server
                const rot = entity.getEulerAngles();
                const scale = entity.getLocalScale();
                
                // Determine template based on VTTL standard
                let template = 'playcanvas_asset';
                let owner = 'playcanvas_scene';
                
                if (category === 'miniatures') {
                    template = 'warrior'; // Use existing template system
                    // Try to extract owner from name (e.g., mini_warrior_player1_001)
                    const nameMatch = entity.name.match(/player\d+|dm|neutral/i);
                    owner = nameMatch ? nameMatch[0].toLowerCase() : 'neutral';
                } else if (category === 'props') {
                    template = 'cube'; // Use existing template
                } else if (category === 'environment') {
                    template = 'cube'; // Use existing template
                } else if (category === 'board') {
                    template = 'board_tile'; // Use existing template
                }
                
                const entityData = {
                    name: entity.name,
                    template: template,
                    position: [pos.x, pos.y, pos.z],
                    rotation: [rot.x, rot.y, rot.z],
                    scale: [scale.x, scale.y, scale.z],
                    owner: owner,
                    properties: {
                        source: 'playcanvas_editor',
                        category: category,
                        vttl_type: category,
                        entityId: entity.guid || entity.name
                    }
                };
                
                // Just register locally, don't send to server (avoid creating duplicate primitives)
                // gameController.sendMessage('register_existing_entity', entityData);
                registeredCount++;
                
                console.log(`  📝 ${category}: ${entity.name} (${template})`);
            }
        });
    });
    
    console.log(`✅ Registered ${registeredCount} PlayCanvas entities with VTTL system`);
    console.log(`📊 Total entities by category: M:${entityCategories.miniatures.length} P:${entityCategories.props.length} E:${entityCategories.environment.length} B:${entityCategories.board.length} S:${entityCategories.special.length} L:${entityCategories.legacy.length}`);
}

function createStandaloneScene() {
    console.log('Creating standalone scene');
    
    createStandaloneCamera();
    createStandaloneLighting();
    
    // Create ground plane
    const ground = new pc.Entity('ground');
    ground.addComponent('render', {
        type: 'plane'
    });

    const groundMaterial = new pc.StandardMaterial();
    groundMaterial.diffuse = new pc.Color(0.3, 0.5, 0.3);
    groundMaterial.update();
    ground.render.material = groundMaterial;
    ground.setLocalScale(50, 1, 50);
    ground.setPosition(0, -1, 0);
    app.root.addChild(ground);
}

// Initialize scene based on configuration
async function initializeScene() {
    console.log('🎬 Initializing scene...');
    console.log('Scene mode:', SCENE_CONFIG.mode);
    
    const sceneLoaded = await loadPlayCanvasScene();
    console.log('Scene loaded result:', sceneLoaded);
    
    if (!sceneLoaded) {
        console.log('🎮 Fallback: Creating standalone scene');
        createStandaloneScene();
    } else {
        console.log('✅ PlayCanvas Editor scene loaded successfully');
    }
}

// Mouse controls for camera
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let cameraDistance = 20;
let cameraAngleX = 30; // Pitch
let cameraAngleY = 0;  // Yaw

// Get current camera (from scene or created)
function getCurrentCamera() {
    return window.sceneCamera || app.root.findByName('Camera') || app.root.findByTag('camera')[0];
}

app.mouse.on(pc.EVENT_MOUSEDOWN, (event) => {
    if (event.button === pc.MOUSEBUTTON_LEFT) {
        isDragging = true;
        lastMousePos.x = event.x;
        lastMousePos.y = event.y;
    }
});

app.mouse.on(pc.EVENT_MOUSEMOVE, (event) => {
    if (isDragging) {
        const deltaX = event.x - lastMousePos.x;
        const deltaY = event.y - lastMousePos.y;
        
        cameraAngleY += deltaX * 0.5;
        cameraAngleX += deltaY * 0.5;
        cameraAngleX = pc.math.clamp(cameraAngleX, 5, 85);
        
        updateCameraPosition();
        
        lastMousePos.x = event.x;
        lastMousePos.y = event.y;
    }
});

app.mouse.on(pc.EVENT_MOUSEUP, (event) => {
    if (event.button === pc.MOUSEBUTTON_LEFT) {
        isDragging = false;
    }
});

app.mouse.on(pc.EVENT_MOUSEWHEEL, (event) => {
    cameraDistance += event.wheel * 2;
    cameraDistance = pc.math.clamp(cameraDistance, 5, 50);
    updateCameraPosition();
});

function updateCameraPosition() {
    const camera = getCurrentCamera();
    if (!camera) return;
    
    const radX = cameraAngleX * pc.math.DEG_TO_RAD;
    const radY = cameraAngleY * pc.math.DEG_TO_RAD;
    
    const x = Math.sin(radY) * Math.cos(radX) * cameraDistance;
    const y = Math.sin(radX) * cameraDistance;
    const z = Math.cos(radY) * Math.cos(radX) * cameraDistance;
    
    camera.setPosition(x, y, z);
    camera.lookAt(0, 0, 0);
}

// Global function for server-controlled camera updates
window.updateCameraFromServer = function(cameraData) {
    if (cameraData.angleX !== undefined) cameraAngleX = cameraData.angleX;
    if (cameraData.angleY !== undefined) cameraAngleY = cameraData.angleY;
    if (cameraData.distance !== undefined) cameraDistance = cameraData.distance;
    
    updateCameraPosition();
    console.log('Camera updated from server:', cameraAngleX, cameraAngleY, cameraDistance);
};

// Global function for animated entity property updates
window.updateEntityProperties = function(updateData) {
    const { entityId, changes, animate = true, duration = 500 } = updateData;
    
    // Find the entity in the scene
    const entity = app.root.findByName(entityId);
    if (!entity) {
        console.warn(`Entity ${entityId} not found for property update`);
        return;
    }
    
    console.log(`🎬 Updating ${entityId} properties:`, Object.keys(changes));
    
    // Define which properties can be animated
    const animatableProperties = ['position', 'rotation', 'scale', 'properties'];
    
    // Process all property changes
    Object.keys(changes).forEach(property => {
        const newValue = changes[property];
        
        // Check if this property can be animated
        if (animatableProperties.includes(property) && animate && window.pc && window.pc.Application.getApplication()) {
            // Apply with animation
            applyAnimatedPropertyChange(entity, property, newValue, duration);
        } else {
            // Apply immediately (either not animatable or animation disabled)
            applyImmediatePropertyChange(entity, property, newValue);
        }
    });
    
    // Force a render update
    if (window.app && window.app.render) {
        window.app.render();
    }
};

// Helper function for animated property changes
function applyAnimatedPropertyChange(entity, property, newValue, duration) {
    switch (property) {
        case 'position':
            if (Array.isArray(newValue) && newValue.length === 3) {
                const tween = entity.tween(entity.getLocalPosition())
                    .to(new pc.Vec3(newValue[0], newValue[1], newValue[2]), duration / 1000, pc.SineOut);
                tween.on('update', function (dt) {
                    entity.setLocalPosition(this.target);
                });
                tween.start();
            }
            break;
            
        case 'rotation':
            if (Array.isArray(newValue) && newValue.length === 3) {
                const tween = entity.tween(entity.getLocalEulerAngles())
                    .to(new pc.Vec3(newValue[0], newValue[1], newValue[2]), duration / 1000, pc.SineOut);
                tween.on('update', function (dt) {
                    entity.setLocalEulerAngles(this.target);
                });
                tween.start();
            }
            break;
            
        case 'scale':
            if (Array.isArray(newValue) && newValue.length === 3) {
                const tween = entity.tween(entity.getLocalScale())
                    .to(new pc.Vec3(newValue[0], newValue[1], newValue[2]), duration / 1000, pc.SineOut);
                tween.on('update', function (dt) {
                    entity.setLocalScale(this.target);
                });
                tween.start();
            }
            break;
            
        case 'properties':
            // Handle color animation
            if (newValue.color && Array.isArray(newValue.color) && newValue.color.length >= 3) {
                const render = entity.render;
                if (render && render.material) {
                    const currentColor = render.material.diffuse;
                    const targetColor = new pc.Color(newValue.color[0], newValue.color[1], newValue.color[2]);
                    
                    const tween = entity.tween(currentColor)
                        .to(targetColor, duration / 1000, pc.SineOut);
                    tween.on('update', function (dt) {
                        render.material.diffuse = this.target;
                        render.material.update();
                    });
                    tween.start();
                }
            }
            // Apply other properties immediately (not animatable)
            applyGenericProperties(entity, newValue);
            break;
    }
}

// Helper function for immediate property changes (generic for ANY property)
function applyImmediatePropertyChange(entity, property, newValue) {
    console.log(`⚡ Applying immediate change: ${property} =`, newValue);
    
    switch (property) {
        case 'position':
            if (Array.isArray(newValue) && newValue.length === 3) {
                entity.setLocalPosition(newValue[0], newValue[1], newValue[2]);
            }
            break;
        case 'rotation':
            if (Array.isArray(newValue) && newValue.length === 3) {
                entity.setLocalEulerAngles(newValue[0], newValue[1], newValue[2]);
            }
            break;
        case 'scale':
            if (Array.isArray(newValue) && newValue.length === 3) {
                entity.setLocalScale(newValue[0], newValue[1], newValue[2]);
            }
            break;
        case 'properties':
            applyGenericProperties(entity, newValue);
            break;
        case 'template':
            // Template changes require entity recreation - handled by server
            console.log(`📦 Template change detected: ${newValue}`);
            break;
        default:
            // Generic property - store in entity's custom data
            if (!entity.vttlData) entity.vttlData = {};
            entity.vttlData[property] = newValue;
            console.log(`📋 Generic property '${property}' stored:`, newValue);
            break;
    }
}

// Helper function for generic properties (color, model_url, etc.)
function applyGenericProperties(entity, properties) {
    if (!properties || typeof properties !== 'object') return;
    
    Object.keys(properties).forEach(propKey => {
        const propValue = properties[propKey];
        
        switch (propKey) {
            case 'color':
                if (Array.isArray(propValue) && propValue.length >= 3) {
                    const render = entity.render;
                    if (render && render.material) {
                        render.material.diffuse = new pc.Color(propValue[0], propValue[1], propValue[2]);
                        render.material.update();
                    }
                }
                break;
            case 'model_url':
                // Model URL changes require special handling - log for now
                console.log(`🎭 Model URL change detected: ${propValue}`);
                break;
            default:
                // Store any other custom properties
                if (!entity.vttlData) entity.vttlData = {};
                if (!entity.vttlData.properties) entity.vttlData.properties = {};
                entity.vttlData.properties[propKey] = propValue;
                console.log(`🏷️  Custom property '${propKey}' stored:`, propValue);
                break;
        }
    });
}

// Initialize entity manager - use new VTTL entity manager with light/camera/model support
const entityManager = new VTTLEntityManager();
entityManager.setApp(app); // Set the PlayCanvas app reference

// Register with game controller
gameController.setPlayCanvasApp(app);
gameController.setEntityManager(entityManager);

// Start the application
app.start();

// Initialize scene after app starts
initializeScene();

// Hide loading screen - more direct approach
setTimeout(() => {
    console.log('Attempting to hide loading screen...');
    
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
        console.log('Loading screen hidden successfully');
    } else {
        console.log('Loading element not found');
    }
    
    // Also try the global function if it exists
    if (typeof hideLoading === 'function') {
        hideLoading();
    }
    
    console.log('VTTL application ready!');
}, 2000); // Wait 2 seconds to be sure

console.log('VTTL PlayCanvas application started');