var CameraSwitcher = pc.createScript('cameraSwitcher');

// Define the key that activates the camera switch (e.g., the 'T' key)
CameraSwitcher.attributes.add('activationKey', {
    type: 'string',
    default: 't',
    description: 'Key to activate the camera switch'
});

// Store a reference to the cloned camera
CameraSwitcher.prototype.cloneCamera = null;

// Initialize the script
CameraSwitcher.prototype.initialize = function() {
    // Ensure we have a camera component on the entity
    if (!this.entity.camera) {
        console.error('CameraSwitcher script must be attached to an entity with a camera component.');
        return;
    }
    
    // Listen for key presses
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};

// Handling key presses
CameraSwitcher.prototype.onKeyDown = function(event) {
    // Check if the activation key is pressed
    var keyPressed = String.fromCharCode(event.key).toLowerCase();
    if (keyPressed === this.activationKey.toLowerCase()) {
        this.switchToTopDownView();
    }
};

// Switch to top-down orthographic view
CameraSwitcher.prototype.switchToTopDownView = function() {
    // If we have already cloned the camera, just switch to it
    if (this.cloneCamera) {
        this.app.root.findByName('OriginalCamera').camera.enabled = false;
        this.cloneCamera.camera.enabled = true;
        return;
    }

    // Clone the current camera entity
    var originalCamera = this.entity;
    this.cloneCamera = originalCamera.clone();
    this.cloneCamera.name = 'TopDownCamera';
    this.app.root.addChild(this.cloneCamera);

    // Disable the original camera
    originalCamera.name = 'OriginalCamera';
    originalCamera.camera.enabled = false;

    // Enable the cloned camera
    this.cloneCamera.camera.enabled = true;

    // Set the cloned camera to orthographic projection
    this.cloneCamera.camera.projection = pc.PROJECTION_ORTHOGRAPHIC;

    // Position the camera directly above the scene
    // Assuming Y is up direction in PlayCanvas
    var sceneCenter = new pc.Vec3(0, 0, 0); // Adjust if your scene center is different
    var cameraHeight = 100; // Adjust height as needed
    this.cloneCamera.setPosition(sceneCenter.x, cameraHeight, sceneCenter.z);

    // Look straight down at the scene center
    this.cloneCamera.lookAt(sceneCenter);

    // Adjust orthographic height to control the zoom level
    this.cloneCamera.camera.orthoHeight = 50; // Adjust as needed

    // Render only albedo textures
    this.renderAlbedoOnly(this.cloneCamera);
};

// Function to set up rendering only albedo (diffuse color)
CameraSwitcher.prototype.renderAlbedoOnly = function(cameraEntity) {
    var device = this.app.graphicsDevice;

    // Create a new material that renders only the albedo
    var albedoMaterial = new pc.StandardMaterial();
    albedoMaterial.diffuse = new pc.Color(1, 1, 1);
    albedoMaterial.useLighting = false;
    albedoMaterial.emissiveMap = albedoMaterial.diffuseMap;
    albedoMaterial.emissive = albedoMaterial.diffuse;
    albedoMaterial.update();

    // Override the material of all models to render albedo only
    var renderables = this.app.root.findComponents("render");
    renderables.forEach(function(renderComponent) {
        var meshInstances = renderComponent.meshInstances;
        meshInstances.forEach(function(meshInstance) {
            // Store the original material if needed to revert later
            meshInstance.originalMaterial = meshInstance.material;
            meshInstance.material = albedoMaterial;
        });
    });
};