#!/bin/bash

# Quick deployment script to fix the current deployment
# Run this directly on the production server

echo "🔧 Quick fix deployment for OpenRole.net..."

# Stop all OpenRole containers
echo "Stopping all OpenRole containers..."
docker stop $(docker ps -q --filter "name=openrole") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=openrole") 2>/dev/null || true

# Ensure network exists
docker network create traefik 2>/dev/null || echo "Traefik network exists"

# Go to current deployment
cd ~/apps/openrole-production/current

# Start with simple naming
echo "Starting containers with simple names..."
docker-compose -f docker-compose.traefik.yml down 2>/dev/null || true
docker-compose -f docker-compose.traefik.yml up -d --build

# Wait and check
sleep 15
echo ""
echo "📊 Container status:"
docker ps | grep -E "openrole|current"

echo ""
echo "🔗 Testing connection..."
docker logs current_openrole-web_1 --tail 5 2>/dev/null || echo "Web container not found"
docker logs current_openrole-api_1 --tail 5 2>/dev/null || echo "API container not found"

echo ""
echo "✅ Quick deployment complete!"
echo "Check https://openrole.net in a few minutes"