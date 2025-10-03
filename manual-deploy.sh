#!/bin/bash

# Manual deployment script for OpenRole.net
# Run this on the production server directly

set -e

echo "🚀 Deploying OpenRole.net manually..."

# Configuration
DEPLOY_DIR="$HOME/apps/openrole-production"
RELEASE_DIR="release-$(date +%Y%m%d-%H%M%S)"

# Create directories
mkdir -p $DEPLOY_DIR/{releases,logs}
cd $DEPLOY_DIR

# Clone the repository
echo "📦 Cloning repository..."
git clone https://github.com/aspora-io/openrole.git releases/$RELEASE_DIR || {
    echo "❌ Failed to clone repository"
    exit 1
}

cd releases/$RELEASE_DIR

# Checkout the correct branch
git checkout master

# Copy the fixed Dockerfiles if needed
echo "🔧 Preparing Docker configuration..."

# Create .env file for production
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.openrole.net
API_URL=https://api.openrole.net
EOF

# Build and start containers
echo "🐳 Building and starting containers..."
docker-compose -f docker-compose.traefik.yml up -d --build

# Update symlink
cd $DEPLOY_DIR
rm -f current
ln -sf releases/$RELEASE_DIR current

echo "✅ Deployment complete!"
echo ""
echo "Check status with:"
echo "  docker ps | grep openrole"
echo "  docker logs openrole-web"
echo "  docker logs openrole-api"
echo ""
echo "The site should be available at:"
echo "  https://openrole.net"
echo "  https://api.openrole.net"