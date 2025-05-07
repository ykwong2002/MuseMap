#!/bin/bash

# Start the Python AI service
echo "Starting AI service on port 5002..."
AI_SERVICE_PORT=5002 python3 ai_service.py &
AI_PID=$!

# Wait a bit for AI service to initialize
sleep 3

# Start the Express server
echo "Starting Express server..."
npm start &
EXPRESS_PID=$!

# Function to handle script termination
function cleanup {
  echo "Stopping services..."
  kill $AI_PID
  kill $EXPRESS_PID
  exit
}

# Register the cleanup function for these signals
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Services are running. Press Ctrl+C to stop."
wait 