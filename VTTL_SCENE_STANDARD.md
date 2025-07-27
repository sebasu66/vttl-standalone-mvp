# VTTL Scene Standard v1.0

## Overview
This document defines the standard structure and naming conventions for PlayCanvas Editor scenes used with the VTTL (Virtual Tabletop) AI system.

## Required Scene Structure

### Root Level Organization
```
Root/
├── Cameras/
├── Lighting/
├── Environment/
├── Board/
├── Miniatures/
├── Props/
└── UI/
```

## Naming Conventions

### 1. Cameras
**Required:** At least one camera with standardized name
- `Camera_Main` - Primary gameplay camera (AI-controlled)
- `Camera_Overview` - Top-down tactical view
- `Camera_Cinematic` - For dramatic shots
- `Camera_Player1`, `Camera_Player2` - Player-specific views

**Tags:** All cameras must have tag `vttl_camera`

### 2. Lighting
**Required:** Consistent lighting setup
- `Light_Main` - Primary directional light
- `Light_Ambient` - Ambient lighting entity
- `Light_Fill` - Fill lighting for shadows
- `Light_Rim` - Rim lighting for dramatic effect

**Tags:** All lights must have tag `vttl_light`

### 3. Miniatures (Game Pieces)
**Naming Pattern:** `mini_{type}_{owner}_{id}`
- `mini_warrior_player1_001`
- `mini_mage_player2_001`
- `mini_skeleton_dm_001`
- `mini_dragon_boss_001`

**Tags:** `vttl_mini`, `player_{owner}`, `type_{type}`

**Required Components:**
- Render component (3D model)
- Collision component (for interaction)
- Script component (for AI control)

### 4. Props (Interactive Objects)
**Naming Pattern:** `prop_{type}_{id}`
- `prop_treasure_001`
- `prop_door_001`
- `prop_lever_001`
- `prop_altar_001`

**Tags:** `vttl_prop`, `interactive`, `type_{type}`

### 5. Environment
**Naming Pattern:** `env_{type}_{id}`
- `env_tree_001`
- `env_rock_001`
- `env_building_001`
- `env_wall_001`

**Tags:** `vttl_environment`, `static`

### 6. Board/Terrain
**Required:** Base gaming surface
- `board_main` - Primary game board/table
- `board_grid` - Grid overlay (optional)
- `terrain_ground` - Ground/floor
- `terrain_elevation_{level}` - Height variations

**Tags:** `vttl_board`, `terrain`

### 7. Special Objects
**Naming Pattern:** `special_{type}_{id}`
- `special_spawn_player1`
- `special_objective_001`
- `special_waypoint_001`

**Tags:** `vttl_special`, `type_{type}`

## Required Entity Properties

### All VTTL Entities Must Have:
```javascript
{
  "vttl": {
    "type": "mini|prop|environment|board|special",
    "owner": "player1|player2|dm|neutral",
    "interactive": true|false,
    "ai_controllable": true|false,
    "description": "Human readable description",
    "rules": {
      "movement": 6,
      "actions": ["attack", "defend", "special"],
      "health": 100
    }
  }
}
```

## Camera Configuration Standard

### Required Camera Settings
```javascript
{
  "camera": {
    "fov": 45,
    "nearClip": 0.1,
    "farClip": 1000,
    "clearColor": [0.1, 0.1, 0.1, 1]
  },
  "vttl_camera": {
    "default_position": [0, 15, 10],
    "default_target": [0, 0, 0],
    "movement_bounds": {
      "min": [-50, 5, -50],
      "max": [50, 50, 50]
    },
    "zoom_range": [5, 50]
  }
}
```

## Lighting Standard

### Required Lighting Setup
1. **Main Directional Light**: 45° angle, white color, shadows enabled
2. **Ambient Light**: 20% intensity, warm color
3. **Fill Light**: Soft shadows, opposite to main light
4. **Optional**: Rim lights for dramatic effect

### Light Configuration
```javascript
{
  "light": {
    "type": "directional|spot|point",
    "intensity": 1.0,
    "color": [1, 1, 1],
    "castShadows": true,
    "shadowResolution": 2048
  }
}
```

## Grid System Standard

### World Coordinates
- **Grid Size**: 1 world unit = 1 grid square
- **Origin**: (0, 0, 0) at board center
- **Positive X**: Right
- **Positive Z**: Forward/North
- **Positive Y**: Up

### Grid Naming
- Grid positions: `grid_x{X}_z{Z}` (e.g., `grid_x5_z3`)
- Coordinates start at (0,0) for bottom-left corner

## Scripting Standards

### Required Script Components
All interactive entities should have:
```javascript
{
  "script": {
    "vttl_entity": {
      "enabled": true,
      "attributes": {
        "entity_type": "mini|prop|environment",
        "ai_controllable": true,
        "interaction_range": 1.5
      }
    }
  }
}
```

## Asset Organization

### Folder Structure in PlayCanvas Editor
```
Assets/
├── Models/
│   ├── Miniatures/
│   ├── Props/
│   └── Environment/
├── Materials/
│   ├── Characters/
│   ├── Objects/
│   └── Terrain/
├── Textures/
├── Scripts/
│   ├── AI/
│   ├── UI/
│   └── Game/
└── Scenes/
    ├── Main_Scene
    └── Test_Scenes/
```

## Templates Standard

### Required Templates
Create templates for consistent entity creation:
- `template_mini_humanoid`
- `template_mini_creature`
- `template_prop_interactive`
- `template_prop_static`
- `template_environment_static`

### Template Properties
```javascript
{
  "name": "template_mini_humanoid",
  "components": {
    "render": { "type": "asset" },
    "collision": { "type": "box" },
    "script": ["vttl_entity", "mini_controller"]
  },
  "tags": ["vttl_mini", "template"],
  "scale": [1, 1, 1]
}
```

## AI Integration Points

### Required for AI Control
1. **Named entities** following convention
2. **Consistent tagging** for entity queries
3. **Collision components** for interaction
4. **Script components** for AI hooks
5. **Metadata properties** for AI decision making

### AI Query Examples
```javascript
// Find all player miniatures
app.root.findByTag('vttl_mini', 'player_player1')

// Find interactive props
app.root.findByTag('vttl_prop', 'interactive')

// Find enemies within range
app.root.findByTag('vttl_mini', 'player_dm')
```

## Validation Checklist

### Scene Validation
- [ ] At least one `Camera_Main` exists
- [ ] `Light_Main` directional light present
- [ ] `board_main` entity exists
- [ ] All entities follow naming convention
- [ ] All interactive entities have collision
- [ ] All VTTL entities have required tags
- [ ] Templates are properly configured

### Testing Requirements
- [ ] Camera can be controlled via API
- [ ] Entities can be moved via API
- [ ] Screenshots capture properly
- [ ] Lighting renders correctly
- [ ] All interactive objects respond

## Implementation Guide

### For Scene Designers
1. Start with the standard template
2. Use consistent naming from start
3. Apply tags as you create entities
4. Test with VTTL API frequently
5. Document custom entity types

### For AI Developers
1. Query entities by tags, not names
2. Use standardized coordinate system
3. Respect entity ownership rules
4. Check interactive flags before control
5. Use templates for creating new entities

---

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Status**: Draft for Review