#!/usr/bin/env python3
"""
Simple script to add multiple cubes to the scene
"""
import asyncio
import sys
import os

# Add parent directory to path to import vttl_client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vttl_client import VTTLClient, GridPosition

async def add_cubes():
    """Add multiple cubes to the scene"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(0.5)
        
        print("Adding multiple cubes to the scene...")
        
        # Create 5 cubes at different positions
        cube_positions = [
            GridPosition(x=2, z=2),   # cube_1
            GridPosition(x=-2, z=2),  # cube_2  
            GridPosition(x=0, z=4),   # cube_3
            GridPosition(x=4, z=0),   # cube_4
            GridPosition(x=-4, z=0)   # cube_5
        ]
        
        for i, pos in enumerate(cube_positions, 1):
            cube_name = await client.create_prop("cube", pos, {"type": f"cube_{i}"})
            print(f"Created {cube_name} at position ({pos.x}, {pos.z})")
            await asyncio.sleep(0.3)
        
        print("All cubes added successfully!")
        
    except Exception as e:
        print(f"Error adding cubes: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(add_cubes())