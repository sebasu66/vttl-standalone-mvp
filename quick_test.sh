#!/bin/bash

# VTTL Standalone MVP - Quick Test Script
# Tests all major functionality after startup

set -e

PROJECT_DIR="/mnt/d/dev/editor-mcp-server/standalone-mvp"
cd "$PROJECT_DIR"

echo "🧪 VTTL Quick Test Suite"
echo "============================================"

# Function to check if service is running
check_service() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ $service is running on port $port"
        return 0
    else
        echo "❌ $service is NOT running on port $port"
        return 1
    fi
}

# Check if services are running
echo "1️⃣  Checking services..."
check_service 8080 "WebSocket server" || exit 1
check_service 3000 "HTTP server" || exit 1

# Check if client page is accessible
echo ""
echo "2️⃣  Testing HTTP client access..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/client/" | grep -q "200"; then
    echo "✅ Client page is accessible"
else
    echo "❌ Client page is not accessible"
    exit 1
fi

# Activate Python virtual environment
echo ""
echo "3️⃣  Setting up Python environment..."
cd python

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Python virtual environment activated (Linux/Mac)"
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
    echo "✅ Python virtual environment activated (Windows)"
else
    echo "⚠️  No virtual environment found, using system Python"
fi

# Test basic connection
echo ""
echo "4️⃣  Testing WebSocket connection..."
timeout 10 python test_basic_connection.py || {
    echo "❌ Basic connection test failed"
    exit 1
}

# Test entity operations
echo ""
echo "5️⃣  Testing entity operations..."
timeout 15 python examples/basic_test.py || {
    echo "❌ Entity operations test failed"
    exit 1
}

# Test screenshot functionality
echo ""
echo "6️⃣  Testing screenshot functionality..."
if timeout 15 python test_screenshot_only.py; then
    echo "✅ Screenshot test passed"
    if [ -f "../screenshots"/*.png ]; then
        echo "   Screenshots saved in ../screenshots/"
    fi
else
    echo "⚠️  Screenshot test failed (non-critical)"
fi

cd ..

echo ""
echo "🎉 All critical tests passed!"
echo "============================================"
echo "📊 Test Summary:"
echo "   ✅ WebSocket server responding"
echo "   ✅ HTTP server serving client files"
echo "   ✅ Python WebSocket client working"
echo "   ✅ Entity creation/manipulation working"
echo "   ✅ Basic game functionality operational"
echo ""
echo "🎮 VTTL system is ready for development!"
echo ""
echo "🔧 Next steps:"
echo "   • Open http://localhost:3000/client/ in your browser"
echo "   • Run python examples/claude_game_master.py for AI demo"
echo "   • Check screenshots/ folder for captured images"