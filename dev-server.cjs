#!/usr/bin/env node
/**
 * Development Server with Auto-Reload
 * Watches for file changes and automatically refreshes connected browsers
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const DEV_VERSION = "1.4.1-devmode";
const DEV_PORT = 3003;
const WEBSOCKET_PORT = 3002;

class DevServer {
    constructor() {
        this.version = DEV_VERSION;
        this.clients = new Set();
        this.setupWebSocketServer();
        this.setupFileWatcher();
        this.setupHttpServer();
        
        console.log(`🚀 VTTL Dev Server v${this.version} starting...`);
    }

    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 Browser connected for live reload');
            this.clients.add(ws);
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('📱 Browser disconnected');
            });
        });
        
        console.log(`🔌 Live reload WebSocket server on port ${WEBSOCKET_PORT}`);
    }

    setupFileWatcher() {
        // Watch client files for changes
        const watchPaths = [
            'client/**/*.js',
            'client/**/*.html',
            'client/**/*.css',
            'server/**/*.js'
        ];

        this.watcher = chokidar.watch(watchPaths, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', (filePath) => {
            console.log(`📝 File changed: ${filePath}`);
            this.reloadBrowsers(filePath);
        });

        this.watcher.on('add', (filePath) => {
            console.log(`➕ File added: ${filePath}`);
            this.reloadBrowsers(filePath);
        });

        console.log('👁️  Watching for file changes...');
    }

    setupHttpServer() {
        this.server = http.createServer((req, res) => {
            // Serve files with live reload injection
            const filePath = this.getFilePath(req.url);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                
                // If it's a directory, look for index.html
                if (stats.isDirectory()) {
                    const indexPath = path.join(filePath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        let content = fs.readFileSync(indexPath, 'utf8');
                        content = this.injectLiveReload(content);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content);
                    } else {
                        res.writeHead(404);
                        res.end('Directory index not found');
                    }
                    return;
                }
                
                // Handle regular files
                const ext = path.extname(filePath);
                const contentType = this.getContentType(ext);
                
                // Handle binary files
                if (this.isBinaryFile(ext)) {
                    const content = fs.readFileSync(filePath);
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                } else {
                    // Handle text files
                    let content = fs.readFileSync(filePath, 'utf8');
                    
                    // Inject live reload script into HTML files
                    if (ext === '.html') {
                        content = this.injectLiveReload(content);
                    }
                    
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            } else {
                res.writeHead(404);
                res.end('File not found');
            }
        });

        this.server.listen(DEV_PORT, () => {
            console.log(`🌐 Dev server running on http://localhost:${DEV_PORT}`);
            console.log(`📁 Serving files from: ${path.resolve('.')}`);
        });
    }

    getFilePath(url) {
        if (url === '/') {
            return path.join(__dirname, 'client', 'index.html');
        }
        
        if (url.startsWith('/client/')) {
            return path.join(__dirname, url);
        }
        
        // Serve files from the files directory (GLB models, assets, etc.)
        if (url.startsWith('/files/')) {
            return path.join(__dirname, url);
        }
        
        return path.join(__dirname, 'client', url);
    }

    getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.wasm': 'application/wasm',
            '.glb': 'model/gltf-binary'
        };
        return types[ext] || 'text/plain';
    }

    isBinaryFile(ext) {
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.wasm', '.glb'];
        return binaryExtensions.includes(ext);
    }

    injectLiveReload(html) {
        const liveReloadScript = `
        <script>
            (function() {
                console.log('🔄 Live reload enabled');
                const ws = new WebSocket('ws://localhost:${WEBSOCKET_PORT}');
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    if (data.type === 'reload') {
                        console.log('🔄 Reloading due to file change:', data.file);
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                    }
                };
                
                ws.onopen = function() {
                    console.log('✅ Live reload connected');
                };
                
                ws.onclose = function() {
                    console.log('❌ Live reload disconnected');
                };
            })();
        </script>`;
        
        // Inject before closing body tag
        return html.replace('</body>', liveReloadScript + '</body>');
    }

    reloadBrowsers(filePath) {
        const message = JSON.stringify({
            type: 'reload',
            file: filePath,
            timestamp: new Date().toISOString()
        });

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

        console.log(`🔄 Sent reload signal to ${this.clients.size} browser(s)`);
    }

    close() {
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            this.server.close();
        }
        console.log('🛑 Dev server stopped');
    }
}

// Start the development server
const devServer = new DevServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dev server...');
    devServer.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    devServer.close();
    process.exit(0);
});