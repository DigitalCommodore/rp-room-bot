#!/bin/bash
echo ""
echo "  RP Room Builder - Starting up..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "  ERROR: Node.js is not installed!"
    echo "  Download it from https://nodejs.org/"
    echo ""
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies (first run only)..."
    npm install --production
    echo ""
fi

# Build frontend if needed
if [ ! -d "server/public" ]; then
    echo "  Building web UI (first run only)..."
    npm run build
    echo ""
fi

# Start the app
echo "  Starting RP Room Builder..."
echo "  Open http://localhost:3000 in your browser"
echo "  Press Ctrl+C to stop"
echo ""
node server/index.js
