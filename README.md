# PlayCanvas Standalone MVP for VTTL

## Architecture

```
Python AI Controller
    ↓ WebSocket (port 8080)
Node.js Game Server  
    ↓ JavaScript API
PlayCanvas Engine (Standalone)
    ↓ WebGL
Web Browser
```

## MVP Features

### Core Functionality
- ✅ PlayCanvas Engine standalone (no editor)
- ✅ WebSocket API for AI control
- ✅ Basic entity management (create, move, delete)
- ✅ Simple 3D scene with camera and lighting
- ✅ Python client for AI interaction

### VTTL Specific  
- ✅ Grid-based positioning
- ✅ Entity naming conventions (mini_, prop_, tile_)
- ✅ Basic templates (cube, sphere, plane)
- ✅ Simple game board setup

## File Structure

```
standalone-mvp/
├── server/
│   ├── package.json
│   ├── server.js          # WebSocket server
│   └── game-api.js        # Game logic API
├── client/
│   ├── index.html         # PlayCanvas app
│   ├── app.js            # Main PlayCanvas application
│   ├── game-controller.js # WebSocket client + API bridge
│   └── assets/           # 3D models, textures
├── python/
│   ├── vttl_client.py    # Python WebSocket client
│   ├── game_api.py       # High-level game API
│   └── examples/         # Usage examples
├── start_all.sh          # 🚀 One-command startup script
├── quick_test.sh         # 🧪 Automated test suite
├── stop_all.sh           # 🛑 Clean shutdown script
└── README.md
```

## Getting Started

### 🚀 Quick Start (Recommended)
```bash
# One command to start everything!
./start_all.sh
```
This script will:
- ✅ Install all dependencies (Node.js & Python)
- ✅ Start WebSocket server (port 8080)
- ✅ Start HTTP server (port 3000)
- ✅ Open browser automatically
- ✅ Show live logs and status

### 🧪 Test Everything
```bash
# Run comprehensive test suite
./quick_test.sh
```

### 🛑 Stop All Services
```bash
# Clean shutdown of all components
./stop_all.sh
```

### Manual Setup (Advanced Users)

<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Install Dependencies
```bash
cd standalone-mvp/server
npm install

cd ../python  
pip install websockets asyncio
```

#### 2. Start Game Server
```bash
cd server
node server.js
```

#### 3. Open Game Client
```bash
# Open client/index.html in browser
# or serve via HTTP server
python -m http.server 3000
```

#### 4. Test AI Control
```bash
cd python
python examples/basic_test.py
```

</details>

## API Examples

### Python AI Controller
```python
from vttl_client import VTTLClient

# Connect to game
client = VTTLClient("ws://localhost:8080")

# Create a mini on grid position
await client.create_entity(
    name="mini_warrior_p1",
    template="warrior",
    grid_pos=(5, 3),
    owner="player1"
)

# Move mini
await client.move_entity("mini_warrior_p1", (6, 3))

# Create game board
await client.setup_board("hex_grid", size=10)
```

### WebSocket API Messages
```json
{
  "action": "create_entity",
  "data": {
    "name": "mini_warrior_p1", 
    "template": "warrior",
    "position": [5, 0, 3],
    "owner": "player1"
  }
}

{
  "action": "move_entity",
  "data": {
    "name": "mini_warrior_p1",
    "to": [6, 0, 3],
    "animate": true
  }
}
```

## Next Steps

1. **MVP Implementation** - Basic working prototype
2. **Testing** - Verify AI can control game entities
3. **Templates** - Add more game piece templates
4. **Polish** - Improve visuals and performance
5. **Deployment** - Package for easy distribution

## Benefits vs Current Approach

| Current (Editor-based) | MVP Standalone |
|----------------------|----------------|
| ❌ Chrome extension required | ✅ No dependencies |
| ❌ Editor UI overhead | ✅ Lightweight runtime |
| ❌ Complex setup | ✅ Simple start |
| ❌ Development tool | ✅ Game application |
| ✅ Visual editing | ❌ Code-only setup |

## Automation Scripts

The project includes three powerful automation scripts for streamlined development:

### 🚀 start_all.sh
**One-command startup** - Handles everything automatically:
- Installs Node.js and Python dependencies
- Kills conflicting processes on ports 8080/3000
- Starts WebSocket server and HTTP server
- Opens browser to client page
- Shows live logs and service status

### 🧪 quick_test.sh
**Comprehensive testing** - Verifies all functionality:
- Checks service connectivity
- Tests WebSocket communication
- Validates entity creation/manipulation
- Tests screenshot functionality
- Provides detailed test results

### 🛑 stop_all.sh
**Clean shutdown** - Graceful service termination:
- Stops all services using stored PIDs
- Force-kills any remaining processes
- Cleans up ports and log files
- Prepares for fresh restart

Ready to start developing AI-controlled virtual tabletop games!