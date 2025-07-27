/**
 * VTTL Game Server - Refactored with proper class separation
 * Main server class now focuses only on coordination and HTTP server setup
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const GameStateManager = require('./GameStateManager');
const WebSocketHandler = require('./WebSocketHandler');
const ScreenshotManager = require('./ScreenshotManager');
const SceneFileWatcher = require('./SceneFileWatcher');

// VERSION TRACKING
const VTTL_SERVER_VERSION = "1.7.0-screenshot-override";
const SERVER_BUILD_DATE = "2025-07-25T07:45:00Z";

class VTTLGameServer {
    constructor() {
        this.version = VTTL_SERVER_VERSION;
        this.buildDate = SERVER_BUILD_DATE;
        this.port = process.env.PORT || 8080;
        this.httpPort = process.env.HTTP_PORT || 3001;
        
        console.log(`🚀 VTTL Game Server v${this.version} (${this.buildDate})`);
        console.log('📦 Features: Refactored Architecture, Modular Classes');
        
        // Initialize managers
        this.gameStateManager = new GameStateManager(this.version, this.buildDate);
        this.screenshotManager = new ScreenshotManager(this.gameStateManager);
        
        // Setup servers
        this.setupHTTPServer();
        this.setupWebSocketHandler();
        
        // Initialize scene file watcher AFTER websocket handler is ready
        this.sceneFileWatcher = new SceneFileWatcher(this.gameStateManager, this.webSocketHandler);
        
        console.log('✅ All servers initialized successfully');
    }

    setupHTTPServer() {
        this.app = express();
        this.app.use(cors());
        
        // Serve client files
        this.app.use('/client', express.static(path.join(__dirname, '../client')));
        
        // Serve multicam build files and assets
        this.app.use(express.static(path.join(__dirname, '..')));
        
        // API routes
        this.setupAPIRoutes();
        
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

    setupAPIRoutes() {
        // Game state API
        this.app.get('/api/state', (req, res) => {
            res.json(this.gameStateManager.getGameState());
        });

        this.app.get('/api/entities', (req, res) => {
            res.json(this.gameStateManager.getEntities());
        });

        // Screenshot API
        this.app.get('/api/screenshots', (req, res) => {
            res.json(this.screenshotManager.getAllScreenshots());
        });

        this.app.get('/api/screenshots/latest', (req, res) => {
            const latest = this.screenshotManager.getLatestScreenshot();
            if (latest) {
                res.json(latest);
            } else {
                res.status(404).json({ error: 'No screenshots found' });
            }
        });

        this.app.get('/api/screenshots/stats', (req, res) => {
            res.json(this.screenshotManager.getScreenshotStats());
        });

        // Server info API
        this.app.get('/api/info', (req, res) => {
            res.json({
                version: this.version,
                buildDate: this.buildDate,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                clients: this.webSocketHandler ? this.webSocketHandler.clients.size : 0
            });
        });

        console.log('📡 API routes configured');
    }

    setupWebSocketHandler() {
        this.webSocketHandler = new WebSocketHandler(
            this.port, 
            this.gameStateManager, 
            this.screenshotManager
        );
    }

    // Graceful shutdown
    shutdown() {
        console.log('\n🛑 Shutting down server...');
        
        if (this.webSocketHandler) {
            this.webSocketHandler.close();
        }
        
        // Clean up old screenshots on shutdown
        const deletedCount = this.screenshotManager.cleanupOldScreenshots();
        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} old screenshots`);
        }
        
        console.log('✅ Server shutdown complete');
        process.exit(0);
    }
}

// Start the server
const server = new VTTLGameServer();

// Graceful shutdown handlers
process.on('SIGINT', () => {
    server.shutdown();
});

process.on('SIGTERM', () => {
    server.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    server.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    server.shutdown();
});

module.exports = VTTLGameServer;