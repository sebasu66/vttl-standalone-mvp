#!/bin/bash

# VTTL Standalone MVP - Stop All Services Script

echo "🛑 Stopping VTTL Standalone MVP services..."
echo "============================================"

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
cd "$PROJECT_DIR"

# Function to kill process by PID if it exists
kill_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔥 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Force killing $service_name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        else
            echo "ℹ️  $service_name was not running (PID: $pid)"
        fi
        rm -f "$pid_file"
    else
        echo "ℹ️  No PID file found for $service_name"
    fi
}

# Kill services by stored PIDs
kill_by_pid ".ws_pid" "WebSocket server"
kill_by_pid ".dev_pid" "Dev server"
kill_by_pid ".http_pid" "HTTP server"

# Also kill by process name as backup
echo ""
echo "🧹 Cleaning up any remaining processes..."

# Kill WebSocket server
if pgrep -f "node.*server.js" >/dev/null; then
    echo "🔥 Killing remaining Node.js server processes..."
    pkill -f "node.*server.js"
fi

# Kill nodemon processes
if pgrep -f "nodemon" >/dev/null; then
    echo "🔥 Killing nodemon processes..."
    pkill -f "nodemon"
fi

# Kill dev server
if pgrep -f "dev-server.cjs" >/dev/null; then
    echo "🔥 Killing dev server processes..."
    pkill -f "dev-server.cjs"
fi

# Kill HTTP server
if pgrep -f "http.server" >/dev/null; then
    echo "🔥 Killing remaining HTTP server processes..."
    pkill -f "http.server"
fi

# Kill any processes using our ports
for port in 8080 3000 3003; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "🔥 Killing processes on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

# Clean up log files
echo ""
echo "🧹 Cleaning up log files..."
rm -f server.log http_server.log

echo ""
echo "✅ All VTTL services stopped successfully!"
echo "   You can now restart with: ./start_all.sh"