# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PlayCanvas-based Virtual Tabletop (VTTL) system that provides real-time 3D scene control via Python API. The system runs PlayCanvas Engine directly in the browser and communicates with AI clients through WebSocket for real-time entity manipulation, animations, and scene management.

## Development Commands

### Quick Start (Recommended)
- `./start_all.sh` - **One-command startup**: Installs dependencies, starts all services, opens browser
- `./start_dev_simple.sh` - **One-command startup with autoreloads**: Installs dependencies, starts all services, opens browser
- `./quick_test.sh` - **Automated testing**: Runs complete test suite to verify functionality
- `./stop_all.sh` - **Clean shutdown**: Stops all services and cleans up processes

### Manual Setup (Advanced)
- `cd server && npm install` - Install server dependencies
- `cd server && node server.js` - Start WebSocket server (port 8080)
- `cd python && source venv/bin/activate && pip install -r requirements.txt` - Setup Python environment

### Environment Setup
- **WebSocket Server**: `ws://localhost:8080` (game state management)
- **HTTP Server**: `http://localhost:3001` (serves PlayCanvas client)
- **Python Client**: Uses virtual environment in `python/venv/`

## Architecture

### Core Components
1. **WebSocket Server** (`server/server.js`) - Game state management and broadcasting
2. **PlayCanvas Client** (`client/`) - 3D rendering with real-time updates
3. **Python API** (`python/scene_controller.py`) - High-level scene control
4. **Real-time Animation System** - Smooth entity movements without page refreshes

### Communication Flow
```
Python SceneController → WebSocket → VTTL Server → Browser Client (PlayCanvas)
                                          ↓
                              Real-time state sync & animations
```

### Real-Time Animation System

**CRITICAL**: The system supports real-time animations without page refreshes!

#### How It Works
1. **Python Command** → WebSocket message to server
2. **Server Updates State** → Broadcasts to all connected browser clients  
3. **Browser Receives Update** → `syncEntities()` compares old vs new state
4. **Animation Triggered** → Smooth 500ms ease-out interpolation
5. **Visual Update** → `window.app.render()` forces immediate frame refresh

#### Browser Setup Required
1. **Open browser** to `http://localhost:3001`
2. **WebSocket connects** automatically to `ws://localhost:8080`
3. **Check console** for "Connected to VTTL server" message
4. **Real-time updates** will now work immediately

## Python API - SceneController (RECOMMENDED)

Use the clean, high-level `SceneController` library for all scene manipulation:

```python
from scene_controller import SceneController, Position

async with SceneController() as scene:
    # Create entities with colors
    await scene.create_cube("red_cube", [0, 0.5, 0], color=[1, 0, 0])
    await scene.create_sphere("blue_sphere", [2, 0.5, 0], color=[0, 0, 1])
    
    # Arrange in patterns with real-time animation
    await scene.arrange_in_circle(["red_cube", "blue_sphere"], radius=3)
    await scene.arrange_in_line(["cube1", "cube2", "cube3"], spacing=2)
    await scene.arrange_in_grid(["item1", "item2", "item3", "item4"], rows=2, cols=2)
    
    # Move with smooth animations
    await scene.move_entity("red_cube", [5, 0.5, 0], animate=True)
    
    # Scene management
    await scene.take_screenshot()
    await scene.clear_scene(exclude=["important_item"])
    await scene.set_camera([0, 10, 10], target=[0, 0, 0])
```

### SceneController Features
- **Entity Creation**: `create_cube()`, `create_sphere()`, `create_cylinder()`
- **Pattern Arrangements**: `arrange_in_line()`, `arrange_in_circle()`, `arrange_in_grid()`
- **Animation Control**: Real-time smooth movements with `animate=True`
- **Scene Management**: `clear_scene()`, `take_screenshot()`, `set_camera()`
- **Entity Queries**: `get_entity()`, `list_entities()`, `count_entities()`

### Position System
```python
# Use Position objects for precise control
pos = Position(x=5, y=0.5, z=3, facing=45)

# Or simple lists for convenience
await scene.move_entity("cube", [5, 0.5, 3])
```

## Development Workflow

### Typical Session
1. **Start services**: `./start_all.sh` (opens browser automatically)
2. **Activate Python env**: `cd python && source venv/bin/activate`
3. **Use SceneController**: Import and use the clean API
4. **Test real-time**: Send commands and see immediate animations
5. **Stop when done**: `./stop_all.sh`

### For New Features
1. Use `SceneController` for high-level operations
2. Use `vttl_client.py` only for low-level WebSocket commands
3. Check `python/examples/scene_examples.py` for patterns
4. Ensure browser is connected for real-time feedback

## File Structure
```
standalone-mvp/
├── server/                          # WebSocket server
│   └── server.js                   # Game state + broadcasting
├── client/                         # PlayCanvas application  
│   ├── app.js                      # PlayCanvas setup
│   ├── game-controller.js          # WebSocket bridge
│   └── entity-classes.js           # Real-time animation system
├── python/                         # Python API
│   ├── scene_controller.py         # High-level API (USE THIS)
│   ├── vttl_client.py             # Low-level WebSocket client
│   ├── examples/scene_examples.py  # Usage examples
│   └── venv/                       # Python virtual environment
├── files/                          # Game assets
└── screenshots/                    # Captured images
```

## Entity Naming Conventions
- `mini_*` - Game pieces/characters
- `prop_*` - Environmental objects  
- `tile_*` - Board tiles/terrain
- `cam_*` - Camera entities

## WebSocket Message Format
Low-level commands use JSON format with `action` and `data` fields:
```json
{
  "action": "create_entity",
  "data": {
    "name": "warrior_p1",
    "template": "cube", 
    "position": [5, 0.5, 3]
  }
}
```

## Testing and Examples

### Quick Tests
- `python examples/scene_examples.py` - Full SceneController demo
- `python test_basic_connection.py` - WebSocket connectivity test
- `python examples/basic_test.py` - Entity creation test

### Example Scripts
- `examples/scene_examples.py` - Complete SceneController showcase
- `examples/basic_test.py` - Simple entity operations
- `examples/claude_game_master.py` - AI game master demo

## Key Technical Details

- **Real-time Updates**: No page refreshes needed for entity changes
- **Smooth Animations**: 500ms ease-out animations with explicit rendering
- **State Synchronization**: Client compares old vs new state for changes
- **Virtual Environment**: All Python dependencies in `python/venv/`
- **Multi-Camera Support**: Multiple camera views for different players
- **Screenshot API**: Capture game state images for AI vision
- **Grid System**: Built-in grid-based positioning for tabletop games

## Integration Notes

This system is designed for:
- **AI-controlled virtual tabletop games**
- **Real-time multiplayer game control** 
- **Vision-based AI** that needs screenshots
- **Performance-critical gaming applications**
- **Educational simulations** and interactive demos

## AI Best Practices

- Always check objects are positioned not colliding with others
- **Always use SceneController** - it provides clean abstractions and handles WebSocket complexity
- **Ensure browser is connected** to `http://localhost:3001` for real-time feedback
- **Use virtual environment** - `source python/venv/bin/activate` before running Python scripts
- **Check screenshots folder** for captured images after scene operations

## Entity Positioning Guidelines
- When positioning entities on the scene and checking the screenshot pay close attention to the image, the models must not appear below the ground or above the floor level, unless specific conditions allow such positioning, this is a realistic table top simulation

## Model Loading Lessons Learned (Critical Fixes)

### Entity Naming Issues
**CRITICAL**: Always use unique entity names to avoid "Entity already exists" errors:
```python
# ❌ WRONG: Static names cause conflicts
await client.create_entity('cat1', 'model', ...)

# ✅ CORRECT: Generate unique names
cat_name = client.generate_unique_name('mini_', 'cat')  # mini_cat_1_7991
await client.create_entity(cat_name, 'model', ...)
```

### 3D Model Path Handling
**CRITICAL**: Use only the filename in `model_url`, not the full path:
```python
# ❌ WRONG: Full path causes duplication
properties={'model_url': 'files/3dmodels/cat.glb'}  # Results in /files/3dmodels/files/3dmodels/cat.glb

# ✅ CORRECT: Just filename
properties={'model_url': 'cat.glb'}  # Client adds /files/3dmodels/ automatically
```

**Server Fix Applied**: Modified `GameStateManager.js` to set `model_url` as the entity `template` field for proper GLB loading.

### Fallback Cube Removal
**CRITICAL**: Removed all fallback primitive creation from client code:
- Before: GLB loading failures created fallback cubes instead of real models
- After: Models either load properly or show nothing (better for debugging)
- Location: `client/entity-classes.js` - removed `createFallbackPrimitive()` calls

### Scene Cleanup Enhancement
**CRITICAL**: Enhanced `clear_scene()` with proper synchronization:
```python
# Always refresh state before clearing and add delays
await client.get_game_state()
await asyncio.sleep(0.2)  # Wait for state update
# ... then delete entities with delays between operations
```

### Working Model Creation Pattern
```python
# ✅ PROVEN PATTERN: Use this exact sequence
async def create_models():
    client = VTTLClient()
    await client.connect()
    
    # 1. Clear scene completely with wait
    await client.clear_scene()
    await asyncio.sleep(2)
    
    # 2. Generate unique names
    entity_name = client.generate_unique_name('mini_', 'cat')
    
    # 3. Create with filename only
    await client.create_entity(
        entity_name, 
        'model', 
        position=[2, 0.5, 2],
        properties={'model_url': 'cat.glb', 'scale': [0.8, 0.8, 0.8]}
    )
    
    # 4. Wait for models to load (essential!)
    await asyncio.sleep(5)
    
    # 5. Take screenshot to verify
    await client.take_screenshot()
```

### Model File Requirements
- **Format**: `.glb` files only (binary GLTF)
- **Location**: Must be in `/files/3dmodels/` directory on server
- **Naming**: Use only filename in `model_url` property
- **Scaling**: Always specify scale in properties for consistent sizing
- **Loading Time**: Allow 5+ seconds for complex models to load

### Troubleshooting Models
1. **No Models Appear**: Check browser console for 404 errors on GLB files
2. **Cubes Instead of Models**: Ensure fallback code is removed from client
3. **Entity Conflicts**: Use unique name generation, not static names
4. **Path Errors**: Use filename only, not full paths in model_url
