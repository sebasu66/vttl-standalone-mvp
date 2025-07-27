const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

let responseReceived = false;

ws.on('open', function open() {
  console.log('💡 Creating spotlight with proper response handling');
  console.log('===============================================');
  
  // Check existing lights and create spotlight
  ws.send(JSON.stringify({
    action: 'execute_javascript',
    data: {
      code: `
console.log('🔍 Checking existing lights...');
const entityManager = window.gameController.entityManager;

// List all lights
const allLights = entityManager.getAllLights();
console.log('💡 Found lights:', allLights.length);

let lightInfo = [];
allLights.forEach((light, index) => {
    console.log(\`   Light \${index + 1}: \${light.name} (\${light.lightType}) - intensity: \${light.intensity}\`);
    lightInfo.push(\`\${light.name}(\${light.lightType})\`);
});

// Now create spotlight
console.log('✨ Creating spotlight...');
const spotlight = entityManager.createEntity('CubeSpotlight', 'light', {
    lightType: 'spot',
    position: [2, 8, 2],
    color: [1, 0.9, 0.8],
    intensity: 2.0,
    range: 15,
    innerConeAngle: 15,
    outerConeAngle: 30,
    castShadows: true
});

let results = [];
if (spotlight) {
    results.push('✅ Spotlight created');
    if (spotlight.playcanvasEntity) {
        spotlight.playcanvasEntity.lookAt(0, 1, 0);
        results.push('🎯 Aimed at cube');
    }
} else {
    results.push('❌ Spotlight failed');
}

// Try to find and fade any existing light
if (allLights.length > 0) {
    const firstLight = allLights[0];
    console.log(\`🔅 Fading first light: \${firstLight.name}\`);
    firstLight.updateLightProperties({ intensity: 0.2 });
    results.push(\`🔅 Faded \${firstLight.name}\`);
} else {
    results.push('❌ No existing lights to fade');
}

const finalResult = 'LIGHTING: Found ' + allLights.length + ' lights | ' + results.join(' | ');
console.log('📋 Final:', finalResult);
return finalResult;
      `
    }
  }));
  
  setTimeout(() => {
    if (!responseReceived) {
      console.log('⏰ No response received');
      ws.close();
    }
  }, 5000);
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  if (msg.type === 'javascript_result') {
    responseReceived = true;
    const result = msg.data;
    
    console.log('📨 RESPONSE:');
    if (result.status === 'success') {
      console.log('   ✅ SUCCESS:', result.result);
    } else {
      console.log('   ❌ ERROR:', result.error);
    }
    
    setTimeout(() => {
      console.log('🎭 Lighting setup completed!');
      ws.close();
    }, 1000);
  }
});

ws.on('error', function error(err) {
  console.log('❌ Error:', err.message);
});