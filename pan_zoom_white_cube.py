#!/usr/bin/env python3
"""
Pan and zoom in on the white cube using integrated camera vision
"""

import asyncio
import websockets
import json

async def pan_zoom_white_cube():
    try:
        async with websockets.connect("ws://localhost:8080") as ws:
            print("🎥 Panning and zooming to white cube...")
            
            # Focus on the white cube and zoom in
            await ws.send(json.dumps({
                'action': 'execute_javascript',
                'data': {
                    'code': '''
const camera = window.gameController.entityManager.getCamera("MainCamera");
if (camera) {
    console.log("📹 Focusing on white cube...");
    
    // Focus on white cube at position [0, 1, 0]
    camera.applyCameraEffect("focus_on_object", {
        position: [0, 1, 0],
        distance: 6  // Move closer
    });
    
    setTimeout(() => {
        console.log("🔍 Zooming in...");
        camera.applyCameraEffect("zoom_effect", {
            targetFov: 25,  // Narrow FOV for zoom effect
            duration: 2000
        });
    }, 1000);
    
} else {
    console.log("❌ Camera not found");
}
                    '''
                }
            }))
            
            print("✅ Camera focused and zoomed on white cube")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(pan_zoom_white_cube())