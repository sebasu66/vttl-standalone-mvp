#!/usr/bin/env python3
"""
Pan the camera to show miniatures in the multicam scene
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

async def pan_to_show_minis():
    """Pan camera to show existing miniatures in multicam scene"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(1)
        
        logger.info("🎬 Panning camera to show multicam miniatures...")
        
        # Get current scene state to see what's loaded
        logger.info("1. Getting multicam scene entities...")
        state = await client.get_game_state()
        entities = state.get('entities', {})
        logger.info(f"📊 Found {len(entities)} entities in scene:")
        
        # List miniatures and their positions
        minis = []
        for name, data in entities.items():
            pos = data['position']
            if 'paladin' in name.lower() or 'mini' in name.lower() or 'enemy' in name.lower():
                minis.append((name, pos))
                logger.info(f"   🔴 {name}: [{pos[0]:.1f}, {pos[1]:.1f}, {pos[2]:.1f}]")
            else:
                logger.info(f"   ⚪ {name}: [{pos[0]:.1f}, {pos[1]:.1f}, {pos[2]:.1f}]")
        
        logger.info(f"Found {len(minis)} miniatures to showcase")
        
        # Camera tour showing different angles of the miniatures
        camera_angles = [
            {"name": "Overview", "x": 45, "y": 0, "distance": 20},
            {"name": "Side view", "x": 30, "y": 45, "distance": 15},
            {"name": "Close-up front", "x": 20, "y": 0, "distance": 10},
            {"name": "Top-down tactical", "x": 80, "y": 0, "distance": 12},
            {"name": "Dramatic low angle", "x": 15, "y": 30, "distance": 18},
        ]
        
        screenshots = []
        
        for i, angle in enumerate(camera_angles):
            logger.info(f"{i+1}. Setting camera to: {angle['name']}")
            await client.set_camera_angle(
                angle_x=angle['x'], 
                angle_y=angle['y'], 
                distance=angle['distance']
            )
            await asyncio.sleep(2)  # Wait for camera to move
            
            # Take screenshot
            screenshot = await client.take_screenshot()
            if screenshot:
                screenshots.append((angle['name'], screenshot))
                logger.info(f"   📸 Screenshot: {os.path.basename(screenshot)}")
        
        logger.info("")
        logger.info("🎉 Camera tour complete!")
        logger.info("📸 Screenshots taken from different angles:")
        for name, path in screenshots:
            logger.info(f"   - {name}: {os.path.basename(path)}")
        
        return screenshots
        
    except Exception as e:
        logger.error(f"❌ Camera pan failed: {e}")
        return None
    finally:
        await client.disconnect()

if __name__ == "__main__":
    print("🎬 Multicam Miniature Showcase")
    print("This will pan the camera to show miniatures from different angles")
    print("Make sure the multicam scene is loaded in the browser")
    print()
    
    screenshots = asyncio.run(pan_to_show_minis())
    
    if screenshots:
        print(f"\n✅ Camera showcase: COMPLETED")
        print("📸 Check the screenshots folder for different angles of your miniatures!")
    else:
        print(f"\n❌ Camera showcase: FAILED")