#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 OpenRole Static Site Test Suite${NC}\n"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}🌐 Installing Playwright browsers...${NC}"
    npx playwright install
fi

# Start the server in background
echo -e "${GREEN}🚀 Starting static server...${NC}"
npm run serve &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Run tests
echo -e "${GREEN}🏃 Running tests...${NC}\n"
npm test

# Capture test exit code
TEST_EXIT_CODE=$?

# Kill the server
echo -e "\n${YELLOW}🛑 Stopping server...${NC}"
kill $SERVER_PID 2>/dev/null

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    echo -e "Run 'npm run test:report' to see detailed HTML report\n"
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
    echo -e "Run 'npm run test:report' to see detailed HTML report"
    echo -e "Screenshots and videos are available in 'test-results/' directory\n"
fi

exit $TEST_EXIT_CODE