#!/usr/bin/env python3
"""
Test GLB Model Loading - Verify that .glb models can be loaded into the VTTL scene

This script tests the new GLB model loading functionality by:
1. Listing available GLB models
2. Loading several different models into the scene
3. Positioning them in a line for visual verification
4. Taking a screenshot to verify the loading worked

Run with: python test_glb_models.py
"""

import asyncio
import sys
import os

# Add the current directory to path to import scene_controller
sys.path.append(os.path.dirname(__file__))

from scene_controller import SceneController, Position


async def test_glb_loading():
    """Test GLB model loading functionality"""
    print("🔄 Testing GLB Model Loading...")
    
    async with SceneController() as scene:
        print("\n📋 Available GLB Models:")
        models = SceneController.list_available_models()
        
        if not models:
            print("❌ No GLB models found!")
            return False
            
        for i, model in enumerate(models):
            print(f"   {i+1}. {model}")
        
        print(f"\n✅ Found {len(models)} GLB models")
        
        # Clear the scene first
        print("\n🧹 Clearing scene...")
        await scene.clear_scene()
        
        # Test loading the available models from 3dmodels directory
        test_models = [
            ("cat", "cat28.stl.glb", [0, 0, 0]),
            ("eagle", "eagle-general-28.stl.glb", [5, 0, 0]),
        ]
        
        print(f"\n🎮 Loading {len(test_models)} different GLB models...")
        
        loaded_count = 0
        for name, model_path, position in test_models:
            try:
                print(f"   Loading {name}: {model_path}...")
                await scene.create_model(name, model_path, position, color=[1, 1, 1])
                loaded_count += 1
                print(f"   ✅ {name} loaded successfully")
                
                # Small delay to allow loading
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"   ❌ Failed to load {name}: {e}")
        
        print(f"\n📊 Successfully loaded {loaded_count}/{len(test_models)} models")
        
        # Set camera to view all models
        print("\n📷 Setting camera position...")
        await scene.set_camera([10, 8, 15], target=[10, 0, 0])
        
        # Wait a moment for models to fully load
        print("⏳ Waiting for models to load...")
        await asyncio.sleep(3)
        
        # Take a screenshot to verify
        print("📸 Taking screenshot...")
        await scene.take_screenshot()
        
        # Test color tinting on one model
        print("\n🎨 Testing color tinting...")
        try:
            await scene.create_model("red_cat", "cat28.stl.glb", [10, 0, 0], 
                                   color=[1, 0.2, 0.2])  # Red tint
            print("   ✅ Color tinting test successful")
        except Exception as e:
            print(f"   ❌ Color tinting test failed: {e}")
        
        # Test scaling
        print("\n📏 Testing scaling...")
        try:
            await scene.create_model("big_eagle", "eagle-general-28.stl.glb", [15, 0, 0], 
                                   scale=[2, 2, 2])  # 2x scale
            print("   ✅ Scaling test successful")
        except Exception as e:
            print(f"   ❌ Scaling test failed: {e}")
        
        # Final screenshot with all models
        await asyncio.sleep(2)
        print("\n📸 Taking final screenshot with all models...")
        await scene.take_screenshot()
        
        # List entities to verify they were created
        entities = scene.list_entities()
        model_entities = [e for e in entities if e.entity_type == "model"]
        
        print(f"\n📋 Scene Summary:")
        print(f"   Total entities: {len(entities)}")
        print(f"   Model entities: {len(model_entities)}")
        
        for entity in model_entities:
            model_path = entity.properties.get('model_path', 'Unknown')
            print(f"   - {entity.name}: {model_path}")
        
        return len(model_entities) > 0


async def main():
    """Main test function"""
    print("🚀 Starting GLB Model Loading Test")
    print("=" * 50)
    
    try:
        success = await test_glb_loading()
        
        if success:
            print("\n✅ GLB Model Loading Test PASSED!")
            print("Check the screenshots folder for visual verification.")
        else:
            print("\n❌ GLB Model Loading Test FAILED!")
            return 1
            
    except Exception as e:
        print(f"\n💥 Test crashed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    print("\n🏁 Test completed")
    return 0


if __name__ == "__main__":
    # Run the test
    exit_code = asyncio.run(main())
    sys.exit(exit_code)