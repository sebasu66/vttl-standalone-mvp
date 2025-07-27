/**
 * Game Controller - Manages WebSocket communication and bridges PlayCanvas with server
 */

// VERSION TRACKING
const VTTL_VERSION = "1.4.2-devmode";
const BUILD_DATE = "2025-07-19T18:00:00Z";

class GameController {
    constructor() {
        this.version = VTTL_VERSION;
        this.buildDate = BUILD_DATE;
        this.ws = null;
        this.isConnected = false;
        this.gameState = { entities: {}, grid: {}, players: {} };
        this.playcanvasApp = null;
        this.entityManager = new VTTLEntityManager(); // Use new entity manager
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Log version info
        console.log(`🎮 VTTL Game Controller v${this.version} (${this.buildDate})`);
        console.log('📦 Features: Entity Classes, Lights, Cameras, Models');
        
        this.connect();
    }
    
    connect() {
        if (typeof updateConnectionStatus === 'function') {
            updateConnectionStatus('connecting');
        } else {
            console.log('Connecting to server...');
        }
        
        try {
            this.ws = new WebSocket('ws://localhost:8080');
            
            this.ws.onopen = () => {
                console.log(`Connected to VTTL server - Client v${this.version}`);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                if (typeof updateConnectionStatus === 'function') {
                    updateConnectionStatus('connected');
                } else {
                    console.log('Connected to server');
                }
                
                // Send version info to server
                this.sendMessage('client_version', {
                    version: this.version,
                    buildDate: this.buildDate,
                    features: ['entity-classes', 'lights', 'cameras', 'models', 'server-state', 'auto-reload']
                });

                // No need to initialize scene - server provides complete default state
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleServerMessage(message);
                } catch (error) {
                    console.error('Error parsing server message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from VTTL server');
                this.isConnected = false;
                if (typeof updateConnectionStatus === 'function') {
                    updateConnectionStatus('disconnected');
                } else {
                    console.log('Disconnected from server');
                }
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (typeof updateConnectionStatus === 'function') {
                    updateConnectionStatus('disconnected');
                } else {
                    console.log('WebSocket error');
                }
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            if (typeof updateConnectionStatus === 'function') {
                updateConnectionStatus('disconnected');
            } else {
                console.log('Failed to connect');
            }
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }
    
    handleServerMessage(message) {
        const { type, data } = message;
        
        switch (type) {
            case 'game_state':
            case 'game_state_update':
                this.updateGameState(data);
                break;
            case 'entities_list':
                this.updateEntities(data);
                break;
            case 'request_screenshot':
                // Server is requesting a screenshot
                console.log('Screenshot requested by server');
                setTimeout(() => this.sendScreenshot(), 1000); // Wait longer for render
                break;
            case 'camera_update':
                // Server is updating camera position
                console.log('Camera update received');
                if (window.updateCameraFromServer) {
                    window.updateCameraFromServer(data);
                }
                break;
            case 'entity_property_update':
                // Server is updating specific entity properties with animation
                console.log('Entity property update received:', data);
                if (window.updateEntityProperties) {
                    window.updateEntityProperties(data);
                }
                break;
            case 'create_light':
                // Server is creating a light
                console.log('Light creation received', data);
                this.createPlayCanvasLight(data);
                break;
            case 'set_ambient_light':
                // Server is setting ambient light
                console.log('Ambient light update received', data);
                this.setPlayCanvasAmbientLight(data);
                break;
            case 'enable_shadows':
                // Server is enabling/disabling shadows
                console.log('Shadow settings update received', data);
                this.setPlayCanvasShadows(data);
                break;
            case 'create_camera':
                // Server is creating a camera
                console.log('Camera creation received', data);
                this.createPlayCanvasCamera(data);
                break;
            case 'create_model':
                // Server is creating a model
                console.log('Model creation received', data);
                this.createPlayCanvasModel(data);
                break;
            case 'execute_javascript':
                // Server wants to execute JavaScript
                console.log('JavaScript execution received');
                this.executeJavaScript(data.code);
                break;
            case 'server_version':
                // Server version compatibility info
                console.log('📋 Server version info:', data);
                if (data.compatible === false) {
                    console.warn('⚠️ Client/Server version mismatch - some features may not work');
                }
                break;
            case 'error':
                console.error('Server error:', message.message);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }
    
    updateGameState(newState) {
        this.gameState = newState;
        
        // Update entity list UI with all categories after all objects are created
        setTimeout(() => {
            if (typeof updateEntityList === 'function') {
                console.log('🔍 Updating entity list...');
                console.log('   Entities from server:', Object.keys(newState.entities || {}));
                if (this.entityManager) {
                    console.log('   Models in EM:', this.entityManager.getAllModels().map(m => m.name));
                    console.log('   Lights in EM:', this.entityManager.getAllLights().map(l => l.name));
                    console.log('   Cameras in EM:', this.entityManager.getAllCameras().map(c => c.name));
                }
                updateEntityList(newState.entities || {});
            }
        }, 100);
        
        // Sync all categories with PlayCanvas scene if app is ready
        if (this.entityManager) {
            console.log('🔄 Syncing complete scene state from server...');
            
            // Sync entities
            this.entityManager.syncEntities(newState.entities || {});
            
            // Create models from server state
            if (newState.models) {
                Object.values(newState.models).forEach(model => {
                    if (!this.entityManager.models.has(model.name)) {
                        console.log(`📦 Creating model from server state: ${model.name}`);
                        this.createModelFromState(model);
                    }
                });
            }
            
            // Create lights from server state
            if (newState.lights) {
                Object.values(newState.lights).forEach(light => {
                    if (!this.entityManager.lights.has(light.name)) {
                        console.log(`💡 Creating light from server state: ${light.name}`);
                        this.createLightFromState(light);
                    }
                });
            }
            
            // Create cameras from server state
            if (newState.cameras) {
                Object.values(newState.cameras).forEach(camera => {
                    if (!this.entityManager.cameras.has(camera.name)) {
                        console.log(`📹 Creating camera from server state: ${camera.name}`);
                        this.createCameraFromState(camera);
                    }
                });
            }
            
            // Apply environment settings
            if (newState.ambientLight) {
                this.applyAmbientLight(newState.ambientLight);
            }
            
            if (newState.shadows) {
                this.applyShadowSettings(newState.shadows);
            }
        }
    }
    
    updateEntities(entities) {
        this.gameState.entities = entities;
        if (typeof updateEntityList === 'function') {
            updateEntityList(entities);
        }
        
        if (this.entityManager) {
            this.entityManager.syncEntities(entities);
        }
    }
    
    sendMessage(action, data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            const message = { action, data };
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('Not connected to server');
        }
    }
    
    // Game API Methods
    createEntity(entityData) {
        this.sendMessage('create_entity', entityData);
    }
    
    moveEntity(moveData) {
        this.sendMessage('move_entity', moveData);
    }
    
    deleteEntity(name) {
        this.sendMessage('delete_entity', { name });
    }
    
    setupBoard(boardData) {
        this.sendMessage('setup_board', boardData);
    }
    
    getEntities() {
        this.sendMessage('get_entities', {});
    }
    
    getGameState() {
        this.sendMessage('get_game_state', {});
    }
    
    clearScene() {
        // Delete all entities except core scene elements
        Object.keys(this.gameState.entities).forEach(name => {
            // Keep core scene elements
            if (!this.isCoreSceneElement(name)) {
                this.deleteEntity(name);
            }
        });
        
        // Reinitialize minimum scene setup
        this.initializeMinimumScene();
    }

    isCoreSceneElement(name) {
        const coreElements = ['GameTable', 'GameBoard', 'MainDirectionalLight', 'MainSpotLight', 'MainCamera'];
        return coreElements.includes(name);
    }

    initializeMinimumScene() {
        console.log('🎬 Initializing minimum scene setup...');
        
        // 1. Create game table
        this.sendMessage('create_model', {
            name: 'GameTable',
            modelType: 'plane',
            position: [0, 0, 0],
            scale: [20, 1, 20],
            color: [0.4, 0.3, 0.2],
            receiveShadows: true,
            material: 'wood'
        });

        // 2. Create game board (grid)
        this.sendMessage('create_model', {
            name: 'GameBoard',
            modelType: 'plane',
            position: [0, 0.01, 0],
            scale: [10, 1, 10],
            color: [0.8, 0.8, 0.6],
            receiveShadows: true,
            material: 'board'
        });

        // 3. Create main directional light
        this.sendMessage('create_light', {
            name: 'MainDirectionalLight',
            type: 'directional',
            position: [5, 15, 10],
            rotation: [45, -30, 0],
            color: [1, 0.95, 0.8],
            intensity: 2.0,
            castShadows: true
        });

        // 4. Create spot light for dramatic lighting
        this.sendMessage('create_light', {
            name: 'MainSpotLight',
            type: 'spot',
            position: [-8, 12, 8],
            rotation: [60, 30, 0],
            color: [0.9, 0.9, 1.0],
            intensity: 1.5,
            range: 25,
            innerConeAngle: 20,
            outerConeAngle: 45,
            castShadows: true
        });

        // 5. Create main camera with pan controls
        this.sendMessage('create_camera', {
            name: 'MainCamera',
            cameraType: 'perspective',
            position: [0, 18, 12],
            rotation: [-35, 0, 0],
            fov: 45,
            controlType: 'pan',
            setActive: true,
            panSpeed: 0.5,
            zoomSpeed: 0.3
        });

        // 6. Set ambient light
        this.sendMessage('set_ambient_light', {
            color: [0.3, 0.3, 0.4],
            intensity: 0.6
        });

        // 7. Enable shadows
        this.sendMessage('enable_shadows', {
            enabled: true,
            shadowType: 'pcf3',
            shadowResolution: 2048
        });

        // 8. Scene setup complete - elements will be created from server state
        // No auto-creation - server is source of truth

        console.log('✅ Minimum scene setup initialized');
    }

    // Helper methods to create objects from server state
    createModelFromState(modelData) {
        // Use entity manager to create model directly
        this.createPlayCanvasModel(modelData);
    }
    
    createLightFromState(lightData) {
        // Use entity manager to create light directly
        this.createPlayCanvasLight(lightData);
    }
    
    createCameraFromState(cameraData) {
        // Use entity manager to create camera directly
        this.createPlayCanvasCamera(cameraData);
    }
    
    applyAmbientLight(ambientData) {
        this.setPlayCanvasAmbientLight(ambientData);
    }
    
    applyShadowSettings(shadowData) {
        this.setPlayCanvasShadows(shadowData);
    }

    // Legacy method - now unused. Scene created from server state.
    createInitialGamePieces() {
        console.log('🎯 Clean scene ready - elements created from server state');
    }

    // Game piece movement methods
    movePiece(pieceName, newPosition, animate = true) {
        this.sendMessage('move_entity', {
            name: pieceName,
            to: newPosition,
            animate: animate
        });
        console.log(`🎯 Moving piece ${pieceName} to [${newPosition}]`);
    }

    // Utility method to move pieces in a pattern
    movePiecesInCircle() {
        const pieces = ['RedPiece1', 'GreenPiece1', 'BluePiece1', 'YellowPiece1'];
        pieces.forEach((piece, index) => {
            const angle = (index * Math.PI / 2) + Math.PI / 4;
            const radius = 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            setTimeout(() => {
                this.movePiece(piece, [x, 0.5, z], true);
            }, index * 500);
        });
    }

    // Demo function to showcase the board
    runDemo() {
        console.log('🎪 Running board demo...');
        
        setTimeout(() => {
            this.movePiecesInCircle();
        }, 1000);
        
        setTimeout(() => {
            // Move central die
            this.movePiece('CentralDie', [2, 0.5, 2], true);
        }, 3000);
        
        setTimeout(() => {
            // Move die back
            this.movePiece('CentralDie', [0, 0.5, 0], true);
        }, 5000);
    }

    isCoreSceneElement(name) {
        const coreElements = [
            'GameTable', 'GameBoard', 
            'MainDirectionalLight', 'MainSpotLight', 'MainCamera',
            'CentralDie'
        ];
        return coreElements.includes(name);
    }
    
    // Screenshot functionality for AI vision
    takeScreenshot() {
        if (this.playcanvasApp && this.playcanvasApp.graphicsDevice) {
            try {
                const canvas = this.playcanvasApp.graphicsDevice.canvas;
                console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
                
                // Force a render before screenshot
                this.playcanvasApp.render();
                
                const dataURL = canvas.toDataURL('image/png');
                console.log('Screenshot captured, size:', dataURL.length, 'characters');
                return dataURL;
            } catch (error) {
                console.error('Failed to take screenshot:', error);
                return null;
            }
        }
        console.error('PlayCanvas app or graphics device not available');
        return null;
    }
    
    // Send screenshot to server for AI analysis
    sendScreenshot() {
        const screenshot = this.takeScreenshot();
        if (screenshot) {
            this.sendMessage('screenshot', { 
                image: screenshot,
                timestamp: new Date().toISOString()
            });
            console.log('Screenshot sent to server');
            return true;
        }
        return false;
    }
    
    // Camera control
    setCameraAngle(angleX, angleY, distance) {
        this.sendMessage('set_camera', {
            angleX: angleX,
            angleY: angleY,
            distance: distance
        });
    }
    
    // Called by PlayCanvas app when ready
    setPlayCanvasApp(app) {
        this.playcanvasApp = app;
        console.log('PlayCanvas app registered with GameController');
    }
    
    setEntityManager(manager) {
        this.entityManager = manager;
        console.log('EntityManager registered with GameController');
        
        // Sync current entities if any
        if (Object.keys(this.gameState.entities).length > 0) {
            this.entityManager.syncEntities(this.gameState.entities);
        }
    }

    createPlayCanvasLight(lightData) {
        const { name } = lightData;
        
        // Use entity manager to create light
        const lightEntity = this.entityManager.createEntity(name, 'light', lightData);
        
        if (lightEntity) {
            console.log(`✅ Created light using VTTLLight class: ${name}`);
            console.log('   Type:', lightData.lightType || lightData.type);
            console.log('   Position:', lightData.position);
            console.log('   Color:', lightData.color);
            console.log('   Intensity:', lightData.intensity);
        } else {
            console.error(`❌ Failed to create light: ${name}`);
        }
    }

    setPlayCanvasAmbientLight(ambientData) {
        if (!window.app) {
            console.warn('PlayCanvas app not ready, cannot set ambient light');
            return;
        }

        const { color, intensity } = ambientData;
        
        // Set ambient light
        window.app.scene.ambientLight = new pc.Color(
            color[0] * intensity, 
            color[1] * intensity, 
            color[2] * intensity
        );

        console.log(`✅ Set ambient light: [${color[0]}, ${color[1]}, ${color[2]}] * ${intensity}`);
    }

    setPlayCanvasShadows(shadowData) {
        if (!window.app) {
            console.warn('PlayCanvas app not ready, cannot set shadows');
            return;
        }

        const { enabled, shadowType, shadowResolution } = shadowData;
        
        // Enable/disable shadows globally
        window.app.scene.shadowsEnabled = enabled;

        console.log(`✅ Shadows ${enabled ? 'enabled' : 'disabled'}`);
        if (enabled) {
            console.log(`   Shadow type: ${shadowType}`);
            console.log(`   Shadow resolution: ${shadowResolution}`);
        }
    }

    createPlayCanvasCamera(cameraData) {
        const { name } = cameraData;
        
        // Use entity manager to create camera
        const cameraEntity = this.entityManager.createEntity(name, 'camera', cameraData);
        
        if (cameraEntity) {
            console.log(`✅ Created camera using VTTLCamera class: ${name}`);
            console.log('   Type:', cameraData.cameraType);
            console.log('   Position:', cameraData.position);
            console.log('   FOV:', cameraData.fov);
            console.log('   Control:', cameraData.controlType);
            
            // Set as active camera if requested
            if (cameraData.setActive) {
                cameraEntity.setActive();
            }
        } else {
            console.error(`❌ Failed to create camera: ${name}`);
        }
    }

    createPlayCanvasModel(modelData) {
        const { name } = modelData;
        
        // Use entity manager to create model
        const modelEntity = this.entityManager.createEntity(name, 'model', modelData);
        
        if (modelEntity) {
            console.log(`✅ Created model using VTTLModel class: ${name}`);
            console.log('   Type:', modelData.modelType || modelData.template);
            console.log('   Position:', modelData.position);
            console.log('   Color:', modelData.color);
            console.log('   Physics:', modelData.physics);
        } else {
            console.error(`❌ Failed to create model: ${name}`);
        }
    }

    executeJavaScript(code) {
        try {
            console.log('🔧 Executing server-sent JavaScript...');
            
            // Make gameController globally accessible for the executed code
            window.gameController = this;
            
            // Create a function to execute the code with access to app and other globals
            const executeCode = new Function('app', 'pc', 'console', 'entityManager', 'gameController', code);
            const result = executeCode(window.app, window.pc, console, this.entityManager, this);
            
            console.log('✅ JavaScript executed successfully');
            
            // Send success response back to server
            this.sendMessage('javascript_result', {
                status: 'success',
                result: result || 'Command executed successfully',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ JavaScript execution failed:', error);
            
            // Send error response back to server
            this.sendMessage('javascript_result', {
                status: 'error',
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Entity management methods
    getEntityInfo() {
        return this.entityManager.getEntityInfo();
    }

    getEntity(name) {
        return this.entityManager.getEntity(name);
    }

    updateEntity(name, data) {
        this.entityManager.updateEntity(name, data);
    }

    deleteEntity(name) {
        this.entityManager.deleteEntity(name);
    }
}

// Create global game controller instance
const gameController = new GameController();