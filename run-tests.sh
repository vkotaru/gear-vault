#!/bin/bash

# Run different test commands based on arguments
case "$1" in
  "watch")
    echo "Running tests in watch mode..."
    npx vitest
    ;;
  "coverage")
    echo "Running tests with coverage..."
    npx vitest run --coverage
    ;;
  *)
    echo "Running all tests..."
    npx vitest run
    ;;
esac