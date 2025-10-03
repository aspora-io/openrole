#!/bin/bash

# Deploy OpenRole API alongside static frontend
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

echo "🚀 Deploying OpenRole API..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~

# Clone fresh copy
echo "📥 Cloning repository..."
rm -rf openrole-api-deploy
git clone https://github.com/aspora-io/openrole.git openrole-api-deploy
cd openrole-api-deploy

# Create production docker-compose for API only
cat > docker-compose-api.yml << 'COMPOSE'
version: '3.8'

services:
  openrole-api:
    build:
      context: .
      dockerfile: ./apps/api/Dockerfile
    container_name: openrole-api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@openrole-db:5432/openrole
      - REDIS_URL=redis://openrole-redis:6379
      - JWT_SECRET=production-secret-change-me
    depends_on:
      - openrole-db
      - openrole-redis
    restart: unless-stopped
    networks:
      - openrole-net

  openrole-db:
    image: postgres:16-alpine
    container_name: openrole-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=openrole
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - openrole-net

  openrole-redis:
    image: redis:7-alpine
    container_name: openrole-redis
    restart: unless-stopped
    networks:
      - openrole-net

networks:
  openrole-net:
    driver: bridge

volumes:
  postgres-data:
COMPOSE

# Start API services
echo "🚀 Starting API services..."
docker-compose -f docker-compose-api.yml up -d --build

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "📊 Service status:"
docker ps | grep openrole

# Test API
echo ""
echo "🧪 Testing API..."
curl -s -o /dev/null -w "API Status: %{http_code}\n" http://localhost:3001/health || echo "API Status: Not ready"

echo ""
echo "✅ API deployment complete!"
echo "API available at: http://$SERVER_IP:3001"
EOF

echo "🎉 API deployment finished!"