#!/usr/bin/env python3
"""
Debug browser state by executing JavaScript
"""

import asyncio
import websockets
import json

async def debug_browser():
    try:
        async with websockets.connect("ws://localhost:8080") as ws:
            print("🔧 Debugging browser state...")
            
            # Check if VTTLEntityManager exists and has entities
            await ws.send(json.dumps({
                'action': 'execute_javascript',
                'data': {
                    'code': '''
// Debug information
console.log("=== VTTL DEBUG INFO ===");
console.log("1. Window app:", typeof window.app, window.app ? "EXISTS" : "MISSING");
console.log("2. GameController:", typeof gameController, gameController ? "EXISTS" : "MISSING");
console.log("3. EntityManager:", gameController ? typeof gameController.entityManager : "N/A");
console.log("4. VTTLEntityManager:", typeof VTTLEntityManager);

if (gameController && gameController.entityManager) {
    console.log("5. Entity Manager Type:", gameController.entityManager.constructor.name);
    console.log("6. Entities count:", gameController.entityManager.entities ? gameController.entityManager.entities.size : "NO ENTITIES MAP");
    console.log("7. Lights count:", gameController.entityManager.lights ? gameController.entityManager.lights.size : "NO LIGHTS MAP");
    console.log("8. Models count:", gameController.entityManager.models ? gameController.entityManager.models.size : "NO MODELS MAP");
}

if (window.app && window.app.root) {
    const allEntities = window.app.root.children;
    console.log("9. PlayCanvas entities:", allEntities.length);
    allEntities.forEach((entity, index) => {
        console.log(`   Entity ${index}:`, entity.name, entity.enabled ? "ENABLED" : "DISABLED");
    });
}

console.log("=== END DEBUG ===");
                    '''
                }
            }))
            
            response = await ws.recv()
            print(f"Response: {response}")
            
            print("✅ Debug info sent - check browser console")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_browser())