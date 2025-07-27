"""
Basic test of VTTL client functionality
This script demonstrates AI control of the game
"""
import asyncio
import logging
import sys
import os

# Add parent directory to path to import vttl_client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vttl_client import VTTLClient, GridPosition

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_basic_operations():
    """Test basic VTTL operations"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        # Connect to server
        await client.connect()
        await asyncio.sleep(1)  # Wait for connection
        
        logger.info("=== VTTL Basic Test Started ===")
        
        # 1. Clear any existing scene
        logger.info("Clearing scene...")
        await client.clear_scene()
        await asyncio.sleep(1)
        
        # 2. Setup game board
        logger.info("Setting up 8x8 game board...")
        await client.setup_board(
            board_type="square",
            size=1.0,
            width=8,
            height=8,
            create_tiles=True
        )
        await asyncio.sleep(2)
        
        # 3. Create some miniatures
        logger.info("Creating player miniatures...")
        
        # Player 1 - Warrior
        warrior_pos = GridPosition(x=2, z=2)
        warrior_name = await client.create_mini("p1", "warrior", warrior_pos)
        
        # Player 2 - Another warrior
        warrior2_pos = GridPosition(x=5, z=5)
        warrior2_name = await client.create_mini("p2", "warrior", warrior2_pos)
        
        await asyncio.sleep(1)
        
        # 4. Create some props
        logger.info("Creating game props...")
        
        # Dice
        dice_pos = GridPosition(x=0, z=0)
        dice_name = await client.create_prop("sphere", dice_pos, {"type": "d20"})
        
        # Token
        token_pos = GridPosition(x=7, z=7)
        token_name = await client.create_prop("cube", token_pos, {"type": "treasure"})
        
        await asyncio.sleep(1)
        
        # 5. Test movement
        logger.info("Testing movement...")
        
        # Move warrior 1 forward
        new_pos = GridPosition(x=3, z=3)
        await client.move_mini(warrior_name, new_pos)
        await asyncio.sleep(2)
        
        # Move warrior 2 in a different direction
        new_pos2 = GridPosition(x=4, z=5)
        await client.move_mini(warrior2_name, new_pos2)
        await asyncio.sleep(2)
        
        # 6. Get game state and analyze
        logger.info("Getting game state...")
        state = await client.get_game_state()
        
        entities = state.get('entities', {})
        logger.info(f"Total entities: {len(entities)}")
        
        # Count by type
        minis = client.get_entities_by_prefix("mini_")
        props = client.get_entities_by_prefix("prop_")
        tiles = client.get_entities_by_prefix("tile_")
        
        logger.info(f"Miniatures: {len(minis)}")
        logger.info(f"Props: {len(props)}")
        logger.info(f"Tiles: {len(tiles)}")
        
        # 7. Test range finding
        logger.info("Testing range finding...")
        center = GridPosition(x=3, z=3)
        nearby_entities = client.get_entities_in_range(center, radius=2)
        logger.info(f"Entities near (3,3): {nearby_entities}")
        
        available_positions = client.get_available_positions_near(center, radius=1)
        logger.info(f"Available positions near (3,3): {len(available_positions)}")
        
        # 8. Demonstrate AI decision making
        logger.info("AI Decision Example: Moving pieces closer...")
        
        # Find all minis
        all_minis = list(minis.keys())
        if len(all_minis) >= 2:
            # Move second mini towards first
            first_mini = client.world_to_grid(entities[all_minis[0]]['position'])
            second_mini_name = all_minis[1]
            
            # Find position one step closer
            available = client.get_available_positions_near(first_mini, radius=2)
            if available:
                closest = min(available, key=lambda p: abs(p.x - first_mini.x) + abs(p.z - first_mini.z))
                await client.move_mini(second_mini_name, closest)
                logger.info(f"Moved {second_mini_name} closer to {all_minis[0]}")
        
        await asyncio.sleep(2)
        
        logger.info("=== Test Completed Successfully ===")
        logger.info("Check the browser to see the 3D scene!")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise
    finally:
        await client.disconnect()

async def test_game_scenario():
    """Test a simple turn-based game scenario"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(1)
        
        logger.info("=== Game Scenario Test ===")
        
        # Setup small arena
        await client.setup_board("square", 1.0, 6, 6, True)
        await asyncio.sleep(1)
        
        # Place two opposing teams
        team1_positions = [GridPosition(1, 1), GridPosition(1, 2)]
        team2_positions = [GridPosition(4, 4), GridPosition(4, 3)]
        
        team1_units = []
        team2_units = []
        
        # Create team 1
        for i, pos in enumerate(team1_positions):
            unit_name = await client.create_mini(f"team1", "warrior", pos)
            team1_units.append(unit_name)
        
        # Create team 2  
        for i, pos in enumerate(team2_positions):
            unit_name = await client.create_mini(f"team2", "warrior", pos)
            team2_units.append(unit_name)
        
        await asyncio.sleep(2)
        
        # Simulate turns
        for turn in range(3):
            logger.info(f"--- Turn {turn + 1} ---")
            
            # Team 1 moves
            for unit in team1_units:
                state = await client.get_game_state()
                current_pos = client.world_to_grid(state['entities'][unit]['position'])
                
                # Move towards center
                new_x = min(current_pos.x + 1, 3)
                new_z = min(current_pos.z + 1, 3)
                new_pos = GridPosition(new_x, new_z)
                
                await client.move_mini(unit, new_pos)
                await asyncio.sleep(1)
            
            # Team 2 moves
            for unit in team2_units:
                state = await client.get_game_state()
                current_pos = client.world_to_grid(state['entities'][unit]['position'])
                
                # Move towards center
                new_x = max(current_pos.x - 1, 2)
                new_z = max(current_pos.z - 1, 2)
                new_pos = GridPosition(new_x, new_z)
                
                await client.move_mini(unit, new_pos)
                await asyncio.sleep(1)
        
        logger.info("Game scenario completed!")
        
    except Exception as e:
        logger.error(f"Game scenario failed: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    print("VTTL Test Suite")
    print("Make sure the server is running: cd server && npm start")
    print("And the web client is open: http://localhost:3000")
    print()
    
    choice = input("Choose test: (1) Basic Operations, (2) Game Scenario: ")
    
    if choice == "1":
        asyncio.run(test_basic_operations())
    elif choice == "2":
        asyncio.run(test_game_scenario())
    else:
        print("Running basic operations test...")
        asyncio.run(test_basic_operations())