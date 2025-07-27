#!/bin/bash

# VTTL Standalone MVP - Complete Startup Script
# This script starts all required components and opens the browser

set -e  # Exit on any error

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
HTTP_PORT=3000
WS_PORT=8080

echo "🎮 Starting VTTL Standalone MVP..."
echo "============================================"

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

# Function to open browser (cross-platform)
open_browser() {
    local url=$1
    echo "🌐 Opening browser to $url..."
    
    if command -v google-chrome >/dev/null 2>&1; then
        google-chrome "$url" &
    elif command -v chromium-browser >/dev/null 2>&1; then
        chromium-browser "$url" &
    elif command -v firefox >/dev/null 2>&1; then
        firefox "$url" &
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start "$url"
    else
        echo "⚠️  Could not detect browser. Please open: $url"
    fi
}

# Change to project directory
cd "$PROJECT_DIR"

echo "📁 Working directory: $(pwd)"

# Lock file for preventing multiple instances
LOCK_FILE=".vttl_all.lock"
SCRIPT_NAME="VTTL All Services"

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
    local http_processes=$(lsof -ti :$HTTP_PORT 2>/dev/null | wc -l)
    
    if [ $ws_processes -gt 0 ] || [ $http_processes -gt 0 ]; then
        echo "⚠️  Ports are in use:"
        [ $ws_processes -gt 0 ] && echo "   • Port $WS_PORT: $ws_processes process(es)"
        [ $http_processes -gt 0 ] && echo "   • Port $HTTP_PORT: $http_processes process(es)"
        echo ""
        
        read -p "Kill processes using these ports? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔥 Killing processes on ports..."
            [ $ws_processes -gt 0 ] && lsof -ti :$WS_PORT | xargs kill -9 2>/dev/null || true
            [ $http_processes -gt 0 ] && lsof -ti :$HTTP_PORT | xargs kill -9 2>/dev/null || true
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

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server
    npm install
    cd ..
else
    echo "✅ Server dependencies already installed"
fi

# Check if Python dependencies are installed
if [ ! -f "python/venv/bin/activate" ] && [ ! -f "python/venv/Scripts/activate" ]; then
    echo "🐍 Setting up Python virtual environment..."
    cd python
    python3 -m venv venv
    
    # Activate virtual environment (cross-platform)
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    fi
    
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Python virtual environment already set up"
fi

# Kill any existing processes on our ports
echo "🔥 Stopping any existing services..."
check_port $HTTP_PORT
check_port $WS_PORT

# Also kill by process name to be thorough
echo "🧹 Killing any remaining Node.js servers..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

echo "🧹 Killing any remaining HTTP servers..."
pkill -f "python.*http.server" 2>/dev/null || true
pkill -f "python.*-m.*http.server" 2>/dev/null || true

# Kill any tsx processes (if using tsx)
pkill -f "tsx.*server.ts" 2>/dev/null || true

echo "⏳ Waiting for processes to fully terminate..."
sleep 3

echo ""
echo "🚀 Starting services..."
echo "============================================"

# Start WebSocket server
echo "1️⃣  Starting WebSocket server..."
cd server
nohup npm start > ../server.log 2>&1 &
WS_PID=$!
cd ..

# Wait for WebSocket server to be ready
if wait_for_port $WS_PORT "WebSocket server"; then
    echo "   WebSocket server PID: $WS_PID"
else
    echo "❌ Failed to start WebSocket server"
    exit 1
fi

# Start HTTP server for client files
echo ""
echo "2️⃣  Starting HTTP server for client files..."
nohup python3 -m http.server $HTTP_PORT > http_server.log 2>&1 &
HTTP_PID=$!

# Wait for HTTP server to be ready
if wait_for_port $HTTP_PORT "HTTP server"; then
    echo "   HTTP server PID: $HTTP_PID"
else
    echo "❌ Failed to start HTTP server"
    kill $WS_PID 2>/dev/null || true
    exit 1
fi

# Give services a moment to fully initialize
sleep 2

echo ""
echo "🌐 Opening browser..."
echo "============================================"

# Open browser to the client page
CLIENT_URL="http://localhost:$HTTP_PORT/client/"
open_browser "$CLIENT_URL"

# Wait a moment for browser to load
sleep 3

echo ""
echo "✅ All services started successfully!"
echo "============================================"
echo "📊 Service Status:"
echo "   • WebSocket Server: http://localhost:$WS_PORT (PID: $WS_PID)"
echo "   • HTTP Server: http://localhost:$HTTP_PORT (PID: $HTTP_PID)"
echo "   • Client URL: $CLIENT_URL"
echo ""
echo "📝 Log files:"
echo "   • WebSocket server: $(pwd)/server.log"
echo "   • HTTP server: $(pwd)/http_server.log"
echo ""
echo "🔧 To test the system:"
echo "   cd python && python examples/basic_test.py"
echo ""
echo "🛑 To stop all services:"
echo "   kill $WS_PID $HTTP_PID"
echo "   # Or use: pkill -f 'node server.js' && pkill -f 'http.server'"
echo ""
echo "🎮 Ready for VTTL development!"

# Store PIDs for cleanup script
echo "$WS_PID" > .ws_pid
echo "$HTTP_PID" > .http_pid

# Function to cleanup and stop all services
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill specific PIDs if they exist
    if [ ! -z "$WS_PID" ]; then
        echo "   Stopping WebSocket server (PID: $WS_PID)..."
        kill $WS_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$HTTP_PID" ]; then
        echo "   Stopping HTTP server (PID: $HTTP_PID)..."
        kill $HTTP_PID 2>/dev/null || true
    fi
    
    # Kill by process name as backup
    echo "   Cleaning up remaining processes..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "python.*http.server" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    # Kill any processes using our ports
    for port in $WS_PORT $HTTP_PORT; do
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
    rm -f .ws_pid .http_pid
    remove_lock_file
    
    echo "✅ All services stopped successfully!"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT TERM

# Keep script running to show logs
echo ""
echo "📈 Live logs (Ctrl+C to stop all services):"
echo "============================================"

# Monitor logs and check if processes are still alive
tail -f server.log http_server.log &
TAIL_PID=$!

# Keep script running and check if processes are still alive
while true; do
    # Check if our main processes are still running
    if ! kill -0 $WS_PID 2>/dev/null; then
        echo "❌ WebSocket server stopped unexpectedly!"
        kill $TAIL_PID 2>/dev/null || true
        cleanup
    fi
    
    if ! kill -0 $HTTP_PID 2>/dev/null; then
        echo "❌ HTTP server stopped unexpectedly!"
        kill $TAIL_PID 2>/dev/null || true
        cleanup
    fi
    
    sleep 2
done