"""
Scene Controller Examples

These examples demonstrate how to use the clean SceneController API
for common 3D scene manipulation tasks.
"""

import asyncio
import sys
import os
sys.path.append('..')
from scene_controller import SceneController, Position


async def example_basic_operations():
    """Basic entity creation and movement"""
    print("🎮 Example: Basic Operations")
    
    async with SceneController() as scene:
        # Create some entities
        await scene.create_cube("red_cube", [0, 0.5, 0], color=[1, 0, 0])
        await scene.create_sphere("blue_sphere", [2, 0.5, 0], color=[0, 0, 1])
        await scene.create_cylinder("green_cylinder", [4, 0.5, 0], color=[0, 1, 0])
        
        print(f"Created {scene.count_entities()} entities")
        
        # Move them around
        await scene.move_entity("red_cube", [0, 1, 0], animate=True)
        await scene.move_entity("blue_sphere", [2, 1, 2], animate=True)
        await scene.move_entity("green_cylinder", [4, 1, 4], animate=True)
        
        # Take screenshot
        await scene.take_screenshot()
        print("✅ Basic operations complete")


async def example_pattern_arrangements():
    """Demonstrate pattern-based arrangements"""
    print("🎮 Example: Pattern Arrangements")
    
    async with SceneController() as scene:
        # Create multiple cubes
        cube_names = []
        for i in range(6):
            name = f"pattern_cube_{i+1}"
            await scene.create_cube(name, [i*2, 0.5, 0])
            cube_names.append(name)
        
        print(f"Created {len(cube_names)} cubes")
        
        # Arrange in different patterns
        print("📐 Arranging in line...")
        await scene.arrange_in_line(cube_names[:3], spacing=1.5)
        await asyncio.sleep(2)
        
        print("🔄 Arranging in circle...")
        await scene.arrange_in_circle(cube_names, radius=4)
        await asyncio.sleep(2)
        
        print("📊 Arranging in grid...")
        await scene.arrange_in_grid(cube_names, rows=2, cols=3, spacing=2)
        
        await scene.take_screenshot()
        print("✅ Pattern arrangements complete")


async def example_game_setup():
    """Example of setting up a game board"""
    print("🎮 Example: Game Board Setup")
    
    async with SceneController() as scene:
        # Clear any existing entities
        await scene.clear_scene()
        
        # Create player pieces
        await scene.create_cylinder("player1", [-5, 0.5, -5], color=[1, 0, 0])  # Red
        await scene.create_cylinder("player2", [5, 0.5, 5], color=[0, 0, 1])    # Blue
        
        # Create game pieces in center
        game_pieces = []
        for i in range(4):
            name = f"game_piece_{i+1}"
            await scene.create_cube(name, [0, 0.5, 0], color=[0.8, 0.8, 0.2])  # Yellow
            game_pieces.append(name)
        
        # Arrange game pieces in a square
        await scene.arrange_in_grid(game_pieces, rows=2, cols=2, spacing=1.5,
                                   start_position=Position(0, 0.5, 0))
        
        # Set camera to overview position
        await scene.set_camera([0, 10, 10], target=[0, 0, 0])
        
        await scene.take_screenshot()
        print("✅ Game board setup complete")


async def example_animation_showcase():
    """Showcase smooth animations"""
    print("🎮 Example: Animation Showcase")
    
    async with SceneController() as scene:
        # Create a single cube to showcase movement
        await scene.create_cube("demo_cube", [0, 0.5, 0], color=[1, 0.5, 0])  # Orange
        
        # Create a path of positions
        path = [
            Position(0, 0.5, 0),    # Start
            Position(3, 0.5, 0),    # Right
            Position(3, 0.5, 3),    # Forward
            Position(0, 0.5, 3),    # Left
            Position(0, 2, 3),      # Up
            Position(0, 2, 0),      # Back (elevated)
            Position(0, 0.5, 0)     # Down to start
        ]
        
        print("🎬 Starting animation sequence...")
        for i, pos in enumerate(path[1:], 1):
            print(f"   Step {i}: Moving to [{pos.x}, {pos.y}, {pos.z}]")
            await scene.move_entity("demo_cube", pos, animate=True)
            await asyncio.sleep(1)  # Wait for animation to complete
        
        await scene.take_screenshot()
        print("✅ Animation showcase complete")


async def example_entity_management():
    """Demonstrate entity management features"""
    print("🎮 Example: Entity Management")
    
    async with SceneController() as scene:
        # Create various entities
        await scene.create_cube("temp_cube1", [0, 0.5, 0])
        await scene.create_cube("temp_cube2", [2, 0.5, 0])
        await scene.create_sphere("keeper_sphere", [4, 0.5, 0])
        
        print(f"Total entities: {scene.count_entities()}")
        
        # List all entities
        for entity in scene.list_entities():
            print(f"  {entity.name}: {entity.entity_type} at {entity.position.to_list()}")
        
        # Get specific entity
        sphere = scene.get_entity("keeper_sphere")
        if sphere:
            print(f"Found sphere at: {sphere.position.to_list()}")
        
        # Clear scene but keep the sphere
        await scene.clear_scene(exclude=["keeper_sphere"])
        print(f"After cleanup: {scene.count_entities()} entities remain")
        
        await scene.take_screenshot()
        print("✅ Entity management complete")


async def run_all_examples():
    """Run all examples in sequence"""
    examples = [
        example_basic_operations,
        example_pattern_arrangements,
        example_game_setup,
        example_animation_showcase,
        example_entity_management
    ]
    
    for example in examples:
        try:
            await example()
            await asyncio.sleep(2)  # Pause between examples
        except Exception as e:
            print(f"❌ Error in {example.__name__}: {e}")
        
        print("-" * 50)


if __name__ == "__main__":
    # Run all examples
    asyncio.run(run_all_examples())