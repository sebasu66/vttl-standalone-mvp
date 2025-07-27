
// Model Manager Class to handle both 3D and sprite representations
class ModelManager {
    constructor(app) {
        this.app = app;
        this.spriteAngles = 8; // Number of pre-rendered angles
        this.cameraPositions = 4; // Front, Left, Back, Right
        this.spriteCache = new Map(); // Cache for sprite textures
        this.currentCameraAngle = 0;
        
        // Camera angles in radians (0, 90, 180, 270)
        this.cameraAngles = Array(4).fill().map((_, i) => (i * 90) * Math.PI / 180);
        
        // Setup render texture for capturing sprites
        this.renderTarget = new pc.RenderTarget({
            width: 512,
            height: 512,
            format: pc.PIXELFORMAT_R8_G8_B8_A8
        });
        
        this.setupRenderCamera();
    }

    setupRenderCamera() {
        this.renderCamera = new pc.Camera();
        this.renderCamera.clearColor = new pc.Color(0, 0, 0, 0);
        
        // Set up isometric angle (35.264 degrees)
        const isoAngle = 35.264 * Math.PI / 180;
        this.renderCamera.setPosition(1, Math.tan(isoAngle), 1);
        this.renderCamera.lookAt(0, 0, 0);
    }

    async generateSprites(model) {
        const sprites = [];
        const modelEntity = new pc.Entity();
        modelEntity.addComponent('model', { model: model });
        
        // Generate sprites for 8 rotations
        for (let i = 0; i < this.spriteAngles; i++) {
            const angle = (i * 360 / this.spriteAngles) * Math.PI / 180;
            modelEntity.setLocalEulerAngles(0, angle, 0);
            
            // Render to texture
            this.app.renderer.renderTarget = this.renderTarget;
            this.app.renderer.render();
            
            // Create sprite from render target
            const sprite = this.createSpriteFromRenderTarget();
            sprites.push(sprite);
        }
        
        return sprites;
    }

    createSpriteFromRenderTarget() {
        // Create texture from render target
        const texture = new pc.Texture(this.app.graphicsDevice, {
            width: this.renderTarget.width,
            height: this.renderTarget.height,
            format: pc.PIXELFORMAT_R8_G8_B8_A8
        });
        
        // Copy render target to texture
        texture.setSource(this.renderTarget.colorBuffer);
        
        return texture;
    }

    createSpriteMaterial(texture) {
        const material = new pc.StandardMaterial();
        material.blendType = pc.BLEND_NORMAL;
        material.depthWrite = false;
        material.diffuseMap = texture;
        material.update();
        return material;
    }
}

// GamePiece class to manage individual game pieces
class GamePiece {
    constructor(modelManager, modelAsset, position) {
        this.modelManager = modelManager;
        this.position = position;
        this.rotation = 0;
        this.sprites = [];
        this.currentSpriteIndex = 0;
        
        this.setup3DModel(modelAsset);
        this.generateSprites();
    }

    async setup3DModel(modelAsset) {
        this.entity3D = new pc.Entity();
        this.entity3D.addComponent('model', { asset: modelAsset });
        this.entity3D.setPosition(this.position);
    }

    async generateSprites() {
        this.sprites = await this.modelManager.generateSprites(this.entity3D.model.model);
    }

    updateView(cameraAngle, isMobile) {
        if (isMobile) {
            // Calculate appropriate sprite based on camera angle and piece rotation
            const totalAngle = (cameraAngle + this.rotation) % 360;
            const spriteIndex = Math.floor(totalAngle / (360 / this.sprites.length));
            this.currentSpriteIndex = spriteIndex;
            
            // Update sprite material
            this.updateSpriteMaterial(this.sprites[spriteIndex]);
        } else {
            // Update 3D model rotation
            this.entity3D.setLocalEulerAngles(0, this.rotation, 0);
        }
    }

    rotate(angle) {
        this.rotation = (this.rotation + angle) % 360;
        this.updateView(this.modelManager.currentCameraAngle, 
                       this.modelManager.app.isMobile);
    }
}

// Camera Manager to handle perspective/orthographic switching
class CameraManager {
    constructor(app) {
        this.app = app;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        this.setupCameras();
        this.currentAngleIndex = 0; // 0: Front, 1: Left, 2: Back, 3: Right
    }

    setupCameras() {
        // Perspective camera for PC
        this.perspectiveCamera = new pc.Camera();
        this.perspectiveCamera.layers = [this.app.scene.layers.getLayerByName('3D')];

        // Orthographic camera for mobile
        this.orthographicCamera = new pc.Camera();
        this.orthographicCamera.ortho = true;
        this.orthographicCamera.layers = [this.app.scene.layers.getLayerByName('Sprites')];
        
        // Set initial camera based on platform
        this.currentCamera = this.isMobile ? this.orthographicCamera : this.perspectiveCamera;
        
        // Setup isometric angle for orthographic camera
        if (this.isMobile) {
            const isoAngle = 35.264 * Math.PI / 180;
            this.orthographicCamera.setPosition(1, Math.tan(isoAngle), 1);
            this.orthographicCamera.lookAt(0, 0, 0);
        }
    }

    rotateCamera(direction) {
        if (!this.isMobile) return;

        // Update camera position index (0-3)
        this.currentAngleIndex = (this.currentAngleIndex + direction + 4) % 4;
        
        // Calculate new camera position
        const angle = this.currentAngleIndex * 90;
        const rad = angle * Math.PI / 180;
        const distance = this.orthographicCamera.getPosition().length();
        
        const newPos = new pc.Vec3(
            Math.cos(rad) * distance,
            this.orthographicCamera.getPosition().y,
            Math.sin(rad) * distance
        );
        
        this.orthographicCamera.setPosition(newPos);
        this.orthographicCamera.lookAt(0, 0, 0);
        
        // Notify all game pieces to update their sprites
        this.app.fire('cameraRotated', angle);
    }
}

// Usage Example:
const initialize = (app) => {
    const cameraManager = new CameraManager(app);
    const modelManager = new ModelManager(app);
    
    // Create game pieces
    const pieces = [];
    gameState.pieces.forEach(pieceData => {
        const piece = new GamePiece(
            modelManager,
            pieceData.modelAsset,
            pieceData.position
        );
        pieces.push(piece);
    });
    
    // Handle camera rotation
    app.on('cameraRotated', (angle) => {
        pieces.forEach(piece => {
            piece.updateView(angle, app.isMobile);
        });
    });
};
