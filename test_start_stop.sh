#!/bin/bash

# Test script for start_dev_simple.sh Ctrl+C handling
# This simulates starting the dev environment and stopping it with Ctrl+C

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
cd "$PROJECT_DIR"

echo "🧪 Testing start_dev_simple.sh Ctrl+C handling..."
echo "================================================="

# Clean up any existing processes first
echo "🧹 Initial cleanup..."
./stop_all.sh >/dev/null 2>&1

echo ""
echo "1️⃣ Starting development environment..."

# Start the dev environment in background
./start_dev_simple.sh &
START_PID=$!

echo "   Started with PID: $START_PID"

# Wait for services to fully start
echo "   Waiting for services to start..."
sleep 10

# Check if services are running
WS_RUNNING=$(pgrep -f "node.*server.js" | wc -l)
DEV_RUNNING=$(pgrep -f "dev-server.cjs" | wc -l)
NODEMON_RUNNING=$(pgrep -f "nodemon" | wc -l)

echo ""
echo "📊 Service status after startup:"
echo "   • WebSocket processes: $WS_RUNNING"
echo "   • Dev server processes: $DEV_RUNNING"
echo "   • Nodemon processes: $NODEMON_RUNNING"

if [ $WS_RUNNING -eq 0 ] || [ $DEV_RUNNING -eq 0 ]; then
    echo "❌ Services failed to start properly!"
    exit 1
fi

echo "✅ Services started successfully!"

# Wait a bit more
sleep 3

echo ""
echo "2️⃣ Sending Ctrl+C (SIGINT) to test cleanup..."

# Send SIGINT to simulate Ctrl+C
kill -INT $START_PID

# Wait for cleanup to complete
echo "   Waiting for cleanup to complete..."
sleep 5

# Check if services stopped
WS_AFTER=$(pgrep -f "node.*server.js" | wc -l)
DEV_AFTER=$(pgrep -f "dev-server.cjs" | wc -l)
NODEMON_AFTER=$(pgrep -f "nodemon" | wc -l)

echo ""
echo "📊 Service status after Ctrl+C:"
echo "   • WebSocket processes: $WS_AFTER"
echo "   • Dev server processes: $DEV_AFTER"
echo "   • Nodemon processes: $NODEMON_AFTER"

# Check if PID files were cleaned up
PID_FILES_EXIST=0
if [ -f ".ws_pid" ] || [ -f ".dev_pid" ]; then
    PID_FILES_EXIST=1
fi

echo "   • PID files cleaned up: $([ $PID_FILES_EXIST -eq 0 ] && echo "✅ Yes" || echo "❌ No")"

# Final cleanup to be sure
./stop_all.sh >/dev/null 2>&1

echo ""
echo "📋 Test Results:"
if [ $WS_AFTER -eq 0 ] && [ $DEV_AFTER -eq 0 ] && [ $NODEMON_AFTER -eq 0 ] && [ $PID_FILES_EXIST -eq 0 ]; then
    echo "✅ SUCCESS: All services stopped correctly with Ctrl+C!"
    echo "   • All processes terminated"
    echo "   • PID files cleaned up"
    echo "   • Ctrl+C handling works properly"
else
    echo "❌ FAILURE: Some issues detected:"
    [ $WS_AFTER -gt 0 ] && echo "   • WebSocket processes still running: $WS_AFTER"
    [ $DEV_AFTER -gt 0 ] && echo "   • Dev server processes still running: $DEV_AFTER"
    [ $NODEMON_AFTER -gt 0 ] && echo "   • Nodemon processes still running: $NODEMON_AFTER"
    [ $PID_FILES_EXIST -eq 1 ] && echo "   • PID files not cleaned up"
fi

echo ""
echo "🧪 Test completed!"