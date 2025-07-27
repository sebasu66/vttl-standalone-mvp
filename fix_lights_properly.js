const WebSocket = require('ws');

console.log('💡 Using existing lights class to create proper spotlight');
console.log('====================================================');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('✅ Connected - using VTTLLight class');
  
  const message = {
    action: 'execute_javascript',
    data: {
      code: `
console.log('💡 USING EXISTING LIGHTS CLASS FOR SPOTLIGHT');

// Restore ambient light so scene isn't pitch black
window.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.25);

// Get existing lights and restore them to reasonable brightness
const existingLights = window.gameController.entityManager.getAllLights();
existingLights.forEach(light => {
    light.updateLightProperties({ intensity: 0.4 });
    console.log('🔅 Restored', light.name, 'to 0.4 intensity');
});

// Create spotlight using existing light class system
const spotlightData = {
    lightType: 'spot',
    position: [0, 12, 0],
    color: [1, 0.9, 0.8],
    intensity: 10.0,
    range: 25,
    innerConeAngle: 20,
    outerConeAngle: 40,
    castShadows: true
};

// Use the server's light creation system
window.gameController.sendMessage('create_light', {
    name: 'CubeSpotlight',
    type: 'spot',
    position: [0, 12, 0],
    color: [1, 0.9, 0.8],
    intensity: 10.0,
    range: 25,
    innerConeAngle: 20,
    outerConeAngle: 40,
    castShadows: true
});

return 'Using proper lights class - spotlight created via server API';
      `
    }
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Sent proper lights class command');
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  
  if (msg.type === 'javascript_result') {
    if (msg.data.status === 'success') {
      console.log('✅ SUCCESS:', msg.data.result);
    } else {
      console.log('❌ ERROR:', msg.data.error);
    }
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
});