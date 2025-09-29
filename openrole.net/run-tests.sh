#!/bin/bash

echo "🧪 Running OpenRole.net Playwright Tests"
echo "======================================="

# Check if WordPress is running
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
    echo "❌ WordPress is not running. Starting environment..."
    ./setup-local-dev.sh
    echo "⏳ Waiting for WordPress to be ready..."
    sleep 30
fi

# Navigate to tests directory
cd tests

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    npx playwright install
fi

# Run tests based on argument
if [ "$1" == "ui" ]; then
    echo "🎭 Running tests in UI mode..."
    npm run test:ui
elif [ "$1" == "debug" ]; then
    echo "🐛 Running tests in debug mode..."
    npm run test:debug
elif [ "$1" == "headed" ]; then
    echo "👀 Running tests in headed mode..."
    npm run test:headed
elif [ "$1" == "report" ]; then
    echo "📊 Opening test report..."
    npm run report
else
    echo "🚀 Running all tests..."
    npm test
    
    # Show report if tests completed
    if [ $? -eq 0 ] || [ $? -eq 1 ]; then
        echo ""
        echo "📊 View detailed report with: ./run-tests.sh report"
    fi
fi