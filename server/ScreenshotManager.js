/**
 * ScreenshotManager - Handles screenshot capture and storage
 */

const fs = require('fs');
const path = require('path');

class ScreenshotManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.screenshotDir = path.join(__dirname, '../screenshots');
        this.ensureScreenshotDirectory();
    }

    ensureScreenshotDirectory() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
            console.log('📁 Created screenshots directory');
        }
    }

    handleScreenshot(data) {
        const { image, timestamp } = data;
        
        if (!image || !image.startsWith('data:image/png;base64,')) {
            throw new Error('Invalid screenshot data');
        }
        
        try {
            const screenshot = this.saveScreenshot(image, timestamp);
            
            // Update game state with screenshot info
            this.gameStateManager.updateScreenshotInfo(screenshot);
            
            console.log(`📸 Screenshot saved: ${screenshot.filename}`);
            return screenshot;
            
        } catch (error) {
            console.error('Failed to save screenshot:', error);
            throw error;
        }
    }

    saveScreenshot(image, timestamp) {
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        const filename = 'latest_screenshot.png'; // Fixed filename - always override
        const filepath = path.join(this.screenshotDir, filename);
        
        // Backup previous screenshot if it exists
        const backupFilename = 'previous_screenshot.png';
        const backupFilepath = path.join(this.screenshotDir, backupFilename);
        
        if (fs.existsSync(filepath)) {
            try {
                fs.copyFileSync(filepath, backupFilepath);
            } catch (error) {
                console.warn('Could not backup previous screenshot:', error.message);
            }
        }
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        
        return {
            filename,
            filepath,
            timestamp,
            image,
            size: Math.round(image.length / 1024) + ' KB'
        };
    }

    getLatestScreenshot() {
        try {
            const filename = 'latest_screenshot.png';
            const filepath = path.join(this.screenshotDir, filename);
            
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                return {
                    name: filename,
                    path: filepath,
                    mtime: stats.mtime,
                    size: stats.size
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting latest screenshot:', error);
            return null;
        }
    }

    getAllScreenshots() {
        try {
            const files = [];
            const screenshotFiles = ['latest_screenshot.png', 'previous_screenshot.png'];
            
            screenshotFiles.forEach(filename => {
                const filepath = path.join(this.screenshotDir, filename);
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    files.push({
                        name: filename,
                        path: filepath,
                        mtime: stats.mtime,
                        size: stats.size
                    });
                }
            });
            
            // Sort by modification time (newest first)
            return files.sort((a, b) => b.mtime - a.mtime);
        } catch (error) {
            console.error('Error getting screenshots:', error);
            return [];
        }
    }

    deleteScreenshot(filename) {
        try {
            const filepath = path.join(this.screenshotDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`🗑️ Deleted screenshot: ${filename}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting screenshot:', error);
            return false;
        }
    }

    cleanupOldScreenshots(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        try {
            // Clean up any old timestamped screenshots that might still exist
            const now = Date.now();
            const files = fs.readdirSync(this.screenshotDir)
                .filter(file => file.startsWith('screenshot_') && file.endsWith('.png') && file !== 'latest_screenshot.png' && file !== 'previous_screenshot.png');

            let deletedCount = 0;
            files.forEach(file => {
                const filepath = path.join(this.screenshotDir, file);
                const stats = fs.statSync(filepath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filepath);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} old timestamped screenshots`);
            }
            
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up screenshots:', error);
            return 0;
        }
    }

    getScreenshotStats() {
        try {
            const files = this.getAllScreenshots();
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            return {
                count: files.length,
                totalSize: totalSize,
                totalSizeFormatted: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
                latest: files.length > 0 ? files[0] : null,
                directory: this.screenshotDir
            };
        } catch (error) {
            console.error('Error getting screenshot stats:', error);
            return null;
        }
    }
}

module.exports = ScreenshotManager;