#!/bin/bash

# VTTL v2.0 Server Status Script
# Shows current server status and information

PID_FILE="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/.server_pid"
LOG_FILE="/mnt/d/DEV/editor-mcp-server/standalone-mvp/v2/server.log"

echo "📊 VTTL v2.0 Server Status"
echo "=========================="

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "PID File: Found ($PID)"
    
    # Check if process is running
    if ps -p $PID > /dev/null 2>&1; then
        echo "Process: ✅ Running (PID: $PID)"
        
        # Get process info
        PS_INFO=$(ps -p $PID -o pid,ppid,etime,cmd --no-headers)
        echo "Details: $PS_INFO"
    else
        echo "Process: ❌ Not running (stale PID file)"
    fi
else
    echo "PID File: ❌ Not found"
fi

echo ""

# Check ports
echo "Port Status:"
HTTP_PID=$(lsof -ti:3002 2>/dev/null)
WS_PID=$(lsof -ti:8082 2>/dev/null)

if [ ! -z "$HTTP_PID" ]; then
    echo "  HTTP (3002): ✅ In use (PID: $HTTP_PID)"
else
    echo "  HTTP (3002): ❌ Free"
fi

if [ ! -z "$WS_PID" ]; then
    echo "  WebSocket (8082): ✅ In use (PID: $WS_PID)"
else
    echo "  WebSocket (8082): ❌ Free"
fi

echo ""

# Test HTTP endpoint
echo "HTTP API Test:"
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "  Health Check: ✅ Responding"
    
    # Get server info
    HEALTH_DATA=$(curl -s http://localhost:3002/api/health)
    echo "  Response: $HEALTH_DATA"
else
    echo "  Health Check: ❌ Not responding"
fi

echo ""

# Show recent log entries
if [ -f "$LOG_FILE" ]; then
    echo "Recent Log Entries (last 10 lines):"
    echo "------------------------------------"
    tail -10 "$LOG_FILE"
else
    echo "Log File: ❌ Not found ($LOG_FILE)"
fi

echo ""
echo "🔧 Management Commands:"
echo "  ./start_server.sh  - Start server"
echo "  ./stop_server.sh   - Stop server"
echo "  ./status_server.sh - Show this status"