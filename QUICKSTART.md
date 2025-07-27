# VTTL MVP Quickstart Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- Modern web browser

### 1. Install Server Dependencies
```bash
cd standalone-mvp/server
npm install
```

### 2. Install Python Dependencies
```bash
cd ../python
pip install -r requirements.txt
```

### 3. Start the Game Server
```bash
cd ../server
npm start
```
You should see:
```
HTTP Server running on http://localhost:3000
WebSocket Server running on ws://localhost:8080
```

### 4. Open the Game Client
Open your browser and go to: **http://localhost:3000**

You should see:
- ✅ Connected to server (green status)
- 3D scene with ground plane
- Camera controls (drag to rotate, scroll to zoom)

### 5. Test AI Control
```bash
cd ../python
python examples/basic_test.py
```

Choose option 1 for basic operations test.

## 🎮 What You Should See

1. **Browser**: 3D scene with board tiles appearing
2. **Console**: Log messages showing AI actions
3. **Browser**: Miniatures (red capsules) moving around
4. **Browser**: Props (blue spheres, gray cubes) appearing

## 🔧 Manual Testing

Use the buttons in the browser:
- **Create Test Cube**: Adds random cube
- **Move Last Entity**: Moves the last created entity
- **Create Board**: Creates a 10x10 tile board
- **Clear Scene**: Removes all entities

## 🤖 AI Features Demonstrated

### Basic Operations
```python
# Create entities with grid positioning
await client.create_entity("mini_warrior_p1", "warrior", GridPosition(3, 4))

# Move with animation
await client.move_entity("mini_warrior_p1", GridPosition(5, 6), animate=True)

# Setup game boards
await client.setup_board("square", size=1.0, width=8, height=8)
```

### Smart Functions
```python
# Find available positions near a location
positions = client.get_available_positions_near(GridPosition(3, 3), radius=2)

# Get entities in range
nearby = client.get_entities_in_range(GridPosition(3, 3), radius=3)

# Filter by type
warriors = client.get_entities_by_prefix("mini_warrior")
props = client.get_entities_by_prefix("prop_")
```

## 🏗️ Architecture

```
Python AI ←→ WebSocket Server ←→ PlayCanvas Engine ←→ Browser
```

- **No Chrome Extension needed!**
- **No PlayCanvas Editor required!**
- **Standalone 3D game engine**
- **Real-time AI control**

## 🎯 Next Steps

1. **Modify Templates**: Edit `client/app.js` to add new 3D models
2. **Add Game Rules**: Extend Python client with game logic
3. **Multi-Player**: Add player session management
4. **Persist State**: Add database for game state
5. **Deploy**: Package as Electron app or web deployment

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8080

# Kill processes if needed
kill -9 <PID>
```

### Python Connection Issues
```bash
# Test WebSocket manually
python -c "
import asyncio
import websockets

async def test():
    async with websockets.connect('ws://localhost:8080') as ws:
        print('Connected!')

asyncio.run(test())
"
```

### Browser Issues
- Clear browser cache
- Check browser console for errors
- Ensure WebGL is enabled

## 🎲 Example Use Cases

### D&D Style Combat
```python
# Setup dungeon room
await client.setup_board("square", 1.0, 15, 15)

# Place party
party_pos = [GridPosition(2, 7), GridPosition(3, 7), GridPosition(4, 7)]
for i, pos in enumerate(party_pos):
    await client.create_mini(f"player_{i}", "warrior", pos)

# Add monsters  
monster_positions = [GridPosition(12, 7), GridPosition(12, 8)]
for i, pos in enumerate(monster_positions):
    await client.create_mini(f"monster_{i}", "warrior", pos)
```

### Board Game
```python
# Chess-like setup
await client.setup_board("square", 1.0, 8, 8)

# Place pieces
for x in range(8):
    await client.create_mini(f"white_pawn_{x}", "warrior", GridPosition(x, 1))
    await client.create_mini(f"black_pawn_{x}", "warrior", GridPosition(x, 6))
```

## 📚 API Reference

See `vttl_client.py` for complete API documentation.

Key methods:
- `create_entity()` - Create game objects
- `move_entity()` - Move with animation
- `setup_board()` - Configure game board
- `get_entities_by_prefix()` - Filter entities
- `get_available_positions_near()` - Pathfinding helper
- `get_entities_in_range()` - Range queries