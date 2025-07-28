# VTTL v2.0 - Quick Start Guide

## ✅ Checkpoints 1-4 Complete!

VTTL v2.0 core system is fully implemented and ready to test! Here's how to start the system:

## 🚀 Start the Server

```bash
cd v2/server
npm install
npm start
```

Expected output:
```
🚀 VTTL v2.0.0 Server Starting with Auto-Restart...
✅ Scene loaded: 3D Models Showcase - WebGPU Clean
   Version: 2.0.0
   Entities: 6
   Models: 0
   Lights: 3
   Cameras: 2
🌐 HTTP Server: http://localhost:3002
🔌 WebSocket Server: ws://localhost:8082
📁 Client: http://localhost:3002/client/
✅ VTTL v2.0 Server ready for connections!
```

## 🌐 Open the Client

Navigate to: **http://localhost:3002/client/**

You should see:
- ✅ Green connection indicator
- Scene info showing 18+ entities organized by type
- 3D scene with 18 animals (cats, eagles, bunnies, wolves), forest backdrop, and ground plane
- WebGPU rendering with photographic quality shadows
- Individual camera switching system working

## 🧪 Test the System

### API Health Check
```bash
curl http://localhost:3002/api/health
```

### Get Scene Data
```bash
curl http://localhost:3002/api/scene
```

### Client Features
- **Test Connection**: Sends ping to server
- **Screenshot**: Captures current 3D scene
- **Reload Scene**: Requests fresh scene data

## 🎯 What's Working

### ✅ Core System Complete (Checkpoints 1-4)
- **JSON-First Architecture**: Single source of truth in `scene_state.json`
- **Server-as-Source-of-Truth**: Complete synchronization with scene hash verification
- **Real-time WebSocket Sync**: Diff-based updates with automatic resync detection
- **Modular Client Architecture**: SceneManager, WebSocketManager, EntityAnimationSystem, DebugUI
- **3D Model Loading**: GLB support with `/3dmodels` static serving
- **Camera Switching System**: Individual mainCamera position control
- **GSAP Animation System**: Smooth transitions for position/rotation/scale changes
- **WebGPU Rendering**: 4K shadows, PCF5 filtering, HDR tone mapping
- **Photographic Quality Scene**: 18 animals organized by type, 4-point lighting

### 🎨 Current Scene Structure
```json
{
  "version": "2.0.0",
  "cameras": { 
    "mainCamera": {...}, 
    "showcase_camera": {...},
    "overhead_camera": {...},
    "wide_angle_camera": {...},
    "close_up_camera": {...}
  },
  "lights": { 
    "main_sun": {...},
    "north_light": {...}, "south_light": {...},
    "east_light": {...}, "west_light": {...}
  },
  "entities": {
    "ground_plane": {...},
    "cat_center": {...}, "mini_cat_1": {...}, // 4 cats total
    "eagle_left": {...}, "mini_eagle_1": {...}, // 4 eagles total  
    "bunny_right": {...}, "bunny_1": {...}, // 5 bunnies total
    "wolf_back": {...}, "wolf_1": {...}, // 5 wolves total
    "forest_background": {...} // 4 forest pieces total
  }
}
```

## 🔄 Next Steps (Checkpoints 5-6)

The core system is complete! Next phases:

### Checkpoint 5: Python API Layer
1. **Modular SOLID-compliant structure**: Clean entity and operation classes
2. **JSON manager with validation**: Schema validation and safe updates
3. **High-level scene control API**: Easy-to-use Python interface
4. **Basic entity operations**: Create, move, delete, animate entities

### Checkpoint 6: AI Integration
1. **Ollama client**: Local LLM integration for natural language
2. **Natural language interpretation**: Parse user requests into scene operations
3. **Complete workflow with AI verification**: Screenshot-based feedback loop
4. **AI scene control**: "Move the red cat to the left", "Add 3 wolves near the forest"

## 🐛 Troubleshooting

**Server won't start**: Check if ports 3002/8082 are available
**Client won't connect**: Ensure server is running first
**Scene won't load**: Check console for WebSocket connection errors
**3D not rendering**: Verify PlayCanvas loaded (check browser console)

## 📊 System Status

- **Server**: Express + WebSocket with diff-based sync ✅
- **Client**: Modular PlayCanvas with GSAP animations ✅  
- **Scene Loading**: JSON → 3D with GLB model support ✅
- **Communication**: Server-as-source-of-truth synchronization ✅
- **Rendering**: WebGPU with photographic quality shadows ✅
- **Camera System**: Individual switching with mainCamera control ✅

Ready for **Checkpoint 5: Python API Layer**! 🚀