# VTTL Development Setup with Auto-Reload

## Quick Start

Run the development environment with auto-reload:

```bash
./start_dev_simple.sh
```

This will:
- ✅ Start WebSocket server on port 8080 (with auto-restart)
- ✅ Start development HTTP server on port 3003 (with live reload)
- ✅ Open browser automatically
- ✅ Watch for file changes and reload instantly

## Development Features

### 🔄 Auto-Reload
- **Client Files**: Edit any `.js`, `.html`, or `.css` file in `client/` → Browser reloads automatically
- **Server Files**: Edit any `.js` file in `server/` → Server restarts automatically
- **Live Connection**: WebSocket maintains connection during reloads

### 📁 File Watching
Monitors these file patterns:
- `client/**/*.js` - JavaScript files
- `client/**/*.html` - HTML files  
- `client/**/*.css` - CSS files
- `server/**/*.js` - Server files

### 🌐 Development URLs
- **Game Client**: http://localhost:3003/client/
- **WebSocket Server**: ws://localhost:8080
- **Live Reload**: ws://localhost:3002

## Development Workflow

1. **Start Development**:
   ```bash
   ./start_dev_simple.sh
   ```

2. **Edit Files**:
   - Open `client/game-controller.js` in your editor
   - Make changes to the code
   - Save the file
   - Browser automatically refreshes with your changes

3. **Test Features**:
   - Use browser buttons: "Run Demo", "Move Pieces", "Screenshot"
   - Check browser console for live reload messages
   - Edit server files to see auto-restart in action

4. **Stop Development**:
   ```bash
   Ctrl+C  # Stops both servers
   ```

## Browser Console Messages

When auto-reload is working, you'll see:
```
🔄 Live reload enabled
✅ Live reload connected
🔄 Reloading due to file change: client/game-controller.js
```

## Troubleshooting

### Port Conflicts
If ports are in use, the script will automatically kill existing processes.

### Missing Dependencies
Run once to install:
```bash
cd server && npm install
npm install  # In main directory
```

### Manual Testing
Test file watching manually:
```bash
python3 test_auto_reload.py
```

## Production vs Development

| Feature | Production (`./start_all.sh`) | Development (`./start_dev_simple.sh`) |
|---------|-------------------------------|----------------------------------------|
| File Watching | ❌ No | ✅ Yes |
| Auto-Reload | ❌ No | ✅ Yes |
| Auto-Restart | ❌ No | ✅ Yes |
| Ports | 3000, 8080 | 3003, 8080, 3002 |
| Browser Launch | ✅ Yes | ✅ Yes |
| Live Logs | ✅ Yes | ✅ Yes |

## Version Information

Current development version: **1.4.1-devmode**

Features included:
- Entity Classes (Lights, Cameras, Models)
- Pan Camera Controls
- Game Board with Pieces
- Auto-Reload Development Server
- Live File Watching
- Hot Server Restart

## Tips

1. **Keep Console Open**: Browser console shows reload messages and errors
2. **Save Often**: Every save triggers an instant reload
3. **Use Hard Refresh**: If needed, use Ctrl+Shift+R to clear cache
4. **Edit Safely**: Auto-reload preserves WebSocket connections when possible
5. **Multi-File Edits**: Make multiple changes, save triggers reload for all

Happy coding with instant feedback! 🚀