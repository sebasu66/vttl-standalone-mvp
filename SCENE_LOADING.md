# PlayCanvas Editor Scene Loading

This VTTL system supports loading scenes created in PlayCanvas Editor, allowing you to design professional scenes with assets, lighting, and layouts in the editor, then control them via the AI API.

## Configuration Methods

### 1. URL Parameters (Recommended)

Load a scene by adding parameters to the URL:

**For Published Builds:**
```
http://localhost:3001?mode=playcanvas_project&buildUrl=https://your-playcanvas-build-url.com/
```

**For Scene Assets (Advanced):**
```
http://localhost:3001?mode=playcanvas_project&projectId=12345&sceneId=67890&assetId=11111
```

### 2. localStorage Configuration

Store scene configuration persistently:

```javascript
// In browser console or your code
const sceneConfig = {
    mode: 'playcanvas_project',
    buildUrl: 'https://your-build-url.com/',
    projectId: '12345',  // Optional
    sceneId: '67890',    // Optional  
    assetId: '11111'     // Optional
};

localStorage.setItem('vttl_scene_config', JSON.stringify(sceneConfig));
// Reload page to apply
location.reload();
```

### 3. Direct Code Configuration

Edit `app.js` directly to set default configuration:

```javascript
const SCENE_CONFIG = {
    mode: 'playcanvas_project',
    buildUrl: 'https://your-build-url.com/',
    projectId: null,
    sceneId: null, 
    assetId: null
};
```

## How to Get PlayCanvas Build URLs

### Method 1: Published Build (Easiest)

1. Open your project in PlayCanvas Editor
2. Go to "Publishing" tab
3. Click "Publish to Web" 
4. Copy the generated build URL
5. Use this URL in the `buildUrl` parameter

### Method 2: Self-Hosted Build

1. Download your project build from PlayCanvas
2. Host the build files on your web server
3. Use the URL to your hosted `index.html`

## Scene Requirements

### Camera Setup
- The system will detect existing cameras named "Camera" or "camera"
- If no camera found, a default camera will be created
- Camera controls (mouse/API) will work with editor cameras

### Lighting
- Existing lights in your scene will be preserved
- If no lights found, basic directional lighting will be added
- Recommended: Add at least one directional light in your editor scene

### Entity Management
- Entities created via API will be added to your loaded scene
- Existing scene entities are preserved and detected
- Use descriptive names for entities you want to reference from API

## Testing Your Scene

1. **Create Scene in PlayCanvas Editor:**
   ```
   - Add assets (models, textures, etc.)
   - Set up camera position and lighting
   - Publish or export your scene
   ```

2. **Test Loading:**
   ```
   http://localhost:3001?mode=playcanvas_project&buildUrl=YOUR_BUILD_URL
   ```

3. **Verify in Console:**
   ```
   Look for messages like:
   "Scene loaded from build URL successfully"
   "Using existing camera from PlayCanvas scene"
   "Found X lights in PlayCanvas scene"
   ```

4. **Test API Control:**
   ```python
   # Your Python scripts should work normally
   python test_camera_screenshot.py
   python interactive_editor.py
   ```

## Fallback Behavior

If scene loading fails:
- System automatically falls back to standalone mode
- Default camera and lighting are created
- Ground plane is added
- All API functionality continues to work

## Example Usage

```python
# Python API works the same regardless of scene source
from vttl_client import VTTLClient, GridPosition

client = VTTLClient("ws://localhost:8080")
await client.connect()

# Take screenshot of your editor scene
screenshot = await client.take_screenshot()

# Add entities to your editor scene  
await client.create_mini("player1", "warrior", GridPosition(2, 2))

# Change camera angle to view your scene
await client.set_camera_angle(angle_x=45, angle_y=30, distance=20)
```

## Troubleshooting

**Scene doesn't load:**
- Check browser console for error messages
- Verify build URL is accessible  
- Ensure CORS headers allow cross-origin requests

**Camera controls don't work:**
- Check if camera exists in scene
- Try different camera names ("Camera", "camera", "MainCamera")

**Missing assets:**
- Ensure all assets are included in published build
- Check asset loading errors in console

**API entities not visible:**
- Verify entity creation with `await client.get_game_state()`
- Check entity positioning and scale
- Ensure proper lighting in scene