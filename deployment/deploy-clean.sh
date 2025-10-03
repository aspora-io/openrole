#!/bin/bash

echo "🚀 OpenRole Clean Deployment Script"
echo "==================================="

SERVER="145.223.75.73"
USER="hyperdude"

# Create deployment script that will run on server
cat > /tmp/openrole-clean-deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

echo "📦 Starting clean OpenRole deployment..."

# Stop and remove ALL old containers
docker stop $(docker ps -aq --filter "name=openrole") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=openrole") 2>/dev/null || true
docker stop nginx 2>/dev/null || true
docker rm nginx 2>/dev/null || true

# Create fresh deployment directory
cd ~
rm -rf openrole-production
mkdir -p openrole-production
cd openrole-production

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/aspora-io/openrole.git .

# Create a standalone docker-compose.yml without workspace dependencies
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Frontend - Next.js app
  openrole-web:
    image: node:18-alpine
    container_name: openrole-web
    working_dir: /app
    volumes:
      - ./apps/web:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://openrole-api:3001
    command: |
      sh -c "
        echo 'Installing dependencies...' &&
        npm install --force --legacy-peer-deps &&
        echo 'Building application...' &&
        npm run build &&
        echo 'Starting server...' &&
        npm start
      "
    restart: unless-stopped
    networks:
      - openrole

  # API Backend
  openrole-api:
    image: node:18-alpine
    container_name: openrole-api
    working_dir: /app
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://openrole:openrole2024@openrole-db:5432/openrole
      - REDIS_URL=redis://openrole-redis:6379
      - JWT_SECRET=change-this-secret-in-production-$(openssl rand -hex 32)
    command: |
      sh -c "
        echo 'Installing API dependencies...' &&
        npm install --force --legacy-peer-deps &&
        echo 'Starting API server...' &&
        npm start
      "
    depends_on:
      - openrole-db
      - openrole-redis
    restart: unless-stopped
    networks:
      - openrole

  # Database
  openrole-db:
    image: postgres:15-alpine
    container_name: openrole-db
    environment:
      - POSTGRES_USER=openrole
      - POSTGRES_PASSWORD=openrole2024
      - POSTGRES_DB=openrole
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - openrole

  # Redis Cache
  openrole-redis:
    image: redis:7-alpine
    container_name: openrole-redis
    restart: unless-stopped
    networks:
      - openrole

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - openrole-web
      - openrole-api
    restart: unless-stopped
    networks:
      - openrole

networks:
  openrole:
    driver: bridge

volumes:
  postgres_data:
EOF

# Create Nginx configuration
cat > nginx.conf << 'NGINX'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    upstream frontend {
        server openrole-web:3000;
    }

    upstream backend {
        server openrole-api:3001;
    }

    server {
        listen 80;
        server_name _;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        # API routes
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Next.js specific routes
        location /_next {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
NGINX

# Remove workspace dependencies from package.json files
echo "🔧 Fixing workspace dependencies..."
find ./apps -name "package.json" -exec sed -i 's/"@openrole\/[^"]*": "workspace:\*"//g' {} \;
find ./apps -name "package.json" -exec sed -i '/^\s*,\s*$/d' {} \;
find ./apps -name "package.json" -exec sed -i 's/,\s*}/}/g' {} \;

# Start all services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to initialize
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."
sleep 30

# Check container status
echo "📊 Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|openrole|nginx)"

# Test the deployment
echo ""
echo "🧪 Testing deployment..."
sleep 10

# Check if frontend is responding
echo -n "Frontend status: "
curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "Not ready yet"

echo -n "API status: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "Not ready yet"

echo ""
echo "📝 Checking logs for any issues..."
docker logs openrole-web --tail 10
echo "---"
docker logs openrole-api --tail 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your OpenRole platform should be accessible at:"
echo "   - http://$SERVER"
echo "   - https://openrole.net (if DNS is configured)"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker logs openrole-web -f"
echo "   - Restart: docker-compose restart"
echo "   - Stop: docker-compose down"
echo ""
echo "⚠️  If the site isn't loading yet, wait another minute for Next.js to build."

DEPLOY_SCRIPT

# Copy and execute deployment script
echo "📤 Deploying to server..."
scp /tmp/openrole-clean-deploy.sh $USER@$SERVER:~/deploy-openrole.sh
ssh $USER@$SERVER "chmod +x ~/deploy-openrole.sh && ~/deploy-openrole.sh"

# Cleanup
rm -f /tmp/openrole-clean-deploy.sh

echo "
🎉 Deployment initiated!
Check your site at: http://$SERVER or https://openrole.net
"