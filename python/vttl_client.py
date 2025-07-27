"""
VTTL Client - Python WebSocket client for AI control of the game
"""
import asyncio
import websockets
import json
import uuid
import time
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import logging

@dataclass
class GridPosition:
    x: int
    z: int
    y: float = 0.0
    facing: float = 0.0  # degrees

@dataclass
class EntityData:
    name: str
    template: str
    position: List[float]
    rotation: List[float] = None
    scale: List[float] = None
    owner: str = None
    properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.rotation is None:
            self.rotation = [0, 0, 0]
        if self.scale is None:
            self.scale = [1, 1, 1]
        if self.properties is None:
            self.properties = {}

class VTTLClient:
    """
    High-level client for VTTL game control
    """
    
    def __init__(self, server_url: str = "ws://localhost:8080"):
        self.server_url = server_url
        self.websocket = None
        self.is_connected = False
        self.game_state = {}
        self.grid_size = 1.0
        self.response_handlers = {}
        self.logger = logging.getLogger(__name__)
        self._entity_counter = 0
        
    async def connect(self):
        """Connect to the VTTL server"""
        try:
            self.websocket = await websockets.connect(self.server_url)
            self.is_connected = True
            self.logger.info(f"Connected to VTTL server at {self.server_url}")
            
            # Start listening for messages
            asyncio.create_task(self._listen_for_messages())
            
        except Exception as e:
            self.logger.error(f"Failed to connect: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from server"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            self.logger.info("Disconnected from VTTL server")
    
    async def _listen_for_messages(self):
        """Listen for incoming messages from server"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self._handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            self.is_connected = False
            self.logger.info("Server connection closed")
        except Exception as e:
            self.logger.error(f"Error listening for messages: {e}")
    
    async def _handle_message(self, data: Dict):
        """Handle incoming messages from server"""
        msg_type = data.get('type')
        
        if msg_type in ['game_state', 'game_state_update']:
            self.game_state = data['data']
            self.logger.debug(f"Game state updated: {len(self.game_state.get('entities', {}))} entities")
        elif msg_type == 'error':
            self.logger.error(f"Server error: {data['message']}")
        else:
            self.logger.debug(f"Received message: {msg_type}")
    
    async def _send_message(self, action: str, data: Dict):
        """Send message to server"""
        if not self.is_connected:
            raise RuntimeError("Not connected to server")
        
        message = {
            "action": action,
            "data": data
        }
        
        await self.websocket.send(json.dumps(message))
    
    # Entity naming helpers
    
    def generate_unique_name(self, prefix: str, entity_type: str = None) -> str:
        """
        Generate a unique entity name with proper conventions
        
        Args:
            prefix: Entity prefix (mini_, prop_, tile_, etc.)
            entity_type: Optional entity type for the name
            
        Returns:
            Unique entity name following VTTL conventions
        """
        self._entity_counter += 1
        timestamp = int(time.time() * 1000) % 10000  # Last 4 digits of timestamp
        
        if entity_type:
            return f"{prefix}{entity_type}_{self._entity_counter}_{timestamp}"
        else:
            return f"{prefix}entity_{self._entity_counter}_{timestamp}"
    
    def validate_entity_name(self, name: str) -> bool:
        """
        Validate entity name follows VTTL conventions
        
        Args:
            name: Entity name to validate
            
        Returns:
            True if name is valid, False otherwise
        """
        valid_prefixes = ['mini_', 'prop_', 'tile_', 'cam_', 'effect_', 'env_']
        return any(name.startswith(prefix) for prefix in valid_prefixes)
    
    def check_entity_exists(self, name: str) -> bool:
        """
        Check if an entity with the given name already exists
        
        Args:
            name: Entity name to check
            
        Returns:
            True if entity exists, False otherwise
        """
        entities = self.game_state.get('entities', {})
        return name in entities
    
    # High-level API methods
    
    async def create_entity(self, name: str, template: str, grid_pos: GridPosition = None, 
                          position: List[float] = None, owner: str = None, 
                          properties: Dict = None) -> bool:
        """
        Create a new entity in the game
        
        Args:
            name: Entity name (should follow naming conventions: mini_, prop_, tile_, etc.)
            template: Template name (cube, sphere, warrior, etc.)
            grid_pos: Grid position (will be converted to world coordinates)
            position: World position (used if grid_pos not provided)
            owner: Player who owns this entity
            properties: Additional entity properties
        """
        if grid_pos:
            position = self.grid_to_world(grid_pos)
        elif position is None:
            position = [0, 0, 0]
        
        entity_data = {
            "name": name,
            "template": template,
            "position": position,
            "owner": owner,
            "properties": properties or {}
        }
        
        await self._send_message("create_entity", entity_data)
        return True
    
    async def move_entity(self, name: str, grid_pos: GridPosition = None, 
                         position: List[float] = None, animate: bool = True) -> bool:
        """
        Move an entity to a new position
        
        Args:
            name: Entity name
            grid_pos: Target grid position
            position: Target world position
            animate: Whether to animate the movement
        """
        if grid_pos:
            position = self.grid_to_world(grid_pos)
        elif position is None:
            raise ValueError("Either grid_pos or position must be provided")
        
        move_data = {
            "name": name,
            "to": position,
            "animate": animate
        }
        
        await self._send_message("move_entity", move_data)
        return True

    async def rotate_entity(self, name: str, rotation: List[float], animate: bool = True) -> bool:
        """
        Rotate an entity to a new orientation
        
        Args:
            name: Entity name
            rotation: Target rotation [rx, ry, rz] in degrees
            animate: Whether to animate the rotation
        """
        rotate_data = {
            "name": name,
            "to": rotation,
            "animate": animate
        }
        
        await self._send_message("rotate_entity", rotate_data)
        return True

    async def check_collisions(self, name: str, position: List[float]) -> Dict:
        """
        Check for collisions at a specific position
        
        Args:
            name: Entity name
            position: Position to check [x, y, z]
            
        Returns:
            Dict with 'collisions' list and 'onTable' boolean
        """
        await self._send_message("check_collisions", {
            "name": name,
            "position": position
        })
        
        # Wait for response
        await asyncio.sleep(0.1)
        
        # The response should be stored in game_state or handled by message listener
        # For now, return a basic response structure
        return {"collisions": [], "onTable": True}
    
    async def delete_entity(self, name: str) -> bool:
        """
        Delete a specific entity from the scene
        
        Args:
            name: Name of the entity to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            ValueError: If entity doesn't exist
        """
        if not self.check_entity_exists(name):
            self.logger.warning(f"Entity '{name}' does not exist, skipping deletion")
            return False
        
        await self._send_message("delete_entity", {"name": name})
        self.logger.debug(f"Deleted entity: {name}")
        return True
    
    async def setup_board(self, board_type: str = "square", size: float = 1.0, 
                         width: int = 10, height: int = 10, create_tiles: bool = True) -> bool:
        """
        Setup the game board
        
        Args:
            board_type: Type of board (square, hex)
            size: Size of each grid square
            width: Board width in grid units
            height: Board height in grid units
            create_tiles: Whether to create visual tiles
        """
        board_data = {
            "type": board_type,
            "size": size,
            "width": width,
            "height": height,
            "createTiles": create_tiles
        }
        
        self.grid_size = size
        await self._send_message("setup_board", board_data)
        return True
    
    async def get_game_state(self) -> Dict:
        """Get current game state"""
        await self._send_message("get_game_state", {})
        # Wait a bit for response
        await asyncio.sleep(0.1)
        return self.game_state
    
    async def clear_scene(self, exclude_prefixes: List[str] = None) -> bool:
        """
        Clear all entities from the scene
        
        Args:
            exclude_prefixes: List of prefixes to exclude from deletion (e.g., ['cam_', 'env_'])
            
        Returns:
            True if clearing was successful
        """
        if exclude_prefixes is None:
            exclude_prefixes = []
        
        # Get fresh game state before clearing
        await self.get_game_state()
        await asyncio.sleep(0.2)  # Wait for state to update
        
        entities = self.game_state.get('entities', {})
        deleted_count = 0
        
        for name in list(entities.keys()):
            # Skip entities with excluded prefixes
            should_exclude = any(name.startswith(prefix) for prefix in exclude_prefixes)
            if not should_exclude:
                try:
                    await self.delete_entity(name)
                    deleted_count += 1
                    await asyncio.sleep(0.1)  # Small delay between deletions
                except Exception as e:
                    self.logger.warning(f"Failed to delete entity {name}: {e}")
        
        self.logger.info(f"Cleared {deleted_count} entities from scene")
        return True
    
    # Utility methods
    
    def grid_to_world(self, grid_pos: GridPosition) -> List[float]:
        """Convert grid position to world coordinates"""
        return [
            grid_pos.x * self.grid_size,
            grid_pos.y,
            grid_pos.z * self.grid_size
        ]
    
    def world_to_grid(self, position: List[float]) -> GridPosition:
        """Convert world coordinates to grid position"""
        return GridPosition(
            x=round(position[0] / self.grid_size),
            z=round(position[2] / self.grid_size),
            y=position[1]
        )
    
    def get_entities_by_prefix(self, prefix: str) -> Dict[str, Dict]:
        """Get all entities with a specific prefix"""
        entities = self.game_state.get('entities', {})
        return {name: data for name, data in entities.items() if name.startswith(prefix)}
    
    def get_available_positions_near(self, center: GridPosition, radius: int = 2) -> List[GridPosition]:
        """
        Get available grid positions near a center point
        
        Args:
            center: Center grid position
            radius: Search radius in grid units
        
        Returns:
            List of available positions
        """
        available = []
        occupied = set()
        
        # Get occupied positions
        entities = self.game_state.get('entities', {})
        for entity_data in entities.values():
            pos = self.world_to_grid(entity_data['position'])
            occupied.add((pos.x, pos.z))
        
        # Check positions in radius
        for dx in range(-radius, radius + 1):
            for dz in range(-radius, radius + 1):
                x = center.x + dx
                z = center.z + dz
                
                if (x, z) not in occupied:
                    available.append(GridPosition(x=x, z=z))
        
        return available
    
    def get_entities_in_range(self, center: GridPosition, radius: int) -> List[str]:
        """Get entity names within range of a position"""
        entities = self.game_state.get('entities', {})
        in_range = []
        
        for name, data in entities.items():
            pos = self.world_to_grid(data['position'])
            distance = abs(pos.x - center.x) + abs(pos.z - center.z)  # Manhattan distance
            
            if distance <= radius:
                in_range.append(name)
        
        return in_range
    
    # Game-specific helper methods
    
    async def create_mini(self, player_id: str, mini_type: str, grid_pos: GridPosition) -> str:
        """Create a miniature for a player"""
        name = f"mini_{mini_type}_{player_id}"
        await self.create_entity(name, mini_type, grid_pos, owner=player_id)
        return name
    
    async def create_prop(self, prop_type: str, grid_pos: GridPosition, properties: Dict = None) -> str:
        """Create a game prop (dice, token, etc.)"""
        prop_id = len(self.get_entities_by_prefix("prop_")) + 1
        name = f"prop_{prop_type}_{prop_id}"
        await self.create_entity(name, prop_type, grid_pos, properties=properties)
        return name
    
    async def move_mini(self, mini_name: str, target_pos: GridPosition, check_path: bool = True) -> bool:
        """Move a miniature with game rules"""
        if check_path:
            # Here you could add pathfinding logic
            pass
        
        await self.move_entity(mini_name, grid_pos=target_pos)
        return True
    
    async def take_screenshot(self) -> str:
        """
        Request a screenshot from the game client
        Returns the path to the saved screenshot file (now always 'latest_screenshot.png')
        """
        await self._send_message("get_screenshot", {})
        
        # Wait longer for screenshot to be processed
        await asyncio.sleep(3)
        
        # Return the fixed screenshot path
        import os
        screenshot_dir = os.path.join(os.path.dirname(__file__), '../screenshots')
        screenshot_path = os.path.join(screenshot_dir, 'latest_screenshot.png')
        
        # Check if the screenshot was actually created
        if os.path.exists(screenshot_path):
            self.logger.info(f"Screenshot saved to: {screenshot_path}")
            return screenshot_path
        else:
            self.logger.error("Screenshot file not found after capture")
            return None
    
    async def get_latest_screenshot_path(self) -> str:
        """Get the path to the most recent screenshot (now always 'latest_screenshot.png')"""
        import os
        screenshot_dir = os.path.join(os.path.dirname(__file__), '../screenshots')
        screenshot_path = os.path.join(screenshot_dir, 'latest_screenshot.png')
        
        if os.path.exists(screenshot_path):
            return screenshot_path
        else:
            return None
    
    async def set_camera_angle(self, angle_x: float = 30, angle_y: float = 0, distance: float = 20) -> bool:
        """
        Set camera angle and distance
        
        Args:
            angle_x: Pitch angle in degrees (0-85)
            angle_y: Yaw angle in degrees 
            distance: Distance from center (5-50)
        """
        await self._send_message("set_camera", {
            "angleX": angle_x,
            "angleY": angle_y, 
            "distance": distance
        })
        
        # Wait for camera to update
        await asyncio.sleep(0.5)
        return True