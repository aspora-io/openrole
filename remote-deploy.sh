#!/bin/bash

# Remote Deployment Script for OpenRole
# This script should be run on your local machine to deploy to production

echo "🚀 OpenRole Remote Deployment"
echo "============================="
echo ""

# Configuration
REMOTE_USER="your-username"  # Update this with your server username
REMOTE_HOST="86.159.155.227"
REMOTE_PATH="~/apps/openrole-production"

echo "📋 Deployment Configuration:"
echo "- Server: $REMOTE_HOST"
echo "- User: $REMOTE_USER"
echo "- Path: $REMOTE_PATH"
echo ""

# Check if we can connect to the server
echo "🔐 Testing SSH connection..."
ssh -o ConnectTimeout=5 $REMOTE_USER@$REMOTE_HOST "echo '✅ SSH connection successful'" || {
    echo "❌ Cannot connect to server. Please check:"
    echo "   1. Username is correct: $REMOTE_USER"
    echo "   2. You have SSH access to: $REMOTE_HOST"
    echo "   3. Your SSH key is configured"
    exit 1
}

echo ""
echo "📦 Creating deployment package..."

# Create a deployment archive with necessary files
rm -rf deploy-package
mkdir -p deploy-package

# Copy essential files
cp -r apps deploy-package/
cp -r packages deploy-package/ 2>/dev/null || echo "No packages directory"
cp docker-compose.simple.yml deploy-package/
cp nginx-simple.conf deploy-package/
cp package.json deploy-package/
cp turbo.json deploy-package/ 2>/dev/null || echo "No turbo.json"

# Create deployment info
cat > deploy-package/DEPLOY_INFO.txt << EOF
OpenRole Deployment
==================
Date: $(date)
Branch: master
Type: Full Frontend + API

Features Included:
- Complete React/Next.js frontend
- Authentication system (login/register)
- Job search interface
- User dashboards
- API backend
EOF

# Create the archive
tar czf openrole-deploy.tar.gz deploy-package/

echo "✅ Deployment package created"
echo ""
echo "📤 Uploading to server..."

# Upload the package
scp openrole-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/ || {
    echo "❌ Failed to upload deployment package"
    exit 1
}

echo ""
echo "🚀 Executing deployment on server..."

# Execute deployment on the server
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
echo "📁 Setting up deployment directory..."
mkdir -p ~/apps/openrole-production
cd ~/apps/openrole-production

echo "📦 Extracting deployment package..."
tar xzf /tmp/openrole-deploy.tar.gz
cd deploy-package

echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed on the server"
    exit 1
fi

echo "🛑 Stopping existing containers..."
docker stop openrole-web openrole-api openrole-db openrole-redis openrole-nginx 2>/dev/null || true
docker rm openrole-web openrole-api openrole-db openrole-redis openrole-nginx 2>/dev/null || true

echo "🔨 Building and starting new containers..."
docker-compose -f docker-compose.simple.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 15

echo "📊 Container status:"
docker ps | grep openrole

echo "✅ Deployment complete on server!"
ENDSSH

# Cleanup
rm -rf deploy-package openrole-deploy.tar.gz

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "🌐 Your OpenRole platform should now be accessible at:"
echo "   - http://$REMOTE_HOST"
echo "   - https://openrole.net (if DNS is configured)"
echo ""
echo "📋 To verify deployment:"
echo "   1. Visit the website"
echo "   2. Try registering a new account"
echo "   3. Search for jobs"
echo "   4. Check the API: http://$REMOTE_HOST:3001/health"
echo ""
echo "🔍 To check logs on the server:"
echo "   ssh $REMOTE_USER@$REMOTE_HOST"
echo "   docker logs openrole-web"
echo "   docker logs openrole-api"