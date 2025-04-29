#!/bin/bash

# Simple script to run tests without authentication
# This will run the tests in the project without requiring login

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🧪 GearVault - Running Tests${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env file exists for testing
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ No .env file found. Creating one with testing defaults...${NC}"
    echo "DATABASE_URL=postgres://postgres:postgres@localhost:5432/gearvault_test" > .env
    echo "SESSION_SECRET=test-secret" >> .env
    echo -e "${GREEN}✅ Created .env file for testing.${NC}"
fi

# Run the tests with Vitest
echo -e "${GREEN}Running tests with Vitest...${NC}"
npm test

echo -e "${BLUE}============================================${NC}"