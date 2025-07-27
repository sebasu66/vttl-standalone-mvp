#!/usr/bin/env python3
"""
Interactive Scene Editor - Manual control for adding assets
"""
import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vttl_client import VTTLClient, GridPosition

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class InteractiveEditor:
    def __init__(self):
        self.client = VTTLClient("ws://localhost:8080")
        
    async def connect(self):
        await self.client.connect()
        
    async def disconnect(self):
        await self.client.disconnect()
        
    async def show_menu(self):
        """Show interactive menu"""
        print("\n🎨 VTTL Interactive Scene Editor")
        print("================================")
        print("1. Add Warrior")
        print("2. Add Treasure (sphere)")
        print("3. Add Obstacle (cube)")
        print("4. Move Entity")
        print("5. Create Board")
        print("6. Clear Scene")
        print("7. Take Screenshot")
        print("8. Set Camera Angle")
        print("9. List Entities")
        print("0. Exit")
        
    async def add_warrior(self):
        """Add a warrior interactively"""
        player_id = input("Player ID (e.g., 'player1'): ").strip()
        x = int(input("Grid X position: "))
        z = int(input("Grid Z position: "))
        
        warrior_name = await self.client.create_mini(player_id, "warrior", GridPosition(x, z))
        print(f"✅ Created warrior: {warrior_name} at ({x}, {z})")
        
    async def add_treasure(self):
        """Add a treasure sphere"""
        x = int(input("Grid X position: "))
        z = int(input("Grid Z position: "))
        treasure_type = input("Treasure type (default: 'gold'): ").strip() or "gold"
        
        treasure_name = await self.client.create_prop("sphere", GridPosition(x, z), {"type": treasure_type})
        print(f"✅ Created treasure: {treasure_name} at ({x}, {z})")
        
    async def add_obstacle(self):
        """Add an obstacle cube"""
        x = int(input("Grid X position: "))
        z = int(input("Grid Z position: "))
        obstacle_type = input("Obstacle type (default: 'wall'): ").strip() or "wall"
        
        obstacle_name = await self.client.create_prop("cube", GridPosition(x, z), {"type": obstacle_type})
        print(f"✅ Created obstacle: {obstacle_name} at ({x}, {z})")
        
    async def move_entity(self):
        """Move an existing entity"""
        await self.list_entities()
        entity_name = input("Entity name to move: ").strip()
        x = int(input("New Grid X position: "))
        z = int(input("New Grid Z position: "))
        
        if entity_name.startswith('mini_'):
            await self.client.move_mini(entity_name, GridPosition(x, z))
        else:
            await self.client.move_entity(entity_name, GridPosition(x, z))
        print(f"✅ Moved {entity_name} to ({x}, {z})")
        
    async def create_board(self):
        """Create a new board"""
        board_type = input("Board type (square/hex, default: square): ").strip() or "square"
        size = float(input("Grid size (default: 1.0): ") or "1.0")
        width = int(input("Board width (default: 8): ") or "8")
        height = int(input("Board height (default: 8): ") or "8")
        
        await self.client.setup_board(board_type, size, width, height)
        print(f"✅ Created {width}x{height} {board_type} board")
        
    async def clear_scene(self):
        """Clear the entire scene"""
        confirm = input("Clear entire scene? (y/N): ").strip().lower()
        if confirm == 'y':
            await self.client.clear_scene()
            print("✅ Scene cleared")
        else:
            print("❌ Cancelled")
            
    async def take_screenshot(self):
        """Take a screenshot"""
        screenshot = await self.client.take_screenshot()
        if screenshot:
            print(f"✅ Screenshot saved: {os.path.basename(screenshot)}")
        else:
            print("❌ Screenshot failed")
            
    async def set_camera(self):
        """Set camera angle"""
        print("Current camera angles:")
        print("  Angle X (pitch): 0-85 degrees")
        print("  Angle Y (yaw): 0-360 degrees") 
        print("  Distance: 5-50 units")
        
        angle_x = float(input("Angle X (default: 30): ") or "30")
        angle_y = float(input("Angle Y (default: 0): ") or "0")
        distance = float(input("Distance (default: 20): ") or "20")
        
        await self.client.set_camera_angle(angle_x, angle_y, distance)
        print(f"✅ Camera set: X={angle_x}°, Y={angle_y}°, Distance={distance}")
        
    async def list_entities(self):
        """List all entities in scene"""
        state = await self.client.get_game_state()
        entities = state.get('entities', {})
        
        print(f"\n📋 Scene Entities ({len(entities)} total):")
        
        # Group by type
        minis = [name for name in entities.keys() if name.startswith('mini_')]
        props = [name for name in entities.keys() if name.startswith('prop_')]
        tiles = [name for name in entities.keys() if name.startswith('tile_')]
        
        if minis:
            print(f"  🔴 Warriors ({len(minis)}):")
            for name in minis[:5]:  # Show first 5
                pos = entities[name]['position']
                grid_pos = self.client.world_to_grid(pos)
                print(f"    - {name}: Grid({grid_pos.x}, {grid_pos.z})")
            if len(minis) > 5:
                print(f"    ... and {len(minis) - 5} more")
                
        if props:
            print(f"  🎯 Props ({len(props)}):")
            for name in props:
                pos = entities[name]['position']
                grid_pos = self.client.world_to_grid(pos)
                template = entities[name].get('template', 'unknown')
                print(f"    - {name}: {template} at Grid({grid_pos.x}, {grid_pos.z})")
                
        if tiles:
            print(f"  ⬜ Board Tiles: {len(tiles)}")
            
    async def run(self):
        """Run the interactive editor"""
        try:
            await self.connect()
            print("🎮 Connected to VTTL server")
            print("🌐 Make sure browser is open at http://localhost:3001")
            
            while True:
                await self.show_menu()
                choice = input("\nChoose option (0-9): ").strip()
                
                try:
                    if choice == '1':
                        await self.add_warrior()
                    elif choice == '2':
                        await self.add_treasure()
                    elif choice == '3':
                        await self.add_obstacle()
                    elif choice == '4':
                        await self.move_entity()
                    elif choice == '5':
                        await self.create_board()
                    elif choice == '6':
                        await self.clear_scene()
                    elif choice == '7':
                        await self.take_screenshot()
                    elif choice == '8':
                        await self.set_camera()
                    elif choice == '9':
                        await self.list_entities()
                    elif choice == '0':
                        print("👋 Goodbye!")
                        break
                    else:
                        print("❌ Invalid option")
                        
                except Exception as e:
                    print(f"❌ Error: {e}")
                    
        except KeyboardInterrupt:
            print("\n👋 Editor closed")
        finally:
            await self.disconnect()

if __name__ == "__main__":
    editor = InteractiveEditor()
    asyncio.run(editor.run())