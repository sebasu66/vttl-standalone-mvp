#!/usr/bin/env python3
"""
Simple GLB loading test to debug what's happening
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(__file__))

from scene_controller import SceneController, Position


async def simple_test():
    """Simple test with one model"""
    print("🔄 Simple GLB Test...")
    
    async with SceneController() as scene:
        # Clear the scene
        await scene.clear_scene()
        print("✅ Scene cleared")
        
        # List available models
        models = SceneController.list_available_models()
        print(f"📋 Found models: {models}")
        
        # Test loading just one model
        if models:
            model_path = models[0]  # Use first available model
            print(f"🎮 Loading model: {model_path}")
            
            try:
                await scene.create_model("test_model", model_path, [0, 0, 0])
                print("✅ Model creation command sent")
                
                # Wait a bit
                await asyncio.sleep(2)
                
                # Check entities
                entities = scene.list_entities()
                print(f"📊 Total entities: {len(entities)}")
                for entity in entities:
                    print(f"   - {entity.name}: {entity.entity_type}")
                
                # Set camera to see the model
                await scene.set_camera([3, 3, 3], target=[0, 0, 0])
                print("📷 Camera positioned")
                
                # Wait and take screenshot
                await asyncio.sleep(3)
                await scene.take_screenshot()
                print("📸 Screenshot taken")
                
            except Exception as e:
                print(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("❌ No models found!")


if __name__ == "__main__":
    asyncio.run(simple_test())