#!/bin/bash

# Blockchain Web Server Startup Script
# Starts the Flask web server for the blockchain visualizer

echo ""
echo "================================================================================="
echo "   BLOCKCHAIN WEB SERVER STARTUP"
echo "================================================================================="
echo ""

# Change to project directory
cd /home/thearchitect/Uni/CryptoProject

# Check if dependencies are installed
echo "Checking dependencies..."
/usr/bin/python -m pip install -q -r requirements.txt 2>/dev/null
echo "✓ Dependencies ready"
echo ""

# Start the server
echo "Starting Flask web server..."
echo ""
echo "✓ Server will be available at: http://localhost:5000"
echo "✓ Press Ctrl+C to stop the server"
echo ""
echo "================================================================================="
echo ""

# Run the Flask app
/usr/bin/python app.py
