# VTTL v2.0 - Quick Start Guide

## ✅ Checkpoint 1 Complete!

VTTL v2.0 foundation is ready to test! Here's how to start the system:

## 🚀 Start the Server

```bash
cd v2/server
npm install
npm start
```

Expected output:
```
🚀 VTTL v2.0 Server Starting...
✅ Scene loaded: Default VTTL Scene
   Version: 2.0.0
   Entities: 1
   Models: 1
   Lights: 2
   Cameras: 1
🌐 HTTP Server: http://localhost:3002
🔌 WebSocket Server: ws://localhost:8082
📁 Client: http://localhost:3002/client/
✅ VTTL v2.0 Server ready for connections!
```

## 🌐 Open the Client

Navigate to: **http://localhost:3002/client/**

You should see:
- ✅ Green connection indicator
- Scene info showing 1 entity, 1 model, 2 lights, 1 camera
- 3D scene with white table, red demo cube, proper lighting
- GSAP integration ready for animations

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

### ✅ Foundation Complete (Checkpoint 1)
- **JSON-First Architecture**: Single source of truth in `scene_state.json`
- **WebSocket Communication**: Real-time client-server sync
- **PlayCanvas Integration**: 3D rendering with proper scene loading
- **GSAP Ready**: Animation library loaded and registered
- **Basic Scene**: Table, lights, camera, demo cube all rendering

### 🎨 Scene Structure
```json
{
  "version": "2.0.0",
  "cameras": { "MainCamera": {...} },
  "lights": { 
    "MainDirectionalLight": {...},
    "MainSpotLight": {...}
  },
  "models": { "GameTable": {...} },
  "entities": { "demo_red_cube": {...} }
}
```

## 🔄 Next Steps (Checkpoint 2)

The foundation is solid! Next we'll add:

1. **DiffCalculator**: Detect changes between scene states
2. **Enhanced Sync**: Only send what changed, not full scene
3. **GSAP Animation Integration**: Automatic smooth vs instant property handling
4. **Python API**: Clean SOLID-compliant Python classes

## 🐛 Troubleshooting

**Server won't start**: Check if ports 3002/8082 are available
**Client won't connect**: Ensure server is running first
**Scene won't load**: Check console for WebSocket connection errors
**3D not rendering**: Verify PlayCanvas loaded (check browser console)

## 📊 System Status

- **Server**: Express + WebSocket ✅
- **Client**: PlayCanvas + GSAP ✅  
- **Scene Loading**: JSON → 3D ✅
- **Communication**: Bidirectional WebSocket ✅
- **Animation Framework**: GSAP Flip ready ✅

Ready for **Checkpoint 2: Enhanced Server Core**! 🚀