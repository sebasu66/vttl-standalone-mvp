#!/usr/bin/env python3
"""
Pan the camera to view the cubes
"""
import asyncio
import sys
import os

# Add parent directory to path to import vttl_client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vttl_client import VTTLClient

async def pan_camera():
    """Pan camera to view the scene with cubes"""
    client = VTTLClient("ws://localhost:8080")
    
    try:
        await client.connect()
        await asyncio.sleep(0.5)
        
        print("Panning camera to view the cubes...")
        
        # Pan camera to center of the cube formation
        await client.pan_camera(
            target_position=[0, 0, 0],  # Center of cube formation
            distance=15,                 # Good distance to see all cubes
            angle_horizontal=45,         # Slight angle for better view
            angle_vertical=30            # Look down slightly
        )
        
        await asyncio.sleep(1)
        print("Camera positioned to view all cubes!")
        
    except Exception as e:
        print(f"Error panning camera: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(pan_camera())