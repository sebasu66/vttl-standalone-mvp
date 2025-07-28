#!/bin/bash

# VTTL v2.0 Server Stop Script
# Stops the background server process

PID_FILE="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/.server_pid"

echo "🛑 Stopping VTTL v2.0 Server..."

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "❌ No server PID file found"
    echo "   Server may not be running or was started manually"
    
    # Try to kill any node processes on our ports
    echo "🔍 Checking for processes on ports 3002 and 8082..."
    
    # Kill process on port 3002 (HTTP)
    HTTP_PID=$(lsof -ti:3002 2>/dev/null)
    if [ ! -z "$HTTP_PID" ]; then
        echo "   Killing HTTP server (PID: $HTTP_PID)"
        kill -9 $HTTP_PID 2>/dev/null
    fi
    
    # Kill process on port 8082 (WebSocket)
    WS_PID=$(lsof -ti:8082 2>/dev/null)
    if [ ! -z "$WS_PID" ]; then
        echo "   Killing WebSocket server (PID: $WS_PID)"
        kill -9 $WS_PID 2>/dev/null
    fi
    
    if [ -z "$HTTP_PID" ] && [ -z "$WS_PID" ]; then
        echo "   No processes found on server ports"
    fi
    
    exit 0
fi

# Read PID from file
PID=$(cat "$PID_FILE")

# Check if process is running
if ps -p $PID > /dev/null 2>&1; then
    echo "   Stopping server (PID: $PID)..."
    
    # Try graceful shutdown first
    kill -TERM $PID 2>/dev/null
    
    # Wait for graceful shutdown
    sleep 3
    
    # Check if still running, force kill if needed
    if ps -p $PID > /dev/null 2>&1; then
        echo "   Force killing server..."
        kill -9 $PID 2>/dev/null
    fi
    
    echo "✅ Server stopped successfully"
else
    echo "⚠️  Server process not running (PID: $PID)"
fi

# Remove PID file
rm -f "$PID_FILE"

# Double check ports are free
HTTP_PID=$(lsof -ti:3002 2>/dev/null)
WS_PID=$(lsof -ti:8082 2>/dev/null)

if [ ! -z "$HTTP_PID" ] || [ ! -z "$WS_PID" ]; then
    echo "⚠️  Some processes still using server ports, cleaning up..."
    [ ! -z "$HTTP_PID" ] && kill -9 $HTTP_PID 2>/dev/null
    [ ! -z "$WS_PID" ] && kill -9 $WS_PID 2>/dev/null
fi

echo "🧹 Server cleanup complete"