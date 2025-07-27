#!/bin/bash

# VTTL Development Server with Auto-Reload
# This script starts all services with file watching and auto-reload

set -e

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
WS_PORT=8080
DEV_PORT=3001
RELOAD_PORT=3002

echo "🚀 Starting VTTL Development Environment"
echo "============================================"
echo "Features:"
echo "  • Auto-reload on file changes"
echo "  • Live server with file watching"
echo "  • Enhanced development tools"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        echo "   Killing existing process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    local service=$2
    echo "⏳ Waiting for $service on port $port..."
    
    for i in {1..30}; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "✅ $service is ready on port $port"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ $service failed to start on port $port"
    return 1
}

cd "$PROJECT_DIR"

echo "📁 Working directory: $(pwd)"

# Lock file for preventing multiple instances
LOCK_FILE=".vttl_dev.lock"
SCRIPT_NAME="VTTL Development"

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
    local reload_processes=$(lsof -ti :$RELOAD_PORT 2>/dev/null | wc -l)
    
    if [ $ws_processes -gt 0 ] || [ $dev_processes -gt 0 ] || [ $reload_processes -gt 0 ]; then
        echo "⚠️  Ports are in use:"
        [ $ws_processes -gt 0 ] && echo "   • Port $WS_PORT: $ws_processes process(es)"
        [ $dev_processes -gt 0 ] && echo "   • Port $DEV_PORT: $dev_processes process(es)"
        [ $reload_processes -gt 0 ] && echo "   • Port $RELOAD_PORT: $reload_processes process(es)"
        echo ""
        
        read -p "Kill processes using these ports? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔥 Killing processes on ports..."
            [ $ws_processes -gt 0 ] && lsof -ti :$WS_PORT | xargs kill -9 2>/dev/null || true
            [ $dev_processes -gt 0 ] && lsof -ti :$DEV_PORT | xargs kill -9 2>/dev/null || true
            [ $reload_processes -gt 0 ] && lsof -ti :$RELOAD_PORT | xargs kill -9 2>/dev/null || true
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

# Install dev dependencies if needed
if [ ! -d "server/node_modules/chokidar" ]; then
    echo "📦 Installing development dependencies..."
    cd server
    npm install
    cd ..
else
    echo "✅ Development dependencies already installed"
fi

# Kill any existing processes
echo "🔥 Stopping any existing services..."
check_port $WS_PORT
check_port $DEV_PORT
check_port $RELOAD_PORT

# Also kill by process name
echo "🧹 Killing any remaining processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*dev-server.js" 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true

echo "⏳ Waiting for processes to fully terminate..."
sleep 3

echo ""
echo "🚀 Starting development services..."
echo "============================================"

# Start WebSocket server with auto-restart
echo "1️⃣  Starting WebSocket server (with auto-restart)..."
cd server
nohup npx nodemon server.js > ../ws_server.log 2>&1 &
WS_PID=$!
cd ..

# Wait for WebSocket server
if wait_for_port $WS_PORT "WebSocket server"; then
    echo "   WebSocket server PID: $WS_PID (auto-restart enabled)"
else
    echo "❌ Failed to start WebSocket server"
    exit 1
fi

# Start development HTTP server with live reload
echo ""
echo "2️⃣  Starting development HTTP server (with live reload)..."
nohup node dev-server.js > dev_server.log 2>&1 &
DEV_PID=$!

# Wait for dev server
if wait_for_port $DEV_PORT "Development server"; then
    echo "   Development server PID: $DEV_PID"
else
    echo "❌ Failed to start development server"
    kill $WS_PID 2>/dev/null || true
    exit 1
fi

# Wait for live reload server
if wait_for_port $RELOAD_PORT "Live reload server"; then
    echo "   Live reload server ready"
else
    echo "❌ Failed to start live reload server"
    kill $WS_PID $DEV_PID 2>/dev/null || true
    exit 1
fi

# Give services a moment to fully initialize
sleep 2

echo ""
echo "🌐 Opening development environment..."
echo "============================================"

# Open browser to the development server
DEV_URL="http://localhost:$DEV_PORT/client/"

if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "$DEV_URL" &
elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser "$DEV_URL" &
elif command -v firefox >/dev/null 2>&1; then
    firefox "$DEV_URL" &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "$DEV_URL"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start "$DEV_URL"
else
    echo "⚠️  Could not detect browser. Please open: $DEV_URL"
fi

# Wait for browser to load
sleep 3

echo ""
echo "✅ Development environment started successfully!"
echo "============================================"
echo "📊 Service Status:"
echo "   • WebSocket Server: ws://localhost:$WS_PORT (PID: $WS_PID) 🔄 Auto-restart"
echo "   • Development Server: http://localhost:$DEV_PORT (PID: $DEV_PID) 🔄 Live reload"
echo "   • Live Reload: ws://localhost:$RELOAD_PORT ⚡ File watching"
echo "   • Client URL: $DEV_URL"
echo ""
echo "📝 Log files:"
echo "   • WebSocket server: $(pwd)/ws_server.log"
echo "   • Development server: $(pwd)/dev_server.log"
echo ""
echo "🔧 Development Features:"
echo "   • 📁 File watching: client/**/*.{js,html,css}, server/**/*.js"
echo "   • 🔄 Auto-reload: Browser refreshes automatically on file changes"
echo "   • 🚀 Hot restart: Server restarts automatically on server changes"
echo "   • 📱 Live connection: WebSocket connection with live reload"
echo ""
echo "🛑 To stop all services:"
echo "   kill $WS_PID $DEV_PID"
echo "   # Or use: pkill -f 'node.*server.js' && pkill -f 'node.*dev-server.js'"
echo ""
echo "🎮 Ready for VTTL development with auto-reload!"

# Store PIDs for cleanup script
echo "$WS_PID" > .ws_pid
echo "$DEV_PID" > .dev_pid

# Function to cleanup and stop all services
cleanup() {
    echo ""
    echo "🛑 Stopping all development services..."
    
    # Kill specific PIDs if they exist
    if [ ! -z "$WS_PID" ]; then
        echo "   Stopping WebSocket server (PID: $WS_PID)..."
        kill $WS_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$DEV_PID" ]; then
        echo "   Stopping development server (PID: $DEV_PID)..."
        kill $DEV_PID 2>/dev/null || true
    fi
    
    # Kill by process name as backup (including nodemon and its children)
    echo "   Cleaning up nodemon and development processes..."
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "node.*dev-server.js" 2>/dev/null || true
    
    # Kill any processes using our ports
    for port in $WS_PORT $DEV_PORT $RELOAD_PORT; do
        if lsof -ti:$port >/dev/null 2>&1; then
            echo "   Killing processes on port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Kill tail process if it exists
    if [ ! -z "$TAIL_PID" ]; then
        kill $TAIL_PID 2>/dev/null || true
    fi
    
    # Clean up PID files and lock file
    rm -f .ws_pid .dev_pid
    remove_lock_file
    
    echo "✅ All development services stopped successfully!"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT TERM

# Keep script running to show logs
echo ""
echo "📈 Live development logs (Ctrl+C to stop all services):"
echo "============================================"
echo "💡 Edit any file in client/ or server/ to see auto-reload in action!"
echo ""

# Show both log files with error handling
if [ -f "ws_server.log" ] && [ -f "dev_server.log" ]; then
    tail -f ws_server.log dev_server.log &
    TAIL_PID=$!
elif [ -f "ws_server.log" ]; then
    echo "⚠️  Dev server log not found, showing WebSocket log only"
    tail -f ws_server.log &
    TAIL_PID=$!
elif [ -f "dev_server.log" ]; then
    echo "⚠️  WebSocket log not found, showing dev server log only"
    tail -f dev_server.log &
    TAIL_PID=$!
else
    echo "⚠️  Log files not found yet, waiting..."
    echo "📊 Services should be running. Check manually:"
    echo "   ps aux | grep node"
    echo ""
    echo "🌐 You can open the browser manually: $DEV_URL"
    echo ""
    echo "Press Ctrl+C to stop the development servers"
    
    # Keep the script running and periodically check for log files
    while true; do
        sleep 5
        if [ -f "ws_server.log" ] || [ -f "dev_server.log" ]; then
            echo "📝 Log files detected, starting tail..."
            if [ -f "ws_server.log" ] && [ -f "dev_server.log" ]; then
                tail -f ws_server.log dev_server.log &
                TAIL_PID=$!
            elif [ -f "ws_server.log" ]; then
                tail -f ws_server.log &
                TAIL_PID=$!
            else
                tail -f dev_server.log &
                TAIL_PID=$!
            fi
            break
        fi
        echo "⏳ Still waiting for log files... (servers starting up)"
    done
fi

# Keep script running and check if processes are still alive
while true; do
    # Check if our main processes are still running
    if ! kill -0 $WS_PID 2>/dev/null; then
        echo "❌ WebSocket server stopped unexpectedly!"
        cleanup
    fi
    
    if ! kill -0 $DEV_PID 2>/dev/null; then
        echo "❌ Development server stopped unexpectedly!"
        cleanup
    fi
    
    sleep 2
done