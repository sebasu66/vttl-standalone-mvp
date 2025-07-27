var BaseMini = pc.createScript('baseMini');

// Add light entity attribute
BaseMini.attributes.add('light', {
    type: 'entity',
    title: 'Light Entity'
});


//this atribute setter is used to trigger functions when the light_on property changes

Object.defineProperty(BaseMini.prototype, 'light_on', {
        type: 'boolean',
    title: 'Light On',
    default: false,
        set: function(value) {
            this._light_on = value;
            this.updateLightState();
        },
        get: function() {
            return this._light_on;
        }
    });
// Add color attribute
BaseMini.attributes.add('color', {
    type: "rgb",
    title: 'Color'
});


// Method to update the light's enabled state
BaseMini.prototype.updateLightState = function() {
    if (this.light) {
        this.light.enabled = this.light_on;
    }
};


// initialize code called once per entity
BaseMini.prototype.initialize = function() {
    // Clone the material to avoid affecting other entities using the same material
    var material = this.entity.render.material;
    material = material.clone();

    // Set the diffuse color of the material
    material.diffuse.set(this.color.r, this.color.g, this.color.b);
    material.update();

    // Assign the cloned material back to the render component
    this.entity.render.material = material;
    this.material = material; // Store reference for later use

    // Check if the light entity and its light component exist
    if (this.light && this.light.light) {
        // Set the light's color
        this.light.light.color.set(this.color.r, this.color.g, this.color.b);

        // Enable or disable the light based on the light_on parameter
        this.light.enabled = this.light_on;
    }

    // Listen for changes to the color attribute
    this.on('attr:color', function(value, oldValue) {
        // Update the material's diffuse color
        this.material.diffuse.set(value.r, value.g, value.b);
        this.material.update();

        // Update the light's color if it exists
        if (this.light && this.light.light) {
            this.light.light.color.set(value.r, value.g, value.b);
        }
    }, this);

    // Listen for changes to the light_on attribute
    this.on('attr:light_on', function(value, oldValue) {
        // Enable or disable the light
        if (this.light) {
            this.light.enabled = value;
        }
    }, this);
};

// Method to update the light's enabled state
BaseMini.prototype.updateLightState = function() {
    if (this.light) {
        this.light.enabled = this.light_on;
    }
};


// update code called every frame (not needed in this case)
BaseMini.prototype.update = function(dt) {
    // No update logic required unless you need to perform actions every frame
};