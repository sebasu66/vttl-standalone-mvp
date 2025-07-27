/**
 * GameStateManager - Manages the complete game state including entities, models, lights, cameras
 */

class GameStateManager {
    constructor(serverVersion, serverBuildDate) {
        this.serverVersion = serverVersion;
        this.serverBuildDate = serverBuildDate;
        this.gameState = this.createDefaultGameState();
    }

    createDefaultGameState() {
        const timestamp = new Date().toISOString();
        
        return {
            // Game entities (created via VTTL API)
            entities: {},
            
            // 3D Models (static scene objects)
            models: {
                'GameTable': {
                    name: 'GameTable',
                    type: 'model',
                    modelType: 'plane',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [20, 1, 20],
                    color: [0.4, 0.3, 0.2],
                    castShadows: false,
                    receiveShadows: true,
                    material: 'wood',
                    collisionBox: { width: 20, height: 1, depth: 20 },
                    created: timestamp
                }
            },
            
            // Lighting system
            lights: {
                'MainDirectionalLight': {
                    name: 'MainDirectionalLight',
                    type: 'light',
                    lightType: 'directional',
                    position: [5, 15, 10],
                    rotation: [45, -30, 0],
                    color: [1, 0.95, 0.8],
                    intensity: 2.0,
                    castShadows: true,
                    shadowBias: 0.02,
                    shadowDistance: 50,
                    enabled: true,
                    created: timestamp
                },
                'MainSpotLight': {
                    name: 'MainSpotLight',
                    type: 'light',
                    lightType: 'spot',
                    position: [-8, 12, 8],
                    rotation: [60, 45, 0],
                    color: [0.9, 0.9, 1],
                    intensity: 1.5,
                    range: 20,
                    castShadows: true,
                    shadowBias: 0.02,
                    shadowDistance: 50,
                    innerConeAngle: 20,
                    outerConeAngle: 40,
                    enabled: true,
                    created: timestamp
                }
            },
            
            // Camera system
            cameras: {
                'MainCamera': {
                    name: 'MainCamera',
                    type: 'camera',
                    cameraType: 'perspective',
                    position: [0, 18, 12],
                    rotation: [0, 0, 0],
                    fov: 45,
                    nearClip: 0.1,
                    farClip: 1000,
                    clearColor: [0.1, 0.2, 0.3, 1],
                    controlType: 'pan',
                    active: true,
                    created: timestamp
                }
            },
            
            // Game configuration
            grid: { size: 1.0, width: 20, height: 20 },
            players: {},
            
            // Environment settings
            ambientLight: {
                color: [0.3, 0.3, 0.4],
                intensity: 0.6
            },
            shadows: {
                enabled: true,
                shadowType: 'pcf3',
                shadowResolution: 2048
            },
            
            // Metadata
            meta: {
                serverVersion: this.serverVersion,
                serverBuildDate: this.serverBuildDate,
                created: timestamp,
                lastModified: timestamp
            }
        };
    }

    // Entity management
    createEntity(data) {
        const { name, template, position, owner, properties } = data;
        
        if (this.gameState.entities[name]) {
            throw new Error(`Entity ${name} already exists`);
        }

        // Handle model entities specially - use model_url as template for GLB loading
        let entityTemplate = template || 'default_cube';
        if (template === 'model' && properties && properties.model_url) {
            entityTemplate = properties.model_url; // Client expects GLB path in template field
        }

        // Calculate collision box based on template type
        const collisionBox = this.calculateCollisionBox(template || 'default_cube', data.scale || [1, 1, 1]);

        const entity = {
            name,
            template: entityTemplate, // This will be the GLB path for models
            position: position || [0, 0, 0],
            rotation: data.rotation || [0, 0, 0],
            scale: data.scale || properties?.scale || [1, 1, 1],
            owner: owner || null,
            properties: properties || {},
            collisionBox: collisionBox,
            created: new Date().toISOString()
        };

        this.gameState.entities[name] = entity;
        this.updateLastModified();
        return entity;
    }

    calculateCollisionBox(template, scale = [1, 1, 1]) {
        // Define base collision boxes for different entity types
        const baseBoxes = {
            'cube': { width: 1.0, height: 1.0, depth: 1.0 },
            'default_cube': { width: 1.0, height: 1.0, depth: 1.0 },
            'sphere': { width: 1.0, height: 1.0, depth: 1.0 },
            'cylinder': { width: 1.0, height: 1.0, depth: 1.0 },
            'model': { width: 1.0, height: 1.0, depth: 1.0 }, // Default for GLB models
        };

        const baseBox = baseBoxes[template] || baseBoxes['cube'];
        
        return {
            width: baseBox.width * scale[0],
            height: baseBox.height * scale[1],
            depth: baseBox.depth * scale[2]
        };
    }

    registerExistingEntity(data) {
        const { name, template, position, rotation, scale, owner, properties } = data;
        
        if (!this.gameState.entities[name]) {
            const entity = {
                name,
                template: template || 'playcanvas_asset',
                position: position || [0, 0, 0],
                rotation: rotation || [0, 0, 0],
                scale: scale || [1, 1, 1],
                owner: owner || 'playcanvas_scene',
                properties: properties || {},
                created: new Date().toISOString(),
                source: 'playcanvas_editor'
            };

            this.gameState.entities[name] = entity;
            this.updateLastModified();
            return entity;
        }
        return null;
    }

    moveEntity(data) {
        const { name, to, animate } = data;
        
        // Search for entity across all categories
        let target = null;
        let category = null;
        
        if (this.gameState.entities[name]) {
            target = this.gameState.entities[name];
            category = 'entities';
        } else if (this.gameState.models[name]) {
            target = this.gameState.models[name];
            category = 'models';
        } else if (this.gameState.lights[name]) {
            target = this.gameState.lights[name];
            category = 'lights';
        } else if (this.gameState.cameras[name]) {
            target = this.gameState.cameras[name];
            category = 'cameras';
        }
        
        if (!target) {
            throw new Error(`Object ${name} not found in any category`);
        }

        const from = [...target.position];
        
        // Check for collisions before moving
        const collisions = this.checkPositionCollisions(name, to);
        const onTable = this.isPositionOnTable(to);

        // Log collision warnings but allow movement (for flexibility)
        if (collisions.length > 0) {
            console.warn(`⚠️  ${name} movement to [${to}] has ${collisions.length} collision(s):`);
            collisions.forEach(collision => {
                console.warn(`   - Collides with ${collision.type}: ${collision.name}`);
            });
        }

        if (!onTable) {
            console.warn(`⚠️  ${name} movement to [${to}] is off the table`);
        }

        // Update position in the appropriate category
        target.position = to;
        target.lastMove = {
            from,
            to,
            animate: animate !== undefined ? animate : true,
            collisions: collisions,
            onTable: onTable,
            timestamp: new Date().toISOString()
        };
        
        this.updateLastModified();
        return { category, from, to };
    }

    // Collision detection methods
    checkCollision(entityA, entityB) {
        const boxA = entityA.collisionBox;
        const boxB = entityB.collisionBox;
        const posA = entityA.position;
        const posB = entityB.position;

        if (!boxA || !boxB) return false;

        // AABB (Axis-Aligned Bounding Box) collision detection
        const overlapX = Math.abs(posA[0] - posB[0]) < (boxA.width / 2 + boxB.width / 2);
        const overlapY = Math.abs(posA[1] - posB[1]) < (boxA.height / 2 + boxB.height / 2);
        const overlapZ = Math.abs(posA[2] - posB[2]) < (boxA.depth / 2 + boxB.depth / 2);

        return overlapX && overlapY && overlapZ;
    }

    checkPositionCollisions(entityName, newPosition) {
        const entity = this.findEntity(entityName);
        if (!entity) return [];

        const collisions = [];
        const tempEntity = { ...entity, position: newPosition };

        // Check against all entities
        for (const [name, otherEntity] of Object.entries(this.gameState.entities)) {
            if (name !== entityName && this.checkCollision(tempEntity, otherEntity)) {
                collisions.push({ type: 'entity', name, object: otherEntity });
            }
        }

        // Check against all models (including table)
        for (const [name, model] of Object.entries(this.gameState.models)) {
            if (this.checkCollision(tempEntity, model)) {
                collisions.push({ type: 'model', name, object: model });
            }
        }

        return collisions;
    }

    isPositionOnTable(position) {
        const table = this.gameState.models['GameTable'];
        if (!table) return true; // No table, allow positioning anywhere

        const tableBox = table.collisionBox;
        const tablePos = table.position;

        // Check if position is within table bounds (X and Z), and at appropriate height
        const withinX = Math.abs(position[0] - tablePos[0]) <= tableBox.width / 2;
        const withinZ = Math.abs(position[2] - tablePos[2]) <= tableBox.depth / 2;
        const appropriateHeight = position[1] >= tablePos[1] + tableBox.height / 2; // Above table surface

        return withinX && withinZ && appropriateHeight;
    }

    findEntity(name) {
        if (this.gameState.entities[name]) return this.gameState.entities[name];
        if (this.gameState.models[name]) return this.gameState.models[name];
        if (this.gameState.lights[name]) return this.gameState.lights[name];
        if (this.gameState.cameras[name]) return this.gameState.cameras[name];
        return null;
    }

    rotateEntity(data) {
        const { name, to, animate } = data;
        
        // Search for entity across all categories
        let target = null;
        let category = null;
        
        if (this.gameState.entities[name]) {
            target = this.gameState.entities[name];
            category = 'entities';
        } else if (this.gameState.models[name]) {
            target = this.gameState.models[name];
            category = 'models';
        } else if (this.gameState.lights[name]) {
            target = this.gameState.lights[name];
            category = 'lights';
        } else if (this.gameState.cameras[name]) {
            target = this.gameState.cameras[name];
            category = 'cameras';
        }
        
        if (!target) {
            throw new Error(`Object ${name} not found in any category`);
        }

        const from = [...target.rotation];
        
        // Update rotation in the appropriate category
        target.rotation = to;
        target.lastRotate = {
            from,
            to,
            animate: animate !== undefined ? animate : true,
            timestamp: new Date().toISOString()
        };
        
        this.updateLastModified();
        return { category, from, to };
    }

    deleteEntity(data) {
        const { name } = data;
        
        if (!this.gameState.entities[name]) {
            throw new Error(`Entity ${name} not found`);
        }

        delete this.gameState.entities[name];
        this.updateLastModified();
        return true;
    }

    clearAllEntities() {
        const entityCount = Object.keys(this.gameState.entities).length;
        this.gameState.entities = {};
        this.updateLastModified();
        console.log(`🧹 Cleared ${entityCount} entities from game state`);
        return entityCount;
    }

    // Model management
    createModel(data) {
        const { name, modelType, template, position, rotation, scale, color, material, physics, collisionType, castShadows, receiveShadows } = data;
        
        const modelData = {
            name: name || `model_${Date.now()}`,
            type: 'model',
            modelType: modelType || template || 'cube',
            position: position || [0, 0, 0],
            rotation: rotation || [0, 0, 0],
            scale: scale || [1, 1, 1],
            color: color || [1, 1, 1],
            material: material || null,
            physics: physics || null,
            collisionType: collisionType || 'box',
            castShadows: castShadows !== undefined ? castShadows : true,
            receiveShadows: receiveShadows !== undefined ? receiveShadows : true,
            created: new Date().toISOString()
        };

        this.gameState.models[modelData.name] = modelData;
        this.updateLastModified();
        return modelData;
    }

    // Light management
    createLight(data) {
        const { name, type, position, rotation, color, intensity, range, castShadows, shadowBias, shadowDistance, innerConeAngle, outerConeAngle } = data;
        
        const lightData = {
            name: name || `light_${Date.now()}`,
            type: 'light',
            lightType: type || 'directional',
            position: position || [0, 5, 0],
            rotation: rotation || [45, -30, 0],
            color: color || [1, 1, 1],
            intensity: intensity || 1.0,
            range: range || 10,
            castShadows: castShadows !== undefined ? castShadows : true,
            shadowBias: shadowBias || 0.02,
            shadowDistance: shadowDistance || 50,
            created: new Date().toISOString()
        };

        // Add spot light specific parameters
        if (type === 'spot') {
            lightData.innerConeAngle = innerConeAngle || 20;
            lightData.outerConeAngle = outerConeAngle || 40;
        }

        this.gameState.lights[lightData.name] = lightData;
        this.updateLastModified();
        return lightData;
    }

    // Camera management
    createCamera(data) {
        const { name, cameraType, position, rotation, fov, nearClip, farClip, clearColor, controlType, setActive } = data;
        
        const cameraData = {
            name: name || `camera_${Date.now()}`,
            type: 'camera',
            cameraType: cameraType || 'perspective',
            position: position || [0, 5, 10],
            rotation: rotation || [0, 0, 0],
            fov: fov || 45,
            nearClip: nearClip || 0.1,
            farClip: farClip || 1000,
            clearColor: clearColor || [0.1, 0.2, 0.3, 1],
            controlType: controlType || 'orbit',
            setActive: setActive !== undefined ? setActive : false,
            created: new Date().toISOString()
        };

        this.gameState.cameras[cameraData.name] = cameraData;
        this.updateLastModified();
        return cameraData;
    }

    // Board setup
    setupBoard(data) {
        const { type, size, width, height } = data;
        
        this.gameState.grid = {
            type: type || 'square',
            size: size || 1.0,
            width: width || 20,
            height: height || 20
        };

        // Create board tiles if needed
        if (data.createTiles) {
            for (let x = 0; x < width; x++) {
                for (let z = 0; z < height; z++) {
                    const tileName = `tile_${x}_${z}`;
                    this.gameState.entities[tileName] = {
                        name: tileName,
                        template: 'board_tile',
                        position: [x * size, -0.1, z * size],
                        rotation: [0, 0, 0],
                        scale: [size, 0.1, size],
                        owner: null,
                        properties: { gridX: x, gridZ: z },
                        created: new Date().toISOString()
                    };
                }
            }
        }

        this.updateLastModified();
        return this.gameState.grid;
    }

    // Environment settings
    setAmbientLight(data) {
        const { color, intensity } = data;
        
        this.gameState.ambientLight = {
            color: color || [0.3, 0.3, 0.35],
            intensity: intensity || 0.4,
            updated: new Date().toISOString()
        };

        this.updateLastModified();
        return this.gameState.ambientLight;
    }

    enableShadows(data) {
        const { enabled, shadowType, shadowResolution } = data;
        
        this.gameState.shadows = {
            enabled: enabled !== undefined ? enabled : true,
            shadowType: shadowType || 'pcf3',
            shadowResolution: shadowResolution || 2048,
            updated: new Date().toISOString()
        };

        this.updateLastModified();
        return this.gameState.shadows;
    }

    setCameraPosition(data) {
        const { position, target, distance, angleX, angleY } = data;
        
        this.gameState.cameraSettings = {
            position: position || [0, 15, 10],
            target: target || [0, 0, 0],
            distance: distance || 20,
            angleX: angleX || 30,
            angleY: angleY || 0,
            timestamp: new Date().toISOString()
        };

        this.updateLastModified();
        return this.gameState.cameraSettings;
    }

    // Utility methods
    updateLastModified() {
        this.gameState.meta.lastModified = new Date().toISOString();
    }

    getGameState() {
        return this.gameState;
    }

    getEntities() {
        return this.gameState.entities;
    }

    updateScreenshotInfo(screenshot) {
        this.gameState.lastScreenshot = {
            timestamp: screenshot.timestamp,
            size: Math.round(screenshot.image.length / 1024) + ' KB'
        };
        this.gameState.latestScreenshotPath = screenshot.filepath;
        this.updateLastModified();
    }
}

module.exports = GameStateManager;