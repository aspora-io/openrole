#!/bin/bash

# Comprehensive restoration script for both Promptcade and OpenRole
echo "🔧 Restoring all services on server..."

SERVER="hyperdude@145.223.75.73"
PASSWORD="Bemindful11%"

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "sshpass is required but not installed. Please install it first."
    exit 1
fi

echo "📡 Connecting to server to restore services..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'RESTORE_EOF'
echo "🔧 Starting comprehensive service restoration..."

# Check current status
echo "📊 Current Docker status:"
docker ps -a | head -10

echo ""
echo "🔍 Checking Traefik network:"
docker network inspect traefik > /dev/null 2>&1 || {
    echo "❌ Traefik network not found. Creating..."
    docker network create traefik
}

echo ""
echo "🚀 Step 1: Restore Promptcade"
# Navigate to Promptcade directory (try multiple possible locations)
PROMPTCADE_DIR=""
for dir in ~/hostingervps/promptcade/site ~/apps/promptcade ~/promptcade; do
    if [ -d "$dir" ]; then
        PROMPTCADE_DIR="$dir"
        break
    fi
done

if [ -n "$PROMPTCADE_DIR" ]; then
    echo "📦 Found Promptcade at: $PROMPTCADE_DIR"
    cd "$PROMPTCADE_DIR"
    
    # Start Promptcade containers
    if [ -f docker-compose.yml ]; then
        echo "🐳 Starting Promptcade containers..."
        docker-compose up -d
    elif [ -f docker-compose.yaml ]; then
        docker-compose -f docker-compose.yaml up -d
    else
        echo "⚠️  No docker-compose file found in Promptcade directory"
    fi
else
    echo "⚠️  Promptcade directory not found"
fi

echo ""
echo "🚀 Step 2: Deploy OpenRole"
# Ensure deployment directory exists
mkdir -p ~/apps/openrole-production
cd ~/apps/openrole-production

# Remove any failed clones
rm -rf openrole

# Clone repository
echo "📦 Cloning OpenRole repository..."
git clone https://github.com/aspora-io/openrole.git openrole
cd openrole
git checkout master

# Create environment file
echo "⚙️ Creating OpenRole environment..."
cat > .env.production << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.openrole.net
API_URL=https://api.openrole.net
DATABASE_URL=postgresql://openrole:openrole2024@openrole-db:5432/openrole
REDIS_URL=redis://openrole-redis:6379
ENVEOF

# Stop any existing OpenRole containers
echo "🛑 Cleaning up existing OpenRole containers..."
docker stop openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis 2>/dev/null || true

# Start OpenRole containers
echo "🐳 Starting OpenRole containers..."
if [ -f docker-compose.production.yml ]; then
    echo "Using production compose file..."
    docker-compose -f docker-compose.production.yml up -d --build
elif [ -f docker-compose.traefik.yml ]; then
    echo "Using traefik compose file..."
    docker-compose -f docker-compose.traefik.yml up -d --build
else
    echo "❌ No suitable docker-compose file found"
    ls -la docker-compose*
    exit 1
fi

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 45

echo ""
echo "📊 Final status check:"
docker ps | grep -E "(promptcade|openrole|traefik)" || echo "No containers running"

echo ""
echo "🔍 Service health checks:"

echo -n "Traefik Dashboard: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null || echo "DOWN"
echo ""

echo -n "Promptcade.com: "
curl -s -o /dev/null -w "%{http_code}" https://promptcade.com 2>/dev/null || echo "DOWN"
echo ""

echo -n "OpenRole.net: "
curl -s -o /dev/null -w "%{http_code}" https://openrole.net 2>/dev/null || echo "DOWN"
echo ""

echo -n "OpenRole API: "
curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/health 2>/dev/null || echo "DOWN"
echo ""

echo -n "CV & Profile Tools: "
curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/api/profile/health 2>/dev/null || echo "DOWN"
echo ""

# Show container logs if there are issues
echo ""
echo "📋 Recent container logs:"
echo "=== OpenRole Web ==="
docker logs openrole-web --tail 10 2>/dev/null || echo "No logs available"
echo "=== OpenRole API ==="
docker logs openrole-api --tail 10 2>/dev/null || echo "No logs available"

echo ""
echo "✅ Service restoration completed!"
echo "🌐 OpenRole: https://openrole.net"
echo "🎮 Promptcade: https://promptcade.com"
echo "🔧 Traefik: http://dashboard.example.com (if configured)"
RESTORE_EOF

echo ""
echo "✅ Service restoration script completed!"
echo ""
echo "🌐 Test the services:"
echo "- OpenRole: https://openrole.net"
echo "- Promptcade: https://promptcade.com"
echo "- CV & Profile Tools: https://api.openrole.net/api/profile/health"