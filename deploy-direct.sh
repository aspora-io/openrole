#!/bin/bash

echo "🚀 Direct OpenRole Deployment"
echo "============================"

# Configuration
SERVER="86.159.155.227"
SERVER_USER="root"

# Create a deployment script that will run on the server
cat > /tmp/openrole-deploy-remote.sh << 'REMOTE_SCRIPT'
#!/bin/bash

echo "📦 Starting OpenRole deployment on server..."

# Navigate to deployment directory
cd /opt
rm -rf openrole-temp
mkdir -p openrole-temp
cd openrole-temp

echo "📥 Cloning repository..."
git clone https://github.com/aspora-io/openrole.git .

echo "🛑 Stopping old containers..."
docker stop openrole-web openrole-api openrole-db openrole-redis nginx 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis nginx 2>/dev/null || true
docker network rm openrole 2>/dev/null || true

echo "🔨 Building and starting services..."
docker-compose -f docker-compose.simple.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 20

echo "✅ Checking container status..."
docker ps | grep -E "(openrole|nginx)"

echo ""
echo "🎉 Deployment complete!"
echo "📍 Your site is now available at:"
echo "   - http://86.159.155.227"
echo "   - https://openrole.net (if DNS configured)"

# Test the services
echo ""
echo "🔍 Testing services..."
echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost
echo ""
echo -n "API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health
echo ""

REMOTE_SCRIPT

# Try to deploy via SSH
echo "Attempting deployment to $SERVER..."

# Check if we can connect
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER" "echo 'Connected'" 2>/dev/null; then
    echo "✅ SSH connection successful"
    
    # Copy and execute the script
    scp /tmp/openrole-deploy-remote.sh "$SERVER_USER@$SERVER:/tmp/"
    ssh "$SERVER_USER@$SERVER" "chmod +x /tmp/openrole-deploy-remote.sh && /tmp/openrole-deploy-remote.sh"
    
else
    echo "❌ Cannot connect via SSH automatically."
    echo ""
    echo "📋 Please run these commands manually on your server:"
    echo ""
    echo "ssh $SERVER_USER@$SERVER"
    echo ""
    cat /tmp/openrole-deploy-remote.sh
fi

# Cleanup
rm -f /tmp/openrole-deploy-remote.sh