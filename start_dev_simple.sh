#!/bin/bash

# VTTL Development Server - Simple Version
set -e

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
WS_PORT=8080
DEV_PORT=3003

echo "🚀 Starting VTTL Development Environment (Simple)"
echo "================================================="

cd "$PROJECT_DIR"

# Lock file for preventing multiple instances
LOCK_FILE=".vttl_dev_simple.lock"
SCRIPT_NAME="VTTL Dev Simple"

# Function to check if another instance is running
check_existing_instance() {
    # Check for lock file
    if [ -f "$LOCK_FILE" ]; then
        local existing_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        
        # Check if the PID in lock file is still running
        if [ ! -z "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            echo "❌ Another instance of $SCRIPT_NAME is already running (PID: $existing_pid)"
            echo "   Lock file: $(pwd)/$LOCK_FILE"
            echo ""
            echo "🔧 Options:"
            echo "   1. Wait for the other instance to finish"
            echo "   2. Stop the other instance: kill $existing_pid"
            echo "   3. Force remove lock file: rm $LOCK_FILE"
            echo "   4. Use stop_all.sh to clean up: ./stop_all.sh"
            echo ""
            read -p "Do you want to stop the existing instance? (y/N): " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "🛑 Stopping existing instance (PID: $existing_pid)..."
                kill $existing_pid 2>/dev/null || true
                sleep 3
                
                # Force kill if still running
                if kill -0 "$existing_pid" 2>/dev/null; then
                    echo "   Force killing..."
                    kill -9 $existing_pid 2>/dev/null || true
                    sleep 1
                fi
                
                rm -f "$LOCK_FILE"
                echo "✅ Existing instance stopped"
            else
                echo "🚫 Aborting to avoid conflicts"
                exit 1
            fi
        else
            # Stale lock file, remove it
            echo "🧹 Removing stale lock file..."
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Check for processes using our ports
    local ws_processes=$(lsof -ti :$WS_PORT 2>/dev/null | wc -l)
    local dev_processes=$(lsof -ti :$DEV_PORT 2>/dev/null | wc -l)
    
    if [ $ws_processes -gt 0 ] || [ $dev_processes -gt 0 ]; then
        echo "⚠️  Ports are in use:"
        [ $ws_processes -gt 0 ] && echo "   • Port $WS_PORT: $ws_processes process(es)"
        [ $dev_processes -gt 0 ] && echo "   • Port $DEV_PORT: $dev_processes process(es)"
        echo ""
        
        read -p "Kill processes using these ports? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔥 Killing processes on ports..."
            [ $ws_processes -gt 0 ] && lsof -ti :$WS_PORT | xargs kill -9 2>/dev/null || true
            [ $dev_processes -gt 0 ] && lsof -ti :$DEV_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
            echo "✅ Ports cleared"
        else
            echo "🚫 Cannot start with ports in use"
            exit 1
        fi
    fi
}

# Function to create lock file
create_lock_file() {
    echo $$ > "$LOCK_FILE"
    echo "🔒 Created lock file: $LOCK_FILE (PID: $$)"
}

# Function to remove lock file
remove_lock_file() {
    rm -f "$LOCK_FILE"
    echo "🔓 Removed lock file"
}

# Check for existing instances
echo "🔍 Checking for existing instances..."
check_existing_instance

# Create lock file for this instance
create_lock_file

# Clean up any remaining processes (after user confirmation)
echo "🧹 Performing final cleanup..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*dev-server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
sleep 2

# Install dependencies
if [ ! -f "server/node_modules/.bin/nodemon" ]; then
    echo "📦 Installing dependencies..."
    cd server && npm install && cd ..
fi

echo "🚀 Starting servers..."

# Start WebSocket server with nodemon
echo "1️⃣ Starting WebSocket server..."
cd server
npx nodemon server.js &
WS_PID=$!
cd ..

# Give WebSocket server time to start
sleep 3

# Start dev server
echo "2️⃣ Starting development server..."
node dev-server.cjs &
DEV_PID=$!

# Give dev server time to start
sleep 3

echo ""
echo "✅ Servers started!"
echo "📊 Status:"
echo "   • WebSocket: ws://localhost:$WS_PORT (PID: $WS_PID)"
echo "   • Dev Server: http://localhost:$DEV_PORT (PID: $DEV_PID)"
echo ""
echo "🌐 Opening browser..."

# Open browser
if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "http://localhost:$DEV_PORT/client/" >/dev/null 2>&1 &
else
    echo "Please open: http://localhost:$DEV_PORT/client/"
fi

echo ""
echo "✅ Development environment ready!"
echo "💡 Edit files in client/ or server/ to see auto-reload"
echo "🛑 Press Ctrl+C to stop"

# Store PIDs
echo "$WS_PID" > .ws_pid
echo "$DEV_PID" > .dev_pid

# Function to cleanup and stop all services
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill specific PIDs if they exist
    if [ ! -z "$WS_PID" ]; then
        echo "   Stopping WebSocket server (PID: $WS_PID)..."
        kill $WS_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$DEV_PID" ]; then
        echo "   Stopping dev server (PID: $DEV_PID)..."
        kill $DEV_PID 2>/dev/null || true
    fi
    
    # Kill by process name as backup (including nodemon and its children)
    echo "   Cleaning up nodemon processes..."
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "node.*dev-server.js" 2>/dev/null || true
    
    # Kill any processes using our ports
    for port in $WS_PORT $DEV_PORT; do
        if lsof -ti:$port >/dev/null 2>&1; then
            echo "   Killing processes on port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Clean up PID files and lock file
    rm -f .ws_pid .dev_pid
    remove_lock_file
    
    echo "✅ All services stopped successfully!"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT TERM

echo "💡 Development environment is running..."
echo "   • Edit files in client/ or server/ to see auto-reload"
echo "   • Check console logs for any issues"
echo "🛑 Press Ctrl+C to stop all services"

# Keep script running and check if processes are still alive
while true; do
    # Check if our main processes are still running
    if ! kill -0 $WS_PID 2>/dev/null; then
        echo "❌ WebSocket server stopped unexpectedly!"
        cleanup
    fi
    
    if ! kill -0 $DEV_PID 2>/dev/null; then
        echo "❌ Dev server stopped unexpectedly!"
        cleanup
    fi
    
    sleep 2
done