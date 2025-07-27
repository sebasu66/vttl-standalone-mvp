/**
 * SceneFileWatcher - Monitors scene_state.json for changes and applies them to the game
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class SceneFileWatcher {
    constructor(gameStateManager, websocketHandler) {
        this.gameStateManager = gameStateManager;
        this.websocketHandler = websocketHandler;
        this.sceneFilePath = path.join(__dirname, '../scene_state.json');
        this.lastKnownState = null;
        this.isProcessing = false;
        this.lastModifiedTime = null;
        this.pollingInterval = null;
        
        console.log('📁 SceneFileWatcher initialized');
        console.log(`   Watching: ${this.sceneFilePath}`);
        
        this.initializeWatcher();
        this.loadInitialState();
    }
    
    initializeWatcher() {
        // Use timer-based polling instead of file watching
        this.pollingInterval = setInterval(() => {
            this.checkForFileChanges();
        }, 2000); // Check every 2 seconds
        
        console.log('⏰ Timer-based file polling active (every 2 seconds)');
    }
    
    async checkForFileChanges() {
        if (this.isProcessing) return;
        
        try {
            if (!fs.existsSync(this.sceneFilePath)) {
                return;
            }
            
            const stats = fs.statSync(this.sceneFilePath);
            const currentModifiedTime = stats.mtime.getTime();
            
            // Store the last modified time on first check
            if (!this.lastModifiedTime) {
                this.lastModifiedTime = currentModifiedTime;
                return;
            }
            
            // Check if file has been modified
            if (currentModifiedTime > this.lastModifiedTime) {
                console.log('📝 scene_state.json changed (timer detected) - processing...');
                this.lastModifiedTime = currentModifiedTime;
                await this.processSceneChanges();
            }
        } catch (error) {
            console.warn('⚠️  Error checking file changes:', error.message);
        }
    }
    
    async loadInitialState() {
        try {
            if (fs.existsSync(this.sceneFilePath)) {
                const fileContent = fs.readFileSync(this.sceneFilePath, 'utf8');
                const sceneState = JSON.parse(fileContent);
                
                console.log('🎬 Loading initial scene state from file...');
                await this.applySceneState(sceneState);
                this.lastKnownState = sceneState;
                
                console.log('✅ Initial scene state loaded');
            } else {
                console.log('⚠️  No scene_state.json file found - creating default');
                await this.createDefaultSceneFile();
            }
        } catch (error) {
            console.error('❌ Error loading initial scene state:', error.message);
        }
    }
    
    async processSceneChanges() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        const maxRetries = 3;
        const retryDelayMs = 2000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📄 Processing scene changes (attempt ${attempt}/${maxRetries})...`);
                
                // Bulletproof file reading with validation
                let fileContent;
                try {
                    fileContent = fs.readFileSync(this.sceneFilePath, 'utf8');
                } catch (readError) {
                    console.warn(`⚠️  Could not read scene file: ${readError.message}`);
                    if (attempt === maxRetries) {
                        console.error('❌ Failed to read scene file after all attempts');
                        return;
                    }
                    console.log(`🔄 Retrying in ${retryDelayMs}ms...`);
                    await this.delay(retryDelayMs);
                    continue;
                }
                
                // Bulletproof JSON parsing
                let newSceneState;
                try {
                    newSceneState = JSON.parse(fileContent);
                } catch (parseError) {
                    console.warn(`⚠️  Invalid JSON in scene file: ${parseError.message}`);
                    if (attempt === maxRetries) {
                        console.error('❌ JSON parsing failed after all attempts - scene file may be corrupted');
                        return;
                    }
                    console.log(`🔄 File may be in the middle of being edited, retrying in ${retryDelayMs}ms...`);
                    await this.delay(retryDelayMs);
                    continue;
                }
                
                // Validate scene structure
                if (!this.validateSceneStructure(newSceneState)) {
                    console.warn('⚠️  Invalid scene structure detected');
                    if (attempt === maxRetries) {
                        console.error('❌ Scene structure validation failed after all attempts');
                        return;
                    }
                    console.log(`🔄 Retrying in ${retryDelayMs}ms...`);
                    await this.delay(retryDelayMs);
                    continue;
                }
                
                // If we reach here, file reading and parsing succeeded
                if (!this.lastKnownState) {
                    // First time loading
                    console.log('🎬 First-time scene state loading...');
                    await this.applySceneState(newSceneState);
                    this.lastKnownState = JSON.parse(JSON.stringify(newSceneState)); // deep copy
                } else {
                    // Compare states and apply changes
                    console.log('🔄 Comparing and applying scene changes...');
                    await this.applyChanges(this.lastKnownState, newSceneState);
                    this.lastKnownState = JSON.parse(JSON.stringify(newSceneState)); // deep copy
                }
                
                // Success - update timestamp and save
                try {
                    newSceneState.last_modified = new Date().toISOString();
                    fs.writeFileSync(this.sceneFilePath, JSON.stringify(newSceneState, null, 2));
                    console.log('✅ Scene changes processed successfully');
                } catch (writeError) {
                    console.warn(`⚠️  Could not update timestamp in scene file: ${writeError.message}`);
                    // Don't fail the entire operation for timestamp update issues
                }
                
                break; // Success - exit retry loop
                
            } catch (error) {
                console.error(`❌ Error processing scene changes (attempt ${attempt}):`, error.message);
                if (attempt === maxRetries) {
                    console.error('❌ Scene processing failed after all attempts - server remains stable');
                } else {
                    console.log(`🔄 Retrying in ${retryDelayMs}ms...`);
                    await this.delay(retryDelayMs);
                }
            }
        }
        
        this.isProcessing = false;
    }
    
    validateSceneStructure(sceneState) {
        try {
            // Basic structure validation
            if (!sceneState || typeof sceneState !== 'object') {
                console.warn('⚠️  Scene state is not an object');
                return false;
            }
            
            // Check for required fields
            if (!sceneState.hasOwnProperty('entities')) {
                console.warn('⚠️  Scene state missing entities field');
                return false;
            }
            
            if (!sceneState.hasOwnProperty('scene_settings')) {
                console.warn('⚠️  Scene state missing scene_settings field');
                return false;
            }
            
            // Validate entities structure
            if (typeof sceneState.entities !== 'object') {
                console.warn('⚠️  entities field is not an object');
                return false;
            }
            
            // Validate individual entities
            for (const [entityName, entityData] of Object.entries(sceneState.entities)) {
                if (!entityData.name || !entityData.template || !Array.isArray(entityData.position)) {
                    console.warn(`⚠️  Invalid entity structure for: ${entityName}`);
                    return false;
                }
                
                if (entityData.position.length !== 3) {
                    console.warn(`⚠️  Invalid position array length for entity: ${entityName}`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.warn(`⚠️  Scene validation error: ${error.message}`);
            return false;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async applySceneState(sceneState) {
        console.log('🎭 Applying complete scene state...');
        
        try {
            // Clear existing entities first
            await this.gameStateManager.clearAllEntities();
            console.log('🧹 Cleared existing entities');
            
            // Apply camera settings with error handling
            if (sceneState.scene_settings && sceneState.scene_settings.camera) {
                try {
                    const camera = sceneState.scene_settings.camera;
                    this.websocketHandler.broadcastToClients({
                        type: 'camera_update',
                        data: {
                            position: camera.position,
                            target: camera.target
                        }
                    });
                    console.log('📷 Camera settings applied');
                } catch (cameraError) {
                    console.warn(`⚠️  Failed to apply camera settings: ${cameraError.message}`);
                }
            }
            
            // Create all entities with individual error handling
            let successCount = 0;
            let errorCount = 0;
            
            if (sceneState.entities) {
                for (const [entityName, entityData] of Object.entries(sceneState.entities)) {
                    try {
                        await this.createEntity(entityData);
                        successCount++;
                        console.log(`✅ Created entity: ${entityName}`);
                    } catch (entityError) {
                        errorCount++;
                        console.warn(`⚠️  Failed to create entity ${entityName}: ${entityError.message}`);
                    }
                }
            }
            
            // Broadcast the complete updated game state
            this.websocketHandler.broadcastGameState();
            
            console.log(`✅ Applied scene state: ${successCount} entities created, ${errorCount} errors`);
            
        } catch (error) {
            console.error(`❌ Critical error applying scene state: ${error.message}`);
            throw error; // Re-throw to trigger retry logic
        }
    }
    
    async applyChanges(oldState, newState) {
        console.log('🔄 Detecting and applying changes...');
        
        try {
            const oldEntities = oldState.entities || {};
            const newEntities = newState.entities || {};
            
            let deleteSuccessCount = 0;
            let deleteErrorCount = 0;
            let createSuccessCount = 0;
            let createErrorCount = 0;
            let updateSuccessCount = 0;
            let updateErrorCount = 0;
            
            // Find entities to delete
            for (const entityName of Object.keys(oldEntities)) {
                if (!newEntities[entityName]) {
                    try {
                        console.log(`🗑️  Deleting entity: ${entityName}`);
                        await this.gameStateManager.deleteEntity({ name: entityName });
                        deleteSuccessCount++;
                    } catch (deleteError) {
                        deleteErrorCount++;
                        console.warn(`⚠️  Failed to delete entity ${entityName}: ${deleteError.message}`);
                    }
                }
            }
            
            // Find entities to create or update
            for (const [entityName, entityData] of Object.entries(newEntities)) {
                if (!oldEntities[entityName]) {
                    // New entity
                    try {
                        console.log(`➕ Creating entity: ${entityName}`);
                        await this.createEntity(entityData);
                        createSuccessCount++;
                    } catch (createError) {
                        createErrorCount++;
                        console.warn(`⚠️  Failed to create entity ${entityName}: ${createError.message}`);
                    }
                } else {
                    // Check if entity was modified and detect specific property changes
                    const oldEntity = oldEntities[entityName];
                    if (JSON.stringify(oldEntity) !== JSON.stringify(entityData)) {
                        try {
                            console.log(`🔄 Updating entity: ${entityName}`);
                            
                            // Detect specific property changes for targeted updates
                            const propertyChanges = this.detectPropertyChanges(oldEntity, entityData);
                            
                            if (Object.keys(propertyChanges).length > 0) {
                                // Apply changes to game state
                                await this.gameStateManager.updateEntity({
                                    name: entityName,
                                    ...entityData
                                });
                                
                                // Send targeted property update message to client with animation
                                this.websocketHandler.broadcastToClients({
                                    type: 'entity_property_update',
                                    data: {
                                        entityId: entityName,
                                        changes: propertyChanges,
                                        animate: true,
                                        duration: 500 // milliseconds
                                    }
                                });
                                
                                console.log(`📝 Property changes for ${entityName}:`, Object.keys(propertyChanges));
                            }
                            
                            updateSuccessCount++;
                        } catch (updateError) {
                            updateErrorCount++;
                            console.warn(`⚠️  Failed to update entity ${entityName}: ${updateError.message}`);
                        }
                    }
                }
            }
            
            // Apply camera changes
            try {
                if (JSON.stringify(oldState.scene_settings?.camera) !== JSON.stringify(newState.scene_settings?.camera)) {
                    const camera = newState.scene_settings.camera;
                    console.log('📷 Updating camera position');
                    this.websocketHandler.broadcastToClients({
                        type: 'camera_update',
                        data: {
                            position: camera.position,
                            target: camera.target
                        }
                    });
                }
            } catch (cameraError) {
                console.warn(`⚠️  Failed to update camera: ${cameraError.message}`);
            }
            
            // Broadcast the updated game state after all changes
            if (deleteSuccessCount > 0 || createSuccessCount > 0 || updateSuccessCount > 0) {
                this.websocketHandler.broadcastGameState();
            }
            
            console.log(`✅ Changes applied: ${deleteSuccessCount} deleted, ${createSuccessCount} created, ${updateSuccessCount} updated`);
            if (deleteErrorCount > 0 || createErrorCount > 0 || updateErrorCount > 0) {
                console.log(`⚠️  Errors: ${deleteErrorCount} delete, ${createErrorCount} create, ${updateErrorCount} update`);
            }
            
        } catch (error) {
            console.error(`❌ Critical error applying changes: ${error.message}`);
            throw error; // Re-throw to trigger retry logic
        }
    }
    
    async createEntity(entityData) {
        try {
            // Validate entity data before creation
            if (!entityData.name || !entityData.template || !Array.isArray(entityData.position)) {
                throw new Error('Invalid entity data structure');
            }
            
            if (entityData.position.length !== 3) {
                throw new Error('Position array must have exactly 3 elements');
            }
            
            await this.gameStateManager.createEntity({
                name: entityData.name,
                template: entityData.template,
                position: entityData.position,
                rotation: entityData.rotation || [0, 0, 0],
                scale: entityData.scale || [1, 1, 1],
                properties: entityData.properties || {},
                owner: entityData.owner || 'system'
            });
            
        } catch (error) {
            console.error(`❌ Error creating entity ${entityData.name}:`, error.message);
            throw error; // Re-throw to be caught by caller
        }
    }
    
    async updateEntity(entityData) {
        try {
            // Validate entity data before update
            if (!entityData.name || !entityData.template || !Array.isArray(entityData.position)) {
                throw new Error('Invalid entity data structure');
            }
            
            // For now, delete and recreate the entity (safer approach)
            // Later we can optimize this to update individual properties
            try {
                await this.gameStateManager.deleteEntity({ name: entityData.name });
            } catch (deleteError) {
                console.warn(`⚠️  Could not delete entity ${entityData.name} for update: ${deleteError.message}`);
                // Continue with creation anyway - entity might not exist
            }
            
            await this.createEntity(entityData);
            
        } catch (error) {
            console.error(`❌ Error updating entity ${entityData.name}:`, error.message);
            throw error; // Re-throw to be caught by caller
        }
    }
    
    async createDefaultSceneFile() {
        const defaultScene = {
            "version": "1.0.0",
            "last_modified": new Date().toISOString(),
            "scene_settings": {
                "name": "Basic VTTL Scene",
                "camera": {
                    "position": [0, 10, 10],
                    "target": [0, 0, 0]
                }
            },
            "entities": {
                "table_main": {
                    "name": "table_main",
                    "template": "cube",
                    "position": [0, 0.25, 0],
                    "rotation": [0, 0, 0],
                    "scale": [8, 0.5, 6],
                    "properties": {
                        "color": [0.6, 0.4, 0.2]
                    }
                }
            }
        };
        
        fs.writeFileSync(this.sceneFilePath, JSON.stringify(defaultScene, null, 2));
        console.log('📝 Created default scene_state.json file');
    }
    
    detectPropertyChanges(oldEntity, newEntity) {
        const changes = {};
        
        // Generic approach: check ALL properties in the entity
        const allKeys = new Set([...Object.keys(oldEntity), ...Object.keys(newEntity)]);
        
        for (const key of allKeys) {
            // Skip the 'name' field as it's the entity identifier
            if (key === 'name') continue;
            
            const oldValue = oldEntity[key];
            const newValue = newEntity[key];
            
            // Compare values using JSON stringify for deep comparison
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes[key] = newValue;
                console.log(`📝 Property '${key}' changed:`, oldValue, '→', newValue);
            }
        }
        
        return changes;
    }
    
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🛑 SceneFileWatcher stopped');
        }
    }
}

module.exports = SceneFileWatcher;