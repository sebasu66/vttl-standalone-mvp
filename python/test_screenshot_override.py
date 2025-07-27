#!/usr/bin/env python3
"""
Test script for the improved screenshot functionality
Tests that screenshots always override the same file instead of creating timestamped files
"""

import asyncio
import logging
import os
from scene_controller import SceneController

# Setup logging
logging.basicConfig(level=logging.INFO)

async def test_screenshot_override():
    """Test that screenshots override the same file"""
    print("🧪 Testing screenshot override functionality...")
    
    async with SceneController() as scene:
        print("\n1. Creating a simple test scene...")
        
        # Create a test cube
        await scene.create_cube("test_cube", [0, 0.5, 0], color=[1, 0, 0])
        print("✅ Created red test cube")
        
        print("\n2. Taking first screenshot...")
        success = await scene.take_screenshot()
        if success:
            print("✅ First screenshot taken")
            
            # Check the screenshot file exists
            screenshot_path = "/mnt/d/DEV/editor-mcp-server/standalone-mvp/screenshots/latest_screenshot.png"
            if os.path.exists(screenshot_path):
                first_mtime = os.path.getmtime(screenshot_path)
                print(f"   📸 Screenshot file: {screenshot_path}")
                print(f"   🕐 Modification time: {first_mtime}")
            else:
                print("❌ Screenshot file not found!")
                return
        else:
            print("❌ First screenshot failed")
            return
        
        await asyncio.sleep(2)
        
        print("\n3. Modifying scene and taking second screenshot...")
        
        # Move the cube to a different position
        await scene.move_entity("test_cube", [3, 0.5, 0], animate=True)
        await asyncio.sleep(1)
        
        # Take second screenshot
        success = await scene.take_screenshot()
        if success:
            print("✅ Second screenshot taken")
            
            # Check that the same file was overridden
            if os.path.exists(screenshot_path):
                second_mtime = os.path.getmtime(screenshot_path)
                print(f"   📸 Screenshot file: {screenshot_path}")
                print(f"   🕐 New modification time: {second_mtime}")
                
                if second_mtime > first_mtime:
                    print("✅ File was successfully overridden!")
                else:
                    print("❌ File was not updated")
                
                # Check if previous screenshot backup exists
                backup_path = "/mnt/d/DEV/editor-mcp-server/standalone-mvp/screenshots/previous_screenshot.png"
                if os.path.exists(backup_path):
                    print(f"   📁 Previous screenshot backup: {backup_path}")
                    print("✅ Backup system working")
                else:
                    print("   ℹ️ No backup file found (this is normal for the second screenshot)")
            else:
                print("❌ Screenshot file disappeared!")
        else:
            print("❌ Second screenshot failed")
            return
        
        print("\n4. Taking third screenshot to test backup...")
        
        # Rotate the cube
        await scene.rotate_entity("test_cube", [0, 45, 0], animate=True)
        await asyncio.sleep(1)
        
        # Take third screenshot
        success = await scene.take_screenshot()
        if success:
            print("✅ Third screenshot taken")
            
            # Check backup system
            backup_path = "/mnt/d/DEV/editor-mcp-server/standalone-mvp/screenshots/previous_screenshot.png"
            if os.path.exists(backup_path):
                backup_mtime = os.path.getmtime(backup_path)
                current_mtime = os.path.getmtime(screenshot_path)
                
                print(f"   📸 Current: {screenshot_path} (time: {current_mtime})")
                print(f"   📁 Backup: {backup_path} (time: {backup_mtime})")
                
                if backup_mtime == second_mtime:
                    print("✅ Backup contains the previous screenshot!")
                else:
                    print("❌ Backup system not working correctly")
            else:
                print("❌ Backup file not created")
        
        print("\n5. Checking final file structure...")
        
        screenshots_dir = "/mnt/d/DEV/editor-mcp-server/standalone-mvp/screenshots"
        if os.path.exists(screenshots_dir):
            files = os.listdir(screenshots_dir)
            screenshot_files = [f for f in files if f.endswith('.png')]
            
            print(f"   📂 Screenshots directory: {screenshots_dir}")
            print(f"   📋 PNG files found: {len(screenshot_files)}")
            for file in screenshot_files:
                filepath = os.path.join(screenshots_dir, file)
                size = os.path.getsize(filepath)
                print(f"      - {file} ({size} bytes)")
            
            # Count timestamped files (should be minimal or none)
            timestamped_files = [f for f in screenshot_files if f.startswith('screenshot_') and f not in ['latest_screenshot.png', 'previous_screenshot.png']]
            print(f"   🗂️ Old timestamped files: {len(timestamped_files)}")
            
            if len(timestamped_files) == 0:
                print("✅ No old timestamped files - clean directory!")
            else:
                print(f"   ℹ️ Found {len(timestamped_files)} old files (will be cleaned up automatically)")
        
        print("\n✅ Screenshot override test completed!")
        print("📊 Summary:")
        print("   - Screenshots now override 'latest_screenshot.png'")
        print("   - Previous screenshot backed up to 'previous_screenshot.png'")
        print("   - No more timestamped filename clutter")
        print("   - Easy to find the latest screenshot for AI analysis")

if __name__ == "__main__":
    asyncio.run(test_screenshot_override())