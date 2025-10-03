#!/bin/bash

# Redeploy static site
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

echo "🚀 Redeploying OpenRole static site..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~

# Create deployment directory
mkdir -p openrole-static-deploy
cd openrole-static-deploy

# Copy static files from repo
echo "📦 Copying static files..."
cp -r ~/openrole-api-deploy/deployment/* . 2>/dev/null || echo "Using existing files"

# Create docker-compose for static site
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: openrole-static
    ports:
      - "8081:80"
    volumes:
      - ./:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.openrole.rule=Host(`openrole.net`)"
      - "traefik.http.routers.openrole.entrypoints=websecure"
      - "traefik.http.routers.openrole.tls.certresolver=letsencrypt"
      - "traefik.http.services.openrole.loadbalancer.server.port=80"

networks:
  traefik:
    external: true
COMPOSE

# Start the container
echo "🚀 Starting nginx container..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# Connect to traefik network
echo "🔗 Connecting to traefik network..."
docker network connect traefik openrole-static 2>/dev/null || true

# Test
echo "🧪 Testing deployment..."
sleep 3
curl -s -o /dev/null -w "Local test: %{http_code}\n" http://localhost:8081
curl -s -o /dev/null -w "Domain test: %{http_code}\n" https://openrole.net

echo ""
echo "✅ Static site redeployed!"
echo "Site available at: https://openrole.net"
EOF

echo "🎉 Deployment finished!"