#!/bin/bash

echo "🛑 Stopping OpenRole.net Development Environment"
echo "=========================================="

# Stop and remove containers
docker-compose down

echo "✅ Development environment stopped!"
echo ""
echo "To restart: ./setup-local-dev.sh"