const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('🏷️ Giving objects easy names');
  console.log('===========================');
  
  ws.send(JSON.stringify({
    action: 'execute_javascript',
    data: {
      code: `
// Give objects easy names for reference
console.log('🏷️ Naming objects for easy reference...');

// Name the white cube
const whiteCube = window.app.root.findByName('CentralDie');
if (whiteCube) {
    whiteCube.name = 'Cube';
    console.log('✅ White cube renamed to: Cube');
}

// Name the camera
const camera = window.gameController.entityManager.getCamera('MainCamera');
if (camera) {
    camera.name = 'Cam';
    console.log('✅ Camera renamed to: Cam');
}

// Name any lights
const lights = window.gameController.entityManager.getAllLights();
lights.forEach((light, index) => {
    const oldName = light.name;
    light.name = 'Light' + (index + 1);
    console.log(\`✅ Light "\${oldName}" renamed to: \${light.name}\`);
});

// Name the board/ground
const board = window.app.root.findByName('GameBoard');
if (board) {
    board.name = 'Board';
    console.log('✅ Game board renamed to: Board');
}

// Name any game pieces
const redPieces = window.app.root.find(entity => entity.name && entity.name.startsWith('RedPiece'));
redPieces.forEach((piece, index) => {
    const oldName = piece.name;
    piece.name = 'Red' + (index + 1);
    console.log(\`✅ Red piece "\${oldName}" renamed to: \${piece.name}\`);
});

const bluePieces = window.app.root.find(entity => entity.name && entity.name.startsWith('BluePiece'));
bluePieces.forEach((piece, index) => {
    const oldName = piece.name;
    piece.name = 'Blue' + (index + 1);
    console.log(\`✅ Blue piece "\${oldName}" renamed to: \${piece.name}\`);
});

// Create a reference list
const namedObjects = {
    cube: whiteCube ? 'Cube' : 'not found',
    camera: camera ? 'Cam' : 'not found', 
    lights: lights.map(l => l.name),
    board: board ? 'Board' : 'not found',
    redPieces: redPieces.map(p => p.name),
    bluePieces: bluePieces.map(p => p.name)
};

console.log('📋 Named objects:', JSON.stringify(namedObjects, null, 2));

return 'OBJECTS RENAMED: Cube, Cam, ' + lights.length + ' lights, Board, ' + 
       redPieces.length + ' red pieces, ' + bluePieces.length + ' blue pieces';
      `
    }
  }));
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  if (msg.type === 'javascript_result') {
    const result = msg.data;
    
    if (result.status === 'success') {
      console.log('✅ SUCCESS:', result.result);
    } else {
      console.log('❌ ERROR:', result.error);
    }
    
    console.log('\n🎯 Now you can reference objects by simple names:');
    console.log('   - "Cube" = white cube');
    console.log('   - "Cam" = camera');
    console.log('   - "Light1", "Light2" = lights');
    console.log('   - "Board" = game board');
    console.log('   - "Red1", "Red2" = red pieces');
    console.log('   - "Blue1", "Blue2" = blue pieces');
    
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.log('❌ Error:', err.message);
});