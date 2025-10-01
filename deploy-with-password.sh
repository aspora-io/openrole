#!/bin/bash

# Deploy OpenRole CV & Profile Tools using password authentication
# This script uses sshpass for password authentication

echo "🚀 Deploying OpenRole CV & Profile Tools..."

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass 2>/dev/null || {
        echo "❌ sshpass not available. Please install it or use manual deployment."
        echo "Manual deployment: ssh hyperdude@145.223.75.73 and run the deployment commands"
        exit 1
    }
fi

# Server details
SERVER="hyperdude@145.223.75.73"
PASSWORD="Bemindful11%"

echo "📡 Connecting to server and deploying..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'DEPLOY_EOF'
echo "🔧 Starting OpenRole deployment on server..."

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
cat > .env.production << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.openrole.net
API_URL=https://api.openrole.net
DATABASE_URL=postgresql://openrole:openrole2024@openrole-db:5432/openrole
REDIS_URL=redis://openrole-redis:6379
ENVEOF

# Check current services
echo "🔍 Checking current Docker services..."
docker ps | grep -E "(promptcade|openrole|traefik)" || echo "No relevant containers running"

# Stop existing OpenRole containers only
echo "🛑 Stopping existing OpenRole containers..."
docker stop openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true

# Deploy with appropriate compose file
echo "🐳 Starting new containers..."
if [ -f docker-compose.production.yml ]; then
    echo "Using production compose file with full stack..."
    docker-compose -f docker-compose.production.yml up -d --build
else
    echo "Using traefik compose file..."
    docker-compose -f docker-compose.traefik.yml up -d --build
fi

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 30

# Check status
echo "📊 Container status:"
docker ps | grep openrole || echo "⚠️  No OpenRole containers running"

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

# Check if Promptcade is still working
echo -n "Promptcade.com: "
curl -s -o /dev/null -w "%{http_code}" https://promptcade.com 2>/dev/null || echo "DOWN"
echo ""

echo ""
echo "✅ Deployment completed!"
echo "🌐 Access: https://openrole.net"
echo "📋 API: https://api.openrole.net"
echo "🛠️ CV Tools: https://api.openrole.net/api/profile/health"

# Show container logs if there are issues
if ! docker ps | grep openrole > /dev/null; then
    echo ""
    echo "⚠️  Containers not running. Checking logs..."
    docker logs openrole-web --tail 20 2>/dev/null || echo "No web container logs"
    docker logs openrole-api --tail 20 2>/dev/null || echo "No API container logs"
fi
DEPLOY_EOF

echo ""
echo "✅ CV & Profile Tools deployment finished!"
echo "🌐 Visit https://openrole.net to see the results"
echo "📋 CV & Profile Tools: https://api.openrole.net/api/profile/health"