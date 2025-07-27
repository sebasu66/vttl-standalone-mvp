const WebSocket = require('ws');

console.log('💡 Fixing too-dark lighting - brightening spotlight on white cube');
console.log('==============================================================');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Send JavaScript to fix the lighting
  const message = {
    action: 'execute_javascript',
    data: {
      code: `
console.log('💡 FIXING DARK LIGHTING - BRIGHTENING SPOTLIGHT');

// First, bring back some ambient light so we can see
window.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.25);

// Restore original lights to moderate brightness
const lights = window.gameController.entityManager.getAllLights();
lights.forEach(light => {
    if (light.name !== 'CubeSpotlight') {
        light.updateLightProperties({ intensity: 0.3 });  // Moderate instead of super dim
        console.log('🔅 Restored', light.name, 'to 0.3 intensity');
    }
});

// Create a MUCH brighter spotlight directly above the white cube
const brightSpot = window.gameController.entityManager.createEntity('BrightCubeSpot', 'light', {
    lightType: 'spot',
    position: [0, 12, 0],     // Directly above white cube
    color: [1, 1, 1],         // Pure white for maximum brightness
    intensity: 15.0,          // Very bright
    range: 30,
    innerConeAngle: 15,       // Wider beam to ensure it hits
    outerConeAngle: 35,
    castShadows: true
});

if (brightSpot && brightSpot.playcanvasEntity) {
    brightSpot.playcanvasEntity.lookAt(0, 1, 0);  // Point straight down at cube
    console.log('✅ Super bright spotlight created above white cube');
}

return 'LIGHTING FIXED: Ambient restored, main lights at 0.3, bright spotlight at 15.0 intensity';
      `
    }
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Sent lighting fix command');
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  
  if (msg.type === 'javascript_result') {
    if (msg.data.status === 'success') {
      console.log('✅ SUCCESS:', msg.data.result);
    } else {
      console.log('❌ ERROR:', msg.data.error);
    }
    
    // Request screenshot to verify fix
    setTimeout(() => {
      console.log('📸 Taking screenshot to verify lighting fix...');
      ws.send(JSON.stringify({ action: 'get_screenshot' }));
    }, 1000);
  } else if (msg.type === 'screenshot_requested') {
    console.log('✅ Screenshot requested - check latest screenshot');
    ws.close();
  }
});

ws.on('close', function close() {
  console.log('🔗 Connection closed');
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
});