# Browser Console Commands for Lights Trick

Since the WebSocket connection seems to have issues, you can run these commands directly in the browser console:

## 🎭 Dramatic Lighting Effect

Open the browser console (F12) and paste these commands one by one:

### Step 1: Create Spotlight
```javascript
// Create dramatic spotlight on cube
console.log('💡 Creating spotlight...');
const spotlight = window.gameController.entityManager.createEntity('CubeSpotlight', 'light', {
    lightType: 'spot',
    position: [2, 8, 2],
    rotation: [-45, -30, 0],
    color: [1, 0.9, 0.8],  // Warm white
    intensity: 3.0,
    range: 15,
    innerConeAngle: 12,
    outerConeAngle: 25,
    castShadows: true
});

// Aim spotlight at cube
if (spotlight && spotlight.playcanvasEntity) {
    spotlight.playcanvasEntity.lookAt(0, 1, 0);
    console.log('✅ Spotlight created and aimed at cube');
}
```

### Step 2: Fade Existing Lights
```javascript
// Find and fade all existing lights
console.log('🔅 Fading existing lights...');
const existingLights = window.gameController.entityManager.getAllLights();

existingLights.forEach((light, index) => {
    if (light.name !== 'CubeSpotlight') {  // Don't fade our new spotlight
        const originalIntensity = light.intensity;
        light.updateLightProperties({ intensity: 0.1 });
        console.log(`🔅 Faded ${light.name} from ${originalIntensity} to 0.1`);
    }
});
```

### Step 3: Set Dramatic Ambient
```javascript
// Set dark ambient lighting for mood
console.log('🌙 Setting dramatic ambient...');
if (window.app && window.app.scene) {
    window.app.scene.ambientLight = new pc.Color(0.1, 0.1, 0.15);
    console.log('🌙 Ambient set to dark blue');
}

console.log('🎭 LIGHTS TRICK COMPLETE!');
```

## 🎯 Expected Result:
- Dramatic warm spotlight highlighting the white cube
- All other lights faded to 10% intensity
- Dark blue ambient lighting for atmosphere
- Cinematic focus effect on the cube

## 🔄 To Reset Lighting:
```javascript
// Reset all lights to normal
const lights = window.gameController.entityManager.getAllLights();
lights.forEach(light => {
    light.updateLightProperties({ intensity: 1.0 });
});
window.app.scene.ambientLight = new pc.Color(0.3, 0.3, 0.35);
console.log('🔄 Lighting reset to normal');
```