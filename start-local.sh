#!/bin/bash

# This script helps with starting the application in a local environment
# It addresses React hooks issues and WebSocket connection problems

# Display header
echo "==== Gear Vault Local Development Starter ===="
echo "This script will help you run the application locally"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file from .env.local template..."
  cp .env.local .env
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Using Node.js version: $NODE_VERSION"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if command -v pg_isready &> /dev/null; then
  pg_isready
  if [ $? -ne 0 ]; then
    echo "⚠️  WARNING: PostgreSQL doesn't appear to be running"
    echo "Please start your PostgreSQL server"
  else
    echo "✓ PostgreSQL is running"
  fi
else
  echo "⚠️  pg_isready command not found, skipping PostgreSQL check"
fi

# Display environment settings
echo ""
echo "Using these environment settings:"
echo "- NODE_ENV=development"
echo "- WDS_SOCKET_HOST=localhost"
echo "- WDS_SOCKET_PORT=0"
echo ""

# Set environment variables to fix common issues
export NODE_ENV=development
export WDS_SOCKET_HOST=localhost
export WDS_SOCKET_PORT=0
export VITE_DISABLE_STRICT_MODE=true

# Start the application in development mode
echo "Starting the application..."
echo "If you encounter React hooks errors, try:"
echo "- npm install react@18.3.1 react-dom@18.3.1 --save-exact"
echo "- Check for multiple copies of React in node_modules"
echo ""

# Start with tsx (avoiding HMR if possible)
npx tsx server/index.ts