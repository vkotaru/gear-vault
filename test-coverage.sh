#!/bin/bash

# Script to run test coverage for GearVault
# This will run tests with coverage reporting

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}📊 GearVault - Test Coverage${NC}"
echo -e "${BLUE}============================================${NC}"

# Run the tests with coverage
echo -e "${GREEN}Running tests with coverage...${NC}"
npm test -- --coverage

echo -e "${BLUE}============================================${NC}"