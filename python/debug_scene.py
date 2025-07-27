#!/usr/bin/env python3
"""
Debug scene creation and verify what's actually being created
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

async def debug_scene():
    """Debug scene creation step by step"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(1)
        
        logger.info("🔍 Debugging scene creation...")
        
        # Clear scene first
        logger.info("1. Clearing scene...")
        await client.clear_scene()
        await asyncio.sleep(2)
        
        # Check empty state
        state = await client.get_game_state()
        logger.info(f"   After clear: {len(state.get('entities', {}))} entities")
        
        # Create board
        logger.info("2. Creating board...")
        await client.setup_board("square", 1.0, 6, 6, True)
        await asyncio.sleep(2)
        
        # Check board state
        state = await client.get_game_state()
        entities = state.get('entities', {})
        tiles = [name for name in entities.keys() if name.startswith('tile_')]
        logger.info(f"   After board: {len(entities)} entities ({len(tiles)} tiles)")
        
        # Create warrior 1
        logger.info("3. Creating warrior 1...")
        warrior1 = await client.create_mini("player", "warrior", GridPosition(2, 2))
        await asyncio.sleep(1)
        
        # Create warrior 2  
        logger.info("4. Creating warrior 2...")
        warrior2 = await client.create_mini("enemy", "warrior", GridPosition(4, 4))
        await asyncio.sleep(1)
        
        # Create sphere
        logger.info("5. Creating treasure sphere...")
        treasure = await client.create_prop("sphere", GridPosition(5, 1), {"type": "treasure"})
        await asyncio.sleep(1)
        
        # Final state check
        state = await client.get_game_state()
        entities = state.get('entities', {})
        
        logger.info("📊 Final scene analysis:")
        logger.info(f"   Total entities: {len(entities)}")
        
        # List all non-tile entities
        for name, data in entities.items():
            if not name.startswith('tile_'):
                pos = data.get('position', [0, 0, 0])
                template = data.get('template', 'unknown')
                logger.info(f"   - {name}: {template} at {pos}")
        
        # Wait longer for render
        logger.info("6. Waiting for render...")
        await asyncio.sleep(3)
        
        logger.info("🎮 Scene should now be visible in browser")
        logger.info("🔍 Check if you can see:")
        logger.info("   - Grid board tiles")
        logger.info("   - 2 red warrior capsules")
        logger.info("   - 1 blue sphere")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Debug failed: {e}")
        return False
    finally:
        await client.disconnect()

if __name__ == "__main__":
    print("🔍 Scene Debug Test")
    print("Check browser at http://localhost:3001 during this test")
    print()
    
    success = asyncio.run(debug_scene())
    
    if success:
        print(f"\n✅ Scene debug: COMPLETED")
        print("Check browser to confirm entities are visible")
    else:
        print(f"\n❌ Scene debug: FAILED")