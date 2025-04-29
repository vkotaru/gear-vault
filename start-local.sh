#!/bin/bash

# Start-local script for GearVault local environment
# This script helps you start the app with the no-auth server

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🚀 GearVault - Local Development Environment${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ No .env file found. Creating one with defaults...${NC}"
    echo "DATABASE_URL=postgres://postgres:postgres@localhost:5432/gearvault" > .env
    echo "SESSION_SECRET=local-dev-secret" >> .env
    echo -e "${GREEN}✅ Created .env file. Update with your database credentials if needed.${NC}"
fi

# Check if Postgres is installed
if command -v pg_isready &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    
    # Get database info from .env
    DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
    
    echo -e "${YELLOW}Checking database connection...${NC}"
    # Try to connect to database
    if node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: '$DB_URL'
        });
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            } else {
                console.log('✅ Database connection successful');
                process.exit(0);
            }
        });
    "; then
        echo -e "${GREEN}✅ Database connection verified${NC}"
    else
        echo -e "${YELLOW}⚠️ Database connection failed. Starting anyway, but expect errors.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ PostgreSQL not found. You'll need it for database functionality.${NC}"
fi

echo -e "${GREEN}🚀 Starting GearVault with NO AUTHENTICATION REQUIRED...${NC}"
echo -e "${YELLOW}This mode bypasses the login system for easier local development.${NC}"

# Run the node script to start the server
node local-start.js

echo -e "${BLUE}============================================${NC}"