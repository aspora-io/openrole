#!/bin/bash

echo "🚀 OpenRole Simple Deployment Script"
echo "===================================="
echo ""
echo "This script will deploy OpenRole using simplified Docker configuration"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Stop any existing OpenRole containers
echo "🛑 Stopping any existing OpenRole containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker stop openrole-web openrole-api openrole-db openrole-redis openrole-nginx 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis openrole-nginx 2>/dev/null || true

echo ""
echo "🔨 Building and starting containers..."
echo ""

# Build and start with the simple configuration
docker-compose -f docker-compose.simple.yml up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

# Check container status
echo ""
echo "📊 Container Status:"
docker ps | grep openrole || echo "⚠️  No OpenRole containers found running"

echo ""
echo "🔍 Checking service health..."
echo ""

# Check if services are responding
echo -n "Frontend (port 3000): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "❌ Not responding"
echo ""

echo -n "API (port 3001): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "❌ Not responding"
echo ""

echo -n "Nginx (port 80): "
curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "❌ Not responding"
echo ""

echo ""
echo "📝 Deployment Summary:"
echo "====================="
echo "✅ Containers have been started"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000 (or http://YOUR_SERVER_IP:3000)"
echo "- API: http://localhost:3001/health (or http://YOUR_SERVER_IP:3001/health)"
echo "- Main site: http://localhost (or http://YOUR_SERVER_IP)"
echo ""
echo "📋 Next Steps:"
echo "1. Check container logs if services aren't responding:"
echo "   docker logs openrole-web"
echo "   docker logs openrole-api"
echo ""
echo "2. For production with HTTPS, update your reverse proxy configuration"
echo ""
echo "3. To stop all services:"
echo "   docker-compose -f docker-compose.simple.yml down"
echo ""
echo "🎉 Deployment script complete!"