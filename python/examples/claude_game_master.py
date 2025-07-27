#!/usr/bin/env python3
"""
Claude Game Master - Full integration demo where Claude can see and control the game
"""
import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from claude_vision import ClaudeVisionVTTL, GridPosition

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

async def demo_claude_game_master():
    """
    Demonstrate Claude as a Game Master who can see and control the game
    """
    claude_vttl = ClaudeVisionVTTL("ws://localhost:8080")
    
    try:
        # Connect to game
        await claude_vttl.connect()
        await asyncio.sleep(1)
        
        logger.info("🎮 Claude Game Master Demo Started")
        logger.info("=" * 50)
        
        # Setup initial scene
        logger.info("🏗️  Setting up game world...")
        await claude_vttl.clear_scene()
        await claude_vttl.setup_board("square", 1.0, 10, 10)
        
        # Create initial scenario
        logger.info("⚔️  Creating tactical scenario...")
        
        # Player team (blue team)
        await claude_vttl.create_mini("p1", "warrior", GridPosition(2, 2))
        await claude_vttl.create_mini("p1", "warrior", GridPosition(3, 2))
        await claude_vttl.create_mini("p1", "warrior", GridPosition(4, 2))
        
        # Enemy team (red team) 
        await claude_vttl.create_mini("enemy", "warrior", GridPosition(6, 7))
        await claude_vttl.create_mini("enemy", "warrior", GridPosition(7, 7))
        
        # Add some environmental props
        await claude_vttl.create_prop("cube", GridPosition(5, 5), {"type": "obstacle"})
        await claude_vttl.create_prop("sphere", GridPosition(1, 8), {"type": "treasure"})
        await claude_vttl.create_prop("sphere", GridPosition(8, 1), {"type": "treasure"})
        
        await asyncio.sleep(2)  # Wait for scene to stabilize
        
        # Take screenshot for Claude to analyze
        logger.info("📸 Taking screenshot for Claude analysis...")
        screenshot_path, prompt_file = await claude_vttl.take_screenshot_for_claude(
            context="Initial tactical scenario with player team vs enemies and treasures"
        )
        
        if screenshot_path and prompt_file:
            logger.info("✅ Screenshot and prompt prepared!")
            logger.info("")
            logger.info("🤖 CLAUDE ANALYSIS NEEDED:")
            logger.info("=" * 50)
            logger.info(f"📸 Please open and view: {screenshot_path}")
            logger.info(f"📝 Instructions in: {prompt_file}")
            logger.info("")
            logger.info("Please provide your analysis and any commands you'd like to execute.")
            logger.info("Example commands:")
            logger.info("  await claude_vttl.move_mini('mini_warrior_p1', GridPosition(3, 3))")
            logger.info("  await claude_vttl.create_prop('sphere', GridPosition(5, 2), {'type': 'healing'})")
            logger.info("")
            
            # Wait for user input (simulating Claude's response)
            print("=" * 50)
            print("WAITING FOR CLAUDE ANALYSIS...")
            print("Please analyze the screenshot and provide commands.")
            print("Enter 'demo' to run demo commands, or 'skip' to continue:")
            
            user_input = input("> ").strip()
            
            if user_input.lower() == 'demo':
                logger.info("🎯 Executing demo Claude commands...")
                
                # Simulate Claude's tactical decisions
                logger.info("Claude analysis: 'I see a 3v2 scenario with tactical advantages...'")
                await asyncio.sleep(1)
                
                logger.info("Claude decision: 'Moving team into flanking positions...'")
                await claude_vttl.move_mini("mini_warrior_p1", GridPosition(2, 4))
                await asyncio.sleep(1)
                await claude_vttl.move_mini("mini_warrior_p1_1", GridPosition(4, 4))  
                await asyncio.sleep(1)
                
                logger.info("Claude decision: 'Adding reinforcements...'")
                await claude_vttl.create_mini("p1", "warrior", GridPosition(1, 1))
                await asyncio.sleep(1)
                
                logger.info("Claude decision: 'Creating defensive position...'")
                await claude_vttl.create_prop("cube", GridPosition(3, 4), {"type": "cover"})
                await asyncio.sleep(1)
                
                # Take another screenshot to see changes
                logger.info("📸 Taking second screenshot to see Claude's changes...")
                screenshot_path2, prompt_file2 = await claude_vttl.take_screenshot_for_claude(
                    context="After Claude's tactical modifications"
                )
                
                if screenshot_path2:
                    logger.info(f"✅ Updated screenshot: {screenshot_path2}")
                    
            elif user_input.lower() != 'skip':
                logger.info("Manual commands not implemented in demo - use the VTTL client directly")
        
        # Continue with more scenarios
        logger.info("")
        logger.info("🎲 Demonstrating continuous Claude monitoring...")
        
        for round_num in range(3):
            logger.info(f"🔄 Round {round_num + 1}: Simulating game progression...")
            
            # Make some random moves to simulate game progression
            import random
            entities = claude_vttl.client.game_state.get('entities', {})
            minis = [name for name in entities.keys() if name.startswith('mini_')]
            
            if minis:
                # Move a random mini
                mini_to_move = random.choice(minis)
                new_x = random.randint(0, 9)
                new_z = random.randint(0, 9)
                
                try:
                    await claude_vttl.move_mini(mini_to_move, GridPosition(new_x, new_z))
                    logger.info(f"   Moved {mini_to_move} to ({new_x}, {new_z})")
                except:
                    logger.info(f"   Failed to move {mini_to_move}")
            
            # Take screenshot for monitoring
            screenshot, prompt = await claude_vttl.take_screenshot_for_claude(
                context=f"Round {round_num + 1} - Game state monitoring"
            )
            
            if screenshot:
                logger.info(f"   📸 Monitoring screenshot: {os.path.basename(screenshot)}")
            
            await asyncio.sleep(2)
        
        logger.info("")
        logger.info("🎉 Claude Game Master Demo Complete!")
        logger.info("🖼️  All screenshots saved to: standalone-mvp/screenshots/")
        logger.info("📝 Analysis prompts saved to: standalone-mvp/analysis/")
        logger.info("🌐 View live game at: http://localhost:3001")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}")
        return False
    finally:
        await claude_vttl.disconnect()

async def simple_claude_interaction():
    """
    Simple example of Claude seeing a game state
    """
    claude_vttl = ClaudeVisionVTTL("ws://localhost:8080")
    
    try:
        await claude_vttl.connect()
        await asyncio.sleep(1)
        
        logger.info("🎯 Simple Claude Interaction")
        
        # Create very simple scene
        await claude_vttl.clear_scene()
        await claude_vttl.setup_board("square", 1.0, 5, 5)
        await claude_vttl.create_mini("player", "warrior", GridPosition(2, 2))
        await claude_vttl.create_prop("sphere", GridPosition(4, 4), {"type": "goal"})
        
        await asyncio.sleep(1)
        
        # Take screenshot
        screenshot, prompt = await claude_vttl.take_screenshot_for_claude(
            context="Simple scene: one warrior needs to reach the goal"
        )
        
        if screenshot and prompt:
            logger.info("✅ Simple scene ready for Claude analysis")
            logger.info(f"📸 Screenshot: {screenshot}")
            logger.info(f"📝 Prompt: {prompt}")
            logger.info("")
            logger.info("🤖 Claude, please analyze this simple tactical scenario!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Simple interaction failed: {e}")
        return False
    finally:
        await claude_vttl.disconnect()

if __name__ == "__main__":
    print("🤖 Claude Game Master Integration")
    print("Make sure the VTTL server is running!")
    print()
    
    choice = input("Choose demo: (1) Full Game Master Demo, (2) Simple Interaction: ")
    
    if choice == "1":
        success = asyncio.run(demo_claude_game_master())
    elif choice == "2":
        success = asyncio.run(simple_claude_interaction())
    else:
        print("Running simple interaction...")
        success = asyncio.run(simple_claude_interaction())
    
    if success:
        print("\n✅ Claude Integration Demo: COMPLETED")
        print("Check the screenshots and analysis files!")
    else:
        print("\n❌ Claude Integration Demo: FAILED")