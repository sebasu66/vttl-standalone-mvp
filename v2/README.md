# VTTL v2.0 - AI-Controlled Virtual Tabletop System

## Overview
A clean, AI-driven virtual tabletop system built from scratch with modern architecture principles:

- **JSON-First**: Single source of truth for all scene state
- **Modular Python API**: SOLID-compliant architecture with <500 line classes
- **Efficient Updates**: Diff-based synchronization between server and client
- **AI Integration**: Natural language scene control via Ollama
- **Visual Validation**: Automatic screenshot capture for AI verification

## Architecture

### Core Principles
1. **Single Source of Truth**: `data/scene_state.json` contains all scene information
2. **Clean Separation**: Python → JSON → Server → Client pipeline
3. **Efficient Communication**: Only changes are transmitted, not full state
4. **AI-First Design**: Built for natural language interaction

### Flow
```
Server Start → Load JSON → Send Initial State → Client Renders
↓
User talks to AI → AI modifies JSON via Python → Validates & Saves
↓
Python calls sync → Server calculates diff → Sends changes to client
↓
Client applies animated updates → Screenshot captured → AI verifies
```

## Directory Structure
```
v2/
├── README.md                    # This file
├── TASKS.md                     # Implementation checklist
├── server/                      # Node.js server
│   ├── core/                    # Core server classes
│   ├── sync/                    # Diff-based sync system
│   └── main.js                  # Server entry point
├── client/                      # Browser client
│   ├── core/                    # PlayCanvas integration
│   ├── sync/                    # Client sync handler
│   └── index.html               # Client entry point
├── python/                      # Python API (SOLID compliant)
│   ├── core/                    # JSON management, validation
│   ├── entities/                # Entity classes (cubes, lights, cameras)
│   ├── operations/              # Scene operations, animations
│   ├── ai/                      # AI integration (Ollama)
│   ├── utils/                   # Utilities (screenshots, positioning)
│   └── main_controller.py       # High-level API facade
└── data/                        # Scene data
    ├── scene_state.json         # Main scene file
    └── screenshots/             # Auto-generated screenshots
```

## Quick Start

### 1. Start Server
```bash
cd v2/server
npm install
npm start
```

### 2. Open Client
Navigate to `http://localhost:3002/client/`

### 3. Use Python API
```python
from python.main_controller import SceneController
from python.ai.ollama_client import OllamaClient

async with SceneController() as scene:
    ai = OllamaClient()
    
    # Natural language control
    await ai.interpret_and_execute(
        "Place a red cube in the center of the table", 
        scene
    )
```

## Development Checkpoints

### Checkpoint 1: Core Foundation ✅
- [x] Folder structure created
- [x] Basic documentation
- [x] Default scene_state.json with organized animal scene
- [x] Basic server with JSON loading

### Checkpoint 2: Server Core ✅
- [x] WebSocket server with diff-based sync
- [x] JSON change detection with scene hash verification
- [x] Client communication protocol with automatic resync
- [x] Server-as-source-of-truth synchronization system

### Checkpoint 3: Client Integration ✅
- [x] PlayCanvas client with modular sync system
- [x] GSAP animation handling for smooth transitions
- [x] Screenshot capture with server-side integration
- [x] Camera switching system with mainCamera control
- [x] 3D model loading with GLB support and static serving

### Checkpoint 4: Scene Features ✅
- [x] Photographic quality shadows with 4K PCF5 filtering
- [x] WebGPU rendering with HDR and ACES tone mapping
- [x] 4-point lighting system for cinematic quality
- [x] Individual camera position control for precise scene showcasing
- [x] Organized scene with 18 animals grouped by type

### Checkpoint 5: Python API (Pending)
- [ ] Modular SOLID-compliant structure
- [ ] JSON manager with validation
- [ ] Basic entity operations
- [ ] High-level scene control API

### Checkpoint 6: AI Integration (Pending)
- [ ] Ollama client
- [ ] Natural language interpretation
- [ ] Complete workflow with AI verification
- [ ] Screenshot-based AI feedback loop

## Key Features

### JSON-First Architecture ✅ Implemented
All scene state lives in a single JSON file. No database, no complex state management - just a well-structured JSON file that serves as the authoritative source.

### Server-as-Source-of-Truth ✅ Implemented
Complete synchronization system where the server scene is the only source of truth. Client never shows anything different from the server state, with automatic desync detection and recovery.

### Modular Client Architecture ✅ Implemented
SOLID-compliant client components: SceneManager, WebSocketManager, EntityAnimationSystem, and DebugUI. Each component handles a specific concern with clean interfaces.

### Efficient Updates ✅ Implemented
Instead of sending the entire scene on every change, the server calculates diffs and sends only what changed, with proper animation hints for smooth transitions.

### Individual Camera Control ✅ Implemented
Camera positions can be sent one by one for precise scene showcasing. The mainCamera switching system ensures viewport updates work correctly.

### Photographic Quality Rendering ✅ Implemented
WebGPU-based rendering with 4K shadows, PCF5 filtering, HDR tone mapping, and 4-point lighting system for cinematic quality visuals.

### AI-Ready (Pending Implementation)
Built specifically for AI control. The AI will modify the scene through clean Python APIs and verify changes through automatic screenshots.

## Technology Stack
- **Server**: Node.js with WebSocket
- **Client**: PlayCanvas 3D engine
- **API**: Python with asyncio
- **AI**: Ollama (local LLM)
- **Data**: JSON file storage

## Version History
- **v2.0**: Complete rewrite with JSON-first, SOLID architecture
- **v1.x**: Legacy implementation (see parent directory)