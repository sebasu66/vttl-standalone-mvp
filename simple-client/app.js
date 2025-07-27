import * as pc from 'playcanvas';
import VTTLCamera from './Camera.js';

// Global variables
let app;
let entities = [];
let wsConnection = null;
let screenshotCounter = 0;
let camera = null;

// Initialize PlayCanvas application
function initApp() {
    const canvas = document.getElementById('application');
    app = new pc.Application(canvas, {
        keyboard: new pc.Keyboard(document.body),
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas)
    });

    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.start();

    // Set up the scene
    setupScene();
    setupWebSocket();
    
    updateStatus("Ready - Scene loaded");
}

function setupScene() {
    // Create camera controller
    camera = new VTTLCamera(app, app.graphicsDevice.canvas);

    // Create main directional light (sun)
    const mainLight = new pc.Entity('MainLight');
    mainLight.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 0.95, 0.8), // Warm white
        intensity: 1.2,
        castShadows: true
    });
    mainLight.setEulerAngles(45, 45, 0);
    app.root.addChild(mainLight);
    
    // Add fill light for better visibility
    const fillLight = new pc.Entity('FillLight');
    fillLight.addComponent('light', {
        type: 'directional',
        color: new pc.Color(0.4, 0.6, 1), // Cool blue fill
        intensity: 0.3
    });
    fillLight.setEulerAngles(-30, -45, 0);
    app.root.addChild(fillLight);
    
    // Add ambient light
    app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.3);

    // Create ground plane
    createGroundPlane();
}

function createGroundPlane() {
    // Main ground plane
    const ground = new pc.Entity('Ground');
    ground.addComponent('render', {
        type: 'plane',
        castShadows: false,
        receiveShadows: true
    });
    
    // Create wood table material
    const groundMaterial = new pc.StandardMaterial();
    groundMaterial.diffuse.set(0.4, 0.3, 0.2); // Wood color
    groundMaterial.shininess = 20;
    groundMaterial.metalness = 0.1;
    groundMaterial.update();
    
    ground.render.material = groundMaterial;
    ground.setLocalScale(24, 1, 24);
    ground.setPosition(0, -0.5, 0);
    app.root.addChild(ground);
    
    // Add a border/frame
    createTableBorder();
}

function createTableBorder() {
    const borderMaterial = new pc.StandardMaterial();
    borderMaterial.diffuse.set(0.3, 0.2, 0.1); // Darker wood
    borderMaterial.update();
    
    // Create border pieces
    const borders = [
        { pos: [0, -0.3, 12.5], scale: [25, 0.4, 1] }, // Back
        { pos: [0, -0.3, -12.5], scale: [25, 0.4, 1] }, // Front
        { pos: [12.5, -0.3, 0], scale: [1, 0.4, 25] }, // Right
        { pos: [-12.5, -0.3, 0], scale: [1, 0.4, 25] }  // Left
    ];
    
    borders.forEach((border, i) => {
        const borderEntity = new pc.Entity(`Border${i}`);
        borderEntity.addComponent('render', {
            type: 'box',
            castShadows: true,
            receiveShadows: true
        });
        borderEntity.render.material = borderMaterial;
        borderEntity.setPosition(border.pos[0], border.pos[1], border.pos[2]);
        borderEntity.setLocalScale(border.scale[0], border.scale[1], border.scale[2]);
        app.root.addChild(borderEntity);
    });
}

function setupWebSocket() {
    // Try multiple ports/protocols
    const wsUrls = [
        'ws://localhost:8080',
        'ws://localhost:8081', 
        'ws://localhost:3001'
    ];
    
    let currentUrl = 0;
    
    function tryConnection() {
        if (currentUrl >= wsUrls.length) {
            updateStatus("All WebSocket connections failed - running offline");
            return;
        }
        
        try {
            updateStatus(`Trying to connect to ${wsUrls[currentUrl]}...`);
            wsConnection = new WebSocket(wsUrls[currentUrl]);
            
            const timeout = setTimeout(() => {
                if (wsConnection.readyState === WebSocket.CONNECTING) {
                    wsConnection.close();
                    currentUrl++;
                    tryConnection();
                }
            }, 3000);
            
            wsConnection.onopen = () => {
                clearTimeout(timeout);
                updateStatus(`Connected to game server at ${wsUrls[currentUrl]}`);
            };
            
            wsConnection.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleServerMessage(message);
            };
            
            wsConnection.onclose = () => {
                clearTimeout(timeout);
                updateStatus("Disconnected from server");
            };
            
            wsConnection.onerror = () => {
                clearTimeout(timeout);
                currentUrl++;
                setTimeout(tryConnection, 1000);
            };
        } catch (error) {
            currentUrl++;
            setTimeout(tryConnection, 1000);
        }
    }
    
    tryConnection();
}

function handleServerMessage(message) {
    switch (message.action) {
        case 'create_entity':
            createEntityFromServer(message.data);
            break;
        case 'move_entity':
            moveEntityFromServer(message.data);
            break;
        case 'delete_entity':
            deleteEntityFromServer(message.data);
            break;
        case 'set_camera':
            setCameraFromServer(message.data);
            break;
        case 'camera_preset':
            setCameraPreset(message.data.preset);
            break;
        case 'frame_scene':
            frameScene();
            break;
        default:
            console.log('Unknown message:', message);
    }
}

// Smart positioning system
function findAvailablePosition(objectType = 'default', preferredArea = null) {
    const tableSize = 10; // 10x10 usable area
    const gridSize = 1.5;  // Grid spacing
    const occupiedPositions = entities.map(e => ({
        x: Math.round(e.getPosition().x / gridSize),
        z: Math.round(e.getPosition().z / gridSize)
    }));
    
    // Find first available grid position
    for (let distance = 0; distance < 5; distance++) {
        for (let x = -distance; x <= distance; x++) {
            for (let z = -distance; z <= distance; z++) {
                if (Math.abs(x) !== distance && Math.abs(z) !== distance) continue;
                
                const gridPos = { x, z };
                const isOccupied = occupiedPositions.some(pos => pos.x === x && pos.z === z);
                
                if (!isOccupied && Math.abs(x) < tableSize/2 && Math.abs(z) < tableSize/2) {
                    return {
                        x: x * gridSize,
                        y: 1,
                        z: z * gridSize
                    };
                }
            }
        }
    }
    
    // Fallback to random if grid is full
    return {
        x: (Math.random() - 0.5) * tableSize,
        y: 1, 
        z: (Math.random() - 0.5) * tableSize
    };
}

// UI Functions
window.createCube = function() {
    const cube = createEntity('cube', 'cube_' + Date.now());
    const position = findAvailablePosition('cube');
    cube.setPosition(position.x, position.y, position.z);
    onSceneChange(`Created cube at available position`);
};

window.createSphere = function() {
    const sphere = createEntity('sphere', 'sphere_' + Date.now());
    const position = findAvailablePosition('sphere');
    sphere.setPosition(position.x, position.y, position.z);
    onSceneChange(`Created sphere at available position`);
};

window.createBoard = function() {
    clearBoard();
    const size = 8;
    const tileSize = 1.2; // Slightly larger tiles
    
    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
            const tile = createEntity('tile', `tile_${x}_${z}`);
            
            // Center the board better
            tile.setPosition(
                (x - size/2 + 0.5) * tileSize,
                0.05, // Slightly raised
                (z - size/2 + 0.5) * tileSize
            );
            tile.setLocalScale(1.1, 0.08, 1.1); // Thinner, better proportions
            
            // Better checkerboard pattern with nice colors
            const isEven = (x + z) % 2 === 0;
            const material = new pc.StandardMaterial();
            if (isEven) {
                material.diffuse.set(0.9, 0.85, 0.7); // Light cream
            } else {
                material.diffuse.set(0.4, 0.3, 0.2); // Dark brown
            }
            material.shininess = 15;
            material.update();
            tile.render.material = material;
        }
    }
    onSceneChange(`Created ${size}x${size} game board`);
};

window.clearScene = function() {
    entities.forEach(entity => {
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }
        entity.destroy();
    });
    entities = [];
    onSceneChange("Scene cleared");
};

function clearBoard() {
    entities = entities.filter(entity => {
        if (entity.name.startsWith('tile_')) {
            if (entity.parent) {
                entity.parent.removeChild(entity);
            }
            entity.destroy();
            return false;
        }
        return true;
    });
}

function createEntity(type, name) {
    const entity = new pc.Entity(name);
    
    const material = new pc.StandardMaterial();
    
    switch (type) {
        case 'cube':
            entity.addComponent('render', { 
                type: 'box',
                castShadows: true,
                receiveShadows: true
            });
            material.diffuse.set(0.8, 0.2, 0.2); // Red
            material.metalness = 0.1;
            material.shininess = 30;
            break;
        case 'sphere':
            entity.addComponent('render', { 
                type: 'sphere',
                castShadows: true,
                receiveShadows: true
            });
            material.diffuse.set(0.2, 0.4, 0.8); // Blue
            material.metalness = 0.2;
            material.shininess = 50;
            break;
        case 'tile':
            entity.addComponent('render', { 
                type: 'box',
                castShadows: false,
                receiveShadows: true
            });
            material.diffuse.set(0.7, 0.7, 0.7); // Light gray
            material.shininess = 10;
            break;
        default:
            entity.addComponent('render', { type: 'box' });
            material.diffuse.set(0.5, 0.5, 0.5);
    }
    
    material.update();
    entity.render.material = material;
    
    app.root.addChild(entity);
    entities.push(entity);
    
    return entity;
}

function createEntityFromServer(data) {
    const entity = createEntity(data.template || 'cube', data.name);
    if (data.position) {
        entity.setPosition(data.position[0], data.position[1], data.position[2]);
    }
    onSceneChange(`Server created: ${data.name}`);
}

function moveEntityFromServer(data) {
    const entity = entities.find(e => e.name === data.name);
    if (entity && data.to) {
        if (data.animate) {
            // Simple animation
            const tween = entity.tween(entity.getPosition())
                .to(new pc.Vec3(data.to[0], data.to[1], data.to[2]), 1.0, pc.SineOut);
            tween.start();
        } else {
            entity.setPosition(data.to[0], data.to[1], data.to[2]);
        }
        onSceneChange(`Moved ${data.name} to ${data.to}`);
    }
}

function deleteEntityFromServer(data) {
    const entityIndex = entities.findIndex(e => e.name === data.name);
    if (entityIndex !== -1) {
        const entity = entities[entityIndex];
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }
        entity.destroy();
        entities.splice(entityIndex, 1);
        onSceneChange(`Deleted: ${data.name}`);
    }
}

function sendToServer(message) {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(message));
    }
}

function updateStatus(text) {
    document.getElementById('status').textContent = `Status: ${text}`;
}

function captureScreenshot() {
    // Wait a frame for the scene to render
    requestAnimationFrame(() => {
        try {
            const canvas = app.graphicsDevice.canvas;
            const dataURL = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.download = `vttl_screenshot_${screenshotCounter++}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
            link.href = dataURL;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Also send to server if connected
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                sendToServer({
                    action: 'screenshot',
                    data: {
                        timestamp: new Date().toISOString(),
                        counter: screenshotCounter - 1,
                        dataURL: dataURL
                    }
                });
            }
            
            updateStatus(`Screenshot ${screenshotCounter - 1} captured`);
        } catch (error) {
            console.error('Screenshot failed:', error);
            updateStatus('Screenshot failed');
        }
    });
}

function onSceneChange(description) {
    updateStatus(description);
    // Capture screenshot after any scene change
    setTimeout(captureScreenshot, 100); // Small delay to ensure rendering is complete
}

// Camera API functions
window.setCameraPreset = function(preset) {
    if (camera) {
        camera.setPreset(preset);
        onSceneChange(`Camera set to ${preset} view`);
    }
};

window.resetCamera = function() {
    if (camera) {
        camera.reset();
        onSceneChange('Camera reset to default position');
    }
};

window.frameScene = function() {
    if (camera) {
        camera.frameScene(entities);
        onSceneChange('Camera framed scene');
    }
};

window.getCameraInfo = function() {
    return camera ? camera.getInfo() : null;
};

// Server camera control functions
function setCameraFromServer(data) {
    if (!camera) return;
    
    if (data.animate) {
        camera.animateTo(data, data.duration || 1.0, data.easing || 'ease-out');
        onSceneChange(`Camera animated to new position`);
    } else {
        if (data.position) camera.setPosition(data.position[0], data.position[1], data.position[2]);
        if (data.target) camera.setTarget(data.target[0], data.target[1], data.target[2]);
        if (data.distance !== undefined) camera.setDistance(data.distance);
        if (data.pitch !== undefined && data.yaw !== undefined) camera.setAngles(data.pitch, data.yaw);
        if (data.fov !== undefined) camera.setFOV(data.fov);
        onSceneChange(`Camera updated from server`);
    }
}

// Start the application
initApp();