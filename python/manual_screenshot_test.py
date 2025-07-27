#!/usr/bin/env python3
"""
Manual screenshot test - creates scene and waits for manual screenshot
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

async def create_visible_scene():
    """Create a very visible scene for testing"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(1)
        
        logger.info("🎮 Creating highly visible test scene...")
        
        # Clear everything
        await client.clear_scene()
        await asyncio.sleep(1)
        
        # Create small board for better visibility
        await client.setup_board("square", 2.0, 4, 4, True)  # Bigger grid squares
        await asyncio.sleep(2)
        
        # Create entities in very visible positions
        logger.info("Creating entities...")
        
        # Center warrior
        await client.create_mini("center", "warrior", GridPosition(1, 1))
        await asyncio.sleep(1)
        
        # Corner warrior
        await client.create_mini("corner", "warrior", GridPosition(3, 3))
        await asyncio.sleep(1)
        
        # Big treasure
        await client.create_prop("sphere", GridPosition(0, 3), {"type": "treasure"})
        await asyncio.sleep(1)
        
        # Another prop
        await client.create_prop("cube", GridPosition(3, 0), {"type": "obstacle"})
        await asyncio.sleep(1)
        
        logger.info("✅ Scene created!")
        logger.info("🎯 In browser, you should see:")
        logger.info("   - 4x4 grid of tiles")
        logger.info("   - 2 red warriors (capsules)")
        logger.info("   - 1 blue sphere")
        logger.info("   - 1 gray cube")
        
        logger.info("")
        logger.info("🔧 MANUAL TEST:")
        logger.info("1. Confirm you can see all objects in browser")
        logger.info("2. Press F12 to open developer console")
        logger.info("3. In console, type: gameController.sendScreenshot()")
        logger.info("4. Check console for debug messages")
        
        # Keep connection alive
        logger.info("⏳ Keeping connection alive for manual testing...")
        logger.info("Press Ctrl+C when done")
        
        # Wait indefinitely
        while True:
            await asyncio.sleep(5)
            # Check if scene still has entities
            state = await client.get_game_state()
            entities = state.get('entities', {})
            non_tiles = [name for name in entities.keys() if not name.startswith('tile_')]
            logger.info(f"Scene status: {len(non_tiles)} entities active")
        
    except KeyboardInterrupt:
        logger.info("Manual test stopped by user")
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    print("🔧 Manual Screenshot Test")
    print("This will create a scene and keep it running")
    print("You can then manually test screenshot in browser console")
    print()
    
    asyncio.run(create_visible_scene())