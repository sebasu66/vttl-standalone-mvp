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
- [ ] Default scene_state.json
- [ ] Basic server with JSON loading

### Checkpoint 2: Server Core
- [ ] WebSocket server with diff-based sync
- [ ] JSON change detection
- [ ] Client communication protocol

### Checkpoint 3: Python API
- [ ] Modular SOLID-compliant structure
- [ ] JSON manager with validation
- [ ] Basic entity operations

### Checkpoint 4: Client Integration
- [ ] PlayCanvas client with sync
- [ ] Animation handling
- [ ] Screenshot capture

### Checkpoint 5: AI Integration
- [ ] Ollama client
- [ ] Natural language interpretation
- [ ] Complete workflow

## Key Features

### JSON-First Architecture
All scene state lives in a single JSON file. No database, no complex state management - just a well-structured JSON file that serves as the authoritative source.

### SOLID Python Classes
Every Python class follows SOLID principles and is under 500 lines. Easy to understand, maintain, and extend.

### Efficient Updates
Instead of sending the entire scene on every change, the server calculates diffs and sends only what changed, with proper animation hints.

### AI-Driven
Built specifically for AI control. The AI can modify the scene through clean Python APIs and verify changes through automatic screenshots.

## Technology Stack
- **Server**: Node.js with WebSocket
- **Client**: PlayCanvas 3D engine
- **API**: Python with asyncio
- **AI**: Ollama (local LLM)
- **Data**: JSON file storage

## Version History
- **v2.0**: Complete rewrite with JSON-first, SOLID architecture
- **v1.x**: Legacy implementation (see parent directory)