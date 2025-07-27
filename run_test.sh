#!/bin/bash

echo "🚀 VTTL MVP Test Suite"
echo "====================="
echo

# Function to cleanup processes
cleanup() {
    echo "🧹 Cleaning up..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "   Stopped server (PID: $SERVER_PID)"
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3 first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Install dependencies if needed
echo "📦 Installing dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js packages..."
    npm install > /dev/null 2>&1
fi

cd ../python
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv > /dev/null 2>&1
    source venv/bin/activate
    pip install websockets > /dev/null 2>&1
else
    source venv/bin/activate
fi

echo "✅ Dependencies ready"
echo

# Start server in background
echo "🔧 Starting VTTL server..."
cd ../server
node server.js &
SERVER_PID=$!

# Wait for server to start
echo "   Waiting for server to initialize..."
sleep 3

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server running (PID: $SERVER_PID)"
    echo "   WebSocket: ws://localhost:8080"
    echo "   HTTP: http://localhost:3001"
else
    echo "❌ Server failed to start"
    exit 1
fi

echo

# Test WebSocket connection
echo "🔌 Testing WebSocket connection..."
cd ../python
source venv/bin/activate
python test_connection.py

echo

# Ask user what to do next
echo "🎮 What would you like to do next?"
echo "1) Run basic AI test (recommended)"
echo "2) Open browser to view 3D scene"  
echo "3) Keep server running for manual testing"
echo "4) Quit"
echo

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo "🤖 Running AI test..."
        python examples/basic_test.py
        ;;
    2)
        echo "🌐 Server is running at http://localhost:3001"
        echo "   Open this URL in your browser to see the 3D scene"
        echo "   Press Ctrl+C when done"
        wait $SERVER_PID
        ;;
    3)
        echo "🖥️  Server is running. You can now:"
        echo "   • Open http://localhost:3001 in browser"
        echo "   • Run python examples/basic_test.py"
        echo "   • Test manual commands"
        echo "   Press Ctrl+C to stop"
        wait $SERVER_PID
        ;;
    4)
        echo "👋 Goodbye!"
        cleanup
        ;;
    *)
        echo "Invalid option. Keeping server running..."
        echo "Press Ctrl+C to stop"
        wait $SERVER_PID
        ;;
esac

cleanup