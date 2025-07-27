const WebSocket = require('ws');

console.log('🏷️ Giving objects simple names');
console.log('==============================');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  ws.send(JSON.stringify({
    action: 'execute_javascript',
    data: {
      code: `
// Simple object naming
const entities = window.app.root.find(() => true);
console.log('📦 Found', entities.length, 'entities total');

// Find and rename key objects
const cube = window.app.root.findByName('CentralDie');
if (cube) {
    cube.name = 'Cube';
    console.log('✅ Renamed CentralDie to Cube');
}

const board = window.app.root.findByName('GameBoard');  
if (board) {
    board.name = 'Board';
    console.log('✅ Renamed GameBoard to Board');
}

// Rename camera via entity manager
const cam = window.gameController.entityManager.getCamera('MainCamera');
if (cam) {
    cam.name = 'Cam';
    console.log('✅ Renamed MainCamera to Cam');
}

return 'Objects renamed: Cube, Board, Cam';
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'javascript_result') {
    if (msg.data.status === 'success') {
      console.log('✅', msg.data.result);
    } else {
      console.log('❌', msg.data.error);
    }
    ws.close();
  }
});

ws.on('error', (err) => console.log('❌ Error:', err.message));
ws.on('close', () => console.log('🔗 Connection closed'));