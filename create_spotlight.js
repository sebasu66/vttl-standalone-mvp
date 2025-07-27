const WebSocket = require('ws');

console.log('💡 Creating spotlight on white cube via WebSocket API');
console.log('==================================================');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Send JavaScript to create bright spotlight on cube
  const message = {
    action: 'execute_javascript',
    data: {
      code: `
console.log('💡 CREATING BRIGHT SPOTLIGHT ON WHITE CUBE');

// Create very bright spotlight
const spotlight = window.gameController.entityManager.createEntity('CubeSpotlight', 'light', {
    lightType: 'spot',
    position: [3, 10, 3],
    color: [1, 0.95, 0.8],
    intensity: 8.0,
    range: 25,
    innerConeAngle: 8,
    outerConeAngle: 20,
    castShadows: true
});

if (spotlight && spotlight.playcanvasEntity) {
    spotlight.playcanvasEntity.lookAt(0, 1, 0);
    console.log('✅ Spotlight created and aimed at white cube');
}

// Fade all other lights
const lights = window.gameController.entityManager.getAllLights();
lights.forEach(light => {
    if (light.name !== 'CubeSpotlight') {
        light.updateLightProperties({ intensity: 0.05 });
    }
});

// Dark ambient
window.app.scene.ambientLight = new pc.Color(0.05, 0.05, 0.1);

return 'Spotlight created: intensity 8.0, aimed at white cube, others dimmed';
      `
    }
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Sent spotlight creation command');
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  console.log('📨 Response:', msg);
  
  if (msg.type === 'javascript_result') {
    if (msg.data.status === 'success') {
      console.log('✅ SUCCESS:', msg.data.result);
    } else {
      console.log('❌ ERROR:', msg.data.error);
    }
  }
  
  // Request screenshot to verify
  setTimeout(() => {
    console.log('📸 Requesting screenshot to verify spotlight...');
    ws.send(JSON.stringify({ action: 'get_screenshot' }));
  }, 2000);
});

ws.on('close', function close() {
  console.log('🔗 Connection closed');
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
});