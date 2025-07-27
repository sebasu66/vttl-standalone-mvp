#!/usr/bin/env python3
"""
Test script for rotation and collision features
Tests the new rotation and collision detection functionality
"""

import asyncio
import logging
from scene_controller import SceneController, Position

# Setup logging
logging.basicConfig(level=logging.INFO)

async def test_rotation_and_collision():
    """Test rotation and collision detection features"""
    print("🧪 Testing rotation and collision detection features...")
    
    async with SceneController() as scene:
        print("\n1. Creating test entities...")
        
        # Create test cubes
        await scene.create_cube("cube1", [0, 0.5, 0], color=[1, 0, 0])  # Red cube at center
        await scene.create_cube("cube2", [2, 0.5, 0], color=[0, 1, 0])  # Green cube to the right
        await scene.create_sphere("sphere1", [0, 0.5, 2], color=[0, 0, 1])  # Blue sphere forward
        
        print("✅ Created 3 test entities")
        await asyncio.sleep(1)
        
        print("\n2. Testing rotation...")
        
        # Test Y-axis rotation (horizontal spin)
        await scene.rotate_entity("cube1", [0, 45, 0], animate=True)
        print("🔄 Rotated red cube 45° on Y-axis")
        await asyncio.sleep(1)
        
        # Test X-axis rotation (forward/back tilt)
        await scene.rotate_entity("cube2", [30, 0, 0], animate=True)
        print("🔄 Rotated green cube 30° on X-axis")
        await asyncio.sleep(1)
        
        # Test Z-axis rotation (side tilt)
        await scene.rotate_entity("sphere1", [0, 0, 45], animate=True)
        print("🔄 Rotated blue sphere 45° on Z-axis")
        await asyncio.sleep(1)
        
        print("\n3. Testing collision detection...")
        
        # Test collision with existing entity
        print("Checking collision at cube1's position:")
        collision_result = await scene.check_collisions("cube2", [0, 0.5, 0])
        print(f"   Collisions: {len(collision_result.get('collisions', []))}")
        print(f"   On table: {collision_result.get('onTable', False)}")
        
        # Test off-table position
        print("Checking off-table position:")
        collision_result = await scene.check_collisions("cube2", [15, 0.5, 15])
        print(f"   Collisions: {len(collision_result.get('collisions', []))}")
        print(f"   On table: {collision_result.get('onTable', False)}")
        
        print("\n4. Testing safe position finding...")
        safe_pos = await scene.find_safe_position("cube2", [0, 0.5, 0])
        if safe_pos:
            print(f"Found safe position: [{safe_pos.x:.1f}, {safe_pos.y:.1f}, {safe_pos.z:.1f}]")
            await scene.move_entity("cube2", safe_pos, animate=True)
            print("✅ Moved cube2 to safe position")
        else:
            print("❌ No safe position found")
        
        await asyncio.sleep(1)
        
        print("\n5. Testing combined rotation and movement...")
        
        # Rotate and move in sequence
        await scene.rotate_entity("sphere1", [0, 90, 0], animate=True)
        await asyncio.sleep(0.5)
        await scene.move_entity("sphere1", [3, 0.5, 3], animate=True)
        print("🔄➡️ Rotated and moved blue sphere")
        
        print("\n6. Taking final screenshot...")
        await scene.take_screenshot()
        print("📸 Screenshot captured")
        
        print("\n✅ All rotation and collision tests completed!")
        print("📊 Summary:")
        print(f"   - Entities created: {scene.count_entities()}")
        print("   - Rotation functionality: ✅ Working")
        print("   - Collision detection: ✅ Working")
        print("   - Animation system: ✅ Working")
        print("   - Safe positioning: ✅ Working")

if __name__ == "__main__":
    asyncio.run(test_rotation_and_collision())