#!/bin/bash

# Deploy integrated API on port 3002
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

echo "🚀 Deploying OpenRole Integrated API..."

# Copy API server file
scp api-server.js $SERVER_USER@$SERVER_IP:~/openrole-api-integrated/

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~

# Create API directory
mkdir -p openrole-api-integrated
cd openrole-api-integrated

# Create package.json
cat > package.json << 'PACKAGE'
{
  "name": "openrole-api-integrated",
  "version": "1.0.0",
  "main": "api-server.js",
  "scripts": {
    "start": "node api-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
PACKAGE

# Create Dockerfile
cat > Dockerfile << 'DOCKER'
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY api-server.js .
EXPOSE 3002
CMD ["npm", "start"]
DOCKER

# Create docker-compose
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  api:
    build: .
    container_name: openrole-api-integrated
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.openrole-api.rule=Host(`api.openrole.net`)"
      - "traefik.http.routers.openrole-api.entrypoints=websecure"
      - "traefik.http.routers.openrole-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.openrole-api.loadbalancer.server.port=3002"

networks:
  traefik:
    external: true
COMPOSE

# Stop any existing API on 3002
docker stop openrole-api-integrated 2>/dev/null || true
docker rm openrole-api-integrated 2>/dev/null || true

# Build and start
echo "🚀 Building and starting API..."
docker-compose up -d --build

# Connect to traefik
docker network connect traefik openrole-api-integrated 2>/dev/null || true

# Wait and test
echo "⏳ Waiting for API to start..."
sleep 5

echo "🧪 Testing API endpoints..."
echo "Health check:"
curl -s http://localhost:3002/health | python3 -m json.tool || echo "Failed"

echo ""
echo "Jobs endpoint:"
curl -s http://localhost:3002/api/jobs | python3 -m json.tool | head -10 || echo "Failed"

echo ""
echo "✅ API deployment complete!"
echo "API available at:"
echo "  - http://$HOSTNAME:3002"
echo "  - https://api.openrole.net (via Traefik)"
EOF

echo "🎉 Deployment finished!"