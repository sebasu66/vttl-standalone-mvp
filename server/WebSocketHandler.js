/**
 * WebSocketHandler - Manages WebSocket server and client communication
 */

const WebSocket = require('ws');

class WebSocketHandler {
    constructor(port, gameStateManager, screenshotManager) {
        this.port = port;
        this.gameStateManager = gameStateManager;
        this.screenshotManager = screenshotManager;
        this.clients = new Set();
        this.wss = null;
        
        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
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
                data: this.gameStateManager.getGameState()
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
                    this.gameStateManager.createEntity(data);
                    this.broadcastGameState();
                    break;
                case 'move_entity':
                    const moveResult = this.gameStateManager.moveEntity(data);
                    console.log(`Moved ${moveResult.category}/${data.name} from [${moveResult.from}] to [${moveResult.to}]`);
                    this.broadcastGameState();
                    break;
                case 'rotate_entity':
                    const rotateResult = this.gameStateManager.rotateEntity(data);
                    console.log(`Rotated ${rotateResult.category}/${data.name} from [${rotateResult.from}] to [${rotateResult.to}]`);
                    this.broadcastGameState();
                    break;
                case 'delete_entity':
                    this.gameStateManager.deleteEntity(data);
                    console.log(`Deleted entity: ${data.name}`);
                    this.broadcastGameState();
                    break;
                case 'setup_board':
                    this.gameStateManager.setupBoard(data);
                    console.log(`Setup board: ${data.type} ${data.width}x${data.height}`);
                    this.broadcastGameState();
                    break;
                case 'get_entities':
                    this.sendToClient(ws, {
                        type: 'entities_list',
                        data: this.gameStateManager.getEntities()
                    });
                    return;
                case 'get_game_state':
                    this.sendToClient(ws, {
                        type: 'game_state',
                        data: this.gameStateManager.getGameState()
                    });
                    return;
                case 'screenshot':
                    this.screenshotManager.handleScreenshot(data);
                    this.sendToClient(ws, {
                        type: 'screenshot_received',
                        message: 'Screenshot saved successfully'
                    });
                    return;
                case 'get_screenshot':
                    this.requestScreenshotFromClients();
                    this.sendToClient(ws, {
                        type: 'screenshot_requested',
                        message: 'Screenshot request sent to clients'
                    });
                    return;
                case 'set_camera':
                    this.gameStateManager.setCameraPosition(data);
                    this.broadcastCameraUpdate();
                    return;
                case 'create_light':
                    const lightData = this.gameStateManager.createLight(data);
                    console.log(`Created light: ${lightData.name} (${lightData.lightType})`);
                    this.broadcastGameState();
                    break;
                case 'set_ambient_light':
                    this.gameStateManager.setAmbientLight(data);
                    console.log('Ambient light updated');
                    this.broadcastGameState();
                    break;
                case 'enable_shadows':
                    const shadowData = this.gameStateManager.enableShadows(data);
                    console.log(`Shadows ${shadowData.enabled ? 'enabled' : 'disabled'}`);
                    this.broadcastGameState();
                    break;
                case 'execute_javascript':
                    this.executeJavaScript(data);
                    break;
                case 'create_camera':
                    const cameraData = this.gameStateManager.createCamera(data);
                    console.log(`Created camera: ${cameraData.name} (${cameraData.cameraType})`);
                    this.broadcastGameState();
                    break;
                case 'create_model':
                    const modelData = this.gameStateManager.createModel(data);
                    console.log(`Created model: ${modelData.name} (${modelData.modelType})`);
                    this.broadcastGameState();
                    break;
                case 'client_version':
                    this.handleClientVersion(ws, data);
                    return;
                case 'register_existing_entity':
                    this.gameStateManager.registerExistingEntity(data);
                    console.log(`Registered existing entity: ${data.name}`);
                    this.broadcastGameState();
                    return;
                case 'check_collisions':
                    const collisionResult = this.gameStateManager.checkPositionCollisions(data.name, data.position);
                    const onTable = this.gameStateManager.isPositionOnTable(data.position);
                    this.sendToClient(ws, {
                        type: 'collision_check_result',
                        data: {
                            name: data.name,
                            position: data.position,
                            collisions: collisionResult,
                            onTable: onTable
                        }
                    });
                    return;
                case 'javascript_result':
                    this.handleJavaScriptResult(data);
                    return;
                default:
                    this.sendError(ws, `Unknown action: ${action}`);
                    return;
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
            this.sendError(ws, error.message);
        }
    }

    broadcastGameState() {
        const message = {
            type: 'game_state_update',
            data: this.gameStateManager.getGameState(),
            timestamp: new Date().toISOString()
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });
    }

    broadcastCameraUpdate() {
        const cameraSettings = this.gameStateManager.getGameState().cameraSettings;
        const message = {
            type: 'camera_update',
            data: cameraSettings
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });

        console.log('Camera position updated');
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

    // Generic method to broadcast any message to all clients
    broadcastToClients(message) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, message);
            }
        });
        
        console.log(`Broadcasted message type: ${message.action || message.type}`);
    }

    executeJavaScript(data) {
        const { code } = data;
        
        if (!code) {
            throw new Error('No JavaScript code provided');
        }

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

    handleClientVersion(ws, data) {
        const { version, buildDate, features } = data;
        console.log(`📱 Client connected: v${version} (${buildDate})`);
        console.log(`   Features: ${features.join(', ')}`);
        
        // Send server version back
        this.sendToClient(ws, {
            type: 'server_version',
            data: {
                serverVersion: this.gameStateManager.serverVersion,
                serverBuildDate: this.gameStateManager.serverBuildDate,
                compatible: version === this.gameStateManager.serverVersion
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

    close() {
        if (this.wss) {
            this.wss.close(() => {
                console.log('WebSocket server closed');
            });
        }
    }
}

module.exports = WebSocketHandler;