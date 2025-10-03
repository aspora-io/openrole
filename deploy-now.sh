#!/bin/bash

# Quick deployment script for OpenRole CV & Profile Tools
# Run this with: bash deploy-now.sh

echo "🚀 OpenRole CV & Profile Tools - Quick Deploy"
echo ""

# Check if ssh is available
if ! command -v ssh &> /dev/null; then
    echo "❌ SSH not available"
    exit 1
fi

echo "Connecting to server..."
ssh hyperdude@145.223.75.73 << 'DEPLOY'
echo "🔧 Starting deployment on server..."

# Navigate to deployment directory
mkdir -p ~/apps/openrole-production
cd ~/apps/openrole-production

# Clone or update repository
if [ -d "openrole" ]; then
    echo "📦 Updating existing repository..."
    cd openrole
    git fetch origin
    git checkout master
    git pull origin master
else
    echo "📦 Cloning repository..."
    git clone https://github.com/aspora-io/openrole.git openrole
    cd openrole
    git checkout master
fi

# Create production environment file
echo "⚙️ Creating environment configuration..."
echo "NODE_ENV=production" > .env.production
echo "NEXT_PUBLIC_API_URL=https://api.openrole.net" >> .env.production
echo "API_URL=https://api.openrole.net" >> .env.production
echo "DATABASE_URL=postgresql://openrole:openrole2024@openrole-db:5432/openrole" >> .env.production
echo "REDIS_URL=redis://openrole-redis:6379" >> .env.production

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker stop openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true

# Deploy with appropriate compose file
echo "🐳 Starting new containers..."
if [ -f docker-compose.production.yml ]; then
    echo "Using production compose file..."
    docker-compose -f docker-compose.production.yml up -d --build
else
    echo "Using traefik compose file..."
    docker-compose -f docker-compose.traefik.yml up -d --build
fi

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 25

# Check status
echo "📊 Container status:"
docker ps | grep openrole || echo "No OpenRole containers running"

echo ""
echo "🔍 Health checks:"
echo -n "OpenRole.net: "
curl -s -o /dev/null -w "%{http_code}" https://openrole.net 2>/dev/null || echo "DOWN"
echo ""
echo -n "API Health: "
curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/health 2>/dev/null || echo "DOWN"
echo ""
echo -n "CV & Profile Tools: "
curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/api/profile/health 2>/dev/null || echo "DOWN"
echo ""

echo ""
echo "✅ Deployment completed!"
echo "🌐 Access: https://openrole.net"
echo "📋 API: https://api.openrole.net"
echo "🛠️ CV Tools: https://api.openrole.net/api/profile/health"
DEPLOY

echo ""
echo "✅ CV & Profile Tools deployment finished!"
echo "Visit https://openrole.net to see the results"