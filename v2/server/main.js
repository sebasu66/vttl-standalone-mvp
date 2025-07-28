/**
 * VTTL v2.0 Server - JSON-First Virtual Tabletop Server
 * 
 * Core server that loads scene state from JSON and serves it to clients
 * with diff-based synchronization and WebSocket communication.
 */

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');

// Configuration
const CONFIG = {
    HTTP_PORT: process.env.HTTP_PORT || 3002,
    WS_PORT: process.env.WS_PORT || 8082,
    SCENE_FILE: path.join(__dirname, '../data/scene_state.json'),
    CLIENT_DIR: path.join(__dirname, '../client'),
    VERSION: '2.0.0'
};

/**
 * JSONSceneLoader - Loads and validates scene from JSON file
 */
class JSONSceneLoader {
    constructor(filePath) {
        this.filePath = filePath;
        this.scene = null;
        this.lastModified = null;
    }

    async loadScene() {
        try {
            const stats = await fs.stat(this.filePath);
            const data = await fs.readFile(this.filePath, 'utf8');
            this.scene = JSON.parse(data);
            this.lastModified = stats.mtime;
            
            console.log(`✅ Scene loaded: ${this.scene.meta?.name || 'Unknown'}`);
            console.log(`   Version: ${this.scene.version}`);
            console.log(`   Entities: ${Object.keys(this.scene.entities || {}).length}`);
            console.log(`   Models: ${Object.keys(this.scene.models || {}).length}`);
            console.log(`   Lights: ${Object.keys(this.scene.lights || {}).length}`);
            console.log(`   Cameras: ${Object.keys(this.scene.cameras || {}).length}`);
            
            return this.scene;
        } catch (error) {
            console.error('❌ Failed to load scene:', error.message);
            throw error;
        }
    }

    async saveScene(sceneData) {
        try {
            sceneData.last_modified = new Date().toISOString();
            const jsonString = JSON.stringify(sceneData, null, 2);
            await fs.writeFile(this.filePath, jsonString, 'utf8');
            this.scene = sceneData;
            console.log('💾 Scene saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save scene:', error.message);
            throw error;
        }
    }

    getScene() {
        return this.scene;
    }
}

/**
 * GameState - Holds current scene state in memory
 */
class GameState {
    constructor() {
        this.scene = null;
        this.clients = new Set();
        this.lastUpdate = Date.now();
    }

    setScene(scene) {
        this.scene = scene;
        this.lastUpdate = Date.now();
    }

    getScene() {
        return this.scene;
    }

    addClient(ws) {
        this.clients.add(ws);
        console.log(`📱 Client connected (${this.clients.size} total)`);
    }

    removeClient(ws) {
        this.clients.delete(ws);
        console.log(`📱 Client disconnected (${this.clients.size} total)`);
    }

    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    getStats() {
        return {
            clients: this.clients.size,
            lastUpdate: this.lastUpdate,
            scene: this.scene ? {
                version: this.scene.version,
                entities: Object.keys(this.scene.entities || {}).length,
                models: Object.keys(this.scene.models || {}).length,
                lights: Object.keys(this.scene.lights || {}).length,
                cameras: Object.keys(this.scene.cameras || {}).length
            } : null
        };
    }
}

/**
 * Main Server Class
 */
class VTTLServer {
    constructor() {
        this.sceneLoader = new JSONSceneLoader(CONFIG.SCENE_FILE);
        this.gameState = new GameState();
        this.app = express();
        this.httpServer = null;
        this.wsServer = null;
    }

    async initialize() {
        console.log(`🚀 VTTL v${CONFIG.VERSION} Server Starting with Auto-Restart...`);
        
        // Load initial scene
        const scene = await this.sceneLoader.loadScene();
        this.gameState.setScene(scene);
        
        // Setup HTTP server
        this.setupHTTPServer();
        
        // Setup WebSocket server
        this.setupWebSocketServer();
        
        console.log(`🌐 HTTP Server: http://localhost:${CONFIG.HTTP_PORT}`);
        console.log(`🔌 WebSocket Server: ws://localhost:${CONFIG.WS_PORT}`);
        console.log(`📁 Client: http://localhost:${CONFIG.HTTP_PORT}/client/`);
    }

    setupHTTPServer() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        
        // Serve client files
        this.app.use('/client', express.static(CONFIG.CLIENT_DIR));
        
        // API Routes
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                version: CONFIG.VERSION,
                uptime: process.uptime(),
                stats: this.gameState.getStats()
            });
        });

        this.app.get('/api/scene', (req, res) => {
            res.json(this.gameState.getScene());
        });

        this.app.post('/api/scene', async (req, res) => {
            try {
                await this.sceneLoader.saveScene(req.body);
                this.gameState.setScene(req.body);
                
                // Broadcast scene update to all clients
                this.gameState.broadcastToClients({
                    type: 'scene_update',
                    data: req.body
                });
                
                res.json({ success: true, message: 'Scene updated' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Default route
        this.app.get('/', (req, res) => {
            res.json({
                message: 'VTTL v2.0 Server',
                version: CONFIG.VERSION,
                endpoints: {
                    client: '/client/',
                    health: '/api/health',
                    scene: '/api/scene'
                }
            });
        });

        this.httpServer = this.app.listen(CONFIG.HTTP_PORT);
    }

    setupWebSocketServer() {
        this.wsServer = new WebSocket.Server({ 
            port: CONFIG.WS_PORT,
            perMessageDeflate: false 
        });

        this.wsServer.on('connection', (ws) => {
            this.gameState.addClient(ws);

            // Send initial scene data
            ws.send(JSON.stringify({
                type: 'initial_scene',
                data: this.gameState.getScene()
            }));

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error.message);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });

            ws.on('close', () => {
                this.gameState.removeClient(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                this.gameState.removeClient(ws);
            });
        });
    }

    async handleWebSocketMessage(ws, data) {
        const { type, payload } = data;

        switch (type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;

            case 'get_scene':
                ws.send(JSON.stringify({
                    type: 'scene_data',
                    data: this.gameState.getScene()
                }));
                break;

            case 'update_scene':
                // This will be enhanced in Checkpoint 2 with diff calculation
                await this.sceneLoader.saveScene(payload);
                this.gameState.setScene(payload);
                
                // Broadcast to all other clients
                this.gameState.broadcastToClients({
                    type: 'scene_update',
                    data: payload
                });
                break;

            case 'request_screenshot':
                // Forward to clients for screenshot capture
                this.gameState.broadcastToClients({
                    type: 'screenshot_request',
                    data: { timestamp: Date.now() }
                });
                break;

            default:
                console.log(`Unknown message type: ${type}`);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down VTTL Server...');
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        console.log('✅ Server shutdown complete');
    }
}

// Initialize and start server
async function main() {
    const server = new VTTLServer();
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await server.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('🛑 Received SIGTERM, shutting down gracefully...');
        await server.shutdown();
        process.exit(0);
    });

    try {
        await server.initialize();
        console.log('✅ VTTL v2.0 Server ready for connections!');
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    main();
}

module.exports = { VTTLServer, JSONSceneLoader, GameState };