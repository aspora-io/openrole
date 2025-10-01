#!/bin/bash

echo "🚀 Deploying OpenRole from GHCR"
echo "==============================="

SERVER="86.159.155.227"
USER="hyperdude"

cat << 'DEPLOY_SCRIPT' > /tmp/ghcr-deploy.sh
#!/bin/bash

cd /opt
mkdir -p openrole && cd openrole

# Stop existing containers
docker-compose down 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=openrole") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=openrole") 2>/dev/null || true

# Create docker-compose for GHCR images
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: ghcr.io/aspora-io/openrole-web:latest
    container_name: openrole-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3001
    depends_on:
      - api

  api:
    image: ghcr.io/aspora-io/openrole-api:latest
    container_name: openrole-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://openrole:openrole2024@db:5432/openrole
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    container_name: openrole-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=openrole
      - POSTGRES_PASSWORD=openrole2024
      - POSTGRES_DB=openrole
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: openrole-redis
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: openrole-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - web
      - api

volumes:
  postgres_data:
EOF

# Create nginx config
cat > nginx.conf << 'NGINX'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server web:3000;
    }

    upstream backend {
        server api:3001;
    }

    server {
        listen 80;
        server_name openrole.net;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
NGINX

# Pull latest images
echo "📥 Pulling latest images from GHCR..."
docker pull ghcr.io/aspora-io/openrole-web:latest
docker pull ghcr.io/aspora-io/openrole-api:latest

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services
sleep 15

# Check status
echo "✅ Deployment complete!"
docker ps | grep openrole

echo ""
echo "🌐 Access your site at:"
echo "   - http://86.159.155.227"
echo "   - https://openrole.net"
DEPLOY_SCRIPT

echo "📋 Deployment command:"
echo ""
echo "ssh $USER@$SERVER 'bash -s' < /tmp/ghcr-deploy.sh"
echo ""
echo "Or manually:"
echo "1. ssh $USER@$SERVER"
echo "2. Copy and run the script above"