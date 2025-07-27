const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');

// VERSION TRACKING
const VTTL_SERVER_VERSION = "1.4.2-devmode";
const SERVER_BUILD_DATE = "2025-07-19T18:00:00Z";

class VTTLGameServer {
    constructor() {
        this.version = VTTL_SERVER_VERSION;
        this.buildDate = SERVER_BUILD_DATE;
        this.port = process.env.PORT || 8080;
        this.httpPort = process.env.HTTP_PORT || 3001;
        this.clients = new Set();
        // Initialize complete game state with default scene
        this.gameState = this.createDefaultGameState();
        
        console.log(`🚀 VTTL Game Server v${this.version} (${this.buildDate})`);
        console.log('📦 Features: Lights, Cameras, Models, Entity Classes');
        
        this.setupHTTPServer();
        this.setupWebSocketServer();
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
                serverVersion: this.version,
                serverBuildDate: this.buildDate,
                created: timestamp,
                lastModified: timestamp
            }
        };
    }

    setupHTTPServer() {
        this.app = express();
        this.app.use(cors());
        
        // Serve client files
        this.app.use('/client', express.static(path.join(__dirname, '../client')));
        
        // Serve multicam build files and assets
        this.app.use(express.static(path.join(__dirname, '..')));
        
        // Default route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });

        this.app.listen(this.httpPort, () => {
            console.log(`HTTP Server running on http://localhost:${this.httpPort}`);
            console.log(`Serving client files from: /client/`);
            console.log(`Serving multicam assets from: /`);
        });
    }

    setupWebSocketServer() {
        // Create WebSocket server that shares the HTTP server
        this.wss = new WebSocket.Server({ 
            port: this.port,
            perMessageDeflate: false,
            clientTracking: true
        });
        
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            this.clients.add(ws);
            
            // Send current game state to new client
            this.sendToClient(ws, {
                type: 'game_state',
                data: this.gameState
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Invalid JSON:', error);
                    this.sendError(ws, 'Invalid JSON message');
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        console.log(`WebSocket Server running on ws://localhost:${this.port}`);
    }

    handleMessage(ws, message) {
        const { action, data } = message;

        try {
            switch (action) {
                case 'create_entity':
                    this.createEntity(data);
                    break;
                case 'move_entity':
                    this.moveEntity(data);
                    break;
                case 'delete_entity':
                    this.deleteEntity(data);
                    break;
                case 'setup_board':
                    this.setupBoard(data);
                    break;
                case 'get_entities':
                    this.sendToClient(ws, {
                        type: 'entities_list',
                        data: this.gameState.entities
                    });
                    return;
                case 'get_game_state':
                    this.sendToClient(ws, {
                        type: 'game_state',
                        data: this.gameState
                    });
                    return;
                case 'screenshot':
                    this.handleScreenshot(data);
                    this.sendToClient(ws, {
                        type: 'screenshot_received',
                        message: 'Screenshot saved successfully'
                    });
                    return;
                case 'get_screenshot':
                    // Request screenshot from all web clients
                    this.requestScreenshotFromClients();
                    this.sendToClient(ws, {
                        type: 'screenshot_requested',
                        message: 'Screenshot request sent to clients'
                    });
                    return;
                case 'set_camera':
                    this.setCameraPosition(data);
                    this.broadcastGameState();
                    return;
                case 'create_light':
                    this.createLight(data);
                    break;
                case 'set_ambient_light':
                    this.setAmbientLight(data);
                    break;
                case 'enable_shadows':
                    this.enableShadows(data);
                    break;
                case 'execute_javascript':
                    this.executeJavaScript(data);
                    break;
                case 'create_camera':
                    this.createCamera(data);
                    break;
                case 'create_model':
                    this.createModel(data);
                    break;
                case 'client_version':
                    this.handleClientVersion(ws, data);
                    return;
                case 'register_existing_entity':
                    this.registerExistingEntity(data);
                    this.broadcastGameState();
                    return;
                case 'javascript_result':
                    this.handleJavaScriptResult(data);
                    return;
                default:
                    this.sendError(ws, `Unknown action: ${action}`);
                    return;
            }

            // Broadcast changes to all clients
            this.broadcastGameState();
            
        } catch (error) {
            console.error('Error handling message:', error);
            this.sendError(ws, error.message);
        }
    }

    createEntity(data) {
        const { name, template, position, owner, properties } = data;
        
        if (this.gameState.entities[name]) {
            throw new Error(`Entity ${name} already exists`);
        }

        const entity = {
            name,
            template: template || 'default_cube',
            position: position || [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            owner: owner || null,
            properties: properties || {},
            created: new Date().toISOString()
        };

        this.gameState.entities[name] = entity;
        console.log(`Created entity: ${name}`);
    }

    registerExistingEntity(data) {
        const { name, template, position, rotation, scale, owner, properties } = data;
        
        // Only register if not already exists
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
            console.log(`Registered existing PlayCanvas entity: ${name}`);
        }
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
        
        // Update position in the appropriate category
        target.position = to;
        target.lastMove = {
            from,
            to,
            animate: animate || false,
            timestamp: new Date().toISOString()
        };
        
        // Update metadata
        this.gameState.meta.lastModified = new Date().toISOString();

        console.log(`Moved ${category}/${name} from [${from}] to [${to}]`);
    }

    deleteEntity(data) {
        const { name } = data;
        
        if (!this.gameState.entities[name]) {
            throw new Error(`Entity ${name} not found`);
        }

        delete this.gameState.entities[name];
        console.log(`Deleted entity: ${name}`);
    }

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

        console.log(`Setup board: ${type} ${width}x${height}`);
    }

    handleScreenshot(data) {
        const { image, timestamp } = data;
        
        if (!image || !image.startsWith('data:image/png;base64,')) {
            throw new Error('Invalid screenshot data');
        }
        
        // Store screenshot info
        this.gameState.lastScreenshot = {
            timestamp,
            size: Math.round(image.length / 1024) + ' KB'
        };
        
        // Save screenshot to file system
        const fs = require('fs');
        const path = require('path');
        
        try {
            const base64Data = image.replace(/^data:image\/png;base64,/, '');
            const filename = `screenshot_${timestamp.replace(/[:.]/g, '-')}.png`;
            const filepath = path.join(__dirname, '../screenshots', filename);
            
            // Ensure screenshots directory exists
            const screenshotDir = path.join(__dirname, '../screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            fs.writeFileSync(filepath, base64Data, 'base64');
            console.log(`Screenshot saved: ${filename}`);
            
            // Store the latest screenshot path for AI access
            this.gameState.latestScreenshotPath = filepath;
            
        } catch (error) {
            console.error('Failed to save screenshot:', error);
            throw error;
        }
    }

    requestScreenshotFromClients() {
        const message = {
            type: 'request_screenshot',
            timestamp: new Date().toISOString()
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log('Screenshot request sent to all clients');
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

        // Broadcast camera change to all clients
        const message = {
            type: 'camera_update',
            data: this.gameState.cameraSettings
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log('Camera position updated');
    }

    broadcastGameState() {
        const message = {
            type: 'game_state_update',
            data: this.gameState,
            timestamp: new Date().toISOString()
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });
    }

    sendToClient(client, message) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    }

    sendError(client, error) {
        this.sendToClient(client, {
            type: 'error',
            message: error,
            timestamp: new Date().toISOString()
        });
    }

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

        // Store light data in unified game state
        this.gameState.lights[lightData.name] = lightData;
        
        // Update metadata
        this.gameState.meta.lastModified = new Date().toISOString();

        console.log(`Created light: ${lightData.name} (${lightData.lightType})`);
    }

    setAmbientLight(data) {
        const { color, intensity } = data;
        
        this.gameState.ambientLight = {
            color: color || [0.3, 0.3, 0.35],
            intensity: intensity || 0.4,
            updated: new Date().toISOString()
        };

        // Broadcast ambient light change to all clients
        const message = {
            type: 'set_ambient_light',
            data: this.gameState.ambientLight
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log('Ambient light updated');
    }

    enableShadows(data) {
        const { enabled, shadowType, shadowResolution } = data;
        
        this.gameState.shadows = {
            enabled: enabled !== undefined ? enabled : true,
            shadowType: shadowType || 'pcf3',
            shadowResolution: shadowResolution || 2048,
            updated: new Date().toISOString()
        };

        // Broadcast shadow settings to all clients
        const message = {
            type: 'enable_shadows',
            data: this.gameState.shadows
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log(`Shadows ${enabled ? 'enabled' : 'disabled'}`);
    }

    executeJavaScript(data) {
        const { code } = data;
        
        if (!code) {
            throw new Error('No JavaScript code provided');
        }

        // Broadcast JavaScript execution to all clients
        const message = {
            type: 'execute_javascript',
            data: { code },
            timestamp: new Date().toISOString()
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log('JavaScript execution request sent to clients');
    }

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

        // Store camera data in game state
        if (!this.gameState.cameras) {
            this.gameState.cameras = {};
        }
        this.gameState.cameras[cameraData.name] = cameraData;

        // Broadcast camera creation to all clients
        const message = {
            type: 'create_camera',
            data: cameraData
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log(`Created camera: ${cameraData.name} (${cameraData.cameraType})`);
    }

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

        // Store model data in game state
        if (!this.gameState.models) {
            this.gameState.models = {};
        }
        this.gameState.models[modelData.name] = modelData;

        // Broadcast model creation to all clients
        const message = {
            type: 'create_model',
            data: modelData
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log(`Created model: ${modelData.name} (${modelData.modelType})`);
    }

    handleClientVersion(ws, data) {
        const { version, buildDate, features } = data;
        console.log(`📱 Client connected: v${version} (${buildDate})`);
        console.log(`   Features: ${features.join(', ')}`);
        
        // Send server version back
        this.sendToClient(ws, {
            type: 'server_version',
            data: {
                serverVersion: this.version,
                serverBuildDate: this.buildDate,
                compatible: version === this.version
            }
        });
    }


    handleJavaScriptResult(data) {
        const { status, result, error, timestamp } = data;
        
        if (status === 'success') {
            console.log(`✅ JavaScript executed successfully at ${timestamp}`);
            if (result && result !== 'Command executed successfully') {
                console.log(`   Result: ${result}`);
            }
        } else if (status === 'error') {
            console.log(`❌ JavaScript execution failed at ${timestamp}`);
            console.log(`   Error: ${error}`);
        }
    }
}

// Start the server
const server = new VTTLGameServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});