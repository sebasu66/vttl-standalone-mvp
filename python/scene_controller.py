"""
VTTL Scene Controller - Clean Python library for 3D scene manipulation

This library provides high-level methods for controlling a 3D virtual tabletop scene
with real-time animations and updates.

Architecture:
- WebSocket connection to VTTL server (port 8080)
- Real-time state synchronization with browser client
- Smooth animations with automatic rendering
- Clean API for common operations

Usage:
    from scene_controller import SceneController
    
    async with SceneController() as scene:
        # Create entities
        cube = await scene.create_cube("my_cube", position=[0, 0.5, 0])
        
        # Move with animation
        await scene.move_entity("my_cube", position=[5, 0.5, 0], animate=True)
        
        # Arrange in patterns
        await scene.arrange_in_line(["cube1", "cube2", "cube3"], spacing=2)
"""

import asyncio
import logging
from typing import List, Tuple, Optional, Dict, Any, Union
from dataclasses import dataclass
from vttl_client import VTTLClient, GridPosition


@dataclass
class Position:
    """
    Represents a 3D position in the virtual world
    
    Attributes:
        x (float): X coordinate (left/right axis)
        y (float): Y coordinate (up/down axis) 
        z (float): Z coordinate (forward/back axis)
        facing (float): Rotation angle in degrees (0-360)
        
    Methods:
        to_list(): Convert to [x, y, z] list format for API calls
        to_grid(): Convert to GridPosition for legacy grid-based positioning
    """
    x: float
    y: float 
    z: float
    facing: float = 0.0  # degrees
    
    def to_list(self) -> List[float]:
        """Convert position to list format [x, y, z]"""
        return [self.x, self.y, self.z]
    
    def to_grid(self) -> GridPosition:
        """Convert to GridPosition for grid-based game mechanics"""
        return GridPosition(x=int(self.x), z=int(self.z), y=self.y, facing=self.facing)


@dataclass
class Entity:
    """
    Represents a 3D entity in the virtual scene
    
    This class encapsulates all data for a single entity including its transform,
    type information, and custom properties. Used for local state tracking.
    
    Attributes:
        name (str): Unique identifier for the entity
        entity_type (str): Type of entity (cube, sphere, cylinder, etc.)
        position (Position): 3D position in world space
        rotation (Position, optional): Rotation angles [rx, ry, rz] in degrees
        scale (Position, optional): Scale factors [sx, sy, sz] 
        properties (dict, optional): Custom properties (color, material, etc.)
    """
    name: str
    entity_type: str
    position: Position
    rotation: Optional[Position] = None
    scale: Optional[Position] = None
    properties: Optional[Dict[str, Any]] = None


class SceneController:
    """
    High-level controller for 3D scene manipulation with real-time updates
    
    This is the main interface for controlling the virtual tabletop scene. It provides
    clean, high-level methods for creating entities, arranging them in patterns,
    and managing the 3D environment. All operations are executed in real-time
    with automatic state synchronization.
    
    Key Features:
    - Automatic WebSocket connection management
    - Real-time animations with smooth transitions
    - Pattern-based entity arrangement (lines, circles, grids)
    - Local state tracking and validation
    - Clean async context manager interface
    - Color manipulation and visual effects
    - Camera control and screenshot capture
    
    Usage:
        async with SceneController() as scene:
            # Create entities
            await scene.create_cube("my_cube", [0, 0.5, 0], color=[1, 0, 0])
            
            # Arrange in patterns
            cubes = ["cube1", "cube2", "cube3"]
            await scene.arrange_in_circle(cubes, radius=5)
            
            # Control camera and capture
            await scene.set_camera([0, 10, 10], target=[0, 0, 0])
            await scene.take_screenshot()
    
    Attributes:
        server_url (str): WebSocket server URL
        client (VTTLClient): Low-level WebSocket client
        entities (dict): Local cache of all entities in the scene
        connected (bool): Connection status flag
        logger: Python logging instance for debugging
    """
    
    def __init__(self, server_url: str = "ws://localhost:8080"):
        """
        Initialize the SceneController
        
        Args:
            server_url (str): WebSocket server URL (default: ws://localhost:8080)
        """
        self.server_url = server_url
        self.client = VTTLClient(server_url)
        self.entities: Dict[str, Entity] = {}  # Local entity cache
        self.connected = False
        self.logger = logging.getLogger(__name__)
        
    async def __aenter__(self):
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()
        
    async def connect(self):
        """Connect to the VTTL server"""
        await self.client.connect()
        self.connected = True
        await self._sync_entities()
        self.logger.info("Connected to VTTL scene controller")
        
    async def disconnect(self):
        """Disconnect from the VTTL server"""
        if self.connected:
            await self.client.disconnect()
            self.connected = False
            self.logger.info("Disconnected from VTTL scene controller")
    
    async def _sync_entities(self):
        """Sync current entities from server"""
        try:
            state = await self.client.get_game_state()
            server_entities = state.get('entities', {})
            
            self.entities = {}
            for name, data in server_entities.items():
                pos = Position(*data.get('position', [0, 0, 0]))
                rot = Position(*data.get('rotation', [0, 0, 0])) if data.get('rotation') else None
                scale = Position(*data.get('scale', [1, 1, 1])) if data.get('scale') else None
                
                self.entities[name] = Entity(
                    name=name,
                    entity_type=data.get('template', 'unknown'),
                    position=pos,
                    rotation=rot,
                    scale=scale,
                    properties=data.get('properties', {})
                )
            
            self.logger.info(f"Synced {len(self.entities)} entities from server")
        except Exception as e:
            self.logger.error(f"Failed to sync entities: {e}")
    
    # === ENTITY CREATION ===
    
    async def create_cube(self, name: str, position: Union[Position, List[float]], 
                         color: Optional[List[float]] = None) -> Entity:
        """Create a cube entity with optional color"""
        pos = position if isinstance(position, Position) else Position(*position)
        
        # Use create_entity directly with our specified name
        await self.client.create_entity(name, "cube", grid_pos=pos.to_grid(), 
                                       properties={
                                           "type": "cube",
                                           "color": color or [0.7, 0.7, 0.7]
                                       })
        
        entity = Entity(name=name, entity_type="cube", position=pos, 
                       properties={"color": color})
        self.entities[name] = entity
        return entity
    
    async def create_sphere(self, name: str, position: Union[Position, List[float]], 
                           color: Optional[List[float]] = None) -> Entity:
        """Create a sphere entity with optional color"""
        pos = position if isinstance(position, Position) else Position(*position)
        
        await self.client.create_entity(name, "sphere", grid_pos=pos.to_grid(), 
                                       properties={
                                           "type": "sphere", 
                                           "color": color or [0.7, 0.7, 0.7]
                                       })
        
        entity = Entity(name=name, entity_type="sphere", position=pos,
                       properties={"color": color})
        self.entities[name] = entity
        return entity
    
    async def create_cylinder(self, name: str, position: Union[Position, List[float]], 
                             color: Optional[List[float]] = None) -> Entity:
        """Create a cylinder entity with optional color"""
        pos = position if isinstance(position, Position) else Position(*position)
        
        await self.client.create_entity(name, "cylinder", grid_pos=pos.to_grid(), 
                                       properties={
                                           "type": "cylinder",
                                           "color": color or [0.7, 0.7, 0.7]
                                       })
        
        entity = Entity(name=name, entity_type="cylinder", position=pos,
                       properties={"color": color})
        self.entities[name] = entity
        return entity
    
    async def create_model(self, name: str, model_path: str, position: Union[Position, List[float]], 
                          color: Optional[List[float]] = None, scale: Optional[List[float]] = None) -> Entity:
        """
        Create a 3D model entity from a .glb file
        
        Args:
            name: Unique identifier for the entity
            model_path: Path to the .glb file (relative to /files/assets/ or full path)
            position: 3D position [x, y, z] or Position object
            color: Optional color tint [r, g, b] (0.0-1.0)
            scale: Optional scale factors [sx, sy, sz] (default: [1, 1, 1])
            
        Returns:
            Entity: The created model entity
            
        Example:
            # Load an existing GLB file
            await scene.create_model("my_cat", "cat.glb", [0, 0.5, 0])
            
            # With color tint and scaling
            await scene.create_model("my_eagle", "eagle.glb", 
                                   [5, 0.5, 0], color=[1, 0.2, 0.2], scale=[2, 2, 2])
        """
        pos = position if isinstance(position, Position) else Position(*position)
        
        # Prepare properties for the model
        properties = {
            "type": "model",
            "model_path": model_path,
            "color": color or [1, 1, 1]  # Default white tint
        }
        
        # Use the model path as the template to signal GLB loading on client
        await self.client.create_entity(name, model_path, grid_pos=pos.to_grid(), 
                                       properties=properties)
        
        entity = Entity(name=name, entity_type="model", position=pos,
                       scale=Position(*(scale or [1, 1, 1])),
                       properties=properties)
        self.entities[name] = entity
        
        self.logger.info(f"Created GLB model: {name} from {model_path} at {pos.to_list()}")
        return entity
    
    # === ENTITY MANIPULATION ===
    
    async def move_entity(self, name: str, position: Union[Position, List[float]], 
                         animate: bool = True, duration: float = 0.5, check_collisions: bool = True) -> bool:
        """Move an entity to a new position with optional animation and collision checking"""
        if name not in self.entities:
            raise ValueError(f"Entity '{name}' not found")
            
        pos = position if isinstance(position, Position) else Position(*position)
        
        # Check for collisions before moving if requested
        if check_collisions:
            collisions = await self.check_collisions(name, pos.to_list())
            if collisions['collisions']:
                collision_names = [c['name'] for c in collisions['collisions']]
                self.logger.warning(f"Moving {name} to {pos.to_list()} will collide with: {collision_names}")
            if not collisions['onTable']:
                self.logger.warning(f"Moving {name} to {pos.to_list()} will be off the table")
        
        success = await self.client.move_entity(name, position=pos.to_list(), animate=animate)
        
        if success:
            self.entities[name].position = pos
            self.logger.info(f"Moved {name} to {pos.to_list()}")
            
        return success
    
    async def delete_entity(self, name: str) -> bool:
        """Delete an entity from the scene"""
        if name not in self.entities:
            raise ValueError(f"Entity '{name}' not found")
            
        success = await self.client.delete_entity(name)
        
        if success:
            del self.entities[name]
            self.logger.info(f"Deleted entity {name}")
            
        return success
    
    async def rotate_entity(self, name: str, rotation: Union[Position, List[float]], 
                           animate: bool = True) -> bool:
        """Rotate an entity with optional animation"""
        if name not in self.entities:
            raise ValueError(f"Entity '{name}' not found")
            
        rot = rotation if isinstance(rotation, Position) else Position(*rotation)
        
        success = await self.client.rotate_entity(name, rotation=rot.to_list(), animate=animate)
        
        if success:
            if self.entities[name].rotation is None:
                self.entities[name].rotation = rot
            else:
                self.entities[name].rotation.x = rot.x
                self.entities[name].rotation.y = rot.y
                self.entities[name].rotation.z = rot.z
            self.logger.info(f"Rotated {name} to {rot.to_list()}")
            
        return success
    
    async def update_entity_color(self, name: str, color: List[float]) -> bool:
        """Update an entity's color using JavaScript execution"""
        if name not in self.entities:
            raise ValueError(f"Entity '{name}' not found")
            
        try:
            # Use JavaScript to update the entity color in the browser
            js_code = f"""
            // Find entity in the game state
            const entities = window.vttlGameState?.entities || {{}};
            if (entities['{name}']) {{
                // Update the entity's color property
                entities['{name}'].properties = entities['{name}'].properties || {{}};
                entities['{name}'].properties.color = {color};
                
                // Update the visual in PlayCanvas if the entity exists
                const entityObj = window.app?.root?.findByName('{name}');
                if (entityObj && entityObj.render) {{
                    const material = entityObj.render.material;
                    if (material) {{
                        material.diffuse.set({color[0]}, {color[1]}, {color[2]});
                        material.update();
                    }}
                }}
                
                // Force a render update
                if (window.app) {{
                    window.app.render();
                }}
                
                console.log('Updated {name} color to {color}');
            }} else {{
                console.error('Entity {name} not found');
            }}
            """
            
            await self.client._send_message("execute_javascript", {"code": js_code})
            
            # Update local state
            if self.entities[name].properties is None:
                self.entities[name].properties = {}
            self.entities[name].properties["color"] = color
            
            self.logger.info(f"Updated {name} color to {color}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to update entity color: {e}")
            return False
    
    # === PATTERN ARRANGEMENTS ===
    
    async def arrange_in_line(self, entity_names: List[str], spacing: float = 2.0, 
                             start_position: Optional[Position] = None, 
                             direction: str = "x", animate: bool = True) -> bool:
        """Arrange entities in a straight line"""
        if not entity_names:
            return False
            
        start_pos = start_position or Position(-len(entity_names) * spacing / 2, 0.5, 0)
        
        for i, name in enumerate(entity_names):
            if direction == "x":
                pos = Position(start_pos.x + i * spacing, start_pos.y, start_pos.z)
            elif direction == "z":
                pos = Position(start_pos.x, start_pos.y, start_pos.z + i * spacing)
            else:
                raise ValueError("Direction must be 'x' or 'z'")
                
            await self.move_entity(name, pos, animate=animate)
            if animate:
                await asyncio.sleep(0.1)  # Stagger animations
                
        return True
    
    async def arrange_in_circle(self, entity_names: List[str], radius: float = 3.0,
                               center: Optional[Position] = None, animate: bool = True) -> bool:
        """Arrange entities in a circle"""
        if not entity_names:
            return False
            
        import math
        center_pos = center or Position(0, 0.5, 0)
        
        for i, name in enumerate(entity_names):
            angle = (i / len(entity_names)) * 2 * math.pi
            x = center_pos.x + radius * math.cos(angle)
            z = center_pos.z + radius * math.sin(angle)
            pos = Position(x, center_pos.y, z)
            
            await self.move_entity(name, pos, animate=animate)
            if animate:
                await asyncio.sleep(0.1)  # Stagger animations
                
        return True
    
    async def arrange_in_grid(self, entity_names: List[str], rows: int, cols: int,
                             spacing: float = 2.0, start_position: Optional[Position] = None,
                             animate: bool = True) -> bool:
        """Arrange entities in a grid pattern"""
        if not entity_names or rows * cols < len(entity_names):
            return False
            
        start_pos = start_position or Position(0, 0.5, 0)
        
        for i, name in enumerate(entity_names):
            row = i // cols
            col = i % cols
            
            x = start_pos.x + col * spacing - (cols - 1) * spacing / 2
            z = start_pos.z + row * spacing - (rows - 1) * spacing / 2
            pos = Position(x, start_pos.y, z)
            
            await self.move_entity(name, pos, animate=animate)
            if animate:
                await asyncio.sleep(0.1)  # Stagger animations
                
        return True
    
    async def create_solid_wall(self, name_prefix: str, rows: int, cols: int, 
                               start_position: Optional[Position] = None,
                               color: Optional[List[float]] = None) -> List[str]:
        """Create a solid wall of cubes with no gaps between them"""
        start_pos = start_position or Position(0, 0.5, 0)
        cube_names = []
        
        for row in range(rows):
            for col in range(cols):
                cube_name = f"{name_prefix}_{row}_{col}"
                pos = Position(
                    start_pos.x + col,  # No spacing - cubes touch
                    start_pos.y + row,  # Stack vertically 
                    start_pos.z
                )
                await self.create_cube(cube_name, pos, color)
                cube_names.append(cube_name)
                
        self.logger.info(f"Created solid wall: {len(cube_names)} cubes")
        return cube_names
    
    async def colorize_entities(self, entity_names: List[str], 
                               colors: Optional[List[List[float]]] = None) -> bool:
        """Apply different colors to a list of entities"""
        if not colors:
            # Generate rainbow colors
            import colorsys
            colors = []
            for i in range(len(entity_names)):
                hue = i / len(entity_names)
                rgb = colorsys.hsv_to_rgb(hue, 0.8, 0.8)
                colors.append(list(rgb))
        
        for i, name in enumerate(entity_names):
            color = colors[i % len(colors)]
            await self.update_entity_color(name, color)
            
        return True
    
    # === COLLISION DETECTION ===
    
    async def check_collisions(self, name: str, position: List[float]) -> Dict:
        """Check for collisions at a given position"""
        try:
            return await self.client.check_collisions(name, position)
        except Exception as e:
            self.logger.error(f"Failed to check collisions: {e}")
            return {"collisions": [], "onTable": True}
    
    async def find_safe_position(self, name: str, preferred_position: Union[Position, List[float]], 
                                search_radius: float = 2.0) -> Optional[Position]:
        """Find a safe position near the preferred position without collisions"""
        pos = preferred_position if isinstance(preferred_position, Position) else Position(*preferred_position)
        
        # Try the preferred position first
        collisions = await self.check_collisions(name, pos.to_list())
        if not collisions['collisions'] and collisions['onTable']:
            return pos
        
        # Search in a spiral pattern around the preferred position
        import math
        for radius in [0.5, 1.0, 1.5, 2.0]:
            if radius > search_radius:
                break
            for angle in range(0, 360, 30):  # Check every 30 degrees
                angle_rad = math.radians(angle)
                test_pos = Position(
                    pos.x + radius * math.cos(angle_rad),
                    pos.y,
                    pos.z + radius * math.sin(angle_rad)
                )
                
                collisions = await self.check_collisions(name, test_pos.to_list())
                if not collisions['collisions'] and collisions['onTable']:
                    return test_pos
        
        return None  # No safe position found
    
    # === UTILITY METHODS ===
    
    async def take_screenshot(self) -> bool:
        """Capture a screenshot of the current scene"""
        try:
            await self.client.take_screenshot()
            return True
        except Exception as e:
            self.logger.error(f"Failed to take screenshot: {e}")
            return False
    
    async def clear_scene(self, exclude: Optional[List[str]] = None) -> bool:
        """Delete all entities except those in the exclude list"""
        exclude = exclude or []
        entities_to_delete = [name for name in self.entities.keys() if name not in exclude]
        
        for name in entities_to_delete:
            await self.delete_entity(name)
            
        return True
    
    def get_entity(self, name: str) -> Optional[Entity]:
        """Get entity by name"""
        return self.entities.get(name)
    
    def list_entities(self) -> List[Entity]:
        """Get all entities in the scene"""
        return list(self.entities.values())
    
    def count_entities(self) -> int:
        """Get count of entities in the scene"""
        return len(self.entities)
    
    async def set_camera(self, position: Union[Position, List[float]], 
                        target: Optional[Union[Position, List[float]]] = None) -> bool:
        """Set camera position and target"""
        pos = position if isinstance(position, Position) else Position(*position)
        target_pos = None
        if target:
            target_pos = target if isinstance(target, Position) else Position(*target)
            
        try:
            await self.client._send_message("set_camera", {
                "position": pos.to_list(),
                "target": target_pos.to_list() if target_pos else [0, 0, 0]
            })
            return True
        except Exception as e:
            self.logger.error(f"Failed to set camera: {e}")
            return False
    
    @staticmethod
    def list_available_models() -> List[str]:
        """
        List all available .glb model files in the assets directory
        
        Returns:
            List of model paths that can be used with create_model()
            
        Example:
            models = SceneController.list_available_models()
            print("Available models:", models)
        """
        import os
        
        assets_dir = "/mnt/d/DEV/editor-mcp-server/standalone-mvp/files/3dmodels"
        models = []
        
        try:
            # Walk through all subdirectories to find .glb files
            for root, dirs, files in os.walk(assets_dir):
                for file in files:
                    if file.endswith('.glb'):
                        # Get relative path from assets directory
                        rel_path = os.path.relpath(os.path.join(root, file), assets_dir)
                        models.append(rel_path)
            
            models.sort()  # Sort alphabetically
            return models
            
        except Exception as e:
            print(f"Error listing models: {e}")
            return []


# === CONVENIENCE FUNCTIONS ===

async def quick_demo():
    """Quick demonstration of the scene controller"""
    async with SceneController() as scene:
        # Create some cubes
        await scene.create_cube("cube1", [0, 0.5, 0])
        await scene.create_cube("cube2", [2, 0.5, 0])
        await scene.create_cube("cube3", [4, 0.5, 0])
        
        # Arrange in circle
        await scene.arrange_in_circle(["cube1", "cube2", "cube3"], radius=3)
        
        # Take screenshot
        await scene.take_screenshot()


if __name__ == "__main__":
    # Run demo
    asyncio.run(quick_demo())