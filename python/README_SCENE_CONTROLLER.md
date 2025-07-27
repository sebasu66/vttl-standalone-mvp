# Scene Controller - Clean Python API for 3D Scene Manipulation

## Overview

The `SceneController` provides a high-level, clean Python API for controlling a 3D virtual tabletop scene with real-time animations and updates.

## Key Features

✅ **Real-time animations** - Smooth 500ms animations with automatic rendering  
✅ **Pattern arrangements** - Line, circle, grid formations  
✅ **Clean async API** - Context manager with automatic connection handling  
✅ **Entity management** - Create, move, delete with state tracking  
✅ **Type safety** - Proper data classes and type hints  

## Architecture

```
Python SceneController → WebSocket → VTTL Server → Browser Client (PlayCanvas)
                                          ↓
                              Real-time state sync & animations
```

## Quick Start

```python
from scene_controller import SceneController, Position

async def demo():
    async with SceneController() as scene:
        # Create entities
        await scene.create_cube("my_cube", [0, 0.5, 0], color=[1, 0, 0])
        
        # Move with animation  
        await scene.move_entity("my_cube", [5, 0.5, 0], animate=True)
        
        # Arrange multiple entities
        cubes = ["cube1", "cube2", "cube3"]
        await scene.arrange_in_circle(cubes, radius=3)
        
        # Take screenshot
        await scene.take_screenshot()

asyncio.run(demo())
```

## API Reference

### Entity Creation
- `create_cube(name, position, color=None)` - Create cube entity
- `create_sphere(name, position, color=None)` - Create sphere entity  
- `create_cylinder(name, position, color=None)` - Create cylinder entity

### Entity Manipulation
- `move_entity(name, position, animate=True)` - Move entity with animation
- `delete_entity(name)` - Remove entity from scene
- `rotate_entity(name, rotation, animate=True)` - Rotate entity (future)

### Pattern Arrangements
- `arrange_in_line(names, spacing=2.0, direction="x")` - Linear arrangement
- `arrange_in_circle(names, radius=3.0, center=None)` - Circular arrangement
- `arrange_in_grid(names, rows, cols, spacing=2.0)` - Grid arrangement

### Scene Management
- `clear_scene(exclude=None)` - Delete all entities (except excluded)
- `take_screenshot()` - Capture scene image
- `set_camera(position, target=None)` - Set camera view

### Entity Queries
- `get_entity(name)` - Get entity by name
- `list_entities()` - Get all entities
- `count_entities()` - Get entity count

## Position System

```python
from scene_controller import Position

# Create position objects
pos = Position(x=5, y=0.5, z=3, facing=45)

# Or use simple lists
await scene.move_entity("cube", [5, 0.5, 3])
```

## Examples

### Basic Game Setup
```python
async with SceneController() as scene:
    # Clear scene
    await scene.clear_scene()
    
    # Create player pieces
    await scene.create_cylinder("player1", [-5, 0.5, -5], color=[1, 0, 0])
    await scene.create_cylinder("player2", [5, 0.5, 5], color=[0, 0, 1])
    
    # Create game pieces
    pieces = []
    for i in range(4):
        name = f"piece_{i+1}"
        await scene.create_cube(name, [0, 0.5, 0], color=[0.8, 0.8, 0.2])
        pieces.append(name)
    
    # Arrange in formation
    await scene.arrange_in_grid(pieces, rows=2, cols=2, spacing=1.5)
    
    # Set overview camera
    await scene.set_camera([0, 10, 10], target=[0, 0, 0])
```

### Animation Sequence
```python
async with SceneController() as scene:
    await scene.create_cube("mover", [0, 0.5, 0])
    
    # Define path
    path = [
        [3, 0.5, 0],    # Right
        [3, 0.5, 3],    # Forward  
        [0, 0.5, 3],    # Left
        [0, 2, 3],      # Up
        [0, 0.5, 0]     # Back to start
    ]
    
    # Animate through path
    for pos in path:
        await scene.move_entity("mover", pos, animate=True)
        await asyncio.sleep(1)  # Wait for animation
```

## Real-time System Details

### How It Works
1. **Python sends command** → WebSocket message to server
2. **Server updates state** → Broadcasts to all connected clients  
3. **Browser receives update** → Compares old vs new state
4. **Animation triggered** → Smooth interpolation with explicit rendering
5. **Visual update** → `window.app.render()` forces frame refresh

### Key Fix Applied
Added explicit `window.app.render()` calls after entity position changes to ensure immediate visual updates without page refreshes.

## Files Structure

```
python/
├── scene_controller.py           # Main library
├── vttl_client.py               # Low-level WebSocket client
├── examples/
│   └── scene_examples.py        # Usage examples
└── README_SCENE_CONTROLLER.md   # This documentation
```

## Next Steps

For future sessions, simply import and use:

```python
from scene_controller import SceneController
# Clean, high-level API ready to use
```

No more dirty inline classes or complex WebSocket handling - just clean, intuitive scene control!