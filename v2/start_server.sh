#!/bin/bash

# VTTL v2.0 Server Start Script
# Starts the server in background and saves PID for stopping

SERVER_DIR="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/server"
PID_FILE="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/.server_pid"
LOG_FILE="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/server.log"

echo "🚀 Starting VTTL v2.0 Server..."

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "❌ Server is already running (PID: $PID)"
        echo "   Use ./stop_server.sh to stop it first"
        exit 1
    else
        # PID file exists but process is dead, remove it
        rm "$PID_FILE"
    fi
fi

# Navigate to server directory
cd "$SERVER_DIR" || {
    echo "❌ Server directory not found: $SERVER_DIR"
    exit 1
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start server in background
echo "🌐 Starting server in background..."
nohup npm start > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Save PID
echo $SERVER_PID > "$PID_FILE"

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo "   PID: $SERVER_PID"
    echo "   HTTP: http://localhost:3002"
    echo "   WebSocket: ws://localhost:8082"
    echo "   Client: http://localhost:3002/client/"
    echo "   Log: $LOG_FILE"
    echo ""
    echo "📱 Open http://localhost:3002/client/ to test the system"
else
    echo "❌ Server failed to start"
    echo "   Check log: $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi