# VTTL Scene Control Client Documentation

A dynamic 3D virtual tabletop scene with WebSocket API control and automatic screenshot capture.

## Overview

This is a standalone PlayCanvas 3D client that provides:
- Real-time 3D scene management
- WebSocket API for remote control
- Smart object positioning system
- Automatic screenshot capture on scene changes
- Professional lighting and materials

## Architecture

```
Browser Client (PlayCanvas) ←→ WebSocket ←→ Game Server (Node.js)
         ↓
   Screenshots (PNG)
```

## Scene Features

### 3D Environment
- **Wooden table surface** with realistic materials
- **Professional lighting** (warm main light + cool fill light + ambient)
- **Shadow casting** for depth and realism
- **Bordered table** with decorative frame

### Camera System
- **Orbit controls**: Drag to rotate, scroll to zoom
- **Optimal positioning**: 60° FOV at (12, 8, 12) looking at origin
- **Dynamic range**: 2-50 unit zoom distance
- **Smooth controls**: Mouse and touch support

### Smart Positioning
- **Grid-based placement**: 1.5-unit spacing on 10x10 table
- **Collision detection**: Won't place objects on occupied positions
- **Spiral search**: Finds nearest available position from center
- **Fallback system**: Random placement if grid is full

## API Reference

### WebSocket Connection
- **URL**: `ws://localhost:8080`
- **Protocol**: JSON message format
- **Auto-reconnect**: Tries multiple ports if connection fails

### Entity Management Commands

#### Create Entity
```javascript
{
  "action": "create_entity",
  "data": {
    "name": "entity_id",           // Unique identifier
    "template": "cube|sphere|tile|warrior",  // Object type
    "position": [x, y, z]          // Optional: exact position
  }
}
```

#### Move Entity
```javascript
{
  "action": "move_entity",
  "data": {
    "name": "entity_id",
    "to": [x, y, z],              // Target position
    "animate": true               // Optional: smooth animation
  }
}
```

#### Delete Entity
```javascript
{
  "action": "delete_entity",
  "data": {
    "name": "entity_id"
  }
}
```

### Object Templates

| Template | Visual | Properties |
|----------|--------|------------|
| `cube` | Red box | Metallic finish, casts shadows |
| `sphere` | Blue sphere | Shiny surface, casts shadows |
| `tile` | Gray tile | Flat, receives shadows |
| `warrior` | Red capsule | Miniature figure |

### Smart Positioning System

If no position is specified, the system automatically:

1. **Grid Search**: Starts from center (0,0)
2. **Spiral Pattern**: Expands outward in rings
3. **Collision Check**: Avoids occupied positions
4. **Boundary Check**: Stays within table bounds
5. **Fallback**: Random placement if grid full

## UI Controls

### Manual Controls
- **Create Cube**: Add red cube at next available position
- **Create Sphere**: Add blue sphere at next available position  
- **Create Board**: Generate 8x8 checkerboard pattern
- **Clear Scene**: Remove all entities
- **📷 Screenshot**: Manual screenshot capture

### Camera Controls
- **Left Click + Drag**: Rotate camera around scene
- **Mouse Wheel**: Zoom in/out (2-50 unit range)
- **Auto-frame**: Camera automatically focuses on table center

## Screenshot System

### Automatic Capture
Screenshots are automatically captured on:
- Entity creation
- Entity movement
- Entity deletion
- Board generation
- Scene clearing

### File Format
- **Format**: PNG
- **Naming**: `vttl_screenshot_{counter}_{timestamp}.png`
- **Download**: Automatic browser download
- **Server sync**: Also sent via WebSocket

### Screenshot Data
```javascript
{
  "action": "screenshot",
  "data": {
    "timestamp": "2025-01-19T...",
    "counter": 0,
    "dataURL": "data:image/png;base64,..."
  }
}
```

## Code Structure

### Core Files
- `index.html` - HTML container with controls
- `app.js` - Main PlayCanvas application
- `server.js` - WebSocket game server

### Key Functions

#### Scene Management
- `initApp()` - Initialize PlayCanvas application
- `setupScene()` - Create camera, lights, table
- `createGroundPlane()` - Generate wooden table surface
- `createTableBorder()` - Add decorative frame

#### Entity System
- `createEntity(type, name)` - Create 3D object with materials
- `findAvailablePosition()` - Smart positioning algorithm
- `entities[]` - Global entity tracking array

#### WebSocket API
- `setupWebSocket()` - Multi-port connection with retry
- `handleServerMessage()` - Process incoming commands
- `sendToServer()` - Send commands to server

#### Screenshot System
- `captureScreenshot()` - Capture and download PNG
- `onSceneChange()` - Trigger screenshot on changes

#### Camera Controls
- `setupCameraControls()` - Mouse/touch orbit system
- `cameraController` - Camera state management

## Usage Examples

### Python Client
```python
import asyncio
import websockets
import json

async def create_game_piece():
    async with websockets.connect('ws://localhost:8080') as ws:
        await ws.send(json.dumps({
            "action": "create_entity",
            "data": {
                "name": "warrior_1",
                "template": "warrior",
                "position": [2, 1, -3]
            }
        }))
```

### JavaScript Client
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.send(JSON.stringify({
    action: 'move_entity',
    data: {
        name: 'warrior_1',
        to: [4, 1, -3],
        animate: true
    }
}));
```

### Direct Browser
```javascript
// Access global functions
createCube();           // Smart positioned cube
createSphere();         // Smart positioned sphere
createBoard();          // 8x8 checkerboard
clearScene();           // Remove all entities
captureScreenshot();    // Manual screenshot
```

## Configuration

### Environment Variables
- `PORT` - WebSocket server port (default: 8080)
- `HTTP_PORT` - HTTP server port (default: 3001)

### Customization Points
- `tableSize` - Usable table area (default: 10x10)
- `gridSize` - Object spacing (default: 1.5 units)
- `tileSize` - Board tile size (default: 1.2 units)
- Camera position and lighting can be adjusted in `setupScene()`

## Server Requirements

### Node.js Server
```bash
cd standalone-mvp/server
npm install
npm start
```

### Client Server
```bash
cd standalone-mvp/simple-client  
python3 -m http.server 8888
```

### Access
- **Client**: http://localhost:8888
- **WebSocket**: ws://localhost:8080
- **Server HTTP**: http://localhost:3001

## Dependencies

### Client-side
- PlayCanvas 2.4.0 (CDN)
- Modern browser with WebGL support
- WebSocket support

### Server-side
- Node.js 16+
- ws (WebSocket library)
- express (HTTP server)
- cors (Cross-origin requests)

## Error Handling

### Connection Issues
- Auto-retry on multiple ports
- Graceful offline mode
- Connection status in UI

### Screenshot Failures
- Error logging to console
- Status updates in UI
- Fallback for unsupported browsers

### Entity Management
- Duplicate name handling
- Position validation
- Memory cleanup on deletion

## Performance

### Optimizations
- Efficient shadow mapping
- Material reuse
- Grid-based collision detection
- Minimal DOM manipulation

### Limitations
- ~100 entities recommended
- WebGL required
- Modern browser needed
- Single client WebSocket connection