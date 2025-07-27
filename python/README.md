# VTTL Python API - Complete Documentation

## Overview

The VTTL (Virtual Tabletop) Python API provides comprehensive control over a 3D scene through WebSocket communication. This system enables AI-controlled virtual tabletop games with real-time entity manipulation, animations, and scene management.

## Quick Start

```python
from scene_controller import SceneController
import asyncio

async def main():
    async with SceneController() as scene:
        # Create entities
        await scene.create_cube("my_cube", [0, 0.5, 0], color=[1, 0, 0])
        
        # Move with animation
        await scene.move_entity("my_cube", [5, 0.5, 0], animate=True)
        
        # Take screenshot
        await scene.take_screenshot()

asyncio.run(main())
```

## Architecture

### Core Components

1. **SceneController** - High-level API for scene manipulation
2. **VTTLClient** - Low-level WebSocket client 
3. **WebSocket Server** - Game state management (port 8080)
4. **Browser Client** - Real-time 3D rendering

### Communication Flow
```
Python API → WebSocket → VTTL Server → Browser Client (PlayCanvas)
```

## API Reference

### SceneController Class

The high-level API for scene control with clean abstractions.

#### Connection Management

```python
async with SceneController() as scene:
    # All operations here
    pass
```

#### Entity Creation

```python
# Basic shapes with colors
await scene.create_cube("cube1", [0, 0.5, 0], color=[1, 0, 0], scale=[1, 1, 1])
await scene.create_sphere("sphere1", [2, 0.5, 0], color=[0, 1, 0], scale=[0.8, 0.8, 0.8])
await scene.create_cylinder("cylinder1", [4, 0.5, 0], color=[0, 0, 1], scale=[1, 2, 1])

# 3D Models
await scene.create_model("model1", "/files/3dmodels/cat.glb", [6, 0.5, 0], scale=[0.5, 0.5, 0.5])
```

#### Entity Movement & Rotation

```python
# Move with animation (default)
await scene.move_entity("cube1", [5, 0.5, 5], animate=True)

# Instant movement
await scene.move_entity("cube1", [5, 0.5, 5], animate=False)

# Rotation
await scene.rotate_entity("cube1", [0, 45, 0], animate=True)  # Y-axis rotation
```

#### Pattern Arrangements

```python
# Arrange entities in patterns
await scene.arrange_in_line(["cube1", "cube2", "cube3"], spacing=2, direction="x")
await scene.arrange_in_circle(["cube1", "cube2", "cube3"], radius=3, center=[0, 0.5, 0])
await scene.arrange_in_grid(["item1", "item2", "item3", "item4"], rows=2, cols=2, spacing=2)
```

#### Scene Management

```python
# Clear scene (with optional exclusions)
await scene.clear_scene(exclude=["important_item"])

# Take screenshot
await scene.take_screenshot()  # Saves to screenshots/latest_screenshot.png

# Camera control
await scene.set_camera([10, 8, 10], target=[0, 0, 0])
```

#### Entity Queries

```python
# Get entity information
entity = await scene.get_entity("cube1")
entities = await scene.list_entities()
count = await scene.count_entities()

# Check if entity exists
exists = await scene.entity_exists("cube1")
```

#### Collision Detection

```python
# Check for collisions
collisions = await scene.check_collisions("cube1", [5, 0.5, 5])
```

### VTTLClient Class

Low-level WebSocket client for advanced operations.

#### Connection

```python
client = VTTLClient("ws://localhost:8080")
await client.connect()

# Use client...

await client.disconnect()
```

#### Entity Naming Helpers

```python
# Generate unique names with proper conventions
name = client.generate_unique_name("mini_", "warrior")  # mini_warrior_1_1234

# Validate names
is_valid = client.validate_entity_name("mini_warrior_1")  # True

# Check existence
exists = client.check_entity_exists("mini_warrior_1")
```

#### Advanced Entity Operations

```python
# Create with full control
await client.create_entity(
    name="mini_warrior_1",
    template="model",
    position=[0, 0.5, 0],
    properties={
        "model_url": "/files/3dmodels/warrior.glb",
        "scale": [0.8, 0.8, 0.8]
    }
)

# Move with collision checking
await client.move_entity("mini_warrior_1", position=[5, 0.5, 5], animate=True)

# Rotate entity
await client.rotate_entity("mini_warrior_1", rotation=[0, 90, 0], animate=True)
```

#### Scene Management

```python
# Clear with exclusions
await client.clear_scene(exclude_prefixes=["cam_", "env_"])

# Get game state
state = await client.get_game_state()

# Screenshot
path = await client.take_screenshot()
```

#### Grid-Based Operations

```python
from vttl_client import GridPosition

# Grid positioning
grid_pos = GridPosition(x=5, z=3, y=0.5)
await client.create_entity("cube1", "cube", grid_pos=grid_pos)

# Utility functions
world_pos = client.grid_to_world(grid_pos)
grid_pos = client.world_to_grid([5.0, 0.5, 3.0])
```

## Entity Naming Conventions

### Prefixes
- `mini_` - Game pieces/characters
- `prop_` - Environmental objects  
- `tile_` - Board tiles/terrain
- `cam_` - Camera entities
- `effect_` - Visual effects
- `env_` - Environment objects

### Examples
```python
# Good names
"mini_warrior_p1"
"prop_chest_1"
"tile_grass_01"
"cam_overhead"

# Auto-generated unique names
name = client.generate_unique_name("mini_", "cat")  # mini_cat_1_4567
```

## Position System

### Coordinate System
- **X-axis**: Left/Right (-/+)
- **Y-axis**: Down/Up (-/+) 
- **Z-axis**: Back/Forward (-/+)

### Ground Level
- **Y = 0.5**: Standard ground level for tabletop entities
- **Y = 2.0-3.0**: Flying/floating entities

### Examples
```python
# Ground level entities
await scene.create_cube("ground_item", [5, 0.5, 3])

# Flying entities  
await scene.create_sphere("flying_item", [5, 2.5, 3])
```

## 3D Model Loading

### Supported Formats
- `.glb` - Preferred format
- Model files should be in `/files/3dmodels/` directory

### Model Creation
```python
# Load 3D model
await scene.create_model(
    name="cat1",
    model_path="/files/3dmodels/cat.glb",
    position=[2, 0.5, 2],
    scale=[0.8, 0.8, 0.8]
)
```

### Available Models
- `cat.glb` - Cat model
- `eagle.glb` - Eagle model
- Additional models in `/files/3dmodels/`

## Animation System

### Movement Animation
```python
# Smooth animated movement (500ms duration)
await scene.move_entity("cube1", [5, 0.5, 5], animate=True)

# Instant movement
await scene.move_entity("cube1", [5, 0.5, 5], animate=False)
```

### Rotation Animation
```python
# Smooth rotation
await scene.rotate_entity("cube1", [0, 90, 0], animate=True)

# Instant rotation
await scene.rotate_entity("cube1", [0, 90, 0], animate=False)
```

## Error Handling

### Common Issues

1. **Entity Already Exists**
```python
# Use unique naming
name = client.generate_unique_name("mini_", "warrior")
await client.create_entity(name, "cube", position=[0, 0.5, 0])
```

2. **Entity Not Found**
```python
# Check existence first
if client.check_entity_exists("cube1"):
    await client.move_entity("cube1", [5, 0.5, 5])
```

3. **Model Loading Failures**
```python
# Verify model path exists
model_path = "/files/3dmodels/cat.glb"
await scene.create_model("cat1", model_path, [0, 0.5, 0])
```

## Best Practices

### Entity Management
1. **Use proper naming conventions** with prefixes
2. **Generate unique names** to avoid conflicts
3. **Clear scenes** before major operations
4. **Check entity existence** before operations

### Performance
1. **Batch operations** when possible
2. **Use appropriate delays** between rapid operations
3. **Limit concurrent animations** for smoothness
4. **Clean up unused entities** regularly

### Positioning
1. **Keep entities on table surface** (y=0.5)
2. **Check for collisions** before placement
3. **Use grid positioning** for precise placement
4. **Maintain realistic spacing** between objects

## Examples

### Complete Game Setup
```python
async def setup_game():
    async with SceneController() as scene:
        # Clear previous game
        await scene.clear_scene()
        
        # Create game pieces
        await scene.create_model("mini_warrior", "/files/3dmodels/warrior.glb", [2, 0.5, 2])
        await scene.create_model("mini_mage", "/files/3dmodels/mage.glb", [4, 0.5, 4])
        
        # Create environment
        await scene.create_cube("prop_chest", [6, 0.5, 2], color=[0.6, 0.4, 0.2])
        
        # Arrange in formation
        await scene.arrange_in_line(["mini_warrior", "mini_mage"], spacing=3)
        
        # Set camera angle
        await scene.set_camera([10, 8, 10], target=[3, 0.5, 3])
        
        # Take screenshot
        await scene.take_screenshot()
```

### Battle Movement
```python
async def move_to_battle():
    async with SceneController() as scene:
        # Move warriors toward each other
        await scene.move_entity("mini_warrior", [4, 0.5, 4], animate=True)
        await scene.move_entity("mini_enemy", [4, 0.5, 6], animate=True)
        
        # Rotate to face each other
        await scene.rotate_entity("mini_warrior", [0, 0, 0], animate=True)
        await scene.rotate_entity("mini_enemy", [0, 180, 0], animate=True)
        
        # Screenshot the confrontation
        await scene.take_screenshot()
```

## Troubleshooting

### Connection Issues
- Ensure WebSocket server is running on port 8080
- Check that browser client is connected
- Verify no firewall blocking connections

### Entity Issues
- Use `await scene.clear_scene()` to reset state
- Check entity names for proper conventions
- Verify model files exist in correct directory

### Animation Issues
- Add delays between rapid operations
- Use `animate=False` for instant updates
- Check that entities exist before animating

### Model Loading Issues
- Verify model path is correct
- Check file permissions
- Ensure models are in `.glb` format

## Lessons Learned - Model Loading & Entity Management

### Critical Fixes Applied

#### 1. Entity Naming Conflicts
**Problem**: Entity names like "cat1", "cat2" caused "Entity already exists" errors when recreating scenes.

**Solution**: Implemented unique name generation with timestamps:
```python
# Generate unique names to avoid conflicts
cat_name = client.generate_unique_name('mini_', 'cat')  # mini_cat_1_7991
```

**Key Learning**: Always use unique entity names in production systems to avoid state conflicts.

#### 2. 3D Model Loading Path Issues
**Problem**: Models weren't loading due to incorrect path handling:
- Python API sent: `properties={'model_url': 'files/3dmodels/cat.glb'}`
- Client tried to fetch: `http://localhost:3003/files/3dmodels/files/3dmodels/cat.glb` (duplicated path)

**Solution**: Fixed server-side model handling in `GameStateManager.js`:
```javascript
// Handle model entities specially - use model_url as template for GLB loading
let entityTemplate = template || 'default_cube';
if (template === 'model' && properties && properties.model_url) {
    entityTemplate = properties.model_url; // Client expects GLB path in template field
}
```

**Key Learning**: Client expects GLB model paths in the `template` field, not in `properties.model_url`.

#### 3. Fallback Cube Creation
**Problem**: When GLB models failed to load, system created fallback cubes instead of real models.

**Solution**: Removed all fallback primitive creation code from client:
```javascript
// Before (problematic):
.catch(err => {
    console.error(`❌ Failed to access GLB file ${modelPath}:`, err);
    this.createFallbackPrimitive(); // Created cubes instead of models
});

// After (correct):
.catch(err => {
    console.error(`❌ Failed to access GLB file ${modelPath}:`, err);
    console.warn('⚠️ GLB model loading failed - no fallback primitive will be created');
});
```

**Key Learning**: Remove fallback mechanisms that mask real model loading issues. Better to show nothing than wrong models.

#### 4. Scene Cleanup Issues
**Problem**: `clear_scene()` didn't properly remove all entities, causing conflicts on recreation.

**Solution**: Enhanced deletion with proper state refresh and error handling:
```python
async def clear_scene(self, exclude_prefixes: List[str] = None) -> bool:
    # Get fresh game state before clearing
    await self.get_game_state()
    await asyncio.sleep(0.2)  # Wait for state to update
    
    entities = self.game_state.get('entities', {})
    for name in list(entities.keys()):
        # Skip entities with excluded prefixes
        should_exclude = any(name.startswith(prefix) for prefix in exclude_prefixes)
        if not should_exclude:
            try:
                await self.delete_entity(name)
                await asyncio.sleep(0.1)  # Small delay between deletions
            except Exception as e:
                self.logger.warning(f"Failed to delete entity {name}: {e}")
```

**Key Learning**: Always refresh game state before bulk operations and add delays for proper synchronization.

### Working Model Creation Pattern

```python
# ✅ CORRECT: Final working pattern
async def create_animals():
    client = VTTLClient()
    await client.connect()
    
    # 1. Clear scene completely
    await client.clear_scene()
    await asyncio.sleep(2)  # Wait for cleanup
    
    # 2. Generate unique names
    cat_name = client.generate_unique_name('mini_', 'cat')
    
    # 3. Create with just filename (client adds path)
    await client.create_entity(
        cat_name, 
        'model', 
        position=[2, 0.5, 2],
        properties={'model_url': 'cat.glb', 'scale': [0.8, 0.8, 0.8]}
    )
    
    # 4. Wait for models to load
    await asyncio.sleep(5)
    
    # 5. Take screenshot
    await client.take_screenshot()
```

### Model File Requirements

- **Format**: `.glb` files only
- **Location**: Must be in `/files/3dmodels/` directory on server
- **Naming**: Use just filename in `model_url` (e.g., `'cat.glb'` not full path)
- **Scaling**: Always specify scale in properties for consistent sizing

### Testing Results

After applying all fixes:
- ✅ **Entity Naming**: Unique names prevent conflicts
- ✅ **Model Loading**: Real 3D models (warriors, characters) load properly
- ✅ **No Fallback Cubes**: System shows actual models or nothing
- ✅ **Scene Cleanup**: Proper deletion prevents state conflicts
- ✅ **Documentation**: Complete API reference with troubleshooting

## Version Information

- **SceneController**: v1.7.0
- **WebSocket Protocol**: v1.4.1
- **Animation System**: 500ms transitions
- **Screenshot System**: Fixed filename (latest_screenshot.png)
- **Model Loading**: Fixed GLB path handling and fallback removal