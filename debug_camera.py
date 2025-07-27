#!/usr/bin/env python3
"""
Debug camera system - check if camera is active and responding
"""

import asyncio
import websockets
import json

async def debug_camera_system():
    try:
        async with websockets.connect("ws://localhost:8080") as ws:
            print("🔍 Debugging camera system...")
            
            # Execute JavaScript to check camera status
            print("1️⃣ Checking current camera status...")
            await ws.send(json.dumps({
                'action': 'execute_javascript',
                'data': {
                    'code': '''
console.log("=== CAMERA DEBUG INFO ===");
console.log("1. PlayCanvas app:", typeof window.app, window.app ? "EXISTS" : "MISSING");

if (window.app && window.app.root) {
    // Find all cameras in the scene
    const cameras = window.app.root.find(entity => entity.camera);
    console.log("2. Total cameras found:", cameras.length);
    
    cameras.forEach((cam, index) => {
        console.log(`   Camera ${index + 1}:`, cam.name, 
                    "Active:", cam.camera.enabled,
                    "Position:", cam.getPosition().toString());
    });
    
    // Check current active camera
    const activeCam = window.app.systems.camera.cameras.find(cam => cam.enabled);
    if (activeCam) {
        console.log("3. Active camera:", activeCam.entity.name);
        console.log("   Position:", activeCam.entity.getPosition().toString());
        console.log("   Target:", activeCam.entity.forward.toString());
    } else {
        console.log("3. No active camera found!");
    }
}

// Check entity manager
if (window.gameController && window.gameController.entityManager) {
    console.log("4. Entity manager cameras:", window.gameController.entityManager.cameras.size);
    window.gameController.entityManager.cameras.forEach((cam, name) => {
        console.log(`   VTTL Camera: ${name}`, cam.position);
    });
}

console.log("=== END CAMERA DEBUG ===");
                    '''
                }
            }))
            
            await asyncio.sleep(2)
            
            # Try to manually set an active camera
            print("2️⃣ Creating and activating a test camera...")
            await ws.send(json.dumps({
                'action': 'create_camera',
                'data': {
                    'name': 'DebugCamera',
                    'cameraType': 'perspective',
                    'position': [10, 15, 10],
                    'rotation': [-30, 45, 0],
                    'fov': 45,
                    'setActive': True
                }
            }))
            
            await asyncio.sleep(2)
            
            # Try to activate camera manually via JavaScript
            print("3️⃣ Manually activating camera via JavaScript...")
            await ws.send(json.dumps({
                'action': 'execute_javascript',
                'data': {
                    'code': '''
// Try to find and activate the MainCamera
if (window.app && window.app.root) {
    const mainCam = window.app.root.findByName("MainCamera");
    if (mainCam && mainCam.camera) {
        console.log("Found MainCamera, activating...");
        
        // Disable all other cameras
        const allCameras = window.app.root.find(entity => entity.camera);
        allCameras.forEach(cam => {
            cam.camera.enabled = false;
        });
        
        // Enable main camera
        mainCam.camera.enabled = true;
        
        // Set position
        mainCam.setPosition(5, 12, 8);
        mainCam.lookAt(0, 0, 0);
        
        console.log("✅ MainCamera activated and positioned");
        console.log("   Position:", mainCam.getPosition().toString());
    } else {
        console.log("❌ MainCamera not found or no camera component");
        
        // Create a basic camera if none exists
        const testCam = new pc.Entity("ManualCamera");
        testCam.addComponent("camera", {
            clearColor: new pc.Color(0.1, 0.2, 0.3),
            fov: 45,
            nearClip: 0.1,
            farClip: 1000
        });
        
        testCam.setPosition(5, 12, 8);
        testCam.lookAt(0, 0, 0);
        
        window.app.root.addChild(testCam);
        console.log("✅ Created and activated manual camera");
    }
}
                    '''
                }
            }))
            
            await asyncio.sleep(2)
            
            # Test camera movement again
            print("4️⃣ Testing camera movement after activation...")
            await ws.send(json.dumps({
                'action': 'execute_javascript',
                'data': {
                    'code': '''
if (window.app && window.app.root) {
    const cameras = window.app.root.find(entity => entity.camera && entity.camera.enabled);
    if (cameras.length > 0) {
        const activeCam = cameras[0];
        console.log("Moving active camera to test position...");
        
        activeCam.setPosition(0, 20, 0);  // Top-down view
        activeCam.lookAt(0, 0, 0);
        
        console.log("✅ Camera moved to top-down position");
        console.log("   New position:", activeCam.getPosition().toString());
    } else {
        console.log("❌ No active cameras found for movement test");
    }
}
                    '''
                }
            }))
            
            print("\n✅ Camera debug completed!")
            print("📋 Check browser console for detailed camera information")
            print("💡 If camera still doesn't move, there may be a deeper PlayCanvas setup issue")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_camera_system())