# VTTL WebSocket API Specification

## Connection

**Endpoint**: `ws://localhost:8080`  
**Format**: JSON messages  
**Auto-reconnect**: Client attempts ports 8080, 8081, 3001

## Message Structure

All messages follow this format:
```javascript
{
  "action": "command_name",
  "data": {
    // Command-specific parameters
  }
}
```

## Commands

### 1. Create Entity

Creates a new 3D object in the scene.

```javascript
{
  "action": "create_entity",
  "data": {
    "name": "unique_id",                    // Required: Entity identifier
    "template": "cube|sphere|tile|warrior", // Required: Object type
    "position": [x, y, z],                  // Optional: [number, number, number]
    "scale": [x, y, z],                     // Optional: [number, number, number]
    "rotation": [x, y, z],                  // Optional: Euler angles in degrees
    "material": {                           // Optional: Material properties
      "color": [r, g, b],                   // RGB values 0-1
      "metalness": 0.1,                     // 0-1
      "shininess": 30                       // 0-100
    }
  }
}
```

**Response**:
```javascript
{
  "type": "entity_created",
  "data": {
    "name": "unique_id",
    "position": [x, y, z],
    "success": true
  }
}
```

### 2. Move Entity

Moves an existing entity to a new position.

```javascript
{
  "action": "move_entity",
  "data": {
    "name": "entity_id",        // Required: Target entity
    "to": [x, y, z],           // Required: New position
    "animate": true,           // Optional: Smooth animation (default: false)
    "duration": 1.0,           // Optional: Animation time in seconds
    "easing": "linear"         // Optional: "linear", "ease-in", "ease-out"
  }
}
```

### 3. Delete Entity

Removes an entity from the scene.

```javascript
{
  "action": "delete_entity",
  "data": {
    "name": "entity_id"        // Required: Entity to remove
  }
}
```

### 4. Update Entity

Modifies entity properties without recreating it.

```javascript
{
  "action": "update_entity",
  "data": {
    "name": "entity_id",       // Required: Target entity
    "scale": [x, y, z],        // Optional: New scale
    "rotation": [x, y, z],     // Optional: New rotation
    "material": {              // Optional: Material changes
      "color": [r, g, b],
      "metalness": 0.2
    }
  }
}
```

### 5. Query Scene

Gets information about current scene state.

```javascript
{
  "action": "query_scene",
  "data": {
    "filter": {                // Optional: Filter criteria
      "type": "cube",          // Entity type
      "area": {                // Spatial filter
        "center": [x, z],
        "radius": 5
      }
    }
  }
}
```

**Response**:
```javascript
{
  "type": "scene_data",
  "data": {
    "entities": [
      {
        "name": "entity_id",
        "template": "cube",
        "position": [x, y, z],
        "scale": [x, y, z],
        "rotation": [x, y, z]
      }
    ],
    "total": 15
  }
}
```

### 6. Create Board

Generates a game board with specified parameters.

```javascript
{
  "action": "create_board",
  "data": {
    "size": 8,                 // Board dimensions (8x8)
    "tileSize": 1.2,          // Individual tile size
    "pattern": "checkerboard", // "checkerboard", "grid", "hex"
    "colors": {               // Optional: Custom colors
      "light": [0.9, 0.85, 0.7],
      "dark": [0.4, 0.3, 0.2]
    },
    "center": [x, z]          // Optional: Board center position
  }
}
```

### 7. Clear Scene

Removes entities matching criteria.

```javascript
{
  "action": "clear_scene",
  "data": {
    "filter": {               // Optional: What to clear
      "type": "all",          // "all", "entities", "tiles"
      "prefix": "temp_"       // Only entities starting with prefix
    }
  }
}
```

### 8. Screenshot Request

Triggers a screenshot capture.

```javascript
{
  "action": "take_screenshot",
  "data": {
    "filename": "custom_name", // Optional: Custom filename
    "format": "png",          // "png", "jpg"
    "quality": 0.9            // 0-1 for jpg quality
  }
}
```

**Response** (Auto-sent):
```javascript
{
  "type": "screenshot",
  "data": {
    "timestamp": "2025-01-19T...",
    "counter": 0,
    "filename": "screenshot.png",
    "dataURL": "data:image/png;base64,..."
  }
}
```

### 9. Camera Control

Controls the scene camera position and settings.

```javascript
{
  "action": "set_camera",
  "data": {
    "position": [x, y, z],     // Camera world position
    "target": [x, y, z],       // Look-at target
    "fov": 60,                 // Field of view in degrees
    "distance": 18             // Orbit distance for auto-positioning
  }
}
```

### 10. Batch Operations

Execute multiple commands in sequence.

```javascript
{
  "action": "batch",
  "data": {
    "commands": [
      {
        "action": "create_entity",
        "data": { "name": "piece1", "template": "cube" }
      },
      {
        "action": "create_entity", 
        "data": { "name": "piece2", "template": "sphere" }
      }
    ],
    "atomic": true             // All succeed or all fail
  }
}
```

## Entity Templates

### Cube
- **Visual**: Red/orange box
- **Properties**: Metallic finish, casts shadows
- **Default scale**: [1, 1, 1]

### Sphere  
- **Visual**: Blue sphere
- **Properties**: Shiny surface, casts shadows
- **Default scale**: [1, 1, 1]

### Tile
- **Visual**: Flat gray square
- **Properties**: Thin, receives shadows
- **Default scale**: [1, 0.1, 1]

### Warrior
- **Visual**: Red capsule
- **Properties**: Represents miniature figure
- **Default scale**: [0.8, 1.5, 0.8]

## Smart Positioning

When position is not specified:

1. **Grid system**: 1.5-unit spacing
2. **Spiral search**: Starts from center, expands outward
3. **Collision detection**: Avoids occupied positions
4. **Boundary checking**: Stays within 10x10 table area
5. **Fallback**: Random placement if grid full

## Error Responses

```javascript
{
  "type": "error",
  "data": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Entity 'piece1' does not exist",
    "action": "move_entity"
  }
}
```

### Error Codes
- `ENTITY_NOT_FOUND` - Referenced entity doesn't exist
- `INVALID_POSITION` - Position outside valid bounds
- `DUPLICATE_NAME` - Entity name already exists
- `INVALID_TEMPLATE` - Unknown entity template
- `VALIDATION_ERROR` - Invalid parameter values

## Event Notifications

The server sends automatic notifications for scene changes:

### Entity Events
```javascript
{
  "type": "entity_created",
  "data": { "name": "piece1", "position": [2, 1, 3] }
}

{
  "type": "entity_moved", 
  "data": { "name": "piece1", "from": [2, 1, 3], "to": [4, 1, 5] }
}

{
  "type": "entity_deleted",
  "data": { "name": "piece1" }
}
```

### Game State
```javascript
{
  "type": "game_state",
  "data": {
    "entities": {...},
    "grid": { "size": 1.5, "width": 10, "height": 10 },
    "scene": "active"
  }
}
```

## Rate Limiting

- **Max commands/second**: 10
- **Batch size limit**: 50 commands
- **Screenshot frequency**: Max 1 per second

## Connection Management

### Heartbeat
Client sends ping every 30 seconds:
```javascript
{ "action": "ping" }
```

Server responds:
```javascript
{ "type": "pong", "timestamp": "..." }
```

### Reconnection
Client automatically reconnects on disconnection with exponential backoff.

## Usage Patterns

### Game Setup
```javascript
// 1. Clear scene
{ "action": "clear_scene", "data": { "filter": { "type": "all" } } }

// 2. Create board
{ "action": "create_board", "data": { "size": 8 } }

// 3. Add pieces
{ "action": "create_entity", "data": { "name": "player1", "template": "warrior" } }
```

### Animation Sequence
```javascript
// Move with animation
{ 
  "action": "move_entity", 
  "data": { 
    "name": "piece1", 
    "to": [4, 1, 6], 
    "animate": true, 
    "duration": 2.0 
  } 
}
```

### Bulk Operations
```javascript
{
  "action": "batch",
  "data": {
    "commands": [
      // Create multiple pieces at once
    ]
  }
}
```