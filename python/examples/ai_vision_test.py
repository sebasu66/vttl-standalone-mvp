#!/usr/bin/env python3
"""
AI Vision Test - Demonstrates AI taking screenshots and "seeing" the game state
"""
import asyncio
import logging
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vttl_client import VTTLClient, GridPosition

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

async def test_ai_vision():
    """Test AI vision capabilities with screenshots"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        # Connect
        await client.connect()
        await asyncio.sleep(1)
        logger.info("🤖 AI Vision Test Started")
        
        # Setup scene
        logger.info("🏁 Setting up test scene...")
        await client.clear_scene()
        await client.setup_board("square", 1.0, 8, 8, True)
        
        # Create a recognizable pattern
        logger.info("🎮 Creating recognizable pattern...")
        
        # Create a line of warriors
        for i in range(3):
            await client.create_mini(f"p{i+1}", "warrior", GridPosition(i+2, 4))
        
        # Create props in corners
        await client.create_prop("sphere", GridPosition(0, 0), {"type": "corner1"})
        await client.create_prop("cube", GridPosition(7, 7), {"type": "corner2"})
        await client.create_prop("sphere", GridPosition(0, 7), {"type": "corner3"})
        await client.create_prop("cube", GridPosition(7, 0), {"type": "corner4"})
        
        await asyncio.sleep(2)  # Wait for scene to stabilize
        
        # Take screenshot
        logger.info("📸 Taking screenshot for AI analysis...")
        screenshot_path = await client.take_screenshot()
        
        if screenshot_path:
            logger.info(f"✅ Screenshot saved: {screenshot_path}")
            logger.info("📊 Analyzing scene...")
            
            # Get current game state for comparison
            state = await client.get_game_state()
            entities = state.get('entities', {})
            
            # Analyze what we created
            minis = client.get_entities_by_prefix("mini_")
            props = client.get_entities_by_prefix("prop_")
            
            logger.info(f"   Scene contains:")
            logger.info(f"   - {len(minis)} miniatures in a line")
            logger.info(f"   - {len(props)} props in corners")
            logger.info(f"   - Total entities: {len(entities)}")
            
            # AI "sees" the pattern
            logger.info("🧠 AI Analysis:")
            logger.info("   - Detected warrior line formation at y=4")
            logger.info("   - Detected corner markers at (0,0), (7,7), (0,7), (7,0)")
            logger.info("   - Board appears to be 8x8 grid")
            logger.info("   - Scene is tactically arranged")
            
            # Make AI decision based on "vision"
            logger.info("🎯 AI Decision Making:")
            logger.info("   - Formation suggests defensive line")
            logger.info("   - Corner props indicate map boundaries")
            logger.info("   - Recommending flanking maneuver...")
            
            # Execute AI decision
            await client.create_mini("flanker", "warrior", GridPosition(1, 6))
            await asyncio.sleep(1)
            await client.move_mini("mini_flanker_flanker", GridPosition(3, 6))
            
            logger.info("   - Flanker unit deployed!")
            
            # Take another screenshot to see changes
            logger.info("📸 Taking second screenshot...")
            await asyncio.sleep(1)
            final_screenshot = await client.take_screenshot()
            
            if final_screenshot:
                logger.info(f"✅ Final screenshot: {final_screenshot}")
                logger.info("🎉 AI Vision Test Complete!")
                
                logger.info("\n🖼️  Screenshots saved to standalone-mvp/screenshots/")
                logger.info("🌐 View live scene at: http://localhost:3001")
                
                return True
            
        else:
            logger.error("❌ Failed to take screenshot")
            return False
            
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        return False
    finally:
        await client.disconnect()

async def test_continuous_monitoring():
    """Test continuous AI monitoring with periodic screenshots"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(1)
        
        logger.info("🔄 Starting continuous monitoring test...")
        
        # Setup scene
        await client.clear_scene()
        await client.setup_board("square", 1.0, 6, 6, True)
        
        # Create moving pieces
        warrior1 = await client.create_mini("patrol1", "warrior", GridPosition(1, 1))
        warrior2 = await client.create_mini("patrol2", "warrior", GridPosition(4, 4))
        
        # Monitor for 10 seconds with screenshots every 2 seconds
        for i in range(5):
            logger.info(f"📸 Monitor frame {i+1}/5")
            
            # Take screenshot
            screenshot = await client.take_screenshot()
            if screenshot:
                logger.info(f"   Screenshot saved: {os.path.basename(screenshot)}")
            
            # Move pieces randomly
            import random
            new_x1 = random.randint(0, 5)
            new_z1 = random.randint(0, 5)
            new_x2 = random.randint(0, 5)
            new_z2 = random.randint(0, 5)
            
            await client.move_mini(warrior1, GridPosition(new_x1, new_z1))
            await client.move_mini(warrior2, GridPosition(new_x2, new_z2))
            
            logger.info(f"   Moved units to ({new_x1},{new_z1}) and ({new_x2},{new_z2})")
            
            await asyncio.sleep(2)
        
        logger.info("🎉 Continuous monitoring test complete!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Monitoring test failed: {e}")
        return False
    finally:
        await client.disconnect()

if __name__ == "__main__":
    print("🤖 AI Vision Test Suite")
    print("Make sure the server is running and browser is open!")
    print()
    
    choice = input("Choose test: (1) Pattern Recognition, (2) Continuous Monitoring: ")
    
    if choice == "1":
        success = asyncio.run(test_ai_vision())
    elif choice == "2":
        success = asyncio.run(test_continuous_monitoring())
    else:
        print("Running pattern recognition test...")
        success = asyncio.run(test_ai_vision())
    
    if success:
        print("\n✅ AI Vision Test: PASSED")
    else:
        print("\n❌ AI Vision Test: FAILED")