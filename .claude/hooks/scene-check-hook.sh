#!/bin/bash
# Scene Check Hook - Automatically verify 3D scene changes via screenshot

# Check if this was a scene modification command
if echo "$1" | grep -q -E "(execute_javascript|create_light|create_camera|create_model|move_entity|spotlight|lighting)"; then
    echo "🎬 Scene modification detected - checking result in 1 second..."
    
    # Wait for scene to update and screenshot to be generated
    sleep 1
    
    # Get the latest screenshot
    LATEST_SCREENSHOT=$(ls -t /mnt/d/dev/editor-mcp-server/standalone-mvp/screenshots/screenshot_*.png 2>/dev/null | head -1)
    
    if [ -n "$LATEST_SCREENSHOT" ]; then
        echo "📸 Latest screenshot: $(basename "$LATEST_SCREENSHOT")"
        echo "🔍 Please verify the scene looks correct. If not, the command should be repeated with adjustments."
        
        # Extract timestamp to check if screenshot is recent (within last 10 seconds)
        SCREENSHOT_TIME=$(stat -c %Y "$LATEST_SCREENSHOT" 2>/dev/null)
        CURRENT_TIME=$(date +%s)
        TIME_DIFF=$((CURRENT_TIME - SCREENSHOT_TIME))
        
        if [ $TIME_DIFF -lt 10 ]; then
            echo "✅ Screenshot is recent (${TIME_DIFF}s old)"
        else
            echo "⚠️  Screenshot may be stale (${TIME_DIFF}s old) - scene may not have updated"
        fi
    else
        echo "❌ No screenshots found - scene verification failed"
    fi
fi