#\!/bin/bash

echo "🚀 OpenRole Quick Deployment"
echo "==========================="
echo ""
echo "Choose deployment method:"
echo "1. Local deployment (this machine)"
echo "2. Manual deployment instructions for production"
echo ""

# For local deployment
if [ "$1" == "local" ] || [ "$1" == "1" ]; then
    echo "Starting local deployment..."
    docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
    docker-compose -f docker-compose.simple.yml up -d --build
    echo ""
    echo "✅ Local deployment complete\!"
    echo "Access at: http://localhost"
    exit 0
fi

# Production deployment instructions
echo "📋 Manual Deployment Instructions for Production Server:"
echo "======================================================="
echo ""
echo "1. SSH into your server:"
echo "   ssh root@86.159.155.227"
echo ""
echo "2. Run these commands:"
cat << 'COMMANDS'

# Create deployment directory
mkdir -p /opt/openrole && cd /opt/openrole

# Clone repository
if [ -d "repo" ]; then
    cd repo
    git pull origin master
else
    git clone https://github.com/aspora-io/openrole.git repo
    cd repo
fi

# Stop existing containers
docker stop $(docker ps -aq --filter "name=openrole") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=openrole") 2>/dev/null || true

# Deploy with simple configuration
docker-compose -f docker-compose.simple.yml up -d --build

# Wait for services
sleep 15

# Check status
echo "Container status:"
docker ps  < /dev/null |  grep openrole

echo ""
echo "✅ Deployment complete!"
echo "Access your site at: http://86.159.155.227"

COMMANDS

echo ""
echo "3. To set up HTTPS (optional):"
echo "   - Configure your existing Traefik to proxy to port 80"
echo "   - Or set up Nginx with SSL certificates"
echo ""
echo "🎉 Your OpenRole frontend is ready to deploy!"
